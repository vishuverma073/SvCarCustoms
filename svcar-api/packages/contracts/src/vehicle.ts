import { z } from "zod";
import { IdSchema } from "./common.js";

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

/** A make with its models nested — what GET /vehicles/makes returns. */
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

/** Response shape for GET /vehicles/makes. */
export const VehicleMakesResponseSchema = z.object({
  makes: z.array(VehicleMakeWithModelsSchema),
});
export type VehicleMakesResponse = z.infer<typeof VehicleMakesResponseSchema>;
