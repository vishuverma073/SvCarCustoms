"use client";

import useSWR from "swr";
import { z } from "zod";
import { Loader2, ScrollText } from "lucide-react";
import { API_BASE, USE_MOCKS } from "@/lib/api-config";
import { mocksReady } from "@/lib/mocks-ready";
import { getAdminToken } from "@/store/adminAuthStore";

const AuditEntrySchema = z.object({
  id: z.number(),
  actorEmail: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  createdAt: z.string(),
  changes: z.unknown().nullable(),
});
const AuditListSchema = z.array(AuditEntrySchema);
type AuditEntry = z.infer<typeof AuditEntrySchema>;

async function fetchAudit(): Promise<AuditEntry[]> {
  if (USE_MOCKS) await mocksReady;
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}/admin/audit`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("audit failed");
  return AuditListSchema.parse(await res.json());
}

export default function AuditPage() {
  const { data, isLoading, error } = useSWR(["admin/audit"], fetchAudit, {
    revalidateOnFocus: false,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-5">Audit Log</h1>

      {isLoading ? (
        <div className="flex justify-center py-16 text-text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger py-10 text-center">Couldn’t load the audit log.</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-lg border border-border-light p-3 flex items-start gap-3"
            >
              <ScrollText size={16} className="text-text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {e.action}{" "}
                  <span className="text-text-muted font-normal">
                    on {e.resourceType} #{e.resourceId}
                  </span>
                </p>
                <p className="text-[11px] text-text-muted">
                  {e.actorEmail} · {new Date(e.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted py-10 text-center">No audit entries yet.</p>
      )}
    </div>
  );
}
