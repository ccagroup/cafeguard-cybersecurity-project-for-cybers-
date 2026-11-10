import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { IncidentSeverityBadge, IncidentStatusBadge } from "../components/Badges";
import { ErrorState } from "../components/ErrorState";
import { Field, fieldProps } from "../components/Field";
import { useToast } from "../components/Toast";
import { ApiError, api } from "../lib/api";
import { errorMessage, serverFieldErrors } from "../lib/forms";
import { formatClock, formatDateTime, formatFull } from "../lib/format";
import { capitalise, incidentStatusLabel, incidentTypeLabel } from "../lib/labels";
import type { IncidentDto, TimelineItem } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../lib/usePageTitle";

type Detail = {
  incident: IncidentDto;
  timeline: { from: string; to: string; items: TimelineItem[] };
};

export function IncidentDetail() {
  usePageTitle("Incident");
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useFetch<Detail>(`/incidents/${encodeURIComponent(id)}`);

  return (
    <>
      <Link to="/app/incidents" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        All incidents
      </Link>

      {loading && <div className="skeleton" style={{ height: "18rem" }} aria-busy="true" />}

      {error && !data && (
        <ErrorState
          message={error === "Incident not found" ? "This incident does not exist." : error}
          onRetry={reload}
        />
      )}

      {data && <DetailBody data={data} reload={reload} />}
    </>
  );
}

function DetailBody({ data, reload }: { data: Detail; reload: () => void }) {
  const { incident, timeline } = data;
  const notify = useToast();

  const [status, setStatus] = useState(incident.status);
  const [statusPending, setStatusPending] = useState(false);

  const [notes, setNotes] = useState(incident.notes);
  const [notesError, setNotesError] = useState("");
  const [notesPending, setNotesPending] = useState(false);

  async function saveStatus() {
    setStatusPending(true);
    try {
      await api(`/incidents/${incident.id}/status`, { method: "PATCH", body: { status } });
      notify("Status saved.");
      reload();
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setStatusPending(false);
    }
  }

  async function saveNotes() {
    setNotesError("");
    setNotesPending(true);
    try {
      await api(`/incidents/${incident.id}/notes`, { method: "PUT", body: { notes } });
      notify("Notes saved.");
      reload();
    } catch (err) {
      setNotesError(serverFieldErrors(err).notes ?? errorMessage(err));
      if (err instanceof ApiError && err.status === 0) notify(err.message, "error");
    } finally {
      setNotesPending(false);
    }
  }

  const type = incidentTypeLabel[incident.type] ?? incident.type;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{type}</h1>
          <p className="muted">
            on <span className="mono">{incident.station.label}</span> · reported{" "}
            {formatDateTime(incident.createdAt)}
          </p>
        </div>
        <div className="actions">
          <IncidentSeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
        </div>
      </div>

      <div className="detail-stack">
        <section className="panel" aria-labelledby="what-title">
          <h2 id="what-title" style={{ marginBottom: "var(--space-4)" }}>
            What was reported
          </h2>
          <dl className="facts">
            <dt>Reported by</dt>
            <dd>{incident.reportedBy}</dd>
            <dt>Description</dt>
            <dd className="pre">{incident.description}</dd>
          </dl>
        </section>

        <section className="panel" aria-labelledby="work-title">
          <h2 id="work-title" style={{ marginBottom: "var(--space-4)" }}>
            Investigation
          </h2>

          <div className="inline-form">
            <Field id="status" label="Status">
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                {...fieldProps("status")}
              >
                {Object.entries(incidentStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="btn btn-secondary"
              disabled={statusPending || status === incident.status}
              onClick={() => void saveStatus()}
            >
              {statusPending ? "Saving…" : "Save status"}
            </button>
          </div>

          <div style={{ marginTop: "var(--space-5)" }}>
            <Field
              id="notes"
              label="Notes"
              error={notesError}
              hint={`${notes.length} / 5000 characters. Do not write down any customer passwords.`}
            >
              <textarea
                className="textarea"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                {...fieldProps("notes", notesError)}
              />
            </Field>
            <button
              className="btn btn-secondary"
              style={{ marginTop: "var(--space-3)" }}
              disabled={notesPending || notes === incident.notes}
              onClick={() => void saveNotes()}
            >
              {notesPending ? "Saving…" : "Save notes"}
            </button>
          </div>
        </section>

        <section className="panel" aria-labelledby="timeline-title">
          <h2 id="timeline-title">Timeline for {incident.station.label}</h2>
          <p className="muted" style={{ margin: "var(--space-1) 0 var(--space-5)" }}>
            From 4 hours before to 2 hours after the report: {formatDateTime(timeline.from)} to{" "}
            {formatDateTime(timeline.to)}.
          </p>
          {timeline.items.length === 0 ? (
            <p className="empty">Nothing was recorded on this station in that window.</p>
          ) : (
            <ol className="timeline">
              {timeline.items.map((item, idx) => (
                <li key={`${item.kind}-${idx}-${item.at}`} className={`is-${item.kind}`}>
                  <p className="timeline-time">{formatFull(item.at)}</p>
                  <p className="timeline-title">
                    <span className="badge badge-neutral">
                      {item.kind === "session" ? "Session" : "Audit"}
                    </span>{" "}
                    {item.kind === "session" ? sessionTitle(item) : capitalise(item.title)}
                  </p>
                  {item.kind === "audit" && item.detail && <p className="muted">{item.detail}</p>}
                  {item.kind === "session" && item.session && (
                    <p className="muted">{sessionDetail(item.session)}</p>
                  )}
                  {item.actor && <p className="muted">By {item.actor}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function sessionTitle(item: TimelineItem): string {
  return `Customer session: ${item.session?.customerName ?? ""}`;
}

function sessionDetail(s: NonNullable<TimelineItem["session"]>): string {
  const start = `Started ${formatClock(s.startedAt)}`;
  if (!s.endedAt) return `${start}. Still open.`;
  const how = s.endedProperly ? "with the checklist completed" : "without the checklist";
  const by = s.endedBy ? ` by ${s.endedBy}` : "";
  return `${start}. Ended ${formatClock(s.endedAt)}${by}, ${how}.`;
}
