"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VillageStatus } from "@/lib/types";
import { VillageCard } from "@/components/feature/VillageCard";

type SortKey = "criticality" | "name" | "recent";

function sortVillages(villages: VillageStatus[], sort: SortKey): VillageStatus[] {
  return [...villages].sort((a, b) => {
    if (sort === "criticality") {
      // Overdue first, then by latest activity descending
      if (a.no_recent_update !== b.no_recent_update)
        return a.no_recent_update ? -1 : 1;
      const aTime = Math.max(
        a.latest_checkin_at ? new Date(a.latest_checkin_at).getTime() : 0,
        a.latest_reading_at ? new Date(a.latest_reading_at).getTime() : 0
      );
      const bTime = Math.max(
        b.latest_checkin_at ? new Date(b.latest_checkin_at).getTime() : 0,
        b.latest_reading_at ? new Date(b.latest_reading_at).getTime() : 0
      );
      return aTime - bTime; // least recent activity first within overdue
    }
    if (sort === "recent") {
      const aTime = Math.max(
        a.latest_checkin_at ? new Date(a.latest_checkin_at).getTime() : 0,
        a.latest_reading_at ? new Date(a.latest_reading_at).getTime() : 0
      );
      const bTime = Math.max(
        b.latest_checkin_at ? new Date(b.latest_checkin_at).getTime() : 0,
        b.latest_reading_at ? new Date(b.latest_reading_at).getTime() : 0
      );
      return bTime - aTime;
    }
    // name
    return a.village_name.localeCompare(b.village_name);
  });
}

interface Props {
  initialData: VillageStatus[];
}

export function DashboardClient({ initialData }: Props) {
  const supabase = createClient();
  const [villages, setVillages] = useState<VillageStatus[]>(initialData);
  const [sort, setSort] = useState<SortKey>("criticality");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [syncedAt, setSyncedAt] = useState(new Date());
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // ── Refresh helper: re-fetch village_status view ───────────────────────────
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("village_status")
      .select("*");
    if (data) {
      setVillages(data as VillageStatus[]);
      setSyncedAt(new Date());
    }
  }, [supabase]);

  // ── Supabase Realtime: listen for new check-ins and readings ──────────────
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "check_ins" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meter_readings" },
        () => refresh()
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [supabase, refresh]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const technicians = Array.from(
    new Set(
      villages
        .map((v) => v.latest_checkin_technician)
        .filter((n): n is string => !!n)
    )
  ).sort();

  const filtered = villages.filter(
    (v) => techFilter === "all" || v.latest_checkin_technician === techFilter
  );
  const sorted = sortVillages(filtered, sort);

  const overdueCount = villages.filter((v) => v.no_recent_update).length;
  const activeCount = villages.filter((v) => !v.no_recent_update).length;

  function syncedLabel(): string {
    const diff = Math.floor((Date.now() - syncedAt.getTime()) / 1000);
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border/60 shadow-card p-3 text-center">
          <p className="text-2xl font-bold text-text-primary">{villages.length}</p>
          <p className="text-xs text-text-muted mt-0.5">Villages</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-card p-3 text-center">
          <p className="text-2xl font-bold text-status-success-text">{activeCount}</p>
          <p className="text-xs text-text-muted mt-0.5">Active</p>
        </div>
        <div
          className={[
            "rounded-xl border shadow-card p-3 text-center",
            overdueCount > 0
              ? "bg-status-critical-bg border-status-critical-border"
              : "bg-white border-border/60",
          ].join(" ")}
        >
          <p
            className={[
              "text-2xl font-bold",
              overdueCount > 0 ? "text-status-critical-text" : "text-text-primary",
            ].join(" ")}
          >
            {overdueCount}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Sync status bar */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Synced {syncedLabel()}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={[
              "w-2 h-2 rounded-full",
              realtimeConnected ? "bg-status-success-text animate-pulse" : "bg-gray-300",
            ].join(" ")}
          />
          {realtimeConnected ? "Live" : "Polling"}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Technician filter */}
        <select
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          className="h-8 rounded-lg border border-border bg-white px-2 text-xs text-text-secondary
                     focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue/20 outline-none"
          aria-label="Filter by technician"
        >
          <option value="all">All technicians</option>
          {technicians.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-8 rounded-lg border border-border bg-white px-2 text-xs text-text-secondary
                     focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue/20 outline-none"
          aria-label="Sort villages"
        >
          <option value="criticality">Sort: Criticality</option>
          <option value="recent">Sort: Most recent</option>
          <option value="name">Sort: Name</option>
        </select>

        {/* Active filters badge */}
        {techFilter !== "all" && (
          <button
            onClick={() => setTechFilter("all")}
            className="h-8 flex items-center gap-1 px-2.5 rounded-lg bg-beacon-blue/10 text-beacon-blue text-xs font-medium border border-beacon-blue/20 hover:bg-beacon-blue/20 transition-colors"
          >
            {techFilter}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Village grid / empty state */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <svg
            className="mx-auto w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
            />
          </svg>
          <p className="text-sm font-medium text-text-primary">No villages found</p>
          <p className="text-xs text-text-muted">
            {techFilter !== "all"
              ? "Try clearing the technician filter."
              : "No village data has been seeded yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((v) => (
            <VillageCard key={v.village_id} village={v} />
          ))}
        </div>
      )}
    </div>
  );
}

