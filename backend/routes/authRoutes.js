import express from "express";
import { google } from "googleapis";
import User from "../Models/User.js";

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/calendar.events",
  "email",
  "profile",
  "openid",
];

// In-memory token store (for demonstration only)
export const tokenStore = new Map();

router.get("/google", (req, res) => {
  try {
    const { firebaseUid } = req.query;
    console.log("Starting Google auth for Firebase UID:", firebaseUid);

    if (!firebaseUid) {
      throw new Error("Firebase UID is required");
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state: firebaseUid,
      prompt: "consent",
    });

    console.log("Generated auth URL, redirecting user");
    res.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    res.redirect("http://localhost:3000/dashboard?error=auth_init_failed");
  }
});

router.get("/callback", async (req, res) => {
  try {
    console.log("Received callback with code:", req.query.code);
    console.log("State (Firebase UID):", req.query.state);

    if (!req.query.code) {
      throw new Error("No authorization code received");
    }

    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const firebaseUid = req.query.state;
    if (!firebaseUid) {
      throw new Error("No Firebase UID provided in state parameter");
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          gmailEmail: data.email,
          gmailRefreshToken: tokens.refresh_token,
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      throw new Error("Failed to update user document");
    }

    tokenStore.set(data.email, tokens.access_token);

    res.cookie("userEmail", data.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect("http://localhost:3000/dashboard?connected=true");
  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorQuery =
      process.env.NODE_ENV === "development"
        ? `error=auth_failed&details=${encodeURIComponent(error.message)}`
        : "error=auth_failed";
    res.redirect(`http://localhost:3000/dashboard?${errorQuery}`);
  }
});

router.get("/user", (req, res) => {
  const userEmail = req.cookies.userEmail;
  if (!userEmail) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ email: userEmail });
});

router.get("/gmail-status", async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.gmailRefreshToken) {
      return res.json({ isConnected: false });
    }

    oauth2Client.setCredentials({
      refresh_token: user.gmailRefreshToken,
    });

    try {
      await oauth2Client.getAccessToken();
      return res.json({
        isConnected: true,
        email: user.gmailEmail,
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      return res.json({ isConnected: false });
    }
  } catch (error) {
    console.error("Error checking Gmail status:", error);
    res.status(500).json({ error: "Failed to check Gmail status" });
  }
});

export { oauth2Client };
export default router;
