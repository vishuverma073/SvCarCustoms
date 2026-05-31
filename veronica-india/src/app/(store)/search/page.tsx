"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { backend } from "@/lib/backend";
import { ProductGridSkeleton } from "@/components/store/Skeletons";
import { Search, ChevronRight, SearchX, Package } from "lucide-react";

interface SearchResult {
    id: number;
    name: string;
    slug: string;
    minPrice: number;
    maxBasePrice: number;
    discount: number;
    image: string;
}

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const items = await backend.searchProducts(q);
            setResults(
                items.map((p) => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    minPrice: p.minPrice,
                    maxBasePrice: p.maxBasePrice,
                    discount: p.bestDiscount,
                    image: p.image,
                })),
            );
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Search Input */}
            <div className="relative mb-10">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-14 pr-5 py-4 text-base rounded-2xl bg-surface-card border border-border-light shadow-card focus:border-brand-orange focus:shadow-lg focus:bg-white transition-all duration-300 outline-none font-medium"
                    autoFocus
                />
            </div>

            {/* Results */}
            {loading && (
                <div className="py-4">
                    <ProductGridSkeleton count={6} />
                </div>
            )}

            {!loading && query && results.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <SearchX size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-text-secondary font-medium mb-1">
                        No results found
                    </p>
                    <p className="text-sm text-text-muted">
                        Try searching for &quot;sink&quot;, &quot;faucet&quot;, or &quot;shower&quot;
                    </p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                        {results.length} result{results.length > 1 ? "s" : ""}
                    </p>
                    {results.map((item) => (
                        <Link
                            key={item.id}
                            href={`/product/${item.slug}`}
                            className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-surface-dim transition-all duration-200 group border border-transparent hover:border-border-light"
                        >
                            <div className="w-16 h-16 bg-surface-dim rounded-xl overflow-hidden shrink-0 border border-border-light group-hover:border-border transition-colors">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="object-contain w-full h-full p-1.5"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-brand-orange transition-colors">
                                    {item.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-bold text-text-primary">
                                        {item.minPrice < item.maxBasePrice ? "From " : ""}
                                        {formatPrice(item.minPrice)}
                                    </span>
                                    {item.discount > 0 && (
                                        <span className="text-xs text-text-muted line-through">
                                            {formatPrice(item.maxBasePrice)}
                                        </span>
                                    )}
                                    {item.discount > 0 && (
                                        <span className="text-xs font-semibold text-success">
                                            {item.discount}% off
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:text-brand-orange transition-colors" />
                        </Link>
                    ))}
                </div>
            )}

            {/* Popular Categories (when no query) */}
            {!query && (
                <div className="animate-fade-in">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-5">
                        Popular Categories
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { slug: "kitchen-sinks", name: "Kitchen Sinks", icon: Package },
                            { slug: "health-faucet-sets", name: "Health Faucets", icon: Package },
                            { slug: "bathroom-accessories", name: "Bathroom Accessories", icon: Package },
                            { slug: "plumbing-fittings", name: "Plumbing & Fittings", icon: Package },
                        ].map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface-card border border-border-light hover:border-border hover:shadow-card transition-all duration-200 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-brand-orange-light flex items-center justify-center text-brand-orange">
                                    <cat.icon size={18} strokeWidth={1.8} />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-orange transition-colors">
                                        {cat.name}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Trending Searches */}
                    <div className="mt-8">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
                            Trending Searches
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {["Kitchen Sink", "Health Faucet", "Floor Drain", "Braided Pipe", "Wash Basin Coupling", "Shower Tube"].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => setQuery(term)}
                                    className="px-4 py-2 text-sm font-medium rounded-full bg-surface-dim text-text-secondary hover:bg-brand-orange-light hover:text-brand-orange transition-all duration-200 cursor-pointer"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Browse All */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/category/kitchen-sinks"
                            className="btn btn-secondary inline-flex"
                        >
                            Browse All Products
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
