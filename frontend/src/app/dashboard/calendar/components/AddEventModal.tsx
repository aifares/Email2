"use client";

import React, { useState, useEffect } from "react";
import type { AddEventHandler } from "../types"; // Import shared type

// --- New Add Event Modal (General Purpose) ---
interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: AddEventHandler;
}

export const AddEventModal = ({
  isOpen,
  onClose,
  onAddEvent,
}: AddEventModalProps) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(
    () => new Date().toISOString().split("T")[0]
  ); // Default to today
  const [eventTime, setEventTime] = useState("10:00");
  const [eventDescription, setEventDescription] = useState("");
  const [isVisible, setIsVisible] = useState(false); // For transition

  // --- Moved resetForm function definition BEFORE useEffect that uses it ---
  const resetForm = () => {
    setEventName("");
    setEventDate(new Date().toISOString().split("T")[0]);
    setEventTime("10:00");
    setEventDescription("");
  };
  // --- End of moved function ---

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      resetForm(); // Now defined before use
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleAddClick = () => {
    if (!eventName.trim() || !eventDate || !eventTime) {
      alert("Please fill in Event Name, Date, and Time.");
      return;
    }
    onAddEvent({
      title: eventName,
      description: eventDescription,
      date: eventDate,
      time: eventTime,
    });
    resetForm();
    onClose(); // Close modal after adding
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${
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
            Add New Event
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

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="addEventName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name *
            </label>
            <input
              type="text"
              id="addEventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="addEventDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date *
              </label>
              <input
                type="date"
                id="addEventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>
            <div>
              <label
                htmlFor="addEventTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Time *
              </label>
              <input
                type="time"
                id="addEventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="addEventDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="addEventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-5 mt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm sm:text-base transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm sm:text-base transition-colors"
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
};
