/**
 * Converts any text into a URL-safe slug: lowercase, hyphens instead of
 * spaces, no special characters. Used so product/category URLs never break
 * due to spaces, capital letters, or punctuation typed into an admin form.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip anything that isn't a letter, number, space, or hyphen
    .replace(/\s+/g, "-") // spaces -> hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}
