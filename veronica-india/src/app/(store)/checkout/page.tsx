"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ChevronLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/lib/backend";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { computeTotals } from "@/lib/checkout";
import { useStoreSettings } from "@/lib/use-store-settings";
import { formatPrice } from "@/lib/utils";
import type { Address, ServerCartItem } from "@veronica/contracts";
import AddressList from "@/components/checkout/AddressList";
import AddressForm from "@/components/checkout/AddressForm";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import PayButton from "@/components/checkout/PayButton";

export default function CheckoutPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const { data: settings, error: settingsError } = useStoreSettings();

  const [items, setItems] = useState<ServerCartItem[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<Address | undefined>(undefined);

  // Redirect guests once auth resolves.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?returnTo=/checkout");
  }, [status, router]);

  const loadAddresses = useCallback(async () => {
    const list = await backend.listAddresses();
    setAddresses(list);
    setSelectedId((prev) => prev ?? list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
    setMode(list.length === 0 ? "form" : "list");
    return list;
  }, []);

  // Initial load. To keep the page snappy we DON'T block on a single Promise.all:
  //  1) paint instantly from the local (persisted) cart,
  //  2) reconcile against the authoritative server cart, and
  //  3) load addresses independently — a slow /me/addresses call must not stall
  //     the whole page behind a spinner.
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;

    // 1) Instant paint from the local cart so there's no blank spinner.
    const local = useCartStore.getState().items;
    if (local.length > 0) {
      setItems((cur) =>
        cur ??
        local.map((i, idx) => ({
          id: i.serverId ?? -(idx + 1),
          skuId: i.id,
          name: i.name,
          slug: i.slug,
          price: i.price,
          image: i.image,
          variant: i.variant,
          qty: i.qty,
        })),
      );
    }

    // 2) Reconcile the local cart → server FIRST (pushes any quantities the
    //    shopper changed that hadn't synced yet), then read the authoritative
    //    server cart. The order is built server-side from this cart, so it must
    //    match what the shopper sees — otherwise they'd be charged the wrong qty.
    useCartStore
      .getState()
      .syncWithServer()
      .then(() => backend.getCart())
      .then((cart) => {
        if (!active) return;
        if (cart.items.length === 0 && useCartStore.getState().items.length === 0) {
          toast.info("Your cart is empty.");
          router.replace("/cart");
          return;
        }
        if (cart.items.length > 0) setItems(cart.items);
      })
      .catch(() => {
        if (active && useCartStore.getState().items.length === 0) {
          toast.error("Couldn’t load your cart. Please retry.");
        }
      });

    // 3) Saved addresses (independent of the cart).
    backend
      .listAddresses()
      .then((list) => {
        if (!active) return;
        setAddresses(list);
        setSelectedId((prev) => prev ?? list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
        setMode(list.length === 0 ? "form" : "list");
      })
      .catch(() => {
        if (active) {
          setAddresses([]);
          setMode("form");
        }
      });

    return () => {
      active = false;
    };
  }, [status, router]);

  async function handleSaved(addr: Address) {
    const list = await loadAddresses();
    setSelectedId(list.find((a) => a.id === addr.id)?.id ?? addr.id);
    setMode("list");
    setEditing(undefined);
  }

  async function handleDelete(addr: Address) {
    if (!confirm(`Delete the address for ${addr.fullName}?`)) return;
    try {
      await backend.removeAddress(addr.id);
      const list = await loadAddresses();
      if (selectedId === addr.id) {
        setSelectedId(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
      }
      toast.success("Address removed");
    } catch {
      toast.error("Couldn’t delete the address");
    }
  }

  // Render as soon as we have the cart (seeded from local storage, so this is
  // near-instant). We also wait for store settings so the shipping/total are
  // computed with the live values from the first paint (no ₹99→real flicker);
  // if settings fail to load we proceed with the fallback constants.
  if (status !== "authenticated" || items === null || (!settings && !settingsError)) {
    return (
      <div className="flex items-center justify-center py-32 text-text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const totals = computeTotals(items, settings);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange mb-5"
      >
        <ChevronLeft size={15} /> Back to cart
      </Link>
      <h1 className="text-2xl font-extrabold text-text-primary tracking-tight mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: address + items */}
        <div className="lg:col-span-7 space-y-8">
          {/* Address */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-secondary mb-3">
              <MapPin size={15} /> Shipping address
            </h2>
            <div className="bg-white rounded-2xl border border-border-light shadow-card p-4">
              {addresses === null ? (
                <div className="flex items-center justify-center py-8 text-text-muted">
                  <Loader2 className="animate-spin" size={18} />
                </div>
              ) : mode === "form" ? (
                <AddressForm
                  initial={editing}
                  onSaved={handleSaved}
                  onCancel={addresses.length > 0 ? () => { setMode("list"); setEditing(undefined); } : undefined}
                />
              ) : (
                <AddressList
                  addresses={addresses}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onEdit={(a) => { setEditing(a); setMode("form"); }}
                  onDelete={handleDelete}
                  onAddNew={() => { setEditing(undefined); setMode("form"); }}
                />
              )}
            </div>
          </section>

          {/* Items recap */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
                Items ({items.reduce((n, i) => n + i.qty, 0)})
              </h2>
              <Link href="/cart" className="text-xs font-medium text-brand-orange hover:underline">
                Edit cart
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-border-light shadow-card divide-y divide-border-light">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3.5">
                  <div className="w-16 h-16 bg-surface-dim rounded-xl overflow-hidden shrink-0 border border-border-light">
                    <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain w-full h-full p-1.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary line-clamp-2">{item.name}</p>
                    {item.variant && <p className="text-xs text-text-secondary mt-0.5">{item.variant}</p>}
                    <p className="text-xs text-text-muted mt-1">Qty {item.qty}</p>
                  </div>
                  <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: sticky summary */}
        <div className="lg:col-span-5">
          <div className="bg-surface-card rounded-2xl border border-border-light p-5 lg:sticky lg:top-24">
            <h2 className="text-base font-bold text-text-primary mb-4 tracking-tight">Order Summary</h2>
            <CheckoutSummary totals={totals} settings={settings} />
            <div className="mt-5">
              <PayButton addressId={mode === "list" ? selectedId : null} amount={totals.total} />
              {mode === "list" && !selectedId && (
                <p className="text-[11px] text-text-muted text-center mt-2">Select an address to continue.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
