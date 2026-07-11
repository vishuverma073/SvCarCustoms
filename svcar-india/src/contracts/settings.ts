import { z } from "zod";

/** Structured store address — matches the API's `storeAddress` object. */
export const StoreAddressSchema = z.object({
  label: z.string().nullish().transform((v) => v ?? ""),
  line1: z.string().default(""),
  line2: z.string().nullish().transform((v) => v ?? ""),
  city: z.string().default(""),
  state: z.string().default(""),
  pincode: z.string().default(""),
  landmark: z.string().nullish().transform((v) => v ?? ""),
});
export type StoreAddress = z.infer<typeof StoreAddressSchema>;

/** Store-wide settings editable from the admin Settings page. */
export const SettingsSchema = z.object({
  storeName: z.string().min(1),
  supportPhone: z.string().min(1),
  supportEmail: z.string().email().or(z.literal("")),
  storeAddress: StoreAddressSchema,
  /** GST percentage applied to orders (e.g. 18). */
  gstRate: z.number().min(0).max(100),
  /** Order subtotal at/above which shipping is free (INR). */
  shippingFreeAbove: z.number().nonnegative(),
  /** Flat shipping fee charged below the free-shipping threshold (INR). */
  shippingFlatFee: z.number().nonnegative(),
  /** WhatsApp number used for the deep-link CTA, in E.164 (e.g. +919205005425). */
  whatsappNumber: z.string().min(1),
  updatedAt: z.string().optional(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsUpdateSchema = SettingsSchema.partial();
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;
