"use client";

import { CalendarEvent } from "../hooks";
import { useCallback } from "react";

interface CalendarGridProps {
  calendarDays: Date[];
  events: CalendarEvent[];
  currentDate: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarGrid({
  calendarDays,
  events,
  currentDate,
  onDayClick,
  onEventClick,
}: CalendarGridProps) {
  // Day names for the calendar header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Find events for a specific day
  const getEventsForDate = useCallback(
    (date: Date) => {
      if (!events || !events.length) return [];

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return events.filter((event) => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startOfDay && eventStart <= endOfDay;
      });
    },
    [events]
  );

  // Check if a date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // Check if a date is in the current month
  const isCurrentMonth = useCallback(
    (date: Date) => {
      return date.getMonth() === currentDate.getMonth();
    },
    [currentDate]
  );

  // Handle day click
  const handleDayClick = useCallback(
    (date: Date) => {
      console.log("Day clicked:", date.toLocaleDateString());
      onDayClick(date);
    },
    [onDayClick]
  );

  // Handle event click
  const handleEventClick = useCallback(
    (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation(); // This is critical to prevent the day click from firing
      console.log("Event clicked:", event.title);
      onEventClick(event);
    },
    [onEventClick]
  );

  return (
    <div className="grid grid-cols-7 gap-px bg-base-200">
      {/* Day Headers */}
      {dayNames.map((day) => (
        <div key={day} className="p-2 text-center font-medium bg-base-100">
          {day}
        </div>
      ))}

      {/* Calendar Cells */}
      {calendarDays.map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonthDay = isCurrentMonth(day);

        return (
          <div
            key={index}
            className={`min-h-[100px] p-1 bg-base-100 ${
              isToday(day) ? "ring-2 ring-inset ring-primary" : ""
            } ${
              isCurrentMonthDay
                ? "text-base-content hover:bg-base-200 cursor-pointer"
                : "text-base-content/40"
            }`}
            onClick={(e) => {
              // Only trigger for current month days
              if (isCurrentMonthDay) {
                handleDayClick(day);
              }
            }}
          >
            {/* Date Number */}
            <div className="text-right p-1">{day.getDate()}</div>

            {/* Events */}
            <div className="space-y-1 mt-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="px-2 py-1 text-xs rounded truncate cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: event.color,
                    color: "white",
                  }}
                  onClick={(e) => handleEventClick(e, event)}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div
                  className="text-xs text-right px-1 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent day click
                    // Show first event for now when clicking "+X more"
                    if (dayEvents.length > 0) {
                      onEventClick(dayEvents[0]);
                    }
                  }}
                >
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
