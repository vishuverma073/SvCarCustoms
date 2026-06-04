"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { backend } from "@/lib/backend";

function formatPhone(phone: string): string {
  const m = phone.replace(/^\+91/, "");
  return m.length === 10 ? `+91 ${m.slice(0, 5)} ${m.slice(5)}` : phone;
}

export default function AccountPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  // Redirect guests to login once auth has resolved.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?returnTo=/account");
    }
  }, [status, router]);

  // Seed the form from the user.
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  async function save() {
    if (!user) return;
    const prev = user;
    // Optimistic: reflect instantly in the header + form, persist in the
    // background so the button never sits on a spinner waiting for the network.
    useAuthStore.getState().setUser({ ...user, name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    try {
      const updated = await backend.updateMe({ name, email });
      useAuthStore.getState().setUser(updated);
    } catch {
      useAuthStore.getState().setUser(prev); // revert on failure
      setSaved(false);
      toast.error("Couldn’t save your profile. Please try again.");
    }
  }

  async function logout() {
    await backend.logout();
    useCartStore.getState().clearCart();
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-black mb-6">My Account</h1>

      <div className="bg-white rounded-2xl border border-border-light shadow-card p-5 space-y-4">
        <div>
          <label className="input-label">Phone</label>
          <p className="text-sm font-semibold text-text-primary">{formatPhone(user.phone)}</p>
        </div>

        <div>
          <label className="input-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
        </div>

        <div>
          <label className="input-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <button onClick={save} className="btn btn-primary text-sm">
          {saved ? <><Check size={16} /> Saved</> : "Save changes"}
        </button>
      </div>

      <Link
        href="/orders"
        className="mt-4 flex items-center justify-between bg-white rounded-2xl border border-border-light shadow-card p-5 hover:border-border transition-colors"
      >
        <span className="text-sm font-semibold text-text-primary">My Orders</span>
        <ChevronRight size={18} className="text-text-muted" />
      </Link>

      <button
        onClick={logout}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-danger py-3 hover:underline"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
