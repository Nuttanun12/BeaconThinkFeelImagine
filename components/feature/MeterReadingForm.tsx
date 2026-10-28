"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  meterReadingSchema,
  UNIT_OPTIONS,
  UNIT_LABELS,
  type MeterReadingFormValues,
} from "@/lib/schemas/meter-reading";
import { type Meter, type Village, type MeterReading } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/FormField";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// ── helpers ───────────────────────────────────────────────────────────────────

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatReading(value: number, unit: string): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

// ── component ─────────────────────────────────────────────────────────────────

interface MeterWithVillage extends Meter {
  village_name: string;
}

interface Props {
  /** Meters for villages the technician is assigned to */
  meters: MeterWithVillage[];
  technicianId: string;
}

type FieldErrors = Partial<Record<keyof MeterReadingFormValues, string>>;

export function MeterReadingForm({ meters, technicianId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [values, setValues] = useState<MeterReadingFormValues>({
    meter_id: meters[0]?.id ?? "",
    value: "",
    unit: "kWh",
    read_at: toLocalDatetimeValue(new Date()),
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previousReading, setPreviousReading] = useState<MeterReading | null>(null);
  const [prevLoading, setPrevLoading] = useState(false);
  const [anomaly, setAnomaly] = useState<string | null>(null);

  // ── fetch previous reading whenever meter changes ───────────────────────────

  useEffect(() => {
    if (!values.meter_id) return;
    let cancelled = false;

    async function fetchPrev() {
      setPrevLoading(true);
      setPreviousReading(null);
      setAnomaly(null);

      const { data } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("meter_id", values.meter_id)
        .order("read_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setPreviousReading(data ?? null);
        setPrevLoading(false);
      }
    }

    fetchPrev();
    return () => { cancelled = true; };
  }, [values.meter_id, supabase]);

  // ── check anomaly whenever value or previousReading changes ────────────────

  useEffect(() => {
    if (!previousReading || values.value === "") {
      setAnomaly(null);
      return;
    }
    const current = Number(values.value);
    if (isNaN(current)) return;

    if (current < previousReading.value) {
      setAnomaly(
        `Current value (${current}) is lower than the previous reading (${previousReading.value}). ` +
        `Possible meter rollback or data-entry error.`
      );
    } else if (previousReading.value > 0 && current > previousReading.value * 10) {
      setAnomaly(
        `Current value is 10× larger than the previous reading (${previousReading.value}). ` +
        `Double-check before saving.`
      );
    } else {
      setAnomaly(null);
    }
  }, [values.value, previousReading]);

  // ── field change ───────────────────────────────────────────────────────────

  function set<K extends keyof MeterReadingFormValues>(key: K, val: MeterReadingFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const result = meterReadingSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof MeterReadingFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { meter_id, value, unit, read_at } = result.data;

    const { error } = await supabase.from("meter_readings").insert({
      meter_id,
      technician_id: technicianId,
      value: Number(value),
      unit,
      read_at: new Date(read_at).toISOString(),
    });

    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitSuccess(true);
    setTimeout(() => router.push("/meter-reading?success=1"), 1500);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (submitSuccess) {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center">
          <svg className="w-6 h-6 text-status-success-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-text-primary">Reading saved!</p>
        <p className="text-sm text-text-muted">It will appear on the dashboard shortly.</p>
      </Card>
    );
  }

  const selectedMeter = meters.find((m) => m.id === values.meter_id);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && (
        <AlertBanner variant="critical" title="Could not save reading">
        {submitError}
      </AlertBanner>
      )}

      {/* Meter selector */}
      <SelectField
        label="Meter"
        required
        value={values.meter_id}
        onChange={(e) => set("meter_id", (e.target as HTMLSelectElement).value)}
        error={errors.meter_id}
      >
        {meters.length === 0 && (
          <option value="" disabled>No meters available</option>
        )}
        {meters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.village_name}
            {m.household_id ? ` — ${m.household_id}` : " — Main meter"}
          </option>
        ))}
      </SelectField>

      {/* Previous reading banner */}
      {prevLoading && (
        <p className="text-xs text-text-muted animate-pulse">Loading previous reading…</p>
      )}
      {!prevLoading && previousReading && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface border border-border text-sm">
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-text-muted">Previous reading:</span>
          <span className="font-semibold text-text-primary">
            {formatReading(previousReading.value, UNIT_LABELS[previousReading.unit as keyof typeof UNIT_LABELS] ?? previousReading.unit)}
          </span>
          <span className="text-text-muted text-xs ml-auto">
            {new Date(previousReading.read_at).toLocaleDateString()}
          </span>
        </div>
      )}
      {!prevLoading && !previousReading && selectedMeter && (
        <p className="text-xs text-text-muted px-1">No previous reading for this meter.</p>
      )}

      {/* Anomaly warning */}
      {anomaly && (
        <AlertBanner variant="warning" title="Anomaly detected">
          {anomaly}
        </AlertBanner>
      )}

      {/* Current reading value */}
      <FormField
        label="Reading value"
        type="number"
        inputMode="decimal"
        required
        placeholder="e.g. 19240.5"
        value={values.value}
        onChange={(e) => set("value", e.target.value)}
        error={errors.value}
        min="0"
        step="any"
      />

      {/* Unit pills */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-text-secondary">
          Unit <span className="text-status-critical-text">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Unit">
          {UNIT_OPTIONS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set("unit", u)}
              className={[
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150",
                values.unit === u
                  ? "bg-beacon-blue text-white border-beacon-blue"
                  : "bg-white text-text-secondary border-border hover:border-beacon-blue hover:text-beacon-blue",
              ].join(" ")}
              aria-pressed={values.unit === u}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
        {errors.unit && (
          <p className="text-xs text-status-critical-text">{errors.unit}</p>
        )}
      </div>

      {/* Reading date/time */}
      <FormField
        label="Reading date &amp; time"
        type="datetime-local"
        required
        value={values.read_at}
        onChange={(e) => set("read_at", e.target.value)}
        error={errors.read_at}
        max={toLocalDatetimeValue(new Date())}
      />

      <Button type="submit" disabled={loading} loading={loading} className="w-full">
        {loading ? "Saving…" : "Save reading"}
      </Button>
    </form>
  );
}
