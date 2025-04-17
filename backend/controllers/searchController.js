import { google } from "googleapis";
import {
  getSearchResultsWithCache,
  getThreadDetails,
} from "../utils/gmailService.js";
import redis from "../config/redisClient.js";
import { oauth2Client } from "../routes/authRoutes.js";
import User from "../models/User.js";
import Email from "../models/Email.js";
import {
  analyzeTextWithModel,
  getDefaultClassifierModel,
} from "../utils/nlpAnalyzer.js";

const INITIAL_FETCH_SIZE = 250;

// --- Helper Functions --- //

/**
 * Handles email search when a text query is provided.
 * Searches Gmail, fetches details, applies NLP, filters, and paginates.
 */
async function _handleSearchWithQuery(gmail, user, params) {
  const {
    query,
    filter,
    sentiment,
    page,
    pageSize,
    nextPageToken,
    firebaseUid,
  } = params;
  const gmailQuery = `${query} in:anywhere`;
  console.log(`_handleSearchWithQuery: Gmail query: ${gmailQuery}`);

  const searchResults = await getSearchResultsWithCache(
    gmail,
    {
      query: gmailQuery,
      pageSize: INITIAL_FETCH_SIZE,
      nextPageToken,
    },
    firebaseUid,
    redis
  );

  const newNextPageToken = searchResults.nextPageToken;
  console.log(
    "_handleSearchWithQuery: New next page token from Gmail:",
    newNextPageToken
  );

  const processedThreadIds = new Set(); // Avoid processing duplicates from search results
  const threadDetailsPromises = searchResults.emails
    .filter((email) => {
      if (processedThreadIds.has(email.threadId)) {
        return false;
      }
      processedThreadIds.add(email.threadId);
      return true;
    })
    .map(async (email) => {
      try {
        const threadData = await gmail.users.threads.get({
          userId: "me",
          id: email.threadId,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });

        const messages = threadData.data.messages;
        if (!messages || messages.length === 0) {
          console.warn(`Thread ${email.threadId} has no messages`);
          return null;
        }

        const firstMessage = messages[0];
        const latestMessage = messages[messages.length - 1];
        const headers = latestMessage.payload.headers;
        const originalHeaders = firstMessage.payload.headers;

        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const textToAnalyze = subject + " " + latestMessage.snippet;
        const aiAnalysis = await analyzeTextWithModel(
          textToAnalyze,
          user.classifierModel
        );

        const dateString = headers.find((h) => h.name === "Date")?.value || "";
        const parsedDate = new Date(dateString);

        return {
          threadId: email.threadId,
          messageCount: messages.length,
          subject,
          from: headers.find((h) => h.name === "From")?.value || "",
          originalFrom:
            originalHeaders.find((h) => h.name === "From")?.value || "",
          date: dateString,
          parsedDate: isNaN(parsedDate) ? new Date(0) : parsedDate,
          snippet: latestMessage.snippet,
          classification: aiAnalysis.classification,
          sentiment: aiAnalysis.sentiment,
        };
      } catch (error) {
        console.error(
          `_handleSearchWithQuery: Error fetching details for thread ${email.threadId}:`,
          error
        );
        return null;
      }
    });

  let threadDetails = (await Promise.all(threadDetailsPromises)).filter(
    (detail) => detail !== null
  );

  // --- Post-fetch Filtering (JS-based) ---

  // Validate search term presence
  if (query && query.trim() !== "") {
    const searchTerms = query.toLowerCase().split(/\s+/);
    threadDetails = threadDetails.filter((thread) => {
      const content = (thread.subject + " " + thread.snippet).toLowerCase();
      return searchTerms.some((term) => content.includes(term));
    });
  }

  // Apply classification filter
  if (filter && filter !== "all") {
    threadDetails = threadDetails.filter((email) => {
      // Case-insensitive comparison for JS filtering
      return email.classification?.toLowerCase() === filter.toLowerCase();
    });
  }

  // Apply sentiment filter
  if (sentiment && sentiment !== "all") {
    threadDetails = threadDetails.filter((email) => {
      // Case-insensitive comparison for JS filtering
      return email.sentiment?.toLowerCase() === sentiment.toLowerCase();
    });
  }

  // --- Pagination ---
  threadDetails.sort((a, b) => b.parsedDate - a.parsedDate);

  const totalResults = threadDetails.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmails = threadDetails.slice(startIndex, endIndex);

  // Determine if there are more results based on fetched data and potential next page token
  const hasMore = endIndex < totalResults || !!newNextPageToken;

  return {
    emails: paginatedEmails,
    pagination: {
      page,
      pageSize,
      hasMore,
      totalResults, // Note: This total is for the *filtered* results from the initial fetch batch
      nextPageToken: newNextPageToken, // Pass the token for subsequent fetches
    },
  };
}

/**
 * Builds the MongoDB query for filtering when no text query is provided.
 */
function _buildMongoFilterQuery(userId, filter, sentiment) {
  const mongoQuery = { userId };
  const orConditions = [];

  if (filter && filter !== "all") {
    const filterRegex = new RegExp(`^${filter}$`, "i");
    orConditions.push({ filter: filterRegex });
    orConditions.push({ "AIAnalysis.classification": filterRegex });
  }

  if (sentiment && sentiment !== "all") {
    const sentimentRegex = new RegExp(`^${sentiment}$`, "i");
    orConditions.push({ sentiment: sentimentRegex });
    orConditions.push({ "AIAnalysis.sentiment": sentimentRegex });
  }

  if (orConditions.length === 0) {
    return mongoQuery; // No filters applied
  }

  if (filter && filter !== "all" && sentiment && sentiment !== "all") {
    // Both filters are active, combine with $and
    mongoQuery["$and"] = [
      { $or: orConditions.slice(0, 2) }, // Filter conditions
      { $or: orConditions.slice(2, 4) }, // Sentiment conditions
    ];
  } else {
    // Only one filter type is active
    mongoQuery["$or"] = orConditions;
  }

  return mongoQuery;
}

/**
 * Handles email search when only filters (classification/sentiment) are provided.
 * Queries MongoDB and fetches details for the results.
 */
async function _handleFilterOnlySearch(gmail, user, params) {
  const { filter, sentiment, page, pageSize } = params;
  console.log("_handleFilterOnlySearch: Filtering emails in MongoDB");

  const mongoQuery = _buildMongoFilterQuery(user._id, filter, sentiment);

  const totalResults = await Email.countDocuments(mongoQuery);
  const startIndex = (page - 1) * pageSize;

  const classifiedEmails = await Email.find(mongoQuery)
    .sort({ emailDate: -1 }) // Sort by date in the database
    .skip(startIndex)
    .limit(pageSize)
    .lean();

  // Fetch details for the classified emails from Gmail to ensure data freshness
  // Note: This still requires Gmail API calls for potentially stale data.
  // Consider if fetching directly from DB is sufficient if data is kept up-to-date.
  const threadDetailsPromises = classifiedEmails.map(
    async (classifiedEmail) => {
      try {
        const threadData = await gmail.users.threads.get({
          userId: "me",
          id: classifiedEmail.threadId,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });

        const messages = threadData.data.messages;
        if (!messages || messages.length === 0) {
          return null;
        }

        const firstMessage = messages[0];
        const latestMessage = messages[messages.length - 1];
        const headers = latestMessage.payload.headers;
        const originalHeaders = firstMessage.payload.headers;
        const dateString = headers.find((h) => h.name === "Date")?.value || "";
        const parsedDate = new Date(dateString);

        // Check/update date stored in DB (optional - adds overhead)
        if (parsedDate.getTime() !== classifiedEmail.emailDate?.getTime()) {
          await Email.findByIdAndUpdate(classifiedEmail._id, {
            emailDate: parsedDate,
          }).catch((err) => console.error("DB Date Update Error:", err));
        }

        return {
          threadId: classifiedEmail.threadId,
          messageCount: messages.length,
          subject:
            headers.find((h) => h.name === "Subject")?.value || "No Subject",
          from:
            headers.find((h) => h.name === "From")?.value || "Unknown Sender",
          originalFrom:
            originalHeaders.find((h) => h.name === "From")?.value || "",
          date: dateString,
          parsedDate: isNaN(parsedDate) ? new Date(0) : parsedDate,
          snippet: latestMessage.snippet,
          // Use classification/sentiment from DB as source of truth here
          classification:
            classifiedEmail.AIAnalysis?.classification ||
            classifiedEmail.filter,
          sentiment:
            classifiedEmail.AIAnalysis?.sentiment || classifiedEmail.sentiment,
        };
      } catch (error) {
        console.error(
          `_handleFilterOnlySearch: Error fetching details for thread ${classifiedEmail.threadId}:`,
          error
        );
        // If Gmail fetch fails, maybe return data directly from DB?
        // return {
        //   threadId: classifiedEmail.threadId,
        //   subject: classifiedEmail.subject || "No Subject",
        //   // ... other fields from classifiedEmail
        //   classification: classifiedEmail.AIAnalysis?.classification || classifiedEmail.filter,
        //   sentiment: classifiedEmail.AIAnalysis?.sentiment || classifiedEmail.sentiment,
        //   // Note: Some fields might be missing if only relying on DB
        // };
        return null;
      }
    }
  );

  let threadDetails = (await Promise.all(threadDetailsPromises)).filter(
    (detail) => detail !== null
  );

  // Ensure uniqueness (shouldn't be strictly necessary if DB query is correct)
  const uniqueThreads = [];
  const seenThreadIds = new Set();
  for (const thread of threadDetails) {
    if (!seenThreadIds.has(thread.threadId)) {
      seenThreadIds.add(thread.threadId);
      uniqueThreads.push(thread);
    }
  }

  // Sorting should ideally be handled by the DB query `.sort({ emailDate: -1 })`
  // uniqueThreads.sort((a, b) => b.parsedDate - a.parsedDate); // Redundant if DB sort works

  const hasMore = startIndex + uniqueThreads.length < totalResults;

  return {
    emails: uniqueThreads,
    pagination: {
      page,
      pageSize,
      hasMore,
      totalResults,
      nextPageToken: null, // No Gmail token when filtering DB
    },
  };
}

/**
 * Handles the default email view (no query, no filters).
 * Fetches threads directly from Gmail API.
 */
async function _handleDefaultEmailView(gmail, user, params) {
  const { page, pageSize, nextPageToken, firebaseUid } = params;
  console.log("_handleDefaultEmailView: Using default email view");

  try {
    const response = await gmail.users.threads.list({
      userId: "me",
      maxResults: pageSize,
      pageToken: nextPageToken || null,
    });

    const threads = response.data.threads || [];
    const newNextPageToken = response.data.nextPageToken;
    const totalEstimate = Math.min(response.data.resultSizeEstimate || 0, 1000); // Gmail API limit

    console.log(`✅ Retrieved ${threads.length} threads for default view`);
    console.log(
      `Page: ${page}, PageToken: ${nextPageToken || "null"}, New token: ${
        newNextPageToken || "null"
      }`
    );

    // Fetch details using the cached/optimized service function
    const threadDetails = await getThreadDetails(
      gmail,
      threads.map((t) => t.id),
      firebaseUid,
      redis
    );

    // Ensure uniqueness (less critical here, but good practice)
    const uniqueThreads = [];
    const seenThreadIds = new Set();
    for (const thread of threadDetails) {
      if (!seenThreadIds.has(thread.threadId)) {
        seenThreadIds.add(thread.threadId);
        uniqueThreads.push(thread);
      }
    }

    return {
      emails: uniqueThreads || [],
      pagination: {
        page,
        pageSize,
        total: totalEstimate,
        totalPages: Math.ceil(totalEstimate / pageSize),
        hasMore: !!newNextPageToken,
        nextPageToken: newNextPageToken,
      },
    };
  } catch (error) {
    console.error(
      "_handleDefaultEmailView: Error fetching default emails:",
      error
    );
    // If default view fails, maybe fallback to filter-only search?
    // Or just return the error state.
    throw error; // Re-throw to be caught by the main handler
  }
}

// --- Main Controller --- //

export const searchEmails = async (req, res) => {
  const {
    // Use const for query parameters
    firebaseUid,
    query = "",
    filter = "",
    sentiment = "",
    page = 1,
    pageSize = 10,
    nextPageToken = null,
  } = req.query;

  // Convert page/pageSize to numbers early
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;

  console.log("\n📍 GET /search endpoint hit");
  console.log("Search params:", {
    query,
    filter,
    sentiment,
    page: pageNum,
    pageSize: pageSizeNum,
    nextPageToken,
  });

  try {
    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }

    if (!user.classifierModel) {
      console.log("Assigning default classifier model to user", user._id);
      user.classifierModel = getDefaultClassifierModel();
      await user.save();
    }

    oauth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    let result;
    const queryParams = {
      firebaseUid,
      query,
      filter,
      sentiment,
      page: pageNum,
      pageSize: pageSizeNum,
      nextPageToken,
    };

    // Delegate to helper functions based on parameters
    if (query) {
      result = await _handleSearchWithQuery(gmail, user, queryParams);
    } else if (filter !== "all" || sentiment !== "all") {
      result = await _handleFilterOnlySearch(gmail, user, queryParams);
    } else {
      // Attempt default view, fallback might be needed if it errors
      try {
        result = await _handleDefaultEmailView(gmail, user, queryParams);
      } catch (defaultViewError) {
        // Log the error and potentially return an error response or empty results
        console.error("Fallback from default view error:", defaultViewError);
        // Decide on fallback behavior: rethrow, return empty, or try filterOnly?
        // For now, return a specific error indicating default view failed.
        return res.status(500).json({
          error: "Failed to fetch default email view",
          message: defaultViewError.message,
          emails: [],
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            hasMore: false,
            nextPageToken: null,
            totalResults: 0,
          },
        });
      }
    }

    // Send the successful response
    res.json(result);
  } catch (error) {
    console.error("❌ Error in /search endpoint:", error);
    console.error(error.stack);
    // Generic error response for unexpected issues
    res.status(500).json({
      error: "Failed to search emails",
      message: error.message,
      emails: [],
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: false,
        nextPageToken: null,
        totalResults: 0,
      },
    });
  }
};
