"use client";
import { useEffect } from "react";

/** Counts a view of this workflow (once per visitor, decided by the server). Renders nothing. */
export default function ClickTracker({ workflowId }: { workflowId: string }) {
  useEffect(() => {
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId }),
      keepalive: true,
    }).catch(() => {});
  }, [workflowId]);
  return null;
}
