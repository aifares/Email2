import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    gmailEmail: {
      type: String,
    },
    gmailRefreshToken: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    emailMetadata: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Email", // Reference to the Email model
      },
    ],
    agents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent", // Reference to the Agent model
      },
    ],
    defaultAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },
    classifierModel: {
      type: Object, // Store the classifier model as a JSON object
      default: null,
    },
    resolvedThreads: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Add this to help with debugging
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.gmailRefreshToken; // Don't expose the refresh token
  delete obj.classifierModel; // Don't expose the classifier model in API responses
  return obj;
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
