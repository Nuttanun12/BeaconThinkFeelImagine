import type { StatusType } from "@/lib/types";

interface BadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; classes: string; dot?: string }
> = {
  completed: {
    label: "Completed",
    classes:
      "bg-status-success-bg text-status-success-text border border-status-success-border",
    dot: "bg-status-success-text",
  },
  overdue: {
    label: "Overdue",
    classes:
      "bg-status-critical-bg text-status-critical-text border border-status-critical-border",
    dot: "bg-status-critical-text",
  },
  pending: {
    label: "Pending",
    classes:
      "bg-status-pending-bg text-status-pending-text border border-status-pending-border",
    dot: "bg-status-pending-text",
  },
  offline: {
    label: "Offline",
    classes:
      "bg-status-offline-bg text-status-offline-text border border-status-offline-border",
    dot: "bg-status-offline-text",
  },
  online: {
    label: "Online",
    classes:
      "bg-status-success-bg text-status-success-text border border-status-success-border",
    dot: "bg-status-success-text",
  },
  critical: {
    label: "Critical",
    classes:
      "bg-status-critical-bg text-status-critical-text border border-status-critical-border font-semibold",
    dot: "bg-status-critical-text",
  },
};

export function Badge({ status, label, className = "" }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-medium ${config.classes} ${className}`}
    >
      {config.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
        />
      )}
      {displayLabel}
    </span>
  );
}
