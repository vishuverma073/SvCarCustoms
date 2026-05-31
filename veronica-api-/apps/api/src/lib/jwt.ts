import { sign, verify } from "hono/jwt";

const ADMIN_ISSUER = "veronica-admin";
const ADMIN_TTL_SECONDS = 8 * 60 * 60; // 8h — admins re-login each day; no refresh tokens.

function adminSecret(): string {
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ADMIN_SECRET is missing or shorter than 32 chars");
  }
  return secret;
}

export interface AdminTokenPayload {
  sub: string;
}

/** Sign an 8h HS256 admin access token. */
export async function signAdminAccess(payload: AdminTokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: payload.sub, iss: ADMIN_ISSUER, iat: now, exp: now + ADMIN_TTL_SECONDS },
    adminSecret(),
    "HS256",
  );
}

/** Verify an admin token; throws if invalid/expired/wrong-issuer. */
export async function verifyAdminAccess(token: string): Promise<AdminTokenPayload> {
  const payload = await verify(token, adminSecret(), "HS256");
  if (payload.iss !== ADMIN_ISSUER) {
    throw new Error("invalid token issuer");
  }
  if (typeof payload.sub !== "string") {
    throw new Error("invalid token subject");
  }
  return { sub: payload.sub };
}
