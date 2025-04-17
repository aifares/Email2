"use client";

import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Import types and components
import type { CalendarEvent, AddEventHandler } from "./types";
import { EventModal } from "./components/EventModal";
import { AddEventModal } from "./components/AddEventModal";

// --- Calendar Page Component ---
export default function CalendarPage() {
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

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

  const handleAddEvent: AddEventHandler = (newEventData) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventData.title,
      start:
        newEventData.date && newEventData.time
          ? `${newEventData.date}T${newEventData.time}:00`
          : newEventData.date,
      extendedProps: {
        description: newEventData.description,
        date: newEventData.date,
        time: newEventData.time,
      },
    };
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    // Optionally close the specific modal after adding
    if (addEventModalOpen) closeAddEventModal();
    // Keep date modal open to see new event added to that date
    // if (dateModalOpen) closeDateModal();
  };

  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => event.extendedProps.date === selectedDate);
  }, [events, selectedDate]);

  return (
    <div className="p-4 h-screen flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Calendar
        </h1>
        <button
          onClick={openAddEventModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm sm:text-base transition-colors"
        >
          Add Event
        </button>
      </div>

      <div className="flex-grow bg-white p-1 sm:p-2 rounded-lg shadow">
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
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          height="100%"
          eventClassNames="cursor-pointer"
          eventTextColor="#374151" // gray-700
          eventBackgroundColor="#eef2ff" // indigo-50
          eventBorderColor="#c7d2fe" // indigo-200
        />
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
