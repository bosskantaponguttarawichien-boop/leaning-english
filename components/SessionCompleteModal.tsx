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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">Session Complete! 🏁</h2>

                <div className={`grid gap-4 w-full`} style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map((s, i) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{s.label}</p>
                            <p className={`text-3xl md:text-4xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {details}

                <button
                    onClick={onRetry}
                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50"
                >
                    Try Again
                </button>
                <a href={backHref} className="text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-zinc-100 transition-all">
                    Back to Menu
                </a>
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
            <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-left text-sm text-zinc-500 dark:text-zinc-400 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold">Words Completed:</span>
                    <span className="font-black text-zinc-800 dark:text-zinc-200">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">Elapsed Time:</span>
                    <span className="font-black text-zinc-800 dark:text-zinc-200">{elapsedTime}s</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">Keystrokes:</span>
                    <span className="font-black text-zinc-800 dark:text-zinc-200">{correctCharCount} correct / {totalTypedCharCount} total</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 flex flex-col gap-4">
            <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-left">SRS Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 text-left">
                <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Retention</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.retentionRate.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Mastered</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.masteredCount}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Due Words</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.dueCount}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Recall Speed</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                        {stats.avgRecallSpeed > 0 ? (stats.avgRecallSpeed / 1000).toFixed(2) + "s" : "-"}
                    </p>
                </div>
            </div>
        </div>
    );
}
