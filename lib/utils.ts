import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Turn an ISO timestamp into a human-readable due label.
 * e.g. "Due today", "Due tomorrow", "Due Jun 30", "Overdue"
 */
export function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const now = new Date();
  // Strip time — compare calendar days only.
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = dueDay.getTime() - todayDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 7) return `Due in ${diffDays} days`;
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * Turn an ISO timestamp into a relative time label.
 * e.g. "Just now", "5m ago", "2h ago", "3d ago", "Jun 15"
 */
export function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
