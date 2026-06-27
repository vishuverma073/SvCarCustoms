import { z } from "zod";
import { IdSchema, PriceSchema } from "./common.js";

export const SkuSchema = z.object({
  id: IdSchema,
  skuCode: z.string().min(1),
  price: PriceSchema,
  salePrice: PriceSchema.nullable(),
  /** Selected dimension values keyed by dimension name, e.g. { "Size": "24×18×9", "Gauge": "Heavy" }. */
  dimensionValues: z.record(z.string(), z.string()),
  /** Free-form spec attributes keyed by name, e.g. { "Bowl Size": "22×16×9" }. */
  attributes: z.record(z.string(), z.string()).optional(),
  stock: z.number().int().nullable().optional(),
});
export type Sku = z.infer<typeof SkuSchema>;
