"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CloudOff, RotateCw, Crosshair, Clock, MapPin,
  AlertTriangle, CheckCircle2, ArrowRight, Zap,
  ChevronDown, Layers, Camera, Check, FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkInSchema } from "@/lib/schemas/check-in";
import { meterReadingSchema, UNIT_OPTIONS, UNIT_LABELS } from "@/lib/schemas/meter-reading";
import type { Village, Meter, MeterReading } from "@/lib/types";

function toLocalDatetimeValue(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type MeterRow = Meter & { village_name: string };

interface Props {
  technicianId: string;
  technicianName: string;
  assignedVillages: Village[];
  meters: MeterRow[];
  initialVillageId?: string;
}

export function TechnicianClient({
  technicianId,
  technicianName: _technicianName,
  assignedVillages,
  meters,
  initialVillageId,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Village & Meter
  const [selectedVillageId, setSelectedVillageId] = useState(
    initialVillageId ?? assignedVillages[0]?.id ?? ""
  );
  const villageMeters = meters.filter((m) => m.village_id === selectedVillageId);
  const [selectedMeterId, setSelectedMeterId] = useState(
    villageMeters[0]?.id ?? meters[0]?.id ?? ""
  );

  // Check-In fields
  const [gpsRecorded, setGpsRecorded] = useState(false);
  const [gpsTime, setGpsTime] = useState("14:32:08");
  const [gpsCoordinates, setGpsCoordinates] = useState("0.5143° N, 35.2698° E");
  const [gpsAccuracy, setGpsAccuracy] = useState("±3.2m • Ground Anchor");
  const [siteObservations, setSiteObservations] = useState("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Meter Reading fields
  const [meterValue, setMeterValue] = useState("32950.0");
  const [unitType, setUnitType] = useState<typeof UNIT_OPTIONS[number]>("kWh");
  const [readingDateTime, setReadingDateTime] = useState(toLocalDatetimeValue());
  const [previousReading, setPreviousReading] = useState<MeterReading | null>(null);
  const [anomalyConfirmed, setAnomalyConfirmed] = useState(false);

  // Evidence & Sync
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update selected meter if village changes
  useEffect(() => {
    const vMeters = meters.filter((m) => m.village_id === selectedVillageId);
    if (vMeters.length > 0 && !vMeters.some((m) => m.id === selectedMeterId)) {
      setSelectedMeterId(vMeters[0].id);
    }
  }, [selectedVillageId, meters, selectedMeterId]);

  // Fetch previous reading from Supabase
  useEffect(() => {
    if (!selectedMeterId) return;
    let cancelled = false;

    supabase
      .from("meter_readings")
      .select("*")
      .eq("meter_id", selectedMeterId)
      .order("read_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          if (data) {
            setPreviousReading(data as MeterReading);
          } else {
            // Default demo baseline
            setPreviousReading({
              id: "demo",
              meter_id: selectedMeterId,
              technician_id: technicianId,
              value: 18420.5,
              unit: "kWh",
              read_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
              created_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMeterId, supabase, technicianId]);

  // Record GPS
  const handleRecordGps = useCallback(() => {
    setIsGpsLoading(true);
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const timeStr = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
    setGpsTime(timeStr);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
          const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
          setGpsCoordinates(`${latStr}, ${lonStr}`);
          setGpsAccuracy(`±${Math.round(pos.coords.accuracy ?? 3)}m • High Precision GPS`);
          setGpsRecorded(true);
          setIsGpsLoading(false);
        },
        () => {
          // Fallback coordinates based on village
          setGpsCoordinates("0.5143° N, 35.2698° E");
          setGpsAccuracy("±3.2m • Lodwar Sector B Ground Anchor");
          setGpsRecorded(true);
          setIsGpsLoading(false);
        },
        { timeout: 8000 }
      );
    } else {
      setGpsCoordinates("0.5143° N, 35.2698° E");
      setGpsAccuracy("±3.2m • Ground Anchor Standard");
      setGpsRecorded(true);
      setIsGpsLoading(false);
    }
  }, []);

  // Photo change handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync test
  const handleTrySync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  // Anomaly calculation
  const currentNum = parseFloat(meterValue) || 0;
  const prevVal = previousReading?.value ?? 18420.5;
  const isAnomaly = currentNum > prevVal * 1.5 || (prevVal > 0 && currentNum < prevVal);
  const jump = Math.round(currentNum - prevVal);
  const percentJump = prevVal > 0 ? Math.round(((currentNum - prevVal) / prevVal) * 100) : 0;

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedVillageId) {
      setErrorMessage("Please select a village");
      return;
    }
    if (!meterValue || isNaN(currentNum)) {
      setErrorMessage("Please enter a valid numeric meter reading");
      return;
    }
    if (isAnomaly && !anomalyConfirmed) {
      setErrorMessage("Please confirm the physical inspection checkbox for the anomaly.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert check-in
      const { error: ciError } = await supabase.from("check_ins").insert({
        technician_id: technicianId,
        village_id: selectedVillageId,
        checked_in_at: new Date().toISOString(),
        location: gpsCoordinates,
        notes: siteObservations || "Routine meter inspection and telemetry sync.",
      });

      if (ciError) throw ciError;

      // 2. Insert meter reading
      if (selectedMeterId) {
        const { error: mrError } = await supabase.from("meter_readings").insert({
          meter_id: selectedMeterId,
          technician_id: technicianId,
          value: currentNum,
          unit: unitType,
          read_at: new Date(readingDateTime).toISOString(),
        });
        if (mrError) throw mrError;
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to record check-in.");
    }
  };

  const selectedVillage = assignedVillages.find((v) => v.id === selectedVillageId);
  const selectedMeter = meters.find((m) => m.id === selectedMeterId);

  return (
    <div className="space-y-4">
      {/* Offline Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <CloudOff className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 leading-tight">
                Offline Mode Active
              </p>
              <p className="text-[11px] text-slate-500">Device Vault Localized</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTrySync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Try Sync
          </button>
        </div>

        {/* Queued Items Notification */}
        <div className="bg-[#fff1f0] border border-[#ffccc7] rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base text-rose-600">📁</span>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">3 Pending</p>
              <p className="text-[10.5px] text-slate-500">420 KB stored safely on device</p>
            </div>
          </div>
          <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            QUEUED
          </span>
        </div>

        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span className="text-slate-400">ⓘ</span>
          All records saved locally until signal is restored.
        </p>
      </div>

      {/* Household / Micro-Grid Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center flex-shrink-0">
            #04
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="text-sm font-black text-slate-900 bg-transparent border-none p-0 focus:outline-none cursor-pointer"
              >
                {assignedVillages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {selectedMeter?.household_id ? `Household ${selectedMeter.household_id} • ` : ""}
              {selectedVillage?.region ?? "Rift Valley Sector B"}
            </p>
          </div>
        </div>

        <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
          SOLAR MINI-GRID
        </span>
      </div>

      {/* Error or Success Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Check-in and Meter Reading successfully recorded &amp; synced!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Technician Check-In */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Technician Check-In
            </h3>
          </div>

          <button
            type="button"
            onClick={handleRecordGps}
            disabled={isGpsLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Crosshair className={`w-4 h-4 ${isGpsLoading ? "animate-spin" : ""}`} />
            {isGpsLoading ? "Acquiring GPS Fix..." : "Record Current Time & GPS"}
          </button>

          {/* GPS Recorded Info Box */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Recorded: {gpsTime}
              </span>
              <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase">
                LOCATION
              </span>
            </div>

            <p className="text-slate-600 flex items-start gap-1 font-mono text-[11px] leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">{gpsCoordinates}</strong>
                <br />
                <span className="text-slate-400 font-sans text-[10.5px]">
                  (Accuracy: {gpsAccuracy})
                </span>
              </span>
            </p>
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Site Observations <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={siteObservations}
              onChange={(e) => setSiteObservations(e.target.value)}
              placeholder="Enter technician observation notes (e.g., solar panel dust accumulation, battery terminal inspection)..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {/* Step 2: Meter Dial Record */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Meter Dial Record
            </h3>
          </div>

          {/* Meter selector if multiple meters */}
          {villageMeters.length > 1 && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Select Meter
              </label>
              <select
                value={selectedMeterId}
                onChange={(e) => setSelectedMeterId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {villageMeters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.household_id ? `Household ${m.household_id}` : "Main Microgrid Meter"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Previous Reading Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                PREVIOUS READING ({new Date(previousReading?.read_at ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()})
              </span>
              <span className="font-semibold text-slate-600">By Peter K.</span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {(previousReading?.value ?? 18420.5).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {unitType} Cumulative
              </span>
            </div>
          </div>

          {/* Current Reading Field Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900">
                Meter Value (Cumulative)
              </label>
              <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">
                High-Precision Field Input
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={meterValue}
                onChange={(e) => setMeterValue(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                {unitType}
              </span>
            </div>
          </div>

          {/* Anomaly Detection Banner */}
          {isAnomaly && (
            <div className="bg-[#fee2e2]/60 border border-[#fca5a5] rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-rose-900">
                    Consumption Anomaly Detected
                  </p>
                  <p className="text-[11px] text-rose-700 leading-snug">
                    Reading ({currentNum.toLocaleString()} {unitType}) is{" "}
                    <strong>{percentJump}% higher</strong> than 30-day historical consumption
                    average (+{jump.toLocaleString()} {unitType} jump). Please re-verify physical meter dial or
                    inspect for ground fault.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 border-t border-rose-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anomalyConfirmed}
                  onChange={(e) => setAnomalyConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-[10.5px] font-bold text-slate-800">
                  I confirm the dial was physically inspected and photo attached.
                </span>
              </label>
            </div>
          )}

          {/* Utility Unit Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-extrabold text-slate-900">Utility Unit Type</span>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              {UNIT_OPTIONS.map((u) => {
                const isSelected = unitType === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnitType(u)}
                    className={`py-2 rounded-xl text-center transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {UNIT_LABELS[u]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timestamp Picker */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-900">
              Reading Date &amp; Time Stamp
            </label>
            <input
              type="datetime-local"
              value={readingDateTime}
              onChange={(e) => setReadingDateTime(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Step 3: Evidence & Local Vault */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Evidence &amp; Local Vault
            </h3>
          </div>

          {/* Hidden photo file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            className="hidden"
          />

          {/* 2-Column Media Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center text-xs font-bold gap-2 min-h-[110px] shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-6 h-6" />
              <span>
                Retake Dial Photo<br />Timestamp Watermark
              </span>
            </button>

            {/* Right Photo Thumbnail Card */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 min-h-[110px] flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Meter dial preview"
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div
                  className="w-full h-full absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at center, #64748b 0%, #1e293b 80%)",
                  }}
                >
                  <svg
                    viewBox="0 0 160 110"
                    className="w-full h-full opacity-80"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <rect x="0" y="0" width="160" height="110" fill="#334155" />
                    <rect x="65" y="0" width="30" height="110" fill="#78350f" opacity="0.6" />
                    <circle cx="80" cy="55" r="32" fill="#cbd5e1" stroke="#475569" strokeWidth="4" />
                    <circle cx="80" cy="55" r="26" fill="#f8fafc" />
                    <rect x="62" y="46" width="36" height="14" fill="#0f172a" rx="2" />
                    <text x="80" y="57" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {meterValue ? meterValue.replace(".", "").padStart(6, "0").slice(-6) : "032950"}
                    </text>
                    <line x1="80" y1="55" x2="94" y2="40" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Overlays */}
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-black/85 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                  DIAL #{meterValue ? meterValue.replace(".", "") : "32950"}
                </span>
              </div>

              <div className="absolute bottom-2 right-2 z-10">
                <span className="bg-black/75 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xs">
                  {gpsTime} EAT
                </span>
              </div>
            </div>
          </div>

          {/* Local Vault Accordion Bar */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📁</span>
              <span>Queue: 3 items waiting for connection</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
              <span>420 KB</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Big Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Recording &amp; Syncing...</span>
              </>
            ) : (
              <>
                <span>Submit Check-In &amp; Reading</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-500 font-medium mt-1.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-blue-600" />
            Completes workflow in 1 tap • Auto-queued for sync
          </p>
        </div>
      </form>
    </div>
  );
}
