import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { backend } from "@/lib/backend";
import SectionHeader from "@/components/store/SectionHeader";
import CategoryCard from "@/components/store/CategoryCard";
import ProductCarousel from "@/components/store/ProductCarousel";
import { CategoryGridSkeleton, ProductCarouselSkeleton } from "@/components/store/Skeletons";
import { ArrowRight, ShieldCheck, Medal, ThumbsUp } from "lucide-react";

// The home page reads live catalog data from the backend client. With mocks the
// API isn't reachable during build-time static generation, so render on demand.
// TODO(real-api): switch to ISR (`export const revalidate = 3600`) once the
// backend is reachable at build time.
export const dynamic = "force-dynamic";

// --- Async Section Components ---

async function CategoriesSection() {
    const categories = await backend.getCategories();

    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
            <SectionHeader
                title="Shop by Category"
                highlight="Category"
                subtitle="Find exactly what you need for your home"
            />

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden flex gap-3 overflow-x-auto scroll-x-hidden pb-2">
                {categories.map((cat) => (
                    <div key={cat.id} className="shrink-0 w-[72vw]">
                        <CategoryCard
                            name={cat.name}
                            slug={cat.slug}
                            image={cat.image || ""}
                        />
                    </div>
                ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-4 gap-4 stagger-children">
                {categories.map((cat) => (
                    <div key={cat.id} className="animate-fade-in" style={{ opacity: 0 }}>
                        <CategoryCard
                            name={cat.name}
                            slug={cat.slug}
                            image={cat.image || ""}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

async function BestsellersSection() {
    const { items: bestsellers } = await backend.listProducts({ bestseller: true, limit: 4 });

    if (bestsellers.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 py-10">
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
    const { items: newArrivals } = await backend.listProducts({ new: true, limit: 4 });

    if (newArrivals.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 py-10">
            <SectionHeader
                title="New Arrivals"
                highlight="New"
                subtitle="Latest additions to our collection"
            />
            <ProductCarousel products={newArrivals} columns={4} />
        </section>
    );
}

export default function HomePage() {
    return (
        <div>
            {/* ─── Hero Section ─────────────────────────────────── */}
            <section className="relative h-[75vh] md:h-[85vh] overflow-hidden bg-brand-black">
                <Image
                    src="/uploads/categories/kitchen-sinks.webp"
                    alt="Veronica Premium Products"
                    fill
                    className="object-cover opacity-30 scale-105"
                    priority
                    quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 lg:p-20 max-w-7xl mx-auto">
                    <div className="animate-slide-up">
                        <span className="badge badge-bestseller mb-5 text-[11px]">
                            Trusted Since 2004
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-5 tracking-tight">
                            Crafted for
                            <br />
                            <span className="bg-gradient-to-r from-brand-orange to-amber-400 bg-clip-text text-transparent">
                                Modern Living
                            </span>
                        </h1>
                        <p className="text-white/60 text-sm md:text-lg max-w-xl mb-8 leading-relaxed">
                            Premium kitchen sinks, faucets &amp; bathroom solutions.
                            Built to last with uncompromising quality.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/category/kitchen-sinks" className="btn btn-primary text-[15px] px-8 py-3.5">
                                Explore Collection
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/about" className="btn border border-white/20 text-white hover:bg-white/10 text-[15px] px-8 py-3.5">
                                Our Story
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Premium Trust Banner ───────────────────────────── */}
            <section className="bg-surface-dim py-16 lg:py-24 border-y border-border/60">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in" style={{ opacity: 0 }}>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-brand-black mb-5 tracking-wide">
                            Built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-500">Trust & Excellence</span>
                        </h2>
                        <p className="text-text-muted text-lg md:text-xl font-medium">
                            Bringing over three decades of expertise in crafting exceptional sanitary solutions meant to last a lifetime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Feature 1 */}
                        <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: '100ms' }}>
                            <div className="w-20 h-20 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-brand-orange mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-orange/30 group-hover:shadow-glow-orange group-hover:bg-brand-orange/5">
                                <Medal size={36} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-black mb-3">30+ Years Legacy</h3>
                            <p className="text-text-secondary leading-relaxed max-w-sm">
                                Providing exceptional service and trusted solutions to thousands of families and businesses since 1990.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: '200ms' }}>
                            <div className="w-20 h-20 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-brand-orange mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-orange/30 group-hover:shadow-glow-orange group-hover:bg-brand-orange/5">
                                <ShieldCheck size={36} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-black mb-3">Uncompromising Quality</h3>
                            <p className="text-text-secondary leading-relaxed max-w-sm">
                                We source only premium-grade materials, ensuring that every product meets the highest international standards.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex flex-col items-center text-center animate-slide-up group" style={{ opacity: 0, animationDelay: '300ms' }}>
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

            {/* ─── Shop by Category ──────────────────────────────── */}
            <Suspense fallback={
                <section className="max-w-7xl mx-auto px-4 py-16">
                    <SectionHeader title="Shop by Category" highlight="Category" subtitle="Find exactly what you need for your home" />
                    <CategoryGridSkeleton />
                </section>
            }>
                <CategoriesSection />
            </Suspense>

            {/* ─── Bestsellers ──────────────────────────────────── */}
            <Suspense fallback={
                <section className="max-w-7xl mx-auto px-4 py-10">
                    <SectionHeader title="Our Bestsellers" highlight="Bestsellers" subtitle="Most loved by our customers" />
                    <ProductCarouselSkeleton columns={4} />
                </section>
            }>
                <BestsellersSection />
            </Suspense>

            {/* ─── Promo Banner ─────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 py-10 animate-fade-in" style={{ animationDelay: '200ms', opacity: 0 }}>
                <div className="relative rounded-2xl overflow-hidden h-52 md:h-72 bg-brand-black">
                    <Image
                        src="/uploads/categories/plumbing-fittings.webp"
                        alt="Premium Quality"
                        fill
                        className="object-cover opacity-25"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-black/90 via-brand-black/60 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14">
                        <div className="max-w-lg">
                            <h2 className="text-white text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                                Premium Quality,{" "}
                                <span className="bg-gradient-to-r from-brand-orange to-amber-400 bg-clip-text text-transparent">
                                    Honest Prices
                                </span>
                            </h2>
                            <p className="text-white/50 text-sm md:text-base mb-6 leading-relaxed">
                                Upto 55% off on all products. Free delivery above ₹5,000.
                            </p>
                            <Link href="/category/kitchen-sinks" className="btn btn-primary">
                                Browse All Products
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── New Arrivals ─────────────────────────────────── */}
            <Suspense fallback={
                <section className="max-w-7xl mx-auto px-4 py-10">
                    <SectionHeader title="New Arrivals" highlight="New" subtitle="Latest additions to our collection" />
                    <ProductCarouselSkeleton columns={4} />
                </section>
            }>
                <NewArrivalsSection />
            </Suspense>
        </div>
    );
}
