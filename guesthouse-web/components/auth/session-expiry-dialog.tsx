"use client";

import * as React from "react";
import { AlertTriangle, LogIn } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export function SessionExpiryDialog() {
  const [open] = React.useState(false);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleReLogin = () => {
    clearSession();
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
      <div className="bg-popover border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Session Expired</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Your active session has expired for security reasons. Your unsaved input is preserved. Please log in again to continue.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleReLogin}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>Log In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
