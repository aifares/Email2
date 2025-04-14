import User from "../Models/User.js";
import Email from "../Models/Email.js";
import { loadClassifierFromJson } from "../utils/nlpAnalyzer.js";
import natural from "natural";

// Add a new custom type to a user's classifier model
export const addCustomType = async (req, res) => {
  try {
    const { firebaseUid, emailType, subject, body, threadId } = req.body;

    if (!firebaseUid || !emailType || (!subject && !body)) {
      return res.status(400).json({ 
        error: "Firebase UID, email type, and either subject or body are required" 
      });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Load the user's existing classifier
    const classifier = loadClassifierFromJson(user.classifierModel);
    
    // Add the new document to the classifier
    const textToTrain = `${subject || ''} ${body || ''}`.trim();
    classifier.addDocument(textToTrain, emailType);
    
    // Retrain the classifier
    classifier.train();
    
    // Save the updated classifier back to the user model
    user.classifierModel = JSON.stringify(classifier);
    await user.save();

    // If threadId is provided, update the email's classification in the database
    if (threadId) {
      // Find the email in the database
      const email = await Email.findOne({ userId: user._id, threadId });
      
      if (email) {
        // Update the classification
        email.filter = emailType;
        if (email.AIAnalysis) {
          email.AIAnalysis.classification = emailType;
        } else {
          email.AIAnalysis = { classification: emailType };
        }
        
        // Save the updated email
        await email.save();
      }
    }

    res.json({ 
      success: true, 
      message: `Added "${emailType}" type to your classifier model` 
    });
  } catch (error) {
    console.error("Error adding custom type:", error);
    res.status(500).json({ error: "Failed to add custom type" });
  }
};

// Get all custom types from a user's classifier model
export const getCustomTypes = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Load the user's classifier
    const classifier = loadClassifierFromJson(user.classifierModel);
    
    // Extract all unique labels from the classifier
    const labels = new Set();
    
    // Access the classifier's internal data structure to get all labels
    if (classifier.docs) {
      classifier.docs.forEach(doc => {
        if (doc.label) {
          labels.add(doc.label);
        }
      });
    }
    
    res.json({ 
      types: Array.from(labels)
    });
  } catch (error) {
    console.error("Error getting custom types:", error);
    res.status(500).json({ error: "Failed to get custom types" });
  }
}; 