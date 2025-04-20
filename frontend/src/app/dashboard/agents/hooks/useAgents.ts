"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext"; // Corrected path based on dashboard
import { toast } from "react-hot-toast";

// Define interfaces (can be moved to a types file later)
interface Agent {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  trainingData: Array<{ input: string; output: string }>;
  createdAt: string;
  // Add other relevant fields from your backend model if needed
}

interface UserSettings {
  defaultAgentId?: string | null;
}

interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  openModal: (agent?: Agent | null) => void;
  closeModal: () => void;
  currentAgent: Agent | null;
  formData: {
    name: string;
    description: string;
    prompt: string;
    trainingData: string;
    isDefault: boolean;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSwitchChange: (checked: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  handleSetDefaultAgent: (agentId: string | null) => Promise<void>;
  handleDeleteAgent: (agentId: string) => Promise<void>;
  defaultAgentId: string | null;
  fetchAgents: () => Promise<void>; // Expose fetchAgents for manual refresh if needed
}

// Base URL for API (should be in env variables)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function useAgents(): UseAgentsReturn {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
    trainingData: "[]", // Keep as string for textarea, default empty JSON array
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    // console.log('Fetching agents for user:', user.uid);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/agents?firebaseUid=${user.uid}`
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to fetch agents" }));
        throw new Error(errorData.error || "Failed to fetch agents");
      }
      const data = await response.json();
      // console.log('Fetched agents:', data.agents);
      setAgents(data.agents || []);
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(
        err.message || "An unknown error occurred while fetching agents."
      );
      toast.error(err.message || "Failed to load agents");
      setAgents([]); // Clear agents on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserSettings = useCallback(async () => {
    if (!user) return;
    // console.log('Fetching settings for user:', user.uid);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/settings?firebaseUid=${user.uid}`
      );
      if (!response.ok) {
        if (response.status !== 404) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch user settings" }));
          throw new Error(errorData.error || "Failed to fetch user settings");
        }
        // console.log('User settings not found (404), setting defaultAgentId to null');
        setDefaultAgentId(null); // No settings found is not an error
        return;
      }
      const data: UserSettings = await response.json();
      // console.log('Fetched user settings:', data);
      setDefaultAgentId(data.defaultAgentId || null);
    } catch (err: any) {
      console.error("Error fetching user settings:", err);
      // Optional: Show toast only for non-404 errors
      // toast.error(err.message || 'Failed to load user settings');
      setDefaultAgentId(null); // Reset on error
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // console.log('User detected, fetching agents and settings');
      fetchAgents();
      fetchUserSettings();
    } else {
      // console.log('No user detected');
      setAgents([]);
      setDefaultAgentId(null);
      setLoading(false); // Stop loading if no user
    }
  }, [user, fetchAgents, fetchUserSettings]);

  const openModal = useCallback(
    (agent: Agent | null = null) => {
      // console.log('Opening modal for agent:', agent ? agent._id : 'new agent');
      setError(null); // Clear previous form errors
      if (agent) {
        setCurrentAgent(agent);
        setFormData({
          name: agent.name,
          description: agent.description || "",
          prompt: agent.prompt || "",
          trainingData: agent.trainingData
            ? JSON.stringify(agent.trainingData, null, 2)
            : "[]",
          isDefault: agent._id === defaultAgentId,
        });
      } else {
        setCurrentAgent(null);
        setFormData({
          name: "",
          description: "",
          prompt: "",
          trainingData: "[]",
          isDefault: false,
        });
      }
      setIsModalOpen(true);
    },
    [defaultAgentId]
  );

  const closeModal = useCallback(() => {
    // console.log('Closing modal');
    setIsModalOpen(false);
    setCurrentAgent(null);
    setError(null); // Clear any errors when closing modal
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSwitchChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isDefault: checked,
    }));
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          // Basic validation: try parsing
          const parsedData = JSON.parse(fileContent);
          if (!Array.isArray(parsedData)) {
            throw new Error("Uploaded file must contain a JSON array.");
          }
          // Optional: Add deeper validation of array items if needed

          setFormData((prev) => ({
            ...prev,
            // Re-stringify for consistent formatting in textarea
            trainingData: JSON.stringify(parsedData, null, 2),
          }));
          toast.success("JSON file loaded successfully");
        } catch (error: any) {
          console.error("Error parsing JSON:", error);
          toast.error(error.message || "Invalid JSON file.");
        } finally {
          // Reset file input to allow uploading the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }
    if (!formData.name) {
      toast.error("Agent name is required.");
      return;
    }

    // console.log('Submitting form data:', formData);
    setIsSubmitting(true);
    setError(null);

    let trainingDataObj: Array<{ input: string; output: string }> = [];
    try {
      if (formData.trainingData.trim()) {
        trainingDataObj = JSON.parse(formData.trainingData);
        if (!Array.isArray(trainingDataObj)) {
          throw new Error("Training data must be a valid JSON array.");
        }
        // Validate structure
        trainingDataObj.forEach((item, index) => {
          if (
            typeof item !== "object" ||
            item === null ||
            typeof item.input !== "string" ||
            typeof item.output !== "string"
          ) {
            throw new Error(
              `Invalid format for training data item at index ${index}. Each item must be an object with 'input' and 'output' strings.`
            );
          }
        });
      }
    } catch (e: any) {
      console.error("Error parsing training data JSON:", e);
      toast.error(`Invalid Training Data JSON: ${e.message}`);
      setError(`Invalid Training Data JSON: ${e.message}`);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      firebaseUid: user.uid,
      name: formData.name,
      description: formData.description,
      prompt: formData.prompt,
      trainingData: trainingDataObj,
    };

    try {
      let response;
      let url = `${API_BASE_URL}/agents`;
      let method = "POST";

      if (currentAgent) {
        url = `${API_BASE_URL}/agents/${currentAgent._id}`;
        method = "PUT";
      }

      // console.log(`Sending ${method} request to ${url} with payload:`, payload);
      response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if needed
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(
          errorData.error ||
            `Failed to ${currentAgent ? "update" : "create"} agent`
        );
      }

      const responseData = await response.json();
      // console.log('Agent save response:', responseData);
      const savedAgentId = currentAgent
        ? currentAgent._id
        : responseData.agent._id;

      toast.success(
        `Agent ${currentAgent ? "updated" : "created"} successfully!`
      );
      closeModal();

      // Handle default agent setting *after* successful save
      const needsDefaultUpdate =
        formData.isDefault !== (savedAgentId === defaultAgentId);

      if (needsDefaultUpdate) {
        // console.log(`Default status changed. Setting default to: ${formData.isDefault ? savedAgentId : null}`);
        // Call handleSetDefaultAgent which will also refetch agents
        await handleSetDefaultAgent(formData.isDefault ? savedAgentId : null);
      } else {
        // console.log('Default status unchanged. Refetching agents list.');
        // If no change in default status, just refetch agents list
        await fetchAgents();
      }
    } catch (err: any) {
      console.error("Error saving agent:", err);
      setError(err.message || "An unknown error occurred.");
      toast.error(
        err.message || `Failed to ${currentAgent ? "update" : "create"} agent.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, currentAgent, closeModal, fetchAgents, defaultAgentId]); // Added defaultAgentId dependency

  const handleSetDefaultAgent = useCallback(
    async (agentId: string | null) => {
      if (!user) return;
      // console.log(`Setting default agent to: ${agentId} for user: ${user.uid}`);

      const previousDefaultAgentId = defaultAgentId;
      // Optimistic update
      setDefaultAgentId(agentId);

      try {
        const response = await fetch(`${API_BASE_URL}/users/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            defaultAgentId: agentId, // Send null to clear
          }),
        });

        if (!response.ok) {
          // Revert optimistic update
          setDefaultAgentId(previousDefaultAgentId);
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP error ${response.status}` }));
          throw new Error(
            errorData.error || "Failed to update default agent settings"
          );
        }

        // Fetch updated settings to confirm, though optimistic should be okay
        // await fetchUserSettings(); // Could cause extra fetches, rely on optimistic for now
        await fetchAgents(); // Refresh agent list to show star changes

        toast.success(agentId ? "Default agent set" : "Default agent removed");
      } catch (err: any) {
        // Ensure revert on any error
        setDefaultAgentId(previousDefaultAgentId);
        console.error("Error setting default agent:", err);
        toast.error(err.message || "Failed to update default agent");
        // Fetch agents again to ensure consistency after error
        await fetchAgents();
      }
    },
    [user, defaultAgentId, fetchAgents]
  ); // Added fetchAgents

  const handleDeleteAgent = useCallback(
    async (agentId: string) => {
      if (!user) return;

      // Confirmation dialog is handled in the component
      // console.log(`Attempting to delete agent: ${agentId} for user: ${user.uid}`);

      try {
        const response = await fetch(
          `${API_BASE_URL}/agents/${agentId}?firebaseUid=${user.uid}`,
          {
            method: "DELETE",
            headers: {
              // Add authorization header if needed
            },
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP error ${response.status}` }));
          throw new Error(errorData.error || "Failed to delete agent");
        }

        toast.success("Agent deleted successfully");

        // If the deleted agent was the default, clear the default setting locally
        // The backend should handle removing the reference, but we update UI immediately
        if (agentId === defaultAgentId) {
          // console.log('Deleted agent was the default. Clearing defaultAgentId.');
          setDefaultAgentId(null);
          // No need to call backend setting update, just reflect the change
        }

        // Refetch agents list to remove the deleted one
        await fetchAgents();
      } catch (err: any) {
        console.error("Error deleting agent:", err);
        toast.error(err.message || "Failed to delete agent");
      }
    },
    [user, defaultAgentId, fetchAgents]
  );

  return {
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
    fetchAgents, // Expose fetchAgents
  };
}
