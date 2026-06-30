"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Store, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNav, isNavActive } from "./nav-items";

/** Desktop sidebar (hidden < lg). Brand-black with orange active state. */
export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 admin-sidebar flex-col">
      {/* h-14 matches the TopBar height so the two bottom borders align. */}
      <div className="h-14 px-5 flex items-center border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/uploads/logo/logo-v2.webp" alt="SV Car Customs" width={30} height={30} className="rounded-lg" />
          <span className="text-white/50 text-[11px] font-semibold tracking-[0.2em] uppercase">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("admin-nav-item", isNavActive(item.href, pathname) && "active")}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/" className="admin-nav-item text-white/40 hover:text-white">
          <Store size={18} strokeWidth={2} />
          View Store
        </Link>
        <button
          onClick={onLogout}
          className="admin-nav-item text-white/40 hover:text-red-400 w-full"
        >
          <LogOut size={18} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}
