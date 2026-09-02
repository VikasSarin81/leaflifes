import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  if (role !== "ADMIN" && role !== "STAFF") {
    redirect("/");
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/enquiries", label: "Enquiries" },
  ];

  return (
    <div className="flex min-h-screen bg-parchment">
      <aside className="w-56 shrink-0 border-r border-moss/15 bg-white px-4 py-6">
        <Image src="/logo.jpeg" alt="LEAFLIFE" width={140} height={99} className="mb-8 w-32 rounded" />
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-3 py-2 text-sm text-ink/80 hover:bg-parchment"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-10 text-xs text-ink/40">
          Signed in as {session.user?.email} ({role})
        </p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
