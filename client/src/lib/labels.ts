export const incidentTypeLabel: Record<string, string> = {
  UNAUTHORISED_ACCESS: "Unauthorised access",
  PASSWORD_CHANGED: "Password changed",
  OTHER: "Other",
};

export const incidentSeverityLabel: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const incidentStatusLabel: Record<string, string> = {
  OPEN: "Open",
  INVESTIGATING: "Investigating",
  RESOLVED: "Resolved",
};

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
