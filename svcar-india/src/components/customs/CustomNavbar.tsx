"use client";

import { useEffect, useState } from "react";
import { Menu, X, Wrench } from "lucide-react";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#configurator", label: "Configurator" },
  { href: "#builds", label: "Builds" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

/** Transparent over the hero; compacts + frosts on scroll (#11). */
export function CustomNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className={`cc-nav${scrolled ? " cc-nav-scrolled" : ""}`}>
        <a href="#top" className="cc-brand">
          <span className="cc-brand-mark">
            <Wrench size={20} strokeWidth={2.5} color="#fff" />
          </span>
          SV<b>CUSTOMS</b>
        </a>

        <div className="cc-nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="cc-nav-link">
              {l.label}
            </a>
          ))}
          <a href="#contact" className="cc-btn cc-btn-primary cc-nav-cta">
            Book a Build
          </a>
        </div>

        <button
          className="cc-nav-burger"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={26} />
        </button>
      </nav>

      <div className={`cc-mobile-menu${open ? " cc-open" : ""}`}>
        <button
          className="cc-nav-burger"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          style={{ position: "absolute", top: 22, right: 22, display: "block" }}
        >
          <X size={30} />
        </button>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a
          href="#contact"
          onClick={() => setOpen(false)}
          className="cc-btn cc-btn-primary"
          style={{ marginTop: 18 }}
        >
          Book a Build
        </a>
      </div>
    </>
  );
}
