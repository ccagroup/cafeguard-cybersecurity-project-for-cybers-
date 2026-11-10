import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Severity } from "../lib/types";

const severityInfo = {
  DANGER: { label: "Danger", cls: "badge-danger", Icon: OctagonAlert },
  WARNING: { label: "Warning", cls: "badge-warning", Icon: TriangleAlert },
  SUCCESS: { label: "Success", cls: "badge-success", Icon: CircleCheck },
} as const;

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, cls, Icon } = severityInfo[severity];
  return (
    <span className={`badge ${cls}`}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}

export function StationStatus({ status }: { status: "FREE" | "IN_USE" }) {
  return status === "IN_USE" ? (
    <span className="badge badge-info">In use</span>
  ) : (
    <span className="badge badge-neutral">Free</span>
  );
}
