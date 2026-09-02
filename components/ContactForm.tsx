"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong — try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-moss/10 p-6 text-moss-dark">
        Thanks — your message is in. We'll get back to you soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="rounded border border-clay/30 bg-clay/10 p-3 text-sm text-clay">{error}</div>
      )}

      <div className="grid gap-1">
        <label className="text-sm text-ink/60">Name</label>
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          className="rounded border border-line px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            className="rounded border border-line px-3 py-2"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-ink/60">Subject (optional)</label>
        <input
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          className="rounded border border-line px-3 py-2"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-ink/60">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          required
          rows={5}
          className="rounded border border-line px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-fit rounded bg-moss px-6 py-2.5 text-sm text-parchment hover:bg-moss-dark disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
