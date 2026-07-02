"use client";

import React, { useState, useEffect } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { speak } from "@/lib/speech";
import { playErrorBuzz } from "@/lib/audio";

interface DictationActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

export default function DictationActivity({ activity, onComplete, onErrorLogged }: DictationActivityProps) {
    const targetSentence = activity.answer as string || "";
    const [typedText, setTypedText] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const playAudio = () => {
        setIsAudioPlaying(true);
        speak(targetSentence);
        // Turn off playing status after estimated speech length
        setTimeout(() => {
            setIsAudioPlaying(false);
        }, 2000);
    };

    // Auto-play audio on mount/load
    useEffect(() => {
        playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity]);

    const handleCheck = () => {
        const cleanTyped = typedText.trim().toLowerCase().replace(/[\.\?!,]/g, "");
        const cleanTarget = targetSentence.trim().toLowerCase().replace(/[\.\?!,]/g, "");

        setIsChecked(true);

        if (cleanTyped === cleanTarget) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
            setErrorCount(prev => prev + 1);
            onErrorLogged("spelling");
            playErrorBuzz();
        }
    };

    const handleRetry = () => {
        setIsChecked(false);
        setTypedText("");
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Listening Dictation</h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Play Button & Typing Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
                <button
                    onClick={playAudio}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg hover:scale-105 active:scale-95 transition-all select-none cursor-pointer border ${
                        isAudioPlaying
                            ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 animate-pulse"
                            : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                    }`}
                >
                    {isAudioPlaying ? "🔊" : "▶️"}
                </button>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Click to listen again</span>

                <div className="w-full max-w-md flex flex-col gap-2 mt-2">
                    <input
                        disabled={isChecked}
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder="Type what you hear..."
                        className={`w-full px-5 py-4 border rounded-2xl font-bold text-base text-zinc-850 dark:text-white bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 transition-all ${
                            isChecked
                                ? (isCorrect ? "border-green-300 bg-green-50/20 text-green-700" : "border-red-300 bg-red-50/20 text-red-700")
                                : "border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && typedText.trim() !== "" && !isChecked) {
                                handleCheck();
                            }
                        }}
                    />
                </div>
            </div>

            {/* Actions & Feedback */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-base font-bold">
                        {isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✨ Correct! Excellent spelling and listening.</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400">Expected: &quot;{targetSentence}&quot;</span>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 w-full sm:w-auto">
                    {isChecked && !isCorrect && (
                        <button
                            onClick={handleRetry}
                            className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-extrabold text-sm rounded-2xl transition-all"
                        >
                            Retry
                        </button>
                    )}
                    {(!isChecked || !isCorrect) ? (
                        <button
                            disabled={typedText.trim() === ""}
                            onClick={handleCheck}
                            className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                typedText.trim() !== ""
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                            }`}
                        >
                            Check Spelling
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
