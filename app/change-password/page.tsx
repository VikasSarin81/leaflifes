"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error ?? "Something went wrong.");
      return;
    }

    // The session's JWT still has the old mustChangePassword flag baked in
    // until next login — rather than fight with session refresh timing,
    // just sign the person out and have them log back in clean with their
    // real new password.
    await signOut({ callbackUrl: "/login?passwordChanged=true" });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Set a new password</h1>
      <p className="mt-2 text-sm text-ink/60">
        You're using a temporary password. Set a permanent one to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm text-ink/70">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-ink/30 bg-parchment px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm text-ink/70">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full border border-ink/30 bg-parchment px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-moss px-6 py-3 text-sm text-parchment hover:bg-moss-dark disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Set password and continue"}
        </button>
      </form>
    </div>
  );
}
