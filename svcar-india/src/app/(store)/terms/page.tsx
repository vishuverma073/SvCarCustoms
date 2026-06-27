import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — SV Car Customs",
  description: "Terms and conditions for shopping on SV Car Customs.",
  alternates: { canonical: absoluteUrl("/terms") },
};

const UPDATED = "7 June 2026";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <header className="mb-10">
        <span className="badge badge-bestseller mb-4">Legal</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-text-muted">Last updated: {UPDATED}</p>
      </header>

      <div className="space-y-8 text-[15px] text-text-secondary leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        <section>
          <p>
            By using svcarcustoms.com and placing an order, you agree to these terms. If you do
            not agree, please do not use the site.
          </p>
        </section>

        <section>
          <h2>Orders &amp; pricing</h2>
          <ul>
            <li>All prices are in Indian Rupees (INR) and include applicable GST unless stated otherwise.</li>
            <li>We may correct pricing errors before an order is confirmed.</li>
            <li>An order is confirmed only after successful payment (or as agreed for approved offline payments).</li>
          </ul>
        </section>

        <section>
          <h2>Products &amp; fitment</h2>
          <p>
            We describe products as accurately as possible. Colours and finishes may vary slightly
            from photos due to screen settings or manufacturing batches. Fitment details (make,
            model, variant and year) are listed on each product page — it is your responsibility
            to confirm compatibility with your vehicle before purchase. Body kits, splitters,
            diffusers, exhausts and other custom-fit parts may require professional installation;
            we are not responsible for damage caused by incorrect fitment or installation.
          </p>
        </section>

        <section>
          <h2>Account &amp; communication</h2>
          <p>
            You are responsible for the accuracy of your contact details and delivery address.
            We may send order updates by SMS, WhatsApp, or email.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            To the extent permitted by law, SV Car Customs is not liable for indirect or
            consequential loss arising from use of the site or delayed delivery beyond our control.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:support@svcarcustoms.com" className="text-brand-orange hover:underline">
              support@svcarcustoms.com
            </a>{" "}
            or call +91 93505 29717.
          </p>
        </section>
      </div>
    </div>
  );
}
