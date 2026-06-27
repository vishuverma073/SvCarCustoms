import type { VehicleMake, VehicleModel, VehicleMakeWithModels } from "@svcar/contracts";
import { slugify } from "@/lib/utils";

/**
 * Mock vehicle catalog (Indian market). Drives the "Select your car" garage
 * selector and the fitment filter. Mirrors what the backend
 * vehicle_makes / vehicle_models tables hold in production.
 */

interface MakeSeed {
  name: string;
  models: string[];
}

const MAKE_SEEDS: MakeSeed[] = [
  { name: "Maruti Suzuki", models: ["Swift", "Baleno", "Brezza", "Dzire", "Grand Vitara", "Fronx"] },
  { name: "Hyundai", models: ["i20", "Creta", "Venue", "Verna", "Exter"] },
  { name: "Tata", models: ["Nexon", "Harrier", "Punch", "Altroz", "Safari"] },
  { name: "Mahindra", models: ["Thar", "XUV700", "Scorpio-N", "Bolero", "XUV300"] },
  { name: "Kia", models: ["Seltos", "Sonet", "Carens"] },
  { name: "Toyota", models: ["Fortuner", "Innova Crysta", "Glanza", "Urban Cruiser Hyryder"] },
  { name: "Honda", models: ["City", "Amaze", "Elevate"] },
  { name: "Volkswagen", models: ["Virtus", "Taigun", "Polo"] },
  { name: "Skoda", models: ["Slavia", "Kushaq"] },
  { name: "MG", models: ["Hector", "Astor", "Gloster"] },
  { name: "BMW", models: ["3 Series", "5 Series", "X1"] },
  { name: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLA"] },
];

export const vehicleMakes: VehicleMake[] = MAKE_SEEDS.map((m, i) => ({
  id: i + 1,
  name: m.name,
  slug: slugify(m.name),
  sortOrder: i,
}));

let modelIdSeq = 0;
export const vehicleModels: VehicleModel[] = MAKE_SEEDS.flatMap((m, mi) =>
  m.models.map((name, vi) => ({
    id: ++modelIdSeq,
    makeId: mi + 1,
    name,
    slug: slugify(name),
    yearStart: null,
    yearEnd: null,
    sortOrder: vi,
  })),
);

/** Makes with their models nested — the shape GET /vehicles/makes serves. */
export const makesWithModels: VehicleMakeWithModels[] = vehicleMakes.map((make) => ({
  ...make,
  models: vehicleModels
    .filter((mod) => mod.makeId === make.id)
    .sort((a, b) => a.sortOrder - b.sortOrder),
}));

/** Plausible model-year options for the garage selector's year dropdown. */
export const vehicleYears: number[] = Array.from({ length: 12 }, (_, i) => 2026 - i);
