"use client";

import { useState } from "react";
import { X, Lock, Smartphone, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PayuHandoff } from "@/lib/payu";

/**
 * A stand-in for PayU's hosted payment page, used in mock mode (the real flow
 * redirects the whole browser to test.payu.in). On "Pay" it POSTs a simulated
 * success result to the same `surl` callback the real PayU would hit — the API
 * accepts the `mock_*` hash under the dev-auth bypass, marks the order paid, and
 * we then route to the confirmation page. "Simulate failure" leaves the order
 * pending so the customer can retry, mirroring a real failed payment.
 */
export default function MockPayuModal({
  handoff,
  onSuccess,
  onDismiss,
}: {
  handoff: PayuHandoff | null;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [phase, setPhase] = useState<"idle" | "processing" | "failed">("idle");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("success@payu");

  if (!handoff) return null;
  const p = handoff.params;
  const rupees = Number(p.amount || "0");

  const upiUri =
    `upi://pay?pa=svcar@payu&pn=${encodeURIComponent("SV Car Customs")}` +
    `&am=${rupees}&cu=INR&tn=${encodeURIComponent(p.productinfo ?? "SV Car Customs order")}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(upiUri)}`;

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardValid = cardDigits.length === 16 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length === 3;
  const upiValid = /.+@.+/.test(upiId.trim());
  const canPay = phase !== "processing" && (method === "card" ? cardValid : upiValid);

  /** POST a simulated result to PayU's callback URL, then continue. */
  async function postResult(status: "success" | "failure") {
    const rand = Math.random().toString(36).slice(2, 14);
    const body = new URLSearchParams({
      txnid: p.txnid ?? "",
      amount: p.amount ?? "",
      productinfo: p.productinfo ?? "",
      firstname: p.firstname ?? "",
      email: p.email ?? "",
      udf1: p.udf1 ?? "",
      status,
      mihpayid: `mock_${rand}`,
      hash: `mock_${rand}`,
    });
    try {
      await fetch(p.surl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        // The callback is unauthenticated (authed by hash) — no credentials.
      });
    } catch {
      /* mock-only: ignore network/redirect quirks and continue */
    }
  }

  async function succeed() {
    if (!canPay) return;
    setPhase("processing");
    await postResult("success");
    onSuccess();
  }

  async function fail() {
    setPhase("failed");
    await postResult("failure");
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center">
              <Lock size={16} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">SV Car Customs</p>
              <p className="text-[11px] text-text-muted leading-tight">{p.productinfo}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-surface-dim" aria-label="Close payment">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="px-5 py-4 bg-surface-dim/40 flex items-baseline justify-between">
          <span className="text-sm text-text-secondary">Amount payable</span>
          <span className="text-xl font-extrabold text-text-primary">{formatPrice(rupees)}</span>
        </div>

        {phase === "failed" && (
          <p className="mx-5 mt-4 text-sm text-danger font-medium bg-red-50 rounded-lg px-3 py-2">
            Payment failed. Close this and retry from your order.
          </p>
        )}

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
            </div>
          )}
        </div>

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
              onClick={fail}
              className="w-full text-center text-xs text-text-muted hover:text-danger py-1"
            >
              Simulate a failed payment
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border-light flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheck size={13} /> Test mode — simulated PayU checkout
        </div>
      </div>
    </div>
  );
}
