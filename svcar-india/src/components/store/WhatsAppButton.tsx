"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
    return (
        <Link
            href="https://wa.me/919205005425"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-50 group"
            aria-label="Chat on WhatsApp"
        >
            {/* Tooltip */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-brand-black text-white text-xs font-medium py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                Chat with us
            </span>

            {/* Button */}
            <span className="flex items-center justify-center w-14 h-14 bg-whatsapp rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110 group-hover:rounded-xl">
                <MessageCircle size={26} fill="white" stroke="white" />
            </span>
        </Link>
    );
}
