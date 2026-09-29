"use client";

import type { IndicatorsData } from "@/hooks/useWebSocket";

interface Props {
  indicators: IndicatorsData | null;
  sessionActive: boolean;
  loopRunning: boolean;
}

function Gauge({ label, value, min, max, zones }: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  zones: { threshold: number; color: string }[];
}) {
  const v = value ?? 0;
  const pct = Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  let barColor = "bg-accent";
  for (const z of zones) {
    if (v >= z.threshold) barColor = z.color;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-mono stat-value text-foreground">
          {value !== null ? value.toFixed(2) : "—"}
        </span>
      </div>
      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: value !== null ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function MACDValue({ label, value }: { label: string; value: number | null }) {
  const color = value === null ? "text-muted" : value > 0 ? "text-profit" : value < 0 ? "text-loss" : "text-foreground";
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-mono stat-value ${color}`}>
        {value !== null ? value.toFixed(4) : "—"}
      </span>
    </div>
  );
}

function IdleOverlay({ loopRunning }: { loopRunning: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/40">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">
          {loopRunning ? "Outside trading session" : "Bot is stopped"}
        </span>
        <span className="text-xs text-muted/50">
          {loopRunning
            ? "Indicators will appear when London or NY session opens (GST 12:00–21:00)"
            : "Start the bot to see live indicator data"}
        </span>
      </div>
    </div>
  );
}

export default function IndicatorsPanel({ indicators, sessionActive, loopRunning }: Props) {
  const i = indicators;
  const hasData = i !== null;

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
          Live Indicators
        </h2>
        {i?.current_price && (
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold stat-value text-foreground">
              ${i.current_price.toFixed(2)}
            </span>
            {i.spread !== null && (
              <span className="text-xs text-muted px-1.5 py-0.5 rounded bg-border/30">
                {i.spread.toFixed(2)} spd
              </span>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <IdleOverlay loopRunning={loopRunning} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-accent/70 uppercase tracking-widest">M1</span>
            <Gauge
              label="RSI (14)"
              value={i?.rsi_m1 ?? null}
              min={0}
              max={100}
              zones={[
                { threshold: 0, color: "bg-loss" },
                { threshold: 30, color: "bg-accent" },
                { threshold: 70, color: "bg-profit" },
              ]}
            />
            <MACDValue label="MACD" value={i?.macd_m1 ?? null} />
            <MACDValue label="Signal" value={i?.macd_signal_m1 ?? null} />
            <MACDValue label="Histogram" value={i?.macd_hist_m1 ?? null} />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-accent/70 uppercase tracking-widest">M5</span>
            <Gauge
              label="RSI (14)"
              value={i?.rsi_m5 ?? null}
              min={0}
              max={100}
              zones={[
                { threshold: 0, color: "bg-loss" },
                { threshold: 30, color: "bg-accent" },
                { threshold: 70, color: "bg-profit" },
              ]}
            />
            <MACDValue label="MACD" value={i?.macd_m5 ?? null} />
            <MACDValue label="Signal" value={i?.macd_signal_m5 ?? null} />
            <MACDValue label="Histogram" value={i?.macd_hist_m5 ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
