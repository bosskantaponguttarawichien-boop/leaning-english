"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        { name: "🏠 Home", path: "/" },
        { name: "📖 Practice", path: "/practice" },
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-zinc-200/50 p-1.5 rounded-2xl shadow-xl shadow-zinc-200/20 flex items-center gap-1">
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
        </nav>
    );
}
