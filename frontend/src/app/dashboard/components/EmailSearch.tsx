import {
  Search,
  X,
  SlidersHorizontal,
  MessageSquareMore,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { SearchParams } from "./types";
import { useAuth } from "@/context/AuthContext";

interface EmailSearchProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
  isSearching: boolean;
}

export const EmailSearch = ({
  searchParams,
  onSearchChange,
  isSearching,
}: EmailSearchProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState(searchParams.search);
  const [classification, setClassification] = useState(
    searchParams.classification
  );
  const [sentiment, setSentiment] = useState(searchParams.sentiment);
  const [showUnreplied, setShowUnreplied] = useState(
    searchParams.showUnreplied
  );
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSentimentDropdown, setShowSentimentDropdown] = useState(false);
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const sentimentDropdownRef = useRef<HTMLDivElement>(null);

  // Default classification types
  const defaultTypes = [
    "all",
    "Inquiry",
    "Support",
    "Complaint",
    "Feedback",
    "Urgent",
    "Billing",
    "Unknown",
  ];

  // Fetch custom classification types
  useEffect(() => {
    if (user?.uid) {
      fetchCustomTypes();
    }
  }, [user?.uid]);

  const fetchCustomTypes = async () => {
    try {
      setIsLoadingTypes(true);
      const response = await fetch(
        `http://localhost:3001/api/classifier/types?firebaseUid=${user?.uid}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch custom types");
      }

      const data = await response.json();
      setCustomTypes(data.types || []);
    } catch (error) {
      console.error("Error fetching custom types:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // Get all unique classification types
  const allClassificationTypes = [
    ...new Set([...defaultTypes, ...customTypes]),
  ];

  // Handle classification change
  const handleClassificationChange = (value: string) => {
    setClassification(value);
    updateSearchParams(value, sentiment, showUnreplied, search);
  };

  // Handle sentiment change
  const handleSentimentChange = (value: string) => {
    setSentiment(value);
    updateSearchParams(classification, value, showUnreplied, search);
  };

  // Handle unreplied toggle
  const handleUnrepliedToggle = () => {
    const newValue = !showUnreplied;
    setShowUnreplied(newValue);
    updateSearchParams(classification, sentiment, newValue, search);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedUpdateSearch(classification, sentiment, showUnreplied, value);
  };

  // Update search params (immediate)
  const updateSearchParams = (
    classification: string,
    sentiment: string,
    showUnreplied: boolean,
    search: string
  ) => {
    onSearchChange({
      classification,
      sentiment,
      showUnreplied,
      search,
    });
  };

  // Debounced search function for text input
  const debouncedUpdateSearch = useCallback(
    debounce((classification, sentiment, showUnreplied, search) => {
      updateSearchParams(classification, sentiment, showUnreplied, search);
    }, 300),
    [onSearchChange]
  );

  const handleReset = () => {
    setSearch("");
    setClassification("all");
    setSentiment("all");
    setShowUnreplied(false);
    updateSearchParams("all", "all", false, "");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setShowClassDropdown(false);
      }
      if (
        sentimentDropdownRef.current &&
        !sentimentDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSentimentDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Implement debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Get display text for classification
  const getClassificationText = () => {
    return classification === "all" ? "All types" : classification;
  };

  // Get display text for sentiment
  const getSentimentText = () => {
    switch (sentiment) {
      case "all":
        return "All sentiments";
      case "positive":
        return "Positive";
      case "neutral":
        return "Neutral";
      case "negative":
        return "Negative";
      default:
        return "All sentiments";
    }
  };

  // Get sentiment icon
  const getSentimentIcon = () => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "neutral":
        return "😐";
      case "negative":
        return "😞";
      default:
        return "😊";
    }
  };

  return (
    <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm mb-4">
      <div className="p-2">
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Field - smaller width */}
          <div className="relative w-64 sm:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="size-3.5 text-primary/70" />
            </div>
            <input
              type="text"
              placeholder="Search emails..."
              className="input input-sm w-full pl-7 pr-7 h-8 rounded-lg border-base-300 bg-base-100 focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-base-content/40 hover:text-base-content"
                onClick={() => handleSearchChange("")}
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Filters Section */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Classification Dropdown - FlowOn UI style */}
            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="btn btn-sm h-9 pl-2.5 pr-3 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 flex items-center gap-2 min-w-40"
              >
                <SlidersHorizontal className="size-3.5 text-primary/80" />
                <span className="text-sm font-medium text-base-content">
                  {getClassificationText()}
                </span>
                <ChevronDown
                  className={`size-3.5 ml-auto text-base-content/70 transition-transform duration-200 ${
                    showClassDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showClassDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-base-100 shadow-lg rounded-lg border border-base-200 py-1 z-10 max-h-60 overflow-y-auto">
                  {/* All Types Option */}
                  <button
                    className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                      classification === "all" ? "bg-base-200/70" : ""
                    }`}
                    onClick={() => {
                      handleClassificationChange("all");
                      setShowClassDropdown(false);
                    }}
                  >
                    All types
                  </button>

                  {isLoadingTypes ? (
                    <div className="px-3 py-2 text-center">
                      <span className="loading loading-spinner loading-xs"></span>
                    </div>
                  ) : (
                    <>
                      {/* Default Types Section */}
                      {defaultTypes.length > 0 &&
                        defaultTypes
                          .filter((type) => type !== "all")
                          .map((type) => (
                            <button
                              key={type}
                              className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                                classification === type ? "bg-base-200/70" : ""
                              }`}
                              onClick={() => {
                                handleClassificationChange(type);
                                setShowClassDropdown(false);
                              }}
                            >
                              {type}
                            </button>
                          ))}

                      {/* Custom Types Section */}
                      {customTypes.length > 0 &&
                        customTypes.filter(
                          (type) => !defaultTypes.includes(type)
                        ).length > 0 && (
                          <>
                            <div className="w-full px-3 py-1 text-xs font-semibold text-base-content/50 border-t border-base-200 mt-1 pt-1">
                              Custom Types
                            </div>
                            {customTypes
                              .filter((type) => !defaultTypes.includes(type))
                              .map((type) => (
                                <button
                                  key={type}
                                  className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                                    classification === type
                                      ? "bg-base-200/70"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    handleClassificationChange(type);
                                    setShowClassDropdown(false);
                                  }}
                                >
                                  {type}
                                </button>
                              ))}
                          </>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sentiment Dropdown - FlowOn UI style */}
            <div className="relative" ref={sentimentDropdownRef}>
              <button
                type="button"
                onClick={() => setShowSentimentDropdown(!showSentimentDropdown)}
                className="btn btn-sm h-9 pl-2.5 pr-3 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 flex items-center gap-2 min-w-40"
              >
                <span className="flex items-center justify-center size-3.5 text-primary">
                  <span className="text-sm">{getSentimentIcon()}</span>
                </span>
                <span className="text-sm font-medium text-base-content">
                  {getSentimentText()}
                </span>
                <ChevronDown
                  className={`size-3.5 ml-auto text-base-content/70 transition-transform duration-200 ${
                    showSentimentDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSentimentDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-base-100 shadow-lg rounded-lg border border-base-200 py-1 z-10">
                  <button
                    className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                      sentiment === "all" ? "bg-base-200/70" : ""
                    }`}
                    onClick={() => {
                      handleSentimentChange("all");
                      setShowSentimentDropdown(false);
                    }}
                  >
                    All sentiments
                  </button>
                  <button
                    className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                      sentiment === "positive" ? "bg-base-200/70" : ""
                    }`}
                    onClick={() => {
                      handleSentimentChange("positive");
                      setShowSentimentDropdown(false);
                    }}
                  >
                    <span className="mr-2">😊</span> Positive
                  </button>
                  <button
                    className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                      sentiment === "neutral" ? "bg-base-200/70" : ""
                    }`}
                    onClick={() => {
                      handleSentimentChange("neutral");
                      setShowSentimentDropdown(false);
                    }}
                  >
                    <span className="mr-2">😐</span> Neutral
                  </button>
                  <button
                    className={`w-full px-3 py-1.5 text-left hover:bg-base-200 text-sm font-medium text-base-content ${
                      sentiment === "negative" ? "bg-base-200/70" : ""
                    }`}
                    onClick={() => {
                      handleSentimentChange("negative");
                      setShowSentimentDropdown(false);
                    }}
                  >
                    <span className="mr-2">😞</span> Negative
                  </button>
                </div>
              )}
            </div>

            {/* Needs Response Toggle */}
            <button
              type="button"
              onClick={handleUnrepliedToggle}
              className={`btn btn-sm px-2.5 h-9 gap-1.5 rounded-lg flex items-center whitespace-nowrap ${
                showUnreplied
                  ? "btn-primary text-primary-content"
                  : "btn-outline"
              }`}
            >
              <MessageSquareMore className="size-3.5" />
              <span className="text-sm font-medium">Needs Response</span>
            </button>

            {/* Reset button - only show if filters are active */}
            {(search ||
              classification !== "all" ||
              sentiment !== "all" ||
              showUnreplied) && (
              <button
                type="button"
                className="btn btn-sm btn-ghost px-2.5 h-9 rounded-lg text-sm"
                onClick={handleReset}
                disabled={isSearching}
              >
                {isSearching ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span>Reset</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
