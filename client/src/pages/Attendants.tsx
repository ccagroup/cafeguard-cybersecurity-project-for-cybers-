import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-head">
        <h1>Attendants</h1>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
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
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {data.attendants.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" data-label="Name">
                      {a.name}
                    </th>
                    <td data-label="Email">{a.email}</td>
                    <td data-label="Added">{formatDateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

      <AttendantModal open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </>
  );
}
