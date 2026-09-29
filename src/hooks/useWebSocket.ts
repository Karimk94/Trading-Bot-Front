"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "ws://127.0.0.1:8000/ws/live";
const RECONNECT_DELAY = 3000;

export type WSEvent =
  | { event: "session_status"; data: SessionStatusData }
  | { event: "indicators"; data: IndicatorsData }
  | { event: "ai_decision"; data: AIDecisionData }
  | { event: "trade_executed"; data: TradeExecutedData }
  | { event: "error"; data: ErrorData }
  | { event: "loop_started"; data: LoopLifecycleData }
  | { event: "loop_stopped"; data: LoopLifecycleData }
  | { event: "signal_pending"; data: PendingSignalData }
  | { event: "signal_approved"; data: { decision: string; message: string } }
  | { event: "signal_rejected"; data: { decision: string; message: string } }
  | { event: "pong"; data: Record<string, never> };

export interface SessionStatusData {
  active: boolean;
  session_name?: string;
  current_time_gst: string;
  open_positions?: number;
  iteration?: number;
}

export interface IndicatorsData {
  rsi_m1: number | null;
  rsi_m5: number | null;
  macd_m1: number | null;
  macd_signal_m1: number | null;
  macd_hist_m1: number | null;
  macd_m5: number | null;
  macd_signal_m5: number | null;
  macd_hist_m5: number | null;
  current_price: number | null;
  spread: number | null;
}

export interface AIDecisionData {
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  stop_loss: number;
  take_profit: number;
  summary: string;
  chain_of_thought: { step_name: string; analysis: string; confidence: number }[];
}

export interface TradeExecutedData {
  trade_id: string;
  ticket: number;
  side: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  volume: number;
  confidence: number;
  summary: string;
}

export interface ErrorData {
  type: string;
  message: string;
}

export interface LoopLifecycleData {
  run_id: string;
  config?: Record<string, unknown>;
  started_at?: string;
  stopped_at?: string;
  total_iterations?: number;
}
export interface PendingSignalData {
  decision: "BUY" | "SELL";
  confidence: number;
  stop_loss: number;
  take_profit: number;
  summary: string;
  current_price: number;
  spread: number;
  chain_of_thought: { step_name: string; analysis: string; confidence: number }[];
  timeout_seconds: number;
  expires_at: string;
  advisory_mode: boolean;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const [session, setSession] = useState<SessionStatusData | null>(null);
  const [indicators, setIndicators] = useState<IndicatorsData | null>(null);
  const [decision, setDecision] = useState<AIDecisionData | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeExecutedData | null>(null);
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [pendingSignal, setPendingSignal] = useState<PendingSignalData | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: "ping" }));
        } else {
          clearInterval(ping);
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WSEvent;
        setLastEvent(parsed);

        switch (parsed.event) {
          case "session_status":
            setSession(parsed.data);
            break;
          case "indicators":
            setIndicators(parsed.data);
            break;
          case "ai_decision":
            setDecision(parsed.data);
            break;
          case "trade_executed":
            setLastTrade(parsed.data);
            break;
          case "signal_pending":
            setPendingSignal(parsed.data);
            break;
          case "signal_approved":
          case "signal_rejected":
            setPendingSignal(null);
            break;
          case "error":
            setErrors((prev) => [parsed.data, ...prev].slice(0, 20));
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sessionActive = session?.active === true;
  return { connected, lastEvent, session, sessionActive, indicators, decision, lastTrade, errors, pendingSignal };
}
