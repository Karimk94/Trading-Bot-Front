"use client";

import type { TradeExecutedData, ErrorData } from "@/hooks/useWebSocket";

interface ActivityItem {
  id: string;
  type: "trade" | "error" | "info";
  message: string;
  detail?: string;
  timestamp: Date;
}

interface Props {
  lastTrade: TradeExecutedData | null;
  errors: ErrorData[];
}

export default function ActivityFeed({ lastTrade, errors }: Props) {
  const items: ActivityItem[] = [];

  if (lastTrade) {
    items.push({
      id: lastTrade.trade_id,
      type: "trade",
      message: `${lastTrade.side} @ $${lastTrade.entry_price.toFixed(2)}`,
      detail: `Vol: ${lastTrade.volume} | SL: $${lastTrade.stop_loss.toFixed(2)} | TP: $${lastTrade.take_profit.toFixed(2)} | Conf: ${(lastTrade.confidence * 100).toFixed(0)}%`,
      timestamp: new Date(),
    });
  }

  errors.forEach((err, idx) => {
    items.push({
      id: `err-${idx}`,
      type: "error",
      message: `[${err.type}] ${err.message}`,
      timestamp: new Date(),
    });
  });

  const iconMap = {
    trade: (
      <div className="w-7 h-7 rounded-full bg-profit/15 flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-7 h-7 rounded-full bg-loss/15 flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5252" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f8fff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
    ),
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
        Activity Feed
      </h2>

      <div className="flex flex-col gap-2 max-h-48 overflow-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted text-sm">
            No activity yet
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-border/10 transition-colors animate-slide-in-right"
            >
              {iconMap[item.type]}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-foreground/90 font-medium">{item.message}</span>
                {item.detail && (
                  <span className="text-xs text-muted font-mono truncate">{item.detail}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
