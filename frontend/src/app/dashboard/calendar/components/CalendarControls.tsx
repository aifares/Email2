"use client";

interface CalendarControlsProps {
  currentDate: Date;
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onRefresh: () => void;
}

export default function CalendarControls({
  currentDate,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onToday,
  onRefresh,
}: CalendarControlsProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <button
          className="btn btn-sm btn-ghost btn-square"
          onClick={onPrevMonth}
        >
          <span className="icon-[tabler--chevron-left] size-5"></span>
        </button>

        <h2 className="text-lg font-medium">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          className="btn btn-sm btn-ghost btn-square"
          onClick={onNextMonth}
        >
          <span className="icon-[tabler--chevron-right] size-5"></span>
        </button>

        <button className="btn btn-sm btn-ghost" onClick={onToday}>
          Today
        </button>
      </div>

      <button
        className="btn btn-sm btn-outline"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <span
          className={`icon-[tabler--refresh] size-4 ${
            isLoading ? "animate-spin" : ""
          }`}
        ></span>
        <span className="ml-1">Refresh</span>
      </button>
    </div>
  );
}
