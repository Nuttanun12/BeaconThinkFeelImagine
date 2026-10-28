import { z } from "zod";

// ── Latitude/longitude pattern ─────────────────────────────────────────────
// Accepts "lat, lon" or "lat,lon" with optional decimal places
const latLonPattern =
  /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

export const checkInSchema = z.object({
  village_id: z.string().uuid("Please select a village"),
  checked_in_at: z.string().min(1, "Check-in time is required"),
  location: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // optional
        return latLonPattern.test(val.trim());
      },
      {
        message:
          'Location must be in "latitude, longitude" format (e.g. 1.2921, 36.8219)',
      }
    ),
  notes: z.string().max(2000, "Notes must be 2000 characters or fewer").optional(),
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;
