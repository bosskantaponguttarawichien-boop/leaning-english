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
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Listening Dictation</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Play Button & Typing Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
                <button
                    onClick={playAudio}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-none hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer border focus:outline-none ${
                        isAudioPlaying
                            ? "bg-hume-lavender/20 border-hume-lavender/30 text-hume-lavender animate-pulse"
                            : "bg-canvas-cream dark:bg-black/20 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800"
                    }`}
                >
                    {isAudioPlaying ? "🔊" : "▶️"}
                </button>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Click to listen again</span>

                <div className="w-full max-w-md flex flex-col gap-2 mt-2">
                    <input
                        disabled={isChecked}
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder="Type what you hear..."
                        className={`w-full px-5 py-3 border rounded-md font-medium text-base text-ink dark:text-canvas-cream bg-canvas dark:bg-zinc-950 focus:outline-none transition-all focus:ring-0 ${
                            isChecked
                                ? (isCorrect ? "border-hume-mint bg-hume-mint/10 text-ink dark:text-canvas-cream" : "border-hume-coral bg-hume-coral/10 text-ink dark:text-canvas-cream")
                                : "border-ink/10 dark:border-zinc-800 focus:border-hume-lavender"
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
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-sm font-semibold">
                        {isCorrect ? (
                            <span className="text-hume-mint">✨ Correct! Excellent spelling and listening.</span>
                        ) : (
                            <span className="text-hume-coral font-mono text-xs uppercase tracking-wider">Expected: &quot;{targetSentence}&quot;</span>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 w-full sm:w-auto">
                    {isChecked && !isCorrect && (
                        <button
                            onClick={handleRetry}
                            className="px-5 py-2.5 bg-transparent text-ink dark:text-canvas-cream border border-ink/20 dark:border-canvas-cream/30 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all active:scale-[0.98] cursor-pointer"
                        >
                            Retry
                        </button>
                    )}
                    {(!isChecked || !isCorrect) ? (
                        <button
                            disabled={typedText.trim() === ""}
                            onClick={handleCheck}
                            className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                typedText.trim() !== ""
                                    ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                    : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                            }`}
                        >
                            Check Spelling
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
