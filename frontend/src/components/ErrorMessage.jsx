/**
 * ErrorMessage Component
 * ======================
 * Dismissible error banner using shadcn Alert.
 * Handles both simple string errors and structured validation
 * errors (pipe-delimited messages from the backend).
 */

import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertTriangle, X, FileWarning, Info } from "lucide-react";

export default function ErrorMessage({ message, onDismiss }) {
  // Parse pipe-delimited structured errors from backend
  const parts = message?.split(" | ") ?? [message];
  const isValidationError = parts.length > 1;
  const title = isValidationError ? parts[0] : "Analysis Failed";
  const details = isValidationError ? parts.slice(1) : [];

  return (
    <Alert variant="destructive" className="mb-6">
      {isValidationError ? (
        <FileWarning className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        {isValidationError ? (
          <ul className="mt-2 space-y-1.5">
            {details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1">{message}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
