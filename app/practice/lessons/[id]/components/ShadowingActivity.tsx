"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { speak } from "@/lib/speech";


interface ShadowingActivityProps {
    activity: Activity;
    onComplete: () => void;
}

export default function ShadowingActivity({ activity, onComplete }: ShadowingActivityProps) {
    const sentences = activity.options || [];
    const translations = Array.isArray(activity.answer) ? activity.answer : [];
    const [current, setCurrent] = useState(0);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const [showThai, setShowThai] = useState(true);

    const markComplete = () => {
        setCompleted((value) => new Set(value).add(current));
        if (current + 1 < sentences.length) setCurrent((value) => value + 1);
    };

    const allComplete = sentences.length > 0 && completed.size === sentences.length;

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-6 sm:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-ink/5 dark:border-zinc-800 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-hume-orange">
                    Listen • Repeat • Shadow
                </h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display">
                    {activity.instruction}
                </h3>
                <p className="text-sm text-ink/60 dark:text-canvas-cream/60 mt-2">
                    รอบแรกฟังให้เข้าใจ รอบสองหยุดแล้วพูดตาม รอบสามพูดเกาะจังหวะเสียง
                </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {sentences.map((_, index) => (
                    <button
                        type="button"
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-9 h-9 shrink-0 rounded-full text-xs font-mono font-bold border ${
                            current === index
                                ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink border-ink"
                                : completed.has(index)
                                  ? "bg-hume-mint/15 text-hume-mint border-hume-mint/30"
                                  : "border-ink/10 dark:border-zinc-700"
                        }`}
                    >
                        {completed.has(index) ? "✓" : index + 1}
                    </button>
                ))}
            </div>

            <div className="p-6 sm:p-8 rounded-md bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 text-center">
                <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-ink dark:text-canvas-cream">
                    {sentences[current]}
                </p>
                {showThai && translations[current] && (
                    <p className="text-sm text-ink/55 dark:text-canvas-cream/55 mt-3">{translations[current]}</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => speak(sentences[current], { rate: 0.78 })}
                    className="p-4 rounded-md border border-ink/10 dark:border-zinc-700 text-left hover:bg-ink/5"
                >
                    <span className="block text-[10px] font-mono uppercase text-ink/45 dark:text-white/45">Round 1</span>
                    <strong className="block mt-1">🔊 ฟังช้าและอ่าน</strong>
                </button>
                <button
                    type="button"
                    onClick={() => speak(sentences[current], { rate: 0.9 })}
                    className="p-4 rounded-md border border-ink/10 dark:border-zinc-700 text-left hover:bg-ink/5"
                >
                    <span className="block text-[10px] font-mono uppercase text-ink/45 dark:text-white/45">Round 2</span>
                    <strong className="block mt-1">🎙️ ฟังแล้วพูดตาม</strong>
                </button>
                <button
                    type="button"
                    onClick={() => speak(sentences[current], { rate: 1 })}
                    className="p-4 rounded-md border border-ink/10 dark:border-zinc-700 text-left hover:bg-ink/5"
                >
                    <span className="block text-[10px] font-mono uppercase text-ink/45 dark:text-white/45">Round 3</span>
                    <strong className="block mt-1">⚡ เกาะจังหวะจริง</strong>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-ink/5 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => setShowThai((value) => !value)}
                    className="px-4 py-2 rounded-full border border-ink/15 dark:border-white/20 text-[10px] font-mono uppercase font-bold"
                >
                    {showThai ? "Hide Thai" : "Show Thai"}
                </button>
                {!allComplete ? (
                    <button
                        type="button"
                        onClick={markComplete}
                        className="px-6 py-3 rounded-full bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono text-xs uppercase tracking-wider font-bold"
                    >
                        พูดครบ 3 รอบแล้ว ✓
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onComplete}
                        className="px-6 py-3 rounded-full bg-hume-mint text-ink font-mono text-xs uppercase tracking-wider font-bold"
                    >
                        Complete shadowing →
                    </button>
                )}
            </div>
        </div>
    );
}
