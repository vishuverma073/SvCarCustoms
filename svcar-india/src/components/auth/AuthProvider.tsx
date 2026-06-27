"use client";

import { useEffect, useRef } from "react";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

/**
 * Attempts a silent refresh on mount to restore the in-memory session (the
 * access token is never persisted). Fire-and-forget — never blocks render; the
 * store flips to "authenticated"/"unauthenticated" when it resolves. Cart
 * hydration is triggered from here once auth resolves (see cartStore sync).
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    useAuthStore.getState().setStatus("authenticating");
    void backend.refresh().then((ok) => {
      if (ok) void useCartStore.getState().syncWithServer();
    });
  }, []);

  return <>{children}</>;
}
