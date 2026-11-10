import { useState } from "react";
import { AcknowledgeButton } from "../components/AcknowledgeButton";
import { SeverityBadge } from "../components/Badges";
import { ErrorState } from "../components/ErrorState";
import { formatDateTime } from "../lib/format";
import type { AlertDto } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

type Filter = "open" | "all";

export function Alerts() {
  usePageTitle("Alerts");
  const [filter, setFilter] = useState<Filter>("open");
  const { data, error, loading, refreshing, reload } = useFetch<{ alerts: AlertDto[] }>(
    `/alerts?status=${filter}&limit=100`,
    30000
  );

  return (
    <>
      <div className="page-head">
        <h1>Alerts</h1>
        <div className="segmented" role="group" aria-label="Filter alerts">
          <button aria-pressed={filter === "open"} onClick={() => setFilter("open")}>
            Not acknowledged
          </button>
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All alerts
          </button>
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="skeleton" style={{ height: "14rem" }} aria-busy="true" />}

      {data &&
        (data.alerts.length === 0 ? (
          <div className="panel">
            <p className="empty">
              {filter === "open"
                ? "Every alert has been acknowledged."
                : "No alerts yet. Alerts appear when the detection rule fires."}
            </p>
          </div>
        ) : (
          <section className={`panel table-panel${refreshing ? " is-refreshing" : ""}`}>
            <table className="table">
              <caption className="visually-hidden">Alerts, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Alert</th>
                  <th scope="col">Station</th>
                  <th scope="col">Raised</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.alerts.map((a) => (
                  <tr key={a.id}>
                    <td data-label="Severity">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <th scope="row" data-label="Alert">
                      {a.message}
                    </th>
                    <td data-label="Station" className="mono">
                      {a.station.label}
                    </td>
                    <td data-label="Raised">{formatDateTime(a.createdAt)}</td>
                    <td>
                      {a.acknowledgedAt ? (
                        <span className="muted">Acknowledged by {a.acknowledgedBy ?? "staff"}</span>
                      ) : (
                        <AcknowledgeButton id={a.id} onDone={reload} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
    </>
  );
}
