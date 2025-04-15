import { Mail } from "lucide-react";
import Link from "next/link";
import { EmailData } from "./types";

interface EmailTableProps {
  emails: EmailData[];
  isLoading: boolean;
}

export const EmailTable = ({ emails, isLoading }: EmailTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="text-center p-4">
        <div className="flex justify-center mb-3">
          <Mail className="size-10 text-base-content/30" />
        </div>
        <h3 className="text-lg font-medium">No emails found</h3>
        <p className="text-base-content/70 mt-1 text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

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
      <span className={`badge badge-sm ${sentimentInfo.class}`}>
        {sentimentInfo.text}
      </span>
    );
  };

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
      <span className={`badge badge-sm ${classInfo.class}`}>
        {classInfo.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diff < 7 * day) {
      const options: Intl.DateTimeFormatOptions = { weekday: "short" };
      return date.toLocaleDateString(undefined, options);
    } else {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      return date.toLocaleDateString(undefined, options);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm table-zebra">
        <thead>
          <tr className="text-xs bg-base-200/50">
            <th className="font-medium">From</th>
            <th className="font-medium">Subject</th>
            <th className="font-medium">Date</th>
            <th className="font-medium">Sentiment</th>
            <th className="font-medium">Classification</th>
            <th className="font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.threadId} className="hover:bg-base-200/50">
              <td className="whitespace-nowrap">
                {typeof email.from === "object"
                  ? email.from.name || email.from.email
                  : email.from}
              </td>
              <td className="max-w-[300px] truncate">{email.subject}</td>
              <td className="whitespace-nowrap">{formatDate(email.date)}</td>
              <td>{getSentimentBadge(email.sentiment)}</td>
              <td>{getClassificationBadge(email.classification)}</td>
              <td className="text-right">
                <Link
                  href={`/dashboard/emails/${email.threadId}`}
                  className="btn btn-xs btn-ghost"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
