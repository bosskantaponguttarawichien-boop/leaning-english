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
                const progData = await syncCurriculumProgressFromDB();
                setProgress(progData);

                const list = getCurriculum();
                setLessons(list);

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
            <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-background text-foreground tracking-tight">
                <div className="w-full max-w-4xl flex flex-col gap-6">
                    <Skeleton className="h-10 w-64 rounded-md" />
                    <Skeleton className="h-32 w-full rounded-md" />
                    <Skeleton className="h-64 w-full rounded-md" />
                </div>
            </main>
        );
    }

    const totalLessons = lessons.length;
    const masteredLessons = Object.values(progress).filter(p => p.status === "mastered").length;
    const learningLessons = Object.values(progress).filter(p => p.status === "learning").length;
    const progressPercent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;

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

    const tagColors: Record<string, string> = {
        missing_be: "bg-hume-lavender",
        extra_be: "bg-hume-coral",
        wrong_tense: "bg-hume-orange",
        word_order: "bg-hume-blue",
        missing_article: "bg-hume-pink",
        singular_plural: "bg-hume-mint",
        spelling: "bg-hume-sky",
        reading_error: "bg-hume-magenta",
        grammar_error: "bg-hume-lime"
    };

    const sortedTags = Object.entries(errorTags)
        .filter(([, val]) => val > 0)
        .map(([key, val]) => ({
            key,
            count: val,
            colorClass: tagColors[key] || "bg-hume-lavender",
            ...(tagDetails[key] || {
                label: key,
                desc: "Uncategorized grammar mistake.",
                tip: "Keep practicing!"
            })
        }))
        .sort((a, b) => b.count - a.count);

    const totalErrors = Object.values(errorTags).reduce((a, b) => a + b, 0);

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
                    <h1 className="text-4xl font-semibold text-ink dark:text-canvas-cream mt-2 leading-none">Stats & Progress Dashboard</h1>
                    <p className="text-ink/65 dark:text-canvas-cream/65 font-medium text-sm mt-1">สถิติและผลลัพธ์ความสำเร็จในการเรียนรู้ รวมถึงจุดบกพร่องที่ควรปรับปรุง</p>
                </div>

                {/* Scorecards Grid using Hume rounded-md cards with hairline borders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Mastery Progress</span>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-semibold font-display text-hume-lavender">{progressPercent}%</span>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">completed</span>
                        </div>
                        <div className="w-full bg-canvas-cream dark:bg-black/20 h-1.5 rounded-full overflow-hidden mt-3">
                            <div className="bg-hume-lavender h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    <div className="p-6 rounded-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Lessons Completed</span>
                        <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-4xl font-semibold font-display text-hume-mint">{masteredLessons}</span>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">/ {totalLessons} Mastered</span>
                        </div>
                        <span className="text-[10px] text-ink/50 dark:text-canvas-cream/50 font-sans mt-1">({learningLessons} active lessons)</span>
                    </div>

                    <div className="p-6 rounded-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col justify-between min-h-[140px]">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Total Errors Logged</span>
                        <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-4xl font-semibold font-display text-hume-coral">{totalErrors}</span>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Errors</span>
                        </div>
                        <span className="text-[10px] text-ink/50 dark:text-canvas-cream/50 font-sans mt-1">Across all learning categories</span>
                    </div>
                </div>

                {/* Error Analytics Section: styled as a clean card block */}
                <div className="bg-canvas dark:bg-zinc-900 p-6 md:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6">
                    <div className="font-display">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Mistake aggregates</span>
                        <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-0.5 leading-none">Mistake Analytics</h3>
                        <p className="text-xs text-ink/65 dark:text-canvas-cream/65 mt-1 leading-normal">วิเคราะห์ประเภทข้อผิดพลาดที่เกิดขึ้นบ่อยที่สุดเพื่อแนะแนวทางแก้ไข</p>
                    </div>

                    {sortedTags.length === 0 ? (
                        <div className="p-8 text-center bg-canvas-cream dark:bg-black/10 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none">
                            <span className="text-2xl">🎉</span>
                            <h4 className="text-sm font-bold text-ink dark:text-canvas-cream mt-2">No errors recorded yet!</h4>
                            <p className="text-xs text-ink/50 dark:text-canvas-cream/50 mt-1">Complete lesson exercises or assessment tests to populate analytics data.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {sortedTags.map((tag) => {
                                const maxCount = Math.max(...sortedTags.map(t => t.count));
                                const barPercent = maxCount > 0 ? Math.round((tag.count / maxCount) * 100) : 0;

                                return (
                                    <div key={tag.key} className="flex flex-col gap-2 p-5 bg-canvas-cream dark:bg-black/15 border border-ink/5 dark:border-zinc-800/80 rounded-md shadow-none">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-bold text-ink dark:text-canvas-cream leading-tight">{tag.label}</h4>
                                                <p className="text-xs text-ink/60 dark:text-canvas-cream/60 font-sans mt-0.5">{tag.desc}</p>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border border-ink/10 dark:border-zinc-800 bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream shadow-none">
                                                {tag.count} times
                                            </span>
                                        </div>

                                        <div className="w-full bg-canvas dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div className={`${tag.colorClass} h-full`} style={{ width: `${barPercent}%` }} />
                                        </div>

                                        <div className="mt-2 text-xs font-sans text-ink/75 dark:text-canvas-cream/75 bg-canvas dark:bg-zinc-900 p-3 rounded-md border border-ink/5 dark:border-zinc-800 border-l-2 border-l-hume-lavender">
                                            <strong className="text-hume-lavender font-mono text-[9px] uppercase tracking-wider mr-1">Study Advice:</strong> {tag.tip}
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
