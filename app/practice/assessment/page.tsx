"use client";

import React, { useState } from "react";
import Link from "next/link";
import { speak } from "@/lib/speech";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { auth } from "@/lib/firebase";

interface AssessmentResult {
    date: string;
    precision: number;
    latency: number;
    completion: number;
    overall: number;
}

export default function MonthlyAssessmentPage() {
    const [step, setStep] = useState<"intro" | "listening" | "reading" | "writing" | "speaking" | "result">("intro");
    const [startTime, setStartTime] = useState<number>(0);
    
    // User Answers State
    const [listeningAnswer, setListeningAnswer] = useState("");
    const [readingAnswer, setReadingAnswer] = useState("");
    const [writingText, setWritingText] = useState("");
    const [speakingConfidence, setSpeakingConfidence] = useState(3);
    
    // Results metrics
    const [metrics, setMetrics] = useState<AssessmentResult | null>(null);

    // Audio Play state
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    const playListeningAudio = () => {
        setIsAudioPlaying(true);
        speak("Yesterday, the backend team deployed a new version of the API because the previous database connection dropped frequently.");
        setTimeout(() => {
            setIsAudioPlaying(false);
        }, 5000);
    };

    const handleStart = () => {
        setStartTime(Date.now());
        setStep("listening");
    };

    const handleListeningSubmit = () => {
        if (!listeningAnswer) return;
        setStep("reading");
    };

    const handleReadingSubmit = () => {
        if (!readingAnswer) return;
        setStep("writing");
    };

    const handleWritingSubmit = () => {
        if (writingText.trim().split(/\s+/).length < 4) return;
        setStep("speaking");
    };

    const handleSpeakingSubmit = async () => {
        const end = Date.now();
        
        // Calculate metrics
        const totalDurationSec = Math.round((end - startTime) / 1000);

        // precision: correct listening (backend team) + correct reading (3000 ms)
        let precisionScore = 0;
        if (listeningAnswer === "backend_team") precisionScore += 50;
        if (readingAnswer === "timeout") precisionScore += 50;

        // task completion: writing length and speaking rating
        const wordCount = writingText.trim().split(/\s+/).length;
        const completionScore = Math.min(100, Math.round((wordCount / 20) * 50) + (speakingConfidence * 10));

        const overall = Math.round((precisionScore + completionScore) / 2);

        const newResult: AssessmentResult = {
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
            precision: precisionScore,
            latency: totalDurationSec,
            completion: completionScore,
            overall: overall,
        };

        setMetrics(newResult);
        setStep("result");

        // Sync to firebase DB if logged in
        try {
            const user = auth.currentUser;
            if (user) {
                const resultsRef = ref(db, `users/${user.uid}/assessments`);
                const newRecordRef = push(resultsRef);
                await set(newRecordRef, {
                    ...newResult,
                    timestamp: Date.now(),
                });
            } else {
                // local storage fallback
                const list = JSON.parse(localStorage.getItem("assessments") || "[]");
                list.push(newResult);
                localStorage.setItem("assessments", JSON.stringify(list));
            }
        } catch (error) {
            console.error("Failed to save assessment results:", error);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] py-12 tracking-tight">
            <div className="w-full max-w-2xl flex flex-col gap-8 flex-1 justify-center">
                
                {/* INTRO STEP */}
                {step === "intro" && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 text-center">
                        <div className="flex flex-col gap-2">
                            <span className="text-4xl">📊</span>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white mt-2">Monthly Diagnosis Test</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                                Measure your comprehensibility, response latency, and grammatical precision across five core areas.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-left mt-2">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">🔍 Real-time checks</h4>
                                <p className="text-xs font-semibold text-zinc-400 mt-1">Listening, reading, writing, and speaking self-evaluation.</p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">⏱️ Latency tracking</h4>
                                <p className="text-xs font-semibold text-zinc-400 mt-1">Measures how quickly you parse and formulate responses.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-700/50 pt-6">
                            <Link href="/practice" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold text-sm">
                                ← Cancel
                            </Link>
                            <button
                                onClick={handleStart}
                                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                            >
                                Start Assessment
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 1: LISTENING */}
                {step === "listening" && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Step 1 of 4 • Listening</span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">Who completed the action?</h2>
                            <p className="text-sm font-semibold text-zinc-500 mt-1">Listen to the spoken audio description and identify the correct actor.</p>
                        </div>

                        <div className="flex flex-col items-center py-4 gap-2">
                            <button
                                onClick={playListeningAudio}
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg border hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                    isAudioPlaying ? "bg-blue-100 border-blue-200 text-blue-600 animate-pulse" : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                                }`}
                            >
                                {isAudioPlaying ? "🔊" : "▶️"}
                            </button>
                            <span className="text-xs font-bold text-zinc-400">Click to listen</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {[
                                { id: "backend_team", label: "The backend team" },
                                { id: "frontend_team", label: "The frontend team" },
                                { id: "qa_engineers", label: "The QA engineers" },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setListeningAnswer(opt.id)}
                                    className={`w-full text-left p-4 rounded-xl border text-sm font-bold transition-all ${
                                        listeningAnswer === opt.id
                                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-400"
                                            : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-end">
                            <button
                                disabled={!listeningAnswer}
                                onClick={handleListeningSubmit}
                                className={`px-8 py-3.5 font-black text-sm rounded-2xl transition-all ${
                                    listeningAnswer ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: READING */}
                {step === "reading" && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Step 2 of 4 • Reading</span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">Analyze code constraints</h2>
                            <p className="text-sm font-semibold text-zinc-500 mt-1">Read the technical comment block and select the correct timeout duration.</p>
                        </div>

                        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {`/**\n * Fetches the user session payload.\n * Returns a cached session state if available.\n * Raises a Gateway Timeout Exception if the DB responds longer than 3000ms.\n */`}
                        </div>

                        <div className="flex flex-col gap-2">
                            {[
                                { id: "3000ms", label: "Gateway Timeout triggers when database response takes longer than 3000ms" },
                                { id: "cached", label: "The database returns cache if session takes longer than 3000ms" },
                                { id: "timeout", label: "The database connection drops after 5 minutes" },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setReadingAnswer(opt.id)}
                                    className={`w-full text-left p-4 rounded-xl border text-sm font-bold transition-all ${
                                        readingAnswer === opt.id
                                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-400"
                                            : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-end">
                            <button
                                disabled={!readingAnswer}
                                onClick={handleReadingSubmit}
                                className={`px-8 py-3.5 font-black text-sm rounded-2xl transition-all ${
                                    readingAnswer ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: WRITING */}
                {step === "writing" && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Step 3 of 4 • Writing</span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">Daily Stand-up Writing</h2>
                            <p className="text-sm font-semibold text-zinc-500 mt-1">Compose your daily stand-up update describing yesterday, today, and any blockers.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <textarea
                                value={writingText}
                                onChange={(e) => setWritingText(e.target.value)}
                                placeholder="Yesterday, I finished... Today, I am going to... I do not have any blockers..."
                                rows={5}
                                className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-sm font-medium focus:outline-none transition-all resize-none"
                            />
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
                                <span>Minimum 4 words required</span>
                                <span>Words: {writingText.trim() === "" ? 0 : writingText.trim().split(/\s+/).length}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-end">
                            <button
                                disabled={writingText.trim().split(/\s+/).length < 4}
                                onClick={handleWritingSubmit}
                                className={`px-8 py-3.5 font-black text-sm rounded-2xl transition-all ${
                                    writingText.trim().split(/\s+/).length >= 4 ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SPEAKING */}
                {step === "speaking" && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Step 4 of 4 • Speaking Self-Assessment</span>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">Talk about your project</h2>
                            <p className="text-sm font-semibold text-zinc-500 mt-1">Speak aloud explaining a technical database trade-off or coding problem you solved recently.</p>
                        </div>

                        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col gap-2">
                            <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">Rate your spoken fluency and confidence:</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setSpeakingConfidence(star)}
                                        className={`text-3xl cursor-pointer hover:scale-115 active:scale-95 transition-all ${
                                            star <= speakingConfidence ? "text-yellow-400 animate-pulse" : "text-zinc-200 dark:text-zinc-700"
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="text-xs font-black text-zinc-400 ml-1">({speakingConfidence} / 5 stars)</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-end">
                            <button
                                onClick={handleSpeakingSubmit}
                                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Complete Test
                            </button>
                        </div>
                    </div>
                )}

                {/* DIAGNOSTIC RESULT PANEL */}
                {step === "result" && metrics && (
                    <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
                        <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-3xl">🏆</span>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">Diagnostic Report</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Saved successfully on {metrics.date}</p>
                        </div>

                        {/* Metric Results Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-center">
                                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Grammatical Precision</h4>
                                <span className="text-3xl font-black text-zinc-900 dark:text-white block mt-1">{metrics.precision}%</span>
                            </div>

                            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center">
                                <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Task Completion</h4>
                                <span className="text-3xl font-black text-zinc-900 dark:text-white block mt-1">{metrics.completion}%</span>
                            </div>

                            <div className="p-5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl text-center">
                                <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Response Latency</h4>
                                <span className="text-3xl font-black text-zinc-900 dark:text-white block mt-1">{metrics.latency}s</span>
                            </div>

                            <div className="p-5 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl text-center">
                                <h4 className="text-xs font-black uppercase text-yellow-600 dark:text-yellow-400 tracking-wider">Overall Score</h4>
                                <span className="text-3xl font-black text-zinc-900 dark:text-white block mt-1">{metrics.overall}%</span>
                            </div>
                        </div>

                        {/* Back actions */}
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    setStep("intro");
                                    setListeningAnswer("");
                                    setReadingAnswer("");
                                    setWritingText("");
                                    setSpeakingConfidence(3);
                                }}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                Restart Diagnostic ↺
                            </button>
                            <Link
                                href="/practice"
                                className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                            >
                                Back to practice menu
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
