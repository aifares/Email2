import { google } from "googleapis";
import User from "../models/User.js";
import { oauth2Client } from "../routes/authRoutes.js"; // Import the authenticated client
// Remove MongoDB model import if not storing locally anymore
// import CalendarEvent from "../models/CalendarEvent.js";
// import mongoose from "mongoose";

// --- Google Calendar API Interaction --- //

// Helper function to get authenticated calendar API client
async function getCalendarClient(firebaseUid) {
  const user = await User.findOne({ firebaseUid });
  if (!user || !user.gmailRefreshToken) {
    throw new Error("Gmail/Calendar not connected or refresh token missing.");
  }

  // It's crucial to set credentials on the specific instance before use
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  client.setCredentials({ refresh_token: user.gmailRefreshToken });

  // Verify token is valid (optional, but good practice)
  try {
    await client.getAccessToken();
  } catch (error) {
    console.error("Error refreshing access token for calendar:", error);
    throw new Error("Failed to refresh access token for Calendar API.");
  }

  return google.calendar({ version: "v3", auth: client });
}

// Get calendar events from Google Calendar API
export const getEvents = async (req, res) => {
  try {
    const { firebaseUid, start, end } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const calendar = await getCalendarClient(firebaseUid);

    // Set timeMin and timeMax for the query
    const timeMin = start
      ? new Date(start).toISOString()
      : new Date(new Date().setDate(1)).toISOString(); // Default to start of current month

    const timeMax = end
      ? new Date(end).toISOString()
      : new Date(
          new Date(new Date().setMonth(new Date().getMonth() + 1)).setDate(0)
        ).toISOString(); // Default to end of current month

    console.log(
      `Fetching Google Calendar events from ${timeMin} to ${timeMax}`
    );

    const response = await calendar.events.list({
      calendarId: "primary", // Use the primary calendar
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items;

    // Optionally, transform events to match your frontend needs if necessary
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.summary || "(No Title)",
      description: event.description || "",
      startTime: event.start?.dateTime || event.start?.date, // Handle all-day vs timed events
      endTime: event.end?.dateTime || event.end?.date,
      location: event.location || "",
      isAllDay: !!event.start?.date, // Check if only date exists
      attendees: event.attendees || [],
      colorId: event.colorId,
      recurringEventId: event.recurringEventId, // Useful for recurring events
      // Add other fields you might need from the Google event object
    }));

    res.json({ events: formattedEvents });
  } catch (error) {
    console.error("Error fetching Google calendar events:", error);
    res.status(500).json({
      error: "Failed to fetch Google calendar events",
      message: error.message,
    });
  }
};

// Add a new event to Google Calendar API
export const addEvent = async (req, res) => {
  try {
    const { firebaseUid } = req.query;
    const eventData = req.body; // Expects { title, description, startTime, endTime, ... }

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    if (!eventData.title) {
      return res.status(400).json({ error: "Event title is required" });
    }

    if (!eventData.startTime || !eventData.endTime) {
      return res
        .status(400)
        .json({ error: "Start time and end time are required" });
    }

    const calendar = await getCalendarClient(firebaseUid);

    // Construct the event resource according to Google Calendar API format
    // https://developers.google.com/calendar/api/v3/reference/events/insert
    const event = {
      summary: eventData.title,
      location: eventData.location || null,
      description: eventData.description || null,
      start: {
        dateTime: eventData.startTime, // Expect ISO 8601 format e.g., "2024-08-15T09:00:00-07:00"
        timeZone: eventData.timeZone || "UTC", // Or infer from user settings
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || "UTC",
      },
      // attendees: eventData.attendees?.map(email => ({ email })) || [], // Example attendees format
      // reminders: { // Example reminders
      //   useDefault: false,
      //   overrides: [
      //     { method: 'email', minutes: 24 * 60 },
      //     { method: 'popup', minutes: 10 },
      //   ],
      // },
    };

    console.log("Inserting event into Google Calendar:", event);

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("Google Calendar insert response:", response.data);

    res.status(201).json({
      success: true,
      event: response.data, // Return the created Google Calendar event object
      message: "Event created successfully in Google Calendar",
    });
  } catch (error) {
    console.error("Error creating Google calendar event:", error);
    // Handle specific API errors if needed (e.g., rate limits, invalid data)
    res.status(500).json({
      error: "Failed to create Google calendar event",
      message: error.message,
    });
  }
};

// --- Existing MongoDB-based functions (commented out or removed if unused) --- //

/*
// Update an existing event
export const updateEvent = async (req, res) => {
    // ... (Original MongoDB logic)
    // TODO: Implement update using Google Calendar API (events.patch or events.update)
};

// Delete an event
export const deleteEvent = async (req, res) => {
    // ... (Original MongoDB logic)
    // TODO: Implement delete using Google Calendar API (events.delete)
};

// Get availability for a specific date
export const getAvailability = async (req, res) => {
    // ... (Original MongoDB logic)
    // TODO: Re-implement using Google Calendar Free/Busy API if needed, or fetch events and calculate locally
};
*/
