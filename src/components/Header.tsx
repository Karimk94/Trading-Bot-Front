"use client";

interface Props {
  connected: boolean;
  loopRunning: boolean;
  sessionActive: boolean;
  sessionName: string | null;
  currentTimeGST: string | null;
  iteration: number;
}

const SESSIONS_GST = [
  { name: "London-GST Overlap", startHour: 12, startMin: 0, endHour: 16, endMin: 0 },
  { name: "New York-GST Overlap", startHour: 16, startMin: 0, endHour: 21, endMin: 0 },
];

function getNextSessionInfo(currentGST: Date): { name: string; startsIn: string } {
  const nowMins = currentGST.getHours() * 60 + currentGST.getMinutes();
  const nowSecs = currentGST.getSeconds();

  for (const s of SESSIONS_GST) {
    const startMins = s.startHour * 60 + s.startMin;
    if (startMins > nowMins) {
      const diffSecs = (startMins - nowMins) * 60 - nowSecs;
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return { name: s.name, startsIn: label };
    }
  }
  // Next day: London opens at 12:00
  const londonStart = 12 * 60;
  const minsUntilMidnight = 24 * 60 - nowMins;
  const diffSecs = (minsUntilMidnight + londonStart) * 60 - nowSecs;
  const h = Math.floor(diffSecs / 3600);
  const m = Math.floor((diffSecs % 3600) / 60);
  return { name: "London-GST Overlap", startsIn: `${h}h ${m}m` };
}

export default function Header({
  connected,
  loopRunning,
  sessionActive,
  sessionName,
  currentTimeGST,
  iteration,
}: Props) {
  const now = currentTimeGST ? new Date(currentTimeGST) : null;

  const timeStr = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "--:--:--";

  const nextSession = loopRunning && !sessionActive && now ? getNextSessionInfo(now) : null;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            XAU<span className="text-accent">/USD</span>{" "}
            <span className="text-muted font-normal text-sm">Scalper</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Active session badge */}
        {sessionActive && sessionName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ticker-pulse" />
            <span className="text-xs font-medium text-accent">{sessionName}</span>
          </div>
        )}

        {/* Sleeping badge with countdown */}
        {nextSession && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-border/30 border border-border">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs text-muted">
              Sleeping · <span className="font-mono text-foreground/60">{nextSession.name}</span> in{" "}
              <span className="font-mono font-semibold text-accent">{nextSession.startsIn}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-mono stat-value">{timeStr}</span>
          <span className="text-border">GST</span>
        </div>

        {loopRunning && (
          <div className="text-xs text-muted font-mono">
            #{iteration}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-profit" : "bg-loss"
            }`}
          />
          <span className="text-xs text-muted">
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
