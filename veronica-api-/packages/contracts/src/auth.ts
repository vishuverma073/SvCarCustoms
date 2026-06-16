import { z } from "zod";

/** Indian mobile in E.164, e.g. +919350529717. Still used for delivery (orders
 * + addresses); auth no longer uses it. */
export const PhoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, "must be a valid +91 Indian mobile");
export type Phone = z.infer<typeof PhoneSchema>;

/** Login identity. Normalized to lowercase so uniqueness + lookups are stable. */
export const EmailSchema = z.string().trim().toLowerCase().pipe(z.string().email());
export type Email = z.infer<typeof EmailSchema>;

export const OtpSendRequestSchema = z.object({ email: EmailSchema });
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;

export const OtpSendResponseSchema = z.object({
  ok: z.literal(true),
  expiresInSeconds: z.number(),
});
export type OtpSendResponse = z.infer<typeof OtpSendResponseSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  // Collected at checkout for delivery, not at login — so a freshly signed-up
  // user has none yet.
  phone: PhoneSchema.nullable(),
  name: z.string().nullable(),
  isAdmin: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const OtpVerifyRequestSchema = z.object({
  email: EmailSchema,
  code: z.string().length(6).regex(/^\d+$/),
});
export type OtpVerifyRequest = z.infer<typeof OtpVerifyRequestSchema>;

// Refresh token is delivered as an httpOnly cookie, not in the body.
export const OtpVerifyResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponseSchema>;
