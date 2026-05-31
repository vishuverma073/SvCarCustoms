"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNav, isNavActive } from "./nav-items";

/** Desktop sidebar (hidden < lg). Brand-black with orange active state. */
export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 admin-sidebar flex-col">
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-brand-orange font-extrabold text-lg">V</span>
          <span className="text-white font-bold text-sm tracking-wide">ERONICA</span>
          <span className="text-white/40 text-xs ml-1">Admin</span>
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
