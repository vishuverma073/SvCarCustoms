import { z } from "zod";

/** Newsletter subscriber (captured from the storefront signup form). */
export const SubscriberStatusSchema = z.enum(["active", "unsubscribed"]);
export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;

export const SubscriberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullish().transform((v) => v ?? ""),
  phone: z.string().nullish().transform((v) => v ?? ""),
  /** Where they signed up, e.g. "footer". */
  source: z.string().default("footer"),
  status: SubscriberStatusSchema.default("active"),
  subscribedAt: z.string(),
});
export type Subscriber = z.infer<typeof SubscriberSchema>;

/** GET /admin/subscribers response. */
export const SubscriberListSchema = z.object({
  items: z.array(SubscriberSchema),
  total: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
});
export type SubscriberList = z.infer<typeof SubscriberListSchema>;

/** Public POST /newsletter/subscribe payload. */
export const NewsletterSubscribeRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
});
export type NewsletterSubscribeRequest = z.infer<typeof NewsletterSubscribeRequestSchema>;

export const NewsletterSubscribeResponseSchema = z.object({ subscribed: z.boolean() });
export type NewsletterSubscribeResponse = z.infer<typeof NewsletterSubscribeResponseSchema>;
