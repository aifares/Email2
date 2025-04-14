import express from "express";
import User from "../Models/User.js";
import { getDefaultClassifierModel } from "../utils/nlpAnalyzer.js";
import {
  getUserSettings,
  updateUserSettings,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({
        error: "Email and Firebase UID are required",
      });
    }

    let user = await User.findOne({
      $or: [{ email: email }, { firebaseUid: firebaseUid }],
    });

    if (user) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // Get the default classifier model
    const defaultClassifierModel = getDefaultClassifierModel();

    user = new User({
      email,
      firebaseUid,
      lastUpdated: new Date(),
      classifierModel: defaultClassifierModel, // Save the default classifier model
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

// Get user settings
router.get("/settings", getUserSettings);

// Update user settings
router.put("/settings", updateUserSettings);

export default router;
