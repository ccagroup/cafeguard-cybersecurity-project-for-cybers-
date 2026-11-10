import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AttendantAccessModal } from "../components/AttendantAccessModal";
import type { AccessChange } from "../components/AttendantAccessModal";
import { AttendantModal } from "../components/AttendantModal";
import { ErrorState } from "../components/ErrorState";
import { formatDateTime } from "../lib/format";
import type { AttendantDto } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

export function Attendants() {
  usePageTitle("Attendants");
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <>
        <div className="page-head">
          <h1>Attendants</h1>
        </div>
        <div className="panel" role="alert">
          <p>Only the café owner can manage attendants.</p>
        </div>
      </>
    );
  }
  return <AttendantList />;
}

function AttendantList() {
  const { data, error, loading, refreshing, reload } = useFetch<{ attendants: AttendantDto[] }>(
    "/attendants"
  );
  const [adding, setAdding] = useState(false);
  const [change, setChange] = useState<AccessChange | null>(null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Attendants</h1>
          <p className="muted">
            Removing an attendant blocks their sign-in. Their history stays in the records.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <UserPlus size={18} aria-hidden="true" />
            Add attendant
          </button>
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="skeleton" style={{ height: "12rem" }} aria-busy="true" />}

      {data &&
        (data.attendants.length === 0 ? (
          <div className="panel">
            <p className="empty">No attendants yet. Add the first one to let staff sign in.</p>
          </div>
        ) : (
          <section className={`panel table-panel${refreshing ? " is-refreshing" : ""}`}>
            <table className="table">
              <caption className="visually-hidden">Attendant accounts</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.attendants.map((a) => {
                  const removed = !!a.deactivatedAt;
                  return (
                    <tr key={a.id} className={removed ? "row-muted" : undefined}>
                      <th scope="row" data-label="Name">
                        {a.name}
                      </th>
                      <td data-label="Email">{a.email}</td>
                      <td data-label="Status">
                        {removed ? (
                          <span className="badge badge-neutral">Removed</span>
                        ) : (
                          <span className="badge badge-success">Active</span>
                        )}
                      </td>
                      <td data-label="Added">{formatDateTime(a.createdAt)}</td>
                      <td>
                        {removed ? (
                          <button
                            className="btn btn-secondary btn-small"
                            aria-label={`Restore access for ${a.name}`}
                            onClick={() => setChange({ attendant: a, mode: "restore" })}
                          >
                            Restore access
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger btn-small"
                            aria-label={`Remove ${a.name}`}
                            onClick={() => setChange({ attendant: a, mode: "remove" })}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

      <AttendantModal open={adding} onClose={() => setAdding(false)} onCreated={reload} />
      <AttendantAccessModal change={change} onClose={() => setChange(null)} onDone={reload} />
    </>
  );
}
