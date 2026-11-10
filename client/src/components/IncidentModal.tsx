import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { errorMessage, serverFieldErrors } from "../lib/forms";
import type { Station } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { Field, fieldProps } from "./Field";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

export function IncidentModal({ open, onClose, onCreated }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Report an Incident">
      <IncidentForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

type Errors = Partial<Record<"stationId" | "type" | "severity" | "description", string>>;

function IncidentForm({ onClose, onCreated }: Omit<Props, "open">) {
  const notify = useToast();
  const { data, error: loadError, loading } = useFetch<{ stations: Station[] }>("/stations");
  const [stationId, setStationId] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: Errors = {};
    if (!stationId) next.stationId = "Choose a station.";
    if (!type) next.type = "Choose an incident type.";
    if (!severity) next.severity = "Choose a severity.";
    const text = description.trim();
    if (text.length < 10) next.description = "Describe what happened (at least 10 characters).";
    else if (text.length > 2000) next.description = "The description is too long (2000 characters maximum).";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await api("/incidents", {
        method: "POST",
        body: { stationId, type, severity, description: text },
      });
      notify("Incident reported.");
      onCreated();
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
      {(formError || loadError) && (
        <div className="notice notice-error" role="alert">
          {formError || loadError}
        </div>
      )}

      <Field id="inc-station" label="Station" error={errors.stationId}>
        <select
          className="select"
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          disabled={loading}
          {...fieldProps("inc-station", errors.stationId)}
        >
          <option value="">{loading ? "Loading stations…" : "Choose a station"}</option>
          {data?.stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="inc-type" label="Type" error={errors.type}>
        <select
          className="select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          {...fieldProps("inc-type", errors.type)}
        >
          <option value="">Choose a type</option>
          <option value="UNAUTHORISED_ACCESS">Unauthorised access</option>
          <option value="PASSWORD_CHANGED">Password changed</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>

      <Field id="inc-severity" label="Severity" error={errors.severity}>
        <select
          className="select"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          {...fieldProps("inc-severity", errors.severity)}
        >
          <option value="">Choose a severity</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </Field>

      <Field
        id="inc-description"
        label="Description"
        error={errors.description}
        hint="What happened, what the customer reported, and when. Never include a password."
      >
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          {...fieldProps("inc-description", errors.description)}
        />
      </Field>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending || loading}>
          {pending ? "Saving…" : "Report incident"}
        </button>
      </div>
    </form>
  );
}
