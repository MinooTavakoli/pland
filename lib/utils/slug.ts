/**
 * Slug helper. Keeps Persian/Arabic letters, converts spaces to dashes,
 * strips unsafe characters. Falls back to a timestamp suffix for uniqueness.
 */
export function slugify(input: string): string {
  const base = (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, "-") // spaces + zero-width non-joiner → dash
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "") // keep latin, digits, persian
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || `item-${Date.now()}`;
}

/**
 * Ensures a slug is unique by appending a numeric suffix when needed.
 * `exists` resolves true when a slug is already taken.
 */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(input);
  let candidate = base;
  let i = 1;
  while (await exists(candidate)) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}
