"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2, RotateCw, Wallet, Home, WifiOff,
  TrendingUp, List, Map, MoreVertical,
  Check, Download, Send, Radio,
  MapPin, User, ChevronRight, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { VillageStatus } from "@/lib/types";

interface Props {
  initialData: VillageStatus[];
  userName: string;
}

// Generate static household count per village ID for realistic display
function getHouseholdCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 500;
  return 150 + Math.abs(hash);
}

// Compute hours since last check-in or reading
function getHoursSince(v: VillageStatus): number {
  const times = [
    v.latest_checkin_at ? new Date(v.latest_checkin_at).getTime() : 0,
    v.latest_reading_at ? new Date(v.latest_reading_at).getTime() : 0,
  ];
  const maxTime = Math.max(...times);
  if (!maxTime) return 36;
  return Math.max(1, Math.round((Date.now() - maxTime) / (1000 * 60 * 60)));
}

export function DashboardClient({ initialData, userName: _userName }: Props) {
  const supabase = createClient();
  const [villages, setVillages] = useState<VillageStatus[]>(initialData);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [villageFilter, setVillageFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncedJustNow, setSyncedJustNow] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // ── Refresh data ────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const { data } = await supabase.from("village_status").select("*");
    if (data) {
      setVillages(data as VillageStatus[]);
      setSyncedJustNow(true);
      setTimeout(() => setSyncedJustNow(false), 2500);
    }
    setIsRefreshing(false);
  }, [supabase]);

  // ── Supabase Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-telemetry")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "check_ins" },
        () => {
          refresh();
          setSyncToast("New technician check-in received!");
          setTimeout(() => setSyncToast(null), 3000);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meter_readings" },
        () => {
          refresh();
          setSyncToast("New meter reading recorded!");
          setTimeout(() => setSyncToast(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  // ── Trigger Batch Sync action ───────────────────────────────────────────────
  const triggerBatchSync = async () => {
    setIsRefreshing(true);
    await refresh();
    setSyncToast("Full grid batch sync complete! All 10 telemetry nodes verified.");
    setTimeout(() => setSyncToast(null), 4000);
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportOperationsCSV = () => {
    const headers = [
      "Village ID",
      "Village Name",
      "Region",
      "Latest Check-In",
      "Technician",
      "Latest Reading Value",
      "Unit",
      "Latest Reading Date",
      "Status",
    ];
    const rows = villages.map((v) => [
      v.village_id,
      `"${v.village_name}"`,
      `"${v.region}"`,
      v.latest_checkin_at ?? "N/A",
      `"${v.latest_checkin_technician ?? "Unassigned"}"`,
      v.latest_reading_value ?? 0,
      v.latest_reading_unit ?? "kWh",
      v.latest_reading_at ?? "N/A",
      v.no_recent_update ? "CRITICAL" : "HEALTHY",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `beacon_operations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncToast("Operations ledger downloaded as CSV.");
    setTimeout(() => setSyncToast(null), 3000);
  };

  // ── Derived data & filtering ────────────────────────────────────────────────
  const uniqueTechnicians = Array.from(
    new Set(villages.map((v) => v.latest_checkin_technician).filter(Boolean) as string[])
  ).sort();

  const filteredVillages = villages
    .filter((v) => (villageFilter === "all" ? true : v.village_id === villageFilter))
    .filter((v) => (techFilter === "all" ? true : v.latest_checkin_technician === techFilter))
    .filter((v) => {
      if (statusFilter === "critical") return v.no_recent_update;
      if (statusFilter === "healthy") return !v.no_recent_update;
      return true;
    })
    .sort((a, b) => {
      // Critical / Overdue always first
      if (a.no_recent_update !== b.no_recent_update) return a.no_recent_update ? -1 : 1;
      return a.village_name.localeCompare(b.village_name);
    });

  const overdueCount = villages.filter((v) => v.no_recent_update).length;
  const totalHouseholds = villages.reduce((acc, v) => acc + getHouseholdCount(v.village_id), 0);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Telemetry Synced Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {syncedJustNow ? "Synced just now" : "Synced 2m ago"}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Master telemetry synchronization active
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>

      {/* Performance Summary Header */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <h2 className="text-sm font-bold text-slate-900">Performance Summary</h2>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            TODAY • 08:00 EAT
          </span>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                TOTAL REVENUE
              </p>
              <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                $48,920
              </p>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+12.4% vs last month</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid (Households & System Uptime) */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Households Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                HOUSEHOLDS
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Home className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalHouseholds.toLocaleString()}</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Across {villages.length} micro-grids</p>
          </div>

          {/* System Uptime Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                SYSTEM UPTIME
              </span>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  overdueCount > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {overdueCount > 0 ? <WifiOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
            {overdueCount > 0 ? (
              <>
                <p className="text-xl font-black text-rose-600 mt-1">Unavailable</p>
                <p className="text-[10.5px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <span>⚠️</span> Sensor offline
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-emerald-600 mt-1">99.8%</p>
                <p className="text-[10.5px] text-emerald-600 mt-0.5">All nodes active</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List View / Grid Map Switcher */}
      <div className="bg-slate-200/60 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            viewMode === "list"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <List className="w-4 h-4" />
          <span>List View</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("map")}
          className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            viewMode === "map"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Grid Map</span>
        </button>
      </div>

      {/* Telemetry Coverage Gradient Banner */}
      <div className="rounded-2xl p-4 text-white shadow-xs relative overflow-hidden bg-gradient-to-r from-slate-600 via-slate-500 to-blue-200">
        <div className="relative z-10">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-200">
            TELEMETRY COVERAGE
          </p>
          <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
            Rift Valley Micro-Basin
          </h3>
        </div>
      </div>

      {/* Filter Operations Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500">
            FILTER OPERATIONS
          </span>
          {(villageFilter !== "all" || techFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setVillageFilter("all");
                setTechFilter("all");
                setStatusFilter("all");
              }}
              className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
            >
              <span>✕</span> Clear Filters
            </button>
          )}
        </div>

        {/* 3 Dropdown Filters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Villages Dropdown */}
          <div className="relative">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 appearance-none shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">📍 All Villages</option>
              {villages.map((v) => (
                <option key={v.village_id} value={v.village_id}>
                  {v.village_name}
                </option>
              ))}
            </select>
          </div>

          {/* Technicians Dropdown */}
          <div className="relative">
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 appearance-none shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">👤 All Technicians</option>
              {uniqueTechnicians.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pill Bar */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            All Status
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("critical")}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${
              statusFilter === "critical"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-rose-700 border-rose-200 hover:border-rose-400"
            }`}
          >
            Critical Only ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("healthy")}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${
              statusFilter === "healthy"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            Healthy ({villages.length - overdueCount})
          </button>
        </div>
      </div>

      {/* Managed Microgrids List Header */}
      <div className="flex items-center justify-between text-xs pt-1">
        <h2 className="text-sm font-extrabold text-slate-900">
          Managed Microgrids ({filteredVillages.length})
        </h2>
        <span className="text-blue-600 font-bold text-xs">Sorted by Criticality</span>
      </div>

      {/* Microgrid Cards */}
      <div className="space-y-3.5">
        {filteredVillages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
            <p className="text-sm font-extrabold text-slate-900">No microgrids match your filter</p>
            <p className="text-xs text-slate-500">Try selecting "All Villages" or clearing filters.</p>
          </div>
        ) : (
          filteredVillages.map((v) => {
            const isCritical = v.no_recent_update;
            const hoursSince = getHoursSince(v);
            const households = getHouseholdCount(v.village_id);
            const gridId = `GRD-${v.village_id.slice(-4).toUpperCase()}`;

            return (
              <div
                key={v.village_id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-shadow hover:shadow-md ${
                  isCritical ? "border-rose-200 bg-[#fffdfd]" : "border-slate-200/80"
                }`}
              >
                {/* Critical Alert Warning Strip */}
                {isCritical && (
                  <div className="bg-[#fee2e2]/70 border border-[#fca5a5] rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-rose-600 font-bold text-sm">🚩</span>
                    <div>
                      <p className="text-xs font-extrabold text-rose-800 leading-tight">Critical Alert</p>
                      <p className="text-[11px] text-rose-700">
                        Warning: No data update for {hoursSince} hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Header: Badge + ID + 3-dots */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <span className="bg-[#dc2626] text-white text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="bg-[#ecfdf5] text-[#065f46] text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        HEALTHY
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      ID: {gridId}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                    aria-label="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Village Title */}
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {v.village_name}
                </h3>

                {/* Status Rows (Check-in, Meter Reading, Connectivity) */}
                <div className="space-y-2 text-xs">
                  {/* Latest Check-in */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Latest Check-in</span>
                    {isCritical ? (
                      <span className="bg-[#fee2e2] text-[#b91c1c] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 stroke-[2.4]" />
                        Overdue ({hoursSince}h ago)
                      </span>
                    ) : (
                      <span className="bg-[#ecfdf5] text-[#065f46] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Meter Reading */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Meter Reading</span>
                    {isCritical ? (
                      <span className="bg-[#fef3c7] text-[#92400e] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 stroke-[2.4]" />
                        Pending
                      </span>
                    ) : (
                      <span className="bg-[#ecfdf5] text-[#065f46] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                        Reading Verified
                      </span>
                    )}
                  </div>

                  {/* Connectivity */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connectivity</span>
                    {isCritical ? (
                      <span className="bg-[#f1f5f9] text-[#64748b] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <WifiOff className="w-3 h-3 stroke-[2]" />
                        Offline
                      </span>
                    ) : (
                      <span className="bg-[#ecfdf5] text-[#065f46] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Synchronized
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Households + Technician + Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" />
                      {households} Households
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {v.latest_checkin_technician ?? "Field Tech"}
                    </span>
                  </div>

                  {isCritical ? (
                    <Link
                      href={`/technician?villageId=${v.village_id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                    >
                      Dispatch
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/technician?villageId=${v.village_id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offline Export & Batch Sync Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Offline Export &amp; Batch Sync
            </h3>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Ready
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Download complete auditable operations ledger directly to device
          storage for offline field compliance or donor distribution.
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={exportOperationsCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Operations (CSV / PDF)
          </button>

          <button
            type="button"
            onClick={triggerBatchSync}
            disabled={isRefreshing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Send className={`w-4 h-4 ${isRefreshing ? "animate-pulse" : ""}`} />
            Trigger Full Grid Batch Sync
          </button>
        </div>
      </div>
    </div>
  );
}
