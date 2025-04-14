import Agent from "../Models/Agent.js";
import User from "../Models/User.js";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all agents for a user
export const getAgents = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    // Find the user first
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find all agents for this user
    const agents = await Agent.find({ user: user._id }).sort({ createdAt: -1 });

    res.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({ error: "Failed to fetch agents" });
  }
};

// Get a single agent
export const getAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json({ agent });
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({ error: "Failed to fetch agent" });
  }
};

// Create a new agent
export const createAgent = async (req, res) => {
  try {
    const { firebaseUid, name, description, prompt, trainingData } = req.body;

    if (!firebaseUid || !name) {
      return res
        .status(400)
        .json({ error: "Firebase UID and name are required" });
    }

    // Find the user first
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const agent = new Agent({
      user: user._id,
      firebaseUid,
      name,
      description,
      prompt,
      trainingData: trainingData || [],
    });

    await agent.save();

    // Add the agent to the user's agents array
    user.agents.push(agent._id);
    await user.save();

    res.status(201).json({ agent });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({ error: "Failed to create agent" });
  }
};

// Update an agent
export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, prompt, trainingData, firebaseUid } = req.body;

    // Find the user first to verify ownership
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Verify that this agent belongs to the user
    if (agent.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You don't have permission to update this agent" });
    }

    agent.name = name || agent.name;
    agent.description =
      description !== undefined ? description : agent.description;
    agent.prompt = prompt !== undefined ? prompt : agent.prompt;
    agent.trainingData = trainingData || agent.trainingData;

    await agent.save();

    res.json({ agent });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({ error: "Failed to update agent" });
  }
};

// Delete an agent
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    // Find the user first to verify ownership
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Verify that this agent belongs to the user
    if (agent.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this agent" });
    }

    // Remove the agent from the user's agents array
    user.agents = user.agents.filter((agentId) => agentId.toString() !== id);
    await user.save();

    // Delete the agent
    await Agent.findByIdAndDelete(id);

    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    res.status(500).json({ error: "Failed to delete agent" });
  }
};

// Chat with an agent
export const chatWithAgent = async (req, res) => {
  try {
    const { agentId, message, firebaseUid } = req.body;

    if (!agentId || !message || !firebaseUid) {
      return res
        .status(400)
        .json({ error: "Agent ID, message, and Firebase UID are required" });
    }

    // Find the user first to verify ownership
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Verify that this agent belongs to the user
    if (agent.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You don't have permission to use this agent" });
    }

    // Prepare the system prompt with the agent's personality
    const systemPrompt = agent.prompt || "You are a helpful AI assistant.";

    // Include training data examples if available
    const examples = agent.trainingData || [];

    // Prepare messages for OpenAI
    const messages = [{ role: "system", content: systemPrompt }];

    // Add training examples as context
    examples.forEach((example) => {
      if (example.input && example.output) {
        messages.push({ role: "user", content: example.input });
        messages.push({ role: "assistant", content: example.output });
      }
    });

    // Add the user's current message
    messages.push({ role: "user", content: message });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or any other model you prefer
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Extract the generated response
    const response = completion.choices[0].message.content.trim();

    res.json({ response });
  } catch (error) {
    console.error("Error chatting with agent:", error);
    res.status(500).json({
      error: "Failed to chat with agent",
      message: error.message,
    });
  }
};
