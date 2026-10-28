// ── Supabase DB row types ─────────────────────────────────────────────────────

export type Role = "operations_director" | "technician" | "household";

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

export interface Village {
  id: string;
  name: string;
  region: string;
}

export interface TechnicianAssignment {
  technician_id: string;
  village_id: string;
}

export interface Meter {
  id: string;
  village_id: string;
  household_id: string | null;
}

export interface CheckIn {
  id: string;
  technician_id: string;
  village_id: string;
  checked_in_at: string;
  location: string | null;
  notes: string | null;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  technician_id: string;
  value: number;
  unit: "kWh" | "m3_water" | "liters" | "v_amp";
  read_at: string;
  created_at: string;
}

// ── View types (from village_status view) ────────────────────────────────────

export interface VillageStatus {
  village_id: string;
  village_name: string;
  region: string;
  latest_checkin_at: string | null;
  latest_checkin_technician: string | null;
  latest_reading_at: string | null;
  latest_reading_value: number | null;
  latest_reading_unit: string | null;
  no_recent_update: boolean;
}

// ── UI helper types ───────────────────────────────────────────────────────────

export type StatusType =
  | "completed"
  | "overdue"
  | "pending"
  | "offline"
  | "critical"
  | "online";
