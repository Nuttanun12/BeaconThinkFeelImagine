import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { TechnicianClient } from "@/components/feature/TechnicianClient";
import type { Village, Meter } from "@/lib/types";

interface PageProps {
  searchParams?: Promise<{ villageId?: string }>;
}

export default async function TechnicianPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Assigned villages (if ops director, grant access to all villages for field console)
  let assignedVillages: Village[] = [];
  if (profile.role === "operations_director") {
    const { data: allV } = await supabase.from("villages").select("id, name, region");
    assignedVillages = (allV ?? []) as Village[];
  } else {
    const { data: assignments } = await supabase
      .from("technician_assignments")
      .select("village_id, villages(id, name, region)")
      .eq("technician_id", user.id);

    assignedVillages = (assignments ?? [])
      .flatMap((a) => (Array.isArray(a.villages) ? a.villages : a.villages ? [a.villages] : []))
      .filter((v): v is Village => !!v && "id" in v);
  }

  const villageIds = assignedVillages.map((v) => v.id);

  // Meters for those villages
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
      village_name: (Array.isArray(m.villages) ? m.villages[0] : m.villages as { name: string } | null)?.name ?? "Unknown",
    }));
  }

  return (
    <MobileShell userName={profile.name} userRole={profile.role}>
      <TechnicianClient
        technicianId={user.id}
        technicianName={profile.name}
        assignedVillages={assignedVillages}
        meters={meters}
        initialVillageId={params?.villageId}
      />
    </MobileShell>
  );
}
