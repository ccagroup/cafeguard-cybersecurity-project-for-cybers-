import { useState } from "react";
import { Search } from "lucide-react";
import { ErrorState } from "../components/ErrorState";
import { formatFull } from "../lib/format";
import { capitalise } from "../lib/labels";
import type { AuditEntry } from "../lib/types";
import { useDebounced } from "../lib/useDebounced";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

export function Audit() {
  usePageTitle("Audit trail");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(100);
  const q = useDebounced(query.trim(), 300);

  const path = `/audit?q=${encodeURIComponent(q)}&limit=${limit}`;
  const { data, error, loading, refreshing, reload } = useFetch<{ entries: AuditEntry[] }>(path);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p className="muted">
            A record of every action. Entries are added automatically and cannot be edited or
            deleted.
          </p>
        </div>
      </div>

      <div className="search">
        <label htmlFor="audit-search" className="visually-hidden">
          Search the audit trail
        </label>
        <Search size={18} aria-hidden="true" />
        <input
          id="audit-search"
          className="input"
          type="search"
          placeholder="Search by person, action, station, detail, IP or date (2026-11-10)"
          value={query}
          maxLength={100}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(100);
          }}
        />
      </div>

      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />}

      {data &&
        (data.entries.length === 0 ? (
          <div className="panel">
            <p className="empty">{q ? "No entries match your search." : "Nothing has been recorded yet."}</p>
          </div>
        ) : (
          <section className={`panel table-panel${refreshing ? " is-refreshing" : ""}`}>
            <table className="table">
              <caption className="visually-hidden">Audit entries, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">Action</th>
                  <th scope="col">Station</th>
                  <th scope="col">Details</th>
                  <th scope="col">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id}>
                    <td data-label="When" className="nowrap">
                      {formatFull(e.at)}
                    </td>
                    <td data-label="Who">{e.actor ?? "Unknown"}</td>
                    <th scope="row" data-label="Action">
                      {capitalise(e.action)}
                    </th>
                    <td data-label="Station" className="mono">
                      {e.station ?? "—"}
                    </td>
                    <td data-label="Details">
                      {e.detail && <span>{e.detail}</span>}
                      {e.target && <span className="mono target">ID {e.target}</span>}
                      {!e.detail && !e.target && "—"}
                    </td>
                    <td data-label="IP" className="mono">
                      {e.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-foot">
              <span className="muted">
                Showing the latest {data.entries.length} {data.entries.length === 1 ? "entry" : "entries"}
                {q ? ` matching “${q}”` : ""}.
              </span>
              {data.entries.length === limit && limit < 500 && (
                <button className="btn btn-secondary btn-small" onClick={() => setLimit((l) => Math.min(500, l + 100))}>
                  Show more
                </button>
              )}
            </div>
          </section>
        ))}
    </>
  );
}
