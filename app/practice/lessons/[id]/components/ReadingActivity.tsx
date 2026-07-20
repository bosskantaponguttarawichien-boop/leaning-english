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
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in max-w-4xl w-full">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Reading Comprehension</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[300px]">
                {/* Left Pane: Documentation Reading Material */}
                <div className="p-6 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md overflow-y-auto max-h-[400px]">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50 mb-3">Documentation Snippet:</h4>
                    <p className="text-sm text-ink/80 dark:text-canvas-cream/80 leading-relaxed whitespace-pre-wrap font-mono">
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
                            <div key={qIdx} className={`p-4 rounded-md border flex flex-col gap-3 ${
                                isQCorrect ? "bg-hume-mint/10 border-hume-mint/20" : 
                                isQWrong ? "bg-hume-coral/10 border-hume-coral/20" :
                                "bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-850"
                            }`}>
                                <h5 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">{q}</h5>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {relevantOptions.map((opt, oIdx) => {
                                        const isSelected = userAnswers[qIdx] === opt;
                                        const isCorrectOpt = opt === correctAnswers[qIdx];
                                        
                                        let btnStyle = "bg-canvas dark:bg-zinc-900 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800";
                                        if (isSelected) {
                                            btnStyle = "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender font-bold";
                                        }
                                        if (isChecked) {
                                            if (isCorrectOpt) {
                                                btnStyle = "bg-hume-mint/15 text-hume-mint border-hume-mint/30 font-bold";
                                            } else if (isSelected && !isCorrectOpt) {
                                                btnStyle = "bg-hume-coral/15 text-hume-coral border-hume-coral/30";
                                            }
                                        }

                                        return (
                                            <button
                                                disabled={isChecked}
                                                key={oIdx}
                                                onClick={() => handleSelectOption(qIdx, opt)}
                                                className={`w-full text-left px-4 py-2.5 rounded-md border text-sm font-semibold transition-all ${btnStyle} ${
                                                    isChecked ? "cursor-not-allowed" : "cursor-pointer focus:outline-none"
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
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-sm font-semibold">
                        {isCorrect ? (
                            <span className="text-hume-mint">✨ Correct! Excellent reading comprehension.</span>
                        ) : (
                            <span className="text-hume-coral">⚠️ Some answers are incorrect. Review the snippet and retry.</span>
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
                            disabled={!isAllSelected}
                            onClick={handleCheck}
                            className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                isAllSelected
                                    ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                    : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                            }`}
                        >
                            Check Reading
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
