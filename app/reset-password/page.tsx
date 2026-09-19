"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">Invalid link</h1>
        <p className="mt-4 text-sm text-ink/70">
          This reset link is missing its token.{" "}
          <Link href="/forgot-password" className="underline hover:text-moss">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">Password updated</h1>
        <p className="mt-4 text-sm text-ink/70">
          You can now log in with your new password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm underline hover:text-moss">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Set a new password</h1>

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
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams() requires a Suspense boundary during static
  // prerendering, or the Netlify build fails — learned this the hard way
  // on the login page earlier.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
