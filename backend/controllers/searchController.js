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
        // --- Combined approach: Check both MongoDB and Redis cache ---
        console.log("Filtering by sentiment/classification");

        // First check Redis cache for matching threads
        try {
          console.log("Checking Redis cache for matching threads");

          // Get thread details cache - correct key based on actual Redis structure
          const threadDetailsKey = `user:thread-details:search:"${firebaseUid}"`;
          const cachedDetailsStr = await redis.get(threadDetailsKey);

          if (cachedDetailsStr) {
            console.log("Found cached thread details in Redis");

            const cachedDetails = JSON.parse(cachedDetailsStr);
            const cachedThreads = [];

            // Convert the object to an array of threads with IDs
            for (const [threadId, details] of Object.entries(cachedDetails)) {
              if (details) {
                cachedThreads.push({
                  threadId,
                  ...details,
                  classification: details.classification || "Unknown",
                  sentiment: details.sentiment || "neutral",
                });
              }
            }

            // Filter by sentiment/classification
            let filteredCachedThreads = cachedThreads;

            if (filter && filter !== "all") {
              console.log(
                `Filtering Redis results by classification: ${filter}`
              );
              filteredCachedThreads = filteredCachedThreads.filter(
                (thread) => thread.classification === filter
              );
            }

            if (sentiment && sentiment !== "all") {
              console.log(`Filtering Redis results by sentiment: ${sentiment}`);
              // Handle case-insensitive comparison for sentiment
              const normalizedSentiment = sentiment.toLowerCase();
              filteredCachedThreads = filteredCachedThreads.filter((thread) => {
                // Check various formats the sentiment might be stored in
                const threadSentiment = thread.sentiment
                  ? thread.sentiment.toLowerCase()
                  : "";
                console.log(
                  `Thread ${thread.threadId} has sentiment: ${threadSentiment}`
                );

                return (
                  threadSentiment === normalizedSentiment ||
                  // Check for alternative formats
                  (normalizedSentiment === "positive" &&
                    threadSentiment.includes("posit")) ||
                  (normalizedSentiment === "negative" &&
                    threadSentiment.includes("negat")) ||
                  (normalizedSentiment === "neutral" &&
                    threadSentiment.includes("neutr"))
                );
              });
            }

            console.log(
              `Found ${filteredCachedThreads.length} matching threads in Redis cache`
            );

            // Store the Redis results to combine with MongoDB later
            if (filteredCachedThreads.length > 0) {
              // Save ThreadIDs we've found in Redis to avoid duplicates
              const redisThreadIds = new Set(
                filteredCachedThreads.map((thread) => thread.threadId)
              );

              // Get results from MongoDB too, excluding ones we already have from Redis
              console.log("Now checking MongoDB for additional results");

              let mongoQuery = { userId: user._id };

              // Add filters
              if (filter && filter !== "all") {
                console.log(`Filtering MongoDB by classification: ${filter}`);
                mongoQuery["AIAnalysis.classification"] = filter;
              }

              if (sentiment && sentiment !== "all") {
                console.log(`Filtering MongoDB by sentiment: ${sentiment}`);
                // Create a case-insensitive regex query for sentiment
                const sentimentRegex = new RegExp(`^${sentiment}$`, "i");
                mongoQuery["AIAnalysis.sentiment"] = sentimentRegex;
              }

              // Exclude threads we already have from Redis
              if (redisThreadIds.size > 0) {
                mongoQuery.threadId = { $nin: Array.from(redisThreadIds) };
              }

              console.log("MongoDB query:", JSON.stringify(mongoQuery));

              // Get total count for pagination info
              const totalMongoCount = await Email.countDocuments(mongoQuery);
              console.log(
                `Found ${totalMongoCount} additional matching documents in MongoDB`
              );

              // Get all results from MongoDB (not paginated yet)
              const classifiedEmails = await Email.find(mongoQuery)
                .sort({ emailDate: -1 })
                .lean();

              console.log(
                `Retrieved ${classifiedEmails.length} additional emails from MongoDB`
              );

              // Process MongoDB results
              const mongoThreadDetailsPromises = classifiedEmails.map(
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
                        originalHeaders.find((h) => h.name === "From")?.value ||
                        "",
                      date: dateString,
                      parsedDate: isNaN(parsedDate) ? new Date(0) : parsedDate,
                      snippet: latestMessage.snippet,
                      classification:
                        classifiedEmail.AIAnalysis?.classification,
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

              const mongoThreadDetails = (
                await Promise.all(mongoThreadDetailsPromises)
              ).filter((detail) => detail !== null);

              // Combine results from Redis and MongoDB
              console.log(
                `Combining ${filteredCachedThreads.length} Redis results with ${mongoThreadDetails.length} MongoDB results`
              );
              const allThreadDetails = [
                ...filteredCachedThreads,
                ...mongoThreadDetails,
              ];

              // Sort all results by date
              allThreadDetails.sort((a, b) => {
                const dateA =
                  a.parsedDate || (a.date ? new Date(a.date) : new Date(0));
                const dateB =
                  b.parsedDate || (b.date ? new Date(b.date) : new Date(0));
                return dateB - dateA;
              });

              // Apply pagination to combined results
              const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
              const endIndex = startIndex + parseInt(pageSize);
              filteredEmails = allThreadDetails.slice(startIndex, endIndex);

              // Calculate pagination info
              totalResults = allThreadDetails.length;
              hasMore = endIndex < totalResults;

              console.log(
                `Returning ${
                  filteredEmails.length
                } emails from combined sources (page ${page} of ${Math.ceil(
                  totalResults / parseInt(pageSize)
                )})`
              );

              return res.json({
                emails: filteredEmails,
                pagination: {
                  page: parseInt(page),
                  pageSize: parseInt(pageSize),
                  hasMore,
                  totalResults,
                  nextPageToken: null,
                },
              });
            }
          }
        } catch (error) {
          console.error("Error querying Redis cache:", error);
          // Continue to MongoDB as fallback
        }

        // Fallback to MongoDB if Redis doesn't have matching results
        console.log("Falling back to MongoDB for filtering");

        let mongoQuery = { userId: user._id };

        if (filter && filter !== "all") {
          console.log(`Filtering MongoDB by classification: ${filter}`);
          mongoQuery["AIAnalysis.classification"] = filter;
        }

        if (sentiment && sentiment !== "all") {
          console.log(`Filtering MongoDB by sentiment: ${sentiment}`);
          // Create a case-insensitive regex query for sentiment
          const sentimentRegex = new RegExp(`^${sentiment}$`, "i");
          mongoQuery["AIAnalysis.sentiment"] = sentimentRegex;

          // Log the MongoDB query for debugging
          console.log("MongoDB query:", JSON.stringify(mongoQuery));
        }

        totalResults = await Email.countDocuments(mongoQuery);
        const startIndex = (parseInt(page) - 1) * parseInt(pageSize);

        const classifiedEmails = await Email.find(mongoQuery)
          .sort({ emailDate: -1 })
          .skip(startIndex)
          .limit(parseInt(pageSize))
          .lean();

        console.log(
          `Found ${classifiedEmails.length} matching emails in MongoDB`
        );

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
