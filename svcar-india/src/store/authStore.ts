import { create } from "zustand";
import type { User } from "@svcar/contracts";

/**
 * Customer auth state. The access token lives in memory ONLY (never
 * localStorage — XSS exposure); it's restored on load via silent refresh
 * ({@link AuthProvider}). No `persist`.
 */
export type AuthStatus = "idle" | "authenticating" | "authenticated" | "unauthenticated";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
  setAuth: (accessToken: string, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setAuth: (accessToken, user) => set({ accessToken, user, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));

/** Read the access token outside React (used by the authenticated fetcher). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
