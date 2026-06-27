"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
    children: React.ReactNode;
    showDots?: boolean;
    showArrows?: boolean;
    itemWidth?: string; // CSS width for each item, e.g. "85vw", "280px"
    gap?: number;
    className?: string;
}

export default function Carousel({
    children,
    showDots = true,
    showArrows = true,
    itemWidth = "80vw",
    gap = 12,
    className = "",
}: CarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const childArray = React.Children.toArray(children);

    useEffect(() => {
        setTotalItems(childArray.length);
    }, [childArray.length]);

    const updateActiveIndex = useCallback(() => {
        const track = trackRef.current;
        if (!track || totalItems === 0) return;
        const scrollLeft = track.scrollLeft;
        const itemWidthPx = track.scrollWidth / totalItems;
        const index = Math.round(scrollLeft / itemWidthPx);
        setActiveIndex(Math.min(index, totalItems - 1));
    }, [totalItems]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        track.addEventListener("scroll", updateActiveIndex, { passive: true });
        return () => track.removeEventListener("scroll", updateActiveIndex);
    }, [updateActiveIndex]);

    const scrollTo = (index: number) => {
        const track = trackRef.current;
        if (!track || totalItems === 0) return;
        const itemWidthPx = track.scrollWidth / totalItems;
        track.scrollTo({ left: itemWidthPx * index, behavior: "smooth" });
    };

    const scrollPrev = () => scrollTo(Math.max(0, activeIndex - 1));
    const scrollNext = () => scrollTo(Math.min(totalItems - 1, activeIndex + 1));

    return (
        <div className={`carousel-container ${className}`}>
            {/* Arrows (desktop only) */}
            {showArrows && totalItems > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="carousel-arrow prev"
                        aria-label="Previous"
                        style={{ opacity: activeIndex === 0 ? 0.4 : 1 }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="carousel-arrow next"
                        aria-label="Next"
                        style={{ opacity: activeIndex >= totalItems - 1 ? 0.4 : 1 }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </>
            )}

            {/* Track */}
            <div
                ref={trackRef}
                className="carousel-track"
                style={{ gap: `${gap}px` }}
            >
                {childArray.map((child, i) => (
                    <div
                        key={i}
                        className="carousel-item"
                        style={{ width: itemWidth, maxWidth: itemWidth }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Dots */}
            {showDots && totalItems > 1 && (
                <div className="carousel-dots">
                    {Array.from({ length: totalItems }).map((_, i) => (
                        <button
                            key={i}
                            className={`carousel-dot ${i === activeIndex ? "active" : ""}`}
                            onClick={() => scrollTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
