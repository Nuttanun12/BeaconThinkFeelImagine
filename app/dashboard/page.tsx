import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { DashboardClient } from "@/components/feature/DashboardClient";
import type { VillageStatus } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "operations_director") redirect("/technician");

  const { data: villageData } = await supabase.from("village_status").select("*");
  const villages = (villageData ?? []) as VillageStatus[];

  return (
    <MobileShell userName={profile.name} userRole={profile.role}>
      {/* Console View Header */}
      <div className="space-y-0.5 pt-1">
        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          CONSOLE VIEW
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Operations Director
        </h1>
      </div>

      <DashboardClient initialData={villages} userName={profile.name} />
    </MobileShell>
  );
}
