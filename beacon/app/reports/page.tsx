import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { ReportsClient } from "@/components/feature/ReportsClient";
import type { VillageStatus } from "@/lib/types";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: villageData } = await supabase.from("village_status").select("*");
  const villages = (villageData ?? []) as VillageStatus[];

  return (
    <MobileShell userName={profile.name} userRole={profile.role}>
      <ReportsClient villages={villages} userName={profile.name} />
    </MobileShell>
  );
}
