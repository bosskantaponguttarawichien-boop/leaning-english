"use client";

import React from "react";
import { Activity } from "@/schemas/curriculum.schema";

interface ConceptActivityProps {
    activity: Activity;
    onComplete: () => void;
}

export default function ConceptActivity({ activity, onComplete }: ConceptActivityProps) {
    const renderParagraph = (text: string, idx: number) => {
        const trimmed = text.trim();
        if (!trimmed) return null;

        // Header Check
        if (trimmed.startsWith("#")) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const content = trimmed.replace(/^#+\s*/, "");
            if (level === 1) return <h2 key={idx} className="text-3xl font-black text-zinc-900 dark:text-white mt-6 mb-3">{content}</h2>;
            if (level === 2) return <h3 key={idx} className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-4 mb-2">{content}</h3>;
            return <h4 key={idx} className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mt-3 mb-2">{content}</h4>;
        }

        // Bullet point Check
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            const content = trimmed.replace(/^[-*]\s*/, "");
            return (
                <li key={idx} className="ml-4 list-disc text-base font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed my-1">
                    {parseInlineStyles(content)}
                </li>
            );
        }

        // Alert box Check
        if (trimmed.startsWith("🚨") || trimmed.startsWith("⚠️") || trimmed.startsWith("💡")) {
            return (
                <div key={idx} className="my-4 p-5 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 dark:text-amber-300 font-semibold text-sm">
                    {parseInlineStyles(trimmed)}
                </div>
            );
        }

        // Correct / Incorrect examples list
        if (trimmed.startsWith("ถูก:") || trimmed.startsWith("ผิด:") || trimmed.startsWith("✅") || trimmed.startsWith("❌")) {
            const isCorrect = trimmed.startsWith("ถูก:") || trimmed.startsWith("✅");
            const borderColor = isCorrect ? "border-green-500" : "border-red-500";
            const bgColor = isCorrect ? "bg-green-50/50 dark:bg-green-950/10" : "bg-red-50/50 dark:bg-red-950/10";
            const textColor = isCorrect ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300";
            return (
                <div key={idx} className={`my-2 p-3.5 border-l-4 ${borderColor} ${bgColor} ${textColor} rounded-r-xl font-mono text-sm font-semibold`}>
                    {parseInlineStyles(trimmed)}
                </div>
            );
        }

        // Default paragraph
        return (
            <p key={idx} className="text-base font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed my-3">
                {parseInlineStyles(trimmed)}
            </p>
        );
    };

    // Helper to replace `code` with styled <code> tags
    const parseInlineStyles = (text: string) => {
        const parts = text.split(/(`[^`]+`)/g);
        return parts.map((part, index) => {
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code key={index} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 font-mono text-sm font-bold rounded">
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    const paragraphs = (activity.content || "").split("\n");

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            {/* Title / Instruction */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Mental Model</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Slide Body Content */}
            <div className="flex-1 flex flex-col justify-center py-2">
                <ul className="flex flex-col gap-1 list-none">
                    {paragraphs.map((p, idx) => renderParagraph(p, idx))}
                </ul>
            </div>

            {/* CTA action button */}
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                <button
                    onClick={onComplete}
                    className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                >
                    Got it, next!
                </button>
            </div>
        </div>
    );
}
