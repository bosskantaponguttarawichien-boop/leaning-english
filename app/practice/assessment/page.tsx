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
        <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
            <div className="w-full max-w-2xl flex flex-col gap-8 flex-1 justify-center">
                
                {/* INTRO STEP */}
                {step === "intro" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 text-center">
                        <div className="flex flex-col gap-2">
                            <span className="text-4xl">📊</span>
                            <h1 className="text-3xl font-semibold text-ink dark:text-canvas-cream mt-2 font-display leading-none">Monthly Diagnosis Test</h1>
                            <p className="text-ink/65 dark:text-canvas-cream/65 font-medium text-sm mt-1">
                                Measure your comprehensibility, response latency, and grammatical precision across five core areas.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-left mt-2">
                            <div className="p-4 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md">
                                <h4 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">🔍 Real-time checks</h4>
                                <p className="text-xs text-ink/50 dark:text-canvas-cream/50 mt-1">Listening, reading, writing, and speaking self-evaluation.</p>
                            </div>
                            <div className="p-4 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md">
                                <h4 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">⏱️ Latency tracking</h4>
                                <p className="text-xs text-ink/50 dark:text-canvas-cream/50 mt-1">Measures how quickly you parse and formulate responses.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center border-t border-ink/5 dark:border-zinc-800 pt-6">
                            <Link href="/practice" className="font-mono text-xs uppercase tracking-wider font-semibold text-hume-lavender hover:opacity-85 transition-opacity">
                                ← Cancel
                            </Link>
                            <button
                                onClick={handleStart}
                                className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                            >
                                Start Assessment
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 1: LISTENING */}
                {step === "listening" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Step 1 of 4 • Listening</span>
                            <h2 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display leading-tight">Who completed the action?</h2>
                            <p className="text-sm text-ink/65 dark:text-canvas-cream/65 mt-1">Listen to the spoken audio description and identify the correct actor.</p>
                        </div>

                        <div className="flex flex-col items-center py-4 gap-2">
                            <button
                                onClick={playListeningAudio}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-none border hover:opacity-90 active:scale-95 transition-all cursor-pointer focus:outline-none ${
                                    isAudioPlaying ? "bg-hume-lavender/20 border-hume-lavender/30 text-hume-lavender animate-pulse" : "bg-canvas-cream dark:bg-black/20 border-ink/10 dark:border-zinc-800 text-ink dark:text-canvas-cream"
                                }`}
                            >
                                {isAudioPlaying ? "🔊" : "▶️"}
                            </button>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Click to listen</span>
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
                                    className={`w-full text-left p-4 rounded-md border text-sm font-bold transition-all cursor-pointer focus:outline-none ${
                                        listeningAnswer === opt.id
                                            ? "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender"
                                            : "bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800 hover:bg-ink/5 dark:hover:bg-canvas-cream/5"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                            <button
                                disabled={!listeningAnswer}
                                onClick={handleListeningSubmit}
                                className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                    listeningAnswer ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-98 hover:opacity-90" : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: READING */}
                {step === "reading" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Step 2 of 4 • Reading</span>
                            <h2 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display leading-tight">Analyze code constraints</h2>
                            <p className="text-sm text-ink/65 dark:text-canvas-cream/65 mt-1">Read the technical comment block and select the correct timeout duration.</p>
                        </div>

                        <div className="p-5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md font-mono text-xs text-ink/80 dark:text-canvas-cream/80 leading-relaxed">
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
                                    className={`w-full text-left p-4 rounded-md border text-sm font-bold transition-all cursor-pointer focus:outline-none ${
                                        readingAnswer === opt.id
                                            ? "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender"
                                            : "bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800 hover:bg-ink/5 dark:hover:bg-canvas-cream/5"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                            <button
                                disabled={!readingAnswer}
                                onClick={handleReadingSubmit}
                                className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                    readingAnswer ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-98 hover:opacity-90" : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: WRITING */}
                {step === "writing" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Step 3 of 4 • Writing</span>
                            <h2 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display leading-tight">Daily Stand-up Writing</h2>
                            <p className="text-sm text-ink/65 dark:text-canvas-cream/65 mt-1">Compose your daily stand-up update describing yesterday, today, and any blockers.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <textarea
                                value={writingText}
                                onChange={(e) => setWritingText(e.target.value)}
                                placeholder="Yesterday, I finished... Today, I am going to... I do not have any blockers..."
                                rows={5}
                                className="w-full p-4 bg-canvas dark:bg-zinc-950 border border-ink/10 dark:border-zinc-800 focus:border-hume-lavender rounded-md text-sm font-medium focus:outline-none transition-all resize-none text-ink dark:text-canvas-cream focus:ring-0"
                            />
                            <div className="flex justify-between items-center font-mono text-[10px] text-ink/50 dark:text-canvas-cream/50 px-1">
                                <span>Minimum 4 words required</span>
                                <span>Words: {writingText.trim() === "" ? 0 : writingText.trim().split(/\s+/).length}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                            <button
                                disabled={writingText.trim().split(/\s+/).length < 4}
                                onClick={handleWritingSubmit}
                                className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                    writingText.trim().split(/\s+/).length >= 4 ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-98 hover:opacity-90" : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                                }`}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SPEAKING */}
                {step === "speaking" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Step 4 of 4 • Speaking Self-Assessment</span>
                            <h2 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display leading-tight">Talk about your project</h2>
                            <p className="text-sm text-ink/65 dark:text-canvas-cream/65 mt-1">Speak aloud explaining a technical database trade-off or coding problem you solved recently.</p>
                        </div>

                        <div className="p-5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md flex flex-col gap-2">
                            <h4 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">Rate your spoken fluency and confidence:</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setSpeakingConfidence(star)}
                                        className={`text-3xl cursor-pointer hover:scale-110 active:scale-95 transition-all focus:outline-none ${
                                            star <= speakingConfidence ? "text-hume-orange animate-pulse" : "text-ink/10 dark:text-canvas-cream/10"
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="text-[10px] font-mono font-bold text-ink/40 dark:text-canvas-cream/40 ml-1">({speakingConfidence} / 5 stars)</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                            <button
                                onClick={handleSpeakingSubmit}
                                className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                            >
                                Complete Test
                            </button>
                        </div>
                    </div>
                )}

                {/* DIAGNOSTIC RESULT PANEL */}
                {step === "result" && metrics && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
                        <div className="text-center pb-2 border-b border-ink/5 dark:border-zinc-800">
                            <span className="text-3xl">🏆</span>
                            <h2 className="text-3xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display leading-tight">Diagnostic Report</h2>
                            <p className="text-[10px] font-mono text-ink/50 dark:text-canvas-cream/50 uppercase tracking-widest mt-1">Saved successfully on {metrics.date}</p>
                        </div>

                        {/* Metric Results Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-hume-lavender/10 border border-hume-lavender/25 rounded-md text-center">
                                <h4 className="text-[10px] font-mono font-bold uppercase text-hume-lavender tracking-wider leading-none">Grammatical Precision</h4>
                                <span className="text-3xl font-bold text-ink dark:text-canvas-cream block mt-2">{metrics.precision}%</span>
                            </div>

                            <div className="p-5 bg-hume-mint/10 border border-hume-mint/25 rounded-md text-center">
                                <h4 className="text-[10px] font-mono font-bold uppercase text-hume-mint tracking-wider leading-none">Task Completion</h4>
                                <span className="text-3xl font-bold text-ink dark:text-canvas-cream block mt-2">{metrics.completion}%</span>
                            </div>

                            <div className="p-5 bg-hume-blue/10 border border-hume-blue/25 rounded-md text-center">
                                <h4 className="text-[10px] font-mono font-bold uppercase text-hume-blue tracking-wider leading-none">Response Latency</h4>
                                <span className="text-3xl font-bold text-ink dark:text-canvas-cream block mt-2">{metrics.latency}s</span>
                            </div>

                            <div className="p-5 bg-hume-orange/10 border border-hume-orange/25 rounded-md text-center">
                                <h4 className="text-[10px] font-mono font-bold uppercase text-hume-orange tracking-wider leading-none">Overall Score</h4>
                                <span className="text-3xl font-bold text-ink dark:text-canvas-cream block mt-2">{metrics.overall}%</span>
                            </div>
                        </div>

                        {/* Back actions */}
                        <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    setStep("intro");
                                    setListeningAnswer("");
                                    setReadingAnswer("");
                                    setWritingText("");
                                    setSpeakingConfidence(3);
                                }}
                                className="font-mono text-xs uppercase tracking-wider font-semibold text-ink/40 dark:text-canvas-cream/40 hover:opacity-85 transition-opacity cursor-pointer focus:outline-none bg-transparent border-0"
                            >
                                Restart Diagnostic ↺
                            </button>
                            <Link
                                href="/practice"
                                className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none text-center"
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
