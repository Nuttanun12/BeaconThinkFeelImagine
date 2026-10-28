"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { AlertBanner } from "@/components/ui/AlertBanner";
import type { Role } from "@/lib/types";

const ROLE_REDIRECT: Record<Role, string> = {
  operations_director: "/dashboard",
  technician: "/technician",
  household: "/billing",
};

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function validate() {
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        { email: email.trim(), password }
      );

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : authError.message
        );
        return;
      }

      // Fetch role and redirect
      const userId = data.user?.id;
      if (!userId) {
        setError("Login failed. Please try again.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      setSuccess(true);
      const role = (profile?.role as Role) ?? "household";
      router.push(ROLE_REDIRECT[role]);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface rounded-card shadow-card border border-border/60 p-6 space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Sign in</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Use your Beacon account credentials
        </p>
      </div>

      {error && (
        <AlertBanner variant="critical">
          {error}
        </AlertBanner>
      )}

      {success && (
        <AlertBanner variant="success">
          Signed in! Redirecting…
        </AlertBanner>
      )}

      <FormField
        label="Email address"
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
        }}
        error={fieldErrors.email}
        disabled={isPending || success}
      />

      <FormField
        label="Password"
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
        }}
        error={fieldErrors.password}
        disabled={isPending || success}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
        disabled={success}
        id="login-submit"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      {/* Quick Demo Fill Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
          QUICK FILL DEMO CREDENTIALS
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setEmail("amara@beacon.demo");
              setPassword("beacon123");
            }}
            className="py-2 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            Amara (Ops Dir)
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("kwame@beacon.demo");
              setPassword("beacon123");
            }}
            className="py-2 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            Kwame (Tech)
          </button>
        </div>
      </div>
    </form>
  );
}
