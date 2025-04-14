import express from "express";
import { addCustomType, getCustomTypes } from "../controllers/classifierController.js";

const router = express.Router();

// Add a new custom type to a user's classifier model
router.post("/types", addCustomType);

// Get all custom types from a user's classifier model
router.get("/types", getCustomTypes);

export default router; 