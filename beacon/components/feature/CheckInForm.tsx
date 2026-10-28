"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkInSchema, type CheckInFormValues } from "@/lib/schemas/check-in";
import { type Village } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FormField, TextareaField, SelectField } from "@/components/ui/FormField";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Card } from "@/components/ui/Card";

// ── helpers ───────────────────────────────────────────────────────────────────

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function coordsToString(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Villages the current technician is assigned to */
  assignedVillages: Village[];
  technicianId: string;
}

type FieldErrors = Partial<Record<keyof CheckInFormValues, string>>;

export function CheckInForm({ assignedVillages, technicianId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [values, setValues] = useState<CheckInFormValues>({
    village_id: assignedVillages[0]?.id ?? "",
    checked_in_at: toLocalDatetimeValue(new Date()),
    location: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // ── geolocation ────────────────────────────────────────────────────────────

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((v) => ({
          ...v,
          location: coordsToString(pos.coords.latitude, pos.coords.longitude),
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enter coordinates manually."
            : "Could not get location. Enter coordinates manually."
        );
        setGeoLoading(false);
      },
      { timeout: 10_000 }
    );
  }, []);

  // Try to capture location on mount
  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  // ── field change ───────────────────────────────────────────────────────────

  function set<K extends keyof CheckInFormValues>(key: K, val: CheckInFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const result = checkInSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CheckInFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { village_id, checked_in_at, location, notes } = result.data;

    const { error } = await supabase.from("check_ins").insert({
      technician_id: technicianId,
      village_id,
      checked_in_at: new Date(checked_in_at).toISOString(),
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    });

    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitSuccess(true);
    // Give the user a moment to read the success state, then redirect
    setTimeout(() => router.push("/check-in?success=1"), 1500);
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
        <p className="font-semibold text-text-primary">Check-in recorded!</p>
        <p className="text-sm text-text-muted">Visible to the operations director.</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && (
        <AlertBanner variant="critical" title="Could not save check-in">
        {submitError}
      </AlertBanner>
      )}

      {/* Village */}
      <SelectField
        label="Village"
        required
        value={values.village_id}
        onChange={(e) => set("village_id", (e.target as HTMLSelectElement).value)}
        error={errors.village_id}
      >
        {assignedVillages.length === 0 && (
          <option value="" disabled>No villages assigned</option>
        )}
        {assignedVillages.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </SelectField>

      {/* Date / time */}
      <FormField
        label="Check-in time"
        type="datetime-local"
        required
        value={values.checked_in_at}
        onChange={(e) => set("checked_in_at", e.target.value)}
        error={errors.checked_in_at}
        max={toLocalDatetimeValue(new Date())}
      />

      {/* Location */}
      <div className="space-y-2">
        <FormField
          label="GPS location"
          type="text"
          placeholder="latitude, longitude (e.g. 3.1190, 35.5966)"
          value={values.location ?? ""}
          onChange={(e) => set("location", e.target.value)}
          error={errors.location ?? (geoError || undefined)}
          hint="Auto-captured from your device, or enter manually."
        />
        <button
          type="button"
          onClick={captureLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 text-xs text-beacon-blue hover:underline disabled:opacity-50"
        >
          {geoLoading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Getting location…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use my current location
            </>
          )}
        </button>
      </div>

      {/* Notes */}
      <TextareaField
        label="Site observations"
        placeholder="Panel status, equipment issues, household updates…"
        value={values.notes ?? ""}
        onChange={(e) => set("notes", e.target.value)}
        error={errors.notes}
        hint="Optional — max 2000 characters."
        rows={4}
      />

      <Button type="submit" disabled={loading} loading={loading} className="w-full">
        {loading ? "Saving…" : "Record check-in"}
      </Button>
    </form>
  );
}
