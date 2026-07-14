"use client";

import React, { useState, useEffect } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { playErrorBuzz } from "@/lib/audio";

interface ReorderActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

interface QuestionState {
    originalWords: string[];
    shuffledTokens: string[];
    selectedTokens: string[];
}

export default function ReorderActivity({ activity, onComplete, onErrorLogged }: ReorderActivityProps) {
    const correctAnswers = (activity.answer as string || "").split(",").map(a => a.trim());

    const [states, setStates] = useState<QuestionState[]>([]);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    // Initialize tokens by splitting and shuffling
    useEffect(() => {
        const initialStates = correctAnswers.map((answer) => {
            // Remove punctuation and split by space
            const words = answer.replace(/[\.\?!,]/g, "").split(/\s+/);
            
            // Generate shuffled tokens (avoiding matches to the original order on shuffle)
            let shuffled = [...words].sort(() => Math.random() - 0.5);
            while (shuffled.join(" ") === words.join(" ") && words.length > 1) {
                shuffled = [...words].sort(() => Math.random() - 0.5);
            }

            return {
                originalWords: words,
                shuffledTokens: shuffled,
                selectedTokens: [],
            };
        });
        setStates(initialStates);
        setIsChecked(false);
        setIsCorrect(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity]);

    const handleTokenClick = (qIdx: number, word: string, tokenIdx: number) => {
        if (isChecked) return;

        setStates(prev => {
            const next = [...prev];
            const q = { ...next[qIdx] };
            
            // Add to selected
            q.selectedTokens = [...q.selectedTokens, word];
            
            // Remove from shuffled tokens
            const newShuffled = [...q.shuffledTokens];
            newShuffled.splice(tokenIdx, 1);
            q.shuffledTokens = newShuffled;

            next[qIdx] = q;
            return next;
        });
    };

    const handleRemoveToken = (qIdx: number, word: string, selectedIdx: number) => {
        if (isChecked) return;

        setStates(prev => {
            const next = [...prev];
            const q = { ...next[qIdx] };
            
            // Remove from selected
            const newSelected = [...q.selectedTokens];
            newSelected.splice(selectedIdx, 1);
            q.selectedTokens = newSelected;
            
            // Return to shuffled tokens
            q.shuffledTokens = [...q.shuffledTokens, word];

            next[qIdx] = q;
            return next;
        });
    };

    const handleResetQuestion = (qIdx: number) => {
        if (isChecked) return;

        setStates(prev => {
            const next = [...prev];
            const answer = correctAnswers[qIdx];
            const words = answer.replace(/[\.\?!,]/g, "").split(/\s+/);
            
            let shuffled = [...words].sort(() => Math.random() - 0.5);
            while (shuffled.join(" ") === words.join(" ") && words.length > 1) {
                shuffled = [...words].sort(() => Math.random() - 0.5);
            }

            next[qIdx] = {
                originalWords: words,
                shuffledTokens: shuffled,
                selectedTokens: [],
            };
            return next;
        });
    };

    const handleCheck = () => {
        let allCorrect = true;
        let currentErrors = 0;

        states.forEach((state) => {
            const userSentence = state.selectedTokens.join(" ").toLowerCase();
            const correctSentence = state.originalWords.join(" ").toLowerCase();

            if (userSentence !== correctSentence) {
                allCorrect = false;
                currentErrors++;
                onErrorLogged("word_order");
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
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    const isAllPlaced = states.every(s => s.shuffledTokens.length === 0);

    return (
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Syntax Arranging</h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Questions list */}
            <div className="flex-1 flex flex-col gap-6 py-2">
                {states.map((state, qIdx) => {
                    const userSentence = state.selectedTokens.join(" ").toLowerCase();
                    const correctSentence = state.originalWords.join(" ").toLowerCase();
                    const isQCorrect = isChecked && userSentence === correctSentence;
                    const isQWrong = isChecked && userSentence !== correctSentence;

                    return (
                        <div key={qIdx} className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all ${
                            isQCorrect ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" : 
                            isQWrong ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" :
                            "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                        }`}>
                            {/* Question context number */}
                            <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Sentence {qIdx + 1}</span>

                            {/* Constructed Area */}
                            <div className="min-h-12 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl flex flex-wrap gap-2 items-center">
                                {state.selectedTokens.length === 0 ? (
                                    <span className="text-xs font-semibold text-zinc-400 select-none">Click on tokens below to form a sentence...</span>
                                ) : (
                                    state.selectedTokens.map((word, wIdx) => (
                                        <button
                                            disabled={isChecked}
                                            key={wIdx}
                                            onClick={() => handleRemoveToken(qIdx, word, wIdx)}
                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-sm border border-blue-100 dark:border-blue-900/30 rounded-xl cursor-pointer active:scale-95 transition-all"
                                        >
                                            {word}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Token options */}
                            {state.shuffledTokens.length > 0 && (
                                <div className="flex flex-wrap gap-2 py-1">
                                    {state.shuffledTokens.map((word, tokenIdx) => (
                                        <button
                                            disabled={isChecked}
                                            key={tokenIdx}
                                            onClick={() => handleTokenClick(qIdx, word, tokenIdx)}
                                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-sm rounded-xl cursor-pointer active:scale-95 transition-all"
                                        >
                                            {word}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Feedback helper */}
                            {isChecked && (
                                <div className="text-xs font-black uppercase tracking-wider flex items-center justify-between mt-1">
                                    {isQCorrect ? (
                                        <span className="text-green-600 dark:text-green-400">✓ Correct Sentence</span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400">Expected: &quot;{correctAnswers[qIdx]}&quot;</span>
                                    )}
                                </div>
                            )}

                            {!isChecked && state.selectedTokens.length > 0 && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleResetQuestion(qIdx)}
                                        className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                                    >
                                        Reset Sentence ↺
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-base font-bold">
                        {isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✨ Correct! Excellent word ordering.</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400">⚠️ Word order errors detected. Try again!</span>
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
                            disabled={!isAllPlaced}
                            onClick={handleCheck}
                            className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                isAllPlaced
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                            }`}
                        >
                            Check Arrangement
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
