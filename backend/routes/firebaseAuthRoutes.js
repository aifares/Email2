import express from "express";
import {
  authenticateUser,
  getUserByFirebaseUid,
} from "../controllers/firebaseAuthController.js";

const router = express.Router();

// Route to authenticate or create user with Firebase
router.post("/login", authenticateUser);

// Route to get user by Firebase UID
router.get("/user/:firebaseUid", getUserByFirebaseUid);

export default router;
