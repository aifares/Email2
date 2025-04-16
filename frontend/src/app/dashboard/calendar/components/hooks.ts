import { useState, useEffect } from "react";

// Define the CalendarEvent interface for type safety
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  isAllDay: boolean;
  color: string;
  userId?: string;
}

// Props for the useCalendarEvents hook
interface UseCalendarEventsProps {
  userId?: string;
}

/**
 * Hook for managing calendar events
 */
export const useCalendarEvents = ({ userId }: UseCalendarEventsProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch events - in a real app, this would call an API
  const fetchEvents = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // For now, use mock data
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Team Meeting",
          description: "Weekly team sync",
          startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
          endTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
          location: "Conference Room A",
          isAllDay: false,
          color: "#4285f4",
          userId,
        },
        {
          id: "2",
          title: "Client Presentation",
          description: "Presentation of new features",
          startTime: new Date(
            new Date().setDate(new Date().getDate() + 1)
          ).toISOString(),
          endTime: new Date(
            new Date().setDate(new Date().getDate() + 1)
          ).toISOString(),
          location: "Main Office",
          isAllDay: true,
          color: "#ea4335",
          userId,
        },
        {
          id: "3",
          title: "Product Launch",
          description: "Launch of new product line",
          startTime: new Date(
            new Date().setDate(new Date().getDate() + 5)
          ).toISOString(),
          endTime: new Date(
            new Date().setDate(new Date().getDate() + 5)
          ).toISOString(),
          location: "Virtual",
          isAllDay: true,
          color: "#34a853",
          userId,
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setEvents(mockEvents);
    } catch (err) {
      setError("Failed to fetch calendar events");
      console.error("Error fetching events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new event
  const createEvent = async (newEvent: Omit<CalendarEvent, "id">) => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // Create a new event with an ID
      const event: CalendarEvent = {
        ...newEvent,
        id: Math.random().toString(36).substr(2, 9),
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setEvents((prev) => [...prev, event]);
      return event;
    } catch (err) {
      setError("Failed to create event");
      console.error("Error creating event:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing event
  const updateEvent = async (
    eventId: string,
    updatedData: Partial<CalendarEvent>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // For now, update the event in the local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, ...updatedData } : event
        )
      );

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return true;
    } catch (err) {
      setError("Failed to update event");
      console.error("Error updating event:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // For now, remove the event from the local state
      setEvents((prev) => prev.filter((event) => event.id !== eventId));

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return true;
    } catch (err) {
      setError("Failed to delete event");
      console.error("Error deleting event:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load events when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId]);

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
};
