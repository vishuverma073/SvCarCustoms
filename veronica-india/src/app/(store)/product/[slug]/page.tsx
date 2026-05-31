import { notFound } from "next/navigation";
import { Suspense } from "react";
import { backend } from "@/lib/backend";
import type { Product } from "@veronica/contracts";
import ProductPageClient from "@/components/store/ProductPageClient";
import { ProductPageSkeleton } from "@/components/store/Skeletons";

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

async function ProductDetailsFetcher({ slug }: { slug: string }) {
    let product: Product;
    try {
        product = await backend.getProductBySlug(slug);
    } catch {
        notFound();
    }

    const category = await backend.getCategoryById(product.categoryId).catch(() => null);

    // Related products from the same category subtree (excluding this one).
    const relatedProducts = category
        ? (await backend.getProductsByCategory(category.slug))
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

    return (
        <ProductPageClient
            product={product}
            categoryName={category?.name}
            categorySlug={category?.slug}
            breadcrumbItems={breadcrumbItems}
            relatedProducts={relatedProducts}
        />
    );
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;

    return (
        <Suspense fallback={<ProductPageSkeleton />}>
            <ProductDetailsFetcher slug={slug} />
        </Suspense>
    );
}
