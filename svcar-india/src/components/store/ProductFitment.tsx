"use client";

import { useMemo } from "react";
import { Car, CheckCircle2, AlertTriangle, Globe } from "lucide-react";
import type { Product } from "@svcar/contracts";
import { productFitsVehicle } from "@svcar/contracts";
import { useGarageStore, vehicleLabel } from "@/store/garageStore";

/**
 * Fitment panel on the PDP. Shows whether the part fits the shopper's selected
 * vehicle (from the garage store) and lists the compatible vehicles. Universal
 * parts show a "fits all vehicles" badge.
 */
export default function ProductFitment({ product }: { product: Product }) {
  const vehicle = useGarageStore((s) => s.vehicle);
  const hydrated = useGarageStore((s) => s.hydrated);

  const fits = useMemo(
    () => productFitsVehicle(product.fitsAllVehicles, product.fitments, vehicle),
    [product.fitsAllVehicles, product.fitments, vehicle],
  );

  // Universal when the flag isn't explicitly false or there are no fitments.
  const isUniversal = product.fitsAllVehicles !== false || (product.fitments ?? []).length === 0;

  // Group fitments by make for a tidy compatibility list.
  const byMake = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const f of product.fitments ?? []) {
      const arr = map.get(f.make) ?? [];
      arr.push(f.model);
      map.set(f.make, arr);
    }
    return [...map.entries()];
  }, [product.fitments]);

  return (
    <div className="mt-6 rounded-2xl border border-border-light bg-surface-dim/40 p-4">
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-text-primary mb-3 flex items-center gap-2">
        <Car size={15} className="text-brand-orange" /> Fitment
      </h3>

      {/* Verdict vs selected vehicle */}
      {hydrated && vehicle ? (
        fits ? (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
            <CheckCircle2 size={16} /> Fits your {vehicleLabel(vehicle)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-warning">
            <AlertTriangle size={16} /> May not fit your {vehicleLabel(vehicle)}
          </div>
        )
      ) : (
        <p className="text-[12px] text-text-muted">
          Select your car (top right) to check if this part fits.
        </p>
      )}

      {/* Compatibility detail */}
      {isUniversal ? (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-text-secondary">
          <Globe size={15} className="text-text-muted" /> Universal — fits most cars
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-text-muted mb-1.5">Compatible vehicles</p>
          <ul className="flex flex-col gap-1 text-[13px] text-text-secondary">
            {byMake.map(([make, models]) => (
              <li key={make}>
                <span className="font-semibold text-text-primary">{make}:</span> {models.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
