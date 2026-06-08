"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AddressInputSchema,
  INDIAN_STATES,
  ADDRESS_LABELS,
  type Address,
  type AddressInput,
} from "@veronica/contracts";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface AddressFormProps {
  initial?: Address;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
}

type Draft = Omit<AddressInput, "state"> & { state: string };

/** Reduce any phone (E.164 login phone, legacy formats) to a 10-digit Indian mobile. */
function to10Digits(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

function draftFrom(initial: Address | undefined, fallbackName: string, fallbackPhone: string): Draft {
  return {
    label: initial?.label ?? "Home",
    fullName: initial?.fullName ?? fallbackName,
    phone: to10Digits(initial?.phone ?? fallbackPhone),
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    landmark: initial?.landmark ?? "",
    isDefault: initial?.isDefault ?? false,
  };
}

export default function AddressForm({ initial, onSaved, onCancel }: AddressFormProps) {
  const user = useAuthStore((s) => s.user);
  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom(initial, user?.name ?? "", user?.phone ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pincodeMsg, setPincodeMsg] = useState("");

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // Pincode → city/state autofill (debounced). Doesn't overwrite fields the
  // user already filled; a 404 shows a non-blocking hint; other errors are silent.
  useEffect(() => {
    const pin = draft.pincode;
    if (pin.length !== 6) {
      setPincodeMsg("");
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await backend.lookupPincode(pin);
        if (!active) return;
        setPincodeMsg("");
        setDraft((d) => ({
          ...d,
          city: d.city.trim() ? d.city : res.city,
          state: d.state ? d.state : res.state,
        }));
      } catch (err) {
        if (active && err instanceof Error && err.message.includes("404")) {
          setPincodeMsg("PIN not recognized — please enter city/state manually.");
        }
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft.pincode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = AddressInputSchema.safeParse(draft);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = initial
        ? await backend.updateAddress(initial.id, parsed.data)
        : await backend.createAddress(parsed.data);
      onSaved(saved);
    } catch {
      toast.error("Couldn’t save the address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k] && <p className="text-[11px] text-danger mt-1">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Label chips */}
      <div className="flex gap-2">
        {ADDRESS_LABELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => set("label", l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              draft.label === l
                ? "border-brand-orange text-brand-orange bg-brand-orange/5"
                : "border-border text-text-secondary hover:bg-surface-dim"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Full name</label>
          <input value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} className="input" placeholder="Your full name" />
          {err("fullName")}
        </div>
        <div>
          <label className="input-label">Phone</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="input pl-12!"
              placeholder="10-digit mobile"
            />
          </div>
          {err("phone")}
        </div>
      </div>

      <div>
        <label className="input-label">Address line 1</label>
        <input
          value={draft.line1}
          onChange={(e) => set("line1", e.target.value)}
          className="input"
          placeholder="House / flat, building, street"
        />
        {err("line1")}
      </div>

      <div>
        <label className="input-label">Address line 2 (optional)</label>
        <input
          value={draft.line2}
          onChange={(e) => set("line2", e.target.value)}
          className="input"
          placeholder="Area, colony"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">City</label>
          <input value={draft.city} onChange={(e) => set("city", e.target.value)} className="input" placeholder="City" />
          {err("city")}
        </div>
        <div>
          <label className="input-label">PIN code</label>
          <input
            inputMode="numeric"
            value={draft.pincode}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input"
            placeholder="6 digits"
          />
          {err("pincode")}
          {pincodeMsg && <p className="text-[11px] text-text-muted mt-1">{pincodeMsg}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">State</label>
          <select value={draft.state} onChange={(e) => set("state", e.target.value)} className="input">
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {err("state")}
        </div>
        <div>
          <label className="input-label">Landmark (optional)</label>
          <input value={draft.landmark} onChange={(e) => set("landmark", e.target.value)} className="input" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="w-4 h-4 accent-brand-orange"
        />
        Set as default address
      </label>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost text-sm flex-1">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="btn btn-primary text-sm flex-1 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : initial ? "Save address" : "Save & use"}
        </button>
      </div>
    </form>
  );
}
