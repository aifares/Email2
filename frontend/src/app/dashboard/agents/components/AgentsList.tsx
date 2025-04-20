"use client";

import React from "react";
import { AgentCard } from "./AgentCard";
import { Plus } from "lucide-react";

// Define Agent type locally or import from a shared types file
interface Agent {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  trainingData: Array<{ input: string; output: string }>;
  createdAt: string;
}

interface AgentsListProps {
  agents: Agent[];
  defaultAgentId: string | null;
  onEditAgent: (agent: Agent) => void;
  onSetDefaultAgent: (agentId: string | null) => void;
  onDeleteAgent: (agentId: string) => void;
  onAddNewAgent: () => void; // Function to open the modal for a new agent
}

export function AgentsList({
  agents,
  defaultAgentId,
  onEditAgent,
  onSetDefaultAgent,
  onDeleteAgent,
  onAddNewAgent,
}: AgentsListProps) {
  if (agents.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 md:p-12 text-center mt-6">
        <div className="card-body items-center">
          <h2 className="card-title text-xl font-semibold mb-2">
            No Agents Yet
          </h2>
          <p className="text-base-content text-opacity-70 mb-6">
            Create your first AI agent to help with email replies and more.
          </p>
          <button className="btn btn-outline" onClick={onAddNewAgent}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {agents.map((agent) => (
        <AgentCard
          key={agent._id}
          agent={agent}
          isDefault={agent._id === defaultAgentId}
          onEdit={onEditAgent}
          onSetDefault={onSetDefaultAgent}
          onDelete={onDeleteAgent}
        />
      ))}
    </div>
  );
}
