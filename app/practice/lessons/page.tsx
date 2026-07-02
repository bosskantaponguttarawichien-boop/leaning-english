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
            <main className="flex min-h-screen flex-col items-center px-[24px] py-12 tracking-tight">
                <div className="w-full max-w-4xl flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] py-12 tracking-tight">
            <div className="w-full max-w-4xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Link href="/practice" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-xl font-bold flex items-center gap-1">
                            ← Back
                        </Link>
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-none mt-2">Curriculum Lessons</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Follow this step-by-step path to master conversational & coding English.</p>
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

                        let badgeColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400";
                        let badgeLabel = "Locked 🔒";

                        if (isMastered) {
                            badgeColor = "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30";
                            badgeLabel = "Mastered ✅";
                        } else if (isAvailable) {
                            badgeColor = "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
                            badgeLabel = "Available 📖";
                        }

                        const cardContent = (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs uppercase tracking-widest font-black text-zinc-400">{lesson.id} • {lesson.level}</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${badgeColor}`}>{badgeLabel}</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                                        {lesson.title_en}
                                    </h3>
                                    <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                                        {lesson.title_th}
                                    </h4>
                                </div>
                                <div className="flex-1 flex flex-col gap-2 mt-2">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Goals:</h5>
                                    <ul className="text-xs font-medium text-zinc-600 dark:text-zinc-300 list-disc list-inside flex flex-col gap-1">
                                        {lesson.goals.slice(0, 2).map((goal, idx) => (
                                            <li key={idx} className="truncate">{goal}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-between items-center text-xs font-bold text-zinc-400">
                                    <span>⏱️ {lesson.estimated_minutes} mins</span>
                                    {!isLocked && (
                                        <span className="text-blue-500 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
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
                                    className="p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-850 opacity-55 cursor-not-allowed select-none shadow-sm"
                                >
                                    {cardContent}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={lesson.id}
                                href={`/practice/lessons/${lesson.id}`}
                                className="group p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-zinc-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
