"use client";

import type { ForexCandidate, ForexScan } from "@/hooks/useAPI";

interface Props {
  scan: ForexScan | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function SignalLabel({ candidate }: { candidate: ForexCandidate }) {
  if (candidate.signal === "BUY_SETUP") {
    return <span className="font-semibold text-profit">Long setup</span>;
  }
  if (candidate.signal === "SELL_BIAS") {
    return <span className="font-semibold text-loss">Downtrend</span>;
  }
  return <span className="text-muted">Watch</span>;
}

function Move({ value }: { value: number }) {
  const color = value > 0 ? "text-profit" : value < 0 ? "text-loss" : "text-muted";
  return <span className={`font-mono tabular-nums ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(3)}%</span>;
}

export default function ForexTrendsPanel({ scan, loading, error, onRefresh }: Props) {
  const topPick = scan?.top_pick ?? null;

  return (
    <section className="glass-card p-5 flex flex-col gap-4" aria-labelledby="forex-trends-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-accent">FX market scan</p>
          <h2 id="forex-trends-title" className="text-base font-semibold text-foreground">
            Trending currency pairs
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {scan?.as_of && (
            <span className="text-xs text-muted">
              Updated {new Date(scan.as_of).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh forex scan"
            title="Refresh forex scan"
            className="grid size-9 place-items-center border border-border text-muted transition-colors hover:text-foreground disabled:cursor-wait disabled:opacity-50"
          >
            <svg
              className={loading ? "animate-spin" : ""}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
            </svg>
          </button>
        </div>
      </div>

      {topPick ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-profit bg-profit/5 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted">Top long setup</span>
            <span className="text-lg font-semibold font-mono text-profit">{topPick.symbol}</span>
          </div>
          <span className="text-sm text-foreground">{topPick.description}</span>
          <span className="text-sm font-mono text-foreground">{topPick.price}</span>
          <span className="text-xs text-muted">{topPick.reason}</span>
        </div>
      ) : (
        <div className="border-l-2 border-hold bg-hold/5 px-4 py-3">
          <p className="text-sm font-medium text-hold">No long setup currently qualifies</p>
          <p className="mt-1 text-xs text-muted">
            {error ?? scan?.message ?? (loading ? "Scanning available major pairs..." : "Waiting for live market data.")}
          </p>
        </div>
      )}

      {error && topPick && <p role="alert" className="text-xs text-loss">{error}</p>}

      {scan?.candidates.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Pair</th>
                <th className="px-3 py-2 text-right font-medium">Last</th>
                <th className="px-3 py-2 text-right font-medium">15m</th>
                <th className="px-3 py-2 text-right font-medium">1h</th>
                <th className="px-3 py-2 text-right font-medium">RSI</th>
                <th className="py-2 pl-4 text-right font-medium">Screen</th>
              </tr>
            </thead>
            <tbody>
              {scan.candidates.map((candidate) => (
                <tr key={candidate.symbol} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-semibold font-mono text-foreground">{candidate.symbol}</span>
                    <span className="ml-2 text-muted">{candidate.trend}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {candidate.price}
                    {candidate.delayed_by_minutes > 0 && (
                      <span className="block text-[10px] text-hold">{candidate.delayed_by_minutes}m delay</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right"><Move value={candidate.change_15m_pct} /></td>
                  <td className="px-3 py-3 text-right"><Move value={candidate.change_1h_pct} /></td>
                  <td className="px-3 py-3 text-right font-mono text-muted">{candidate.rsi_14.toFixed(1)}</td>
                  <td className="py-3 pl-4 text-right"><SignalLabel candidate={candidate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {scan?.available && (
        <p className="text-[11px] leading-relaxed text-muted">
          Momentum screen of major FX pairs, not personalized financial advice. Quotes may be delayed; verify the displayed market status before acting. No order is placed from this panel.
        </p>
      )}
    </section>
  );
}