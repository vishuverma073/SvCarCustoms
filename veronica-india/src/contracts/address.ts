import { z } from "zod";
import { IdSchema } from "./common";

/**
 * Customer shipping addresses. A customer can save several and mark one as the
 * default. Pincode is a 6-digit Indian PIN; state is one of {@link INDIAN_STATES}.
 */

export const ADDRESS_LABELS = ["Home", "Office", "Other"] as const;
export const AddressLabelSchema = z.enum(ADDRESS_LABELS);
export type AddressLabel = z.infer<typeof AddressLabelSchema>;

/** All Indian states + union territories, for the address form dropdown. */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const PincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");

/** A saved shipping address. */
export const AddressSchema = z.object({
  id: IdSchema,
  label: AddressLabelSchema,
  fullName: z.string().min(1),
  phone: z.string().min(8),
  line1: z.string().min(1),
  line2: z.string().default(""),
  city: z.string().min(1),
  state: z.enum(INDIAN_STATES),
  pincode: PincodeSchema,
  landmark: z.string().default(""),
  isDefault: z.boolean().default(false),
});
export type Address = z.infer<typeof AddressSchema>;

export const AddressListSchema = z.array(AddressSchema);

/**
 * Create/update payload — id is server-managed. Validation is India-first and
 * stricter than the response schema (which stays lenient so legacy/existing
 * addresses still load): the contact number must be exactly a 10-digit Indian
 * mobile (starts 6–9), the PIN exactly 6 digits, etc.
 */
export const AddressInputSchema = AddressSchema.omit({ id: true }).extend({
  fullName: z.string().trim().min(2, "Enter the full name").max(60),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter the full address").max(120),
  line2: z.string().trim().max(120).default(""),
  city: z.string().trim().min(2, "Enter the city").max(50),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  state: z.enum(INDIAN_STATES, { message: "Select a state" }),
  landmark: z.string().trim().max(100).default(""),
});
export type AddressInput = z.infer<typeof AddressInputSchema>;

export const AddressUpdateSchema = AddressInputSchema.partial();
export type AddressUpdate = z.infer<typeof AddressUpdateSchema>;

/** Pincode → city/state lookup (autofills the address form). */
export const PincodeLookupSchema = z.object({
  pincode: PincodeSchema,
  city: z.string(),
  state: z.enum(INDIAN_STATES),
});
export type PincodeLookup = z.infer<typeof PincodeLookupSchema>;
