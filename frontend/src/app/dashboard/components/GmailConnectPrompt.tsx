import { Mail } from "lucide-react";

interface GmailConnectPromptProps {
  onGmailConnect: () => void;
}

export const GmailConnectPrompt = ({
  onGmailConnect,
}: GmailConnectPromptProps) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
    <Mail className="size-16 text-primary mb-4" />
    <h2 className="text-2xl font-bold mb-2">Connect Your Gmail Account</h2>
    <p className="text-base-content/70 mb-6 max-w-md">
      Connect your Gmail account to start using EmailAI and manage your emails
      with AI assistance.
    </p>
    <button onClick={onGmailConnect} className="btn btn-primary">
      Connect Gmail
    </button>
  </div>
);
