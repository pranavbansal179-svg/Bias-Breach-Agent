"use client";
import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface EchoAlertProps {
  topic: string;
  alert: string;
}

export default function EchoAlert({ topic, alert }: EchoAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!alert || dismissed) return null;

  return (
    <div className="relative mb-8 rounded-2xl border border-amber-500/30 bg-[#1a1408]/90 p-5 backdrop-blur-md shadow-lg shadow-amber-950/20 transition-all">
      <div className="flex items-start gap-3.5 pr-8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-300 tracking-wide mb-1">
            Echo Chamber Alert: {topic}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-200/80">
            {alert}
          </p>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 rounded-lg p-1.5 text-amber-400/60 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
        title="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
