import { z } from "zod";

/**
 * Customer auth contracts (phone-OTP). The access token lives in memory only
 * (never localStorage); the refresh token is an httpOnly cookie the FE never
 * reads directly. In the mocks, refresh is simulated with a non-httpOnly cookie.
 */

/** An authenticated storefront customer. */
export const UserSchema = z.object({
  id: z.string(),
  phone: z.string().min(8),
  // A brand-new user has no name/email yet, so the API returns null for these.
  // `.default()` only fills `undefined`, not `null`, so accept null/undefined
  // explicitly and coerce to "" — otherwise verify/me would throw on parse.
  name: z.string().nullish().transform((v) => v ?? ""),
  email: z.string().email().or(z.literal("")).nullish().transform((v) => v ?? ""),
  // Drives the admin-only "Admin" button in the header. The API includes this on
  // the session/me responses; defaults false for safety if ever absent.
  isAdmin: z.boolean().default(false),
});
export type User = z.infer<typeof UserSchema>;

export const OtpSendRequestSchema = z.object({ phone: z.string().min(8) });
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;

export const OtpVerifyRequestSchema = z.object({
  phone: z.string().min(8),
  code: z.string().length(6),
});
export type OtpVerifyRequest = z.infer<typeof OtpVerifyRequestSchema>;

/** Returned by verify/refresh: short-lived access token + the user. */
export const AuthSessionSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

/** PATCH /me payload — profile fields the customer can edit. */
export const UpdateMeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
});
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
