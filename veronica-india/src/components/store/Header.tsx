"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, User, LogOut, ChevronDown, Shield } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { backend } from "@/lib/backend";
import { useStoreSettings } from "@/lib/use-store-settings";
import { formatPrice } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

export default function StoreHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    // Which desktop nav dropdown is open (keyed by the item href), or null.
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const cartItems = useCartStore((state) => state.items);
    const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const displayCount = isMounted ? cartCount : 0;

    const authStatus = useAuthStore((s) => s.status);
    const authUser = useAuthStore((s) => s.user);

    const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    async function handleLogout() {
        setAccountOpen(false);
        await backend.logout();
        useCartStore.getState().clearCart();
        router.push("/");
    }

    // Header nav shows the top-level categories an admin flagged "show in header",
    // each with its "show in header" subcategories nested as a dropdown. Managed
    // from Admin → Home → Navbar. The footer still lists every category.
    const { data: navbar } = useSWR("nav-categories", () => backend.getNavbar(), {
        // Revalidate when the tab regains focus so admin "Show in header" toggles
        // show up promptly after switching back from the admin panel.
        revalidateOnFocus: true,
        dedupingInterval: 15_000,
    });
    const navLinks = [
        { href: "/", label: "Home", children: [] as { href: string; label: string }[] },
        ...(navbar ?? []).map((c) => ({
            href: `/category/${c.slug}`,
            label: c.name,
            children: c.children.map((sub) => ({ href: `/category/${sub.slug}`, label: sub.name })),
        })),
        { href: "/about", label: "About", children: [] as { href: string; label: string }[] },
    ];

    // Free-delivery threshold comes from admin Settings (falls back to ₹5,000
    // while settings load), so the announcement bar always matches checkout.
    const { data: storeSettings } = useStoreSettings();
    const freeDeliveryAbove = storeSettings?.shippingFreeAbove ?? 5000;
    const announcement = `Free delivery on orders above ${formatPrice(freeDeliveryAbove)}  ·  Trusted since 2004`;

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Announcement Bar — continuously scrolling marquee. Falls back to a
                single centered line when the visitor prefers reduced motion. */}
            <div className="bg-brand-black text-white text-[11px] py-2 font-medium tracking-widest uppercase overflow-hidden">
                {/* Scrolling track — hidden when the visitor prefers reduced motion. */}
                <div className="flex w-max animate-marquee motion-reduce:hidden">
                    {/* Two identical groups so the -50%→0 loop is seamless. */}
                    {[0, 1].map((group) => (
                        <div key={group} className="flex shrink-0" aria-hidden={group === 1}>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                // Each message spans half the viewport, so at most 2 are
                                // ever visible at once.
                                <span key={i} className="min-w-[50vw] text-center px-4">
                                    {announcement}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
                {/* Static, centered fallback — only shown under reduced motion. */}
                <div className="hidden motion-reduce:block text-center px-4">
                    {announcement}
                </div>
            </div>

            {/* Main Header */}
            <header className="site-header sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-400 mx-auto px-4 h-16 flex items-center justify-between">
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
                        {navLinks.map((link) => {
                            const hasChildren = link.children.length > 0;
                            const open = openMenu === link.href;
                            return (
                                <div
                                    key={link.href}
                                    className="relative"
                                    // Open on hover/focus; close when the pointer/focus leaves the
                                    // whole item (link + menu). JS-controlled (like the account menu)
                                    // so it never depends on CSS group-hover surviving ancestor clipping.
                                    onMouseEnter={() => hasChildren && setOpenMenu(link.href)}
                                    onMouseLeave={() => hasChildren && setOpenMenu(null)}
                                    onFocus={() => hasChildren && setOpenMenu(link.href)}
                                    onBlur={(e) => {
                                        if (hasChildren && !e.currentTarget.contains(e.relatedTarget as Node)) {
                                            setOpenMenu(null);
                                        }
                                    }}
                                >
                                    <Link
                                        href={link.href}
                                        aria-haspopup={hasChildren || undefined}
                                        aria-expanded={hasChildren ? open : undefined}
                                        className={`relative flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 rounded-lg ${isActive(link.href)
                                            ? "text-brand-orange font-bold"
                                            : "text-text-secondary hover:text-brand-black hover:bg-surface-dim/60"
                                            }`}
                                    >
                                        {link.label}
                                        {hasChildren && (
                                            <ChevronDown
                                                size={13}
                                                className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                                                aria-hidden
                                            />
                                        )}
                                        {isActive(link.href) && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-orange rounded-full" />
                                        )}
                                    </Link>
                                    {hasChildren && open && (
                                        // pt-2 bridges the gap to the trigger so moving the cursor down
                                        // into the menu doesn't trip the mouseleave.
                                        <div className="absolute left-0 top-full pt-2 w-full z-50">
                                            <div className="bg-surface-card rounded-xl border border-border-light shadow-lg py-1.5">
                                                {link.children.map((sub) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        onClick={() => setOpenMenu(null)}
                                                        className={`block px-4 py-2 text-sm transition-colors duration-150 ${isActive(sub.href)
                                                            ? "text-brand-orange font-semibold bg-brand-orange-light/40"
                                                            : "text-text-secondary hover:text-brand-black hover:bg-surface-dim"
                                                            }`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-1">
                        {/* Admin shortcut — only for signed-in admins. Sits left of Search
                            (immediately after the nav). */}
                        {isMounted && authStatus === "authenticated" && authUser?.isAdmin && (
                            <Link
                                href="/admin/login"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-brand-orange font-semibold text-sm hover:bg-brand-orange/10 transition-all duration-200"
                                aria-label="Admin panel"
                            >
                                <Shield size={18} strokeWidth={2} /> <span className="hidden sm:inline">Admin</span>
                            </Link>
                        )}

                        <Link
                            href="/search"
                            className="p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200"
                            aria-label="Search"
                        >
                            <Search size={20} strokeWidth={2} />
                        </Link>

                        {/* Account / auth */}
                        {!isMounted || authStatus === "idle" || authStatus === "authenticating" ? (
                            <div className="w-9 h-9 rounded-xl bg-surface-dim animate-pulse" aria-hidden />
                        ) : authStatus === "authenticated" ? (
                            <div className="relative">
                                <button
                                    onClick={() => setAccountOpen((o) => !o)}
                                    className="flex items-center gap-1 p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200"
                                    aria-label="Account menu"
                                >
                                    <User size={20} strokeWidth={2} />
                                    <span className="hidden sm:inline text-sm font-medium max-w-[90px] truncate">
                                        {authUser?.name?.trim() || "Account"}
                                    </span>
                                    <ChevronDown size={14} className={accountOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                                </button>
                                {accountOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-border-light shadow-lg py-1 z-50">
                                            <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-dim">
                                                Account
                                            </Link>
                                            <Link href="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-dim">
                                                My Orders
                                            </Link>
                                            <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-red-50">
                                                <LogOut size={14} /> Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="p-2.5 rounded-xl text-text-secondary hover:text-brand-black hover:bg-surface-dim transition-all duration-200 flex items-center gap-1"
                                aria-label="Sign in"
                            >
                                <User size={20} strokeWidth={2} />
                                <span className="hidden sm:inline text-sm font-medium">Sign In</span>
                            </Link>
                        )}

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

                        {/* Dark mode toggle (sun/moon) — to the right of the cart */}
                        <ThemeToggle />

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
                    className={`md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl overflow-y-auto transition-all duration-300 ease-out ${isMobileMenuOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
                        }`}
                >
                    <nav className="flex flex-col p-4 gap-0.5">
                        {navLinks.map((link) => (
                            <div key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`block px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${isActive(link.href)
                                        ? "bg-brand-orange-light text-brand-orange font-bold"
                                        : "text-text-secondary hover:bg-surface-dim hover:text-brand-black"
                                        }`}
                                    onClick={closeMobileMenu}
                                >
                                    {link.label}
                                </Link>
                                {link.children.length > 0 && (
                                    <div className="ml-3 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-border/60 pl-3">
                                        {link.children.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive(sub.href)
                                                    ? "text-brand-orange font-semibold"
                                                    : "text-text-muted hover:bg-surface-dim hover:text-brand-black"
                                                    }`}
                                                onClick={closeMobileMenu}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </header>
        </>
    );
}

