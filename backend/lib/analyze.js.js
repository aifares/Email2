// lib/analyze.js
import { loadCompanyModel } from "./loadCompanyModel"; // Adjust the path if necessary
import Sentiment from "sentiment";

/**
 * Analyzes the given text for intent and sentiment based on the company model.
 *
 * @param {string} companyId - The ID of the company.
 * @param {string} text - The text to analyze.
 * @returns {Object} - The analysis result containing intent and sentiment.
 */
export async function analyzeText(companyId, text) {
  // Load the NLP manager for the specified company
  const manager = await loadCompanyModel(companyId);

  // Process the text to get intent using node-nlp
  const intentResult = await manager.process("en", text);
  const { intent } = intentResult;

  // Initialize Sentiment analyzer
  const sentimentAnalyzer = new Sentiment();

  // Analyze sentiment using the sentiment package
  const sentimentResult = sentimentAnalyzer.analyze(text);
  // sentimentResult includes: score, comparative, tokens, words, positive, negative

  // Determine overall sentiment vote
  let sentimentVote = "neutral";
  if (sentimentResult.score > 0) sentimentVote = "positive";
  else if (sentimentResult.score < 0) sentimentVote = "negative";

  // Structure the sentiment data
  const sentiment = {
    score: sentimentResult.score,
    comparative: sentimentResult.comparative,
    positive: sentimentResult.positive,
    negative: sentimentResult.negative,
    vote: sentimentVote,
  };

  return { intent, sentiment };
}
