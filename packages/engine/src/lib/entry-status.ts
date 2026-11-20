export const entryStatuses = [
  "watching",
  "planned",
  "completed",
  "paused",
  "dropped",
] as const;

export type EntryStatus = (typeof entryStatuses)[number];

export function isEntryStatus(value: string): value is EntryStatus {
  return (entryStatuses as readonly string[]).includes(value);
}

export const statusColor: Record<EntryStatus, string> = {
  watching: "text-status-watching",
  completed: "text-status-completed",
  planned: "text-status-planned",
  paused: "text-status-paused",
  dropped: "text-status-dropped",
};
