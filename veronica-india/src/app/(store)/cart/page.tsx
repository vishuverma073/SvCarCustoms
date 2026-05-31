"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, generateWhatsAppUrl } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

const PHONE = "9350529717";

export default function CartPage() {
    const [mounted, setMounted] = useState(false);

    const items = useCartStore((s) => s.items);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQty = useCartStore((s) => s.updateQty);
    const clearCart = useCartStore((s) => s.clearCart);

    useEffect(() => {
        setMounted(true);
    }, []);

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const whatsAppUrl = generateWhatsAppUrl(
        PHONE,
        items.map((item) => ({
            name: item.name,
            qty: item.qty,
            price: item.price * item.qty,
        })),
        total
    );

    // SSR placeholder
    if (!mounted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={36} className="text-text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-text-secondary text-sm">Loading your cart...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={36} className="text-text-muted" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-extrabold text-text-primary mb-2 tracking-tight">
                    Your cart is empty
                </h1>
                <p className="text-text-secondary mb-8 text-sm">
                    Browse our collection and add some products.
                </p>
                <Link href="/" className="btn btn-primary">
                    Continue Shopping
                    <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-extrabold text-text-primary tracking-tight">
                    Your Cart
                    <span className="text-text-muted font-semibold text-sm ml-2">
                        ({items.length} {items.length === 1 ? "item" : "items"})
                    </span>
                </h1>
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand-orange transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Continue Shopping</span>
                    <span className="sm:hidden">Shop</span>
                </Link>
            </div>

            <div className="space-y-3 mb-6">
                {items.map((item) => (
                    <div
                        key={item.cartKey}
                        className="flex gap-3 p-3 sm:p-4 bg-surface-card rounded-2xl border border-border-light hover:border-border transition-colors duration-200"
                    >
                        <Link
                            href={`/product/${item.slug}`}
                            className="w-18 h-18 sm:w-20 sm:h-20 bg-surface-dim rounded-xl overflow-hidden shrink-0 border border-border-light"
                        >
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="object-contain w-full h-full p-2"
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/product/${item.slug}`}
                                className="text-sm font-semibold text-text-primary line-clamp-2 hover:text-brand-orange transition-colors"
                            >
                                {item.name}
                            </Link>
                            {item.variant && (
                                <p className="text-xs text-text-secondary mt-0.5">
                                    {item.variant}
                                </p>
                            )}
                            <p className="text-sm font-bold text-text-primary mt-1">
                                {formatPrice(item.price)}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => updateQty(item.cartKey, item.qty - 1)}
                                        className="px-2.5 py-1.5 text-text-secondary hover:bg-surface-dim transition-colors active:bg-surface-dim"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="px-3 py-1.5 text-sm font-bold border-x border-border min-w-[36px] text-center">
                                        {item.qty}
                                    </span>
                                    <button
                                        onClick={() => updateQty(item.cartKey, item.qty + 1)}
                                        className="px-2.5 py-1.5 text-text-secondary hover:bg-surface-dim transition-colors active:bg-surface-dim"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(item.cartKey)}
                                    className="text-text-muted hover:text-danger transition-colors p-1"
                                >
                                    <Trash2 size={15} />
                                </button>
                                <span className="ml-auto text-sm font-bold text-text-primary">
                                    {formatPrice(item.price * item.qty)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Summary */}
            <div className="bg-surface-card rounded-2xl p-5 sm:p-6 mb-6 border border-border-light">
                <h2 className="text-base font-bold text-text-primary mb-4 tracking-tight">
                    Order Summary
                </h2>
                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Subtotal</span>
                        <span className="font-semibold">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Delivery</span>
                        <span className={`font-semibold ${total >= 5000 ? "text-success" : ""}`}>
                            {total >= 5000 ? "Free" : "₹200"}
                        </span>
                    </div>
                    <div className="border-t border-border-light pt-2.5 mt-2.5 flex justify-between">
                        <span className="font-bold text-base">Total</span>
                        <span className="font-extrabold text-lg text-text-primary">
                            {formatPrice(total < 5000 ? total + 200 : total)}
                        </span>
                    </div>
                </div>
                {total < 5000 && (
                    <p className="text-xs text-text-muted mt-3 bg-brand-orange-light px-3 py-2 rounded-lg">
                        💡 Add {formatPrice(5000 - total)} more for <span className="font-semibold text-brand-orange">free delivery</span>!
                    </p>
                )}
            </div>

            {/* CTA */}
            <Link
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full py-4 text-[15px] font-bold bg-whatsapp text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order on WhatsApp
            </Link>

            <p className="text-center text-xs text-text-muted mt-4">
                Your order details will be sent to our WhatsApp for confirmation.
            </p>
        </div>
    );
}
