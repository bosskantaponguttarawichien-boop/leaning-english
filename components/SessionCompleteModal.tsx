"use client";

import React from "react";
import { SRSStats } from "@/lib/srs";

interface StatCard {
    label: string;
    value: string | number;
    color: string;
}

interface SessionCompleteModalProps {
    stats: StatCard[];
    details?: React.ReactNode;
    onRetry: () => void;
    backHref: string;
}

export default function SessionCompleteModal({ stats, details, onRetry, backHref }: SessionCompleteModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-8 rounded-md shadow-none flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in duration-300">
                <div className="font-display">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Lesson Finished</span>
                    <h2 className="text-3xl font-semibold text-ink dark:text-canvas-cream leading-tight mt-1">Session Complete! 🏁</h2>
                </div>

                <div className={`grid gap-4 w-full`} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map((s, i) => (
                        <div key={i} className="bg-canvas-cream dark:bg-black/20 p-4 rounded-md border border-ink/5 dark:border-zinc-800">
                            <p className="text-ink/50 dark:text-canvas-cream/50 text-[9px] font-mono font-bold uppercase tracking-widest leading-none">{s.label}</p>
                            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {details}

                <div className="w-full flex flex-col gap-2 mt-2">
                    <button
                        onClick={onRetry}
                        className="w-full py-3.5 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all hover:opacity-90 active:scale-[0.98] border-0 focus:outline-none cursor-pointer"
                    >
                        Try Again
                    </button>
                    <a 
                        href={backHref} 
                        className="w-full py-3 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 text-ink/50 dark:text-canvas-cream/50 font-mono text-[10px] font-bold uppercase tracking-wider rounded-full border border-transparent hover:border-ink/10 dark:hover:border-canvas-cream/10 transition-all text-center flex items-center justify-center cursor-pointer"
                    >
                        Back to Menu
                    </a>
                </div>
            </div>
        </div>
    );
}

export type { StatCard };

interface SRSDetailsProps {
    stats: SRSStats;
    elapsedTime?: number;
    wordCount?: number;
    correctCharCount?: number;
    totalTypedCharCount?: number;
    isTypingMode?: boolean;
}

export function SRSDetails({ stats, elapsedTime, wordCount, correctCharCount, totalTypedCharCount, isTypingMode }: SRSDetailsProps) {
    if (isTypingMode) {
        return (
            <div className="w-full bg-canvas-cream dark:bg-black/25 p-4 rounded-md border border-ink/5 dark:border-zinc-800 text-left text-xs text-ink/70 dark:text-canvas-cream/70 flex flex-col gap-2 font-sans">
                <div className="flex justify-between items-center border-b border-ink/5 dark:border-zinc-850 pb-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Words Completed:</span>
                    <span className="font-bold text-ink dark:text-canvas-cream">{wordCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-ink/5 dark:border-zinc-850 pb-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Elapsed Time:</span>
                    <span className="font-bold text-ink dark:text-canvas-cream">{elapsedTime}s</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Keystrokes:</span>
                    <span className="font-bold text-ink dark:text-canvas-cream">{correctCharCount} correct / {totalTypedCharCount} total</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-canvas-cream dark:bg-black/25 p-4 rounded-md border border-ink/5 dark:border-zinc-800 flex flex-col gap-4 font-sans">
            <h3 className="text-[10px] font-mono font-bold text-ink/50 dark:text-canvas-cream/50 uppercase tracking-widest text-left">SRS Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 text-left">
                <div>
                    <p className="text-[9px] font-mono font-bold text-ink/40 dark:text-canvas-cream/40 uppercase tracking-wider">Retention</p>
                    <p className="text-lg font-bold text-ink dark:text-canvas-cream">{stats.retentionRate.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-[9px] font-mono font-bold text-ink/40 dark:text-canvas-cream/40 uppercase tracking-wider">Mastered</p>
                    <p className="text-lg font-bold text-ink dark:text-canvas-cream">{stats.masteredCount}</p>
                </div>
                <div>
                    <p className="text-[9px] font-mono font-bold text-ink/40 dark:text-canvas-cream/40 uppercase tracking-wider">Due Words</p>
                    <p className="text-lg font-bold text-hume-lavender">{stats.dueCount}</p>
                </div>
                <div>
                    <p className="text-[9px] font-mono font-bold text-ink/40 dark:text-canvas-cream/40 uppercase tracking-wider">Recall Speed</p>
                    <p className="text-lg font-bold text-ink dark:text-canvas-cream">
                        {stats.avgRecallSpeed > 0 ? (stats.avgRecallSpeed / 1000).toFixed(2) + "s" : "-"}
                    </p>
                </div>
            </div>
        </div>
    );
}
