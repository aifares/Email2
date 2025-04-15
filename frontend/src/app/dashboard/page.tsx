"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { RefreshCw } from "lucide-react";

// Import components and hooks using barrel files
import {
  ErrorMessage,
  EmailTable,
  EmailSearch,
  DashboardStats,
  PaginationControls,
  GmailConnectPrompt,
} from "./components";

import { useEmails, useGmailStatus } from "./components/hooks";

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useAuth();

  // Gmail connection status
  const {
    isGmailConnected,
    isLoading: isGmailStatusLoading,
    error: gmailStatusError,
    handleGmailConnect,
  } = useGmailStatus({ userId: user?.uid });

  // Email data and operations
  const {
    emails,
    isLoading: emailsLoading,
    error: emailsError,
    totalEmails,
    totalPages,
    hasMore,
    currentPage,
    rowsPerPage,
    searchParams,
    isSearching,
    isAnalyzing,
    handleSearchChange,
    handleRefresh,
    handleAnalyzeAll,
    setCurrentPage,
    setRowsPerPage,
  } = useEmails({ userId: user?.uid, isGmailConnected });

  // Handle page change with resetting next page token when needed
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback(
    (value: number) => {
      setRowsPerPage(value);
      setCurrentPage(1);
    },
    [setRowsPerPage, setCurrentPage]
  );

  // Error handling
  const error = gmailStatusError || emailsError;

  if (isGmailStatusLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <ErrorMessage message={error} />
        <button className="btn btn-outline mt-4" onClick={handleRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  if (!isGmailConnected) {
    return <GmailConnectPrompt onGmailConnect={handleGmailConnect} />;
  }

  return (
    <div className="container mx-auto max-w-screen-xl p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-medium">Dashboard Overview</h1>

        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={emailsLoading}
          >
            <RefreshCw
              className={`size-4 ${emailsLoading ? "animate-spin" : ""}`}
            />
            <span className="ml-1">Refresh</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="ml-1">Analyzing...</span>
              </>
            ) : (
              <>Analyze All Emails</>
            )}
          </button>
        </div>
      </div>

      <DashboardStats
        totalEmails={totalEmails}
        isAnalyzing={isAnalyzing}
        handleAnalyzeAll={handleAnalyzeAll}
      />

      <EmailSearch
        searchParams={searchParams}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
      />

      <div className="card bg-base-100 border border-base-200 overflow-hidden">
        <div className="card-body p-0">
          <EmailTable emails={emails} isLoading={emailsLoading} />
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        hasMore={hasMore}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
}
