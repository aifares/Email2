import express from "express";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";
import {
  getEmails,
  getThreadById,
  replyEmail,
  getSenderEmails,
  resolveThread,
} from "../controllers/threadController.js";
import { searchEmails } from "../controllers/searchController.js";
import { analyzeAndSaveAllEmails } from "../controllers/analyzeController.js";
import { generateReply } from "../controllers/emailController.js";

const router = express.Router();

router.get("/", cacheMiddleware, getEmails);
router.get("/thread/:threadId", getThreadById);
router.post("/reply", replyEmail);
router.get("/search", searchEmails);
router.post("/analyze-all", analyzeAndSaveAllEmails);
router.post("/generate-reply", generateReply);
router.get("/sender-emails/:email", getSenderEmails);
router.post("/resolve-thread", resolveThread);

export default router;
