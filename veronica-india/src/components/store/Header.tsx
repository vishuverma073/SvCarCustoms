"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";

export default function StoreHeader() {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    const cartItems = useCartStore((state) => state.items);
    const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const displayCount = isMounted ? cartCount : 0;

    const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/category/kitchen-sinks", label: "Kitchen Sinks" },
        { href: "/category/health-faucet-sets", label: "Health Faucets" },
        { href: "/category/bathroom-accessories", label: "Bathroom" },
        { href: "/category/plumbing-fittings", label: "Plumbing & Fittings" },
        { href: "/about", label: "About" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Announcement Bar */}
            <div className="bg-brand-black text-white text-center text-[11px] py-2 px-4 font-medium tracking-widest uppercase">
                Free delivery on orders above ₹5,000 &nbsp;·&nbsp; Trusted since 2004
            </div>

            {/* Main Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image
                            src="/uploads/logo/logo.webp"
                            alt="Veronica"
                            width={36}
                            height={36}
                            className="rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="text-lg font-extrabold tracking-tight text-brand-black leading-none">
                                VERONICA
                            </span>
                            <span className="text-[9px] font-medium tracking-[0.2em] text-text-muted uppercase leading-none mt-0.5">
                                Premium Sanitary
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${isActive(link.href)
                                    ? "text-brand-orange font-bold"
                                    : "text-text-secondary hover:text-brand-black hover:bg-surface-dim/60"
                                    }`}
                            >
                                {link.label}
                                {isActive(link.href) && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-orange rounded-full" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-1">
                        {/* <Link
                            href="/search"
                            className="p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200"
                            aria-label="Search"
                        >
                            <Search size={20} strokeWidth={2} />
                        </Link> */}

                        <Link
                            href="/cart"
                            className="p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200 relative"
                            aria-label="Cart"
                        >
                            <ShoppingBag size={20} strokeWidth={2} />
                            {displayCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-orange text-white text-[10px] font-bold leading-none px-1 shadow-sm animate-scale-in">
                                    {displayCount > 99 ? "99+" : displayCount}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200"
                            onClick={toggleMobileMenu}
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                >
                    <nav className="flex flex-col p-4 gap-0.5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${isActive(link.href)
                                    ? "bg-brand-orange-light text-brand-orange font-bold"
                                    : "text-text-secondary hover:bg-surface-dim hover:text-brand-black"
                                    }`}
                                onClick={closeMobileMenu}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>
        </>
    );
}

