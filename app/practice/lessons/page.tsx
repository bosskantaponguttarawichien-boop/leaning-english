"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculum, syncCurriculumProgressFromDB } from "@/lib/curriculum";
import { Lesson, LessonProgress } from "@/schemas/curriculum.schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonsCatalogPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // Load catalog structure
                const list = getCurriculum();
                setLessons(list);

                // Fetch student progress from DB / storage
                const progData = await syncCurriculumProgressFromDB();
                setProgress(progData);
            } catch (err) {
                console.error("Failed to load curriculum catalog:", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
                <div className="w-full max-w-4xl flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-5 w-48 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-64 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
            <div className="w-full max-w-4xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col gap-2 font-display">
                    <div className="flex items-center gap-3">
                        <Link href="/practice" className="font-mono text-xs uppercase tracking-wider font-semibold text-hume-lavender hover:opacity-80 transition-opacity flex items-center gap-1">
                            ← Back to Today
                        </Link>
                    </div>
                    <h1 className="text-4xl font-semibold text-ink dark:text-canvas-cream mt-2 leading-none">Curriculum Lessons</h1>
                    <p className="text-ink/65 dark:text-canvas-cream/65 font-medium text-sm mt-1">Follow this step-by-step path to master conversational & coding English.</p>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lessons.map((lesson) => {
                        const lessonProg = progress[lesson.id];
                        const isLocked = lesson.id === "L01"
                            ? (lessonProg?.status === "locked")
                            : (!lessonProg || lessonProg.status === "locked");
                        const isMastered = lessonProg?.status === "mastered";
                        const isAvailable = lesson.id === "L01"
                            ? (!lessonProg || lessonProg.status === "available" || lessonProg.status === "learning" || lessonProg.status === "review")
                            : (lessonProg?.status === "available" || lessonProg?.status === "learning" || lessonProg?.status === "review");

                        let badgeColor = "bg-ink/5 dark:bg-canvas-cream/5 text-ink/40 dark:text-canvas-cream/40";
                        let badgeLabel = "Locked 🔒";

                        if (isMastered) {
                            badgeColor = "bg-hume-mint/15 text-hume-mint font-bold border border-hume-mint/10";
                            badgeLabel = "Mastered ✅";
                        } else if (isAvailable) {
                            badgeColor = "bg-hume-lavender/15 text-hume-lavender font-bold border border-hume-lavender/10";
                            badgeLabel = "Available 📖";
                        }

                        const cardContent = (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">{lesson.id} • {lesson.level}</span>
                                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badgeLabel}</span>
                                </div>
                                <div className="font-display">
                                    <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream group-hover:text-hume-lavender transition-colors leading-tight">
                                        {lesson.title_en}
                                    </h3>
                                    <h4 className="text-sm font-semibold text-ink/70 dark:text-canvas-cream/70 mt-1 leading-snug">
                                        {lesson.title_th}
                                    </h4>
                                </div>
                                <div className="flex-1 flex flex-col gap-2 mt-2 font-sans">
                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/50 dark:text-canvas-cream/50">Goals:</h5>
                                    <ul className="text-xs text-ink/75 dark:text-canvas-cream/75 list-disc list-inside flex flex-col gap-1">
                                        {lesson.goals.slice(0, 2).map((goal, idx) => (
                                            <li key={idx} className="truncate">{goal}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono font-bold uppercase text-ink/50 dark:text-canvas-cream/50">
                                    <span>⏱️ {lesson.estimated_minutes} mins</span>
                                    {!isLocked && (
                                        <span className="text-hume-lavender group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                                            Start Lesson →
                                        </span>
                                    )}
                                </div>
                            </div>
                        );

                        if (isLocked) {
                            return (
                                <div
                                    key={lesson.id}
                                    className="p-8 rounded-xl border border-ink/10 dark:border-zinc-800 bg-canvas/50 dark:bg-zinc-900/50 opacity-55 cursor-not-allowed select-none shadow-none"
                                >
                                    {cardContent}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={lesson.id}
                                href={`/practice/lessons/${lesson.id}`}
                                className="group p-8 rounded-xl border border-ink/10 dark:border-zinc-800 bg-canvas dark:bg-zinc-900 shadow-none hover:bg-hume-lavender/5 dark:hover:bg-hume-lavender/5 transition-all cursor-pointer"
                            >
                                {cardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
