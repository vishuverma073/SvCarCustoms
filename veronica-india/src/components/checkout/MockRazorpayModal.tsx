"use client";

import { useState } from "react";
import { X, Lock, Smartphone, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { RazorpayOptions, RazorpayResponse } from "@/lib/razorpay";

/**
 * A faithful stand-in for Razorpay's hosted Checkout modal, used in mock mode.
 * It drives the exact same `options.handler` / `options.modal.ondismiss`
 * callbacks the real SDK uses, so the surrounding flow is identical — only this
 * component is replaced (by the real modal) when NEXT_PUBLIC_USE_MOCKS is off.
 *
 * UPI shows a real, scannable QR (encoding a upi:// intent for the amount); Card
 * collects number + expiry + CVV. Nothing is transmitted — tapping Pay just
 * fires the success callback — but it makes manual checkout testing realistic.
 */
export default function MockRazorpayModal({ options }: { options: RazorpayOptions | null }) {
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [phase, setPhase] = useState<"idle" | "processing" | "failed">("idle");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [upiId, setUpiId] = useState("success@razorpay");

  if (!options) return null;
  const rupees = options.amount / 100;

  // A real, scannable UPI QR (test VPA) encoding payee + amount + note.
  const upiUri =
    `upi://pay?pa=veronica@razorpay&pn=${encodeURIComponent("Veronica India")}` +
    `&am=${rupees}&cu=INR&tn=${encodeURIComponent(options.description ?? "Veronica order")}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(upiUri)}`;

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardValid = cardDigits.length === 16 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length === 3;
  const upiValid = /.+@.+/.test(upiId.trim());
  const canPay = phase !== "processing" && (method === "card" ? cardValid : upiValid);

  function dismiss() {
    options!.modal?.ondismiss?.();
  }

  function succeed() {
    if (!canPay) return;
    setPhase("processing");
    const response: RazorpayResponse = {
      razorpay_order_id: options!.order_id,
      razorpay_payment_id: `pay_mock_${Math.random().toString(36).slice(2, 12)}`,
      razorpay_signature: `sig_mock_${Math.random().toString(36).slice(2, 18)}`,
    };
    // Mimic the brief network round-trip before Razorpay fires `handler`.
    setTimeout(() => options!.handler(response), 700);
  }

  function onCardNumber(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  }
  function onExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center">
              <Lock size={16} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">{options.name}</p>
              <p className="text-[11px] text-text-muted leading-tight">{options.description}</p>
            </div>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-surface-dim" aria-label="Close payment">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Amount */}
        <div className="px-5 py-4 bg-surface-dim/40 flex items-baseline justify-between">
          <span className="text-sm text-text-secondary">Amount payable</span>
          <span className="text-xl font-extrabold text-text-primary">{formatPrice(rupees)}</span>
        </div>

        {phase === "failed" && (
          <p className="mx-5 mt-4 text-sm text-danger font-medium bg-red-50 rounded-lg px-3 py-2">
            Payment failed. Please try another method or retry.
          </p>
        )}

        {/* Method tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "upi", label: "UPI", icon: Smartphone },
              { key: "card", label: "Card", icon: CreditCard },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  method === key
                    ? "border-brand-orange text-brand-orange bg-brand-orange/5"
                    : "border-border text-text-secondary hover:bg-surface-dim"
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {method === "upi" ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="p-3 rounded-2xl border border-border-light bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrSrc} alt="UPI QR code" width={160} height={160} className="w-40 h-40" />
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Scan with any UPI app to pay {formatPrice(rupees)}
              </p>
              <div className="mt-3 w-full text-left">
                <label className="input-label">or enter UPI ID</label>
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="input text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label className="input-label">Card number</label>
                <input
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => onCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111"
                  className="input text-sm tracking-wider"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Expiry (MM/YY)</label>
                  <input
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => onExpiry(e.target.value)}
                    placeholder="08/27"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="input-label">CVV</label>
                  <input
                    inputMode="numeric"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    className="input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Name on card</label>
                <input
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  placeholder="Name on card"
                  className="input text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 space-y-2">
          <button
            onClick={succeed}
            disabled={!canPay}
            className="btn btn-primary w-full py-3 text-[15px] disabled:opacity-50"
          >
            {phase === "processing" ? (
              <><Loader2 size={18} className="animate-spin" /> Processing…</>
            ) : (
              <>Pay {formatPrice(rupees)}</>
            )}
          </button>
          {phase !== "processing" && (
            <button
              onClick={() => setPhase("failed")}
              className="w-full text-center text-xs text-text-muted hover:text-danger py-1"
            >
              Simulate a failed payment
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-light flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheck size={13} /> Test mode — simulated Razorpay checkout
        </div>
      </div>
    </div>
  );
}
