import User from "../Models/User.js";
import Email from "../Models/Email.js";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate insights for classifications
export const generateClassificationInsights = async (req, res) => {
  try {
    const { firebaseUid, classification } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!classification) {
      return res.status(400).json({ error: "Classification is required" });
    }

    // Find the user
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get metrics data
    const matchCriteria = {
      userId: user._id,
      "AIAnalysis.classification": classification,
    };

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

    const avgScore = scoreData.length > 0 ? scoreData[0].avgScore : 0;

    // Get sentiment distribution
    const sentimentData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$AIAnalysis.sentiment",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format the sentiment data
    const sentimentDistribution = sentimentData.map((item) => ({
      sentiment: item._id || "Neutral",
      count: item.count,
      percentage: Math.round((item.count / totalCount) * 100),
    }));

    // Get top senders
    const senderData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$from",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    // Format the sender data
    const topSenders = senderData.map((item) => ({
      sender: item._id || "Unknown",
      count: item.count,
    }));

    // Get some sample emails
    const sampleEmails = await Email.find(matchCriteria)
      .sort({ emailDate: -1 })
      .limit(3)
      .select("subject snippet emailDate");

    // Prepare the data for OpenAI
    const dataForInsights = {
      classification,
      totalCount,
      avgScore,
      sentimentDistribution,
      topSenders,
      sampleEmails: sampleEmails.map((email) => ({
        subject: email.subject,
        snippet: email.snippet,
        date: email.emailDate,
      })),
    };

    // Generate insights with OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an email analytics expert. Generate 3-5 insightful observations about the user's "${classification}" emails. Observations should be concise, data-driven, and actionable.`,
      },
      {
        role: "user",
        content: JSON.stringify(dataForInsights),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages,
      max_tokens: 250,
      temperature: 0.7,
    });

    // Extract insights
    const insights = completion.choices[0].message.content
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    res.json({ insights });
  } catch (error) {
    console.error("Error generating classification insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
    });
  }
};

// Generate insights for sentiment categories
export const generateSentimentInsights = async (req, res) => {
  try {
    const { firebaseUid, sentiment } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!sentiment) {
      return res.status(400).json({ error: "Sentiment is required" });
    }

    // Find the user
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get metrics data
    const matchCriteria = {
      userId: user._id,
      "AIAnalysis.sentiment": sentiment,
    };

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

    const avgScore = scoreData.length > 0 ? scoreData[0].avgScore : 0;

    // Get classification distribution
    const classificationData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$AIAnalysis.classification",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format the classification data
    const classificationDistribution = classificationData.map((item) => ({
      classification: item._id || "Unclassified",
      count: item.count,
      percentage: Math.round((item.count / totalCount) * 100),
    }));

    // Get top senders
    const senderData = await Email.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$from",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    // Format the sender data
    const topSenders = senderData.map((item) => ({
      sender: item._id || "Unknown",
      count: item.count,
    }));

    // Get some sample emails
    const sampleEmails = await Email.find(matchCriteria)
      .sort({ emailDate: -1 })
      .limit(3)
      .select("subject snippet emailDate");

    // Prepare the data for OpenAI
    const dataForInsights = {
      sentiment,
      totalCount,
      avgScore,
      classificationDistribution,
      topSenders,
      sampleEmails: sampleEmails.map((email) => ({
        subject: email.subject,
        snippet: email.snippet,
        date: email.emailDate,
      })),
    };

    // Generate insights with OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an email analytics expert. Generate 3-5 insightful observations about the user's emails with "${sentiment}" sentiment. Observations should be concise, data-driven, and actionable.`,
      },
      {
        role: "user",
        content: JSON.stringify(dataForInsights),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages,
      max_tokens: 250,
      temperature: 0.7,
    });

    // Extract insights
    const insights = completion.choices[0].message.content
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    res.json({ insights });
  } catch (error) {
    console.error("Error generating sentiment insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
    });
  }
};

// Generate overall analytics insights
export const generateOverallInsights = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    // Find the user
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get total email count
    const totalCount = await Email.countDocuments({ userId: user._id });

    // Get sentiment distribution
    const sentimentData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$AIAnalysis.sentiment",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format the sentiment data
    const sentimentDistribution = sentimentData.map((item) => ({
      sentiment: item._id || "Neutral",
      count: item.count,
      percentage: Math.round((item.count / totalCount) * 100),
    }));

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

    // Format the classification data
    const classificationDistribution = classificationData.map((item) => ({
      classification: item._id || "Unclassified",
      count: item.count,
      percentage: Math.round((item.count / totalCount) * 100),
    }));

    // Get trend data (last 6 months)
    const volumeData = await Email.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$emailDate" } },
          count: { $sum: 1 },
          avgSentiment: { $avg: "$AIAnalysis.sentimentScore" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    // Prepare the data for OpenAI
    const dataForInsights = {
      totalCount,
      sentimentDistribution,
      classificationDistribution,
      volumeTrend: volumeData.map((item) => ({
        month: item._id,
        count: item.count,
        avgSentiment: item.avgSentiment,
      })),
    };

    // Generate insights with OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an email analytics expert. Generate 4-6 insightful observations about the user's email patterns based on the provided data. Observations should be concise, data-driven, and actionable. Focus on trends, distributions, and interesting patterns.`,
      },
      {
        role: "user",
        content: JSON.stringify(dataForInsights),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or another model like "gpt-3.5-turbo"
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    // Extract insights
    const insights = completion.choices[0].message.content
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    res.json({ insights });
  } catch (error) {
    console.error("Error generating overall insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
    });
  }
};
