/**
 * Allowlist of customer emails that are also admins. When one of these logs in
 * on the storefront, their user gets `isAdmin: true`, which surfaces the "Admin"
 * button in the header and lets them exchange their session for an admin session.
 *
 * In production this should come from the DB user role, not a hardcoded list —
 * this allowlist is the dev/mock stand-in.
 */
export const ADMIN_EMAILS = [
  "vermavishu9999@gmail.com",
  "admin@test.local",
];

/** True when the given email is an allowlisted admin (case-insensitive). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
