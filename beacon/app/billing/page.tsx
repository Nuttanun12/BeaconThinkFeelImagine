import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileShell } from "@/components/layout/MobileShell";
import { BillingClient } from "@/components/feature/BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <MobileShell userName={profile.name} userRole={profile.role}>
      <BillingClient userName={profile.name} />
    </MobileShell>
  );
}
