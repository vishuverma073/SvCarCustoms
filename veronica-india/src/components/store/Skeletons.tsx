export function CategoryCardSkeleton() {
    return (
        <div className="category-card aspect-square skeleton relative overflow-hidden flex flex-col justify-end p-5">
            <div className="w-12 h-5 skeleton bg-white/20 mb-2 rounded" />
            <div className="w-32 h-6 skeleton bg-white/20 rounded-md" />
        </div>
    );
}

export function CategoryGridSkeleton() {
    return (
        <>
            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden flex gap-3 overflow-x-hidden pb-2 opacity-70">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="shrink-0 w-[72vw]">
                        <CategoryCardSkeleton />
                    </div>
                ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-4 gap-4 opacity-70">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                        <CategoryCardSkeleton />
                    </div>
                ))}
            </div>
        </>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="card h-full flex flex-col skeleton-container bg-surface-card border border-border-light relative overflow-hidden">
            {/* Image Skeleton */}
            <div className="relative aspect-square skeleton w-full rounded-b-none" />

            {/* Content Skeleton */}
            <div className="p-4 md:p-5 flex flex-col flex-1">
                {/* Title */}
                <div className="h-5 skeleton w-3/4 mb-3 rounded" />

                {/* Price block */}
                <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                        <div className="h-4 skeleton w-12 mb-1 rounded" />
                        <div className="h-6 skeleton w-20 rounded" />
                    </div>
                    {/* Button */}
                    <div className="h-8 w-8 skeleton rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function ProductCarouselSkeleton({ columns = 4 }: { columns?: number }) {
    const gridCols =
        columns === 3
            ? "md:grid-cols-3"
            : columns === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-4";

    return (
        <div className="opacity-70">
            {/* Mobile: Carousel-like horizontal layout */}
            <div className="md:hidden flex gap-3 overflow-x-hidden pb-4">
                {[1, 2].map((i) => (
                    <div key={i} className="shrink-0 w-[72vw]">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>

            {/* Desktop: Grid */}
            <div className={`hidden md:grid ${gridCols} gap-4`}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i}>
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 opacity-70">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>
                    <ProductCardSkeleton />
                </div>
            ))}
        </div>
    );
}

export function ProductPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                {/* Images */}
                <div className="w-full lg:w-[55%] flex flex-col gap-4 opacity-70">
                    <div className="aspect-square bg-surface-dim skeleton rounded-2xl w-full" />
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[4/3] w-20 bg-surface-dim skeleton rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Info Text */}
                <div className="w-full lg:w-[45%] flex flex-col pt-4 opacity-70">
                    <div className="h-4 w-24 bg-surface-dim skeleton rounded mb-4" />
                    <div className="h-10 w-3/4 bg-surface-dim skeleton rounded mb-4" />
                    <div className="h-12 w-32 bg-surface-dim skeleton rounded mb-8" />

                    <div className="h-6 w-1/3 bg-surface-dim skeleton rounded mb-6" />

                    <div className="space-y-3 mb-10">
                        <div className="h-4 w-full bg-surface-dim skeleton rounded" />
                        <div className="h-4 w-5/6 bg-surface-dim skeleton rounded" />
                        <div className="h-4 w-4/6 bg-surface-dim skeleton rounded" />
                    </div>

                    <div className="h-14 w-full bg-surface-dim skeleton rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function CategoryPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Breadcrumb Skeleton */}
            <div className="h-4 w-48 skeleton mb-8 rounded" />

            <div className="flex gap-10">
                {/* Desktop Sidebar Skeleton */}
                <aside className="hidden lg:block w-56 shrink-0 opacity-70">
                    <div className="h-3 w-20 skeleton mb-4 rounded" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 w-full skeleton rounded-xl" />
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Section Header Skeleton */}
                    <div className="h-8 w-48 skeleton mb-2 rounded" />
                    <div className="h-4 w-64 skeleton mb-8 rounded" />

                    {/* Mobile Category Tabs Skeleton */}
                    <div className="lg:hidden flex gap-4 border-b border-border-light pb-2 mb-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-6 w-20 skeleton rounded" />
                        ))}
                    </div>

                    {/* Subcategory Pills Skeleton */}
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-8 w-20 skeleton rounded-full" />
                        ))}
                    </div>

                    {/* Product Grid Skeleton */}
                    <ProductGridSkeleton count={6} />
                </div>
            </div>
        </div>
    );
}
