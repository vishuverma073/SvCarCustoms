import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
    slug: string;
    name: string;
    image: string;
    minPrice: number;
    maxBasePrice: number; // highest MRP for strikethrough
    discount: number; // best discount %
    isBestseller: boolean;
    isNew: boolean;
}

export default function ProductCard({
    slug,
    name,
    image,
    minPrice,
    maxBasePrice,
    discount,
    isBestseller,
    isNew,
}: ProductCardProps) {
    return (
        <Link href={`/product/${slug}`} className="card group block">
            {/* Image Container — fixed aspect ratio for uniform cards */}
            <div className="relative aspect-[4/3] bg-surface-dim overflow-hidden">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-108"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isBestseller && (
                        <span className="badge badge-bestseller">Bestseller</span>
                    )}
                    {isNew && <span className="badge badge-new">New</span>}
                </div>

                {discount > 0 && (
                    <span className="absolute top-3 right-3 badge badge-discount">
                        -{discount}%
                    </span>
                )}

                {/* Quick-view overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-3 min-h-[2.5rem] leading-snug">
                    {name}
                </h3>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className="price-sale">
                        {minPrice < maxBasePrice ? "From " : ""}
                        {formatPrice(minPrice)}
                    </span>
                    {discount > 0 && (
                        <span className="price-mrp">{formatPrice(maxBasePrice)}</span>
                    )}
                </div>

                <div className="btn btn-secondary w-full text-xs py-2.5 group-hover:bg-brand-orange group-hover:text-white group-hover:border-brand-orange transition-all duration-300">
                    View Details
                </div>
            </div>
        </Link>
    );
}
