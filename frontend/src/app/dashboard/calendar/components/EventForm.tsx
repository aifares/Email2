"use client";

import { FormEvent, ChangeEvent, useCallback } from "react";
import { CalendarEvent } from "./hooks";

interface EventFormProps {
  selectedDate: Date | null;
  newEvent: Omit<CalendarEvent, "id" | "userId">;
  onInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function EventForm({
  selectedDate,
  newEvent,
  onInputChange,
  onSubmit,
  onCancel,
}: EventFormProps) {
  // Available colors for events
  const eventColors = [
    "#4285f4", // Blue
    "#ea4335", // Red
    "#34a853", // Green
    "#fbbc05", // Yellow
    "#673ab7", // Purple
    "#ff5722", // Orange
  ];

  // Handle color selection
  const handleColorSelect = useCallback(
    (color: string) => {
      console.log("Color selected:", color);

      // Create a synthetic event
      const syntheticEvent = {
        target: {
          name: "color",
          value: color,
          type: "text",
        },
      } as unknown as ChangeEvent<HTMLInputElement>;

      onInputChange(syntheticEvent);
    },
    [onInputChange]
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Event Title</span>
        </label>
        <input
          type="text"
          name="title"
          value={newEvent.title}
          onChange={onInputChange}
          className="input input-bordered"
          placeholder="Meeting with Client"
          required
        />
      </div>

      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          name="description"
          value={newEvent.description}
          onChange={onInputChange}
          className="textarea textarea-bordered"
          placeholder="Event details..."
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Start Time</span>
          </label>
          <input
            type="datetime-local"
            name="startTime"
            value={newEvent.startTime}
            onChange={onInputChange}
            className="input input-bordered"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">End Time</span>
          </label>
          <input
            type="datetime-local"
            name="endTime"
            value={newEvent.endTime}
            onChange={onInputChange}
            className="input input-bordered"
            required
          />
        </div>
      </div>

      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text">Location</span>
        </label>
        <input
          type="text"
          name="location"
          value={newEvent.location}
          onChange={onInputChange}
          className="input input-bordered"
          placeholder="Office or Virtual Meeting"
        />
      </div>

      <div className="form-control mt-4">
        <label className="label cursor-pointer">
          <span className="label-text">All Day Event</span>
          <input
            type="checkbox"
            name="isAllDay"
            checked={newEvent.isAllDay}
            onChange={onInputChange}
            className="checkbox checkbox-primary"
          />
        </label>
      </div>

      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text">Event Color</span>
        </label>
        <div className="flex gap-2">
          {eventColors.map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-full cursor-pointer hover:ring-1 hover:ring-offset-1 ${
                newEvent.color === color
                  ? "ring-2 ring-offset-2 ring-primary"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            ></div>
          ))}
        </div>
      </div>

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Event
        </button>
      </div>
    </form>
  );
}
