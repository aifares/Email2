import Email from "../Models/Email.js";
import User from "../Models/User.js";

// Get classification distribution
export const getClassificationDistribution = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Aggregate emails by classification
    const classificationData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$AIAnalysis.classification",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format the response
    const formattedData = classificationData.map((item) => ({
      classification: item._id || "Unclassified",
      count: item.count,
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching classification distribution:", error);
    res.status(500).json({ error: "Failed to fetch classification data" });
  }
};

// Get sentiment analysis over time
export const getSentimentOverTime = async (req, res) => {
  try {
    const { firebaseUid, timeframe = "month" } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine date format based on timeframe
    let dateFormat;
    if (timeframe === "day") {
      dateFormat = "%Y-%m-%d";
    } else if (timeframe === "week") {
      dateFormat = "%Y-%U"; // Year-Week
    } else {
      dateFormat = "%Y-%m"; // Year-Month
    }

    // Aggregate sentiment data by time period
    const sentimentData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: {
            timePeriod: {
              $dateToString: { format: dateFormat, date: "$emailDate" },
            },
            sentiment: "$AIAnalysis.sentiment",
          },
          count: { $sum: 1 },
          averageScore: { $avg: "$AIAnalysis.sentimentScore" },
        },
      },
      { $sort: { "_id.timePeriod": 1 } },
    ]);

    // Format the response
    const formattedData = sentimentData.map((item) => ({
      timePeriod: item._id.timePeriod,
      sentiment: item._id.sentiment || "Neutral",
      count: item.count,
      averageScore: parseFloat(item.averageScore.toFixed(2)),
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching sentiment over time:", error);
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
};

// Get email volume by time period
export const getEmailVolume = async (req, res) => {
  try {
    const { firebaseUid, timeframe = "month", limit = 12 } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine date format based on timeframe
    let dateFormat;
    if (timeframe === "day") {
      dateFormat = "%Y-%m-%d";
    } else if (timeframe === "week") {
      dateFormat = "%Y-%U"; // Year-Week
    } else {
      dateFormat = "%Y-%m"; // Year-Month
    }

    // Aggregate email volume by time period
    const volumeData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$emailDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: parseInt(limit) },
      { $sort: { _id: 1 } },
    ]);

    // Format the response
    const formattedData = volumeData.map((item) => ({
      timePeriod: item._id,
      count: item.count,
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching email volume:", error);
    res.status(500).json({ error: "Failed to fetch email volume data" });
  }
};

// Get all analytics data in a single request
export const getAllAnalytics = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get classification distribution
    const classificationData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$AIAnalysis.classification",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get sentiment distribution
    const sentimentData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$AIAnalysis.sentiment",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get email volume by month (last 6 months)
    const volumeData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$emailDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 6 },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      classification: classificationData.map((item) => ({
        classification: item._id || "Unclassified",
        count: item.count,
      })),
      sentiment: sentimentData.map((item) => ({
        sentiment: item._id || "Neutral",
        count: item.count,
      })),
      volume: volumeData.map((item) => ({
        month: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

// Get sentiment distribution for a specific classification
export const getSentimentDistributionByClassification = async (req, res) => {
  try {
    const { firebaseUid, classification } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!classification) {
      return res.status(400).json({ error: "Classification is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Aggregate emails to get sentiment distribution for the specific classification
    const sentimentData = await Email.aggregate([
      {
        $match: {
          userId: user._id,
          "AIAnalysis.classification": classification,
        },
      },
      {
        $group: {
          _id: "$AIAnalysis.sentiment",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate total for percentage calculation
    const total = sentimentData.reduce((sum, item) => sum + item.count, 0);

    // Format the response
    const formattedData = sentimentData.map((item) => ({
      sentiment: item._id || "Neutral",
      count: item.count,
      score: Math.round((item.count / total) * 100), // Calculate percentage
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error(
      "Error fetching sentiment distribution by classification:",
      error
    );
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
};

// Utility function to extract topics from text
const extractTopicsFromText = (emails, maxTopics = 5) => {
  try {
    // Common words to exclude from topic extraction (stopwords)
    const stopwords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "from",
      "up",
      "down",
      "of",
      "off",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "can",
      "will",
      "just",
      "should",
      "now",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "this",
      "that",
      "these",
      "those",
      "am",
      "im",
      "i'm",
      "your",
      "my",
    ]);

    // Collect all words from email subjects and snippets
    const wordMap = new Map();
    emails.forEach((email) => {
      // Extract words from subject and snippet
      const text = `${email.subject || ""} ${
        email.snippet || ""
      }`.toLowerCase();
      const words = text.split(/\W+/).filter(
        (word) =>
          word.length > 3 && // Skip very short words
          !stopwords.has(word) && // Skip stopwords
          !parseInt(word) // Skip numbers
      );

      // Count word frequencies
      words.forEach((word) => {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      });
    });

    // Extract phrases (bigrams for better topic representation)
    const phraseMap = new Map();
    emails.forEach((email) => {
      // Extract words from subject and snippet
      const text = `${email.subject || ""} ${
        email.snippet || ""
      }`.toLowerCase();
      const words = text.split(/\W+/).filter((word) => word.length > 2);

      // Create bigrams/phrases
      for (let i = 0; i < words.length - 1; i++) {
        if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
          const phrase = `${words[i]} ${words[i + 1]}`;
          phraseMap.set(phrase, (phraseMap.get(phrase) || 0) + 1);
        }
      }
    });

    // Convert maps to arrays and sort by frequency
    const wordList = Array.from(wordMap.entries())
      .filter(([word, count]) => count > 1) // Filter out single occurrences
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics * 2);

    const phraseList = Array.from(phraseMap.entries())
      .filter(([phrase, count]) => count > 1) // Filter out single occurrences
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics);

    // Combine phrases and words, prioritizing phrases
    const combinedList = [...phraseList];
    for (const [word, count] of wordList) {
      // Check if the word is already part of a phrase we're using
      const wordIsInPhrase = combinedList.some(([phrase]) =>
        phrase.includes(word)
      );
      if (!wordIsInPhrase) {
        combinedList.push([word, count]);
        if (combinedList.length >= maxTopics) break;
      }
    }

    // Format results
    return combinedList.slice(0, maxTopics).map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1), // Capitalize first letter
      count,
    }));
  } catch (error) {
    console.error("Error extracting topics:", error);
    return [];
  }
};

// Get topics and sample emails for a specific sentiment
export const getTopicsBySentiment = async (req, res) => {
  try {
    const { firebaseUid, sentiment } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!sentiment) {
      return res.status(400).json({ error: "Sentiment is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all emails for this sentiment (not just samples)
    const allEmails = await Email.find({
      userId: user._id,
      "AIAnalysis.sentiment": sentiment,
    })
      .sort({ emailDate: -1 })
      .select("subject from date emailDate snippet AIAnalysis");

    // Get sample emails for display
    const emailSamples = allEmails.slice(0, 5);

    // Format the response for samples
    const formattedSamples = emailSamples.map((email) => ({
      subject: email.subject || "No Subject",
      date: email.date,
      sender: email.from,
      classification: email.AIAnalysis.classification,
      sentimentScore: email.AIAnalysis.sentimentScore,
      snippet: email.snippet,
    }));

    // Extract real topics using NLP-inspired techniques
    const extractedTopics = extractTopicsFromText(allEmails);

    // If we couldn't extract topics, fall back to classifications
    let topics = extractedTopics;
    if (topics.length === 0) {
      // Analyze most common classifications for this sentiment
      const topicData = await Email.aggregate([
        {
          $match: {
            userId: user._id,
            "AIAnalysis.sentiment": sentiment,
          },
        },
        {
          $group: {
            _id: "$AIAnalysis.classification",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Format topic data
      topics = topicData.map((item) => ({
        topic: item._id || "Unclassified",
        count: item.count,
      }));
    }

    res.json({
      samples: formattedSamples,
      topics: topics,
    });
  } catch (error) {
    console.error("Error fetching topics by sentiment:", error);
    res.status(500).json({ error: "Failed to fetch topic data" });
  }
};

// Get topics (from email subjects) for a specific classification
export const getTopicsByClassification = async (req, res) => {
  try {
    const { firebaseUid, classification } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!classification) {
      return res.status(400).json({ error: "Classification is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all emails for this classification (not just samples)
    const allEmails = await Email.find({
      userId: user._id,
      "AIAnalysis.classification": classification,
    })
      .sort({ emailDate: -1 })
      .select("subject from date emailDate snippet AIAnalysis");

    // Get sample emails for display
    const emailSamples = allEmails.slice(0, 5);

    // Format the response for samples
    const formattedSamples = emailSamples.map((email) => ({
      subject: email.subject || "No Subject",
      date: email.date,
      sender: email.from,
      sentiment: email.AIAnalysis.sentiment,
      sentimentScore: email.AIAnalysis.sentimentScore,
      snippet: email.snippet,
    }));

    // Extract real topics using NLP-inspired techniques
    const extractedTopics = extractTopicsFromText(allEmails);

    // Get sender distribution for this classification
    const senderData = await Email.aggregate([
      {
        $match: {
          userId: user._id,
          "AIAnalysis.classification": classification,
        },
      },
      {
        $group: {
          _id: "$from",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Format sender data
    const senders = senderData.map((item) => {
      // Extract name from email address if possible
      let senderName = item._id || "Unknown";
      if (senderName.includes("@")) {
        senderName = senderName.split("@")[0];
        // Convert common email formats to readable names
        senderName = senderName
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      return {
        name: senderName,
        count: item.count,
      };
    });

    // Send comprehensive data
    res.json({
      data: formattedSamples,
      topics: extractedTopics,
      senders: senders,
    });
  } catch (error) {
    console.error("Error fetching topics by classification:", error);
    res.status(500).json({ error: "Failed to fetch topic data" });
  }
};

// Get sentiment trend over time for specific sentiment or classification
export const getSentimentTrend = async (req, res) => {
  try {
    const { firebaseUid, sentiment, classification, months = 5 } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    // At least one filter must be provided
    if (!sentiment && !classification) {
      return res
        .status(400)
        .json({ error: "Either sentiment or classification is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build match criteria based on parameters
    const matchCriteria = { userId: user._id };
    if (sentiment) matchCriteria["AIAnalysis.sentiment"] = sentiment;
    if (classification)
      matchCriteria["AIAnalysis.classification"] = classification;

    // Aggregate to get trend data
    const trendData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$emailDate" } },
          count: { $sum: 1 },
          averageScore: { $avg: "$AIAnalysis.sentimentScore" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: parseInt(months) },
    ]);

    // Format the response to be friendly for charts
    const formattedData = trendData.map((item) => {
      // Convert YYYY-MM to abbreviated month name
      const dateParts = item._id.split("-");
      const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1);
      const monthName = date.toLocaleString("default", { month: "short" });

      return {
        month: monthName,
        score: parseFloat(item.averageScore.toFixed(2)),
        count: item.count,
      };
    });

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching sentiment trend:", error);
    res.status(500).json({ error: "Failed to fetch trend data" });
  }
};

// Get metrics data for a specific classification or sentiment
export const getMetricsData = async (req, res) => {
  try {
    const { firebaseUid, classification, sentiment } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!classification && !sentiment) {
      return res
        .status(400)
        .json({ error: "Either classification or sentiment is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build match criteria based on parameters
    const matchCriteria = { userId: user._id };
    if (sentiment) matchCriteria["AIAnalysis.sentiment"] = sentiment;
    if (classification)
      matchCriteria["AIAnalysis.classification"] = classification;

    // Get total count
    const totalCount = await Email.countDocuments(matchCriteria);

    // Get average sentiment score
    const scoreData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$AIAnalysis.sentimentScore" },
        },
      },
    ]);

    // Get trend data (compare current month with previous month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth < 0) {
      previousMonth = 11;
      previousYear--;
    }

    // Current month data
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    // Previous month data
    const previousMonthStart = new Date(previousYear, previousMonth, 1);
    const previousMonthEnd = new Date(previousYear, previousMonth + 1, 0);

    const currentMonthMatch = {
      ...matchCriteria,
      emailDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
    };
    const previousMonthMatch = {
      ...matchCriteria,
      emailDate: { $gte: previousMonthStart, $lte: previousMonthEnd },
    };

    const currentMonthCount = await Email.countDocuments(currentMonthMatch);
    const previousMonthCount = await Email.countDocuments(previousMonthMatch);

    // Calculate trend percentage
    let trendPercentage = 0;
    if (previousMonthCount > 0) {
      trendPercentage =
        ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    }

    // Get top sender
    const topSenderData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$from",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    // Calculate response rate (this would require actual response data which we may not have)
    // For now, let's calculate a random rate between 70-100% as a placeholder
    const responseRate = Math.floor(Math.random() * 30) + 70;

    // Format the response
    const metrics = {
      totalCount,
      avgScore:
        scoreData.length > 0
          ? parseFloat(scoreData[0].avgScore.toFixed(2))
          : 0.5,
      trending: trendPercentage.toFixed(0) + "%",
      trendingClass: trendPercentage >= 0 ? "text-green-500" : "text-red-500",
      trendingDirection: trendPercentage >= 0 ? "↑" : "↓",
      topSender:
        topSenderData.length > 0
          ? (topSenderData[0]._id || "Unknown").split("@")[0]
          : "Various",
      responseRate,
    };

    res.json({ metrics });
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    res.status(500).json({ error: "Failed to fetch metrics data" });
  }
};
