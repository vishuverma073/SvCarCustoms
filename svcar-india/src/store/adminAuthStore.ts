"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUser } from "@svcar/contracts";

/**
 * Admin session store.
 *
 * The bearer token + admin profile are persisted to **sessionStorage** (cleared
 * when the tab closes) — never a cookie, so the new admin no longer relies on
 * the legacy `admin-session` cookie + Next `/api/admin/*` routes. The token is
 * attached as `Authorization: Bearer <token>` by the admin API client.
 *
 * `hydrated` flips true once persist has rehydrated from sessionStorage, so the
 * layout can avoid redirecting to /login on the first paint before the stored
 * session is known.
 */
interface AdminAuthState {
  token: string | null;
  admin: AdminUser | null;
  hydrated: boolean;
  setSession: (token: string, admin: AdminUser) => void;
  clear: () => void;
  setHydrated: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      hydrated: false,
      setSession: (token, admin) => set({ token, admin }),
      clear: () => set({ token: null, admin: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "svcar-admin-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ token: s.token, admin: s.admin }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Read the current token outside React (used by the admin API client). */
export function getAdminToken(): string | null {
  return useAdminAuthStore.getState().token;
}
