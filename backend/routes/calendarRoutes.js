import express from "express";
import { getEvents, addEvent } from "../controllers/calendarController.js";
// TODO: Add middleware for authentication/authorization if needed later

const router = express.Router();

// GET /api/calendar/events?firebaseUid=...&start=...&end=...
router.get("/events", getEvents);

// POST /api/calendar/events?firebaseUid=...
router.post("/events", addEvent);

// Add routes for update/delete later if implemented
// router.patch('/events/:eventId', updateEvent);
// router.delete('/events/:eventId', deleteEvent);

export default router;
