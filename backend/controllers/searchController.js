import { google } from "googleapis";
import {
  getUserCacheKey,
  getAllThreads,
  getSearchResultsWithCache,
  getThreadDetails,
} from "../utils/gmailService.js";
import redis from "../config/redisClient.js";
import { oauth2Client } from "../routes/authRoutes.js";
import User from "../Models/User.js";
import Email from "../Models/Email.js";
import {
  analyzeText,
  analyzeTextWithModel,
  getDefaultClassifierModel,
} from "../utils/nlpAnalyzer.js";

const INITIAL_FETCH_SIZE = 250;

export const searchEmails = async (req, res) => {
  try {
    const {
      firebaseUid,
      query = "",
      filter = "",
      sentiment = "",
      page = 1,
      pageSize = 10,
      nextPageToken = null,
    } = req.query;

    console.log("\n📍 GET /search endpoint hit");
    console.log("Search params:", {
      query,
      filter,
      sentiment,
      page,
      pageSize,
      nextPageToken,
    });

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }

    // Check if user has a classifier model, if not, assign the default one
    if (!user.classifierModel) {
      user.classifierModel = getDefaultClassifierModel();
      await user.save();
    }

    oauth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    let filteredEmails = [];
    let totalResults = 0;
    let hasMore = false;
    let newNextPageToken = null;

    if (query) {
      // --- Query Handling (Modified for NLP Analysis) ---
      const gmailQuery = `${query} in:anywhere`;
      console.log(`Gmail query: ${gmailQuery}`);

      // Track which thread IDs we've already processed to avoid duplicates
      const processedThreadIds = new Set();

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

      newNextPageToken = searchResults.nextPageToken;
      console.log("New next page token from Gmail:", newNextPageToken);

      const threadDetailsPromises = searchResults.emails.map(async (email) => {
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

          // Get the first message (original sender) and last message
          const firstMessage = messages[0];
          const latestMessage = messages[messages.length - 1];
          const headers = latestMessage.payload.headers;
          const originalHeaders = firstMessage.payload.headers;

          // --- Perform NLP Analysis using user's classifier model ---
          const subject =
            headers.find((h) => h.name === "Subject")?.value || "No Subject";
          const textToAnalyze = subject + " " + latestMessage.snippet;
          const aiAnalysis = analyzeTextWithModel(
            textToAnalyze,
            user.classifierModel
          );
          // --- End of NLP Analysis ---

          const dateString =
            headers.find((h) => h.name === "Date")?.value || "";
          const parsedDate = new Date(dateString);

          return {
            threadId: email.threadId,
            messageCount: messages.length,
            subject: subject,
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
            `Error fetching details for thread ${email.threadId}:`,
            error
          );
          return null;
        }
      });

      let threadDetails = (await Promise.all(threadDetailsPromises)).filter(
        (detail) => detail !== null
      );

      // Filter out duplicate threads
      threadDetails = threadDetails.filter((thread) => {
        if (processedThreadIds.has(thread.threadId)) {
          return false;
        }
        processedThreadIds.add(thread.threadId);
        return true;
      });

      // Add additional validation to ensure search term is actually present
      // in the visible content (subject or snippet)
      if (query && query.trim() !== "") {
        const searchTerms = query.toLowerCase().split(/\s+/);
        threadDetails = threadDetails.filter((thread) => {
          const content = (thread.subject + " " + thread.snippet).toLowerCase();
          return searchTerms.some((term) => content.includes(term));
        });
      }

      if (filter && filter !== "all") {
        threadDetails = threadDetails.filter(
          (email) => email.classification === filter
        );
      }
      if (sentiment && sentiment !== "all") {
        threadDetails = threadDetails.filter(
          (email) => email.sentiment === sentiment
        );
      }

      threadDetails.sort((a, b) => b.parsedDate - a.parsedDate);

      totalResults = threadDetails.length;
      const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
      const endIndex = startIndex + parseInt(pageSize);
      filteredEmails = threadDetails.slice(startIndex, endIndex);

      // Determine if there are more results
      hasMore = endIndex < totalResults || !!newNextPageToken;

      // If we've reached the end of our current batch but have a nextPageToken,
      // we should indicate there are more results
      if (filteredEmails.length < parseInt(pageSize) && newNextPageToken) {
        hasMore = true;
      }
      // --- End of Query Handling ---
    } else {
      // If no search criteria are provided, use the same approach as threadController
      if (
        !query &&
        (!filter || filter === "all") &&
        (!sentiment || sentiment === "all")
      ) {
        try {
          console.log("No search criteria provided, using default email view");

          // Use the exact same approach as in threadController.getEmails
          const response = await gmail.users.threads.list({
            userId: "me",
            maxResults: parseInt(pageSize),
            pageToken: nextPageToken || null,
          });

          const threads = response.data.threads || [];
          const newNextPageToken = response.data.nextPageToken;
          const total = Math.min(response.data.resultSizeEstimate || 0, 1000); // Gmail API limit

          console.log(
            `✅ Retrieved ${threads.length} threads for default view`
          );
          console.log(
            `Page: ${page}, PageToken: ${nextPageToken || "null"}, New token: ${
              newNextPageToken || "null"
            }`
          );

          // Fetch thread details for the current page
          const threadDetails = await getThreadDetails(
            gmail,
            threads.map((t) => t.id),
            firebaseUid,
            redis
          );

          // Ensure no duplicate threads in the response
          const uniqueThreads = [];
          const seenThreadIds = new Set();

          for (const thread of threadDetails) {
            if (!seenThreadIds.has(thread.threadId)) {
              seenThreadIds.add(thread.threadId);
              uniqueThreads.push(thread);
            }
          }

          // Return the same structure as threadController.getEmails
          return res.json({
            emails: uniqueThreads || [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total,
              totalPages: Math.ceil(total / parseInt(pageSize)),
              hasMore: !!newNextPageToken,
              nextPageToken: newNextPageToken,
            },
          });
        } catch (error) {
          console.error("Error fetching default emails:", error);
          // Continue with the existing search logic as fallback
        }
      } else {
        // --- No Query (Filtering in MongoDB, Sorting in JS) - No Changes ---
        let mongoQuery = { userId: user._id };

        if (filter && filter !== "all") {
          mongoQuery["filter"] = filter;
        }
        if (sentiment && sentiment !== "all") {
          mongoQuery["sentiment"] = sentiment;
        }

        totalResults = await Email.countDocuments(mongoQuery);
        const startIndex = (parseInt(page) - 1) * parseInt(pageSize);

        const classifiedEmails = await Email.find(mongoQuery)
          .sort({ emailDate: -1 })
          .skip(startIndex)
          .limit(parseInt(pageSize))
          .lean();

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
                console.warn(
                  `Thread ${classifiedEmail.threadId} has no messages`
                );
                return null;
              }

              // Get the first message (original sender) and last message
              const firstMessage = messages[0];
              const latestMessage = messages[messages.length - 1];
              const headers = latestMessage.payload.headers;
              const originalHeaders = firstMessage.payload.headers;
              const dateString =
                headers.find((h) => h.name === "Date")?.value || "";
              const parsedDate = new Date(dateString);

              if (isNaN(parsedDate.getTime())) {
                console.warn(
                  `Invalid date string for thread ${classifiedEmail.threadId}: ${dateString}`
                );
              }

              // Update the email date in the database if it's different
              if (
                parsedDate.getTime() !== classifiedEmail.emailDate?.getTime()
              ) {
                await Email.findByIdAndUpdate(classifiedEmail._id, {
                  emailDate: parsedDate,
                });
              }

              return {
                threadId: classifiedEmail.threadId,
                messageCount: messages.length,
                subject:
                  headers.find((h) => h.name === "Subject")?.value ||
                  "No Subject",
                from:
                  headers.find((h) => h.name === "From")?.value ||
                  "Unknown Sender",
                originalFrom:
                  originalHeaders.find((h) => h.name === "From")?.value || "",
                date: dateString,
                parsedDate: isNaN(parsedDate) ? new Date(0) : parsedDate,
                snippet: latestMessage.snippet,
                classification: classifiedEmail.AIAnalysis?.classification,
                sentiment: classifiedEmail.AIAnalysis?.sentiment,
              };
            } catch (error) {
              console.error(
                `Error fetching details for thread ${classifiedEmail.threadId}:`,
                error
              );
              return null;
            }
          }
        );

        let threadDetails = (await Promise.all(threadDetailsPromises)).filter(
          (detail) => detail !== null
        );

        // Ensure no duplicate threads
        const uniqueThreads = [];
        const seenThreadIds = new Set();

        for (const thread of threadDetails) {
          if (!seenThreadIds.has(thread.threadId)) {
            seenThreadIds.add(thread.threadId);
            uniqueThreads.push(thread);
          }
        }

        threadDetails = uniqueThreads;
        threadDetails.sort((a, b) => b.parsedDate - a.parsedDate);
        filteredEmails = threadDetails;
        hasMore = startIndex + filteredEmails.length < totalResults;
        // --- End of No Query Handling ---
      }
    }

    res.json({
      emails: filteredEmails,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasMore,
        totalResults,
        nextPageToken: newNextPageToken,
      },
    });
  } catch (error) {
    console.error("❌ Error in /search endpoint:", error);
    console.error(error.stack);
    res.status(500).json({
      error: "Failed to search emails",
      message: error.message,
      emails: [],
      pagination: {
        page: 1,
        pageSize: 10,
        hasMore: false,
        nextPageToken: null,
        totalResults: 0,
      },
    });
  }
};
