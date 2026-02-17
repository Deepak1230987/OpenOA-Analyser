/**
 * LoadingSpinner Component
 * ========================
 */

import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-muted-foreground text-sm">
        Analysing SCADA data &hellip; this may take a few seconds.
      </p>
    </div>
  );
}
