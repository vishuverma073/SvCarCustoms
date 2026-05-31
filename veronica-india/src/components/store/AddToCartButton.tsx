"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/store/cartStore";

interface AddToCartButtonProps {
    product: {
        id: number;
        name: string;
        slug: string;
        price: number;
        image: string;
        variant?: string;
    };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
    const [justAdded, setJustAdded] = useState(false);
    const [mounted, setMounted] = useState(false);

    const items = useCartStore((s) => s.items);
    const addItem = useCartStore((s) => s.addItem);
    const updateQty = useCartStore((s) => s.updateQty);

    const cartKey = useMemo(
        () => product.variant ? `${product.id}-${product.variant}` : `${product.id}`,
        [product.id, product.variant]
    );

    const cartItem = useMemo(
        () => items.find((i) => i.cartKey === cartKey),
        [items, cartKey]
    );

    const inCart = !!cartItem;
    const qty = cartItem?.qty ?? 1;

    // Input state for quantity editing
    const [inputValue, setInputValue] = useState(String(qty));

    useEffect(() => {
        setMounted(true);
    }, []);

    // Keep input in sync when cart updates externally
    useEffect(() => {
        if (cartItem) {
            setInputValue(String(cartItem.qty));
        }
    }, [cartItem?.qty, cartItem]);

    const handleAddToCart = () => {
        addItem(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
    };

    const handleUpdateQty = () => {
        const parsed = parseInt(inputValue, 10);
        const newQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        setInputValue(String(newQty));
        updateQty(cartKey, newQty);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 800);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleUpdateQty();
            (e.target as HTMLInputElement).blur();
        }
    };

    // SSR-safe: show add button during hydration
    if (!mounted) {
        return (
            <button className="pdp-atc-btn" disabled>
                <ShoppingBag size={18} strokeWidth={1.8} /> Add to Cart
            </button>
        );
    }

    // In-cart state: quantity editor
    if (inCart && !justAdded) {
        return (
            <div className="pdp-qty-row">
                <label className="pdp-qty-label" htmlFor="pdp-qty-input">Qty</label>
                <input
                    id="pdp-qty-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={handleKeyDown}
                    onBlur={handleUpdateQty}
                    className="pdp-qty-input"
                />
                <button onClick={handleUpdateQty} className="pdp-qty-update">
                    Update Cart
                </button>
            </div>
        );
    }

    // Add to cart / just-added state
    return (
        <button
            onClick={handleAddToCart}
            disabled={justAdded}
            className={`pdp-atc-btn ${justAdded ? "success" : ""}`}
        >
            {justAdded ? (
                <><Check size={18} strokeWidth={2.5} /> Added</>
            ) : (
                <><ShoppingBag size={18} strokeWidth={1.8} /> Add to Cart</>
            )}
        </button>
    );
}
