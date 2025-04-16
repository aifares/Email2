"use client";

import { CalendarEvent } from "./hooks";

interface EventListProps {
  events: CalendarEvent[];
  isLoading: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

export default function EventList({
  events,
  isLoading,
  onEventClick,
}: EventListProps) {
  return (
    <div className="card bg-base-100 border border-base-200 overflow-hidden mb-4 lg:hidden">
      <div className="card-body p-0">
        <div className="p-4 border-b border-base-200">
          <h3 className="text-lg font-medium">Upcoming Events</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : events.length > 0 ? (
          <div className="divide-y divide-base-200">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-base-200 cursor-pointer"
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{event.title}</h4>
                    <p className="text-sm text-base-content/70 mb-1">
                      {event.isAllDay
                        ? new Date(event.startTime).toLocaleDateString()
                        : `${new Date(
                            event.startTime
                          ).toLocaleString()} - ${new Date(
                            event.endTime
                          ).toLocaleTimeString()}`}
                    </p>
                    {event.location && (
                      <p className="text-sm text-base-content/70">
                        <span className="icon-[tabler--map-pin] size-3.5 inline-block mr-1"></span>
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-base-content/70">
            <p>No events scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
