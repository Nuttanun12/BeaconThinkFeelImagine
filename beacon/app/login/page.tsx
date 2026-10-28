import type { Metadata } from "next";
import { LoginForm } from "@/components/feature/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Beacon solar microgrid operations platform.",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white font-bold text-xl shadow-lg"
            style={{ backgroundColor: "var(--color-beacon-blue)" }}
            aria-hidden="true"
          >
            B
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Beacon
          </h1>
          <p className="text-sm text-text-muted">
            Solar microgrid operations platform
          </p>
        </div>

        {/* Auth form (client component) */}
        <LoginForm />

        {/* Demo hint */}
        <p className="text-center text-xs text-text-subtle">
          Demo accounts use password{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-text-muted font-mono">
            beacon123
          </code>
        </p>
      </div>
    </div>
  );
}
