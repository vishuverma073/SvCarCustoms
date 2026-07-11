import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Wallet, Handshake, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import StoreLocationMap from "@/components/store/StoreLocationMap";

export const metadata: Metadata = {
    title: "About Us — SV Car Customs",
    description: "SV Car Customs is India's destination for car customisation — body kits, lighting, audio upgrades and custom interiors & exteriors. Founded by Shivam Verma, based in New Delhi.",
};

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-14">
            {/* Hero */}
            <div className="text-center mb-16 animate-slide-up">
                <span className="badge badge-bestseller mb-5">Style. Performance. Quality.</span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight leading-tight">
                    About{" "}
                    <span className="bg-gradient-to-r from-brand-orange to-amber-400 bg-clip-text text-transparent">
                        SV Car Customs
                    </span>
                </h1>
                <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    SV Car Customs is India&rsquo;s destination for car customisation —
                    from body kits, spoilers and ambient lighting to audio upgrades and
                    custom interiors & exteriors. Founded by Shivam Verma and based in
                    New Delhi, we deliver the best car accessories to doorsteps across India.
                </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 stagger-children">
                {[
                    {
                        icon: Sparkles,
                        title: "Quality First",
                        desc: "Every accessory and custom part is quality-checked before it reaches you.",
                    },
                    {
                        icon: Wallet,
                        title: "Honest Pricing",
                        desc: "Fair, transparent pricing on car accessories and customisation kits — no hidden markups.",
                    },
                    {
                        icon: Handshake,
                        title: "Customer Commitment",
                        desc: "From fitment guidance to installation tips, we're here to help at every step.",
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
                    { value: "Pan-India", label: "Delivery" },
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
                                href="mailto:shivam187100@gmail.com"
                                className="text-sm text-white/70 hover:text-brand-orange transition-colors flex items-center gap-2"
                            >
                                <Mail size={15} className="shrink-0" />
                                shivam187100@gmail.com
                            </a>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Phone
                            </h4>
                            <a
                                href="tel:+919205005425"
                                className="text-sm text-white/70 hover:text-brand-orange transition-colors flex items-center gap-2"
                            >
                                <Phone size={15} className="shrink-0" />
                                +91 92050 05425
                            </a>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                                Address
                            </h4>
                            <p className="text-sm text-white/70 flex items-start gap-2">
                                <MapPin size={15} className="mt-0.5 shrink-0" />
                                <span>
                                    Shop no.2, Ground Floor, Plot no. 734-A,
                                    <br />
                                    Opposite CISF Camp, Delhi NCR, 110061
                                </span>
                            </p>
                        </div>
                        <Link
                            href="https://wa.me/919205005425"
                            target="_blank"
                            className="btn bg-whatsapp text-white inline-flex hover:shadow-lg transition-all duration-300"
                        >
                            <MessageCircle size={16} />
                            Chat on WhatsApp
                        </Link>
                    </div>
                    <div>
                        <StoreLocationMap />
                    </div>
                </div>
            </div>
        </div>
    );
}
