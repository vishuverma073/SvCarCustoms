"use client";

import { usePathname } from "next/navigation";
import { adminNav, isNavActive } from "./nav-items";
import { useAdminAuthStore } from "@/store/adminAuthStore";

/** Page title (derived from the active nav item) + the admin avatar. */
export default function TopBar() {
  const pathname = usePathname();
  const admin = useAdminAuthStore((s) => s.admin);
  const active = adminNav.find((i) => isNavActive(i.href, pathname));
  const title = active?.label ?? "Admin";
  const initial = (admin?.name ?? "A").charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-border h-14 px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Mobile brand (sidebar is hidden) */}
      <div className="lg:hidden flex items-center gap-1.5">
        <span className="text-brand-orange font-extrabold">V</span>
        <span className="font-bold text-sm tracking-wide">ERONICA</span>
      </div>
      <h1 className="hidden lg:block text-base font-semibold text-text-primary">{title}</h1>

      <div
        className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm font-bold"
        title={admin?.email}
      >
        {initial}
      </div>
    </header>
  );
}
