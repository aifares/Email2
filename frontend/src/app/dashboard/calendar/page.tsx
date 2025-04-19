"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

// Import types and components
import type { CalendarEvent, AddEventHandler, GoogleApiEvent } from "./types"; // Added GoogleApiEvent type
import { EventModal } from "./components/EventModal";
import { AddEventModal } from "./components/AddEventModal";

// Helper to format events from Google API to FullCalendar format
const formatEventForFullCalendar = (
  apiEvent: GoogleApiEvent
): CalendarEvent => ({
  id: apiEvent.id,
  title: apiEvent.title,
  start: apiEvent.startTime, // Google API provides ISO strings
  end: apiEvent.endTime,
  allDay: apiEvent.isAllDay,
  extendedProps: {
    description: apiEvent.description,
    location: apiEvent.location,
    // Keep original dates/times if needed for modals
    date: apiEvent.isAllDay ? apiEvent.startTime.split("T")[0] : undefined,
    time: !apiEvent.isAllDay
      ? apiEvent.startTime.split("T")[1]?.substring(0, 5)
      : undefined,
  },
  // Add other FullCalendar props based on Google data if needed
  // backgroundColor: apiEvent.colorId ? mapColorIdToHex(apiEvent.colorId) : undefined,
});

// --- Calendar Page Component ---
export default function CalendarPage() {
  const { user } = useAuth(); // Get user info
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch events from backend
  const fetchEvents = useCallback(
    async (startStr?: string, endStr?: string) => {
      if (!user?.uid) return;
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ firebaseUid: user.uid });
        if (startStr) params.append("start", startStr);
        if (endStr) params.append("end", endStr);

        // TODO: Replace with your actual backend URL
        const response = await fetch(
          `http://localhost:3001/api/calendar/events?${params.toString()}`,
          {
            credentials: "include", // If using cookies for session
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch calendar events"
          );
        }

        const data: { events: GoogleApiEvent[] } = await response.json();
        const formattedEvents = data.events.map(formatEventForFullCalendar);
        setEvents(formattedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setEvents([]); // Clear events on error
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid]
  ); // Depend on user ID

  // Fetch events on initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // fetchEvents is stable due to useCallback

  // TODO: Consider fetching events when the calendar view changes
  // using FullCalendar's datesSet prop
  // const handleDatesSet = (arg: { startStr: string; endStr: string }) => {
  //   fetchEvents(arg.startStr, arg.endStr);
  // };

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setDateModalOpen(true);
  };

  const closeDateModal = () => {
    setDateModalOpen(false);
  };

  const openAddEventModal = () => {
    setAddEventModalOpen(true);
  };

  const closeAddEventModal = () => {
    setAddEventModalOpen(false);
  };

  const handleAddEvent: AddEventHandler = async (newEventData) => {
    if (!user?.uid) {
      setError("Authentication required to add events.");
      return;
    }

    // Convert date and time to ISO String. Handle potential timezone issues.
    // For simplicity, assuming local time input needs conversion to UTC or specific timezone.
    // A robust solution might involve a date picker library that handles timezones.
    let startTimeISO: string | undefined;
    let endTimeISO: string | undefined;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get browser's timezone

    if (newEventData.date && newEventData.time) {
      // Example: Construct ISO string WITH timezone offset
      // You might need a library like date-fns-tz or moment-timezone for reliable conversions
      try {
        const startDateTime = new Date(
          `${newEventData.date}T${newEventData.time}:00`
        );
        // Basic check if date is valid
        if (isNaN(startDateTime.getTime()))
          throw new Error("Invalid date/time format");
        // For demonstration, let's assume the input is local and we send it as such
        // Google Calendar will likely interpret it based on user's calendar settings or default to UTC
        // A better approach sends explicit timezone offset or UTC
        startTimeISO = startDateTime.toISOString(); // This will be UTC

        // Basic end time calculation (e.g., add 1 hour)
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
        endTimeISO = endDateTime.toISOString(); // This will be UTC
      } catch (e) {
        setError(
          "Invalid date or time format. Please use YYYY-MM-DD and HH:MM."
        );
        return;
      }
    } else {
      setError("Date and time are required for the event.");
      return;
    }

    const eventToSend = {
      title: newEventData.title,
      description: newEventData.description,
      startTime: startTimeISO,
      endTime: endTimeISO,
      timeZone: timeZone, // Send the user's timezone
      // Add other fields like location if available in newEventData
    };

    setIsLoading(true); // Indicate activity
    setError(null);

    try {
      // TODO: Replace with your actual backend URL
      const response = await fetch(
        `http://localhost:3001/api/calendar/events?firebaseUid=${user.uid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(eventToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add event");
      }

      // Success!
      closeAddEventModal();
      closeDateModal(); // Close both modals potentially
      fetchEvents(); // Refetch events to show the new one
    } catch (err) {
      console.error("Error adding event:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while adding the event"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    // Adjust filtering based on how start times are formatted
    return events.filter((event) => event.start?.startsWith(selectedDate));
  }, [events, selectedDate]);

  return (
    <div className="p-4 h-screen flex flex-col bg-base-200">
      {" "}
      {/* Updated bg color */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-base-300">
        {" "}
        {/* Updated border color */}
        <h1 className="text-xl sm:text-2xl font-semibold ">
          {" "}
          {/* Removed text color */}
          Calendar
        </h1>
        <button
          onClick={openAddEventModal}
          className="btn btn-primary btn-sm" // Use daisyUI button classes
        >
          Add Event
        </button>
      </div>
      {error && <div className="alert alert-error shadow-lg mb-4">{error}</div>}
      <div className="flex-grow bg-base-100 p-1 sm:p-2 rounded-lg shadow">
        {" "}
        {/* Updated bg color */}
        {isLoading && !events.length ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            dateClick={handleDateClick}
            // datesSet={handleDatesSet} // Uncomment to fetch on view change
            editable={false} // Disable editing via drag/drop for now
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            height="100%"
            eventClassNames="cursor-pointer border border-primary/30 bg-primary/10 hover:bg-primary/20"
            eventTextColor="hsl(var(--bc))" // Use daisyUI base content color
            // eventBackgroundColor removed - using classNames
            // eventBorderColor removed - using classNames
            viewDidMount={() => setIsLoading(false)} // Hide initial spinner once view renders
            loading={(isLoading) => setIsLoading(isLoading)} // Show spinner during background event fetching
          />
        )}
      </div>
      {/* Date Specific Event Modal */}
      <EventModal
        isOpen={dateModalOpen}
        onClose={closeDateModal}
        selectedDate={selectedDate}
        eventsOnDate={eventsOnSelectedDate}
        onAddEvent={handleAddEvent}
      />
      {/* General Add Event Modal */}
      <AddEventModal
        isOpen={addEventModalOpen}
        onClose={closeAddEventModal}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
