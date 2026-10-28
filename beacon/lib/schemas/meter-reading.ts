import { z } from "zod";

export const UNIT_OPTIONS = ["kWh", "m3_water", "liters", "v_amp"] as const;
export type UnitOption = (typeof UNIT_OPTIONS)[number];

export const UNIT_LABELS: Record<UnitOption, string> = {
  kWh: "kWh",
  m3_water: "m³ Water",
  liters: "Liters",
  v_amp: "V / Amp",
};

export const meterReadingSchema = z.object({
  meter_id: z.string().uuid("Please select a meter"),
  value: z
    .string()
    .min(1, "Reading value is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Value must be a non-negative number",
    }),
  unit: z.enum(UNIT_OPTIONS, { error: "Please select a unit" }),
  read_at: z.string().min(1, "Reading date is required"),
});

export type MeterReadingFormValues = z.infer<typeof meterReadingSchema>;
