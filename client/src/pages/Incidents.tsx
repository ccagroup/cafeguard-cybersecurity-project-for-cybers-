import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { IncidentSeverityBadge, IncidentStatusBadge } from "../components/Badges";
import { ErrorState } from "../components/ErrorState";
import { IncidentModal } from "../components/IncidentModal";
import { formatDateTime } from "../lib/format";
import { incidentTypeLabel } from "../lib/labels";
import type { IncidentDto } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

export function Incidents() {
  usePageTitle("Incidents");
  const { data, error, loading, refreshing, reload } = useFetch<{ incidents: IncidentDto[] }>(
    "/incidents",
    30000
  );
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-head">
        <h1>Incidents</h1>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} aria-hidden="true" />
            Report an Incident
          </button>
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="skeleton" style={{ height: "16rem" }} aria-busy="true" />}

      {data &&
        (data.incidents.length === 0 ? (
          <div className="panel">
            <p className="empty">No incidents have been reported. That is good news.</p>
          </div>
        ) : (
          <section className={`panel table-panel${refreshing ? " is-refreshing" : ""}`}>
            <table className="table">
              <caption className="visually-hidden">Reported incidents, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Reported</th>
                  <th scope="col">Incident</th>
                  <th scope="col">Station</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Reported by</th>
                </tr>
              </thead>
              <tbody>
                {data.incidents.map((i) => {
                  const type = incidentTypeLabel[i.type] ?? i.type;
                  return (
                    <tr key={i.id}>
                      <td data-label="Reported">{formatDateTime(i.createdAt)}</td>
                      <th scope="row" data-label="Incident">
                        <Link
                          to={`/app/incidents/${i.id}`}
                          aria-label={`${type} on ${i.station.label}, reported ${formatDateTime(i.createdAt)}`}
                        >
                          {type}
                        </Link>
                      </th>
                      <td data-label="Station" className="mono">
                        {i.station.label}
                      </td>
                      <td data-label="Severity">
                        <IncidentSeverityBadge severity={i.severity} />
                      </td>
                      <td data-label="Status">
                        <IncidentStatusBadge status={i.status} />
                      </td>
                      <td data-label="Reported by">{i.reportedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

      <IncidentModal open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </>
  );
}
