"use client";

import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

// Note: Removed HSOverlay types and logic

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  formData: {
    name: string;
    description: string;
    prompt: string;
    trainingData: string; // JSON string
    isDefault: boolean;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSwitchChange: (checked: boolean) => void;
  triggerFileUpload: () => void;
  isSubmitting: boolean;
  currentAgentId: string | null; // To change title/button text
  formError?: string | null; // Optional error display within the modal
}

export function AgentFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  handleInputChange,
  handleSwitchChange,
  triggerFileUpload,
  isSubmitting,
  currentAgentId,
  formError,
}: AgentFormModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Effect to control visibility and transitions based on isOpen prop
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to ensure the initial state (hidden) is applied before transitioning
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Start fade-out transition
      setIsVisible(false);
      // onClose will be called by the parent or button click
    }
  }, [isOpen]);

  // This effect handles closing the modal via the Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // If the modal is not open and not visible (transition finished), don't render anything
  // We don't use a setTimeout here like AddEventModal because the parent controls `isOpen` directly
  if (!isOpen && !isVisible) return null;

  const handleSubmitClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await onSubmit();
    // Let the onSubmit handler (in useAgents hook) call onClose on success
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close only if the click is directly on the backdrop (the outer div)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent_modal_title"
      onClick={handleBackdropClick} // Add backdrop click handler
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${
        isOpen && isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      // If not open, make it non-interactive immediately for screen readers etc.
      // The transition handles the visual hiding.
      style={!isOpen ? { pointerEvents: "none" } : {}}
    >
      {/* Modal Content Box */}
      <div
        className={`bg-base-100 dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl z-50 transform transition-all duration-300 ease-out pointer-events-auto ${
          isOpen && isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b dark:border-neutral-700">
          <h3
            id="agent_modal_title"
            className="text-lg font-semibold text-gray-800 dark:text-white"
          >
            {currentAgentId ? "Edit Agent" : "Create New Agent"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-neutral-700 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5 space-y-4">
          {/* Agent Name */}
          <div className="form-control">
            <label className="label" htmlFor="name">
              <span className="label-text">
                Agent Name <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g., Friendly Email Helper"
              className="input input-bordered w-full"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label" htmlFor="description">
              <span className="label-text">Description</span>
            </label>
            <input
              id="description"
              type="text"
              name="description"
              placeholder="Optional: Briefly describe its purpose"
              className="input input-bordered w-full"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Agent Prompt */}
          <div className="form-control">
            <label className="label" htmlFor="prompt">
              <span className="label-text">Agent Prompt</span>
            </label>
            <textarea
              id="prompt"
              name="prompt"
              placeholder="Define the agent's personality and task. e.g., 'You are a helpful assistant that drafts polite email replies...'"
              className="textarea textarea-bordered w-full min-h-[80px]"
              value={formData.prompt}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Training Data */}
          <div className="form-control">
            <div className="flex justify-between items-center mb-1">
              <label className="label" htmlFor="trainingData">
                <span className="label-text">Training Data (JSON)</span>
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={triggerFileUpload}
                disabled={isSubmitting}
              >
                <Upload className="mr-1 h-4 w-4" /> Upload JSON
              </button>
            </div>
            <textarea
              id="trainingData"
              name="trainingData"
              placeholder={`Enter as JSON array: [\n  {"input": "example query", "output": "example response"}\n]`}
              className="textarea textarea-bordered w-full min-h-[120px] font-mono text-xs"
              value={formData.trainingData}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
            <label className="label">
              <span className="label-text-alt">
                Provide input/output examples in JSON array format.
              </span>
            </label>
          </div>

          {/* Default Agent Switch */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="switch switch-primary" // Assuming switch style is desired
                checked={formData.isDefault}
                onChange={(e) => handleSwitchChange(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="label-text flex flex-col">
                <span>Set as default agent</span>
                <span className="text-xs text-base-content text-opacity-60 font-normal">
                  This agent will be pre-selected for relevant tasks.
                </span>
              </span>
            </label>
          </div>

          {/* Form Error Display */}
          {formError && (
            <div role="alert" className="alert alert-error text-sm p-2">
              {/* Simplified error icon */}
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{formError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-x-2 p-4 md:p-5 border-t dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            className={`btn btn-primary ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm mr-2"></span>
            ) : null}
            {isSubmitting
              ? "Saving..."
              : currentAgentId
              ? "Update Agent"
              : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
