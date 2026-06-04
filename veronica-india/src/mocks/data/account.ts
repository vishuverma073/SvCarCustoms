import type { User, ServerCartItem } from "@veronica/contracts";

/**
 * Mock auth + cart state. OTP is a fixed code; any phone "works".
 *
 * Real auth uses an httpOnly refresh cookie the FE can't read. That can't be
 * simulated cross-origin (FE :3000 ↔ API :8787), so the client stores a
 * localStorage refresh marker (the phone) as a stand-in (see MOCK_REFRESH_MARKER
 * in backend.ts). backend.refresh() replays it so a reload restores the session,
 * mirroring silent-refresh. Swapping to the real API just drops it.
 */
export const MOCK_OTP = "123456";
export const MOCK_USER_TOKEN = "mock-user-token";

const usersByPhone = new Map<string, User>();
let currentPhone: string | null = null;

export function getOrCreateUser(phone: string): User {
  let user = usersByPhone.get(phone);
  if (!user) {
    user = { id: `user-${usersByPhone.size + 1}`, phone, name: "", email: "", isAdmin: false };
    usersByPhone.set(phone, user);
  }
  return user;
}

export function setCurrentPhone(phone: string | null) {
  currentPhone = phone;
}
export function getCurrentUser(): User | null {
  return currentPhone ? (usersByPhone.get(currentPhone) ?? null) : null;
}

/** Single in-memory server cart (one logged-in user at a time in dev). */
export const serverCart: ServerCartItem[] = [];
let lineSeq = 1000;
export const nextLineId = () => ++lineSeq;
