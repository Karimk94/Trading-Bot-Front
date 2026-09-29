"use client";

import type { TradeRecord } from "@/hooks/useAPI";

interface Props {
  trades: TradeRecord[];
}

export default function TradeHistory({ trades }: Props) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
          Trade History
        </h2>
        <span className="text-xs text-muted">{trades.length} trades</span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted text-sm">
            No trades yet
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 font-medium">Side</th>
                <th className="text-right py-2 font-medium">Entry</th>
                <th className="text-right py-2 font-medium">Exit</th>
                <th className="text-right py-2 font-medium">SL</th>
                <th className="text-right py-2 font-medium">TP</th>
                <th className="text-right py-2 font-medium">Vol</th>
                <th className="text-right py-2 font-medium">P&L</th>
                <th className="text-right py-2 font-medium">Status</th>
                <th className="text-right py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, idx) => {
                const pnlColor =
                  trade.pnl === null
                    ? "text-muted"
                    : trade.pnl > 0
                    ? "text-profit"
                    : trade.pnl < 0
                    ? "text-loss"
                    : "text-foreground";

                const sideColor =
                  trade.side === "BUY" ? "text-profit" : "text-loss";

                const statusColor =
                  trade.status === "OPEN"
                    ? "text-accent"
                    : trade.status === "CLOSED"
                    ? "text-muted"
                    : "text-hold";

                const time = new Date(trade.opened_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                return (
                  <tr
                    key={trade.id}
                    className="border-b border-border/50 hover:bg-surface-hover transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className={`py-2.5 font-bold ${sideColor}`}>{trade.side}</td>
                    <td className="py-2.5 text-right font-mono">${trade.entry_price.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono">
                      {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono text-loss/70">${trade.sl.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono text-profit/70">${trade.tp.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono">{trade.volume}</td>
                    <td className={`py-2.5 text-right font-mono font-semibold ${pnlColor}`}>
                      {trade.pnl !== null ? `${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)}` : "—"}
                    </td>
                    <td className={`py-2.5 text-right font-medium ${statusColor}`}>
                      {trade.status === "OPEN" && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ticker-pulse" />
                          {trade.status}
                        </span>
                      )}
                      {trade.status !== "OPEN" && trade.status}
                    </td>
                    <td className="py-2.5 text-right text-muted font-mono">{time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
