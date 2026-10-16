"use client";

import { useEffect, useRef, useState } from "react";

interface AnalysisResult {
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  email_sent: boolean;
  message: string;
}

interface Props {
  result: AnalysisResult | null;
  onClose: () => void;
}

const DURATION = 15;

const decisionConfig = {
  BUY:  { color: "var(--profit)", bg: "rgba(0,230,118,0.10)",  border: "rgba(0,230,118,0.30)"  },
  SELL: { color: "var(--loss)",   bg: "rgba(255,82,82,0.10)",  border: "rgba(255,82,82,0.30)"  },
  HOLD: { color: "var(--hold)",   bg: "rgba(255,215,64,0.10)", border: "rgba(255,215,64,0.30)" },
};

export default function AnalysisModal({ result, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start countdown whenever a new result arrives
  useEffect(() => {
    if (!result) return;

    let remaining = DURATION;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        onClose();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!result) return null;

  const cfg = decisionConfig[result.decision];
  const pct = result.confidence * 100;
  const timerPct = (timeLeft / DURATION) * 100;
  const circumference = 2 * Math.PI * 18;
  const timerColor =
    timeLeft > 8 ? "var(--accent)" : timeLeft > 4 ? "var(--hold)" : "var(--loss)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        animation: "modal-fade-in 0.2s ease-out forwards",
        background: "rgba(6,8,13,0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card relative w-full max-w-md p-6 flex flex-col gap-5"
        style={{
          animation: "modal-slide-up 0.3s ease-out forwards",
          border: `1px solid ${cfg.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Manual Analysis
          </span>

          {/* Countdown ring */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg width="40" height="40" className="absolute -rotate-90">
              <circle
                cx="20" cy="20" r="18"
                fill="none"
                stroke="rgba(56,72,110,0.3)"
                strokeWidth="3"
              />
              <circle
                cx="20" cy="20" r="18"
                fill="none"
                stroke={timerColor}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (timerPct / 100) * circumference
                }
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease",
                }}
              />
            </svg>
            <span
              className="text-xs font-bold stat-value"
              style={{ color: timerColor }}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Decision badge + confidence number */}
        <div className="flex items-center gap-4">
          <span
            className="px-5 py-2 rounded-xl text-2xl font-black tracking-wide"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {result.decision}
          </span>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted uppercase tracking-wider">
              Confidence
            </span>
            <span
              className="text-3xl font-black stat-value"
              style={{ color: cfg.color }}
            >
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: cfg.color,
              boxShadow: `0 0 8px ${cfg.color}`,
            }}
          />
        </div>

        {/* Message */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {result.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {result.email_sent && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <svg
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Email sent
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-xs text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-border/20"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
