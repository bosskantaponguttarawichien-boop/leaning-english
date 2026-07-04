"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getCurriculum, getLessonProgress, updateLessonProgress, logLessonError, syncCurriculumProgressFromDB } from "@/lib/curriculum";
import { Lesson } from "@/schemas/curriculum.schema";
import { Skeleton } from "@/components/ui/skeleton";
import SessionCompleteModal from "@/components/SessionCompleteModal";

// Activity Subcomponents
import ConceptActivity from "./components/ConceptActivity";
import ClassifyActivity from "./components/ClassifyActivity";
import FillBlankActivity from "./components/FillBlankActivity";
import ReorderActivity from "./components/ReorderActivity";
import GuidedOutputActivity from "./components/GuidedOutputActivity";
import DictationActivity from "./components/DictationActivity";
import ReadingActivity from "./components/ReadingActivity";

interface LessonPageProps {
    params: Promise<{ id: string }>;
}

export default function LessonActivePage({ params }: LessonPageProps) {
    const { id } = use(params);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [activityIndex, setActivityIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Track performance metrics
    const [sessionErrorCount, setSessionErrorCount] = useState(0);
    const [speakingConfidence, setSpeakingConfidence] = useState(3);

    useEffect(() => {
        const init = async () => {
            try {
                // Sync from Firebase DB to local cache first
                await syncCurriculumProgressFromDB();

                const list = getCurriculum();
                const found = list.find(l => l.id === id);
                if (found) {
                    setLesson(found);
                    // Update progress status to learning if not already finished
                    const progress = getLessonProgress(id);
                    if (progress.status === "available" || progress.status === "locked") {
                        await updateLessonProgress(id, { status: "learning" });
                    }
                }
            } catch (err) {
                console.error("Failed to load active lesson:", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [id]);

    const handleActivityComplete = async (metrics?: { errors?: number; confidence?: number }) => {
        if (metrics?.errors) {
            setSessionErrorCount(prev => prev + metrics.errors!);
        }
        if (metrics?.confidence) {
            setSpeakingConfidence(metrics.confidence);
        }

        if (lesson && activityIndex + 1 < lesson.activities.length) {
            setActivityIndex(prev => prev + 1);
        } else {
            // End of lesson
            setIsFinished(true);
            try {
                const currentProg = getLessonProgress(id);
                const totalActivities = lesson?.activities.length || 1;
                // Simple calculation: recognition accuracy decreases as error count increases
                const recognitionAccuracy = Math.max(0.2, 1 - (sessionErrorCount / (totalActivities * 3)));
                
                await updateLessonProgress(id, {
                    status: "mastered",
                    attempts: currentProg.attempts + 1,
                    recognitionAccuracy: Math.round(recognitionAccuracy * 100),
                    speakingConfidence: metrics?.confidence || speakingConfidence,
                });
            } catch (error) {
                console.error("Failed to update mastered progress status:", error);
            }
        }
    };

    const handleErrorLogged = async (errorTag: string) => {
        try {
            await logLessonError(id, errorTag);
        } catch (error) {
            console.error("Failed to log error tag to curriculum data:", error);
        }
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-12">
                <div className="w-full max-w-2xl flex flex-col gap-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>
            </main>
        );
    }

    if (!lesson) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-12">
                <div className="text-center flex flex-col gap-4">
                    <h2 className="text-2xl font-black text-zinc-950 dark:text-white">Lesson not found.</h2>
                    <Link href="/practice" className="text-blue-500 font-bold hover:underline">
                        Return to Today Page
                    </Link>
                </div>
            </main>
        );
    }

    const currentActivity = lesson.activities[activityIndex];

    const renderActivity = () => {
        switch (currentActivity.type) {
            case "concept":
                return (
                    <ConceptActivity
                        activity={currentActivity}
                        onComplete={() => handleActivityComplete()}
                    />
                );
            case "classify":
                return (
                    <ClassifyActivity
                        activity={currentActivity}
                        onComplete={(errors) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "fill_blank":
                return (
                    <FillBlankActivity
                        activity={currentActivity}
                        onComplete={(errors) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "reorder":
                return (
                    <ReorderActivity
                        activity={currentActivity}
                        onComplete={(errors) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "dictation":
                return (
                    <DictationActivity
                        activity={currentActivity}
                        onComplete={(errors: number) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "reading":
                return (
                    <ReadingActivity
                        activity={currentActivity}
                        onComplete={(errors: number) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "transform":
                // Transform uses FillBlank logic with sentence transformation prompt
                return (
                    <FillBlankActivity
                        activity={currentActivity}
                        onComplete={(errors) => handleActivityComplete({ errors })}
                        onErrorLogged={handleErrorLogged}
                    />
                );
            case "guided_output":
                return (
                    <GuidedOutputActivity
                        activity={currentActivity}
                        onComplete={(confidence) => handleActivityComplete({ confidence })}
                    />
                );
            default:
                return (
                    <div className="p-8 text-center bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                        <p className="text-zinc-500 font-bold">Unsupported activity type: {currentActivity.type}</p>
                        <button
                            onClick={() => handleActivityComplete()}
                            className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-2xl font-bold"
                        >
                            Skip Activity
                        </button>
                    </div>
                );
        }
    };

    const nextLessonId = (() => {
        if (!lesson) return null;
        const list = getCurriculum();
        const index = list.findIndex(l => l.id === lesson.id);
        if (index !== -1 && index + 1 < list.length) {
            return list[index + 1].id;
        }
        return null;
    })();

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] py-12 relative">
            {isFinished && (
                <SessionCompleteModal
                    stats={[
                        { label: "Lesson Completed", value: lesson.title_en, color: "text-zinc-900 dark:text-white" },
                        { label: "Errors Logged", value: sessionErrorCount, color: "text-red-500 font-bold" },
                        { label: "Confidence", value: `${speakingConfidence} / 5 ⭐️`, color: "text-yellow-500" },
                    ]}
                    onRetry={() => window.location.reload()}
                    backHref="/practice"
                    details={
                        <div className="w-full flex flex-col gap-2 mb-2">
                            {nextLessonId && (
                                <Link
                                    href={`/practice/lessons/${nextLessonId}`}
                                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                                >
                                    เรียนบทถัดไป (Next Lesson) ➡️
                                </Link>
                            )}
                            <Link
                                href={`/practice/ai-tutor?scenario=${lesson.id === "L21" ? "standup" : lesson.id === "L22" ? "bug" : lesson.id === "L23" ? "tradeoff" : "standup"}`}
                                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                            >
                                💬 สนทนาท้ายบทกับ AI Coach
                            </Link>
                        </div>
                    }
                />
            )}

            <div className={`w-full max-w-2xl flex flex-col gap-6 flex-1 ${isFinished ? "pointer-events-none opacity-50 blur-sm transition-all duration-300" : ""}`}>
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs uppercase tracking-widest font-black text-zinc-400">
                        <span>{lesson.id} • Activity {activityIndex + 1} of {lesson.activities.length}</span>
                        <Link href="/practice" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors">
                            Exit ✕
                        </Link>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${((activityIndex) / lesson.activities.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Activity Area */}
                <div className="flex-1 flex flex-col justify-center">
                    {renderActivity()}
                </div>
            </div>
        </main>
    );
}
