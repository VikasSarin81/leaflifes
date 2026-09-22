import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { sendTempPasswordEmail } from "@/lib/mail";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function resetPassword(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const userId = String(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // A random 6-digit numeric code — short-lived by design, since the
  // person is forced to replace it with a real password the moment they
  // log in (enforced by middleware.ts), not a standing credential.
  const tempPassword = crypto.randomInt(100000, 999999).toString();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  // Don't let an email failure crash the whole action — the password is
  // already reset in the database regardless, so the admin needs to see
  // the temp code either way. If email fails, show it on-screen instead
  // so you're never blocked from telling the customer some other way
  // (phone, WhatsApp, etc.) while the email issue gets sorted separately.
  let emailError: string | null = null;
  try {
    await sendTempPasswordEmail(user.email, tempPassword);
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email failed to send.";
    console.error("sendTempPasswordEmail failed:", err);
  }

  revalidatePath("/admin/users");
  redirect(
    `/admin/users?tempPassword=${tempPassword}&email=${encodeURIComponent(user.email)}${
      emailError ? `&emailError=${encodeURIComponent(emailError)}` : ""
    }`
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { tempPassword?: string; email?: string; emailError?: string };
}) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Users</h1>
      <p className="mt-1 text-sm text-ink/50">
        Passwords are never visible to anyone, including admins — that's a one-way hash. Use "Reset password" to email a temporary one instead.
      </p>

      {searchParams.tempPassword && (
        <div className="mt-4 rounded border border-line bg-parchment p-4">
          {searchParams.emailError ? (
            <p className="text-sm text-clay">
              Password was reset, but the email failed to send ({searchParams.emailError}). Tell{" "}
              {searchParams.email} their temp password another way:
            </p>
          ) : (
            <p className="text-sm text-ink/70">
              Password reset — email sent to {searchParams.email}. Here's the code too, just in case:
            </p>
          )}
          <p className="mt-2 text-2xl font-bold tracking-widest">{searchParams.tempPassword}</p>
        </div>
      )}


      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="p-3">{u.name || "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className="rounded bg-parchment px-2 py-0.5 text-xs">{u.role}</span>
                  {u.mustChangePassword && (
                    <span className="ml-2 rounded bg-turmeric/10 px-2 py-0.5 text-xs text-turmeric">
                      Pending password change
                    </span>
                  )}
                </td>
                <td className="p-3">{u._count.orders}</td>
                <td className="p-3">{u.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="p-3 text-right">
                  <form action={resetPassword}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="text-xs text-moss-dark underline">
                      Reset password
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/50">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
