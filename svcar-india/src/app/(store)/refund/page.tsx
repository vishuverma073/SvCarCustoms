import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
    title: "Refund & Return Policy — SV Car Customs",
    description:
        "Our return window, eligibility, and how refunds are processed for orders placed on SV Car Customs.",
    alternates: { canonical: absoluteUrl("/refund") },
};

const UPDATED = "1 June 2026";

export default function RefundPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-14">
            <header className="mb-10">
                <span className="badge badge-bestseller mb-4">Legal</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                    Refund &amp; Return Policy
                </h1>
                <p className="text-sm text-text-muted">Last updated: {UPDATED}</p>
            </header>

            <div className="space-y-8 text-[15px] text-text-secondary leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-orange [&_a:hover]:underline">
                <section>
                    <p>
                        We want you to be happy with your purchase. If something isn&rsquo;t
                        right, here&rsquo;s how returns and refunds work.
                    </p>
                </section>

                <section>
                    <h2>Return window</h2>
                    <p>
                        You may request a return within <strong>7 days</strong> of delivery for
                        most products. To be eligible, the item must be unused, in its original
                        condition and packaging, with all tags and accessories included.
                    </p>
                </section>

                <section>
                    <h2>Non-returnable items</h2>
                    <ul>
                        <li>Parts that have been installed, fitted, used or damaged after delivery.</li>
                        <li>Custom-fit, made-to-order or customised items — such as body kits, custom interiors and custom exteriors — unless they arrived defective.</li>
                        <li>Products returned without their original packaging or accessories.</li>
                        <li>Items returned without a prior fitment check that turn out to be incompatible with your vehicle.</li>
                    </ul>
                </section>

                <section>
                    <h2>Damaged or wrong items</h2>
                    <p>
                        If your order arrives damaged, defective, or you received the wrong
                        product, contact us within <strong>48 hours</strong> of delivery with
                        your order number and photos. We&rsquo;ll arrange a replacement or a full
                        refund at no extra cost to you.
                    </p>
                </section>

                <section>
                    <h2>How to request a return</h2>
                    <ul>
                        <li>Email <a href="mailto:shivam187100@gmail.com">shivam187100@gmail.com</a> or message us on <a href="https://wa.me/919205005425" target="_blank" rel="noopener noreferrer">WhatsApp</a> with your order number and reason.</li>
                        <li>We&rsquo;ll confirm eligibility and arrange a pickup or share return instructions.</li>
                        <li>Once we receive and inspect the item, we&rsquo;ll process your refund.</li>
                    </ul>
                </section>

                <section>
                    <h2>Refunds</h2>
                    <p>
                        Approved refunds are issued to your original payment method through our
                        payment partner Razorpay. After we receive the returned item, refunds
                        are typically processed within <strong>5&ndash;7 business days</strong>;
                        the time for the amount to reflect in your account depends on your bank
                        or card issuer. Prices on our site are inclusive of GST, and the refund
                        covers the price you paid for the returned item. Shipping fees are
                        non-refundable except where the return is due to our error.
                    </p>
                </section>

                <section>
                    <h2>Order cancellations</h2>
                    <p>
                        You can cancel an order before it has been shipped for a full refund.
                        Once shipped, the standard return process above applies.
                    </p>
                </section>

                <section>
                    <h2>Need help?</h2>
                    <p>
                        Reach us at{" "}
                        <a href="mailto:shivam187100@gmail.com">shivam187100@gmail.com</a>{" "}
                        or <a href="tel:+919205005425">+91 92050 05425</a>. See our{" "}
                        <a href="/contact">Contact page</a> for hours and address.
                    </p>
                </section>
            </div>
        </div>
    );
}
