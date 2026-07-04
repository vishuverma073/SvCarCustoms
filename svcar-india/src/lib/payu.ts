/**
 * PayU hosted-checkout handoff (frontend).
 *
 * PayU isn't a JS modal like Razorpay — the browser POSTs a form to PayU's hosted
 * payment page and the customer pays there, then PayU redirects back to our API's
 * success/failure URL (which redirects on to the storefront order page). So the
 * "open checkout" step here is just: build a hidden form from the params the API
 * returned and submit it (a full-page navigation away to PayU).
 */

/** The URL + hidden form fields the API returns for PayU checkout. */
export interface PayuHandoff {
  paymentUrl: string;
  params: Record<string, string>;
}

/**
 * Build a hidden form from the handoff and submit it, navigating the browser to
 * PayU's hosted payment page. Returns false if not in a browser.
 */
export function submitPayuForm(handoff: PayuHandoff): boolean {
  if (typeof document === "undefined") return false;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = handoff.paymentUrl;
  form.style.display = "none";
  for (const [name, value] of Object.entries(handoff.params)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  return true;
}
