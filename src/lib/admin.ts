/**
 * Admin access is an email allowlist, set in ADMIN_EMAILS as a
 * comma-separated list. Keeps the admin role out of the database
 * entirely — nothing for anyone to escalate.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
