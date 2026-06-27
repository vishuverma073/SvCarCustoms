"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

/** Pulsing floating "Book a Build" button that appears past the hero (#14). */
export function BookCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#contact"
      className={`cc-fab${show ? "" : " cc-fab-hidden"}`}
      aria-label="Book a build"
    >
      <CalendarCheck size={20} />
      <span>Book a Build</span>
    </a>
  );
}
