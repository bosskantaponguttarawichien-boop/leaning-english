"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Hydration guard to prevent theme flicker on SSR
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
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
        <nav className={`w-full h-[120px] flex sticky top-0 z-40 relative ${scrolled ? "" : "bg-zinc-50 dark:bg-zinc-950"}`}>
            {/* Blur overlay — แสดงเฉพาะตอน scroll */}
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
                style={{
                    backdropFilter: "blur(20px) saturate(1.5)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.5)",
                    maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    background: resolvedTheme === "dark"
                        ? "linear-gradient(to bottom, rgba(9,9,11,0.85) 0%, rgba(9,9,11,0) 100%)"
                        : "linear-gradient(to bottom, rgba(250,250,250,0.85) 0%, rgba(250,250,250,0) 100%)",
                }}
            />
            <div className="w-full relative">
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 p-1.5 rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-zinc-900/40 flex items-center gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}

                    {/* Dark Mode Toggle */}
                    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                    <button
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        aria-label="Toggle dark mode"
                        title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {mounted ? (
                            resolvedTheme === "dark" ? (
                                // Sun icon
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <circle cx="12" cy="12" r="5" />
                                    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            ) : (
                                // Moon icon
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                </svg>
                            )
                        ) : <span className="w-4 h-4 block" />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
