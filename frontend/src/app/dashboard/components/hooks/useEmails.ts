import { useState, useCallback, useEffect } from "react";
import { EmailData, EmailCache, PaginationData, SearchParams } from "../types";

interface UseEmailsProps {
  userId: string | undefined;
  isGmailConnected: boolean;
}

interface UseEmailsReturn {
  emails: EmailData[];
  isLoading: boolean;
  error: string | null;
  totalEmails: number;
  totalPages: number;
  hasMore: boolean;
  currentPage: number;
  rowsPerPage: number;
  searchParams: SearchParams;
  isSearching: boolean;
  isAnalyzing: boolean;
  fetchEmails: () => Promise<void>;
  handleSearchChange: (params: SearchParams) => void;
  handleRefresh: () => void;
  handleAnalyzeAll: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
}

export const useEmails = ({
  userId,
  isGmailConnected,
}: UseEmailsProps): UseEmailsReturn => {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmails, setTotalEmails] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    search: "",
    classification: "all",
    sentiment: "all",
    showUnreplied: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [emailCache, setEmailCache] = useState<EmailCache>({});
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchEmails = useCallback(async () => {
    if (!userId || !isGmailConnected) return;

    // Determine if we're in search mode or default view
    const isSearchMode =
      searchParams.search ||
      searchParams.classification !== "all" ||
      searchParams.sentiment !== "all" ||
      searchParams.showUnreplied;

    const cacheKey = JSON.stringify({
      endpoint: isSearchMode ? "search" : "list",
      params: {
        search: searchParams.search,
        classification: searchParams.classification,
        sentiment: searchParams.sentiment,
        showUnreplied: searchParams.showUnreplied,
        page: currentPage,
        pageSize: rowsPerPage,
      },
    });

    // Clear cache when toggling unreplied filter
    if (searchParams.showUnreplied) {
      setEmailCache({});
    } else if (emailCache[cacheKey]) {
      console.log("Using cached data");
      setEmails(emailCache[cacheKey].emails);
      setTotalEmails(emailCache[cacheKey].pagination.total);
      setTotalPages(emailCache[cacheKey].pagination.totalPages);
      if (emailCache[cacheKey].pagination.nextPageToken) {
        setNextPageToken(emailCache[cacheKey].pagination.nextPageToken);
      }
      setHasMore(emailCache[cacheKey].pagination.hasMore);
      return;
    }

    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      setIsLoading(true);
      setIsSearching(isSearchMode);

      const endpoint = isSearchMode ? "/emails/search" : "/emails";

      const params = new URLSearchParams({
        firebaseUid: userId,
        page: currentPage.toString(),
        pageSize: rowsPerPage.toString(),
      });

      if (searchParams.showUnreplied) {
        params.append("needsResponse", "true");
      }

      // Only include nextPageToken if we're on a page > 1 and have a token
      if (currentPage > 1 && nextPageToken) {
        params.append("nextPageToken", nextPageToken);
      }

      params.append(
        "fields",
        "threadId,messageCount,subject,from,date,snippet,sentiment,classification"
      );

      if (searchParams.search) {
        params.append("query", searchParams.search);
      }
      if (searchParams.classification !== "all") {
        params.append("filter", searchParams.classification);
      }
      if (searchParams.sentiment !== "all") {
        params.append("sentiment", searchParams.sentiment);
      }

      const response = await fetch(
        `http://localhost:3001${endpoint}?${params.toString()}`,
        {
          credentials: "include",
          signal: newAbortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data = await response.json();

      const emailsData = data.emails || [];
      const pagination: PaginationData = data.pagination || {
        total: 0,
        totalPages: 0,
        hasMore: false,
      };

      setEmailCache((prevCache) => ({
        ...prevCache,
        [cacheKey]: {
          emails: emailsData,
          pagination: pagination,
        },
      }));

      setEmails(emailsData);
      setTotalEmails(pagination.total);
      setTotalPages(pagination.totalPages);
      if (pagination.nextPageToken) {
        setNextPageToken(pagination.nextPageToken);
      }
      setHasMore(pagination.hasMore);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return;
        }
        console.error("Error fetching emails:", error);
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
      setEmails([]);
      setTotalEmails(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setAbortController(null);
    }
  }, [
    userId,
    isGmailConnected,
    currentPage,
    rowsPerPage,
    searchParams,
    emailCache,
    nextPageToken,
  ]);

  useEffect(() => {
    if (isGmailConnected && userId) {
      fetchEmails();
    }
  }, [
    isGmailConnected,
    searchParams,
    currentPage,
    rowsPerPage,
    fetchEmails,
    userId,
  ]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const handleSearchChange = useCallback((newSearchParams: SearchParams) => {
    setCurrentPage(1);
    setNextPageToken(null);
    setHasMore(true);
    setEmailCache({});
    setSearchParams(newSearchParams);
  }, []);

  const handleRefresh = useCallback(() => {
    setEmailCache({});
    fetchEmails();
  }, [fetchEmails]);

  const handleAnalyzeAll = async () => {
    if (!userId) {
      setError("Please log in first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/emails/analyze-all?firebaseUid=${userId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze emails");
      }

      await fetchEmails();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error analyzing emails:", error);
        setError(error.message);
      } else {
        setError("An unknown error occurred during analysis");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    emails,
    isLoading,
    error,
    totalEmails,
    totalPages,
    hasMore,
    currentPage,
    rowsPerPage,
    searchParams,
    isSearching,
    isAnalyzing,
    fetchEmails,
    handleSearchChange,
    handleRefresh,
    handleAnalyzeAll,
    setCurrentPage,
    setRowsPerPage,
  };
};
