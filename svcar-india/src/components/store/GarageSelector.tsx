"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Car, ChevronDown, X, Check } from "lucide-react";
import { backend } from "@/lib/backend";
import { useGarageStore, vehicleLabel } from "@/store/garageStore";
import { vehicleYears } from "@/mocks/data/vehicles";

/**
 * "Select your car" garage selector. Lets the shopper pick Make → Model → Year;
 * the choice persists (garage store) and powers the fitment filter + PDP badges.
 *
 * Rendered in the header. Compact pill trigger → dropdown with three selects.
 */
export default function GarageSelector({ className = "" }: { className?: string }) {
  const vehicle = useGarageStore((s) => s.vehicle);
  const hydrated = useGarageStore((s) => s.hydrated);
  const setVehicle = useGarageStore((s) => s.setVehicle);
  const clearVehicle = useGarageStore((s) => s.clearVehicle);

  const [open, setOpen] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: makes } = useSWR("vehicle-makes", () => backend.getVehicleMakes(), {
    revalidateOnFocus: false,
  });

  // Seed the form from the saved vehicle whenever the panel opens.
  useEffect(() => {
    if (open) {
      setMake(vehicle?.make ?? "");
      setModel(vehicle?.model ?? "");
      setYear(vehicle?.year ? String(vehicle.year) : "");
    }
  }, [open, vehicle]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const models = makes?.find((m) => m.name === make)?.models ?? [];

  function save() {
    if (!make || !model) return;
    setVehicle({ make, model, year: year ? Number(year) : null });
    setOpen(false);
  }

  const label = hydrated && vehicle ? vehicleLabel(vehicle) : "Select your car";

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 border ${
          hydrated && vehicle
            ? "border-brand-orange/40 text-brand-orange bg-brand-orange/10"
            : "border-border text-text-secondary hover:text-brand-black hover:border-brand-orange/40"
        }`}
      >
        <Car size={15} strokeWidth={2.2} />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select your vehicle"
          className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-border shadow-elevated p-4 z-50 animate-scale-in"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Car size={16} className="text-brand-orange" /> Your Garage
            </h3>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
          <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
            Pick your car to see parts that fit it.
          </p>

          <label className="input-label">Make</label>
          <select
            className="input mb-3"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
          >
            <option value="">Select make</option>
            {makes?.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          <label className="input-label">Model</label>
          <select
            className="input mb-3"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make}
          >
            <option value="">{make ? "Select model" : "Select a make first"}</option>
            {models.map((mod) => (
              <option key={mod.id} value={mod.name}>
                {mod.name}
              </option>
            ))}
          </select>

          <label className="input-label">Year (optional)</label>
          <select className="input mb-4" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Any year</option>
            {vehicleYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!make || !model}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Check size={15} /> Set vehicle
            </button>
            {hydrated && vehicle && (
              <button type="button" onClick={() => { clearVehicle(); setOpen(false); }} className="btn btn-ghost">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
