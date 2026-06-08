import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
    title: "Privacy Policy — Veronica India",
    description:
        "How Veronica India collects, uses, and protects your personal information when you shop with us.",
    alternates: { canonical: absoluteUrl("/privacy") },
};

const UPDATED = "1 June 2026";

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-14">
            <header className="mb-10">
                <span className="badge badge-bestseller mb-4">Legal</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                    Privacy Policy
                </h1>
                <p className="text-sm text-text-muted">Last updated: {UPDATED}</p>
            </header>

            <div className="space-y-8 text-[15px] text-text-secondary leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-orange [&_a:hover]:underline">
                <section>
                    <p>
                        Veronica India (&ldquo;Veronica&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This
                        policy explains what information we collect when you visit
                        veronicaindia.com or place an order, how we use it, and the choices you
                        have. By using our website you agree to the practices described here.
                    </p>
                </section>

                <section>
                    <h2>Information we collect</h2>
                    <ul>
                        <li><strong>Contact &amp; account details</strong> — your name, phone number, email and the address(es) you add for delivery.</li>
                        <li><strong>Order information</strong> — the products you buy, order totals and your order history.</li>
                        <li><strong>Payment information</strong> — payments are processed by our payment partner Razorpay. We never see or store your full card, UPI or bank credentials; we only receive a confirmation that a payment succeeded.</li>
                        <li><strong>Technical data</strong> — basic device and usage information (e.g. pages visited) collected to keep the site secure and working well.</li>
                    </ul>
                </section>

                <section>
                    <h2>How we use your information</h2>
                    <ul>
                        <li>To process and deliver your orders and send order-status updates (including SMS with a tracking link).</li>
                        <li>To provide customer support and respond to your queries.</li>
                        <li>To operate, secure and improve our website.</li>
                        <li>To meet legal, tax and accounting obligations.</li>
                    </ul>
                </section>

                <section>
                    <h2>Sharing your information</h2>
                    <p>
                        We do not sell your personal information. We share it only with service
                        providers who help us run the store — our payment processor (Razorpay),
                        SMS/email providers for order notifications, and delivery partners to
                        fulfil your order — and only to the extent needed to provide that
                        service. We may also disclose information where required by law.
                    </p>
                </section>

                <section>
                    <h2>Data retention &amp; security</h2>
                    <p>
                        We keep order records for as long as needed to provide our service and
                        to comply with legal and tax requirements. We use reasonable technical
                        and organisational measures to protect your data; access tokens are
                        short-lived and sensitive credentials are never exposed to your browser.
                    </p>
                </section>

                <section>
                    <h2>Your rights</h2>
                    <p>
                        You can ask us to access, correct or delete your personal information,
                        or update your saved details from your account. To make a request,
                        contact us using the details below.
                    </p>
                </section>

                <section>
                    <h2>Contact</h2>
                    <p>
                        Questions about this policy? Email{" "}
                        <a href="mailto:veronicasanitarygoods@gmail.com">veronicasanitarygoods@gmail.com</a>{" "}
                        or call <a href="tel:+919350529717">+91 93505 29717</a>. See our{" "}
                        <a href="/contact">Contact page</a> for more ways to reach us.
                    </p>
                </section>
            </div>
        </div>
    );
}
