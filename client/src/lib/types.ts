export type Severity = "DANGER" | "WARNING" | "SUCCESS";

export type AlertDto = {
  id: string;
  severity: Severity;
  message: string;
  station: { id: string; label: string };
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
};

export type Station = {
  id: string;
  label: string;
  status: "FREE" | "IN_USE";
  openSession: null | {
    id: string;
    customerName: string;
    startedAt: string;
    startedBy: string;
  };
};

export type IncidentDto = {
  id: string;
  station: { id: string; label: string };
  type: string;
  description: string;
  severity: string;
  status: string;
  notes: string;
  reportedBy: string;
  createdAt: string;
};

export type TimelineItem = {
  kind: "audit" | "session";
  at: string;
  title: string;
  detail: string | null;
  actor: string | null;
  session: null | {
    customerName: string;
    startedAt: string;
    endedAt: string | null;
    endedProperly: boolean;
    endedBy: string | null;
  };
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string | null;
  actorEmail: string | null;
  action: string;
  target: string | null;
  station: string | null;
  detail: string | null;
  ip: string | null;
};

export type AttendantDto = { id: string; name: string; email: string; createdAt: string };
