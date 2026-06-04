"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import ThemeToggle from "@/components/store/ThemeToggle";

/**
 * Admin top bar. The brand is a single logo image — shown here only on mobile
 * (the sidebar carries it on desktop), so there's never two logos at once. The
 * right side holds the dark-mode toggle, then the admin avatar.
 */
export default function TopBar() {
  const admin = useAdminAuthStore((s) => s.admin);
  const initial = (admin?.name ?? "A").charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-border h-14 px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Brand (logo only) — mobile only; the sidebar shows it on desktop. */}
      <Link href="/admin" className="lg:hidden flex items-center">
        <Image src="/uploads/logo/logo.webp" alt="Veronica" width={30} height={30} className="rounded-lg" />
      </Link>
      <span className="hidden lg:block" aria-hidden />

      {/* Right: dark-mode toggle, then the admin avatar. */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div
          className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm font-bold"
          title={admin?.email}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
