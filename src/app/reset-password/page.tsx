"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Button, Field, Input, Spinner } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link establishes a session (via /auth/confirm). Verify it.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login?reset=success"), 1400);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AuthShell title="Reset your password">
        <div className="mt-6 flex justify-center text-emerald-600">
          <Spinner size="md" />
        </div>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This reset link is invalid or has already been used"
        footer={
          <Link href="/forgot-password" className="text-emerald-600 hover:text-emerald-500 transition">
            Request a new link
          </Link>
        }
      >
        <Alert tone="warning" align="start" className="mt-6">
          Password reset links can only be used once and expire after an hour. Request a fresh one to
          continue.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle={done ? undefined : "Choose a password you don't use elsewhere"}>
      {done ? (
        <Alert tone="success" align="start" className="mt-6" title="Password updated">
          Redirecting you to log in…
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="New password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
