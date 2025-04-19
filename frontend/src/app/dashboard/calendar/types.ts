// --- Event Type Definition ---
export interface CalendarEvent {
  id: string;
  title: string; // Corresponds to Name
  start?: string; // ISO string or just date 'YYYY-MM-DD'
  end?: string; // ISO string or just date 'YYYY-MM-DD'
  allDay?: boolean;
  extendedProps: {
    description?: string;
    location?: string; // Added location
    date?: string; // Original date part if needed
    time?: string; // Original time part if needed
  };
}

// --- Type for Add Event Handler ---
export type AddEventHandler = (eventData: AddEventFormData) => void;

// Type for the structure returned by the backend /api/calendar/events GET endpoint
export interface GoogleApiEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  isAllDay: boolean;
  attendees?: any[]; // Define more strictly if needed
  colorId?: string;
  recurringEventId?: string;
}

// Type for the data collected by the AddEventModal/Form
export interface AddEventFormData {
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  // Add location, etc. if your form collects them
}
