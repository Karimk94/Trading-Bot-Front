"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAPI } from "@/hooks/useAPI";
import type { DashboardStats, ForexScan, TradeRecord } from "@/hooks/useAPI";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import AIDecisionPanel from "@/components/AIDecisionPanel";
import TradeHistory from "@/components/TradeHistory";
import ActivityFeed from "@/components/ActivityFeed";
import ApprovalModal from "@/components/ApprovalModal";
import AnalysisModal from "@/components/AnalysisModal";
import ForexTrendsPanel from "@/components/ForexTrendsPanel";

export default function Dashboard() {
  const ws = useWebSocket();
  const api = useAPI();
  const {
    getStats,
    getTrades,
    getLoopStatus,
    startLoop,
    stopLoop,
    closeBotPositions,
    analyzeNow,
    generateWeeklyReport,
    getForexTrends,
    loading,
  } = api;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loopRunning, setLoopRunning] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoApproveUpdating, setAutoApproveUpdating] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [closePositionsLoading, setClosePositionsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    decision: "BUY" | "SELL" | "HOLD";
    confidence: number;
    email_sent: boolean;
    message: string;
  } | null>(null);
  const [forexScan, setForexScan] = useState<ForexScan | null>(null);
  const [forexLoading, setForexLoading] = useState(true);
  const [forexError, setForexError] = useState<string | null>(null);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem("autoApproveTrades") === "true";
    if (!savedPreference) return;

    fetch("http://127.0.0.1:8000/api/loop/auto-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`API ${response.status}`);
        setAutoApprove(true);
      })
      .catch((error) => console.error("Failed to restore auto-approve preference:", error));
  }, []);

  const refreshForex = useCallback(async () => {
    setForexLoading(true);
    try {
      setForexScan(await getForexTrends());
      setForexError(null);
    } catch (e: unknown) {
      setForexError(e instanceof Error ? e.message : "Forex scan is unavailable.");
    } finally {
      setForexLoading(false);
    }
  }, [getForexTrends]);

  const refreshData = useCallback(async () => {
    try {
      const [newStats, newTrades, status] = await Promise.all([
        getStats(),
        getTrades(50),
        getLoopStatus(),
      ]);
      setStats(newStats);
      setTrades(newTrades);
      setLoopRunning(status.running);
    } catch {}
  }, [getStats, getTrades, getLoopStatus]);

  useEffect(() => {
    const initialFetch = window.setTimeout(refreshData, 0);
    const interval = setInterval(refreshData, 10000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [refreshData]);

  useEffect(() => {
    const initialFetch = window.setTimeout(refreshForex, 0);
    const interval = setInterval(refreshForex, 5 * 60 * 1000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [refreshForex]);

  useEffect(() => {
    if (
      ws.lastEvent?.event === "trade_executed" ||
      ws.lastEvent?.event === "trade_closed" ||
      ws.lastEvent?.event === "loop_stopped"
    ) {
      const refreshTimeout = window.setTimeout(refreshData, 0);
      return () => window.clearTimeout(refreshTimeout);
    }
  }, [ws.lastEvent, refreshData]);

  const handleStart = async () => {
    try {
      await startLoop();
      setLoopRunning(true);
    } catch (e: unknown) {
      console.error("Failed to start loop:", e);
      const message = e instanceof Error ? e.message : String(e);
      alert(`Failed to start the trading bot: ${message}\n\nPlease ensure your Saxo Bank OpenAPI keys are configured properly!`);
    }
  };

  const handleStop = async () => {
    try {
      const result = await stopLoop();
      setLoopRunning(false);
      await refreshData();
      alert(result.message);
    } catch (e) {
      console.error("Failed to stop loop:", e);
    }
  };

  const handleClosePositions = async () => {
    if (loopRunning || closePositionsLoading) return;
    const confirmed = window.confirm(
      "Submit market close orders for all open XAU/USD positions tracked by this bot? Orders may fill at a different price. Positions stay marked open until Saxo confirms the closing fill."
    );
    if (!confirmed) return;

    setClosePositionsLoading(true);
    try {
      const result = await closeBotPositions();
      await refreshData();
      alert(result.message);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Could not close bot-tracked positions: ${message}`);
    } finally {
      setClosePositionsLoading(false);
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

  const handleAutoApproveChange = async (enabled: boolean) => {
    setAutoApproveUpdating(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/loop/auto-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      window.localStorage.setItem("autoApproveTrades", String(enabled));
      setAutoApprove(enabled);
    } catch (e) {
      console.error("Failed to update auto-approve preference:", e);
    } finally {
      setAutoApproveUpdating(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const result = await generateWeeklyReport();
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

  const handleAnalyzeNow = async () => {
    setAnalysisLoading(true);
    try {
      const result = await analyzeNow();
      setAnalysisResult(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Manual analysis failed: ${message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <>
      <ApprovalModal
        signal={ws.pendingSignal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <AnalysisModal
        result={analysisResult}
        onClose={() => setAnalysisResult(null)}
      />

      <div className="flex flex-col h-screen overflow-hidden">
        <Header
          connected={ws.connected}
          loopRunning={loopRunning}
          sessionActive={ws.sessionActive}
          sessionName={ws.session?.session_name ?? null}
          currentTimeGST={ws.session?.current_time_gst ?? null}
          iteration={ws.session?.iteration ?? 0}
          autoApprove={autoApprove}
          autoApproveUpdating={autoApproveUpdating}
          onAutoApproveChange={handleAutoApproveChange}
        />

        <main className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          <StatsBar
            stats={stats}
            loopRunning={loopRunning}
            onStart={handleStart}
            onStop={handleStop}
            onClosePositions={handleClosePositions}
            onGenerateReport={handleGenerateReport}
            onAnalyzeNow={handleAnalyzeNow}
            loading={loading}
            closePositionsLoading={closePositionsLoading}
            reportLoading={reportLoading}
            analysisLoading={analysisLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="flex flex-col gap-5">
              <IndicatorsPanel
                indicators={ws.indicators}
                sessionActive={ws.sessionActive}
                loopRunning={loopRunning}
              />
              <ActivityFeed lastTrade={ws.lastTrade} errors={ws.errors} />
            </div>

            <div className="flex flex-col gap-5 order-first lg:order-none h-full">
              <AIDecisionPanel
                decision={ws.decision}
                sessionActive={ws.sessionActive}
                loopRunning={loopRunning}
              />
            </div>

            <div className="flex flex-col gap-5 h-full">
              <TradeHistory trades={trades} />
            </div>
          </div>

          <ForexTrendsPanel
            scan={forexScan}
            loading={forexLoading}
            error={forexError}
            onRefresh={refreshForex}
          />
        </main>
      </div>
    </>
  );
}
