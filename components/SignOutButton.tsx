"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-8 border border-ink px-5 py-2 text-sm hover:bg-ink hover:text-parchment"
    >
      Log out
    </button>
  );
}
