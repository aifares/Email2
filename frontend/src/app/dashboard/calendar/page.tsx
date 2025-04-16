"use client";

import {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useCalendarEvents,
  CalendarEvent,
  EventDetails,
  EventForm,
  EventList,
  CalendarControls,
  CalendarGrid,
} from "./components";

export default function CalendarPage() {
  const { user } = useAuth();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [newEvent, setNewEvent] = useState<
    Omit<CalendarEvent, "id" | "userId">
  >({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    isAllDay: false,
    color: "#4285f4",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month"); // month, week, day
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Use our custom hook for calendar events
  const {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  } = useCalendarEvents({ userId: user?.uid });

  // Generate calendar days for the current month view
  useEffect(() => {
    console.log("Generating calendar days for:", currentDate.toLocaleString());
    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // First day of month
      const firstDay = new Date(year, month, 1);
      // Last day of month
      const lastDay = new Date(year, month + 1, 0);

      // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();

      // Calculate days from previous month to show
      const daysFromPrevMonth = firstDayOfWeek;

      // Calculate total days to show (previous month days + current month days)
      const totalDays = daysFromPrevMonth + lastDay.getDate();

      // We want to show 6 weeks (42 days) in our calendar to maintain consistency
      const totalCells = 42;

      const days: Date[] = [];

      // Add days from previous month
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (
        let i = prevMonthLastDay - daysFromPrevMonth + 1;
        i <= prevMonthLastDay;
        i++
      ) {
        days.push(new Date(year, month - 1, i));
      }

      // Add days from current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      // Add days from next month
      const remainingDays = totalCells - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }

      setCalendarDays(days);
    };

    generateCalendarDays();
  }, [currentDate]);

  // Initialize the FlyOnUI components when needed
  /* // Temporarily comment out to test for conflicts
  useEffect(() => {
    const initCalendar = async () => {
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === "function"
      ) {
        console.log("Initializing HSStaticMethods"); // Add log
        window.HSStaticMethods.autoInit();
      } else {
        console.log("HSStaticMethods not found or not ready"); // Add log
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    const timeoutId = setTimeout(initCalendar, 100);

    return () => clearTimeout(timeoutId); // Cleanup timeout
  }, []);
  */ // Temporarily comment out to test for conflicts

  // Set default times when a date is selected
  useEffect(() => {
    if (selectedDate) {
      console.log("Selected date changed:", selectedDate.toLocaleString());
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(9, 0, 0, 0); // 9 AM

      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(10, 0, 0, 0); // 10 AM

      setNewEvent((prev) => ({
        ...prev,
        startTime: startDateTime.toISOString().slice(0, 16), // Format for datetime-local input
        endTime: endDateTime.toISOString().slice(0, 16), // Format for datetime-local input
        isAllDay: false,
      }));
    }
  }, [selectedDate]);

  // Handle creating a new event
  const handleAddEvent = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("Adding new event:", newEvent.title);

      try {
        // Create the new event using our hook
        const result = await createEvent({
          ...newEvent,
          userId: user?.uid,
        });

        if (result) {
          console.log("Event created successfully:", result);
          // Reset form and close modal
          setNewEvent({
            title: "",
            description: "",
            startTime: "",
            endTime: "",
            location: "",
            isAllDay: false,
            color: "#4285f4",
          });
          setSelectedDate(null);
          setIsAddEventModalOpen(false);
        }
      } catch (err) {
        console.error("Error creating event:", err);
      }
    },
    [createEvent, newEvent, user?.uid]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      console.log(
        `Form input change: ${name} = ${type === "checkbox" ? checked : value}`
      );
      setNewEvent((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    []
  );

  // Handle day click to open the add event modal
  const handleDayClick = useCallback((date: Date) => {
    console.log("Day clicked in parent component:", date.toLocaleString());
    setSelectedDate(new Date(date));
    setIsAddEventModalOpen(true);
  }, []);

  // Handle view changes
  const handleViewChange = useCallback((viewType: string) => {
    console.log("Changing view to:", viewType);
    setCurrentView(viewType);
  }, []);

  // Handle navigation
  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    console.log("Moving to previous month:", newDate.toLocaleString());
    setCurrentDate(newDate);
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    console.log("Moving to next month:", newDate.toLocaleString());
    setCurrentDate(newDate);
  }, [currentDate]);

  const handleToday = useCallback(() => {
    console.log("Moving to today");
    setCurrentDate(new Date());
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log("Event clicked in parent component:", event.title);
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log("Closing modal");
    setIsAddEventModalOpen(false);
    setSelectedDate(null);
  }, []);

  const handleCreateNewEvent = useCallback(() => {
    console.log("Opening new event form");
    setSelectedDate(new Date());
    setIsAddEventModalOpen(true);
  }, []);

  // Debug log when calendar days or events change
  useEffect(() => {
    console.log(
      `Calendar has ${calendarDays.length} days and ${events.length} events`
    );
  }, [calendarDays, events]);

  const viewOptions = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
  ];

  return (
    <div className="container mx-auto max-w-screen-xl p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-medium">Calendar</h1>

        <div className="flex gap-2">
          <div className="join">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                className={`join-item btn btn-sm ${
                  currentView === option.id ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => handleViewChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreateNewEvent}
          >
            <span className="icon-[tabler--plus] size-4 mr-1"></span>
            Add Event
          </button>
        </div>
      </div>

      {/* Display current view for debugging */}
      <div className="text-sm mb-2 text-base-content/70">
        Current view: {currentView} | {currentDate.toLocaleString()}
      </div>

      {/* Calendar Card */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden mb-4">
        <div className="card-body">
          {/* Calendar Controls Component */}
          <CalendarControls
            currentDate={currentDate}
            isLoading={isLoading}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onRefresh={refreshEvents}
          />

          {/* Calendar Component */}
          {isLoading && !events.length ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div id="calendar" className="calendar-container">
              {/* Calendar Grid Component - only show in month view */}
              {currentView === "month" && (
                <CalendarGrid
                  calendarDays={calendarDays}
                  events={events}
                  currentDate={currentDate}
                  onDayClick={handleDayClick}
                  onEventClick={handleEventClick}
                />
              )}

              {/* Week view */}
              {currentView === "week" && (
                <div className="p-4 text-center border border-base-200 rounded-lg min-h-[400px]">
                  <h3 className="text-lg font-medium mb-4">Week View</h3>
                  <p>Week view coming soon!</p>
                  <p className="text-sm text-base-content/70 mt-2">
                    Currently displaying week of{" "}
                    {new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate() - currentDate.getDay()
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Day view */}
              {currentView === "day" && (
                <div className="p-4 text-center border border-base-200 rounded-lg min-h-[400px]">
                  <h3 className="text-lg font-medium mb-4">Day View</h3>
                  <p>Day view coming soon!</p>
                  <p className="text-sm text-base-content/70 mt-2">
                    Currently displaying {currentDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 alert alert-error">
              <span className="icon-[tabler--alert-circle] size-4"></span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event List for Mobile */}
      <EventList
        events={events}
        isLoading={isLoading}
        onEventClick={handleEventClick}
      />

      {/* Add Event Modal */}
      <dialog className={`modal ${isAddEventModalOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {selectedDate
              ? `Add Event for ${selectedDate.toLocaleDateString()}`
              : "Add New Event"}
          </h3>

          <EventForm
            selectedDate={selectedDate}
            newEvent={newEvent}
            onInputChange={handleInputChange}
            onSubmit={handleAddEvent}
            onCancel={handleCloseModal}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button
            onClick={() => {
              console.log("Modal backdrop clicked");
              setIsAddEventModalOpen(false);
              setSelectedDate(null);
            }}
          >
            close
          </button>
        </form>
      </dialog>

      {/* Event Details Modal */}
      <dialog className={`modal ${selectedEvent ? "modal-open" : ""}`}>
        <div className="modal-box">
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onClose={() => {
                console.log("Closing event details");
                setSelectedEvent(null);
              }}
              onDelete={deleteEvent}
              onEdit={updateEvent}
            />
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setSelectedEvent(null)}>close</button>
        </form>
      </dialog>
    </div>
  );
}
