import express from "express";
import {
  getClassificationDistribution,
  getSentimentOverTime,
  getEmailVolume,
  getAllAnalytics,
  getSentimentDistributionByClassification,
  getTopicsByClassification,
  getTopicsBySentiment,
  getSentimentTrend,
  getMetricsData,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/classification", getClassificationDistribution);
router.get("/sentiment", getSentimentOverTime);
router.get("/volume", getEmailVolume);
router.get("/all", getAllAnalytics);
router.get(
  "/classification/sentiment",
  getSentimentDistributionByClassification
);
router.get("/classification/topics", getTopicsByClassification);
router.get("/sentiment/topics", getTopicsBySentiment);
router.get("/sentiment/trend", getSentimentTrend);
router.get("/metrics", getMetricsData);

export default router;
