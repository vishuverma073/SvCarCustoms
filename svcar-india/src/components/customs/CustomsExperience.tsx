"use client";

import { useScrollReveal } from "./Particles";
import { CustomNavbar } from "./CustomNavbar";
import { Hero } from "./Hero";
import { StatCounters } from "./StatCounters";
import { ServiceCards } from "./ServiceCards";
import { BeforeAfter } from "./BeforeAfter";
import { WrapConfigurator } from "./WrapConfigurator";
import { BuildsCarousel } from "./BuildsCarousel";
import { Gallery } from "./Gallery";
import { Footer } from "./Footer";
import { BookCTA } from "./BookCTA";

/**
 * Full car-customs landing experience. Self-contained and dark-themed via the
 * `cc-root` scope, independent of the storefront's light theme.
 *
 * To go live with real media: pass `videoSrc` to <Hero/> (e.g. a muted MP4 in
 * /public) and swap any <CarSvg/> for <Image/> — the slots line up 1:1.
 */
export function CustomsExperience() {
  useScrollReveal();

  return (
    <div className="cc-root">
      <CustomNavbar />
      <Hero />
      <StatCounters />
      <ServiceCards />
      <BeforeAfter />
      <WrapConfigurator />
      <BuildsCarousel />
      <Gallery />
      <Footer />
      <BookCTA />
    </div>
  );
}
