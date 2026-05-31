import { create } from "zustand";

interface UIState {
    isMobileMenuOpen: boolean;
    isSearchOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleSearch: () => void;
    closeSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    isSearchOpen: false,

    toggleMobileMenu: () => set((state) => ({
        isMobileMenuOpen: !state.isMobileMenuOpen,
        // Close search if opening menu to prevent overlapping overlays
        isSearchOpen: !state.isMobileMenuOpen ? false : state.isSearchOpen
    })),

    closeMobileMenu: () => set({ isMobileMenuOpen: false }),

    toggleSearch: () => set((state) => ({
        isSearchOpen: !state.isSearchOpen,
        // Close mobile menu if opening search
        isMobileMenuOpen: !state.isSearchOpen ? false : state.isMobileMenuOpen
    })),

    closeSearch: () => set({ isSearchOpen: false }),
}));
