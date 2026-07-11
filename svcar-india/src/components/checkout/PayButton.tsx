"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { MOCK_PAYMENTS } from "@/lib/api-config";
import { backend } from "@/lib/backend";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { submitPayuForm, type PayuHandoff } from "@/lib/payu";
import MockPayuModal from "./MockPayuModal";

// [Razorpay disabled — PayU-only project] This project uses PayU exclusively.
// The Razorpay modal flow (loadRazorpay + MockRazorpayModal + client-side
// /checkout/verify) has been removed from this component. See git history to
// restore Razorpay support if ever needed.

const WHATSAPP_HELP = "https://wa.me/919205005425?text=" +
  encodeURIComponent("Hi, I had trouble paying for my order on the SV Car Customs website.");

interface PayButtonProps {
  addressId: number | null;
  amount: number; // rupees, for the button label
  notes?: string;
  disabled?: boolean;
}

export default function PayButton({ addressId, amount, notes, disabled }: PayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payuMock, setPayuMock] = useState<{ handoff: PayuHandoff; orderNumber: string } | null>(null);

  /** PayU confirms payment via the gateway callback (not a client verify call),
   *  so on success we just clear the cart and route to the confirmation page. */
  function onPayuPaid(orderNumber: string) {
    useCartStore.getState().clearCart();
    setPayuMock(null);
    router.push(`/orders/${orderNumber}?just=paid`);
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

    // PayU: redirect the browser to PayU's hosted page (or the mock page in dev).
    if (res.provider !== "payu" || !res.payu) {
      setLoading(false);
      setError("Couldn’t start checkout. Please try again.");
      return;
    }
    if (MOCK_PAYMENTS) {
      setPayuMock({ handoff: res.payu, orderNumber: res.orderNumber });
      return;
    }
    submitPayuForm(res.payu); // full-page navigation away to PayU
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
        <ShieldCheck size={13} /> Secure payment via PayU
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

      {MOCK_PAYMENTS && (
        <MockPayuModal
          handoff={payuMock?.handoff ?? null}
          onSuccess={() => payuMock && onPayuPaid(payuMock.orderNumber)}
          onDismiss={() => {
            setPayuMock(null);
            setLoading(false);
          }}
        />
      )}
    </>
  );
}
