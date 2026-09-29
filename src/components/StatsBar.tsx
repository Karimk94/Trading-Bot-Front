"use client";

import type { DashboardStats } from "@/hooks/useAPI";

interface Props {
  stats: DashboardStats | null;
  loopRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onGenerateReport: () => void;
  loading: boolean;
  reportLoading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1 min-w-0">
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-semibold stat-value ${color || "text-foreground"}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

export default function StatsBar({
  stats,
  loopRunning,
  onStart,
  onStop,
  onGenerateReport,
  loading,
  reportLoading,
}: Props) {
  const s = stats || {
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    win_rate: 0,
    total_pnl: 0,
    open_positions: 0,
    avg_confidence: 0,
  };

  const pnlColor = s.total_pnl > 0 ? "text-profit" : s.total_pnl < 0 ? "text-loss" : "text-foreground";
  const pnlSign = s.total_pnl > 0 ? "+" : "";

  return (
    <div className="flex gap-3 items-stretch">
      <StatCard
        label="Total P&L"
        value={`${pnlSign}$${s.total_pnl.toFixed(2)}`}
        color={pnlColor}
      />
      <StatCard
        label="Win Rate"
        value={`${s.win_rate.toFixed(1)}%`}
        sub={`${s.winning_trades}W / ${s.losing_trades}L`}
        color={s.win_rate >= 50 ? "text-profit" : "text-loss"}
      />
      <StatCard
        label="Total Trades"
        value={s.total_trades.toString()}
        sub={`${s.open_positions} open`}
      />
      <StatCard
        label="Avg Confidence"
        value={`${(s.avg_confidence * 100).toFixed(1)}%`}
        color="text-accent"
      />

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={onGenerateReport}
          disabled={reportLoading}
          className={`
            px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300
            flex items-center gap-2.5 border
            ${reportLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            bg-accent/10 text-accent border-accent/30 hover:bg-accent/20
          `}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7.2a1.5 1.5 0 0 1 1.06.44l3.8 3.8A1.5 1.5 0 0 1 19 7.26V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1-1.5Zm8 1.5v3h3.5L13 5Zm-1 6h6v1.5h-6V12Zm0 3h6v1.5h-6V15Zm-2.5-3h1.5v1.5h-1.5V12Zm0 3h1.5v1.5h-1.5V15Z" />
          </svg>
          {reportLoading ? "Generating..." : "Generate Report"}
        </button>

        <button
          onClick={loopRunning ? onStop : onStart}
          disabled={loading}
          className={`
            px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300
            flex items-center gap-2.5
            ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${
              loopRunning
                ? "bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25"
                : "bg-profit/15 text-profit border border-profit/30 hover:bg-profit/25 animate-pulse-glow"
            }
          `}
        >
          {loopRunning ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop Bot
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
              Start Bot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
