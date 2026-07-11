import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ — SV Car Customs",
  description: "Frequently asked questions about orders, delivery, returns, and products.",
  alternates: { canonical: absoluteUrl("/faq") },
};

const FAQ = [
  {
    q: "How do I know a part will fit my car?",
    a: "Always check fitment before you buy. Each product lists the makes, models and year ranges it suits. If you're unsure, WhatsApp us your car's make, model, variant and year and our team will confirm compatibility before you order.",
  },
  {
    q: "Do you provide installation?",
    a: "Most accessories — ambient lights, spoilers, paddle shifters, audio upgrades and lighting — are designed for straightforward fitment. Larger body kits, front splitters, rear diffusers and exhausts are best installed by a professional. We share fitment notes with every order; for custom kits, reach out and we'll guide you.",
  },
  {
    q: "How do I place an order?",
    a: "Browse our accessories, add items to your cart, and checkout with your delivery address. Pay securely via UPI, card, or other methods supported at checkout.",
  },
  {
    q: "When will my order arrive?",
    a: "Most orders ship within 1–2 business days. Delivery time depends on your location and the courier; bulky items like body kits and exhausts may take a little longer. Track progress from My Orders once signed in.",
  },
  {
    q: "What are your shipping charges?",
    a: "Shipping fees and free-delivery thresholds are shown at checkout and on the cart page. We deliver pan-India. Large or heavy items may carry additional handling — see our Shipping page for full details.",
  },
  {
    q: "Can I return a product?",
    a: "Yes — eligible, unused items in original packaging can be returned within our return window. Installed parts and custom-fit or made-to-order items can't be returned unless they arrived defective. See the Refund & Return Policy for full conditions.",
  },
  {
    q: "Do products come with a warranty?",
    a: "Manufacturer warranty, where applicable, is listed on the product page. Warranty does not cover damage from incorrect installation or use beyond the part's intended fitment.",
  },
  {
    q: "Are prices inclusive of GST?",
    a: "Yes. Prices on the site include applicable GST (28% on most auto parts). Your invoice breakdown is shown at checkout.",
  },
  {
    q: "How do I contact support?",
    a: "Call +91 92050 05425, email shivam187100@gmail.com, or use the Contact page / WhatsApp link on any product page.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <header className="mb-10">
        <span className="badge badge-bestseller mb-4">Help</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-text-muted">
          Quick answers — or{" "}
          <Link href="/contact" className="text-brand-orange hover:underline">
            get in touch
          </Link>
          .
        </p>
      </header>

      <div className="space-y-6">
        {FAQ.map(({ q, a }) => (
          <section
            key={q}
            className="bg-white rounded-xl border border-border-light shadow-sm p-5"
          >
            <h2 className="text-base font-bold text-text-primary mb-2">{q}</h2>
            <p className="text-[15px] text-text-secondary leading-relaxed">{a}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-text-muted text-center">
        <Link href="/shipping" className="text-brand-orange hover:underline">
          Shipping
        </Link>
        {" · "}
        <Link href="/refund" className="text-brand-orange hover:underline">
          Returns
        </Link>
        {" · "}
        <Link href="/terms" className="text-brand-orange hover:underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
