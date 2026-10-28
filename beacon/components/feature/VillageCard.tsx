import type { VillageStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { StatusType } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoString: string | null): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function deriveStatus(v: VillageStatus): StatusType {
  if (v.no_recent_update) return "overdue";
  if (!v.latest_checkin_at && !v.latest_reading_at) return "offline";
  if (!v.latest_reading_at) return "pending";
  return "completed";
}

const UNIT_DISPLAY: Record<string, string> = {
  kWh: "kWh",
  m3_water: "m³",
  liters: "L",
  v_amp: "V/A",
};

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  village: VillageStatus;
}

export function VillageCard({ village }: Props) {
  const status = deriveStatus(village);

  return (
    <Card
      className={[
        "p-4 flex flex-col gap-3",
        status === "overdue" ? "border-l-4 border-l-status-critical-border" : "",
      ].join(" ")}
    >
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary leading-snug truncate">
            {village.village_name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{village.region}</p>
        </div>
        <Badge status={status} className="flex-shrink-0" />
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {/* Last check-in */}
        <div>
          <p className="text-xs text-text-muted mb-0.5">Last check-in</p>
          <p
            className={[
              "text-xs font-medium",
              status === "overdue" ? "text-status-critical-text" : "text-text-primary",
            ].join(" ")}
          >
            {relativeTime(village.latest_checkin_at)}
          </p>
          {village.latest_checkin_technician && (
            <p className="text-xs text-text-muted truncate mt-0.5">
              {village.latest_checkin_technician}
            </p>
          )}
        </div>

        {/* Last reading */}
        <div>
          <p className="text-xs text-text-muted mb-0.5">Last reading</p>
          <p
            className={[
              "text-xs font-medium",
              status === "overdue" ? "text-status-critical-text" : "text-text-primary",
            ].join(" ")}
          >
            {relativeTime(village.latest_reading_at)}
          </p>
          {village.latest_reading_value != null && (
            <p className="text-xs text-text-muted mt-0.5">
              {village.latest_reading_value.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}{" "}
              {UNIT_DISPLAY[village.latest_reading_unit ?? ""] ??
                village.latest_reading_unit}
            </p>
          )}
        </div>
      </div>

      {/* Overdue alert strip */}
      {status === "overdue" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-status-critical-bg border border-status-critical-border">
          <svg
            className="w-3.5 h-3.5 text-status-critical-text flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium text-status-critical-text">
            No update in 24h — action required
          </span>
        </div>
      )}
    </Card>
  );
}

