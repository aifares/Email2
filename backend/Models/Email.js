import mongoose from "mongoose";

const EmailSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
  },
  sentiment: {
    type: String,
  },
  filter: { // Assuming 'filter' corresponds to 'classification'
    type: String,
  },
  AIAnalysis: {
    type: mongoose.Schema.Types.Mixed, // Flexible schema for AI analysis
  },
  // New email date attribute
  emailDate: {
    type: Date,
  },
  // Add a reference to the User model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Index to optimize queries. Adjust as needed based on query patterns.
EmailSchema.index({ userId: 1, threadId: 1 }, { unique: true }); // Prevent duplicate entries

export default mongoose.models.Email || mongoose.model("Email", EmailSchema);