"use client";

import { useState, useCallback } from "react";

const API = "http://127.0.0.1:8000";

export interface DashboardStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  open_positions: number;
  avg_confidence: number;
}

export interface TradeRecord {
  id: string;
  run_id: string;
  ticket: number | null;
  symbol: string;
  side: "BUY" | "SELL";
  entry_price: number;
  exit_price: number | null;
  sl: number;
  tp: number;
  volume: number;
  pnl: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  opened_at: string;
  closed_at: string | null;
}

export interface LoopStatus {
  running: boolean;
  run_id: string | null;
  iteration: number;
  current_time_gst: string;
  active_session: { name: string; start_hour: number; end_hour: number } | null;
  config: {
    loop_interval: number;
    max_positions: number;
    min_confidence: number;
    lot_size: number;
  };
}

export interface AIDecisionRecord {
  id: string;
  trade_id: string | null;
  run_id: string;
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning_json: string;
  indicators_json: string;
  created_at: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export function useAPI() {
  const [loading, setLoading] = useState(false);

  const getStats = useCallback(
    (runId?: string) =>
      apiFetch<DashboardStats>(`/api/trades/stats${runId ? `?run_id=${runId}` : ""}`),
    []
  );

  const getTrades = useCallback(
    (limit = 50) => apiFetch<TradeRecord[]>(`/api/trades/history?limit=${limit}`),
    []
  );

  const getDecisions = useCallback(
    (limit = 20) => apiFetch<AIDecisionRecord[]>(`/api/trades/decisions?limit=${limit}`),
    []
  );

  const getLoopStatus = useCallback(
    () => apiFetch<LoopStatus>("/api/loop/status"),
    []
  );

  const startLoop = useCallback(async () => {
    setLoading(true);
    try {
      return await apiFetch<{ status: string; run_id: string }>(
        "/api/loop/start",
        { method: "POST" }
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const stopLoop = useCallback(async () => {
    setLoading(true);
    try {
      return await apiFetch<{ status: string }>("/api/loop/stop", {
        method: "POST",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const connectMT5 = useCallback(
    () => apiFetch<{ status: string }>("/api/mt5/connect", { method: "POST" }),
    []
  );

  const disconnectMT5 = useCallback(
    () => apiFetch<{ status: string }>("/api/mt5/disconnect", { method: "POST" }),
    []
  );

  const generateWeeklyReport = useCallback(
    () => apiFetch<{ success: boolean; report_week: string; period_label: string; message: string }>(
      "/api/trades/report",
      { method: "POST" }
    ),
    []
  );

  return {
    loading,
    getStats,
    getTrades,
    getDecisions,
    getLoopStatus,
    startLoop,
    stopLoop,
    connectMT5,
    disconnectMT5,
    generateWeeklyReport,
  };
}
