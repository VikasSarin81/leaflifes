"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = confirm(`Delete "${productName}"? This can't be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't delete this product.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-clay underline disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
