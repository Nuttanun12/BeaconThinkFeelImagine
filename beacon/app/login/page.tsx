import type { Metadata } from "next";
import { LoginForm } from "@/components/feature/LoginForm";
import { Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in — Beacon",
  description: "Sign in to the Beacon solar microgrid operations platform.",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#f8fafc] p-4 text-slate-900 font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <Radio className="w-8 h-8 text-blue-600 stroke-[2.4]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.14em] text-slate-900 leading-none">
              BEACON
            </h1>
            <p className="text-[10px] font-extrabold tracking-[0.24em] text-slate-500 uppercase mt-1">
              UTILITY GRID
            </p>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Off-grid Solar Operations &amp; Compliance Console
          </p>
        </div>

        {/* Auth form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <p className="text-xs font-bold text-slate-700">Account Sign In</p>
          <LoginForm />
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-slate-400">
          Demo accounts use password{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[11px]">
            beacon123
          </code>
        </p>
      </div>
    </div>
  );
}
