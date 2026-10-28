import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/feature/DashboardClient";
import type { VillageStatus } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Role guard — only operations_director ─────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "operations_director") {
    // Technicians get redirected here on login; send them to their screen
    redirect("/check-in");
  }

  // ── Fetch village_status view ──────────────────────────────────────────────
  const { data: villageData, error } = await supabase
    .from("village_status")
    .select("*");

  if (error) {
    console.error("village_status fetch error:", error);
  }

  const villages = (villageData ?? []) as VillageStatus[];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-beacon-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-text-muted">Beacon</p>
            <h1 className="text-sm font-semibold text-text-primary leading-tight">
              Village Operations
            </h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User */}
          <div className="text-right">
            <p className="text-xs font-medium text-text-primary">{profile.name}</p>
            <p className="text-xs text-text-muted">Operations Director</p>
          </div>

          {/* Sign-out form */}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="ml-2 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* Page body */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary">Managed Microgrids</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Real-time status of all village solar installations.
          </p>
        </div>

        <DashboardClient initialData={villages} />
      </div>
    </main>
  );
}
