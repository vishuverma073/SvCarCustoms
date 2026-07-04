/**
 * Payment-provider selection.
 *
 * This project has FINALIZED PayU as the sole live gateway. The Razorpay code
 * path (lib/razorpay.ts, the /checkout/verify + /webhooks/razorpay routes) is
 * intentionally disabled and kept only for reference/reversibility — every order
 * is routed to PayU regardless of the PAYMENT_PROVIDER env var.
 */
export type PaymentProviderName = "razorpay" | "payu";

/** The gateway new orders are routed to. Locked to PayU for this project. */
export function getPaymentProvider(): PaymentProviderName {
  return "payu";
}
