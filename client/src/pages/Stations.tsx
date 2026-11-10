import { useState } from "react";
import { Activity, RotateCcw } from "lucide-react";
import { StationStatus } from "../components/Badges";
import { EndSessionModal } from "../components/EndSessionModal";
import { ErrorState } from "../components/ErrorState";
import { StartSessionModal } from "../components/StartSessionModal";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { errorMessage } from "../lib/forms";
import { formatDateTime } from "../lib/format";
import type { AlertDto, Station } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

type Trigger = "report-activity" | "reopen-last";

export function Stations() {
  usePageTitle("Stations");
  const notify = useToast();
  const { data, error, loading, refreshing, reload } = useFetch<{ stations: Station[] }>(
    "/stations",
    30000
  );
  const [starting, setStarting] = useState<Station | null>(null);
  const [ending, setEnding] = useState<Station | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function trigger(station: Station, kind: Trigger) {
    setBusy(`${kind}:${station.id}`);
    try {
      const r = await api<{ alert: AlertDto | null; message?: string }>(
        `/stations/${station.id}/${kind}`,
        { method: "POST" }
      );
      notify(r.alert ? `Alert raised: ${r.alert.message}` : (r.message ?? "No alert was raised."), "info");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stations</h1>
          <p className="muted">
            “Report activity” and “Reopen last session” are manual triggers for the detection rule,
            until stations report automatically.
          </p>
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}

      {data && (
        <section className={`panel table-panel${refreshing ? " is-refreshing" : ""}`}>
          <table className="table">
            <caption className="visually-hidden">Stations and their current sessions</caption>
            <thead>
              <tr>
                <th scope="col">Station</th>
                <th scope="col">Status</th>
                <th scope="col">Customer</th>
                <th scope="col">Started</th>
                <th scope="col">Started by</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.stations.map((s) => (
                <tr key={s.id}>
                  <th scope="row" data-label="Station" className="mono">
                    {s.label}
                  </th>
                  <td data-label="Status">
                    <StationStatus status={s.status} />
                  </td>
                  <td data-label="Customer">{s.openSession?.customerName ?? "—"}</td>
                  <td data-label="Started">
                    {s.openSession ? formatDateTime(s.openSession.startedAt) : "—"}
                  </td>
                  <td data-label="Started by">{s.openSession?.startedBy ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      {s.status === "FREE" ? (
                        <button className="btn btn-secondary btn-small" onClick={() => setStarting(s)}>
                          Start session
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-small" onClick={() => setEnding(s)}>
                          End session
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-small"
                        disabled={busy === `report-activity:${s.id}`}
                        onClick={() => void trigger(s, "report-activity")}
                      >
                        <Activity size={14} aria-hidden="true" />
                        Report activity
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        disabled={busy === `reopen-last:${s.id}`}
                        onClick={() => void trigger(s, "reopen-last")}
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                        Reopen last session
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <StartSessionModal station={starting} onClose={() => setStarting(null)} onDone={reload} />
      <EndSessionModal station={ending} onClose={() => setEnding(null)} onDone={reload} />
    </>
  );
}
