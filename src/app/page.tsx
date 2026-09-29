"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAPI } from "@/hooks/useAPI";
import type { DashboardStats, TradeRecord } from "@/hooks/useAPI";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import AIDecisionPanel from "@/components/AIDecisionPanel";
import TradeHistory from "@/components/TradeHistory";
import ActivityFeed from "@/components/ActivityFeed";
import ApprovalModal from "@/components/ApprovalModal";

export default function Dashboard() {
  const ws = useWebSocket();
  const api = useAPI();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loopRunning, setLoopRunning] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [newStats, newTrades, status] = await Promise.all([
        api.getStats(),
        api.getTrades(50),
        api.getLoopStatus(),
      ]);
      setStats(newStats);
      setTrades(newTrades);
      setLoopRunning(status.running);
    } catch {}
  }, [api]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    if (ws.lastEvent?.event === "trade_executed" || ws.lastEvent?.event === "loop_stopped") {
      refreshData();
    }
  }, [ws.lastEvent, refreshData]);

  const handleStart = async () => {
    try {
      await api.startLoop();
      setLoopRunning(true);
    } catch (e: unknown) {
      console.error("Failed to start loop:", e);
      const message = e instanceof Error ? e.message : String(e);
      alert(`Failed to start the trading bot: ${message}\n\nPlease ensure your Saxo Bank OpenAPI keys are configured properly!`);
    }
  };

  const handleStop = async () => {
    try {
      await api.stopLoop();
      setLoopRunning(false);
      refreshData();
    } catch (e) {
      console.error("Failed to stop loop:", e);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/loop/approve", { method: "POST" });
      refreshData();
    } catch (e) {
      console.error("Failed to approve signal:", e);
    }
  };

  const handleReject = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/loop/reject", { method: "POST" });
    } catch (e) {
      console.error("Failed to reject signal:", e);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const result = await api.generateWeeklyReport();
      if (result.success) {
        alert(`Weekly BUY report generated for ${result.period_label}.`);
      } else {
        alert("No weekly BUY report was generated. Check the email settings or the available data.");
      }
    } catch (e: unknown) {
      console.error("Failed to generate report:", e);
      const message = e instanceof Error ? e.message : String(e);
      alert(`Failed to generate the weekly report: ${message}`);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <ApprovalModal
        signal={ws.pendingSignal}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <div className="flex flex-col h-screen overflow-hidden">
        <Header
          connected={ws.connected}
          loopRunning={loopRunning}
          sessionActive={ws.sessionActive}
          sessionName={ws.session?.session_name ?? null}
          currentTimeGST={ws.session?.current_time_gst ?? null}
          iteration={ws.session?.iteration ?? 0}
        />

        <main className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          <StatsBar
            stats={stats}
            loopRunning={loopRunning}
            onStart={handleStart}
            onStop={handleStop}
            onGenerateReport={handleGenerateReport}
            loading={api.loading}
            reportLoading={reportLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
            <div className="flex flex-col gap-5">
              <IndicatorsPanel
                indicators={ws.indicators}
                sessionActive={ws.sessionActive}
                loopRunning={loopRunning}
              />
              <ActivityFeed lastTrade={ws.lastTrade} errors={ws.errors} />
            </div>

            <div className="flex flex-col gap-5">
              <AIDecisionPanel
                decision={ws.decision}
                sessionActive={ws.sessionActive}
                loopRunning={loopRunning}
              />
            </div>

            <div className="flex flex-col gap-5 min-h-0">
              <TradeHistory trades={trades} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
