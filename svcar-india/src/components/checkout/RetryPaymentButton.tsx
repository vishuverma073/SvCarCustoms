"use client";

import { useState } from "react";
import { Loader2, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";
import { MOCK_PAYMENTS } from "@/lib/api-config";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { loadRazorpay, type RazorpayOptions, type RazorpayResponse } from "@/lib/razorpay";
import MockRazorpayModal from "./MockRazorpayModal";

const WHATSAPP_HELP =
  "https://wa.me/919350529717?text=" +
  encodeURIComponent("Hi, I had trouble paying for my order on the SV Car Customs website.");

/**
 * Re-initiate payment for an existing unpaid order (the previous attempt failed
 * or was dismissed). Reuses the same Razorpay flow as checkout; on success the
 * order is verified/confirmed and `onPaid` is called to refresh the view.
 */
export default function RetryPaymentButton({
  orderNumber,
  amount,
  onPaid,
}: {
  orderNumber: string;
  amount: number;
  onPaid: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOptions, setMockOptions] = useState<RazorpayOptions | null>(null);

  async function handlePaid(resp: RazorpayResponse) {
    try {
      await backend.verifyOrder({
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        razorpaySignature: resp.razorpay_signature,
      });
      setMockOptions(null);
      onPaid();
    } catch {
      setMockOptions(null);
      setLoading(false);
      setError(
        "We couldn’t confirm your payment. If money was deducted it’ll be reconciled shortly — or reach us on WhatsApp.",
      );
    }
  }

  function onDismiss() {
    setMockOptions(null);
    setLoading(false);
  }

  async function retry() {
    setLoading(true);
    setError("");
    let res;
    try {
      res = await backend.retryPayment(orderNumber);
    } catch {
      setLoading(false);
      setError("Couldn’t start the payment. Please try again.");
      return;
    }

    const options: RazorpayOptions = {
      key: res.razorpayKeyId,
      amount: Math.round(res.amount * 100), // paise
      currency: "INR",
      order_id: res.razorpayOrderId,
      name: "SV Car Customs",
      description: `Order ${res.orderNumber}`,
      image: "/uploads/logo/logo.webp",
      prefill: {
        contact: user?.phone?.replace(/^\+91/, "") ?? "",
        email: user?.email ?? "",
        name: user?.name ?? "",
      },
      theme: { color: "#E8822A" },
      handler: handlePaid,
      modal: { ondismiss: onDismiss },
    };

    if (MOCK_PAYMENTS) {
      setMockOptions(options);
      return;
    }

    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setLoading(false);
      setError("The payment window couldn’t load. Allow pop-ups and retry, or order on WhatsApp.");
      return;
    }
    new window.Razorpay(options).open();
  }

  return (
    <>
      <button
        onClick={retry}
        disabled={loading}
        className="btn btn-primary w-full py-3 text-sm disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing…</>
        ) : (
          <><RefreshCw size={15} /> Retry payment · {formatPrice(amount)}</>
        )}
      </button>
      {error && (
        <div className="mt-2 text-sm text-danger bg-red-50 rounded-xl px-3 py-2.5">
          <p>{error}</p>
          <Link
            href={WHATSAPP_HELP}
            target="_blank"
            className="mt-1.5 inline-flex items-center gap-1.5 text-whatsapp font-medium hover:underline"
          >
            <MessageCircle size={14} /> Chat with us on WhatsApp
          </Link>
        </div>
      )}
      {MOCK_PAYMENTS && <MockRazorpayModal options={mockOptions} />}
    </>
  );
}
