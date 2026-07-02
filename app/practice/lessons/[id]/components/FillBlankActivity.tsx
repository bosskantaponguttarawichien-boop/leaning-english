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
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">
                    {activity.type === "transform" ? "Transformation Drill" : "Gap Filling Practice"}
                </h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Blanks List */}
            <div className="flex-1 flex flex-col gap-4 py-2">
                {questions.map((q, idx) => {
                    const isInputCorrect = isChecked && userAnswers[idx].trim().toLowerCase().replace(/[\.\?!,]/g, "") === correctAnswers[idx].toLowerCase().replace(/[\.\?!,]/g, "");
                    const isInputWrong = isChecked && !isInputCorrect;

                    const parts = q.split("___");

                    return (
                        <div key={idx} className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                            isInputCorrect ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" :
                            isInputWrong ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" :
                            "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                        }`}>
                            <div className="text-base font-bold text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-y-2">
                                <span>{parts[0]}</span>
                                {parts.length > 1 && (
                                    <input
                                        disabled={isChecked}
                                        type="text"
                                        value={userAnswers[idx]}
                                        onChange={(e) => handleInputChange(idx, e.target.value)}
                                        placeholder="type answer..."
                                        className={`mx-2 px-3 py-1 font-bold rounded-xl border font-mono text-sm focus:outline-none transition-all ${
                                            isChecked
                                                ? (isInputCorrect ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 w-36" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 w-36")
                                                : "bg-white dark:bg-zinc-850 text-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-36"
                                        }`}
                                    />
                                )}
                                <span>{parts[1]}</span>
                            </div>

                            {isChecked && (
                                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-end">
                                    {isInputCorrect ? (
                                        <span className="text-green-600 dark:text-green-400">✓ Correct</span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400">Expected: &quot;{correctAnswers[idx]}&quot;</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions & Feedback */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-base font-bold">
                        {isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✨ Correct! Well done.</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400">⚠️ Check the highlighted errors and try again.</span>
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
                            disabled={!isAllTyped}
                            onClick={handleCheck}
                            className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                isAllTyped
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                            }`}
                        >
                            Check Answers
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
