import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { MeterReadingForm } from "@/components/feature/MeterReadingForm";
import { Card } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/AlertBanner";
import type { Meter } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function MeterReadingPage({ searchParams }: PageProps) {
  const supabase = await createServerClient();
  const params = await searchParams;

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role guard
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "technician") {
    redirect("/dashboard");
  }

  // Fetch villages this technician is assigned to
  const { data: assignments } = await supabase
    .from("technician_assignments")
    .select("village_id")
    .eq("technician_id", user.id);

  const villageIds = (assignments ?? []).map((a) => a.village_id);

  // Fetch meters for those villages (joined with village name)
  type MeterRow = Meter & { village_name: string };
  let meters: MeterRow[] = [];

  if (villageIds.length > 0) {
    const { data: meterRows } = await supabase
      .from("meters")
      .select("id, village_id, household_id, villages(name)")
      .in("village_id", villageIds);

    meters = (meterRows ?? []).map((m) => ({
      id: m.id,
      village_id: m.village_id,
      household_id: m.household_id,
      village_name: (Array.isArray(m.villages) ? m.villages[0] : m.villages as { name: string } | null)?.name ?? "Unknown village",
    }));
  }

  const showSuccess = params.success === "1";

  return (
    <main className="min-h-screen bg-surface">
      {/* Mobile-first top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-beacon-blue flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <p className="text-xs text-text-muted">Beacon</p>
          <h1 className="text-sm font-semibold text-text-primary leading-tight">
            Meter Reading
          </h1>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium text-text-primary">{profile.name}</p>
          <p className="text-xs text-text-muted">Technician</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {showSuccess && (
          <AlertBanner variant="success" title="Reading saved">
            The meter reading is now visible on the dashboard.
          </AlertBanner>
        )}

        {meters.length === 0 ? (
          <Card className="p-6 text-center space-y-2">
            <p className="font-semibold text-text-primary">No meters found</p>
            <p className="text-sm text-text-muted">
              No meters are registered for your assigned villages yet.
            </p>
          </Card>
        ) : (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              Record meter reading
            </h2>
            <MeterReadingForm meters={meters} technicianId={user.id} />
          </Card>
        )}
      </div>
    </main>
  );
}
