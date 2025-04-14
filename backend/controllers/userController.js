import User from "../Models/User.js";
import Agent from "../Models/Agent.js";

// Get user settings
export const getUserSettings = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      defaultAgentId: user.defaultAgentId || null,
      // Add other settings here as needed
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Failed to fetch user settings" });
  }
};

// Update user settings
export const updateUserSettings = async (req, res) => {
  try {
    const { firebaseUid, defaultAgentId } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update default agent
    if (defaultAgentId !== undefined) {
      // If defaultAgentId is null, remove the default agent
      if (defaultAgentId === null) {
        user.defaultAgentId = null;
      } else {
        // Verify that the agent exists and belongs to this user
        const agent = await Agent.findById(defaultAgentId);
        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        if (agent.user.toString() !== user._id.toString()) {
          return res.status(403).json({
            error: "You don't have permission to use this agent as default",
          });
        }

        user.defaultAgentId = defaultAgentId;
      }
    }

    await user.save();

    res.json({
      defaultAgentId: user.defaultAgentId,
      // Add other settings here as needed
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ error: "Failed to update user settings" });
  }
};
