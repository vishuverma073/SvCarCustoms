import { z } from "zod";
import { IdSchema } from "./common";

/**
 * Vehicle fitment. Products are tied to the cars they fit so the storefront can
 * filter by the shopper's selected vehicle (Make → Model → Year). Universal
 * accessories set `fitsAllVehicles` on the product and carry no fitments.
 */

/** A car manufacturer, e.g. "Maruti Suzuki". */
export const VehicleMakeSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  sortOrder: z.number().int().default(0),
});
export type VehicleMake = z.infer<typeof VehicleMakeSchema>;

/** A model under a make, e.g. "Swift" with an optional production-year range. */
export const VehicleModelSchema = z.object({
  id: IdSchema,
  makeId: IdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  yearStart: z.number().int().nullable().optional(),
  yearEnd: z.number().int().nullable().optional(),
  sortOrder: z.number().int().default(0),
});
export type VehicleModel = z.infer<typeof VehicleModelSchema>;

/** A make+model with its models nested — what GET /vehicles/makes returns. */
export const VehicleMakeWithModelsSchema = VehicleMakeSchema.extend({
  models: z.array(VehicleModelSchema).default([]),
});
export type VehicleMakeWithModels = z.infer<typeof VehicleMakeWithModelsSchema>;

/** One compatibility entry on a product (make/model, optional year range). */
export const FitmentSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  yearStart: z.number().int().nullable().optional(),
  yearEnd: z.number().int().nullable().optional(),
});
export type Fitment = z.infer<typeof FitmentSchema>;

/** The shopper's chosen vehicle, persisted in the garage store. */
export const SelectedVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().nullable().optional(),
});
export type SelectedVehicle = z.infer<typeof SelectedVehicleSchema>;

/**
 * Does a product (given its universal flag + fitment list) fit the selected
 * vehicle? Universal parts always fit. Otherwise a fitment must match the make,
 * the model, and — when a year is selected and the fitment declares a range —
 * the year must fall within it.
 */
export function productFitsVehicle(
  fitsAllVehicles: boolean | undefined,
  fitments: Fitment[] | undefined,
  vehicle: SelectedVehicle | null,
): boolean {
  if (!vehicle) return true;
  // A missing/true universal flag, or no declared fitments, means "fits all".
  if (fitsAllVehicles !== false) return true;
  return (fitments ?? []).some((f) => {
    if (f.make !== vehicle.make || f.model !== vehicle.model) return false;
    if (vehicle.year == null) return true;
    const lo = f.yearStart ?? -Infinity;
    const hi = f.yearEnd ?? Infinity;
    return vehicle.year >= lo && vehicle.year <= hi;
  });
}
