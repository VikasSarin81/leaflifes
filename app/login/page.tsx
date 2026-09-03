"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify === "success") {
      setNotice("Email verified — you can log in now.");
    } else if (verify === "expired") {
      setError("That verification link has expired. Register again to get a new one.");
    } else if (verify === "missing") {
      setError("That verification link looks broken. Try registering again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error === "EMAIL_NOT_VERIFIED") {
      setError(
        "Please verify your email before logging in — check the link we sent when you registered."
      );
      return;
    }
    if (res?.error) {
      setError("That email or password doesn't match an account.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-ink">Log in</h1>

      {notice && (
        <p className="mt-4 rounded bg-moss/10 px-3 py-2 text-sm text-moss-dark">{notice}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-ink/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-ink/30 bg-parchment px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-ink/70">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-ink/30 bg-parchment px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-moss px-6 py-3 text-sm text-parchment hover:bg-moss-dark disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        New here?{" "}
        <Link href="/register" className="underline hover:text-moss">
          Create an account
        </Link>
      </p>
    </div>
  );
}
