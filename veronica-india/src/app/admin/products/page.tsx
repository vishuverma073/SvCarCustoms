"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Package } from "lucide-react";
import { useProducts, useCategories } from "@/lib/admin-hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { formatPrice, cn } from "@/lib/utils";
import StatusPill from "@/components/admin/StatusPill";
import type { ProductListParams } from "@/lib/admin-api";

type StatusFilter = "" | "active" | "draft" | "archived";
type FlagFilter = "" | "bestseller" | "new" | "featured";

const STATUS_CHIPS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const FLAG_CHIPS: { label: string; value: FlagFilter }[] = [
  { label: "Any", value: "" },
  { label: "Bestseller", value: "bestseller" },
  { label: "New", value: "new" },
  { label: "Featured", value: "featured" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[34px]",
        active
          ? "bg-brand-orange text-white shadow-sm"
          : "bg-white text-text-secondary border border-border hover:border-brand-orange/50",
      )}
    >
      {children}
    </button>
  );
}

export default function ProductsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [flag, setFlag] = useState<FlagFilter>("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const params = useMemo<ProductListParams>(
    () => ({
      q: debouncedSearch || undefined,
      status: status || undefined,
      flag: flag || undefined,
    }),
    [debouncedSearch, status, flag],
  );

  const { data: products, isLoading, error } = useProducts(params);
  const { data: categories } = useCategories();
  const [category, setCategory] = useState("");

  // Category options: roots then their subcategories (indented). Products carry
  // their category NAME on the admin list, so we filter by name.
  const categoryOptions = useMemo(() => {
    const cats = categories ?? [];
    const roots = cats.filter((c) => c.parentId === null).sort((a, b) => a.name.localeCompare(b.name));
    const out: { id: number; name: string; label: string }[] = [];
    for (const r of roots) {
      out.push({ id: r.id, name: r.name, label: r.name });
      cats
        .filter((c) => c.parentId === r.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((ch) => out.push({ id: ch.id, name: ch.name, label: `— ${ch.name}` }));
    }
    return out;
  }, [categories]);

  // Category filter is applied client-side over the loaded list (by category name).
  const filtered = useMemo(
    () => (category ? (products ?? []).filter((p) => p.categoryName === category) : products),
    [products, category],
  );

  // When a category is filtered, pre-fill it on the "new product" page.
  const selectedCatId = categoryOptions.find((c) => c.name === category)?.id;
  const newProductHref = selectedCatId
    ? `/admin/products/new?category=${selectedCatId}`
    : "/admin/products/new";

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">Products</h1>
        <Link href={newProductHref} className="hidden lg:inline-flex btn btn-primary text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or tags…"
          // `!pl-10` wins over the `.input` padding shorthand (unlayered CSS
          // otherwise beats the Tailwind utility) so the search icon never
          // overlaps the placeholder/text.
          className="input pl-10!"
          type="search"
        />
      </div>

      {/* Filter chips */}
      <div className="space-y-2 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_CHIPS.map((c) => (
            <Chip key={c.value} active={status === c.value} onClick={() => setStatus(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FLAG_CHIPS.map((c) => (
            <Chip key={c.value} active={flag === c.value} onClick={() => setFlag(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
        {/* Category filter — manage products one category at a time. */}
        {categoryOptions.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            // Match the filter chips: same pill shape + height, width fits content.
            className={cn(
              "rounded-full text-xs font-semibold min-h-[34px] px-3 py-1.5 cursor-pointer w-auto max-w-[240px] transition-colors",
              category
                ? "bg-brand-orange text-white border border-brand-orange"
                : "bg-white text-text-secondary border border-border hover:border-brand-orange/50",
            )}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.name}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {error ? (
        <p className="py-16 text-center text-sm text-danger">Failed to load products.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl h-48 animate-pulse border border-border-light"
            />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}/edit`}
              className="group bg-white rounded-xl border border-border-light shadow-sm overflow-hidden hover:shadow-md hover:border-border transition-all"
            >
              <div className="aspect-square bg-surface-dim relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="w-full h-full object-contain p-3" />
                {p.bestDiscount > 0 && (
                  <span className="absolute top-2 left-2 badge badge-discount">
                    -{p.bestDiscount}%
                  </span>
                )}
                <span className="absolute top-2 right-2">
                  <StatusPill status={p.status} />
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-text-primary line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-text-primary">
                    {formatPrice(p.minPrice)}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {p.skuCount} SKU{p.skuCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {p.isBestseller && <span className="badge badge-bestseller">Best</span>}
                  {p.isNew && <span className="badge badge-new">New</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
          <Package size={32} />
          <p className="text-sm">No products match your filters.</p>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/admin/products/new"
        className="lg:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Add product"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
