"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { backend } from "@/lib/backend";

export default function AccountPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

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
    useAuthStore.getState().setUser({ ...user, name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    try {
      const updated = await backend.updateMe({ name });
      useAuthStore.getState().setUser(updated);
    } catch {
      useAuthStore.getState().setUser(prev); // revert on failure
      setSaved(false);
      toast.error("Couldn’t save your profile. Please try again.");
    }
  }

  async function savePassword() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    try {
      await backend.setPassword(password);
      setPassword("");
      toast.success("Password saved. You can now sign in with it.");
    } catch {
      toast.error("Couldn’t save your password. Please try again.");
    } finally {
      setPwSaving(false);
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
          <label className="input-label">Email</label>
          <p className="text-sm font-semibold text-text-primary">{user.email}</p>
        </div>

        <div>
          <label className="input-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
        </div>

        <button onClick={save} className="btn btn-primary text-sm">
          {saved ? <><Check size={16} /> Saved</> : "Save changes"}
        </button>
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-border-light shadow-card p-5 space-y-3">
        <div>
          <label className="input-label">{user.hasPassword ? "Change password" : "Set a password"}</label>
          <p className="text-xs text-text-muted mb-2">
            {user.hasPassword
              ? "Update the password you use to sign in."
              : "Add a password so you can sign in without an OTP each time."}
          </p>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="input"
          />
        </div>
        <button
          onClick={savePassword}
          disabled={pwSaving || password.length < 6}
          className="btn btn-primary text-sm disabled:opacity-50"
        >
          {pwSaving ? <Loader2 size={16} className="animate-spin" /> : user.hasPassword ? "Update password" : "Set password"}
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
