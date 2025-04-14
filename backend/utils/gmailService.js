import { analyzeText, analyzeTextWithModel } from "./nlpAnalyzer.js";
import { google } from "googleapis";
import pLimit from "p-limit"; // For concurrency limiting

const ALL_THREADS_CACHE_KEY = "all-threads";
const THREAD_DETAILS_CACHE_KEY = "thread-details";
const CACHE_TTL = 3600; // Increase to 1 hour
const THREAD_LIST_CACHE_KEY = "thread-list";
const SEARCH_RESULTS_CACHE_KEY = "search-results";

// Limit Gmail API requests (adjust as needed)
const gmailApiLimit = pLimit(10);

export const getUserCacheKey = (firebaseUid, params) => {
  return `user:${firebaseUid}:search:${JSON.stringify(params)}`;
};

export function decodeMessageBody(payload) {
  let body = "";

  if (payload.body.data) {
    body = Buffer.from(payload.body.data, "base64").toString();
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
        body = Buffer.from(part.body.data, "base64").toString();
        break;
      }
    }
  }

  // Clean the body content
  if (body) {
    // Remove HTML quoted content (common in email clients)
    body = body.replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, "");

    // Remove div.gmail_quote (Gmail's quote container)
    body = body.replace(/<div class="gmail_quote"[\s\S]*?<\/div>/gi, "");

    // Remove outlook style quotes
    body = body.replace(
      /<div style="border:none;border-top:solid #[A-Z0-9]{6}[\s\S]*?<\/div>/gi,
      ""
    );

    // Remove lines starting with ">" (plain text quotes)
    body = body
      .split("\n")
      .filter((line) => !line.trim().startsWith(">"))
      .join("\n");

    // Remove "On [date] [name] wrote:" patterns
    body = body.replace(/On [A-Za-z0-9, :/<>@\-\.]+ wrote:[\s\S]*$/gm, "");

    // Clean up any remaining HTML
    body = body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script tags
      .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
      .trim();
  }

  return body || "";
}

export async function getPageToken(gmail, targetPage, pageSize) {
  if (targetPage <= 1) return null;

  let currentPage = 1;
  let nextPageToken = null;

  while (currentPage < targetPage) {
    const response = await gmail.users.threads.list({
      userId: "me",
      maxResults: pageSize,
      pageToken: nextPageToken,
    });
    nextPageToken = response.data.nextPageToken;
    if (!nextPageToken) break;
    currentPage++;
  }

  return nextPageToken;
}

export async function getAllThreads(gmail, firebaseUid, limit = null, redis) {
  const cacheKey = getUserCacheKey(ALL_THREADS_CACHE_KEY, firebaseUid);
  const cachedThreads = await redis.get(cacheKey);
  let threads = cachedThreads ? JSON.parse(cachedThreads) : [];

  if (cachedThreads) {
    console.log("📧 Retrieved threads from Redis cache");
  }

  if (limit && threads.length < limit) {
    console.log("🌐 Fetching additional threads from Gmail API");
    let pageToken = null;
    try {
      do {
        const response = await gmail.users.threads.list({
          userId: "me",
          maxResults: 500,
          pageToken,
        });

        if (response.data.threads) {
          const newThreads = response.data.threads.filter(
            (thread) => !threads.some((t) => t.id === thread.id)
          );
          threads = [...threads, ...newThreads];
          console.log(
            `Fetched ${newThreads.length} new threads. Total: ${threads.length}`
          );
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken && threads.length < limit);

      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(threads));
    } catch (error) {
      console.error("Error fetching threads:", error);
      console.log("Returning partial results:", threads.length);
    }
  }
  return limit ? threads.slice(0, limit) : threads;
}

export async function getThreadDetails(gmail, threadIds, firebaseUid, redis) {
  const cacheKey = getUserCacheKey(THREAD_DETAILS_CACHE_KEY, firebaseUid);
  const cachedDetailsStr = await redis.get(cacheKey);
  const cachedDetails = cachedDetailsStr ? JSON.parse(cachedDetailsStr) : {};
  const uncachedThreadIds = threadIds.filter((id) => !cachedDetails[id]);

  if (cachedDetailsStr) {
    console.log(
      `📧 Retrieved ${
        threadIds.length - uncachedThreadIds.length
      } thread details from Redis cache`
    );
  }

  // Get the user's classifier model from the database
  const User = (await import("../Models/User.js")).default;
  const user = await User.findOne({ firebaseUid });
  const userClassifierModel = user?.classifierModel || null;

  if (uncachedThreadIds.length > 0) {
    console.log(
      `🌐 Fetching ${uncachedThreadIds.length} thread details from Gmail API`
    );
    const newDetails = await Promise.all(
      uncachedThreadIds.map(async (threadId) => {
        try {
          const threadData = await gmail.users.threads.get({
            userId: "me",
            id: threadId,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });
          const messages = threadData.data.messages;
          const latestMessage = messages[messages.length - 1];
          const headers = latestMessage.payload.headers;

          // Use user's model if available, otherwise use default
          const analysis = userClassifierModel
            ? await analyzeTextWithModel(
                latestMessage.snippet,
                userClassifierModel
              )
            : await analyzeText(latestMessage.snippet);

          return {
            threadId,
            details: {
              messageCount: messages.length,
              subject:
                headers.find((h) => h.name === "Subject")?.value ||
                "No Subject",
              from: headers.find((h) => h.name === "From")?.value || "",
              date: headers.find((h) => h.name === "Date")?.value || "",
              snippet: latestMessage.snippet,
              isThread: messages.length > 1,
              sentiment: analysis.sentiment,
              sentimentScore: analysis.sentimentScore,
              classification: analysis.classification,
              confidence: analysis.confidence,
            },
          };
        } catch (error) {
          console.error(`Error fetching thread ${threadId}:`, error);
          return { threadId, details: null };
        }
      })
    );

    newDetails.forEach(({ threadId, details }) => {
      if (details) {
        cachedDetails[threadId] = details;
      }
    });
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cachedDetails));
  }

  return threadIds
    .map((id) => ({
      threadId: id,
      ...cachedDetails[id],
    }))
    .filter((thread) => thread.subject);
}

export async function prefetchThreads(
  gmail,
  firebaseUid,
  startIndex,
  endIndex,
  redis
) {
  try {
    const allThreads = await getAllThreads(gmail, firebaseUid, endIndex, redis);
    const threadIdsToFetch = allThreads
      .slice(startIndex, endIndex)
      .map((t) => t.id);
    await getThreadDetails(gmail, threadIdsToFetch, firebaseUid, redis);
  } catch (error) {
    console.error("Error in prefetching:", error);
  }
}

export async function getThreadListWithCache(
  gmail,
  params,
  firebaseUid,
  redis
) {
  const { pageSize, nextPageToken } = params;
  const cacheKey = getUserCacheKey(THREAD_LIST_CACHE_KEY, firebaseUid, {
    pageSize,
    nextPageToken: nextPageToken || "initial",
  });

  // Try to get cached thread list
  const cachedList = await redis.get(cacheKey);
  if (cachedList) {
    console.log("📧 Retrieved thread list from cache");
    return JSON.parse(cachedList);
  }

  // Fetch from Gmail API
  const response = await gmail.users.threads.list({
    userId: "me",
    maxResults: pageSize,
    pageToken: nextPageToken,
  });

  const result = {
    threads: response.data.threads || [],
    nextPageToken: response.data.nextPageToken,
    resultSizeEstimate: response.data.resultSizeEstimate,
  };

  // Cache the results
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
}

export async function getThreadDetailsWithCache(
  gmail,
  threadIds,
  firebaseUid,
  redis
) {
  const results = [];

  // Get the user's classifier model from the database
  const User = (await import("../Models/User.js")).default;
  const user = await User.findOne({ firebaseUid });
  const userClassifierModel = user?.classifierModel || null;

  for (const threadId of threadIds) {
    const cacheKey = getUserCacheKey(THREAD_DETAILS_CACHE_KEY, firebaseUid, {
      threadId,
    });

    // Try to get cached thread details
    const cachedThread = await redis.get(cacheKey);
    if (cachedThread) {
      results.push(JSON.parse(cachedThread));
      continue;
    }

    try {
      const threadData = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const messages = threadData.data.messages;
      const latestMessage = messages[messages.length - 1];
      const headers = latestMessage.payload.headers;

      // Use user's model if available, otherwise use default
      const analysis = userClassifierModel
        ? await analyzeTextWithModel(latestMessage.snippet, userClassifierModel)
        : await analyzeText(latestMessage.snippet);

      const threadDetail = {
        threadId,
        messageCount: messages.length,
        subject:
          headers.find((h) => h.name === "Subject")?.value || "No Subject",
        from: headers.find((h) => h.name === "From")?.value || "",
        date: headers.find((h) => h.name === "Date")?.value || "",
        snippet: latestMessage.snippet,
        isThread: messages.length > 1,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        classification: analysis.classification,
        confidence: analysis.confidence,
      };

      // Cache the thread details
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(threadDetail));
      results.push(threadDetail);
    } catch (error) {
      console.error(`Error fetching thread ${threadId}:`, error);
    }
  }

  return results;
}

export const getSearchResultsWithCache = async (
  gmail,
  { query, pageSize, nextPageToken },
  firebaseUid,
  redis
) => {
  const cacheKey = getUserCacheKey(firebaseUid, {
    query,
    pageSize,
    nextPageToken,
  });

  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    console.log("Cache hit!");
    return JSON.parse(cachedResults);
  }
  console.log("Cache miss. Fetching from Gmail API.");

  try {
    // Use pLimit for rate limiting
    const response = await gmailApiLimit(() =>
      gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: pageSize,
        pageToken: nextPageToken,
        format: "minimal", // Use 'minimal' format
        fields: "nextPageToken,messages(id,threadId,snippet)", // Specify fields
      })
    );

    const emails = response.data.messages || [];
    const newNextPageToken = response.data.nextPageToken;

    // Include the snippet in the results
    const results = {
      emails: emails.map((email) => ({
        id: email.id,
        threadId: email.threadId,
        snippet: email.snippet, // Now includes the snippet
      })),
      nextPageToken: newNextPageToken,
    };

    await redis.set(cacheKey, JSON.stringify(results), "EX", 300); // Cache for 5 minutes
    return results;
  } catch (error) {
    console.error("Error fetching from Gmail API:", error);
    if (error.code === 429) {
      console.warn(`Rate limit exceeded. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getSearchResultsWithCache(
        gmail,
        { query, pageSize, nextPageToken },
        firebaseUid,
        redis
      );
    }
    throw error;
  }
};
