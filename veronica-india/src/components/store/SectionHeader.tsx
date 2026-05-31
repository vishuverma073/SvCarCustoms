import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
    title: string;
    highlight?: string; // word within title to color with gradient
    subtitle?: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    className?: string;
}

export default function SectionHeader({
    title,
    highlight,
    subtitle,
    viewAllHref,
    viewAllLabel = "View All",
    className = "",
}: SectionHeaderProps) {
    // Split title to wrap the highlight word in a span
    const renderTitle = () => {
        if (!highlight) return title;
        const parts = title.split(new RegExp(`(${highlight})`, "i"));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <span key={i} className="highlight">
                    {part}
                </span>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    return (
        <div className={`section-header ${className}`}>
            <div className="section-header-accent" />
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="section-title">{renderTitle()}</h2>
                    {subtitle && <p className="section-subtitle">{subtitle}</p>}
                </div>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors shrink-0 pb-0.5"
                    >
                        {viewAllLabel} <ArrowRight size={16} />
                    </Link>
                )}
            </div>
        </div>
    );
}
