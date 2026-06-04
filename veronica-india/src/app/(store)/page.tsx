import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { backend, type HomeBanner, type HomeSectionKey } from "@/lib/backend";
import SectionHeader from "@/components/store/SectionHeader";
import CategoryCard from "@/components/store/CategoryCard";
import ProductCarousel from "@/components/store/ProductCarousel";
import { CategoryGridSkeleton, ProductCarouselSkeleton } from "@/components/store/Skeletons";
import { ArrowRight, ShieldCheck, Medal, ThumbsUp } from "lucide-react";

// The home page reads live catalog data from the backend client. With mocks the
// API isn't reachable during build-time static generation, so render on demand.
export const dynamic = "force-dynamic";

// ─── Defaults ────────────────────────────────────────────────────────
// Used when the admin hasn't composed the home page yet (empty config) or a
// banner field is left blank — so the storefront always looks complete.
const DEFAULT_ORDER: HomeSectionKey[] = ["hero", "categories", "bestsellers", "promo", "new"];

const DEFAULT_HERO: HomeBanner = {
    image: "/uploads/categories/kitchen-sinks.webp",
    title: "Crafted for Modern Living",
    subtitle:
        "Premium kitchen sinks, faucets & bathroom solutions. Built to last with uncompromising quality.",
    ctaText: "Explore Collection",
    ctaLink: "/category/kitchen-sinks",
};

const DEFAULT_PROMO: HomeBanner = {
    image: "/uploads/categories/plumbing-fittings.webp",
    title: "Premium Quality, Honest Prices",
    subtitle: "Upto 55% off on all products. Free delivery above ₹5,000.",
    ctaText: "Browse All Products",
    ctaLink: "/category/kitchen-sinks",
};

/** Fill blank admin fields with defaults so a half-filled banner still renders. */
function withDefaults(b: HomeBanner, d: HomeBanner): HomeBanner {
    return {
        image: b.image || d.image,
        title: b.title || d.title,
        subtitle: b.subtitle || d.subtitle,
        ctaText: b.ctaText || d.ctaText,
        ctaLink: b.ctaLink || d.ctaLink,
    };
}

// ─── Section components ──────────────────────────────────────────────

function HeroSection({ hero }: { hero: HomeBanner }) {
    const h = withDefaults(hero, DEFAULT_HERO);
    return (
        <>
            <section className="relative h-[75vh] md:h-[85vh] overflow-hidden bg-brand-black">
                <Image
                    src={h.image}
                    alt="Veronica Premium Products"
                    fill
                    className="object-cover opacity-30 scale-105"
                    priority
                    quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 lg:p-20 max-w-380 mx-auto">
                    <div className="animate-slide-up">
                        <span className="badge badge-bestseller mb-5 text-[11px]">Trusted Since 2004</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-5 tracking-tight">
                            {h.title}
                        </h1>
                        <p className="text-white/60 text-sm md:text-lg max-w-xl mb-8 leading-relaxed">
                            {h.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href={h.ctaLink || "/"} className="btn btn-primary text-[15px] px-8 py-3.5">
                                {h.ctaText}
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/about"
                                className="btn border border-white/20 text-white hover:bg-white/10 text-[15px] px-8 py-3.5"
                            >
                                Our Story
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <TrustBanner />
        </>
    );
}

/** Static brand band; rendered with the hero so it keeps its place. */
function TrustBanner() {
    return (
        <section className="bg-surface-dim py-16 lg:py-24 border-y border-border/60">
            <div className="max-w-380 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in" style={{ opacity: 0 }}>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-brand-black mb-5 tracking-wide">
                        Built on{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-500">
                            Trust & Excellence
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg md:text-xl font-medium">
                        Bringing over three decades of expertise in crafting exceptional sanitary solutions meant to last a lifetime.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: "100ms" }}>
                        <div className="w-20 h-20 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-brand-orange mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-orange/30 group-hover:shadow-glow-orange group-hover:bg-brand-orange/5">
                            <Medal size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-black mb-3">30+ Years Legacy</h3>
                        <p className="text-text-secondary leading-relaxed max-w-sm">
                            Providing exceptional service and trusted solutions to thousands of families and businesses since 1990.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: "200ms" }}>
                        <div className="w-20 h-20 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-brand-orange mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-orange/30 group-hover:shadow-glow-orange group-hover:bg-brand-orange/5">
                            <ShieldCheck size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-black mb-3">Uncompromising Quality</h3>
                        <p className="text-text-secondary leading-relaxed max-w-sm">
                            We source only premium-grade materials, ensuring that every product meets the highest international standards.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: "300ms" }}>
                        <div className="w-20 h-20 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-brand-orange mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-orange/30 group-hover:shadow-glow-orange group-hover:bg-brand-orange/5">
                            <ThumbsUp size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-black mb-3">Durability & Reliability</h3>
                        <p className="text-text-secondary leading-relaxed max-w-sm">
                            Our fittings are rigorously tested for endurance, guaranteeing flawless performance year after year.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

async function CategoriesSection({ categoryIds }: { categoryIds?: number[] }) {
    // A catalog read failure should degrade to "no section", never crash the
    // whole home page (a thrown error here bubbles past Suspense to the error boundary).
    let categories = await backend.getCategories().catch(() => []);
    // If the admin curated a specific set, show those in their chosen order;
    // otherwise show every category (already alphabetical from getCategories).
    if (categoryIds && categoryIds.length > 0) {
        const rank = new Map(categoryIds.map((id, i) => [id, i]));
        categories = categories
            .filter((c) => rank.has(c.id))
            .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }
    if (categories.length === 0) return null;

    return (
        <section className="max-w-380 mx-auto px-4 py-16">
            <SectionHeader
                title="Shop by Category"
                highlight="Category"
                subtitle="Find exactly what you need for your home"
            />

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden flex gap-3 overflow-x-auto scroll-x-hidden pb-2">
                {categories.map((cat) => (
                    <div key={cat.id} className="shrink-0 w-[72vw]">
                        <CategoryCard name={cat.name} slug={cat.slug} image={cat.image || ""} />
                    </div>
                ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-4 gap-4 stagger-children">
                {categories.map((cat) => (
                    <div key={cat.id} className="animate-fade-in" style={{ opacity: 0 }}>
                        <CategoryCard name={cat.name} slug={cat.slug} image={cat.image || ""} />
                    </div>
                ))}
            </div>
        </section>
    );
}

async function BestsellersSection() {
    // Fetch a wider set so the desktop carousel has items to loop through.
    // A failed read degrades to an empty (hidden) section rather than crashing the page.
    const page = await backend.listProducts({ bestseller: true, limit: 12 }).catch(() => null);
    const bestsellers = page?.items ?? [];
    if (bestsellers.length === 0) return null;

    return (
        <section className="max-w-380 mx-auto px-4 py-10">
            <SectionHeader
                title="Our Bestsellers"
                highlight="Bestsellers"
                subtitle="Most loved by our customers"
                viewAllHref="/category/kitchen-sinks"
                viewAllLabel="View All"
            />
            <ProductCarousel products={bestsellers} columns={4} />
            <Link
                href="/category/kitchen-sinks"
                className="md:hidden flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors mt-6"
            >
                View All Bestsellers <ArrowRight size={16} />
            </Link>
        </section>
    );
}

async function NewArrivalsSection() {
    // Fetch a wider set so the desktop carousel has items to loop through.
    const page = await backend.listProducts({ new: true, limit: 12 }).catch(() => null);
    const newArrivals = page?.items ?? [];
    if (newArrivals.length === 0) return null;

    return (
        <section className="max-w-380 mx-auto px-4 py-10">
            <SectionHeader
                title="New Arrivals"
                highlight="New"
                subtitle="Latest additions to our collection"
            />
            <ProductCarousel products={newArrivals} columns={4} />
        </section>
    );
}

async function FeaturedSection({ productIds }: { productIds: number[] }) {
    if (productIds.length === 0) return null;
    // No public by-IDs endpoint, so pull the catalog and pick the chosen ones,
    // preserving the admin's order.
    const page = await backend.listProducts({ limit: 50 }).catch(() => null);
    const items = page?.items ?? [];
    const rank = new Map(productIds.map((id, i) => [id, i]));
    const featured = items
        .filter((p) => rank.has(p.id))
        .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    if (featured.length === 0) return null;

    return (
        <section className="max-w-380 mx-auto px-4 py-10">
            <SectionHeader title="Featured Products" highlight="Featured" subtitle="Hand-picked by our team" />
            <ProductCarousel products={featured} columns={4} />
        </section>
    );
}

function PromoSection({ promo }: { promo: HomeBanner }) {
    const p = withDefaults(promo, DEFAULT_PROMO);
    return (
        <section className="max-w-380 mx-auto px-4 py-10 animate-fade-in" style={{ animationDelay: "200ms", opacity: 0 }}>
            <div className="relative rounded-2xl overflow-hidden h-52 md:h-72 bg-brand-black">
                <Image src={p.image} alt={p.title} fill className="object-cover opacity-25" sizes="100vw" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black/90 via-brand-black/60 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14">
                    <div className="max-w-lg">
                        <h2 className="text-white text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                            {p.title}
                        </h2>
                        <p className="text-white/50 text-sm md:text-base mb-6 leading-relaxed">{p.subtitle}</p>
                        <Link href={p.ctaLink || "/"} className="btn btn-primary">
                            {p.ctaText}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Suspense fallbacks ──────────────────────────────────────────────

function CategoriesFallback() {
    return (
        <section className="max-w-380 mx-auto px-4 py-16">
            <SectionHeader title="Shop by Category" highlight="Category" subtitle="Find exactly what you need for your home" />
            <CategoryGridSkeleton />
        </section>
    );
}

function RowFallback({ title, highlight, subtitle }: { title: string; highlight: string; subtitle: string }) {
    return (
        <section className="max-w-380 mx-auto px-4 py-10">
            <SectionHeader title={title} highlight={highlight} subtitle={subtitle} />
            <ProductCarouselSkeleton columns={4} />
        </section>
    );
}

// ─── Page ────────────────────────────────────────────────────────────

export default async function HomePage() {
    // Admin-composed layout (order + enabled + banner content). Falls back to the
    // default layout if the admin hasn't configured it yet or the API is down.
    const home = await backend.getHome().catch(() => null);
    const order = home && home.order.length > 0 ? home.order : DEFAULT_ORDER;
    const hero = home?.hero ?? DEFAULT_HERO;
    const promo = home?.promo ?? DEFAULT_PROMO;
    const featuredIds = home?.featured ?? [];
    const categoryIds = home?.categories ?? [];

    // Organization + WebSite structured data: helps search engines show the brand
    // knowledge panel and a sitelinks search box. Product-level JSON-LD lives on the PDP.
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: "Veronica India",
                url: SITE_URL,
                logo: absoluteUrl("/uploads/logo/logo.webp"),
                email: "veronicasanitarygoods@gmail.com",
                telephone: "+919350529717",
                address: {
                    "@type": "PostalAddress",
                    streetAddress: "Plot 734, Bijwasan - Palam Vihar Rd",
                    addressLocality: "New Delhi",
                    postalCode: "110061",
                    addressCountry: "IN",
                },
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: "Veronica India",
                publisher: { "@id": `${SITE_URL}/#organization` },
                potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
                    "query-input": "required name=search_term_string",
                },
            },
        ],
    };

    return (
        <div>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {order.map((key) => {
                switch (key) {
                    case "hero":
                        return <HeroSection key="hero" hero={hero} />;
                    case "categories":
                        return (
                            <Suspense key="categories" fallback={<CategoriesFallback />}>
                                <CategoriesSection categoryIds={categoryIds} />
                            </Suspense>
                        );
                    case "bestsellers":
                        return (
                            <Suspense
                                key="bestsellers"
                                fallback={<RowFallback title="Our Bestsellers" highlight="Bestsellers" subtitle="Most loved by our customers" />}
                            >
                                <BestsellersSection />
                            </Suspense>
                        );
                    case "new":
                        return (
                            <Suspense
                                key="new"
                                fallback={<RowFallback title="New Arrivals" highlight="New" subtitle="Latest additions to our collection" />}
                            >
                                <NewArrivalsSection />
                            </Suspense>
                        );
                    case "featured":
                        return (
                            <Suspense
                                key="featured"
                                fallback={<RowFallback title="Featured Products" highlight="Featured" subtitle="Hand-picked by our team" />}
                            >
                                <FeaturedSection productIds={featuredIds} />
                            </Suspense>
                        );
                    case "promo":
                        return <PromoSection key="promo" promo={promo} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}
