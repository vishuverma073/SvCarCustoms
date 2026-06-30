import { z } from "zod";

/**
 * Customer auth contracts (email-OTP). The access token lives in memory only
 * (never localStorage); the refresh token is an httpOnly cookie the FE never
 * reads directly. In the mocks, refresh is simulated with a non-httpOnly cookie.
 */

/** An authenticated storefront customer. Email is the login identity. */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  // Phone is collected at checkout for delivery, not at login — so a brand-new
  // user has none yet. `.default()` only fills `undefined`, not `null`, so
  // accept null/undefined explicitly and coerce to "".
  phone: z.string().nullish().transform((v) => v ?? ""),
  name: z.string().nullish().transform((v) => v ?? ""),
  // Drives the admin-only "Admin" button in the header. The API includes this on
  // the session/me responses; defaults false for safety if ever absent.
  isAdmin: z.boolean().default(false),
  // Whether the customer has set a password (enables password login). New /
  // OTP-only accounts start false until they set one in their account.
  hasPassword: z.boolean().default(false),
});
export type User = z.infer<typeof UserSchema>;

export const OtpSendRequestSchema = z.object({ email: z.string().email() });
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;

export const OtpVerifyRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
export type OtpVerifyRequest = z.infer<typeof OtpVerifyRequestSchema>;

/** Email + password login (alternative to OTP). */
export const PasswordLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type PasswordLoginRequest = z.infer<typeof PasswordLoginRequestSchema>;

/** Set/change the customer's password (authenticated). */
export const SetPasswordRequestSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type SetPasswordRequest = z.infer<typeof SetPasswordRequestSchema>;

/** Returned by verify/refresh: short-lived access token + the user. */
export const AuthSessionSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

/** PATCH /me payload — profile fields the customer can edit. Email is the login
 * identity and is not editable here. */
export const UpdateMeSchema = z.object({
  name: z.string().optional(),
});
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
