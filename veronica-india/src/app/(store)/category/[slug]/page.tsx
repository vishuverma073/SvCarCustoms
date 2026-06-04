import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { backend } from "@/lib/backend";
import type { CategoryWithBreadcrumb } from "@veronica/contracts";
import Breadcrumb from "@/components/store/Breadcrumb";
import SectionHeader from "@/components/store/SectionHeader";
import CategoryProductGrid from "@/components/store/CategoryProductGrid";
import { ProductCarouselSkeleton } from "@/components/store/Skeletons";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const category = await backend.getCategoryBySlug(slug);
        return { title: `${category.name} — Veronica India`, description: category.description };
    } catch {
        return {};
    }
}

async function CategoryProductsSection({ slug }: { slug: string }) {
    // listProducts(category) returns the full subtree — for a leaf that's just
    // its own products, matching the old direct-category behaviour.
    // NOTE: the public /products endpoint hard-caps `limit` at 50, so requesting
    // more than that 400s. Cap at 50 (the backend max for this endpoint).
    const items = await backend.getProductsByCategory(slug, 50);
    const products = items.map((p) => ({
        slug: p.slug,
        name: p.name,
        image: p.image,
        minPrice: p.minPrice,
        maxBasePrice: p.maxBasePrice,
        discount: p.bestDiscount,
        isBestseller: p.isBestseller,
        isNew: p.isNew,
    }));

    if (products.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <Package size={28} strokeWidth={1.5} />
                </div>
                <p className="text-text-secondary font-medium mb-1">No products found</p>
                <p className="text-sm text-text-muted mb-6">Check back soon for new arrivals in this category.</p>
                <Link href="/" className="btn btn-primary">Back to Home</Link>
            </div>
        );
    }

    return <CategoryProductGrid products={products} />;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    let category: CategoryWithBreadcrumb;
    try {
        category = await backend.getCategoryBySlug(slug);
    } catch {
        notFound();
    }

    const breadcrumb = category.breadcrumb; // root → … → self
    const isRootNode = category.parentId === null;
    const parentCategory = isRootNode ? category : breadcrumb[breadcrumb.length - 2];

    // Sibling pills = the parent's children (one extra fetch only for sub-pages), alphabetical.
    const displaySubCategories = [
        ...(isRootNode
            ? category.children
            : (await backend.getCategoryBySlug(parentCategory.slug)).children),
    ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    const hasSubCategories = displaySubCategories.length > 0;

    // Sidebar + mobile tabs list every category, alphabetically (matching the header nav).
    const allRootCategories = (await backend.getCategories()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    const breadcrumbItems = breadcrumb.map((cat, i) => ({
        label: cat.name,
        ...(i < breadcrumb.length - 1 ? { href: `/category/${cat.slug}` } : {}),
    }));

    return (
        <div className="max-w-380 mx-auto px-4 py-8">
            <Breadcrumb items={breadcrumbItems} className="mb-8" />

            <div className="flex gap-10">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-56 shrink-0">
                    <div className="sticky top-24">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
                            Categories
                        </h3>
                        <nav className="space-y-1">
                            {allRootCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${cat.slug === slug || breadcrumb.some((a) => a.id === cat.id)
                                        ? "bg-brand-orange text-white shadow-sm"
                                        : "text-text-secondary hover:bg-surface-dim hover:text-brand-black"
                                        }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <SectionHeader title={category.name} subtitle={category.description} />

                    {/* Mobile Category Tabs */}
                    <div className="lg:hidden flex gap-4 overflow-x-auto scroll-x-hidden border-b border-border-light mb-6">
                        {allRootCategories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/category/${cat.slug}`}
                                className={`category-tab ${cat.slug === slug || breadcrumb.some((a) => a.id === cat.id) ? "active" : ""}`}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    {/* Subcategory Pills */}
                    {hasSubCategories && (
                        <div className="flex gap-2 overflow-x-auto scroll-x-hidden pb-4 mb-6">
                            <Link
                                href={`/category/${parentCategory.slug}`}
                                className={`subcat-pill ${category.id === parentCategory.id ? "active" : ""}`}
                            >
                                All
                            </Link>
                            {displaySubCategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/category/${sub.slug}`}
                                    className={`subcat-pill ${category.id === sub.id ? "active" : ""}`}
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Product Grid */}
                    <Suspense
                        fallback={
                            <div className="mt-8">
                                <ProductCarouselSkeleton columns={3} />
                            </div>
                        }
                    >
                        <CategoryProductsSection slug={slug} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
