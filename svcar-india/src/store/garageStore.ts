import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SelectedVehicle } from "@svcar/contracts";

/**
 * The shopper's selected vehicle ("My Garage"). Persisted to localStorage so the
 * fitment filter and "fits your car" badges survive reloads. When set, storefront
 * listings can be narrowed to parts that fit this car.
 */
interface GarageState {
  vehicle: SelectedVehicle | null;
  /** Hydration flag — avoids SSR/client flash before persisted state loads. */
  hydrated: boolean;
  setVehicle: (vehicle: SelectedVehicle) => void;
  clearVehicle: () => void;
  setHydrated: () => void;
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set) => ({
      vehicle: null,
      hydrated: false,
      setVehicle: (vehicle) => set({ vehicle }),
      clearVehicle: () => set({ vehicle: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "svcar-garage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ vehicle: s.vehicle }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Human label for the selected vehicle, e.g. "Hyundai Creta (2023)". */
export function vehicleLabel(v: SelectedVehicle | null): string {
  if (!v) return "";
  return `${v.make} ${v.model}${v.year ? ` (${v.year})` : ""}`;
}
