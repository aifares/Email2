import OpenAI from "openai";
import Agent from "../Models/Agent.js";
import User from "../Models/User.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to add this to your .env file
});

export const generateReply = async (req, res) => {
  try {
    const {
      firebaseUid,
      threadContext,
      emailSubject,
      threadId,
      agentId,
    } = req.body;

    if (!firebaseUid || !threadContext || !threadContext.length) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Format the thread context into a readable conversation
    const formattedThread = threadContext
      .map((msg, index) => {
        const date = new Date(msg.date).toLocaleString();
        const senderName = msg.from.split("<")[0].trim();
        return `Email ${index + 1}:
From: ${senderName}
Date: ${date}
Content:
${msg.body}
`;
      })
      .join("\n\n");

    let systemPrompt = `
      You are a helpful assistant that generates professional email replies.
      
      Original email subject: "${emailSubject}"
      
      Below is the complete email thread, ordered from oldest to newest:
      
      ${formattedThread}
      
      Please generate a concise, professional, and friendly reply to this email thread.
      Consider the entire conversation history when crafting your response.
      The reply should be in HTML format with appropriate paragraphs.
      Do not include any salutations like "Dear" or signatures like "Best regards" - just the main content.
      Make sure your response is contextually relevant to the entire conversation, not just the last message.
    `;

    let messages = [{ role: "system", content: systemPrompt }];

    // If an agent was specified, use the agent's prompt and training data
    if (agentId) {
      try {
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

        // Use the agent's prompt if available
        if (agent.prompt) {
          systemPrompt = `${agent.prompt}
          
          You are generating a reply to an email thread.
          
          Original email subject: "${emailSubject}"
          
          Below is the complete email thread, ordered from oldest to newest:
          
          ${formattedThread}
          
          Please generate a reply to this email thread based on your personality and training.
          Consider the entire conversation history when crafting your response.
          The reply should be in HTML format with appropriate paragraphs.
          Do not include any salutations like "Dear" or signatures like "Best regards" - just the main content.
          Make sure your response is contextually relevant to the entire conversation, not just the last message.
          `;

          messages = [{ role: "system", content: systemPrompt }];

          // Add training examples as context
          const examples = agent.trainingData || [];
          examples.forEach((example) => {
            if (example.input && example.output) {
              messages.push({ role: "user", content: example.input });
              messages.push({ role: "assistant", content: example.output });
            }
          });
        }
      } catch (error) {
        console.error("Error loading agent:", error);
        // Continue with default prompt if agent loading fails
      }
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or any other model you prefer
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract the generated reply
    const generatedReply = completion.choices[0].message.content.trim();

    res.json({ generatedReply });
  } catch (error) {
    console.error("Error generating reply:", error);
    res.status(500).json({
      error: "Failed to generate reply",
      message: error.message,
    });
  }
};
