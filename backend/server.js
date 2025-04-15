import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import { connectToDatabase } from "./lib/mongoose.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import classifierRoutes from "./routes/classifierRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import firebaseAuthRoutes from "./routes/firebaseAuthRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Cleanup on server shutdown
process.on("SIGINT", () => {
  console.log("Server shutting down...");
  process.exit(0);
});

// Connect to MongoDB and start server
console.log("Attempting to connect to MongoDB...");
connectToDatabase()
  .then(() => {
    app.listen(3001, () => {
      console.log("Server listening on http://localhost:3001");
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/emails", emailRoutes);
app.use("/api/classifier", classifierRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/agents", agentRoutes);
app.use("/insights", insightRoutes);
app.use("/firebase-auth", firebaseAuthRoutes);
