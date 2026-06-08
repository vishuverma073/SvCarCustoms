"use client";

import ProductCard from "./ProductCard";
import Carousel from "./Carousel";
import InfiniteCarousel from "./InfiniteCarousel";
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

  return (
    <div className={className}>
      {/* Mobile: swipe carousel */}
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

      {/* Desktop: arrow-controlled, seamlessly looping carousel */}
      <div className="hidden md:block">
        <InfiniteCarousel perView={columns} gap={16}>
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
        </InfiniteCarousel>
      </div>
    </div>
  );
}
