"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculum, syncCurriculumProgressFromDB, getActiveLesson } from "@/lib/curriculum";
import { Lesson, LessonProgress } from "@/schemas/curriculum.schema";
import { Skeleton } from "@/components/ui/skeleton";

const GRAMMAR_TARGETS_MAP: Record<string, string> = {
    "be": "am/is/are",
    "present_simple": "Present Simple Tense",
    "pronouns": "Pronouns (I, You, We, They, He, She, It)",
    "word_order": "Word Order (S + V + O)",
    "plurals": "Plural Nouns (s/es)",
    "questions": "Yes/No & Wh- Questions",
    "negatives": "Negative Sentences (not / don't / doesn't)",
    "past_simple": "Past Simple Tense (did / regular / irregular)",
    "future_simple": "Future Simple (will / going to)",
    "continuous": "Present Continuous Tense (ing)",
    "connectives": "Connectives (and, but, because, so)",
    "adjectives_adverbs": "Adjectives & Adverbs",
    "polite_requests": "Polite Requests (could, would, please)",
    "small_talk": "Small Talk & Conversation Starter",
    "explaining_functions": "Explaining Functions & Logic",
    "technical_instructions": "Technical Instructions & Documentation",
    "standup_updates": "Stand-up Updates & Status Reports",
    "explaining_bugs": "Explaining Bugs & Issues",
    "project_presentation": "Project Presentation & Demos"
};

export default function PracticeMenuPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const progData = await syncCurriculumProgressFromDB();
                setProgress(progData);

                const list = getCurriculum();
                setLessons(list);

                const active = getActiveLesson();
                setActiveLesson(active);
            } catch (err) {
                console.error("Failed to load curriculum data for Today page:", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const masteredCount = lessons.filter(l => progress[l.id]?.status === "mastered").length;

    const secondaryModes = [
        {
            title: "Vocabulary (คำศัพท์)",
            description: "ฝึกพิมพ์คำศัพท์และทบทวนผ่านระบบ SRS",
            icon: "📖",
            href: "/practice/words",
            color: "text-hume-blue",
        },
        {
            title: "Sentences (ฝึกแต่งประโยค)",
            description: "พิมพ์ประโยคสมบูรณ์เพื่อฝึกจังหวะและความลื่นไหล",
            icon: "💬",
            href: "/practice/sentences",
            color: "text-hume-lavender",
        },
        {
            title: "Build-a-Sentence (ลำดับคำ)",
            description: "เรียงบล็อกคำเป็นประโยคที่ถูกต้องตามแกรมมาร์",
            icon: "🧩",
            href: "/practice/build-sentence",
            color: "text-hume-mint",
        },
        {
            title: "AI Coach Tutor (สนทนา AI)",
            description: "ซ้อมสแตนอัพและสนทนาเทคกับบอทพร้อมแนะการแก้ประโยค",
            icon: "🤖",
            href: "/practice/ai-tutor",
            color: "text-hume-orange",
        },
        {
            title: "Monthly Diagnosis (ประเมินทักษะ)",
            description: "วัดผลความแม่นยำและการพิมพ์ตอบโต้ทุกๆ 30 วัน",
            icon: "📊",
            href: "/practice/assessment",
            color: "text-hume-coral",
        },
        {
            title: "Curriculum Lessons (บทเรียนทั้งหมด)",
            description: "ดูแผนการเรียนโครงสร้างหลักสูตร 24 บททั้งหมด",
            icon: "🎓",
            href: "/practice/lessons",
            color: "text-hume-sky",
        },
    ];

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
                <div className="w-full max-w-2xl flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-48 rounded-xl" />
                        <Skeleton className="h-5 w-64 rounded-xl" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                </div>
            </main>
        );
    }

    const focusTargets = activeLesson
        ? activeLesson.grammar_targets
              .map(t => GRAMMAR_TARGETS_MAP[t] || t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
              .join(', ')
        : "";

    const activeLessonProgress = activeLesson ? progress[activeLesson.id] : null;
    const isNew = !activeLessonProgress || activeLessonProgress.status === "available";
    const ctaLabel = isNew ? "เริ่มเรียนวันนี้" : "เรียนต่อวันนี้";

    return (
        <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
            <div className="w-full max-w-2xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col gap-2 font-display">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Study Hub</span>
                    <h1 className="text-4xl font-semibold text-ink dark:text-canvas-cream leading-none">Today</h1>
                    <p className="text-ink/75 dark:text-canvas-cream/75 font-medium text-sm mt-1">
                        ระบบเลือกแผนการเรียนและการฝึกที่เหมาะสมที่สุดให้แล้วครับ
                    </p>
                </div>

                {/* Main Hero Card: Today's Lesson with Hume Premium Lavender Card style */}
                {activeLesson && (
                    <div className="relative overflow-hidden bg-hume-lavender text-ink rounded-xl p-8 md:p-10 shadow-none flex flex-col gap-6 border border-ink/10">
                        {/* Background subtle elements */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col gap-2 relative z-10">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-ink/10 text-ink w-fit px-3 py-1 rounded-full border border-ink/5">
                                {isNew ? "แนะนำบทเรียนใหม่ 💡" : "กำลังเรียนค้างอยู่ ⚡"}
                            </span>
                            <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight mt-2 text-ink">
                                Continue Lesson {activeLesson.id.replace('L', '')} — {activeLesson.title_en}
                            </h2>
                            <p className="text-ink/80 font-bold text-sm">
                                {activeLesson.title_th}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 mt-2 relative z-10">
                            <div className="flex items-center gap-2 text-xs font-semibold text-ink/70">
                                <span>⏱️ ใช้เวลาประมาณ {activeLesson.estimated_minutes} นาที</span>
                                <span>•</span>
                                <span>📖 {activeLesson.activities.length} กิจกรรมย่อย</span>
                            </div>

                            <Link
                                href={`/practice/lessons/${activeLesson.id}`}
                                className="w-full py-3.5 bg-ink text-canvas-cream font-mono text-xs uppercase tracking-wider font-bold rounded-full text-center transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-none cursor-pointer"
                            >
                                {ctaLabel}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Today's Tasks Cards - Hume card styles */}
                <div className="flex flex-col gap-4">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Daily Missions</span>
                    <h3 className="font-display text-xl font-semibold text-ink dark:text-canvas-cream leading-none">
                        เป้าหมายประจำวันของคุณ
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                        {/* Daily Review */}
                        <Link
                            href="/practice/words?limit=5"
                            className="group bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-xl shadow-none hover:bg-hume-lavender/5 dark:hover:bg-hume-lavender/5 transition-all flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex flex-col gap-1">
                                <div className="text-2xl">🧠</div>
                                <h4 className="font-display text-base font-semibold text-ink dark:text-canvas-cream mt-2 leading-none">
                                    ทบทวนคำศัพท์
                                </h4>
                                <p className="text-ink/60 dark:text-canvas-cream/60 text-xs mt-1 leading-normal">
                                    ทบทวนคำศัพท์วันนี้ 5 ข้อ
                                </p>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-hume-lavender uppercase tracking-wide group-hover:translate-x-1 transition-transform flex items-center gap-1 mt-4">
                                เริ่มทบทวน →
                            </span>
                        </Link>

                        {/* Progress */}
                        <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-xl shadow-none flex flex-col justify-between min-h-[140px]">
                            <div className="flex flex-col gap-1">
                                <div className="text-2xl">📈</div>
                                <h4 className="font-display text-base font-semibold text-ink dark:text-canvas-cream mt-2 leading-none">
                                    ความคืบหน้า
                                </h4>
                                <p className="text-ink/60 dark:text-canvas-cream/60 text-xs mt-1 leading-normal">
                                    สำเร็จ {masteredCount} จาก {lessons.length} บทเรียน
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-canvas-cream dark:bg-black/20 h-1.5 rounded-full overflow-hidden mt-4">
                                <div
                                    className="bg-hume-mint h-full transition-all duration-500"
                                    style={{ width: `${(masteredCount / (lessons.length || 1)) * 100}%` }}
                                  />
                            </div>
                        </div>

                        {/* Current Focus */}
                        <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-xl shadow-none flex flex-col min-h-[140px]">
                            <div className="text-2xl">🎯</div>
                            <h4 className="font-display text-base font-semibold text-ink dark:text-canvas-cream mt-2 leading-none">
                                จุดที่กำลังฝึก
                            </h4>
                            <p className="text-ink/75 dark:text-canvas-cream/80 text-xs font-sans mt-2 leading-relaxed flex-1 overflow-hidden line-clamp-3">
                                {focusTargets || "ไม่มีข้อมูล"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Collapsible Section "ฝึกเพิ่มเติม" */}
                <div className="flex flex-col">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="w-full flex items-center justify-between p-5 bg-canvas-cream dark:bg-black/20 hover:bg-hume-lavender/10 text-ink dark:text-canvas-cream rounded-xl border border-ink/10 dark:border-zinc-800 transition-all font-mono uppercase text-xs tracking-wider font-bold cursor-pointer focus:outline-none"
                    >
                        <span className="flex items-center gap-2">🛠️ ฝึกเพิ่มเติม (เครื่องมือฝึกอิสระ)</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 transition-transform duration-300 ${showMore ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showMore && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-fade-in">
                            {secondaryModes.map((mode, idx) => (
                                <Link
                                    key={idx}
                                    href={mode.href}
                                    className="group p-5 rounded-xl border border-ink/10 dark:border-zinc-800 bg-canvas dark:bg-zinc-900 shadow-none hover:bg-hume-lavender/5 dark:hover:bg-hume-lavender/5 transition-all cursor-pointer flex gap-4 items-start"
                                >
                                    <div className="w-10 h-10 rounded-md bg-canvas-cream dark:bg-black/20 flex items-center justify-center text-xl shrink-0 border border-ink/5 dark:border-zinc-800">
                                        {mode.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className={`text-sm font-bold text-ink dark:text-canvas-cream group-hover:${mode.color} transition-colors leading-tight`}>
                                            {mode.title}
                                        </h4>
                                        <p className="text-ink/65 dark:text-canvas-cream/65 text-xs mt-1 leading-normal">
                                            {mode.description}
                                        </p>
                                    </div>
                                    <span className="text-ink/20 dark:text-canvas-cream/20 group-hover:text-hume-lavender transition-colors self-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
