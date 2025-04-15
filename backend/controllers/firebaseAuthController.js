import User from "../Models/User.js";
import { getDefaultClassifierModel } from "../utils/nlpAnalyzer.js";

// Authenticate or create user with Firebase UID
export const authenticateUser = async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Email and Firebase UID required",
      });
    }

    // Find user by email
    let user = await User.findOne({ email });

    if (user) {
      // Update Firebase UID if user exists but has a different UID
      if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }
    } else {
      // Create new user if not found
      // Get the default classifier model
      const defaultClassifierModel = getDefaultClassifierModel();

      user = new User({
        email,
        firebaseUid,
        lastUpdated: new Date(),
        classifierModel: defaultClassifierModel,
      });

      await user.save();
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error authenticating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error authenticating user",
    });
  }
};

// Get user by Firebase UID
export const getUserByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Firebase UID required",
      });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};
