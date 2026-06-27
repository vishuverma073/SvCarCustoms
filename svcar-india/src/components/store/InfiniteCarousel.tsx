"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InfiniteCarouselProps {
    children: React.ReactNode;
    /** Items visible at once. */
    perView?: number;
    /** Gap between items, in px. */
    gap?: number;
    className?: string;
}

/**
 * Free-scrolling carousel that loops seamlessly. Built on a native horizontal
 * scroll container, so a trackpad two-finger swipe scrolls it continuously
 * (resting at partial positions feels natural); the arrows nudge it one item at
 * a time. For the loop we render three identical copies of the list and keep the
 * scroll position parked in the middle copy — when it drifts into an edge copy
 * we shift `scrollLeft` by exactly one copy-width, which is invisible because the
 * copies are identical.
 *
 * Desktop-only (the parent shows a swipe carousel on mobile). When everything
 * already fits (`items <= perView`) it's a plain row with no arrows/looping.
 */
export default function InfiniteCarousel({
    children,
    perView = 4,
    gap = 16,
    className = "",
}: InfiniteCarouselProps) {
    const items = React.Children.toArray(children);
    const loop = items.length > perView;
    const rendered = loop ? [...items, ...items, ...items] : items;

    const trackRef = useRef<HTMLDivElement>(null);
    const ready = useRef(false);

    // Park the scroll on the middle copy once laid out.
    useEffect(() => {
        const el = trackRef.current;
        if (!el || !loop) {
            ready.current = false;
            return;
        }
        ready.current = false;
        const id = requestAnimationFrame(() => {
            el.scrollLeft = el.scrollWidth / 3;
            ready.current = true;
        });
        return () => cancelAnimationFrame(id);
    }, [loop, items.length, perView]);

    // Seamlessly wrap: keep scrollLeft inside the middle copy.
    const onScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el || !loop || !ready.current) return;
        const copy = el.scrollWidth / 3;
        if (el.scrollLeft < copy) el.scrollLeft += copy;
        else if (el.scrollLeft >= copy * 2) el.scrollLeft -= copy;
    }, [loop]);

    const step = (dir: number) => {
        const el = trackRef.current;
        if (!el) return;
        const itemStride = (el.clientWidth - gap * (perView - 1)) / perView + gap;
        el.scrollBy({ left: dir * itemStride, behavior: "smooth" });
    };

    const itemBasis = `calc((100% - ${gap * (perView - 1)}px) / ${perView})`;

    return (
        <div className={`relative ${className}`}>
            <div
                ref={trackRef}
                onScroll={onScroll}
                className="flex overflow-x-auto scroll-x-hidden"
                style={{ gap: `${gap}px`, overscrollBehaviorX: "contain" }}
            >
                {rendered.map((child, i) => (
                    <div
                        key={i}
                        className="shrink-0"
                        style={{ flex: `0 0 ${itemBasis}`, maxWidth: itemBasis }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {loop && (
                <>
                    <button
                        type="button"
                        onClick={() => step(-1)}
                        aria-label="Previous"
                        className="absolute top-1/2 -left-3 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-surface-card border border-border shadow-card flex items-center justify-center text-text-secondary hover:text-brand-orange hover:border-brand-orange hover:scale-105 transition-all duration-200"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={() => step(1)}
                        aria-label="Next"
                        className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-surface-card border border-border shadow-card flex items-center justify-center text-text-secondary hover:text-brand-orange hover:border-brand-orange hover:scale-105 transition-all duration-200"
                    >
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                </>
            )}
        </div>
    );
}
