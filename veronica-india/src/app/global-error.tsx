"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root error boundary. Catches errors that escape the root layout, reports them
 * to Sentry (no-op without a DSN), and shows a minimal recovery screen. Uses
 * inline styles because the app stylesheet isn't guaranteed to load here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FAFAF9" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            color: "#0A0A0A",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#57534E", maxWidth: "420px", margin: "0 0 24px" }}>
            An unexpected error occurred. Please try again — if it keeps happening, reach us on
            WhatsApp and we’ll help.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#E8822A",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: "#fff",
                color: "#0A0A0A",
                border: "1px solid #E7E5E4",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
