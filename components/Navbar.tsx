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
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const links = [
        { name: "Home", path: "/" },
        { name: "Practice", path: "/practice" },
    ];

    return (
        <nav 
            className={`w-full h-14 sticky top-0 z-40 transition-all duration-300 ${
                scrolled 
                    ? "bg-background/80 backdrop-blur-md border-b border-ink/5 dark:border-canvas-cream/5" 
                    : "bg-background"
            }`}
        >
            <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6 md:px-8">
                {/* Left: Brand Wordmark */}
                <Link href="/" className="font-display font-semibold text-lg text-ink dark:text-canvas-cream tracking-tight hover:opacity-80 transition-opacity">
                    EngList
                </Link>

                {/* Center: Navigation Links */}
                <div className="flex items-center gap-6">
                    {links.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`text-sm font-sans tracking-wide transition-colors ${
                                    isActive
                                        ? "text-ink dark:text-canvas-cream font-semibold"
                                        : "text-ink/60 dark:text-canvas-cream/60 hover:text-ink dark:hover:text-canvas-cream"
                                }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Integrated Theme Toggle styled as Hume button-primary */}
                <div className="flex items-center">
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="h-9 px-4 rounded-full bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono uppercase text-[11px] tracking-wider font-semibold transition-all hover:opacity-90 active:scale-[0.97] flex items-center gap-1.5 border-0 focus:outline-none cursor-pointer"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                    </svg>
                                    <span>LIGHT</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                    </svg>
                                    <span>DARK</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
