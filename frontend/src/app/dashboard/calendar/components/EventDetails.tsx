"use client";

import { CalendarEvent } from "./hooks";

interface EventDetailsProps {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (id: string, data: Partial<CalendarEvent>) => Promise<boolean>;
}

export default function EventDetails({
  event,
  onClose,
  onDelete,
  onEdit,
}: EventDetailsProps) {
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event?")) {
      const success = await onDelete(event.id);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="p-4">
      {/* Event header with color indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: event.color }}
        ></div>
        <h3 className="text-xl font-semibold flex-1">{event.title}</h3>
        <button className="btn btn-sm btn-ghost btn-square" onClick={onClose}>
          <span className="icon-[tabler--x] size-5"></span>
        </button>
      </div>

      {/* Event date/time */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="icon-[tabler--calendar] size-4 text-base-content/70"></span>
          <span>
            {event.isAllDay
              ? new Date(event.startTime).toLocaleDateString()
              : new Date(event.startTime).toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
          </span>
        </div>

        {!event.isAllDay && (
          <div className="flex items-center gap-2">
            <span className="icon-[tabler--clock] size-4 text-base-content/70"></span>
            <span>
              {`${new Date(event.startTime).toLocaleTimeString()} - ${new Date(
                event.endTime
              ).toLocaleTimeString()}`}
            </span>
          </div>
        )}
      </div>

      {/* Location if available */}
      {event.location && (
        <div className="flex items-center gap-2 mb-4">
          <span className="icon-[tabler--map-pin] size-4 text-base-content/70"></span>
          <span>{event.location}</span>
        </div>
      )}

      {/* Description if available */}
      {event.description && (
        <div className="mb-4">
          <h4 className="text-sm text-base-content/70 mb-1">Description</h4>
          <p className="whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          className="btn btn-sm btn-outline btn-error"
          onClick={handleDelete}
        >
          Delete
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            // In a real app, this would open an edit form
            // For now, we'll just close the modal
            onClose();
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
