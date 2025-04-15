import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  rowsPerPage,
  hasMore,
  onPageChange,
  onRowsPerPageChange,
}: PaginationControlsProps) => (
  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">Rows:</span>
      <div className="dropdown dropdown-top">
        <button
          className="dropdown-toggle btn btn-outline btn-xs"
          aria-expanded="false"
        >
          {rowsPerPage} <ChevronRight className="size-3 rotate-90 ml-1" />
        </button>
        <ul className="dropdown-menu shadow dropdown-open:opacity-100 hidden">
          {[5, 10, 20, 50].map((value) => (
            <li key={value} className="cursor-pointer">
              <button
                className="w-full text-start px-3 py-1 hover:bg-base-200 text-xs"
                onClick={() => onRowsPerPageChange(value)}
              >
                {value}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        className="btn btn-outline btn-xs"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="size-3" />
      </button>
      <span className="text-xs">
        Page {currentPage} {totalPages ? `of ${totalPages}` : ""}
      </span>
      <button
        className="btn btn-outline btn-xs"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
      >
        <ChevronRight className="size-3" />
      </button>
    </div>
  </div>
);
