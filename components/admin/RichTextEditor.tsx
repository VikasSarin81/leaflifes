"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useRef, useState } from "react";

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-md max-w-full" } }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[160px] rounded-b border border-t-0 border-line px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // Avoids an SSR/client markup mismatch warning that Tiptap is prone to in Next.js.
    immediatelyRender: false,
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !editor) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      alert("Only JPG, PNG, WEBP, or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Images must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const sigRes = await fetch("/api/admin/upload-signature", { method: "POST" });
      if (!sigRes.ok) throw new Error();
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
      if (!uploadRes.ok) throw new Error();
      const uploaded = await uploadRes.json();

      editor.chain().focus().setImage({ src: uploaded.secure_url }).run();
    } catch {
      alert("Image upload failed. Check your Cloudinary settings and try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-xs ${active ? "bg-moss text-parchment" : "text-ink/70 hover:bg-line/60"}`;

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t border border-line bg-parchment/60 p-1">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>
          H3
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>
          1. List
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("Link URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={btn(editor.isActive("link"))}
        >
          Link
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHardBreak().run()} className={btn(false)}>
          ↵ Line break
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className={btn(false)}
        >
          {uploadingImage ? "Uploading…" : "🖼 Insert image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImagePick}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
