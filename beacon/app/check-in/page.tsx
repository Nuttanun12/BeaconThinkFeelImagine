import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { CheckInForm } from "@/components/feature/CheckInForm";
import { Card } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/AlertBanner";
import type { Village } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function CheckInPage({ searchParams }: PageProps) {
  const supabase = await createServerClient();
  const params = await searchParams;

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Role guard — only technicians can check in
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
    .select("village_id, villages(id, name, region)")
    .eq("technician_id", user.id);

  const assignedVillages: Village[] = (assignments ?? [])
    .flatMap((a) => (Array.isArray(a.villages) ? a.villages : a.villages ? [a.villages] : []))
    .filter((v): v is Village => !!v && typeof v === "object" && "id" in v);

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
            Technician Check-in
          </h1>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium text-text-primary">{profile.name}</p>
          <p className="text-xs text-text-muted">Technician</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {showSuccess && (
          <AlertBanner variant="success" title="Check-in recorded">
            Your check-in is now visible to the operations director.
          </AlertBanner>
        )}

        {assignedVillages.length === 0 ? (
          <Card className="p-6 text-center space-y-2">
            <p className="font-semibold text-text-primary">No villages assigned</p>
            <p className="text-sm text-text-muted">
              Contact your operations director to be assigned to a village.
            </p>
          </Card>
        ) : (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              Record check-in
            </h2>
            <CheckInForm
              assignedVillages={assignedVillages}
              technicianId={user.id}
            />
          </Card>
        )}
      </div>
    </main>
  );
}
