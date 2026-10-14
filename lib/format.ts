// Human-readable labels for timestamps and file sizes. Pure functions with no
// imports, so they're unit-tested directly with Node (tests/unit/).

const DAY_MS = 86_400_000;

/** "Just now", "5m ago", "3h ago", "2d ago", then a date. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** "Overdue by 2d", "Due today", "Due tomorrow", "Due in 3 days", then a date. */
export function dueLabel(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff < 0) {
    const over = Math.floor(-diff / DAY_MS);
    return over < 1 ? "Overdue" : `Overdue by ${over}d`;
  }
  const days = Math.floor(diff / DAY_MS);
  if (days < 1) return "Due today";
  if (days < 2) return "Due tomorrow";
  if (days < 7) return `Due in ${days} days`;
  return `Due ${new Date(iso).toLocaleDateString()}`;
}

/** "512 B", "14 KB", "2.4 MB". */
export function formatSize(bytes?: number): string | undefined {
  if (bytes === undefined) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
