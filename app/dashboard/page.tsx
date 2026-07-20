"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculum, syncCurriculumProgressFromDB } from "@/lib/curriculum";
import { Lesson, LessonProgress } from "@/schemas/curriculum.schema";
import BackupManager from "@/components/BackupManager";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsDashboardPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
    const [errorTags, setErrorTags] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch progress from Firebase / local storage
                const progData = await syncCurriculumProgressFromDB();
                setProgress(progData);

                // Load lessons list
                const list = getCurriculum();
                setLessons(list);

                // Aggregate error tags from all lesson progresses
                const aggregatedErrorTags: Record<string, number> = {};
                Object.values(progData).forEach(prog => {
                    if (prog.errorTags) {
                        Object.entries(prog.errorTags).forEach(([tag, count]) => {
                            aggregatedErrorTags[tag] = (aggregatedErrorTags[tag] || 0) + count;
                        });
                    }
                });
                setErrorTags(aggregatedErrorTags);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-12">
                <div className="w-full max-w-4xl flex flex-col gap-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>
            </main>
        );
    }

    // Calculations
    const totalLessons = lessons.length;
    const masteredLessons = Object.values(progress).filter(p => p.status === "mastered").length;
    const learningLessons = Object.values(progress).filter(p => p.status === "learning").length;
    const progressPercent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;

    // Error tags mapping with labels & helpful advice
    const tagDetails: Record<string, { label: string; desc: string; tip: string }> = {
        missing_be: {
            label: "Missing Auxiliary 'Be'",
            desc: "Forgetting am/is/are (e.g. 'I developer' instead of 'I am a developer').",
            tip: "Review Lesson L01 'Be or Do' and focus on state/identity sentences."
        },
        extra_be: {
            label: "Extra Auxiliary 'Be'",
            desc: "Using am/is/are before active actions (e.g. 'I am write code' instead of 'I write code').",
            tip: "Review Lesson L01. Do not use 'am' before action verbs in present simple."
        },
        wrong_tense: {
            label: "Verb Tense Confusion",
            desc: "Mixing past simple, present, or future plans verb conjugation forms.",
            tip: "Practice L04 (Present Simple), L09 (Regular Past), and L10 (Irregular Past)."
        },
        word_order: {
            label: "Word Order & Syntax",
            desc: "Incorrect positioning of subjects, verbs, time words, or adjectives.",
            tip: "Review L02 (Subject + Verb + Detail) and L14 (Adjectives & Adverbs)."
        },
        missing_article: {
            label: "Missing Article a/an",
            desc: "Missing singular nouns indicators before occupation or objects.",
            tip: "Review L03. Always write a/an before singular countable nouns (e.g. a developer)."
        },
        singular_plural: {
            label: "Singular / Plural Forms",
            desc: "Forgetting the 's' ending on plural nouns.",
            tip: "Practice Lesson L03 'Singular and Plural' noun rules."
        },
        spelling: {
            label: "Spelling Typo",
            desc: "Mistyping vocabulary words or punctuation symbols.",
            tip: "Focus on character typing accuracy in vocab mode."
        },
        reading_error: {
            label: "Reading Comprehension",
            desc: "Misunderstanding requirements or details in technical documentation texts.",
            tip: "Review L19 and L20. Highlight actors, actions, and constraints."
        },
        grammar_error: {
            label: "General Grammar Error",
            desc: "General syntax configuration error.",
            tip: "Focus on structured lesson exercises."
        }
    };

    // Sort error tags by frequency
    const sortedTags = Object.entries(errorTags)
        .filter(([, val]) => val > 0)
        .map(([key, val]) => ({
            key,
            count: val,
            ...(tagDetails[key] || {
                label: key,
                desc: "Uncategorized grammar mistake.",
                tip: "Keep practicing!"
            })
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] py-12 tracking-tight">
            <div className="w-full max-w-4xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col gap-2 font-display">
                    <div className="flex items-center gap-3">
                        <Link href="/practice" className="text-primary-action-blue hover:text-primary-action-blue-focus transition-colors text-sm font-semibold flex items-center gap-1">
                            ← Back to Today
                        </Link>
                    </div>
                    <h1 className="text-4xl font-semibold text-ink dark:text-white mt-2">Stats & Progress Dashboard</h1>
                    <p className="text-ink-secondary dark:text-zinc-400 font-medium text-sm">สถิติและผลลัพธ์ความสำเร็จในการเรียนรู้ รวมถึงจุดบกพร่องที่ควรปรับปรุง</p>
                </div>

                {/* Scorecards Grid using rounded-sm (10px) parchment card geometry with no shadows */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-sm bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-xs uppercase tracking-widest font-semibold text-ink-secondary dark:text-zinc-400">Mastery Progress</span>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-semibold font-display text-ink dark:text-white">{progressPercent}%</span>
                            <span className="text-xs font-semibold text-ink-muted dark:text-zinc-500">completed</span>
                        </div>
                        <div className="w-full bg-canvas-parchment dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    <div className="p-6 rounded-sm bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-xs uppercase tracking-widest font-semibold text-ink-secondary dark:text-zinc-400">Lessons Completed</span>
                        <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-4xl font-semibold font-display text-emerald-500">{masteredLessons}</span>
                            <span className="text-xs font-semibold text-ink-muted dark:text-zinc-500">/ {totalLessons} Mastered</span>
                        </div>
                        <span className="text-[11px] text-ink-muted dark:text-zinc-500 font-semibold mt-1">({learningLessons} active lessons)</span>
                    </div>

                    <div className="p-6 rounded-sm bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-xs uppercase tracking-widest font-semibold text-ink-secondary dark:text-zinc-400">Total Errors Logged</span>
                        <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-4xl font-semibold font-display text-brand-music-red">
                                {Object.values(errorTags).reduce((a, b) => a + b, 0)}
                            </span>
                            <span className="text-xs font-semibold text-ink-muted dark:text-zinc-500">Errors</span>
                        </div>
                        <span className="text-[11px] text-ink-muted dark:text-zinc-500 font-semibold mt-1">Across all learning categories</span>
                    </div>
                </div>

                {/* Error Analytics Section: styled as a clean card block */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-sm border border-hairline dark:border-zinc-800 shadow-none flex flex-col gap-6">
                    <div className="font-display">
                        <h3 className="text-2xl font-semibold text-ink dark:text-white">Mistake Analytics</h3>
                        <p className="text-xs font-semibold text-ink-secondary dark:text-zinc-400 mt-1">วิเคราะห์ประเภทข้อผิดพลาดที่เกิดขึ้นบ่อยที่สุดเพื่อแนะแนวทางแก้ไข</p>
                    </div>

                    {sortedTags.length === 0 ? (
                        <div className="p-8 text-center bg-canvas-parchment dark:bg-zinc-900/30 rounded-sm border border-hairline dark:border-zinc-800">
                            <span className="text-2xl">🎉</span>
                            <h4 className="text-sm font-bold text-ink dark:text-white mt-2">No errors recorded yet!</h4>
                            <p className="text-xs font-semibold text-ink-muted dark:text-zinc-500 mt-1">Complete lesson exercises or assessment tests to populate analytics data.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {sortedTags.map((tag) => {
                                const maxCount = Math.max(...sortedTags.map(t => t.count));
                                const barPercent = maxCount > 0 ? Math.round((tag.count / maxCount) * 100) : 0;

                                return (
                                    <div key={tag.key} className="flex flex-col gap-2 p-5 bg-canvas-parchment dark:bg-zinc-900/30 border border-hairline dark:border-zinc-800 rounded-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-bold text-ink dark:text-white">{tag.label}</h4>
                                                <p className="text-xs text-ink-muted dark:text-zinc-500 font-semibold mt-0.5">{tag.desc}</p>
                                            </div>
                                            <span className="text-xs font-bold text-brand-music-red bg-brand-music-red/10 border border-brand-music-red/20 px-2.5 py-1 rounded-pill">{tag.count} times</span>
                                        </div>

                                        <div className="w-full bg-white dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-1">
                                            <div className="bg-brand-music-red h-full" style={{ width: `${barPercent}%` }} />
                                        </div>

                                        <div className="mt-2 text-xs font-semibold text-ink-secondary dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2.5 rounded-sm border border-hairline dark:border-zinc-800/80 border-l-2 border-l-primary-action-blue">
                                            <strong className="text-primary-action-blue">Study Advice: </strong> {tag.tip}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Backup Recovery Control Component */}
                <BackupManager />
            </div>
        </main>
    );
}
