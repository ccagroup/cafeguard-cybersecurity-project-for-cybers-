import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { errorMessage, serverFieldErrors } from "../lib/forms";
import type { Station } from "../lib/types";
import { Field, fieldProps } from "./Field";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

type Props = { station: Station | null; onClose: () => void; onDone: () => void };

export function StartSessionModal({ station, onClose, onDone }: Props) {
  return (
    <Modal
      open={!!station}
      onClose={onClose}
      title={station ? `Start session on ${station.label}` : "Start session"}
    >
      {station && <StartForm station={station} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

function StartForm({ station, onClose, onDone }: { station: Station } & Omit<Props, "station">) {
  const notify = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter the customer's name.");
    if (trimmed.length > 100) return setError("The name is too long (100 characters maximum).");
    setError("");

    setPending(true);
    try {
      await api(`/stations/${station.id}/sessions`, {
        method: "POST",
        body: { customerName: trimmed },
      });
      notify(`Session started on ${station.label}.`);
      onDone();
      onClose();
    } catch (err) {
      const fields = serverFieldErrors(err);
      if (fields.customerName) setError(fields.customerName);
      else setFormError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {formError && (
        <div className="notice notice-error" role="alert">
          {formError}
        </div>
      )}
      <Field id="customerName" label="Customer name" error={error}>
        <input
          className="input"
          type="text"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...fieldProps("customerName", error)}
        />
      </Field>
      <p className="field-hint" style={{ marginTop: "var(--space-3)" }}>
        Do not ask for or write down any customer passwords.
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Starting…" : "Start session"}
        </button>
      </div>
    </form>
  );
}
