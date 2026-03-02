"use client";

import React from "react";
import Link from "next/link";

export default function PracticeMenuPage() {
    const modes = [
        {
            title: "Vocabulary",
            description: "Practice individual words with meanings and SRS.",
            icon: "📖",
            href: "/practice/words",
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            borderColor: "border-blue-100",
        },
        {
            title: "Sentences",
            description: "Type full natural sentences to improve flow.",
            icon: "💬",
            href: "/practice/sentences",
            color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            borderColor: "border-purple-100",
        },
        {
            title: "Spelling (Soon)",
            description: "Focus on character-by-character accuracy.",
            icon: "✍️",
            href: "#",
            color: "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500",
            borderColor: "border-zinc-100",
            disabled: true,
        },
    ];

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] tracking-tight">
            <div className="w-full max-w-4xl flex flex-col gap-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-none">Practice Modes</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Select a way to improve your English skills.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modes.map((mode, idx) => (
                        <Link
                            key={idx}
                            href={mode.href}
                            className={`group relative p-8 rounded-3xl border ${mode.borderColor} dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 transition-all hover:scale-[1.02] active:scale-[0.98] ${mode.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            <div className="flex flex-col gap-4">
                                <div className={`w-14 h-14 rounded-2xl ${mode.color} flex items-center justify-center text-3xl shadow-sm`}>
                                    {mode.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{mode.title}</h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">{mode.description}</p>
                                </div>
                            </div>
                            {!mode.disabled && (
                                <div className="absolute bottom-8 right-8 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
