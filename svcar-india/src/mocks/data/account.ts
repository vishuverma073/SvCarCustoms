import type { User, ServerCartItem } from "@svcar/contracts";
import { isAdminEmail } from "@/lib/admin-access";

/**
 * Mock auth + cart state. OTP is a fixed code; any email "works".
 *
 * Real auth uses an httpOnly refresh cookie the FE can't read. That can't be
 * simulated cross-origin (FE :3000 ↔ API :8787), so the client stores a
 * localStorage refresh marker (the email) as a stand-in (see MOCK_REFRESH_MARKER
 * in backend.ts). backend.refresh() replays it so a reload restores the session,
 * mirroring silent-refresh. Swapping to the real API just drops it.
 */
export const MOCK_OTP = "123456";
export const MOCK_USER_TOKEN = "mock-user-token";

const usersByEmail = new Map<string, User>();
let currentEmail: string | null = null;

/**
 * Plaintext passwords keyed by email — MOCK ONLY (real backend hashes these).
 * Persisted to localStorage so they survive page reloads (MSW in-memory state
 * otherwise resets on every load, which made password login appear "broken").
 */
const PW_STORE_KEY = "svcar-mock-passwords";

function loadPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PW_STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePasswords(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PW_STORE_KEY, JSON.stringify(map));
  } catch {
    /* storage disabled */
  }
}

export function getOrCreateUser(email: string): User {
  const key = email.trim().toLowerCase();
  let user = usersByEmail.get(key);
  if (!user) {
    user = {
      id: `user-${usersByEmail.size + 1}`,
      email: key,
      phone: "",
      name: "",
      isAdmin: isAdminEmail(key),
      hasPassword: userHasPassword(key),
    };
    usersByEmail.set(key, user);
  } else {
    user.hasPassword = userHasPassword(key);
  }
  return user;
}

/** Whether this email has a password set. */
export function userHasPassword(email: string): boolean {
  return Boolean(loadPasswords()[email.trim().toLowerCase()]);
}

/** Set/replace the password for an email and flip the user's hasPassword flag. */
export function setUserPassword(email: string, password: string): void {
  const key = email.trim().toLowerCase();
  const map = loadPasswords();
  map[key] = password;
  savePasswords(map);
  const u = usersByEmail.get(key);
  if (u) u.hasPassword = true;
}

/** True when the supplied password matches the stored one. */
export function checkUserPassword(email: string, password: string): boolean {
  return loadPasswords()[email.trim().toLowerCase()] === password;
}

export function setCurrentEmail(email: string | null) {
  currentEmail = email ? email.trim().toLowerCase() : null;
}
export function getCurrentUser(): User | null {
  return currentEmail ? (usersByEmail.get(currentEmail) ?? null) : null;
}

/** Single in-memory server cart (one logged-in user at a time in dev). */
export const serverCart: ServerCartItem[] = [];
let lineSeq = 1000;
export const nextLineId = () => ++lineSeq;
