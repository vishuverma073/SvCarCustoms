"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { MOCK_PAYMENTS } from "@/lib/api-config";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { loadRazorpay, type RazorpayOptions, type RazorpayResponse } from "@/lib/razorpay";
import MockRazorpayModal from "./MockRazorpayModal";

const WHATSAPP_HELP = "https://wa.me/919350529717?text=" +
  encodeURIComponent("Hi, I had trouble paying for my order on the SV Car Customs website.");

interface PayButtonProps {
  addressId: number | null;
  amount: number; // rupees, for the button label
  notes?: string;
  disabled?: boolean;
}

export default function PayButton({ addressId, amount, notes, disabled }: PayButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOptions, setMockOptions] = useState<RazorpayOptions | null>(null);

  async function onPaid(resp: RazorpayResponse) {
    try {
      const order = await backend.verifyOrder({
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        razorpaySignature: resp.razorpay_signature,
      });
      // Clear the local cart too, in case the user has the storefront open elsewhere.
      useCartStore.getState().clearCart();
      setMockOptions(null);
      router.push(`/orders/${order.orderNumber}?just=paid`);
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

  async function pay() {
    if (!addressId) return;
    setLoading(true);
    setError("");

    let res;
    try {
      res = await backend.createOrder({ addressId, notes });
    } catch {
      setLoading(false);
      setError("Couldn’t start checkout. Please try again.");
      return;
    }

    const options: RazorpayOptions = {
      key: res.razorpayKeyId,
      amount: Math.round(res.amount * 100), // paise
      currency: "INR",
      order_id: res.razorpayOrderId,
      name: "SV Car Customs",
      description: `Order ${res.orderNumber}`,
      image: "/uploads/logo/logo-v2.webp",
      prefill: {
        contact: user?.phone?.replace(/^\+91/, "") ?? "",
        email: user?.email ?? "",
        name: user?.name ?? "",
      },
      theme: { color: "#E8822A" },
      handler: onPaid,
      modal: { ondismiss: onDismiss },
    };

    if (MOCK_PAYMENTS) {
      setMockOptions(options); // open the simulated modal (loading stays true beneath it)
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
        onClick={pay}
        disabled={disabled || loading || !addressId}
        className="btn btn-primary w-full py-3.5 text-[15px] disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processing…</>
        ) : (
          <>Pay {formatPrice(amount)}</>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted mt-2">
        <ShieldCheck size={13} /> Secure payment via Razorpay
      </p>

      {error && (
        <div className="mt-3 text-sm text-danger bg-red-50 rounded-xl px-3 py-2.5">
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
