"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { backend } from "@/lib/backend";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState("error");
      return;
    }
    setState("loading");
    try {
      await backend.subscribeNewsletter(trimmed, { source: "footer" });
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-white">
            <Mail size={15} className="text-brand-orange" />
            Join our newsletter
          </h4>
          <p className="mt-1.5 text-[13px] text-white/50">
            New drops, deals and build inspiration — straight to your inbox.
          </p>
        </div>

        {state === "done" ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-green-400">
            <Check size={16} /> You&rsquo;re subscribed!
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-orange focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="btn btn-primary justify-center rounded-full px-5 py-2.5 text-sm disabled:opacity-70"
            >
              {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Subscribe"}
            </button>
          </form>
        )}
      </div>
      {state === "error" && (
        <p className="mt-2 text-[12px] text-red-400">Please enter a valid email address.</p>
      )}
    </div>
  );
}
