import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { errorMessage, serverFieldErrors } from "../lib/forms";
import { Field, fieldProps } from "./Field";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

type Props = { open: boolean; onClose: () => void; onCreated?: () => void };

export function AttendantModal({ open, onClose, onCreated }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add attendant">
      <AttendantForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

type Errors = Partial<Record<"name" | "email" | "password", string>>;

function AttendantForm({ onClose, onCreated }: Omit<Props, "open">) {
  const notify = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: Errors = {};
    if (!name.trim()) next.name = "Enter the attendant's name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 12) next.password = "The password must be at least 12 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await api("/attendants", {
        method: "POST",
        body: { name: name.trim(), email: email.trim(), password },
      });
      notify(`Attendant ${name.trim()} added.`);
      onCreated?.();
      onClose();
    } catch (err) {
      const fields = serverFieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields as Errors);
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

      <Field id="att-name" label="Full name" error={errors.name}>
        <input
          className="input"
          type="text"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...fieldProps("att-name", errors.name)}
        />
      </Field>

      <Field id="att-email" label="Email" error={errors.email}>
        <input
          className="input"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...fieldProps("att-email", errors.email)}
        />
      </Field>

      <Field
        id="att-password"
        label="Temporary password"
        error={errors.password}
        hint="At least 12 characters. Share it privately and ask them to keep it secret."
      >
        <div className="input-group">
          <input
            className="input"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...fieldProps("att-password", errors.password)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
          >
            {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add attendant"}
        </button>
      </div>
    </form>
  );
}
