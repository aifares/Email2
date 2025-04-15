import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <div className="alert alert-error bg-error/10 text-error-content border-error/30 rounded-lg">
    <AlertTriangle className="size-5" />
    <span>{message}</span>
  </div>
);
