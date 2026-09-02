import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-2xl text-ink">
        Hi{session.user.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-ink/60">{session.user.email}</p>

      <div className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
        <p className="text-ink/50">
          Order history will show up here once checkout is built.
        </p>
      </div>

      <SignOutButton />
    </div>
  );
}
