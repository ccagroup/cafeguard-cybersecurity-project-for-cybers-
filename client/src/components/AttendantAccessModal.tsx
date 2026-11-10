import { useState } from "react";
import { api } from "../lib/api";
import { errorMessage } from "../lib/forms";
import type { AttendantDto } from "../lib/types";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

export type AccessChange = { attendant: AttendantDto; mode: "remove" | "restore" };

type Props = { change: AccessChange | null; onClose: () => void; onDone: () => void };

export function AttendantAccessModal({ change, onClose, onDone }: Props) {
  const title = !change
    ? "Attendant access"
    : change.mode === "remove"
      ? `Remove ${change.attendant.name}?`
      : `Restore access for ${change.attendant.name}?`;

  return (
    <Modal open={!!change} onClose={onClose} title={title}>
      {change && <AccessForm change={change} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

function AccessForm({ change, onClose, onDone }: { change: AccessChange } & Omit<Props, "change">) {
  const notify = useToast();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { attendant, mode } = change;

  async function confirm() {
    setError("");
    setPending(true);
    try {
      await api(`/attendants/${attendant.id}/${mode}`, { method: "POST" });
      notify(mode === "remove" ? `${attendant.name} was removed.` : `${attendant.name} can sign in again.`);
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
      {mode === "remove" ? (
        <p>
          {attendant.name} will be signed out straight away and will no longer be able to sign in.
          Everything they did stays in the audit trail and the incident history. You can restore
          their access later.
        </p>
      ) : (
        <p>
          {attendant.name} will be able to sign in again with their previous password. Their past
          activity is unchanged.
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={mode === "remove" ? "btn btn-danger" : "btn btn-primary"}
          disabled={pending}
          onClick={() => void confirm()}
        >
          {pending ? "Saving…" : mode === "remove" ? "Remove attendant" : "Restore access"}
        </button>
      </div>
    </div>
  );
}
