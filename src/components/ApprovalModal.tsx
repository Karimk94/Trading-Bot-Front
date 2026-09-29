"use client";

import { useEffect, useState, useRef } from "react";

interface ChainStep {
  step_name: string;
  analysis: string;
  confidence: number;
}

interface PendingSignal {
  decision: "BUY" | "SELL";
  confidence: number;
  stop_loss: number;
  take_profit: number;
  summary: string;
  current_price: number;
  spread: number;
  chain_of_thought: ChainStep[];
  timeout_seconds: number;
}

interface Props {
  signal: PendingSignal | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalModal({ signal, onApprove, onReject }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!signal) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeLeft(0);
      return;
    }

    setTimeLeft(signal.timeout_seconds);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [signal]);

  if (!signal) return null;

  const isBuy = signal.decision === "BUY";
  const rr = signal.current_price > 0
    ? Math.abs(signal.take_profit - signal.current_price) /
      Math.abs(signal.current_price - signal.stop_loss)
    : 0;

  const timerPct = (timeLeft / signal.timeout_seconds) * 100;
  const timerColor =
    timerPct > 50 ? "#00e676" : timerPct > 25 ? "#ffd740" : "#ff5252";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        style={{ animation: "modal-fade-in 0.2s ease-out" }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ animation: "modal-slide-up 0.25s ease-out" }}
      >
        <div
          className="w-full max-w-lg glass-card border-2 overflow-hidden"
          style={{
            borderColor: isBuy
              ? "rgba(0, 230, 118, 0.4)"
              : "rgba(255, 82, 82, 0.4)",
          }}
        >
          {/* Timer bar */}
          <div className="h-1 w-full bg-border/30 relative overflow-hidden">
            <div
              className="h-full absolute left-0 top-0 transition-all duration-1000 ease-linear"
              style={{
                width: `${timerPct}%`,
                backgroundColor: timerColor,
              }}
            />
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: isBuy
                      ? "rgba(0, 230, 118, 0.15)"
                      : "rgba(255, 82, 82, 0.15)",
                    color: isBuy ? "#00e676" : "#ff5252",
                    border: `1px solid ${isBuy ? "rgba(0,230,118,0.3)" : "rgba(255,82,82,0.3)"}`,
                  }}
                >
                  {isBuy ? "↑" : "↓"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl font-bold"
                      style={{ color: isBuy ? "#00e676" : "#ff5252" }}
                    >
                      {signal.decision}
                    </span>
                    <span className="text-sm text-muted">XAU/USD</span>
                  </div>
                  <p className="text-xs text-muted">Advisory Mode — Your Approval Required</p>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex flex-col items-center">
                <span
                  className="text-3xl font-mono font-bold tabular-nums"
                  style={{ color: timerColor }}
                >
                  {timeLeft}
                </span>
                <span className="text-xs text-muted">seconds</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-foreground/80 leading-relaxed">
              {signal.summary}
            </p>

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-border/10 text-center">
                <span className="text-xs text-muted">Entry</span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  ${signal.current_price.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-border/10 text-center">
                <span className="text-xs text-muted">Stop Loss</span>
                <span className="text-sm font-mono font-semibold text-loss">
                  ${signal.stop_loss.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-border/10 text-center">
                <span className="text-xs text-muted">Take Profit</span>
                <span className="text-sm font-mono font-semibold text-profit">
                  ${signal.take_profit.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-border/10 text-center">
                <span className="text-xs text-muted">R:R</span>
                <span className="text-sm font-mono font-semibold text-accent">
                  1:{rr.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-20">Confidence</span>
              <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${signal.confidence * 100}%`,
                    backgroundColor:
                      signal.confidence >= 0.75
                        ? "#00e676"
                        : signal.confidence >= 0.65
                        ? "#ffd740"
                        : "#ff5252",
                  }}
                />
              </div>
              <span className="text-xs font-mono font-semibold text-foreground w-10 text-right">
                {(signal.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Chain of Thought (collapsed) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted uppercase tracking-widest">
                AI Reasoning
              </span>
              {signal.chain_of_thought.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 items-start p-2.5 rounded-lg bg-border/10"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-accent font-semibold">{idx + 1}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-accent">{step.step_name}</span>
                    <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2">
                      {step.analysis}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-reject warning */}
            <p className="text-xs text-center text-muted/60">
              No response in{" "}
              <span className="font-mono" style={{ color: timerColor }}>
                {timeLeft}s
              </span>{" "}
              → Auto-rejected
            </p>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onReject}
                className="px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
                  bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20 hover:scale-[1.02]
                  active:scale-[0.98] cursor-pointer"
              >
                ✕ &nbsp;Reject Trade
              </button>
              <button
                onClick={onApprove}
                className="px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
                  bg-profit/15 text-profit border border-profit/30 hover:bg-profit/25 hover:scale-[1.02]
                  active:scale-[0.98] cursor-pointer"
                style={{ boxShadow: "0 0 20px rgba(0,230,118,0.15)" }}
              >
                ✓ &nbsp;Approve &amp; Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
