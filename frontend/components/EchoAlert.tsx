'use client';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface EchoAlertProps {
  alert: string;
  topic: string;
}

export default function EchoAlert({ alert, topic }: EchoAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !alert) return null;

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 relative">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-warning/60 hover:text-warning transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-full bg-warning/10 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        
        <div>
          <h3 className="font-semibold text-warning mb-1">
            Echo Chamber Alert: {topic}
          </h3>
          <p className="text-sm text-warning/80 leading-relaxed">
            {alert}
          </p>
        </div>
      </div>
    </div>
  );
}
