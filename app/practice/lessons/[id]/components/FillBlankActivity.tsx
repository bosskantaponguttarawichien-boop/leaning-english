"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { playErrorBuzz } from "@/lib/audio";

interface FillBlankActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

export default function FillBlankActivity({ activity, onComplete, onErrorLogged }: FillBlankActivityProps) {
    const questions = (activity.question || "").split("\n");
    const correctAnswers = (activity.answer as string || "").split(",").map(a => a.trim());

    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(""));
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const handleInputChange = (idx: number, val: string) => {
        if (isChecked) return;
        setUserAnswers(prev => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const handleCheck = () => {
        let isAllCorrect = true;
        let currentErrors = 0;

        userAnswers.forEach((ans, idx) => {
            const normalizedAns = ans.trim().toLowerCase().replace(/[\.\?!,]/g, "");
            const normalizedCorrect = correctAnswers[idx].toLowerCase().replace(/[\.\?!,]/g, "");

            if (normalizedAns !== normalizedCorrect) {
                isAllCorrect = false;
                currentErrors++;

                // Logging specific error tags based on lesson category
                if (activity.id.startsWith("L03")) {
                    if (normalizedCorrect === "a" || normalizedCorrect === "an") {
                        onErrorLogged("missing_article");
                    } else if (normalizedCorrect.endsWith("s") && !normalizedAns.endsWith("s")) {
                        onErrorLogged("singular_plural");
                    } else {
                        onErrorLogged("spelling");
                    }
                } else if (activity.id.startsWith("L04") || activity.id.startsWith("L06")) {
                    onErrorLogged("wrong_tense");
                } else if (activity.id.startsWith("L05")) {
                    onErrorLogged("question_syntax");
                } else {
                    onErrorLogged("spelling");
                }
            }
        });

        setErrorCount(prev => prev + currentErrors);
        setIsChecked(true);

        if (isAllCorrect) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
            playErrorBuzz();
        }
    };

    const handleRetry = () => {
        setIsChecked(false);
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    const isAllTyped = userAnswers.every(ans => ans.trim() !== "");

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">
                    {activity.type === "transform" ? "Transformation Drill" : "Gap Filling Practice"}
                </h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Blanks List */}
            <div className="flex-1 flex flex-col gap-4 py-2">
                {questions.map((q, idx) => {
                    const isInputCorrect = isChecked && userAnswers[idx].trim().toLowerCase().replace(/[\.\?!,]/g, "") === correctAnswers[idx].toLowerCase().replace(/[\.\?!,]/g, "");
                    const isInputWrong = isChecked && !isInputCorrect;

                    let parts = q.split("___");
                    if (parts.length === 1) {
                        // Fallback: If "___" is missing, check for a parenthesized segment like (word)
                        const match = q.match(/\(([^)]+)\)/);
                        if (match) {
                            const index = q.indexOf(match[0]);
                            parts = [q.substring(0, index), q.substring(index)];
                        }
                    }

                    return (
                        <div key={idx} className={`p-4 rounded-md border flex flex-col gap-3 transition-all ${
                            isInputCorrect ? "bg-hume-mint/10 border-hume-mint/20" :
                            isInputWrong ? "bg-hume-coral/10 border-hume-coral/20" :
                            "bg-canvas-cream dark:bg-black/25 border-ink/5 dark:border-zinc-800"
                        }`}>
                            <div className="text-base font-medium text-ink dark:text-canvas-cream flex flex-wrap items-center gap-y-2">
                                <span>{parts[0]}</span>
                                {parts.length > 1 && (
                                    <input
                                        disabled={isChecked}
                                        type="text"
                                        value={userAnswers[idx]}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        placeholder="type answer..."
                                        className={`mx-2 px-3 py-1 font-mono rounded-md border text-sm focus:outline-none transition-all ${
                                            isChecked
                                                ? (isInputCorrect ? "bg-hume-mint/15 text-hume-mint border-hume-mint/30 w-36" : "bg-hume-coral/15 text-hume-coral border-hume-coral/30 w-36")
                                                : "bg-canvas dark:bg-zinc-900 text-ink dark:text-white border-ink/10 dark:border-zinc-750 focus:border-hume-lavender w-36"
                                        }`}
                                    />
                                )}
                                <span>{parts[1]}</span>
                            </div>

                            {isChecked && (
                                <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 self-end">
                                    {isInputCorrect ? (
                                        <span className="text-hume-mint">✓ Correct</span>
                                    ) : (
                                        <span className="text-hume-coral">Expected: &quot;{correctAnswers[idx]}&quot;</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions & Feedback */}
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-sm font-semibold">
                        {isCorrect ? (
                            <span className="text-hume-mint">✨ Correct! Well done.</span>
                        ) : (
                            <span className="text-hume-coral">⚠️ Check the highlighted errors and try again.</span>
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
                            disabled={!isAllTyped}
                            onClick={handleCheck}
                            className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                isAllTyped
                                    ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                    : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                            }`}
                        >
                            Check Answers
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
