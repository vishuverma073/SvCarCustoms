import type { User, ServerCartItem } from "@veronica/contracts";

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

export function getOrCreateUser(email: string): User {
  const key = email.trim().toLowerCase();
  let user = usersByEmail.get(key);
  if (!user) {
    user = { id: `user-${usersByEmail.size + 1}`, email: key, phone: "", name: "", isAdmin: false };
    usersByEmail.set(key, user);
  }
  return user;
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
