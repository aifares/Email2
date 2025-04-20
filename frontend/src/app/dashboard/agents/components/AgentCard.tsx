"use client";

import React from "react";
import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";

// Define Agent type locally or import from a shared types file
interface Agent {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  trainingData: Array<{ input: string; output: string }>;
  createdAt: string;
}

interface AgentCardProps {
  agent: Agent;
  isDefault: boolean;
  onEdit: (agent: Agent) => void;
  onSetDefault: (agentId: string | null) => void;
  onDelete: (agentId: string) => void;
}

export function AgentCard({
  agent,
  isDefault,
  onEdit,
  onSetDefault,
  onDelete,
}: AgentCardProps) {
  const closeDropdown = () => {
    // Blur the active element to make the dropdown lose focus and close
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Keep this if needed, but test removal if blur doesn't work
    if (
      window.confirm(
        "Are you sure you want to delete this agent? This cannot be undone."
      )
    ) {
      onDelete(agent._id);
      closeDropdown(); // Close dropdown after confirmation
    } else {
      // If user cancels confirmation, still close dropdown
      closeDropdown();
    }
  };

  const handleSetDefaultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetDefault(agent._id);
    closeDropdown(); // Close dropdown
  };

  const handleRemoveDefaultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetDefault(null);
    closeDropdown(); // Close dropdown
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(agent);
    closeDropdown(); // Close dropdown
  };

  return (
    <div
      key={agent._id}
      className="card bg-base-100 border border-base-200 shadow-sm flex flex-col h-full"
    >
      <div className="card-body p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h2
              className="card-title text-lg font-semibold truncate"
              title={agent.name}
            >
              {agent.name}
            </h2>
            {isDefault && (
              <div className="tooltip tooltip-right" data-tip="Default Agent">
                <Star className="w-5 h-5 text-yellow-400 fill-current flex-shrink-0" />
              </div>
            )}
          </div>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical className="h-5 w-5" />
            </button>
            <ul
              tabIndex={0}
              // Add onClick listener to the menu itself for safety, though item clicks should cover it
              onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from bubbling further
              className="dropdown-content z-[10] menu p-2 shadow bg-base-100 rounded-box w-48 border border-base-300"
            >
              <li>
                <button
                  onClick={handleEditClick}
                  className="flex items-center w-full text-left p-2 hover:bg-base-200 rounded"
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </button>
              </li>
              {!isDefault && (
                <li>
                  <button
                    onClick={handleSetDefaultClick}
                    className="flex items-center w-full text-left p-2 hover:bg-base-200 rounded"
                  >
                    <Star className="mr-2 h-4 w-4" /> Set as Default
                  </button>
                </li>
              )}
              {isDefault && (
                <li>
                  <button
                    onClick={handleRemoveDefaultClick}
                    className="flex items-center w-full text-left p-2 hover:bg-base-200 rounded"
                  >
                    <Star className="mr-2 h-4 w-4 text-neutral-content" />{" "}
                    Remove Default
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center w-full text-left p-2 text-error hover:bg-error hover:text-error-content rounded"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </button>
              </li>
            </ul>
          </div>
        </div>

        {agent.description && (
          <p
            className="text-sm text-base-content text-opacity-70 mt-1 mb-3 line-clamp-2"
            title={agent.description}
          >
            {agent.description}
          </p>
        )}

        <div className="text-xs text-base-content text-opacity-60 space-y-1 mt-auto pt-2">
          <p>Training examples: {agent.trainingData?.length || 0}</p>
          <p>Created: {new Date(agent.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      {/* Card actions can be added here if needed, similar to the original example */}
      {/* <div className="card-actions p-4 pt-0">
                <button className="btn btn-sm btn-outline w-full" onClick={(e) => handleEditClick(e)}>
                    <Pencil className="mr-1 h-4 w-4" /> Configure
                </button>
            </div> */}
    </div>
  );
}
