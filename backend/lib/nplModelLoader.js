// lib/nlpModelLoader.js
import { NlpManager } from "node-nlp";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME;
const MODEL_COLLECTION = process.env.MONGODB_COLLECTION;
const MODEL_NAME = process.env.MODEL_NAME;

let nlpManager = null; // in-memory singleton

export async function loadModel() {
  if (nlpManager) return nlpManager;

  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(MODEL_COLLECTION);

  const doc = await collection.findOne({ name: MODEL_NAME });
  if (!doc) {
    throw new Error(`No model found with name "${MODEL_NAME}".`);
  }

  // Create NlpManager and import
  nlpManager = new NlpManager({ languages: ["en"], forceNER: true });
  nlpManager.import(doc.model);

  await client.close();
  return nlpManager;
}
