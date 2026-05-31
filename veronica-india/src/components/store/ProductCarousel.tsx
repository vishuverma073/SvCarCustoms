"use client";

import ProductCard from "./ProductCard";
import Carousel from "./Carousel";
import type { ProductListItem } from "@veronica/contracts";

interface ProductCarouselProps {
  products: ProductListItem[];
  columns?: number; // desktop grid columns (default: 4)
  className?: string;
}

/**
 * Renders a list of {@link ProductListItem}s (pricing precomputed by the
 * backend) as a mobile carousel / desktop grid of product cards.
 */
export default function ProductCarousel({
  products,
  columns = 4,
  className = "",
}: ProductCarouselProps) {
  if (products.length === 0) return null;

  const gridCols =
    columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-4";

  return (
    <div className={className}>
      {/* Mobile: Carousel */}
      <div className="md:hidden">
        <Carousel itemWidth="72vw" gap={12} showArrows={false}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              image={product.image}
              minPrice={product.minPrice}
              maxBasePrice={product.maxBasePrice}
              discount={product.bestDiscount}
              isBestseller={product.isBestseller}
              isNew={product.isNew}
            />
          ))}
        </Carousel>
      </div>

      {/* Desktop: Grid */}
      <div className={`hidden md:grid ${gridCols} gap-4 stagger-children`}>
        {products.map((product) => (
          <div key={product.id} className="animate-fade-in" style={{ opacity: 0 }}>
            <ProductCard
              slug={product.slug}
              name={product.name}
              image={product.image}
              minPrice={product.minPrice}
              maxBasePrice={product.maxBasePrice}
              discount={product.bestDiscount}
              isBestseller={product.isBestseller}
              isNew={product.isNew}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
