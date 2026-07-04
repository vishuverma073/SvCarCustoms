/**
 * PayU (India) hosted-checkout integration.
 *
 * Follows this codebase's "REST/HTTP over SDK" convention — we build the hosted
 * payment-page form params and verify hashes with node:crypto instead of pulling
 * in PayU's npm SDK. PayU's standard flow is a redirect / form-POST to its hosted
 * page (NOT a JS modal like Razorpay): the backend computes a request hash, the
 * browser POSTs the form to PayU, the customer pays there, and PayU POSTs the
 * result back to our `surl`/`furl` (see routes/payments.ts) which verifies a
 * reverse hash.
 *
 * STUB MODE: when PayU isn't configured (KEY / SALT missing) or NODE_ENV=test,
 * a built-in DUMMY key+salt is used so hashes are computed deterministically and
 * the whole flow is runnable end-to-end without a real PayU account. The browser
 * mock modal (NEXT_PUBLIC_MOCK_PAYMENTS) can't compute a real hash, so it sends a
 * `mock_*` placeholder that {@link verifyPayuResponse} accepts ONLY under the
 * explicit dev-auth bypass (never in production; see lib/dev-bypass.ts).
 */
import crypto from "node:crypto";
import { isDevAuthBypass } from "./dev-bypass.js";

const PAYU_TEST_URL = "https://test.payu.in/_payment";
const PAYU_LIVE_URL = "https://secure.payu.in/_payment";

/** Dummy creds used in stub mode so the flow is runnable end-to-end. */
const DUMMY_KEY = "payu_test_DUMMYKEY";
const DUMMY_SALT = "payudummysalt0000000000000";

export interface PayuConfig {
  merchantKey: string;
  salt: string;
}

/** Full real config, or null when either var is unset. */
export function getPayuConfig(): PayuConfig | null {
  const merchantKey = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  if (!merchantKey || !salt) return null;
  return { merchantKey, salt };
}

/**
 * True when we should treat PayU as stubbed: no real config, running tests, or
 * the configured key is the documented dummy placeholder.
 */
export function isPayuStub(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  const cfg = getPayuConfig();
  if (!cfg) return true;
  return cfg.merchantKey === DUMMY_KEY;
}

/** Merchant key sent to PayU and surfaced to the frontend form. */
export function getPayuMerchantKey(): string {
  return process.env.PAYU_MERCHANT_KEY || DUMMY_KEY;
}

function salt(): string {
  return process.env.PAYU_MERCHANT_SALT || DUMMY_SALT;
}

/** Hosted payment-page URL. PAYU_MODE=live → secure.payu.in, else the test host. */
export function getPayuPaymentUrl(): string {
  return process.env.PAYU_MODE === "live" ? PAYU_LIVE_URL : PAYU_TEST_URL;
}

export interface PayuInitInput {
  /** Unique per payment attempt (PayU rejects duplicate txnids). */
  txnid: string;
  /** Rupees as a 2-decimal string, e.g. "3099.00". */
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  /** Success + failure callback URLs (PayU POSTs the result here). */
  surl: string;
  furl: string;
  /** Optional user-defined fields (udf1 carries the order number by convention). */
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayuRequest {
  paymentUrl: string;
  /** The exact hidden form fields to POST to `paymentUrl`. */
  params: Record<string, string>;
}

/**
 * PayU request hash:
 *   sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * (udf6–udf10 are reserved-empty — the five empty segments before SALT.)
 */
function computeRequestHash(p: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
}): string {
  const seq = [
    p.key,
    p.txnid,
    p.amount,
    p.productinfo,
    p.firstname,
    p.email,
    p.udf1,
    p.udf2,
    p.udf3,
    p.udf4,
    p.udf5,
    "",
    "",
    "",
    "",
    "",
    salt(),
  ].join("|");
  return sha512(seq);
}

/** Build the hosted-page form (params + hash) for one payment attempt. */
export function buildPayuRequest(input: PayuInitInput): PayuRequest {
  const key = getPayuMerchantKey();
  const udf1 = input.udf1 ?? "";
  const udf2 = input.udf2 ?? "";
  const udf3 = input.udf3 ?? "";
  const udf4 = input.udf4 ?? "";
  const udf5 = input.udf5 ?? "";
  const hash = computeRequestHash({
    key,
    txnid: input.txnid,
    amount: input.amount,
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
  });
  const params: Record<string, string> = {
    key,
    txnid: input.txnid,
    amount: input.amount,
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    phone: input.phone,
    surl: input.surl,
    furl: input.furl,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    hash,
  };
  return { paymentUrl: getPayuPaymentUrl(), params };
}

/**
 * Reverse hash PayU sends back on the return/webhook:
 *   sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * When `additionalCharges` is present it is prepended to the sequence.
 */
function computeResponseHash(p: Record<string, string>, withAdditional: boolean): string {
  const seq = [
    salt(),
    p.status ?? "",
    "",
    "",
    "",
    "",
    "",
    p.udf5 ?? "",
    p.udf4 ?? "",
    p.udf3 ?? "",
    p.udf2 ?? "",
    p.udf1 ?? "",
    p.email ?? "",
    p.firstname ?? "",
    p.productinfo ?? "",
    p.amount ?? "",
    p.txnid ?? "",
    getPayuMerchantKey(),
  ].join("|");
  const full = withAdditional && p.additionalCharges ? `${p.additionalCharges}|${seq}` : seq;
  return sha512(full);
}

/**
 * Verify the hash PayU returns on the success/failure callback (and webhook).
 * Accepts the browser-mock `mock_*` placeholder ONLY under the dev-auth bypass.
 */
export function verifyPayuResponse(p: Record<string, string>): boolean {
  const provided = p.hash ?? "";
  if (provided.startsWith("mock") && isDevAuthBypass()) return true;
  // Some PayU integrations include additionalCharges in the reverse hash; accept
  // either form so we don't reject valid callbacks.
  const expected = computeResponseHash(p, false);
  if (safeEqualHex(expected, provided)) return true;
  const expectedWithCharges = computeResponseHash(p, true);
  return safeEqualHex(expectedWithCharges, provided);
}

/** Compute the reverse (response) hash — used by tests to forge a valid callback. */
export function computePayuResponseHash(p: Record<string, string>): string {
  return computeResponseHash(p, false);
}

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}

/** Constant-time hex-string comparison. */
function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
