"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; label: string; stock: number };

export default function StockQuickEdit({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variants.map((v) => [v.id, String(v.stock)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const updates = variants.map((v) => ({ variantId: v.id, stock: values[v.id] }));

    const res = await fetch(`/api/admin/products/${productId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Couldn't save — try again.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (variants.length === 0) {
    return <span className="text-xs text-ink/40">No variants</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-moss-dark underline"
      >
        Update stock
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-10 w-64 rounded-lg border border-line bg-white p-3 shadow-lg">
          {error && <p className="mb-2 text-xs text-clay">{error}</p>}
          <div className="grid gap-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-ink/70">{v.label}</span>
                <input
                  type="number"
                  min={0}
                  value={values[v.id]}
                  onChange={(e) => setValues((s) => ({ ...s, [v.id]: e.target.value }))}
                  className="w-20 rounded border border-line px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded bg-moss px-3 py-1 text-xs text-parchment disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
