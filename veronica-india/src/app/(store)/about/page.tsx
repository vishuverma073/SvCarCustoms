import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Wallet, Handshake, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us — Veronica India",
    description: "For over two decades, Veronica has been synonymous with quality, durability, and reliability in home improvement and sanitary solutions. Based in New Delhi.",
};

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-14">
            {/* Hero */}
            <div className="text-center mb-16 animate-slide-up">
                <span className="badge badge-bestseller mb-5">Since 2004</span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight leading-tight">
                    About{" "}
                    <span className="bg-gradient-to-r from-brand-orange to-amber-400 bg-clip-text text-transparent">
                        Veronica
                    </span>
                </h1>
                <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    For over two decades, Veronica has been synonymous with quality,
                    durability, and reliability in home improvement and sanitary solutions.
                    Based in New Delhi, we serve thousands of customers across India.
                </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 stagger-children">
                {[
                    {
                        icon: Sparkles,
                        title: "Quality First",
                        desc: "Every product undergoes rigorous quality testing before it reaches you.",
                    },
                    {
                        icon: Wallet,
                        title: "Honest Pricing",
                        desc: "Factory-direct pricing with no middlemen. You pay for quality, not markups.",
                    },
                    {
                        icon: Handshake,
                        title: "Customer Commitment",
                        desc: "From selection to installation, we're here to help at every step.",
                    },
                ].map((value) => (
                    <div
                        key={value.title}
                        className="text-center p-8 rounded-2xl bg-surface-card border border-border-light hover:border-border hover:shadow-card transition-all duration-300 animate-fade-in"
                        style={{ opacity: 0 }}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-brand-orange-light flex items-center justify-center mx-auto mb-4 text-brand-orange">
                            <value.icon size={26} strokeWidth={1.8} />
                        </div>
                        <h3 className="text-base font-bold text-text-primary mb-2">
                            {value.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{value.desc}</p>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-16">
                {[
                    { value: "20+", label: "Years Experience" },
                    { value: "10K+", label: "Happy Customers" },
                    { value: "500+", label: "Products" },
                ].map((stat) => (
                    <div key={stat.label} className="text-center py-8 rounded-2xl bg-surface-dim">
                        <div className="text-3xl md:text-4xl font-extrabold text-brand-orange tracking-tight mb-1">
                            {stat.value}
                        </div>
                        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact */}
            <div className="bg-brand-black rounded-2xl p-8 md:p-10 text-white">
                <h2 className="text-xl font-extrabold mb-8 tracking-tight">Get in Touch</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Email
                            </h4>
                            <a
                                href="mailto:veronicasanitarygoods@gmail.com"
                                className="text-sm text-white/70 hover:text-brand-orange transition-colors flex items-center gap-2"
                            >
                                <Mail size={15} className="shrink-0" />
                                veronicasanitarygoods@gmail.com
                            </a>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Phone
                            </h4>
                            <a
                                href="tel:+919350529717"
                                className="text-sm text-white/70 hover:text-brand-orange transition-colors flex items-center gap-2"
                            >
                                <Phone size={15} className="shrink-0" />
                                +91 93505 29717
                            </a>
                        </div>
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
                        <Link
                            href="https://wa.me/919350529717"
                            target="_blank"
                            className="btn bg-whatsapp text-white inline-flex hover:shadow-lg transition-all duration-300"
                        >
                            <MessageCircle size={16} />
                            Chat on WhatsApp
                        </Link>
                    </div>
                    <div>
                        <iframe
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
