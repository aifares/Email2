"use client";

import React, { useState, useEffect } from "react";
import type { CalendarEvent, AddEventHandler } from "../types"; // Import shared types

// --- Refactored Event Modal (for specific date) ---
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  eventsOnDate: CalendarEvent[];
  onAddEvent: AddEventHandler;
}

export const EventModal = ({
  isOpen,
  onClose,
  selectedDate,
  eventsOnDate,
  onAddEvent,
}: EventModalProps) => {
  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("10:00");
  const [eventDescription, setEventDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // For transition

  // Effect for transitions
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow fade-out transition
      const timer = setTimeout(() => setIsVisible(false), 300); // Match duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset form fields when modal opens or form is toggled
  useEffect(() => {
    if (isOpen && !showAddForm) {
      resetForm(false); // Don't close the form view if just reopening modal
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showAddForm]);

  if (!isVisible && !isOpen) return null; // Don't render if fully closed
  if (!selectedDate && isOpen) return null; // Should not happen if logic is right, but safeguard

  const handleAddEventClick = () => {
    if (!eventName.trim()) {
      alert("Event name cannot be empty.");
      return;
    }
    if (selectedDate) {
      // Ensure selectedDate is not null
      onAddEvent({
        title: eventName,
        description: eventDescription,
        time: eventTime,
        date: selectedDate,
      });
      resetForm();
    }
  };

  const resetForm = (hideForm = true) => {
    setEventName("");
    setEventTime("10:00");
    setEventDescription("");
    if (hideForm) {
      setShowAddForm(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${
        isOpen && isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-5 sm:p-6 w-full max-w-lg z-50 transform transition-all duration-300 ease-out pointer-events-auto ${
          isOpen && isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Events on {selectedDate}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 -mr-2"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* List Existing Events - Improved Styling */}
        <div className="my-4 max-h-48 overflow-y-auto pr-2 space-y-2">
          {eventsOnDate.length > 0 ? (
            eventsOnDate.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <p className="font-medium text-gray-800">
                  {event.title}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({event.extendedProps.time})
                  </span>
                </p>
                {event.extendedProps.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {event.extendedProps.description}
                  </p>
                )}
                {/* TODO: Add Edit/Delete buttons here */}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              No events scheduled for this date.
            </p>
          )}
        </div>

        {/* Add Event Section - Toggled */}
        <div className="border-t border-gray-200 pt-4">
          {showAddForm ? (
            <div className="space-y-3">
              <h3 className="text-md sm:text-lg font-medium text-gray-700">
                Add New Event
              </h3>
              <div>
                <label
                  htmlFor="eventModalName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="eventModalName" // Unique ID
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="eventModalTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time *
                </label>
                <input
                  type="time"
                  id="eventModalTime" // Unique ID
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="eventModalDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="eventModalDescription" // Unique ID
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button" // Important for forms
                  onClick={() => resetForm()} // Pass true to hide form
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm sm:text-base transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button" // Important for forms
                  onClick={handleAddEventClick}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm sm:text-base transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm sm:text-base transition-colors"
              >
                Add Event to This Date
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
