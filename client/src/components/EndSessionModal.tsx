import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { errorMessage } from "../lib/forms";
import type { Station } from "../lib/types";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

type Props = { station: Station | null; onClose: () => void; onDone: () => void };

export function EndSessionModal({ station, onClose, onDone }: Props) {
  return (
    <Modal
      open={!!station?.openSession}
      onClose={onClose}
      title={station ? `End session on ${station.label}` : "End session"}
    >
      {station?.openSession && <EndForm station={station} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

const items = [
  { key: "loggedOut", label: "Logged out of all accounts" },
  { key: "browserCleared", label: "Browser data cleared" },
  { key: "noPasswordsSaved", label: "No passwords saved" },
] as const;

type Key = (typeof items)[number]["key"];

function EndForm({ station, onClose, onDone }: { station: Station } & Omit<Props, "station">) {
  const { user } = useAuth();
  const notify = useToast();
  const [ticks, setTicks] = useState<Record<Key, boolean>>({
    loggedOut: false,
    browserCleared: false,
    noPasswordsSaved: false,
  });
  const [confirmForce, setConfirmForce] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const session = station.openSession!;
  const allTicked = items.every((i) => ticks[i.key]);

  async function run(path: string, body: unknown, success: string) {
    setError("");
    setPending(true);
    try {
      await api(path, { method: "POST", body });
      notify(success);
      onDone();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <p className="muted" style={{ marginBottom: "var(--space-4)" }}>
        Customer: <strong style={{ color: "var(--text)" }}>{session.customerName}</strong>
      </p>

      <fieldset className="checklist">
        <legend>Confirm before ending</legend>
        {items.map((i) => (
          <label key={i.key} className="check">
            <input
              type="checkbox"
              checked={ticks[i.key]}
              onChange={(e) => setTicks((t) => ({ ...t, [i.key]: e.target.checked }))}
            />
            {i.label}
          </label>
        ))}
      </fieldset>

      {confirmForce ? (
        <div className="notice notice-error" style={{ marginTop: "var(--space-4)" }}>
          <p>
            This ends the session without the checklist. It is recorded as not ended properly and
            counted on the dashboard.
          </p>
          <div className="modal-actions" style={{ marginTop: "var(--space-3)" }}>
            <button className="btn btn-secondary btn-small" onClick={() => setConfirmForce(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger btn-small"
              disabled={pending}
              onClick={() =>
                void run(`/sessions/${session.id}/force-end`, undefined, "Session ended without the checklist.")
              }
            >
              Confirm end without checklist
            </button>
          </div>
        </div>
      ) : (
        <div className="modal-actions">
          {user?.role === "ADMIN" && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginRight: "auto" }}
              onClick={() => setConfirmForce(true)}
            >
              End without checklist
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allTicked || pending}
            onClick={() =>
              void run(`/sessions/${session.id}/end`, { checklist: ticks }, `Session ended on ${station.label}.`)
            }
          >
            {pending ? "Ending…" : "End session"}
          </button>
        </div>
      )}
    </div>
  );
}
