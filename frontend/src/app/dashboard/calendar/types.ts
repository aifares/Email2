// --- Event Type Definition ---
export interface CalendarEvent {
  id: string;
  title: string; // Corresponds to Name
  start: string; // Combined Date + Time
  extendedProps: {
    description: string;
    date: string; // Store original date for filtering
    time: string; // Store original time
  };
}

// --- Type for Add Event Handler ---
export type AddEventHandler = (
  newEventData: Omit<CalendarEvent, "id" | "start" | "extendedProps"> & {
    time: string;
    description: string;
    date: string;
  }
) => void;
