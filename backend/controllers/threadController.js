import { google } from "googleapis";
import User from "../Models/User.js";
import { oauth2Client } from "../routes/authRoutes.js";
import redis from "../config/redisClient.js";
import {
  getAllThreads,
  getThreadDetails,
  prefetchThreads,
  decodeMessageBody,
} from "../utils/gmailService.js";
import {
  analyzeTextWithModel,
  getDefaultClassifierModel,
} from "../utils/nlpAnalyzer.js";

const INITIAL_FETCH_SIZE = 100;
const PREFETCH_THRESHOLD = 0.75;
const PREFETCH_SIZE = 100;

export const getEmails = async (req, res) => {
  try {
    const { firebaseUid } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const showResolved = req.query.showResolved === "true";

    console.log("\n📍 GET / endpoint hit");
    console.log(
      `Page: ${page}, PageSize: ${pageSize}, ShowResolved: ${showResolved}`
    );

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

    // Get the resolved threads list from the user
    const resolvedThreads = user.resolvedThreads || [];

    // Calculate the start index for the current page
    const startIndex = (page - 1) * pageSize;

    // We need to fetch more threads if we're filtering out resolved ones
    // to ensure we have enough for a full page
    const fetchSize = showResolved ? pageSize : pageSize * 2;

    // Fetch threads
    const response = await gmail.users.threads.list({
      userId: "me",
      maxResults: fetchSize,
      pageToken: startIndex > 0 ? req.query.nextPageToken : null,
    });

    const threads = response.data.threads || [];
    const nextPageToken = response.data.nextPageToken;
    const total = Math.min(response.data.resultSizeEstimate || 0, 1000); // Gmail API limit

    console.log(`✅ Retrieved ${threads.length} threads for current page`);

    // Fetch thread details for all retrieved threads
    let allThreadDetails = await Promise.all(
      threads.map(async (thread) => {
        // Get full thread details to access the first message
        const fullThread = await gmail.users.threads.get({
          userId: "me",
          id: thread.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        // Get the first message (original sender) and last message
        const firstMessage = fullThread.data.messages[0];
        const lastMessage =
          fullThread.data.messages[fullThread.data.messages.length - 1];

        const headers = lastMessage.payload.headers;
        const originalHeaders = firstMessage.payload.headers;

        // Get the last message sender's email
        const lastMessageFrom =
          headers.find((h) => h.name === "From")?.value || "";
        const lastMessageFromEmail = lastMessageFrom.match(/<(.+)>/)
          ? lastMessageFrom.match(/<(.+)>/)[1]
          : lastMessageFrom.split(" ").pop();

        // Get current user's email from Gmail API
        const userProfile = await gmail.users.getProfile({
          userId: "me",
        });
        const userEmail = userProfile.data.emailAddress;

        // Determine if thread needs response (true if last message is not from current user)
        const needsResponse =
          lastMessageFromEmail.toLowerCase() !== userEmail.toLowerCase();

        // Analyze the message snippet using the user's classifier model
        const analysis = analyzeTextWithModel(
          lastMessage.snippet,
          user.classifierModel
        );

        return {
          threadId: thread.id,
          messageCount: fullThread.data.messages.length,
          subject:
            headers.find((h) => h.name === "Subject")?.value || "No Subject",
          from: headers.find((h) => h.name === "From")?.value || "",
          originalFrom:
            originalHeaders.find((h) => h.name === "From")?.value || "",
          date: headers.find((h) => h.name === "Date")?.value || "",
          snippet: lastMessage.snippet,
          isThread: fullThread.data.messages.length > 1,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          classification: analysis.classification,
          needsResponse,
          lastMessageFrom: lastMessageFromEmail,
        };
      })
    );

    // Filter out resolved threads if not explicitly requested
    if (!showResolved) {
      allThreadDetails = allThreadDetails.filter(
        (thread) => !resolvedThreads.includes(thread.threadId)
      );
    }

    // Take only the pageSize number of threads for the current page
    const threadDetailsForCurrentPage = allThreadDetails.slice(0, pageSize);

    // Prefetch next page if needed
    if (nextPageToken) {
      prefetchThreads(
        gmail,
        firebaseUid,
        startIndex + pageSize,
        pageSize,
        redis
      ).catch((error) => {
        console.error("Error in prefetch:", error);
      });
    }

    res.json({
      emails: threadDetailsForCurrentPage || [],
      pagination: {
        page,
        pageSize,
        total: showResolved ? total : total - resolvedThreads.length,
        totalPages: Math.ceil(
          (showResolved ? total : total - resolvedThreads.length) / pageSize
        ),
        hasMore: allThreadDetails.length > pageSize || !!nextPageToken,
        nextPageToken,
      },
    });
  } catch (error) {
    console.error("❌ Error in / endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch emails",
      emails: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasMore: false,
        nextPageToken: null,
      },
    });
  }
};

export const getThreadById = async (req, res) => {
  try {
    const { firebaseUid } = req.query;
    const { threadId } = req.params;

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
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    });

    // Get current user's email from Gmail API
    const userProfile = await gmail.users.getProfile({
      userId: "me",
    });
    const userEmail = userProfile.data.emailAddress;

    // Get the last message
    const lastMessage = thread.data.messages[thread.data.messages.length - 1];
    const lastMessageHeaders = lastMessage.payload.headers;
    const lastMessageFrom =
      lastMessageHeaders.find((h) => h.name === "From")?.value || "";
    const lastMessageFromEmail = lastMessageFrom.match(/<(.+)>/)
      ? lastMessageFrom.match(/<(.+)>/)[1]
      : lastMessageFrom.split(" ").pop();

    // Determine if thread needs response
    const needsResponse =
      lastMessageFromEmail.toLowerCase() !== userEmail.toLowerCase();

    const messages = thread.data.messages.map((message) => {
      const headers = message.payload.headers;
      const body = decodeMessageBody(message.payload);

      // Analyze the message body using the user's classifier model
      const analysis = analyzeTextWithModel(body, user.classifierModel);

      return {
        messageId: message.id,
        subject:
          headers.find((h) => h.name === "Subject")?.value || "No Subject",
        from: headers.find((h) => h.name === "From")?.value || "",
        to: headers.find((h) => h.name === "To")?.value || "",
        date: headers.find((h) => h.name === "Date")?.value || "",
        body,
        analysis, // Include the analysis in the response
      };
    });

    res.json({
      messages,
      needsResponse,
      lastMessageFrom: lastMessageFromEmail,
    });
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
};

export const resolveThread = async (req, res) => {
  try {
    const { threadId, firebaseUid, resolved } = req.body;

    if (!threadId || !firebaseUid) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Find the user by Firebase UID
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (resolved) {
      // Add thread to resolvedThreads if not already there
      if (!user.resolvedThreads.includes(threadId)) {
        user.resolvedThreads.push(threadId);
      }
    } else {
      // Remove thread from resolvedThreads
      user.resolvedThreads = user.resolvedThreads.filter(
        (id) => id !== threadId
      );
    }

    await user.save();
    res.json({ success: true, resolved });
  } catch (error) {
    console.error("Error resolving thread:", error);
    res
      .status(500)
      .json({ error: "Failed to update thread resolution status" });
  }
};

export const replyEmail = async (req, res) => {
  try {
    const { threadId, message, firebaseUid } = req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }

    // Check if thread is in resolvedThreads and remove it
    if (user.resolvedThreads.includes(threadId)) {
      user.resolvedThreads = user.resolvedThreads.filter(
        (id) => id !== threadId
      );
      await user.save();
    }

    oauth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    });

    const lastMessage = thread.data.messages[thread.data.messages.length - 1];
    const headers = lastMessage.payload.headers;
    const messageId = headers.find((h) => h.name === "Message-ID")?.value;
    const references =
      headers.find((h) => h.name === "References")?.value || "";

    const messageParts = [
      "From: me",
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `In-Reply-To: ${messageId}`,
      `References: ${references} ${messageId}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      message.body,
    ];

    const emailContent = messageParts.join("\n");
    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage, threadId },
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

export const getSenderEmails = async (req, res) => {
  try {
    const { email } = req.params;
    const { firebaseUid } = req.query;

    if (!email || !firebaseUid) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      return res.status(401).json({ error: "Gmail not connected" });
    }

    oauth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Search for emails from the specific sender
    const response = await gmail.users.messages.list({
      userId: "me",
      q: `from:${email}`,
      maxResults: 10,
    });

    const messages = response.data.messages || [];

    // If no messages found, return empty array
    if (!messages.length) {
      return res.json({ emails: [] });
    }

    // Fetch details for each message
    const emailPromises = messages.map(async (message) => {
      const messageDetails = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = messageDetails.data.payload.headers;
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      // Get the thread to check if we have analysis data
      const threadId = messageDetails.data.threadId;

      // Check if we have cached analysis for this thread
      let type = null;
      let sentiment = null;

      try {
        const cachedThread = await redis.get(
          `thread:${firebaseUid}:${threadId}`
        );
        if (cachedThread) {
          const threadData = JSON.parse(cachedThread);
          if (threadData.analysis) {
            type = threadData.analysis.type;
            sentiment = threadData.analysis.sentiment;
          }
        }
      } catch (redisError) {
        console.error("Redis error:", redisError);
        // Continue without the analysis data
      }

      return {
        messageId: message.id,
        threadId,
        subject,
        from,
        date,
        type,
        sentiment,
      };
    });

    const emails = await Promise.all(emailPromises);

    res.json({ emails });
  } catch (error) {
    console.error("Error fetching sender emails:", error);
    res.status(500).json({
      error: "Failed to fetch sender emails",
      message: error.message,
    });
  }
};
