"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BannerValues = {
  imageUrl: string;
  imagePublicId: string;
  headline: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
};

export default function BannerForm({ initial }: { initial: BannerValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof BannerValues>(key: K, val: BannerValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    setSaved(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed.");
      setUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      setUploading(false);
      return;
    }

    try {
      const sigRes = await fetch("/api/admin/upload-signature", { method: "POST" });
      if (!sigRes.ok) throw new Error("Could not get upload permission.");
      const { timestamp, folder, signature, apiKey, cloudName } = await sigRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("Upload failed.");
      const uploaded = await uploadRes.json();

      update("imageUrl", uploaded.secure_url);
      update("imagePublicId", uploaded.public_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/banner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save the banner.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <div className="mb-4 rounded border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 rounded border border-moss/30 bg-moss/10 p-3 text-sm text-moss-dark">
          Saved — check the homepage to see it live.
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <p className="text-sm text-ink/60">Banner image</p>
          <div className="mt-2 flex items-start gap-4">
            {values.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.imageUrl} alt="" className="h-32 w-32 rounded border border-line object-cover" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded border border-dashed border-line text-xs text-ink/40">
                No image
              </div>
            )}
            <div>
              <label className="cursor-pointer rounded border border-moss px-4 py-2 text-sm text-moss-dark hover:bg-moss/5">
                {uploading ? "Uploading…" : "Upload new image"}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
              </label>
              <p className="mt-2 text-xs text-ink/40">JPG, PNG, or WEBP, up to 5MB. Square-ish or landscape photos work best.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Headline</label>
          <textarea
            value={values.headline}
            onChange={(e) => update("headline", e.target.value)}
            rows={2}
            className="rounded border border-line px-3 py-2"
          />
          <p className="text-xs text-ink/40">Use a line break to control where the text wraps, if you want.</p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-ink/60">Description</label>
          <textarea
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="rounded border border-line px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm text-ink/60">Button text</label>
            <input
              value={values.buttonText}
              onChange={(e) => update("buttonText", e.target.value)}
              className="rounded border border-line px-3 py-2"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-ink/60">Button link</label>
            <input
              value={values.buttonUrl}
              onChange={(e) => update("buttonUrl", e.target.value)}
              placeholder="/shop"
              className="rounded border border-line px-3 py-2"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="mt-2 w-fit rounded bg-moss px-6 py-2.5 text-sm text-parchment hover:bg-moss-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save banner"}
        </button>
      </div>
    </div>
  );
}
