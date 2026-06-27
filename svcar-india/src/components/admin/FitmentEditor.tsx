"use client";

import useSWR from "swr";
import { Plus, Trash2 } from "lucide-react";
import type { Fitment } from "@svcar/contracts";
import { backend } from "@/lib/backend";

/**
 * Admin fitment editor. Toggle "fits all vehicles" for universal parts, or list
 * the specific Make/Model (+ optional year range) a vehicle-specific part fits.
 */
export default function FitmentEditor({
  fitsAllVehicles,
  fitments,
  onChange,
}: {
  fitsAllVehicles: boolean | undefined;
  fitments: Fitment[] | undefined;
  onChange: (fitsAll: boolean, fitments: Fitment[]) => void;
}) {
  const { data: makes } = useSWR("vehicle-makes", () => backend.getVehicleMakes(), {
    revalidateOnFocus: false,
  });

  const universal = fitsAllVehicles !== false;
  const rows = fitments ?? [];

  function updateRow(i: number, patch: Partial<Fitment>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(false, next);
  }
  function addRow() {
    onChange(false, [...rows, { make: "", model: "" }]);
  }
  function removeRow(i: number) {
    onChange(false, rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={universal}
          onChange={(e) => onChange(e.target.checked, e.target.checked ? [] : rows)}
          className="w-4 h-4 accent-brand-orange"
        />
        Fits all vehicles (universal)
      </label>

      {!universal && (
        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-xs text-text-muted">Add the vehicles this part fits.</p>
          )}
          {rows.map((row, i) => {
            const models = makes?.find((m) => m.name === row.make)?.models ?? [];
            return (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[120px]">
                  <label className="input-label">Make</label>
                  <select
                    value={row.make}
                    onChange={(e) => updateRow(i, { make: e.target.value, model: "" })}
                    className="input py-1.5 text-sm"
                  >
                    <option value="">Make</option>
                    {makes?.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="input-label">Model</label>
                  <select
                    value={row.model}
                    onChange={(e) => updateRow(i, { model: e.target.value })}
                    className="input py-1.5 text-sm"
                    disabled={!row.make}
                  >
                    <option value="">Model</option>
                    {models.map((mod) => (
                      <option key={mod.id} value={mod.name}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="input-label">From</label>
                  <input
                    type="number"
                    value={row.yearStart ?? ""}
                    onChange={(e) => updateRow(i, { yearStart: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Year"
                    className="input py-1.5 text-sm"
                  />
                </div>
                <div className="w-20">
                  <label className="input-label">To</label>
                  <input
                    type="number"
                    value={row.yearEnd ?? ""}
                    onChange={(e) => updateRow(i, { yearEnd: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Year"
                    className="input py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="p-2 text-text-muted hover:text-danger"
                  aria-label="Remove vehicle"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addRow}
            className="btn btn-ghost text-sm border border-dashed border-border w-full"
          >
            <Plus size={15} /> Add vehicle
          </button>
        </div>
      )}
    </div>
  );
}
