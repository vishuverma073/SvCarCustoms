import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    id: number;
    cartKey: string; // unique key: "id" or "id-variant"
    name: string;
    slug: string;
    price: number;
    image: string;
    variant?: string;
    qty: number;
}

interface CartState {
    items: CartItem[];

    // Actions
    addItem: (item: Omit<CartItem, "qty" | "cartKey"> & { variant?: string }) => void;
    removeItem: (cartKey: string) => void;
    updateQty: (cartKey: string, qty: number) => void;
    clearCart: () => void;

    // Computed
    totalItems: () => number;
    totalAmount: () => number;
}

function makeCartKey(id: number, variant?: string): string {
    return variant ? `${id}-${variant}` : `${id}`;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => set((state) => {
                const cartKey = makeCartKey(item.id, item.variant);
                const existing = state.items.find(i => i.cartKey === cartKey);

                if (existing) {
                    return {
                        items: state.items.map(i =>
                            i.cartKey === cartKey
                                ? { ...i, qty: i.qty + 1 }
                                : i
                        ),
                    };
                }

                return {
                    items: [...state.items, { ...item, cartKey, qty: 1 }],
                };
            }),

            removeItem: (cartKey) => set((state) => ({
                items: state.items.filter(i => i.cartKey !== cartKey),
            })),

            updateQty: (cartKey, qty) => set((state) => {
                if (qty <= 0) {
                    return { items: state.items.filter(i => i.cartKey !== cartKey) };
                }
                return {
                    items: state.items.map(i =>
                        i.cartKey === cartKey ? { ...i, qty } : i
                    ),
                };
            }),

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
            totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
        }),
        {
            name: "veronica-cart",
        }
    )
);
