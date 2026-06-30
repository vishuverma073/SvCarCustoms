"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { backend } from "@/lib/backend";
import { buildCategoryTree } from "@/lib/category-tree";
import { getShopBrowseHref } from "@/lib/shop-nav";
import type { Category, Product, ProductListItem } from "@svcar/contracts";
import ProductPageClient from "@/components/store/ProductPageClient";
import { ProductPageSkeleton } from "@/components/store/Skeletons";

type LoadState =
  | { status: "loading" }
  | { status: "notfound" }
  | {
      status: "ok";
      product: Product;
      category: (Category & { breadcrumb?: Category[] }) | null;
      shopHref: string;
      related: ProductListItem[];
      breadcrumbItems: { label: string; href?: string }[];
    };

/**
 * Client-side product fetcher used as a fallback in MOCKS mode only.
 *
 * The PDP is server-rendered, so it reads the *node* MSW store — but products
 * created in the admin are written to the *browser* MSW store (separate memory).
 * When the server render can't find a product under mocks, we re-fetch on the
 * client (where admin-created products live) instead of 404ing. With a real
 * backend this path is never used.
 */
export default function ProductClientLoader({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const product = await backend.getProductBySlug(slug);
        const [category, allCategories] = await Promise.all([
          backend
            .getCategoryById(product.categoryId)
            .catch(() => null) as Promise<(Category & { breadcrumb?: Category[] }) | null>,
          backend.getAllCategories().catch(() => [] as Category[]),
        ]);
        const shopHref = getShopBrowseHref(buildCategoryTree(allCategories));
        const related = category
          ? (await backend.getProductsByCategory(category.slug).catch(() => []))
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
          : [];
        const breadcrumbItems = [
          ...(category?.breadcrumb ?? []).map((cat) => ({
            label: cat.name,
            href: `/category/${cat.slug}`,
          })),
          { label: product.name },
        ];
        if (active) setState({ status: "ok", product, category, shopHref, related, breadcrumbItems });
      } catch {
        if (active) setState({ status: "notfound" });
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === "loading") return <ProductPageSkeleton />;

  if (state.status === "notfound") {
    return (
      <div className="max-w-380 mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-text-primary">Product not found</h1>
        <p className="mt-2 text-text-secondary">
          This product doesn&rsquo;t exist or may have been removed.
        </p>
        <Link href="/search" className="btn btn-primary mx-auto mt-6 rounded-full px-6 py-3">
          Search products
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <ProductPageClient
      product={state.product}
      categoryName={state.category?.name}
      categorySlug={state.category?.slug}
      breadcrumbItems={state.breadcrumbItems}
      shopHref={state.shopHref}
      relatedProducts={state.related}
    />
  );
}
