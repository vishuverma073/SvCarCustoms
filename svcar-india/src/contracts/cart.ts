import { z } from "zod";
import { IdSchema, MoneySchema } from "./common";

/**
 * Server-side cart for logged-in customers. The storefront keeps a local
 * (localStorage) cart for guests; on login the two merge by `skuId`.
 */

/** One server cart line. `id` is the server line-item id; `skuId` is the product SKU. */
export const ServerCartItemSchema = z.object({
  id: z.number().int().positive(),
  skuId: IdSchema,
  name: z.string(),
  slug: z.string(),
  price: MoneySchema,
  image: z.string(),
  variant: z.string().optional(),
  qty: z.number().int().positive(),
});
export type ServerCartItem = z.infer<typeof ServerCartItemSchema>;

export const CartSchema = z.object({ items: z.array(ServerCartItemSchema) });
export type Cart = z.infer<typeof CartSchema>;

export const AddCartItemSchema = z.object({
  skuId: IdSchema,
  qty: z.number().int().positive(),
  // Denormalized display fields so the mock cart can render without a join.
  name: z.string(),
  slug: z.string(),
  price: MoneySchema,
  image: z.string(),
  variant: z.string().optional(),
});
export type AddCartItem = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({ qty: z.number().int().positive() });
export type UpdateCartItem = z.infer<typeof UpdateCartItemSchema>;
