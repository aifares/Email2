import { useState, useEffect } from "react";

interface UseGmailStatusProps {
  userId: string | undefined;
}

interface UseGmailStatusReturn {
  isGmailConnected: boolean;
  isLoading: boolean;
  error: string | null;
  handleGmailConnect: () => void;
}

export const useGmailStatus = ({
  userId,
}: UseGmailStatusProps): UseGmailStatusReturn => {
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGmailStatus = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `http://localhost:3001/auth/gmail-status?firebaseUid=${userId}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();
        setIsGmailConnected(data.isConnected);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error checking Gmail status:", error);
          setError(error.message);
        } else {
          setError("An unknown error occurred checking Gmail status");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkGmailStatus();
  }, [userId]);

  const handleGmailConnect = () => {
    if (!userId) {
      setError("Please log in first");
      return;
    }
    window.location.href = `http://localhost:3001/auth/google?firebaseUid=${userId}`;
  };

  return {
    isGmailConnected,
    isLoading,
    error,
    handleGmailConnect,
  };
};
