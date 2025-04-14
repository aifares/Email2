import express from "express";
import {
  generateClassificationInsights,
  generateSentimentInsights,
  generateOverallInsights,
} from "../controllers/insightController.js";

const router = express.Router();

router.get("/classification", generateClassificationInsights);
router.get("/sentiment", generateSentimentInsights);
router.get("/overall", generateOverallInsights);

export default router;
