"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Button, Field, Input } from "@/components/ui";

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Resend confirmation"
      subtitle={sent ? undefined : "We'll send a fresh confirmation link to your email"}
      footer={
        <Link href="/login" className="text-emerald-600 hover:text-emerald-500 transition">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success" align="start" className="mt-6" title="Confirmation sent">
          If {email} needs confirmation, a new link is on its way. Check your inbox and spam folder.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </Field>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Sending…" : "Resend confirmation"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
