"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculum, syncCurriculumProgressFromDB } from "@/lib/curriculum";
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
                // Fetch progress from Firebase / local storage
                const progData = await syncCurriculumProgressFromDB();
                setProgress(progData);

                // Fetch lessons list
                const list = getCurriculum();
                setLessons(list);

                // Find active lesson (first unmastered lesson)
                const active = list.find(lesson => {
                    const prog = progData[lesson.id];
                    return !prog || prog.status !== "mastered";
                }) || list[list.length - 1] || null;

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
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            borderColor: "border-blue-100 dark:border-blue-900/30",
        },
        {
            title: "Sentences (ฝึกแต่งประโยค)",
            description: "พิมพ์ประโยคสมบูรณ์เพื่อฝึกจังหวะและความลื่นไหล",
            icon: "💬",
            href: "/practice/sentences",
            color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            borderColor: "border-purple-100 dark:border-purple-900/30",
        },
        {
            title: "Build-a-Sentence (ลำดับคำ)",
            description: "เรียงบล็อกคำเป็นประโยคที่ถูกต้องตามแกรมมาร์",
            icon: "🧩",
            href: "/practice/build-sentence",
            color: "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
            borderColor: "border-teal-100 dark:border-teal-900/30",
        },
        {
            title: "AI Coach Tutor (สนทนา AI)",
            description: "ซ้อมสแตนอัพและสนทนาเทคกับบอทพร้อมแนะการแก้ประโยค",
            icon: "🤖",
            href: "/practice/ai-tutor",
            color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
            borderColor: "border-amber-100 dark:border-amber-900/30",
        },
        {
            title: "Monthly Diagnosis (ประเมินทักษะ)",
            description: "วัดผลความแม่นยำและการพิมพ์ตอบโต้ทุกๆ 30 วัน",
            icon: "📊",
            href: "/practice/assessment",
            color: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
            borderColor: "border-indigo-100 dark:border-indigo-900/30",
        },
        {
            title: "Curriculum Lessons (บทเรียนทั้งหมด)",
            description: "ดูแผนการเรียนโครงสร้างหลักสูตร 24 บททั้งหมด",
            icon: "🎓",
            href: "/practice/lessons",
            color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
            borderColor: "border-emerald-100 dark:border-emerald-900/30",
        },
    ];

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center px-[24px] tracking-tight py-12">
                <div className="w-full max-w-2xl flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-32 w-full rounded-3xl" />
                        <Skeleton className="h-32 w-full rounded-3xl" />
                    </div>
                </div>
            </main>
        );
    }

    // Friendly grammar focus string
    const focusTargets = activeLesson
        ? activeLesson.grammar_targets
              .map(t => GRAMMAR_TARGETS_MAP[t] || t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
              .join(', ')
        : "";

    // Determine lesson status text
    const activeLessonProgress = activeLesson ? progress[activeLesson.id] : null;
    const isNew = !activeLessonProgress || activeLessonProgress.status === "available";
    const ctaLabel = isNew ? "เริ่มเรียนวันนี้" : "เรียนต่อวันนี้";

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] tracking-tight py-12">
            <div className="w-full max-w-2xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-none">Today</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        ระบบเลือกแผนการเรียนและการฝึกที่เหมาะสมที่สุดให้แล้วครับ
                    </p>
                </div>

                {/* Main Hero Card: Today's Lesson */}
                {activeLesson && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 dark:from-emerald-600 dark:via-teal-700 dark:to-teal-800 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-teal-500/10 dark:shadow-none flex flex-col gap-6">
                        {/* Background subtle mesh/circles */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-black uppercase tracking-widest bg-white/20 text-white w-fit px-3 py-1 rounded-full">
                                {isNew ? "แนะนำบทเรียนใหม่ 💡" : "กำลังเรียนค้างอยู่ ⚡"}
                            </span>
                            <h2 className="text-3xl font-black leading-tight mt-2">
                                Continue Lesson {activeLesson.id.replace('L', '')} — {activeLesson.title_en}
                            </h2>
                            <p className="text-teal-50 dark:text-teal-100 font-bold text-sm">
                                {activeLesson.title_th}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-xs font-black text-teal-100">
                                <span>⏱️ ใช้เวลาประมาณ {activeLesson.estimated_minutes} นาที</span>
                                <span>•</span>
                                <span>📖 {activeLesson.activities.length} กิจกรรมย่อย</span>
                            </div>

                            <Link
                                href={`/practice/lessons/${activeLesson.id}`}
                                className="w-full py-4 bg-white hover:bg-teal-50 text-teal-900 font-black rounded-2xl text-center shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                            >
                                {ctaLabel}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Today's Tasks Cards */}
                <div className="flex flex-col gap-6">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                        เป้าหมายประจำวันของคุณ
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Daily Review */}
                        <Link
                            href="/practice/words?limit=5"
                            className="group bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/80 p-6 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex flex-col gap-1">
                                <div className="text-2xl">🧠</div>
                                <h4 className="text-base font-black text-zinc-900 dark:text-white mt-2 leading-none">
                                    ทบทวนคำศัพท์
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
                                    ทบทวนคำศัพท์วันนี้ 5 ข้อ
                                </p>
                            </div>
                            <span className="text-[11px] font-black text-blue-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 mt-4">
                                เริ่มทบทวน →
                            </span>
                        </Link>

                        {/* Progress */}
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/80 p-6 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/20 flex flex-col justify-between min-h-[140px]">
                            <div className="flex flex-col gap-1">
                                <div className="text-2xl">📈</div>
                                <h4 className="text-base font-black text-zinc-900 dark:text-white mt-2 leading-none">
                                    ความคืบหน้า
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
                                    สำเร็จ {masteredCount} จาก {lessons.length} บทเรียน
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mt-4">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${(masteredCount / (lessons.length || 1)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Focus */}
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/80 p-6 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/20 flex flex-col min-h-[140px]">
                            <div className="text-2xl">🎯</div>
                            <h4 className="text-base font-black text-zinc-900 dark:text-white mt-2 leading-none">
                                จุดที่กำลังฝึก
                            </h4>
                            <p className="text-zinc-700 dark:text-zinc-300 text-xs font-bold mt-2 leading-snug flex-1">
                                {focusTargets || "ไม่มีข้อมูล"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Collapsible Section "ฝึกเพิ่มเติม" */}
                <div className="flex flex-col">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="w-full flex items-center justify-between p-5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 transition-all font-black text-sm"
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
                                    className="group p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-lg shadow-zinc-200/30 dark:shadow-zinc-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex gap-4 items-start"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${mode.color} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                                        {mode.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors leading-tight">
                                            {mode.title}
                                        </h4>
                                        <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold mt-1 leading-normal">
                                            {mode.description}
                                        </p>
                                    </div>
                                    <span className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors self-center shrink-0">
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
