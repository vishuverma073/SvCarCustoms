"use client";

import { Pencil, Trash2, Plus, MapPin } from "lucide-react";
import type { Address } from "@svcar/contracts";

interface AddressListProps {
  addresses: Address[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onAddNew: () => void;
}

export default function AddressList({
  addresses,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: AddressListProps) {
  return (
    <div className="space-y-2.5">
      {addresses.map((a) => {
        const selected = a.id === selectedId;
        return (
          <label
            key={a.id}
            className={`flex gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
              selected ? "border-brand-orange bg-brand-orange/5" : "border-border-light hover:border-border"
            }`}
          >
            <input
              type="radio"
              name="address"
              checked={selected}
              onChange={() => onSelect(a.id)}
              className="mt-1 accent-brand-orange shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">{a.fullName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-dim text-text-secondary">
                  {a.label}
                </span>
                {a.isDefault && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-success/10 text-success">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                {a.landmark ? ` · ${a.landmark}` : ""}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{a.phone}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onEdit(a); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-brand-orange hover:bg-surface-dim"
                aria-label="Edit address"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onDelete(a); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50"
                aria-label="Delete address"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </label>
        );
      })}

      <button
        type="button"
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-colors"
      >
        <Plus size={16} /> Add a new address
      </button>

      {addresses.length === 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-text-muted py-2">
          <MapPin size={13} /> No saved addresses yet
        </p>
      )}
    </div>
  );
}
