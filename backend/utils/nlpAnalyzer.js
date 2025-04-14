import natural from "natural";
import aposToLexForm from "apos-to-lex-form";
import SpellCorrector from "spelling-corrector";
import stopword from "stopword";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the default classifier model
const DEFAULT_CLASSIFIER_PATH = path.join(__dirname, '../data/defaultClassifier.json');

// Initialize the sentiment analyzer
const analyzer = new natural.SentimentAnalyzer(
  "English",
  natural.PorterStemmer,
  "afinn"
);

// Create and train the default classifier
const createDefaultClassifier = () => {
  const classifier = new natural.BayesClassifier();

  // Train the classifier with example patterns
  classifier.addDocument("how do I", "Inquiry");
  classifier.addDocument("can you help", "Inquiry");
  classifier.addDocument("question about", "Inquiry");
  classifier.addDocument("need assistance", "Support");
  classifier.addDocument("help me with", "Support");
  classifier.addDocument("technical issue", "Support");
  classifier.addDocument("not working", "Support");
  classifier.addDocument("complaint", "Complaint");
  classifier.addDocument("unhappy with", "Complaint");
  classifier.addDocument("disappointed", "Complaint");
  classifier.addDocument("feedback", "Feedback");
  classifier.addDocument("suggestion", "Feedback");
  classifier.addDocument("improve", "Feedback");
  classifier.addDocument("thank you", "Feedback");
  classifier.addDocument("payment", "Billing");
  classifier.addDocument("invoice", "Billing");
  classifier.addDocument("price", "Billing");
  classifier.addDocument("urgent", "Urgent");
  classifier.addDocument("asap", "Urgent");
  classifier.addDocument("emergency", "Urgent");

  classifier.train();
  
  // Ensure the data directory exists
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Save the classifier to a file - using the correct method
  const classifierJson = JSON.stringify(classifier);
  fs.writeFileSync(DEFAULT_CLASSIFIER_PATH, classifierJson);
  
  return classifierJson;
};

// Get the default classifier model (create if it doesn't exist)
export const getDefaultClassifierModel = () => {
  try {
    if (fs.existsSync(DEFAULT_CLASSIFIER_PATH)) {
      return fs.readFileSync(DEFAULT_CLASSIFIER_PATH, 'utf8');
    } else {
      return createDefaultClassifier();
    }
  } catch (error) {
    console.error("Error getting default classifier:", error);
    return createDefaultClassifier();
  }
};

// Load a classifier from a JSON string
export const loadClassifierFromJson = (jsonString) => {
  try {
    // Parse the JSON string to get the classifier data
    const classifierData = JSON.parse(jsonString);
    
    // Create a new classifier and restore from the data
    return natural.BayesClassifier.restore(classifierData);
  } catch (error) {
    console.error("Error loading classifier from JSON:", error);
    // If there's an error, create and return a new classifier
    const classifier = new natural.BayesClassifier();
    classifier.train();
    return classifier;
  }
};

// Helper function to preprocess text
const preprocessText = (text) => {
  if (!text) return "";
  const lexedText = aposToLexForm(text);
  const casedText = lexedText.toLowerCase();
  const alphaOnlyText = casedText.replace(/[^a-zA-Z\s]+/g, "");
  const words = alphaOnlyText.split(" ");
  const filteredWords = stopword.removeStopwords(words);
  return filteredWords.join(" ");
};

// Analyze text for sentiment and classification using a specific classifier model
export const analyzeTextWithModel = (text, classifierModel) => {
  try {
    const preprocessedText = preprocessText(text);
    const sentiment = analyzer.getSentiment(preprocessedText.split(" "));
    
    // Load the classifier from the model
    const classifier = loadClassifierFromJson(classifierModel);
    const classification = classifier.classify(preprocessedText);

    return {
      sentiment:
        sentiment > 0 ? "Positive" : sentiment < 0 ? "Negative" : "Neutral",
      sentimentScore: sentiment,
      classification,
    };
  } catch (error) {
    console.error("Error analyzing text with model:", error);
    return {
      sentiment: "Neutral",
      sentimentScore: 0,
      classification: "Unknown",
    };
  }
};

// Analyze text using the default classifier (for backward compatibility)
export const analyzeText = (text) => {
  try {
    const preprocessedText = preprocessText(text);
    const sentiment = analyzer.getSentiment(preprocessedText.split(" "));
    
    // Load the default classifier
    const classifierJson = getDefaultClassifierModel();
    const classifier = loadClassifierFromJson(classifierJson);
    const classification = classifier.classify(preprocessedText);

    return {
      sentiment:
        sentiment > 0 ? "Positive" : sentiment < 0 ? "Negative" : "Neutral",
      sentimentScore: sentiment,
      classification,
    };
  } catch (error) {
    console.error("Error analyzing text:", error);
    return {
      sentiment: "Neutral",
      sentimentScore: 0,
      classification: "Unknown",
    };
  }
};
