"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Mail,
  MessageCircle,
  AlertCircle,
  Users,
  Copy,
  Send,
} from "lucide-react";
import { useSubscribers } from "@/lib/admin-hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Subscriber } from "@svcar/contracts";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubscribersPage() {
  const { data, isLoading, error } = useSubscribers();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);

  const all = data?.items ?? [];
  const rows = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) =>
      [s.email, s.name, s.phone].some((v) => v.toLowerCase().includes(q)),
    );
  }, [all, debounced]);

  const activeEmails = useMemo(
    () => all.filter((s) => s.status === "active").map((s) => s.email),
    [all],
  );

  function emailAll() {
    if (activeEmails.length === 0) return;
    const bcc = activeEmails.join(",");
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent("SV Car Customs")}`;
  }

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(activeEmails.join(", "));
      toast.success(`Copied ${activeEmails.length} email${activeEmails.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Couldn’t copy to clipboard");
    }
  }

  return (
    <div className="max-w-5xl pb-20">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Subscribers</h1>
        {data && (
          <span className="text-sm text-text-secondary">
            {data.activeCount} active · {data.total} total
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        Newsletter sign-ups from the storefront. Message them individually, or email everyone at once.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name or phone…"
            className="input pl-10!"
            type="search"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={emailAll}
            disabled={activeEmails.length === 0}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            <Send size={15} /> Email all
          </button>
          <button
            onClick={copyEmails}
            disabled={activeEmails.length === 0}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            <Copy size={15} /> Copy emails
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-text-secondary">
          <AlertCircle className="text-danger" />
          <p className="text-sm">Couldn&rsquo;t load subscribers.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-dim">
            <Users className="text-text-muted" />
          </div>
          <p className="font-medium text-text-secondary">No subscribers yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
          {rows.map((s: Subscriber) => {
            const phone = s.phone.replace(/[^0-9]/g, "");
            return (
              <div
                key={s.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center hover:bg-surface-dim/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-text-primary">{s.email}</span>
                    {s.status === "unsubscribed" && (
                      <span className="rounded-full bg-surface-dim px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                        Unsubscribed
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {s.name || "—"}
                    {s.phone ? ` · ${s.phone}` : ""} · joined {fmtDate(s.subscribedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={`mailto:${s.email}`}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-semibold text-brand-orange hover:bg-brand-orange/20"
                  >
                    <Mail size={13} /> Email
                  </a>
                  {phone && (
                    <a
                      href={`https://wa.me/${phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-whatsapp/10 px-2.5 py-1 text-[11px] font-semibold text-whatsapp hover:bg-whatsapp/20"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
