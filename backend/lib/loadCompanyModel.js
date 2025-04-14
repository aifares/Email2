import CompanyModel from "@/Models/CompanyModel";
import { connectToDatabase } from "./mongoose";
import { NlpManager } from "node-nlp";

const cache = {}; // { [companyId]: NlpManager }

export async function loadCompanyModel(companyId) {
  if (cache[companyId]) return cache[companyId];

  await connectToDatabase();
  const doc = await CompanyModel.findOne({ companyId }).lean();
  if (!doc || !doc.model) {
    throw new Error(`No model found for companyId: ${companyId}`);
  }
  const manager = new NlpManager({ languages: ["en"], forceNER: true });
  manager.import(doc.model);
  cache[companyId] = manager;
  return manager;
}
