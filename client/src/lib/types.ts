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
