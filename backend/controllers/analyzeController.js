import { google } from "googleapis";
import { analyzeText, analyzeTextWithModel } from "../utils/nlpAnalyzer.js";
import User from "../Models/User.js";
import Email from "../Models/Email.js";
import { oauth2Client } from "../routes/authRoutes.js";
import redis from "../config/redisClient.js";

// Helper function for delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch all threads from Gmail without caching.
async function fetchAllThreads(gmail) {
  console.log("fetchAllThreads: Starting to fetch all threads...");
  let threads = [];
  let pageToken = null;

  try {
    do {
      console.log(`fetchAllThreads: Fetching page with token: ${pageToken}`);
      const response = await gmail.users.threads.list({
        userId: "me",
        maxResults: 500, // Maximum allowed per page.
        pageToken,
      });

      if (response.data.threads) {
        threads.push(...response.data.threads);
        console.log(
          `fetchAllThreads: Fetched ${response.data.threads.length} threads. Total: ${threads.length}`
        );
      }
      pageToken = response.data.nextPageToken;
      console.log(`fetchAllThreads: Next page token: ${pageToken}`);
    } while (pageToken);
  } catch (error) {
    console.error("fetchAllThreads: Error fetching threads:", error);
    throw error;
  }

  console.log("fetchAllThreads: Finished fetching all threads.");
  return threads;
}

// Fetch thread details directly from API without caching.
export async function getThreadDetailsNoCache(gmail, threadIds, user) {
  console.log(
    `getThreadDetailsNoCache: Fetching details for ${threadIds.length} threads...`
  );
  const batchSize = 100; // Start with a smaller batch size. Experiment!
  const results = [];
  const retryConfig = {
    retry: 5, // Maximum number of retries
    retryDelayMultiplier: 2, // Exponential backoff factor (e.g., 2 means delay doubles each retry)
    statusCodesToRetry: [[403, "rateLimitExceeded"]], // Retry specifically on 403 errors with reason 'rateLimitExceeded'
    onRetryAttempt: (err) => {
      console.warn(`Retrying request due to error: ${err.message}`);
    },
  };

  // Get the user's classifier model
  const userClassifierModel = user?.classifierModel || null;

  for (let i = 0; i < threadIds.length; i += batchSize) {
    const batch = threadIds.slice(i, i + batchSize);
    console.log(
      `getThreadDetailsNoCache: Processing batch ${
        i / batchSize + 1
      } of ${Math.ceil(threadIds.length / batchSize)}`
    );

    const batchPromises = batch.map((threadId) =>
      gmail.users.threads
        .get({
          userId: "me",
          id: threadId,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
          retryConfig: retryConfig, // Apply the custom retry configuration
        })
        .catch((error) => {
          console.error(
            `getThreadDetailsNoCache: Error fetching thread ${threadId} in batch:`,
            error
          );
          return null;
        })
    );

    try {
      const batchResults = await Promise.all(batchPromises);
      // Filter out any null results (failed requests)
      const successfulResults = batchResults.filter(
        (result) => result !== null
      );

      for (const threadData of successfulResults) {
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

        const subjectHeader = headers.find((h) => h.name === "Subject");
        const fromHeader = headers.find((h) => h.name === "From");
        const dateHeader = headers.find((h) => h.name === "Date");

        // New: Parse the date header and create a Date object.
        const dateValue = dateHeader ? dateHeader.value : "Unknown Date";
        const parsedDate = new Date(dateValue);
        const emailDate = isNaN(parsedDate.getTime()) ? null : parsedDate;

        const threadDetail = {
          threadId: threadData.data.id,
          messageCount: messages.length,
          subject: subjectHeader ? subjectHeader.value : "No Subject",
          from: fromHeader ? fromHeader.value : "Unknown Sender",
          date: dateValue, // Original date string (if needed)
          emailDate, // New attribute as a Date object
          snippet: latestMessage.snippet,
          isThread: messages.length > 1,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          classification: analysis.classification,
          confidence: analysis.confidence,
        };
        results.push(threadDetail);
        console.log(
          `getThreadDetailsNoCache: Fetched details for threadId: ${threadData.data.id}`
        );
      }
    } catch (error) {
      console.error(
        `getThreadDetailsNoCache: Error fetching batch starting at ${i}:`,
        error
      );
    }

    // Introduce a delay after each batch.
    console.log(
      "getThreadDetailsNoCache: Waiting 1 second before next batch..."
    );
    await sleep(5000);
  }

  console.log("getThreadDetailsNoCache: Finished fetching thread details.");
  return results;
}

// Controller function to analyze and save all emails.
export const analyzeAndSaveAllEmails = async (req, res) => {
  console.log("analyzeAndSaveAllEmails: Starting...");

  try {
    const { firebaseUid } = req.query;
    if (!firebaseUid) {
      console.error("analyzeAndSaveAllEmails: Firebase UID is required");
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      console.error(
        "analyzeAndSaveAllEmails: Gmail not connected for user:",
        firebaseUid
      );
      return res.status(401).json({ error: "Gmail not connected" });
    }

    oauth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    console.log("analyzeAndSaveAllEmails: Fetching all threads...");
    const allThreads = await fetchAllThreads(gmail);
    const threadIds = allThreads.map((thread) => thread.id);
    console.log(
      `analyzeAndSaveAllEmails: Fetched ${allThreads.length} threads.`
    );

    console.log(
      "analyzeAndSaveAllEmails: Fetching thread details directly from API..."
    );
    const threadDetails = await getThreadDetailsNoCache(gmail, threadIds, user);
    console.log(
      `analyzeAndSaveAllEmails: Fetched details for ${threadDetails.length} threads.`
    );

    // Prepare bulk operations for updating/inserting Email records.
    const bulkOps = [];
    threadDetails.forEach((threadDetail) => {
      const {
        threadId,
        sentiment,
        classification,
        sentimentScore,
        confidence,
        subject,
        from,
        date,
        emailDate,
        snippet,
        messageCount,
      } = threadDetail;

      const AIAnalysis = {
        sentiment,
        sentimentScore,
        classification,
        confidence,
      };

      bulkOps.push({
        updateOne: {
          filter: { userId: user._id, threadId },
          update: {
            $set: {
              sentiment,
              filter: classification,
              AIAnalysis,
              subject,
              from,
              date,
              emailDate, // New date attribute saved as a Date object
              snippet,
              messageCount,
              userId: user._id,
            },
          },
          upsert: true,
        },
      });
      console.log(
        `analyzeAndSaveAllEmails: Queued bulk update for threadId: ${threadId}`
      );
    });

    if (bulkOps.length > 0) {
      const bulkResult = await Email.bulkWrite(bulkOps);
      console.log("analyzeAndSaveAllEmails: Bulk write result:", bulkResult);
    } else {
      console.log(
        "analyzeAndSaveAllEmails: No operations to perform for Email updates/inserts."
      );
    }

    // Update the user's emailMetadata field.
    const updatedEmails = await Email.find({
      userId: user._id,
      threadId: { $in: threadIds },
    });
    user.emailMetadata = updatedEmails.map((email) => email._id);
    console.log("analyzeAndSaveAllEmails: Updated user's emailMetadata.");

    console.log("analyzeAndSaveAllEmails: Saving user document...");
    await user.save();
    console.log("analyzeAndSaveAllEmails: User document saved.");

    res
      .status(200)
      .json({ message: "Successfully analyzed and saved all emails" });
    console.log("analyzeAndSaveAllEmails: Finished.");
  } catch (error) {
    console.error("analyzeAndSaveAllEmails: Error:", error);
    res.status(500).json({ error: "Failed to analyze and save emails" });
  }
};
