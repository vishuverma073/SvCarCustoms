"use client";

import { useEffect, useRef } from "react";
import { adminApi } from "@/lib/admin-api";
import { useAdminAuthStore } from "@/store/adminAuthStore";

/**
 * Restores the admin session on mount and validates a persisted token against
 * a gated endpoint. An invalid token is cleared (which makes {@link AdminLayout}
 * redirect to /login). Renders children unconditionally — gating lives in the
 * layout so the login page itself stays reachable.
 */
export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const token = useAdminAuthStore((s) => s.token);
  const validatedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    if (validatedFor.current === token) return;
    validatedFor.current = token;
    // adminApi.validateSession() clears the store on 401 via the API client.
    void adminApi.validateSession();
  }, [hydrated, token]);

  return <>{children}</>;
}
