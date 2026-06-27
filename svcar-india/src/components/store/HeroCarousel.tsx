"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import SafeBannerImage from "@/components/store/SafeBannerImage";
import type { HomeBanner } from "@/lib/backend";

export interface HeroSlide {
  image: string;
  /** Big uppercase wordmark/headline. */
  title: string;
  /** Supporting line under the title. */
  subtitle: string;
  /** Italic tagline shown at the bottom (Zelix-style). */
  tagline: string;
  ctaText: string;
  ctaLink: string;
}

const FALLBACK_IMAGE =
  "https://placehold.co/1600x900/0A0A0A/E11D2A/png?text=SV+Car+Customs";

const AUTOPLAY_MS = 6000;

/** Brand slides shown after the (admin-driven) primary hero slide. */
const BRAND_SLIDES: HeroSlide[] = [
  {
    image: "https://placehold.co/1600x900/0A0A0A/E11D2A/png?text=Exterior+Mods",
    title: "EXTERIOR MODS",
    subtitle: "Body kits, spoilers, splitters & diffusers for an aggressive stance.",
    tagline: "TRANSFORM YOUR STANCE.",
    ctaText: "Shop Exterior",
    ctaLink: "/category/exterior-mods",
  },
  {
    image: "https://placehold.co/1600x900/0A0A0A/E11D2A/png?text=Performance+Parts",
    title: "PERFORMANCE PARTS",
    subtitle: "Exhausts, intakes & suspension engineered for the road.",
    tagline: "ENGINEERED FOR PURE PERFORMANCE.",
    ctaText: "Shop Performance",
    ctaLink: "/category/performance-parts",
  },
];

export default function HeroCarousel({
  hero,
  shopHref,
}: {
  hero: HomeBanner;
  shopHref: string;
}) {
  const slides: HeroSlide[] = [
    {
      image: hero.image || FALLBACK_IMAGE,
      title: "SV CAR CUSTOMS",
      subtitle:
        hero.subtitle ||
        "Your trusted destination for premium car accessories & customization.",
      tagline: "SPEED AND GRACE, MODS IN PLACE!",
      ctaText: hero.ctaText || "Shop Accessories",
      ctaLink: hero.ctaLink || shopHref,
    },
    ...BRAND_SLIDES,
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  return (
    <section
      className="relative h-[88svh] min-h-[520px] md:h-[86vh] overflow-hidden bg-brand-black"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== index}
        >
          <SafeBannerImage
            src={slide.image}
            fallbackSrc={FALLBACK_IMAGE}
            alt={slide.title}
            className="object-cover object-center"
            priority={i === 0}
            quality={90}
          />
          {/* Centered scrim so overlaid copy stays legible */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.45)_0%,rgba(10,10,10,0.72)_70%,rgba(10,10,10,0.9)_100%)]"
            aria-hidden
          />
        </div>
      ))}

      {/* Slide copy (keyed so it re-animates on change) */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div key={index} className="animate-fade-in max-w-3xl">
          <h1 className="mb-3 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
            {slides[index].title}
          </h1>
          <p className="mx-auto mb-7 max-w-2xl text-base font-medium text-white/80 sm:text-xl md:text-2xl">
            {slides[index].subtitle}
          </p>
          <Link
            href={slides[index].ctaLink || shopHref}
            className="btn btn-primary mx-auto rounded-full px-8 py-3.5 text-[15px]"
          >
            {slides[index].ctaText}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Italic tagline bottom-center */}
      <p className="absolute inset-x-0 bottom-16 z-10 text-center text-xs font-medium uppercase italic tracking-[0.3em] text-white/55 sm:text-sm">
        {slides[index].tagline}
      </p>

      {/* Controls: dots + pause/play */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-7 bg-brand-orange"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20"
        >
          {paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
        </button>
      </div>
    </section>
  );
}
