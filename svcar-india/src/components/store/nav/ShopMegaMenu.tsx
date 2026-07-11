"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ShopNavNode } from "@/lib/shop-nav";
import { isCategoryPathActive } from "@/lib/shop-nav";
import { getSafeImageSrc } from "@/lib/utils";

/** A single category rendered as a photo card with subcategory chips. */
function CategoryCard({
  node,
  pathname,
  onNavigate,
}: {
  node: ShopNavNode;
  pathname: string;
  onNavigate: () => void;
}) {
  const img = getSafeImageSrc(node.image);
  const active = isCategoryPathActive(pathname, node.slug);
  const subs = node.children.slice(0, 3);
  const extra = node.children.length - subs.length;

  return (
    // No overlapping links: the photo area, the title, and each chip are
    // separate, non-overlapping <Link>s — so a chip click can never land on the
    // category link behind it. Photo + scrim are absolute (behind, z-0); the two
    // flex rows (photo-link fills the top, content sits at the bottom) sit on top.
    <div className="group relative isolate flex aspect-[5/4] flex-col overflow-hidden rounded-xl border border-white/10">
      {/* Photo (or brand-gradient fallback) */}
      {img ? (
        <Image
          src={img}
          alt={node.name}
          fill
          sizes="(max-width: 768px) 45vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/25 to-brand-black" />
      )}

      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/5" />

      {/* Upper photo area → the category page (fills the space above the title). */}
      <Link
        href={`/category/${node.slug}`}
        onClick={onNavigate}
        aria-label={node.name}
        className="relative z-10 flex-1 rounded-t-xl outline-none ring-brand-orange focus-visible:ring-2"
      />

      {/* Bottom content — title links to the category, chips to sub-categories. */}
      <div className="relative z-10 p-3.5 pt-2">
        <Link
          href={`/category/${node.slug}`}
          onClick={onNavigate}
          className={`block w-fit text-[15px] font-bold uppercase leading-tight tracking-tight transition-colors ${
            active ? "text-brand-orange" : "text-white group-hover:text-brand-orange"
          }`}
        >
          {node.name}
        </Link>

        {subs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subs.map((s) => (
              <Link
                key={s.id}
                href={`/category/${s.slug}`}
                onClick={onNavigate}
                className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-transparent hover:bg-brand-orange hover:text-white"
              >
                {s.name}
              </Link>
            ))}
            {extra > 0 && (
              <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-white/50">
                +{extra} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MegaMenuSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="aspect-[5/4] animate-pulse rounded-xl bg-white/8" />
      ))}
    </div>
  );
}

export default function ShopMegaMenu({
  open,
  tree,
  isLoading,
  isError,
  isEmpty,
  fetchWarning,
  onRetry,
  pathname,
  onNavigate,
  menuId,
}: {
  open: boolean;
  tree: ShopNavNode[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  fetchWarning?: string;
  onRetry: () => void;
  pathname: string;
  onNavigate: () => void;
  menuId: string;
}) {
  if (!open) return null;

  return (
    <div
      id={menuId}
      role="region"
      aria-label="Shop categories"
      // Anchored to the header container (inset-x-0), NOT the Shop button, so a
      // wide panel can never spill off-screen — the fix for tablet clipping.
      className="absolute inset-x-0 top-full z-50 pt-2"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl bg-brand-black shadow-xl shadow-black/40 ring-1 ring-white/10">
          {isLoading && tree.length === 0 ? (
            <MegaMenuSkeleton />
          ) : tree.length > 0 ? (
            <>
              {fetchWarning && (
                <p className="border-b border-white/8 px-5 py-2 text-[11px] text-amber-200/80">
                  Showing partial category list.
                </p>
              )}
              <div className="max-h-[min(72vh,560px)] overflow-y-auto overscroll-contain p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {tree.map((root) => (
                    <CategoryCard
                      key={root.id}
                      node={root}
                      pathname={pathname}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
              <Link
                href="/search"
                onClick={onNavigate}
                className="flex items-center justify-center gap-1.5 border-t border-white/8 px-5 py-3 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
              >
                Browse all products
                <ArrowRight size={14} />
              </Link>
            </>
          ) : isError ? (
            <div className="px-5 py-8 text-center">
              <p className="mb-1 text-sm font-medium text-white">Could not load categories</p>
              <p className="mb-4 text-[13px] text-white/50">Try again or search the catalog.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                >
                  Retry
                </button>
                <Link
                  href="/search"
                  onClick={onNavigate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
                >
                  Search products
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="px-5 py-8 text-center">
              <p className="mb-1 text-sm font-medium text-white">No categories yet</p>
              <p className="mb-4 text-[13px] text-white/50">Browse products or check back soon.</p>
              <Link
                href="/search"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
              >
                Search products
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
