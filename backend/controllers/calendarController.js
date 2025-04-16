import CalendarEvent from "../models/CalendarEvent.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get calendar events for a user within a date range
export const getEvents = async (req, res) => {
  try {
    const { userId, start, end } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Default to current month if no dates provided
    const startDate = start ? new Date(start) : new Date();
    startDate.setHours(0, 0, 0, 0);
    if (!start) {
      startDate.setDate(1); // First day of month
    }

    const endDate = end ? new Date(end) : new Date(startDate);
    if (!end) {
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month
    }
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const events = await CalendarEvent.find({
      userId: userId,
      startTime: { $gte: startDate },
      endTime: { $lte: endDate },
    }).sort({ startTime: 1 });

    res.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({
      error: "Failed to fetch calendar events",
      message: error.message,
    });
  }
};

// Add a new event to the calendar
export const addEvent = async (req, res) => {
  try {
    const { userId } = req.query;
    const eventData = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!eventData.title) {
      return res.status(400).json({ error: "Event title is required" });
    }

    if (!eventData.startTime || !eventData.endTime) {
      return res
        .status(400)
        .json({ error: "Start time and end time are required" });
    }

    const newEvent = new CalendarEvent({
      userId,
      title: eventData.title,
      description: eventData.description || "",
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      location: eventData.location || "",
      isAllDay: eventData.isAllDay || false,
      attendees: eventData.attendees || [],
      isRecurring: eventData.isRecurring || false,
      recurrencePattern: eventData.recurrencePattern || "",
      reminderMinutes: eventData.reminderMinutes || 15,
      color: eventData.color || "#4285f4",
      relatedEmailIds: eventData.relatedEmailIds || [],
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      event: savedEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({
      error: "Failed to create calendar event",
      message: error.message,
    });
  }
};

// Update an existing event
export const updateEvent = async (req, res) => {
  try {
    const { userId } = req.query;
    const { eventId } = req.params;
    const eventData = req.body;

    if (!userId || !eventId) {
      return res
        .status(400)
        .json({ error: "User ID and Event ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const existingEvent = await CalendarEvent.findOne({
      _id: eventId,
      userId: userId,
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Update fields if provided in request
    const updateData = {
      ...(eventData.title && { title: eventData.title }),
      ...(eventData.description !== undefined && {
        description: eventData.description,
      }),
      ...(eventData.startTime && { startTime: new Date(eventData.startTime) }),
      ...(eventData.endTime && { endTime: new Date(eventData.endTime) }),
      ...(eventData.location !== undefined && { location: eventData.location }),
      ...(eventData.isAllDay !== undefined && { isAllDay: eventData.isAllDay }),
      ...(eventData.attendees && { attendees: eventData.attendees }),
      ...(eventData.isRecurring !== undefined && {
        isRecurring: eventData.isRecurring,
      }),
      ...(eventData.recurrencePattern !== undefined && {
        recurrencePattern: eventData.recurrencePattern,
      }),
      ...(eventData.reminderMinutes !== undefined && {
        reminderMinutes: eventData.reminderMinutes,
      }),
      ...(eventData.color && { color: eventData.color }),
      ...(eventData.relatedEmailIds && {
        relatedEmailIds: eventData.relatedEmailIds,
      }),
    };

    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      eventId,
      { $set: updateData },
      { new: true }
    );

    res.json({
      success: true,
      event: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({
      error: "Failed to update calendar event",
      message: error.message,
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { userId } = req.query;
    const { eventId } = req.params;

    if (!userId || !eventId) {
      return res
        .status(400)
        .json({ error: "User ID and Event ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const result = await CalendarEvent.findOneAndDelete({
      _id: eventId,
      userId: userId,
    });

    if (!result) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({
      error: "Failed to delete calendar event",
      message: error.message,
    });
  }
};

// Get availability for a specific date
export const getAvailability = async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({ error: "User ID and date are required" });
    }

    // Set up date range for the specific day (midnight to midnight)
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all events for the user on the specified date
    const events = await CalendarEvent.find({
      userId: userId,
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay },
    }).sort({ startTime: 1 });

    // Default working hours (9 AM to 5 PM)
    const workDayStart = new Date(targetDate);
    workDayStart.setHours(9, 0, 0, 0);

    const workDayEnd = new Date(targetDate);
    workDayEnd.setHours(17, 0, 0, 0);

    // Find busy time slots from events
    const busySlots = events.map((event) => ({
      start: new Date(Math.max(event.startTime, startOfDay)),
      end: new Date(Math.min(event.endTime, endOfDay)),
    }));

    // Merge overlapping busy slots
    const mergedBusySlots = [];
    if (busySlots.length > 0) {
      busySlots.sort((a, b) => a.start - b.start);
      let currentSlot = busySlots[0];

      for (let i = 1; i < busySlots.length; i++) {
        const slot = busySlots[i];
        if (slot.start <= currentSlot.end) {
          // Overlapping slots - merge them
          currentSlot.end = new Date(Math.max(currentSlot.end, slot.end));
        } else {
          // Non-overlapping - add current slot to result and move to next
          mergedBusySlots.push(currentSlot);
          currentSlot = slot;
        }
      }
      mergedBusySlots.push(currentSlot);
    }

    // Calculate available slots between working hours
    const availableSlots = [];
    let timePointer = new Date(workDayStart);

    for (const busySlot of mergedBusySlots) {
      // If busy slot starts after current pointer, we have free time
      if (busySlot.start > timePointer) {
        availableSlots.push({
          start: new Date(timePointer),
          end: new Date(busySlot.start),
        });
      }
      // Move pointer to end of current busy slot
      timePointer = new Date(Math.max(timePointer, busySlot.end));
    }

    // Add final available slot if there's time left in the work day
    if (timePointer < workDayEnd) {
      availableSlots.push({
        start: new Date(timePointer),
        end: new Date(workDayEnd),
      });
    }

    res.json({
      date: targetDate,
      workingHours: {
        start: workDayStart,
        end: workDayEnd,
      },
      busySlots: mergedBusySlots,
      availableSlots: availableSlots,
    });
  } catch (error) {
    console.error("Error calculating availability:", error);
    res.status(500).json({
      error: "Failed to calculate availability",
      message: error.message,
    });
  }
};
