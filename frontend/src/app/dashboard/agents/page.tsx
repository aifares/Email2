"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext"; // Use correct context path
import { Plus, RefreshCw } from "lucide-react";
import { useAgents } from "./hooks"; // Use barrel file for hook
import { AgentsList, AgentFormModal } from "./components"; // Use barrel file for components

// Main Agents Page Component
export default function AgentsPage() {
  const { user } = useAuth(); // Get user from context

  // Use the custom hook for all agent-related logic and state
  const {
    agents,
    loading,
    error,
    isModalOpen,
    openModal,
    closeModal,
    currentAgent,
    formData,
    handleInputChange,
    handleSwitchChange,
    handleFileUpload,
    triggerFileUpload,
    fileInputRef,
    handleSubmit,
    isSubmitting,
    handleSetDefaultAgent,
    handleDeleteAgent,
    defaultAgentId,
    fetchAgents, // Get fetchAgents for refresh button
  } = useAgents();

  // Render loading state
  if (!user && loading) {
    // Show loading only if user isn't definitively known yet
    return (
      <div className="flex h-full items-center justify-center p-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Render error state
  if (error && !isModalOpen) {
    // Don't show page-level error if modal is open with its own error
    return (
      <div className="p-6 text-center">
        <div role="alert" className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Error: {error}</span>
        </div>
        <button
          className="btn btn-outline mt-4"
          onClick={fetchAgents}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Try Again
        </button>
      </div>
    );
  }

  // Render main content
  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Your AI Agents</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchAgents}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1">Refresh</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openModal()}
          >
            <Plus className="mr-1 h-4 w-4" /> Create New Agent
          </button>
        </div>
      </div>

      {/* Agent List or Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-48 w-full"></div>
          ))}
        </div>
      ) : (
        <AgentsList
          agents={agents}
          defaultAgentId={defaultAgentId}
          onEditAgent={openModal} // openModal handles edit case
          onSetDefaultAgent={handleSetDefaultAgent}
          onDeleteAgent={handleDeleteAgent}
          onAddNewAgent={() => openModal()} // openModal without args is add new
        />
      )}

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        id="file-upload-hidden"
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Agent Form Modal */}
      <AgentFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSwitchChange={handleSwitchChange}
        triggerFileUpload={triggerFileUpload}
        isSubmitting={isSubmitting}
        currentAgentId={currentAgent?._id || null}
        formError={isModalOpen ? error : null} // Pass error only when modal is open
      />
    </div>
  );
}
