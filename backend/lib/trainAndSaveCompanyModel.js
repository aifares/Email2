// scripts/trainAndSaveModel.js
import { NlpManager } from "node-nlp";
import { connectToDatabase } from "@/lib/mongoose";
// adjust path to wherever connectToDatabase is located
import CompanyModel from "@/Models/CompanyModel";

// If using environment variables:
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/myDB";

/**
 * Train and save an NLP model for a given company
 * @param {string} companyId - Identifier for the company (e.g., "companyA")
 * @param {Array} trainingData - Array of { utterance, intent } objects
 */
export async function trainAndSaveCompanyModel(companyId, trainingData) {
  // 1) Connect to database via your shared utility
  await connectToDatabase(MONGODB_URI);

  // 2) Create and configure the NLP Manager
  const manager = new NlpManager({ languages: ["en"], forceNER: true });
  // Add training data
  trainingData.forEach(({ utterance, intent }) => {
    manager.addDocument("en", utterance, intent);
  });

  console.log(`Training model for '${companyId}'...`);
  await manager.train();
  console.log("Training completed.");

  // 3) Export JSON
  const modelJson = manager.export(true);

  // 4) Upsert in MongoDB
  let doc = await CompanyModel.findOne({ companyId });
  if (!doc) {
    doc = new CompanyModel({ companyId });
  }
  doc.model = modelJson;
  doc.updatedAt = new Date();

  await doc.save();
  console.log(`Model saved for '${companyId}'.`);
}

// If run directly from CLI (e.g. `node scripts/trainAndSaveModel.js companyA`)
if (import.meta.url === `file://${process.argv[1]}`) {
  // 1) Parse the company name from CLI arguments
  const args = process.argv.slice(2);
  const companyId = args[0] || "defaultCompany";

  // 2) Define or load training data (example)
  const trainingData = [
    { utterance: "Hello", intent: "greeting" },
    { utterance: "I need help", intent: "support" },
    { utterance: "Can I buy a product?", intent: "product_inquiry" },
  ];

  // 3) Run the training script
  trainAndSaveCompanyModel(companyId, trainingData)
    .then(() => {
      console.log(`Done training & saving model for ${companyId}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
