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
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Syntax Arranging</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Questions list */}
            <div className="flex-1 flex flex-col gap-6 py-2">
                {states.map((state, qIdx) => {
                    const userSentence = state.selectedTokens.join(" ").toLowerCase();
                    const correctSentence = state.originalWords.join(" ").toLowerCase();
                    const isQCorrect = isChecked && userSentence === correctSentence;
                    const isQWrong = isChecked && userSentence !== correctSentence;

                    return (
                        <div key={qIdx} className={`p-5 rounded-md border flex flex-col gap-4 transition-all ${
                            isQCorrect ? "bg-hume-mint/10 border-hume-mint/20" : 
                            isQWrong ? "bg-hume-coral/10 border-hume-coral/20" :
                            "bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800"
                        }`}>
                            {/* Question context number */}
                            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Sentence {qIdx + 1}</span>

                            {/* Constructed Area */}
                            <div className="min-h-12 p-3 bg-canvas dark:bg-black/20 border border-ink/10 dark:border-zinc-800 rounded-md flex flex-wrap gap-2 items-center">
                                {state.selectedTokens.length === 0 ? (
                                    <span className="text-[11px] font-sans text-ink/40 dark:text-canvas-cream/40 select-none">Click on tokens below to form a sentence...</span>
                                ) : (
                                    state.selectedTokens.map((word, wIdx) => (
                                        <button
                                            disabled={isChecked}
                                            key={wIdx}
                                            onClick={() => handleRemoveToken(qIdx, word, wIdx)}
                                            className="px-3 py-1 bg-ink/5 dark:bg-canvas-cream/5 hover:bg-ink/10 dark:hover:bg-canvas-cream/10 text-ink dark:text-canvas-cream font-mono text-xs uppercase tracking-wider border border-ink/25 dark:border-canvas-cream/35 rounded-full cursor-pointer active:scale-95 transition-all focus:outline-none"
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
                                            className="px-3 py-1.5 bg-canvas dark:bg-zinc-900 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 text-ink dark:text-canvas-cream font-mono text-xs uppercase tracking-wider border border-ink/15 dark:border-zinc-800 rounded-full cursor-pointer active:scale-95 transition-all focus:outline-none"
                                        >
                                            {word}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Feedback helper */}
                            {isChecked && (
                                <div className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-between mt-1">
                                    {isQCorrect ? (
                                        <span className="text-hume-mint">✓ Correct Sentence</span>
                                    ) : (
                                        <span className="text-hume-coral">Expected: &quot;{correctAnswers[qIdx]}&quot;</span>
                                    )}
                                </div>
                            )}

                            {!isChecked && state.selectedTokens.length > 0 && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleResetQuestion(qIdx)}
                                        className="font-mono text-xs uppercase tracking-wider font-semibold text-ink/40 dark:text-canvas-cream/40 hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
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
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-sm font-semibold">
                        {isCorrect ? (
                            <span className="text-hume-mint">✨ Correct! Excellent word ordering.</span>
                        ) : (
                            <span className="text-hume-coral">⚠️ Word order errors detected. Try again!</span>
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
                            disabled={!isAllPlaced}
                            onClick={handleCheck}
                            className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                isAllPlaced
                                    ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                    : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                            }`}
                        >
                            Check Arrangement
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
