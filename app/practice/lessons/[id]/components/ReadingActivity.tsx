"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { playErrorBuzz } from "@/lib/audio";

interface ReadingActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

export default function ReadingActivity({ activity, onComplete, onErrorLogged }: ReadingActivityProps) {
    const docText = activity.content || "";
    const questions = (activity.question || "").split("\n");
    const correctAnswers = (activity.answer as string || "").split(",").map(a => a.trim());
    const options = activity.options || [];

    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(""));
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const handleSelectOption = (qIdx: number, val: string) => {
        if (isChecked) return;
        setUserAnswers(prev => {
            const next = [...prev];
            next[qIdx] = val;
            return next;
        });
    };

    const handleCheck = () => {
        let allCorrect = true;
        let currentErrors = 0;

        userAnswers.forEach((ans, idx) => {
            if (ans !== correctAnswers[idx]) {
                allCorrect = false;
                currentErrors++;
                onErrorLogged("reading_error");
            }
        });

        setErrorCount(prev => prev + currentErrors);
        setIsChecked(true);

        if (allCorrect) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
            playErrorBuzz();
        }
    };

    const handleRetry = () => {
        setIsChecked(false);
        setUserAnswers(new Array(questions.length).fill(""));
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    const isAllSelected = userAnswers.every(ans => ans !== "");

    return (
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in max-w-4xl w-full">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Reading Comprehension</h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[300px]">
                {/* Left Pane: Documentation Reading Material */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/55 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-y-auto max-h-[400px]">
                    <h4 className="text-xs uppercase tracking-widest font-black text-zinc-400 mb-3">Documentation Snippet:</h4>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                        {docText}
                    </p>
                </div>

                {/* Right Pane: Comprehension Questions */}
                <div className="flex flex-col gap-6 overflow-y-auto max-h-[400px]">
                    {questions.map((q, qIdx) => {
                        const isQCorrect = isChecked && userAnswers[qIdx] === correctAnswers[qIdx];
                        const isQWrong = isChecked && userAnswers[qIdx] !== correctAnswers[qIdx];

                        // Find options for this question.
                        // Assuming choices are in blocks of 2, or standard selection
                        // For simplicity, we show all options or relevant chunks
                        const relevantOptions = options.slice(qIdx * 2, (qIdx + 1) * 2);

                        return (
                            <div key={qIdx} className={`p-4 rounded-xl border flex flex-col gap-3 ${
                                isQCorrect ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" : 
                                isQWrong ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" :
                                "bg-zinc-50/30 dark:bg-zinc-900/10 border-zinc-100 dark:border-zinc-800"
                            }`}>
                                <h5 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{q}</h5>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {relevantOptions.map((opt, oIdx) => {
                                        const isSelected = userAnswers[qIdx] === opt;
                                        const isCorrectOpt = opt === correctAnswers[qIdx];
                                        
                                        let btnStyle = "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700";
                                        if (isSelected) {
                                            btnStyle = "bg-blue-50 dark:bg-blue-950/45 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-800 font-extrabold";
                                        }
                                        if (isChecked) {
                                            if (isCorrectOpt) {
                                                btnStyle = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400 dark:border-green-900/40 font-extrabold";
                                            } else if (isSelected && !isCorrectOpt) {
                                                btnStyle = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-400 dark:border-red-900/40";
                                            }
                                        }

                                        return (
                                            <button
                                                disabled={isChecked}
                                                key={oIdx}
                                                onClick={() => handleSelectOption(qIdx, opt)}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${btnStyle} ${
                                                    isChecked ? "cursor-not-allowed" : "cursor-pointer"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-base font-bold">
                        {isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✨ Correct! Excellent reading comprehension.</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400">⚠️ Some answers are incorrect. Review the snippet and retry.</span>
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
                            disabled={!isAllSelected}
                            onClick={handleCheck}
                            className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                isAllSelected
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                            }`}
                        >
                            Check Reading
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
