"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // เริ่ม blur เมื่อ scroll เกิน 10px
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const links = [
        { name: "🏠 Home", path: "/" },
        { name: "📖 Practice", path: "/practice" },
    ];

    return (
        <nav className={`w-full h-[120px] flex sticky top-0 z-40 relative ${scrolled ? "" : "bg-zinc-50"}`}>
            {/* Blur overlay — แสดงเฉพาะตอน scroll */}
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
                style={{
                    backdropFilter: "blur(20px) saturate(1.5)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.5)",
                    maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    background: "linear-gradient(to bottom, rgba(250,250,250,0.85) 0%, rgba(250,250,250,0) 100%)",
                }}
            />
            <div className="w-full relative">
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-zinc-200/50 p-1.5 rounded-2xl shadow-xl shadow-zinc-200/20 flex items-center gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
