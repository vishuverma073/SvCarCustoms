import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
    title: "Contact Us — Veronica India",
    description:
        "Get in touch with Veronica India — email, phone, WhatsApp, store address and business hours.",
    alternates: { canonical: absoluteUrl("/contact") },
};

const EMAIL = "veronicasanitarygoods@gmail.com";
const PHONE_DISPLAY = "+91 93505 29717";
const PHONE_TEL = "+919350529717";
const WHATSAPP = "919350529717";

export default function ContactPage() {
    // Minimal Organization/ContactPoint structured data so search engines can
    // surface the business contact details.
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Veronica India",
        url: absoluteUrl("/"),
        email: EMAIL,
        telephone: PHONE_TEL,
        address: {
            "@type": "PostalAddress",
            streetAddress: "Plot 734, Bijwasan - Palam Vihar Rd",
            addressLocality: "New Delhi",
            postalCode: "110061",
            addressCountry: "IN",
        },
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-14">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="text-center mb-12">
                <span className="badge badge-bestseller mb-4">We&rsquo;re here to help</span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
                    Contact{" "}
                    <span className="bg-gradient-to-r from-brand-orange to-amber-400 bg-clip-text text-transparent">
                        Us
                    </span>
                </h1>
                <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    Questions about a product, an order, or delivery? Reach out and our team
                    will get back to you quickly.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <a
                    href={`mailto:${EMAIL}`}
                    className="p-6 rounded-2xl bg-surface-card border border-border-light hover:border-border hover:shadow-card transition-all duration-300 text-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-brand-orange-light flex items-center justify-center mx-auto mb-3 text-brand-orange">
                        <Mail size={22} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-1">Email</h3>
                    <p className="text-[13px] text-text-secondary break-words">{EMAIL}</p>
                </a>
                <a
                    href={`tel:${PHONE_TEL}`}
                    className="p-6 rounded-2xl bg-surface-card border border-border-light hover:border-border hover:shadow-card transition-all duration-300 text-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-brand-orange-light flex items-center justify-center mx-auto mb-3 text-brand-orange">
                        <Phone size={22} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-1">Phone</h3>
                    <p className="text-[13px] text-text-secondary">{PHONE_DISPLAY}</p>
                </a>
                <Link
                    href={`https://wa.me/${WHATSAPP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 rounded-2xl bg-surface-card border border-border-light hover:border-border hover:shadow-card transition-all duration-300 text-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-whatsapp/10 flex items-center justify-center mx-auto mb-3 text-whatsapp">
                        <MessageCircle size={22} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-1">WhatsApp</h3>
                    <p className="text-[13px] text-text-secondary">Chat with us</p>
                </Link>
            </div>

            <div className="bg-brand-black rounded-2xl p-8 md:p-10 text-white">
                <h2 className="text-xl font-extrabold mb-8 tracking-tight">Visit or write to us</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Address
                            </h4>
                            <p className="text-sm text-white/70 flex items-start gap-2">
                                <MapPin size={15} className="mt-0.5 shrink-0" />
                                <span>
                                    Plot 734, Bijwasan - Palam Vihar Rd,
                                    <br />
                                    New Delhi, 110061
                                </span>
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Business hours
                            </h4>
                            <p className="text-sm text-white/70 flex items-start gap-2">
                                <Clock size={15} className="mt-0.5 shrink-0" />
                                <span>
                                    Monday&ndash;Saturday: 10:00 AM &ndash; 7:00 PM
                                    <br />
                                    Sunday: Closed
                                </span>
                            </p>
                        </div>
                        <Link
                            href={`https://wa.me/${WHATSAPP}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn bg-whatsapp text-white inline-flex hover:shadow-lg transition-all duration-300"
                        >
                            <MessageCircle size={16} />
                            Chat on WhatsApp
                        </Link>
                    </div>
                    <div>
                        <iframe
                            title="Veronica India location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.2!2d77.058!3d28.536!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1b0e3e5a8edb%3A0x7e45f2d7e0b5e30d!2sBijwasan%2C%20New%20Delhi%2C%20Delhi%20110061!5e0!3m2!1sen!2sin!4v1"
                            width="100%"
                            height="280"
                            className="rounded-2xl border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
