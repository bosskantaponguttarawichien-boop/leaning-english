"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

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
        <nav className={`w-full h-[120px] flex sticky top-0 z-30 relative ${scrolled ? "" : "bg-zinc-50 dark:bg-zinc-900"}`}>
            {/* Blur overlay — แสดงเฉพาะตอน scroll */}
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
                style={{
                    backdropFilter: "blur(20px) saturate(1.5)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.5)",
                    maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/85 to-transparent dark:from-zinc-900/85 dark:to-transparent" />
            </div>
            <div className="w-full relative">
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 p-1.5 rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-zinc-900/20 flex items-center gap-1">
                    {links.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-none"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Theme Toggle (Top Right) */}
                {mounted && (
                    <div className="fixed top-6 right-6 z-40 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 p-1.5 rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-zinc-900/20 flex items-center gap-1">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all focus:outline-none"
                            aria-label="Toggle Dark Mode"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
