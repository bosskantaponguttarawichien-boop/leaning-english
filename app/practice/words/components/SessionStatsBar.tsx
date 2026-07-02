"use client";

import React from "react";
import { DifficultyMode } from "@/components/WordCard";
import { SRSStats } from "@/lib/srs";

interface SessionStatsBarProps {
    difficultyMode: DifficultyMode;
    currentIndex: number;
    wordCount: number;
    realtimeWpm: number;
    realtimeAccuracy: number;
    stats: SRSStats | null;
}

function Divider() {
    return <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />;
}

function StatItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{value}</span>
        </div>
    );
}

export default function SessionStatsBar({ difficultyMode, currentIndex, wordCount, realtimeWpm, realtimeAccuracy, stats }: SessionStatsBarProps) {
    return (
        <div className="flex w-full items-center justify-between sm:justify-start gap-4 sm:gap-16">
            {difficultyMode === "typing" ? (
                <>
                    <StatItem label="WPM" value={realtimeWpm} />
                    <Divider />
                    <StatItem label="Accuracy" value={`${realtimeAccuracy}%`} />
                    <Divider />
                    <StatItem label="Progress" value={`${currentIndex + 1} / ${wordCount}`} />
                </>
            ) : (
                <>
                    <StatItem label="Session Progress" value={`${currentIndex + 1} / ${wordCount}`} />
                    {stats && (
                        <>
                            <Divider />
                            <StatItem label="Total Mastery" value={stats.masteredCount} />
                            <Divider />
                            <StatItem label="Retention" value={`${stats.retentionRate.toFixed(0)}%`} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
