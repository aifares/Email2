// models/CompanyModel.js
import mongoose from "mongoose";

const CompanyModelSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    // you could use a _id for each company, or keep separate if you prefer
  },
  // node-nlp model JSON (serialized string).
  // You could also use Schema.Types.Mixed if you want an object.
  // But typically "string" is enough for the large exported JSON.
  model: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.CompanyModel ||
  mongoose.model("CompanyModel", CompanyModelSchema);
