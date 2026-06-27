import Link from "next/link";
import { Instagram } from "lucide-react";
import SafeBannerImage from "@/components/store/SafeBannerImage";

const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://www.instagram.com/svcarcustoms";

/** Placeholder feed tiles — swap for real post thumbnails/links when available. */
const TILES = [
  "Build 01",
  "Build 02",
  "Build 03",
  "Build 04",
  "Build 05",
  "Build 06",
];

const tileImg = (text: string) =>
  `https://placehold.co/600x600/0A0A0A/E11D2A/png?text=${encodeURIComponent(text)}`;

export default function InstagramSection() {
  return (
    <section className="max-w-380 mx-auto px-4 py-12 md:py-16">
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">
          Follow us on Instagram
        </h2>
        <p className="mt-2 text-sm text-text-secondary md:text-base">
          Join our community for daily inspiration and a closer look at our builds
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
        {TILES.map((label) => (
          <Link
            key={label}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${label} on Instagram`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-brand-black"
          >
            <SafeBannerImage
              src={tileImg(label)}
              fallbackSrc={tileImg("SV")}
              alt={label}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
              <Instagram
                size={22}
                className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mx-auto rounded-full px-7 py-3"
        >
          <Instagram size={18} />
          Visit Instagram
        </Link>
      </div>
    </section>
  );
}
