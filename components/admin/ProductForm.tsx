"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import { slugify } from "@/lib/slugify";

type VariantInput = { id?: string; label: string; sku: string; price: string; stock: string };
type ImageInput = { id?: string; url: string; publicId?: string; isPrimary: boolean };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  mrp: string;
  price: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  images: ImageInput[];
  variants: VariantInput[];
};

export default function ProductForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial: ProductFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [saving, setSaving] = useState(false);
  // Only auto-generate the slug from the name for brand-new products. When
  // editing an existing one, its slug is presumably already live/indexed
  // somewhere, so don't silently rewrite it just because the name changed.
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));
  }

  function addVariant() {
    setValues((v) => ({
      ...v,
      variants: [...v.variants, { label: "", sku: "", price: v.price || "0", stock: "0" }],
    }));
  }

  function removeVariant(index: number) {
    setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) }));
  }

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    setError(null);
    const fileList = Array.from(files);
    const failures: string[] = [];

    try {
      for (const file of fileList) {
        if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
          failures.push(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          failures.push(`${file.name}: over 5MB`);
          continue;
        }

        try {
          // Fetch a fresh signature per file rather than reusing one across
          // the whole batch — cheap, and rules out any signature/timestamp
          // edge case as a cause of partial-batch failures.
          const sigRes = await fetch("/api/admin/upload-signature", { method: "POST" });
          if (!sigRes.ok) throw new Error("no upload permission");
          const { timestamp, folder, signature, apiKey, cloudName } = await sigRes.json();

          const form = new FormData();
          form.append("file", file);
          form.append("api_key", apiKey);
          form.append("timestamp", String(timestamp));
          form.append("signature", signature);
          form.append("folder", folder);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: form }
          );
          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => null);
            throw new Error(body?.error?.message ?? `HTTP ${uploadRes.status}`);
          }
          const uploaded = await uploadRes.json();

          setValues((v) => ({
            ...v,
            images: [
              ...v.images,
              { url: uploaded.secure_url, publicId: uploaded.public_id, isPrimary: v.images.length === 0 },
            ],
          }));
        } catch (fileErr) {
          failures.push(`${file.name}: ${fileErr instanceof Error ? fileErr.message : "upload failed"}`);
        }
      }
    } finally {
      setUploading(false);
      if (failures.length) {
        setError(`${failures.length} of ${fileList.length} image(s) failed — ${failures.join("; ")}`);
      }
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setValues((v) => {
      const next = [...v.images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return v;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...v, images: next };
    });
  }

  function setPrimaryImage(index: number) {
    setValues((v) => ({
      ...v,
      images: v.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  }

  function removeImage(index: number) {
    setValues((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(status: ProductFormValues["status"]) {
    if (status === "PUBLISHED" && values.variants.length === 0) {
      setError(
        "Add at least one variant before publishing — without one, customers won't see Add to Cart or Buy Now on this product. Scroll down to the Variants section, or save as Draft for now."
      );
      return;
    }

    setSaving(true);
    setError(null);
    const payload = { ...values, status };
    const url = values.id ? `/api/admin/products/${values.id}` : "/api/admin/products";
    const method = values.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving the product.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      {error && (
        <div className="mb-4 rounded border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Product name</label>
          <input
            value={values.name}
            onChange={(e) => {
              const name = e.target.value;
              update("name", name);
              // Auto-fill the slug from the name, but only while the admin
              // hasn't manually typed their own slug — once they've touched
              // it directly, respect whatever they put there.
              if (!slugTouched) {
                update("slug", slugify(name));
              }
            }}
            className="rounded border border-line px-3 py-2"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Slug (URL)</label>
          <input
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update("slug", e.target.value);
            }}
            onBlur={(e) => update("slug", slugify(e.target.value))}
            className="rounded border border-line px-3 py-2"
          />
          <p className="text-xs text-ink/40">
            Auto-fills from the product name. Lowercase letters, numbers, and
            hyphens only — spaces and capitals are cleaned up automatically.
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Category</label>
          <select
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="rounded border border-line px-3 py-2"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Short description</label>
          <input
            value={values.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Full description</label>
          <RichTextEditor value={values.description} onChange={(html) => update("description", html)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm text-ink/60">MRP (₹)</label>
            <input
              type="number"
              value={values.mrp}
              onChange={(e) => update("mrp", e.target.value)}
              className="rounded border border-line px-3 py-2"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-ink/60">Selling price (₹)</label>
            <input
              type="number"
              value={values.price}
              onChange={(e) => update("price", e.target.value)}
              className="rounded border border-line px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Tags (comma-separated)</label>
          <input
            value={values.tags}
            onChange={(e) => update("tags", e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </div>

        <div className="flex gap-6">
          {(["isFeatured", "isBestSeller", "isNewArrival"] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values[flag]}
                onChange={(e) => update(flag, e.target.checked)}
              />
              {flag === "isFeatured" && "Featured"}
              {flag === "isBestSeller" && "Best seller"}
              {flag === "isNewArrival" && "New arrival"}
            </label>
          ))}
        </div>

        {/* Images */}
        <div>
          <p className="text-sm text-ink/60">Images</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
            }}
            className={`mt-2 rounded border-2 border-dashed p-4 text-center text-sm ${
              dragOver ? "border-moss bg-moss/5" : "border-line"
            }`}
          >
            <p className="text-ink/50">
              Drag & drop images here, or{" "}
              <label className="cursor-pointer text-moss-dark underline">
                browse
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-ink/40">JPG, PNG, or WEBP — up to 5MB each</p>
            {uploading && <p className="mt-2 text-xs text-moss-dark">Uploading…</p>}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {values.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={i} className="w-24">
                <div className="relative">
                  <img src={img.url} alt="" className="h-24 w-24 rounded border border-line object-cover" />
                  {img.isPrimary && (
                    <span className="absolute left-1 top-1 rounded bg-moss px-1.5 py-0.5 text-[10px] text-parchment">
                      Primary
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="disabled:opacity-30">
                    ←
                  </button>
                  {!img.isPrimary && (
                    <button type="button" onClick={() => setPrimaryImage(i)} className="underline">
                      Set primary
                    </button>
                  )}
                  <button type="button" onClick={() => moveImage(i, 1)} disabled={i === values.images.length - 1} className="disabled:opacity-30">
                    →
                  </button>
                </div>
                <button type="button" onClick={() => removeImage(i)} className="mt-1 w-full text-xs text-clay underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div>
          <p className="text-sm text-ink/60">Variants</p>
          <div className="mt-2 grid gap-2">
            {values.variants.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_100px_80px_auto] gap-2 px-1 text-xs font-medium text-ink/50">
                <span>Label</span>
                <span>SKU</span>
                <span>Price (₹)</span>
                <span>Stock</span>
                <span></span>
              </div>
            )}
            {values.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_100px_80px_auto] gap-2">
                <input
                  placeholder="Label (e.g. 100ml)"
                  value={v.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                  className="rounded border border-line px-2 py-1 text-sm"
                />
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className="rounded border border-line px-2 py-1 text-sm"
                />
                <input
                  placeholder="Price"
                  type="number"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: e.target.value })}
                  className="rounded border border-line px-2 py-1 text-sm"
                />
                <input
                  placeholder="Stock"
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: e.target.value })}
                  className="rounded border border-line px-2 py-1 text-sm"
                />
                <button type="button" onClick={() => removeVariant(i)} className="text-xs text-clay underline">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="text-left text-xs text-moss-dark underline">
              + Add variant
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => handleSubmit("DRAFT")}
            className="rounded border border-moss px-4 py-2 text-sm text-moss-dark disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => handleSubmit("PUBLISHED")}
            className="rounded bg-moss px-4 py-2 text-sm text-parchment disabled:opacity-50"
          >
            {values.id ? "Update & publish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
