import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Fetches the current session and throws if the user isn't ADMIN/STAFF.
 * Use in Server Components and Route Handlers alike. Pages should catch
 * the redirect case separately (see requireAdminPage below) since a thrown
 * error in a page just renders the error boundary, which isn't what we want
 * for "please log in" — we want an actual redirect.
 */
export async function requireAdminApi() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    return null;
  }
  return session;
}
