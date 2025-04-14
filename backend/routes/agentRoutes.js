import express from "express";
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  chatWithAgent,
} from "../controllers/agentController.js";

const router = express.Router();

// Get all agents for a user
router.get("/", getAgents);

// Get a single agent
router.get("/:id", getAgent);

// Create a new agent
router.post("/", createAgent);

// Update an agent
router.put("/:id", updateAgent);

// Delete an agent
router.delete("/:id", deleteAgent);

// Chat with an agent
router.post("/chat", chatWithAgent);

export default router;
