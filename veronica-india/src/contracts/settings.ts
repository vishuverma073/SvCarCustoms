import { z } from "zod";

/** Store-wide settings editable from the admin Settings page. */
export const SettingsSchema = z.object({
  storeName: z.string().min(1),
  supportPhone: z.string().min(1),
  supportEmail: z.string().email(),
  address: z.string().default(""),
  /** GST percentage applied to orders (e.g. 18). */
  gstRate: z.number().min(0).max(100),
  /** Order subtotal at/above which shipping is free (INR). */
  freeShippingAbove: z.number().nonnegative(),
  /** Flat shipping fee charged below the free-shipping threshold (INR). */
  shippingFee: z.number().nonnegative(),
  /** WhatsApp number used for the deep-link CTA, in E.164 (e.g. +919350529717). */
  whatsappNumber: z.string().min(1),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsUpdateSchema = SettingsSchema.partial();
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;
