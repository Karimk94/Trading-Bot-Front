"use client";

import type { AIDecisionData } from "@/hooks/useWebSocket";

interface Props {
  decision: AIDecisionData | null;
  sessionActive: boolean;
  loopRunning: boolean;
}

function DecisionBadge({ decision }: { decision: "BUY" | "SELL" | "HOLD" }) {
  const config = {
    BUY: { bg: "bg-profit/15", text: "text-profit", border: "border-profit/30" },
    SELL: { bg: "bg-loss/15", text: "text-loss", border: "border-loss/30" },
    HOLD: { bg: "bg-hold/15", text: "text-hold", border: "border-hold/30" },
  }[decision];

  return (
    <span
      className={`px-3 py-1 rounded-lg text-sm font-bold border ${config.bg} ${config.text} ${config.border}`}
    >
      {decision}
    </span>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const pct = value * 100;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "#00e676" : pct >= 50 ? "#ffd740" : "#ff5252";

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="transform -rotate-90">
        <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(56,72,110,0.3)" strokeWidth="4" />
        <circle
          cx="40"
          cy="40"
          r="28"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold stat-value" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function IdleState({ loopRunning, sessionActive }: { loopRunning: boolean; sessionActive: boolean }) {
  if (!loopRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/40">
          <polygon points="6,4 20,12 6,20" />
        </svg>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">Bot is stopped</span>
          <span className="text-xs text-muted/50">Click "Start Bot" to begin AI analysis</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/40">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">Sleeping outside session hours</span>
        <span className="text-xs text-muted/50">
          AI will start analyzing when London or NY session opens
        </span>
        <span className="text-xs font-mono text-accent/60 mt-1">GST 12:00 – 21:00</span>
      </div>
    </div>
  );
}

export default function AIDecisionPanel({ decision, sessionActive, loopRunning }: Props) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
          AI Decision
        </h2>
        {decision && <DecisionBadge decision={decision.decision} />}
      </div>

      {!decision ? (
        <IdleState loopRunning={loopRunning} sessionActive={sessionActive} />
      ) : (
        <>
          <div className="flex items-center gap-5 animate-fade-in-up">
            <ConfidenceRing value={decision.confidence} />
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                {decision.summary}
              </p>
              <div className="flex gap-4 text-xs text-muted">
                <span>SL: <span className="text-loss font-mono">${decision.stop_loss.toFixed(2)}</span></span>
                <span>TP: <span className="text-profit font-mono">${decision.take_profit.toFixed(2)}</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs text-muted uppercase tracking-widest">Chain of Thought</span>
            {decision.chain_of_thought.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1 p-3 rounded-lg bg-border/10 animate-slide-in-right"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-accent">{step.step_name}</span>
                  <span className="text-xs text-muted font-mono">
                    {(step.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                  {step.analysis}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
