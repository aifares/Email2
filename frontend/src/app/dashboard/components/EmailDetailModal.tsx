import { useState, useEffect } from "react";
import { X, Send, Copy, Loader } from "lucide-react";
import { EmailData } from "./types";
import { useAuth } from "@/context/AuthContext";

interface EmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailData | null;
}

interface ThreadMessage {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  analysis?: {
    sentiment?: string;
    classification?: string;
  };
}

export const EmailDetailModal = ({
  isOpen,
  onClose,
  email,
}: EmailDetailModalProps) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview'|'thread'>('preview');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [senderEmails, setSenderEmails] = useState<any[]>([]);
  const [loadingSenderEmails, setLoadingSenderEmails] = useState(false);

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (email && user) {
        fetchThreadMessages();
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      setActiveTab('preview');
      setReply("");
      setError(null);
      setSenderEmails([]);
      return () => clearTimeout(timer);
    }
  }, [isOpen, email, user]);

  // Fetch sender's previous emails when thread messages load
  useEffect(() => {
    if (messages.length > 0 && user) {
      fetchSenderEmails(messages[0].from);
    }
  }, [messages, user]);

  const fetchThreadMessages = async () => {
    if (!email || !user) return;
    
    try {
      setLoading(true);
      const firebaseUid = user.uid;
      
      const response = await fetch(
        `http://localhost:3001/emails/thread/${email.threadId}?firebaseUid=${firebaseUid}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching thread:", error);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchSenderEmails = async (senderEmail: string) => {
    try {
      setLoadingSenderEmails(true);
      const emailMatch = senderEmail.match(/<(.+?)>/);
      const emailAddress = emailMatch ? emailMatch[1] : senderEmail;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `http://localhost:3001/emails/sender-emails/${encodeURIComponent(
          emailAddress
        )}?firebaseUid=${user.uid}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sender emails");
      }

      const data = await response.json();
      setSenderEmails(data.emails || []);
    } catch (error) {
      console.error("Error fetching sender emails:", error);
    } finally {
      setLoadingSenderEmails(false);
    }
  };

  const handleSendReply = async () => {
    if (!email || !messages.length || !user) return;
    
    try {
      setSending(true);
      setError(null);
      
      const originalMessage = messages[0];

      const response = await fetch("http://localhost:3001/emails/reply", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: email.threadId,
          firebaseUid: user.uid,
          message: {
            to: originalMessage.from,
            subject: originalMessage.subject,
            body: `
              <div>
                ${reply}
                <br><br>
                <div style="color: #666; border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px;">
                  On ${new Date(originalMessage.date).toLocaleString()}, ${
              originalMessage.from
            } wrote:<br>
                  ${originalMessage.body}
                </div>
              </div>
            `,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      await fetchThreadMessages();
      setReply("");
    } catch (error: any) {
      console.error("Error sending reply:", error);
      setError(error.message || "Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!email || !messages || messages.length === 0 || !user) return;

    setIsGeneratingReply(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3001/emails/generate-reply",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            threadId: email.threadId,
            threadContext: messages,
            emailSubject: messages[0].subject,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate reply");
      }

      const data = await response.json();
      setReply(data.generatedReply);
    } catch (error: any) {
      console.error("Error generating reply:", error);
      setError(error.message || "Failed to generate reply. Please try again.");
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible && !isOpen) return null;
  if (!email) return null;

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get the sender display name or email
  const getSenderName = () => {
    if (typeof email.from === "object") {
      return email.from.name || email.from.email;
    }
    return email.from;
  };

  // Get appropriate badge class for sentiment
  const getSentimentBadge = (sentiment: string | undefined) => {
    if (!sentiment) return null;

    const sentiments: Record<string, { class: string; text: string }> = {
      positive: { class: "badge-success", text: "Positive" },
      neutral: { class: "badge-neutral", text: "Neutral" },
      negative: { class: "badge-error", text: "Negative" },
    };

    const sentimentInfo = sentiments[sentiment.toLowerCase()] || {
      class: "badge-neutral",
      text: sentiment,
    };

    return (
      <span className={`badge ${sentimentInfo.class}`}>
        {sentimentInfo.text}
      </span>
    );
  };

  // Get appropriate badge for classification
  const getClassificationBadge = (classification: string | undefined) => {
    if (!classification) return null;

    const classifications: Record<string, { class: string; text: string }> = {
      personal: { class: "badge-primary", text: "Personal" },
      business: { class: "badge-info", text: "Business" },
      promotional: { class: "badge-warning", text: "Promo" },
      social: { class: "badge-secondary", text: "Social" },
      updates: { class: "badge-accent", text: "Update" },
    };

    const classInfo = classifications[classification.toLowerCase()] || {
      class: "badge-neutral",
      text: classification,
    };

    return (
      <span className={`badge ${classInfo.class}`}>
        {classInfo.text}
      </span>
    );
  };

  // Show authentication error if user is not available
  if (!user) {
    return (
      <div
        className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out bg-black/50 ${
          isOpen && isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      >
        <div
          className={`bg-base-100 rounded-lg shadow-xl w-full max-w-md z-50 transform transition-all duration-300 ease-out pointer-events-auto ${
            isOpen && isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-lg font-medium mb-2">Authentication Error</h3>
            <p className="text-base-content/70">Please log in to view email details.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={onClose} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-out bg-black/50 ${
        isOpen && isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-base-100 rounded-lg shadow-xl w-full max-w-4xl z-50 transform transition-all duration-300 ease-out pointer-events-auto ${
          isOpen && isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-base-200">
          <h2 className="text-xl font-medium">Email Details</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>
        
        <div className="border-b border-base-200">
          <div className="tabs p-4">
            <button 
              className={`tab tab-bordered ${activeTab === 'preview' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button 
              className={`tab tab-bordered ${activeTab === 'thread' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('thread')}
            >
              Thread
            </button>
          </div>
        </div>
        
        {activeTab === 'preview' && (
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium">{email.subject}</h3>
                <div className="flex gap-1">
                  {getSentimentBadge(email.sentiment)}
                  {getClassificationBadge(email.classification)}
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-center text-sm text-base-content/70">
                <span>From: <strong>{getSenderName()}</strong></span>
                <span>{formatDate(email.date)}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-base-200 pt-4">
              {email.snippet ? (
                <p className="whitespace-pre-line">{email.snippet}</p>
              ) : (
                <p className="text-base-content/50 italic">No content available</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'thread' && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="loading loading-spinner loading-md"></div>
              </div>
            ) : error ? (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div 
                    key={message.messageId} 
                    className={`border rounded-lg p-4 ${index === 0 ? 'bg-base-200/50 border-base-300' : 'bg-base-100 border-base-200'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{message.from}</div>
                        <div className="text-sm text-base-content/70">{formatDate(message.date)}</div>
                      </div>
                      {message.analysis && (
                        <div className="flex gap-1">
                          {getSentimentBadge(message.analysis.sentiment)}
                          {getClassificationBadge(message.analysis.classification)}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 prose max-w-none text-sm">
                      <div dangerouslySetInnerHTML={{ __html: message.body }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 border-t border-base-200 pt-4">
              <div className="mb-2 font-medium">Reply</div>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply here..."
                disabled={sending || isGeneratingReply}
              ></textarea>
              
              {error && (
                <div className="alert alert-error mt-2">
                  <span>{error}</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3 justify-between">
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSendReply}
                    disabled={!reply.trim() || sending || isGeneratingReply}
                  >
                    {sending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleGenerateReply}
                    disabled={isGeneratingReply || sending || messages.length === 0}
                  >
                    {isGeneratingReply ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Generating...
                      </>
                    ) : (
                      "Generate AI Reply"
                    )}
                  </button>
                </div>
                
                {reply && (
                  <button
                    className={`btn btn-ghost btn-sm ${copied ? 'btn-success' : ''}`}
                    onClick={handleCopyReply}
                  >
                    <Copy className="size-4" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-base-200 p-4 flex justify-end">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 