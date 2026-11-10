import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AttendantModal } from "../components/AttendantModal";
import { SeverityBadge } from "../components/Badges";
import { ErrorState } from "../components/ErrorState";
import { IncidentModal } from "../components/IncidentModal";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { errorMessage } from "../lib/forms";
import { formatDateTime, longDay, shortDay } from "../lib/format";
import type { AlertDto } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

type Dash = {
  counts: {
    activeSessions: number;
    openIncidents: number;
    alertsToday: number;
    endedWithoutChecklist: number;
  };
  sessionsPerDay: { date: string; count: number }[];
  recentAlerts: AlertDto[];
};

export function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const { data, error, loading, refreshing, reload } = useFetch<Dash>("/dashboard", 30000);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [attendantOpen, setAttendantOpen] = useState(false);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setIncidentOpen(true)}>
            <Plus size={18} aria-hidden="true" />
            Report an Incident
          </button>
          {user?.role === "ADMIN" && (
            <button className="btn btn-secondary" onClick={() => setAttendantOpen(true)}>
              <UserPlus size={18} aria-hidden="true" />
              Add attendant
            </button>
          )}
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}

      {loading && (
        <div aria-busy="true" aria-label="Loading dashboard">
          <div className="skeleton" style={{ height: "6rem", marginBottom: "var(--space-5)" }} />
          <div className="skeleton" style={{ height: "18rem" }} />
        </div>
      )}

      {data && (
        <div className={refreshing ? "is-refreshing" : undefined}>
          <StatStrip counts={data.counts} />
          <div className="dash-grid">
            <SessionsChart days={data.sessionsPerDay} />
            <RecentAlerts alerts={data.recentAlerts} onChanged={reload} />
          </div>
        </div>
      )}

      <IncidentModal open={incidentOpen} onClose={() => setIncidentOpen(false)} onCreated={reload} />
      <AttendantModal open={attendantOpen} onClose={() => setAttendantOpen(false)} />
    </>
  );
}

function StatStrip({ counts }: { counts: Dash["counts"] }) {
  const stats = [
    { label: "Active sessions", value: counts.activeSessions, note: "Open right now" },
    { label: "Open incidents", value: counts.openIncidents, note: "Open or investigating" },
    { label: "Alerts today", value: counts.alertsToday, note: "Since midnight" },
    {
      label: "Ended without checklist",
      value: counts.endedWithoutChecklist,
      note: "All sessions to date",
    },
  ];
  return (
    <ul className="stats" aria-label="Key numbers">
      {stats.map((s) => (
        <li key={s.label}>
          <span className="stat-label">{s.label}</span>
          <span className="stat-value">{s.value}</span>
          <span className="stat-note">{s.note}</span>
        </li>
      ))}
    </ul>
  );
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value ?? 0);
  return (
    <div className="chart-tip">
      <p className="chart-tip-value">
        <span className="chart-tip-key" aria-hidden="true" />
        {value} {value === 1 ? "session" : "sessions"}
      </p>
      <p className="muted">{longDay(String(label))}</p>
    </div>
  );
}

function SessionsChart({ days }: { days: { date: string; count: number }[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const peak = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
  const maxCount = Math.max(4, ...days.map((d) => d.count));
  const step = Math.ceil(maxCount / 4);
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const summary =
    total === 0
      ? "No sessions were started in the last 14 days."
      : `${total} sessions in the last 14 days. Busiest day: ${longDay(peak.date)} with ${peak.count}.`;

  return (
    <section className="panel" aria-labelledby="chart-title">
      <div className="panel-head">
        <div>
          <h2 id="chart-title">Sessions per day</h2>
          <p className="muted">Last 14 days</p>
        </div>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setView(view === "chart" ? "table" : "chart")}
        >
          {view === "chart" ? "View as table" : "View as chart"}
        </button>
      </div>

      <p className="visually-hidden">{summary}</p>

      {view === "chart" ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-strong)" }}
                minTickGap={28}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, step * 4]}
                ticks={yTicks}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTip />}
                cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              />
              <Line
                type="linear"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table className="table">
          <caption className="visually-hidden">Sessions started per day, last 14 days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date}>
                <td data-label="Day">{longDay(d.date)}</td>
                <td data-label="Sessions">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RecentAlerts({ alerts, onChanged }: { alerts: AlertDto[]; onChanged: () => void }) {
  const notify = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function acknowledge(id: string) {
    setBusy(id);
    try {
      await api(`/alerts/${id}/acknowledge`, { method: "POST" });
      notify("Alert acknowledged.");
      onChanged();
    } catch (err) {
      notify(errorMessage(err), "error");
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel" aria-labelledby="alerts-title">
      <div className="panel-head">
        <h2 id="alerts-title">Recent alerts</h2>
      </div>
      {alerts.length === 0 ? (
        <p className="empty">No alerts yet. Alerts appear here when the detection rule fires.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((a) => (
            <li key={a.id} className="alert-item">
              <div className="alert-top">
                <SeverityBadge severity={a.severity} />
                <span className="muted">
                  {a.station.label} · {formatDateTime(a.createdAt)}
                </span>
              </div>
              <p>{a.message}</p>
              {a.acknowledgedAt ? (
                <p className="muted">Acknowledged by {a.acknowledgedBy ?? "staff"}</p>
              ) : (
                <div>
                  <button
                    className="btn btn-secondary btn-small"
                    disabled={busy === a.id}
                    onClick={() => void acknowledge(a.id)}
                  >
                    {busy === a.id ? "Saving…" : "Acknowledge"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
