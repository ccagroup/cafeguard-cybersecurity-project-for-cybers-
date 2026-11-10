import { useState } from "react";
import { api } from "../lib/api";
import { errorMessage } from "../lib/forms";
import { useToast } from "./Toast";

export function AcknowledgeButton({ id, onDone }: { id: string; onDone: () => void }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  async function acknowledge() {
    setBusy(true);
    try {
      await api(`/alerts/${id}/acknowledge`, { method: "POST" });
      notify("Alert acknowledged.");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setBusy(false);
      onDone();
    }
  }

  return (
    <button className="btn btn-secondary btn-small" disabled={busy} onClick={() => void acknowledge()}>
      {busy ? "Saving…" : "Acknowledge"}
    </button>
  );
}
