"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import vocabData from "@/data/vocab.json";
import { speak } from "@/lib/speech";
import { playErrorBuzz } from "@/lib/audio";
import { Skeleton } from "@/components/ui/skeleton";

interface WordData {
    word: string;
    pos: string;
    meaning: string;
    example: string;
    difficulty: string;
}

export default function BuildSentencePage() {
    const [eligibleWords, setEligibleWords] = useState<WordData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledTokens, setShuffledTokens] = useState<string[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
    
    // Status states
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize list of words with examples
    useEffect(() => {
        const list = (vocabData.words as WordData[]).filter(w => w.example && w.example.trim() !== "");
        // Shuffle the list of words
        const shuffledList = [...list].sort(() => Math.random() - 0.5);
        setEligibleWords(shuffledList);
        setIsLoading(false);
    }, []);

    // Setup active sentence
    const currentWord = eligibleWords[currentIndex];
    const targetSentence = currentWord ? currentWord.example : "";
    const cleanedTargetWords = useMemo(() => {
        return targetSentence
            ? targetSentence.replace(/[\.\?!,]/g, "").split(/\s+/).filter(w => w.trim() !== "")
            : [];
    }, [targetSentence]);

    useEffect(() => {
        if (cleanedTargetWords.length > 0) {
            let shuffled = [...cleanedTargetWords].sort(() => Math.random() - 0.5);
            // Ensure the shuffle doesn't match the original order
            while (shuffled.join(" ") === cleanedTargetWords.join(" ") && cleanedTargetWords.length > 1) {
                shuffled = [...cleanedTargetWords].sort(() => Math.random() - 0.5);
            }
            setShuffledTokens(shuffled);
            setSelectedTokens([]);
            setIsChecked(false);
            setIsCorrect(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, eligibleWords]);

    const handleTokenClick = (word: string, idx: number) => {
        if (isChecked) return;
        setSelectedTokens(prev => [...prev, word]);
        setShuffledTokens(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
    };

    const handleRemoveToken = (word: string, idx: number) => {
        if (isChecked) return;
        setSelectedTokens(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
        setShuffledTokens(prev => [...prev, word]);
    };

    const handleReset = () => {
        if (isChecked) return;
        setShuffledTokens([...cleanedTargetWords].sort(() => Math.random() - 0.5));
        setSelectedTokens([]);
    };

    const handleCheck = () => {
        const userSentence = selectedTokens.join(" ").toLowerCase();
        const correctSentence = cleanedTargetWords.join(" ").toLowerCase();

        setIsChecked(true);

        if (userSentence === correctSentence) {
            setIsCorrect(true);
            setScore(prev => prev + 1);
            setStreak(prev => prev + 1);
            speak(targetSentence);
        } else {
            setIsCorrect(false);
            setStreak(0);
            playErrorBuzz();
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 < eligibleWords.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Loop back or reshuffle
            const reshuffled = [...eligibleWords].sort(() => Math.random() - 0.5);
            setEligibleWords(reshuffled);
            setCurrentIndex(0);
        }
    };

    if (isLoading || eligibleWords.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-background text-foreground tracking-tight">
                <div className="w-full max-w-xl flex flex-col gap-6">
                    <Skeleton className="h-10 w-48 rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-48 w-full rounded-md" />
                </div>
            </main>
        );
    }

    const isAllPlaced = shuffledTokens.length === 0;

    return (
        <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
            <div className="w-full max-w-xl flex flex-col gap-6">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <Link href="/practice" className="font-mono text-xs uppercase tracking-wider font-semibold text-hume-lavender hover:opacity-80 transition-opacity">
                        ← Back to Today
                    </Link>
                    <div className="flex gap-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">
                        <span>Score: {score}</span>
                        <span>Streak: {streak} 🔥</span>
                    </div>
                </div>

                {/* Question Info Card */}
                <div className="p-6 rounded-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Word Focus: &quot;{currentWord.word}&quot; ({currentWord.pos})</span>
                    <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream leading-tight mt-1 font-display">{currentWord.meaning}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-ink/5 dark:bg-canvas-cream/5 text-ink/65 dark:text-canvas-cream/65">{currentWord.difficulty}</span>
                    </div>
                </div>

                {/* Active construction arena */}
                <div className={`p-6 rounded-md border flex flex-col gap-4 transition-all min-h-[160px] ${
                    isChecked && isCorrect ? "bg-hume-mint/10 border-hume-mint/20" :
                    isChecked && !isCorrect ? "bg-hume-coral/10 border-hume-coral/20" :
                    "bg-canvas dark:bg-zinc-900 border-ink/10 dark:border-zinc-800 shadow-none"
                }`}>
                    <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Assembled Sentence</span>
                    
                    <div className="min-h-12 p-3 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800/80 rounded-md flex flex-wrap gap-2 items-center">
                        {selectedTokens.length === 0 ? (
                            <span className="text-[11px] font-sans text-ink/40 dark:text-canvas-cream/40 select-none">Tap words below to arrange them...</span>
                        ) : (
                            selectedTokens.map((word, idx) => (
                                <button
                                    disabled={isChecked}
                                    key={idx}
                                    onClick={() => handleRemoveToken(word, idx)}
                                    className="px-3 py-1 bg-ink/5 dark:bg-canvas-cream/5 hover:bg-ink/10 dark:hover:bg-canvas-cream/10 text-ink dark:text-canvas-cream font-mono text-xs uppercase tracking-wider border border-ink/25 dark:border-canvas-cream/35 rounded-full cursor-pointer active:scale-95 transition-all focus:outline-none"
                                >
                                    {word}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Show correct answer with sound trigger when checked */}
                    {isChecked && (
                        <div className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-between mt-1">
                            {isCorrect ? (
                                <span className="text-hume-mint">✓ Correct!</span>
                            ) : (
                                <span className="text-hume-coral">Expected: &quot;{targetSentence}&quot;</span>
                            )}
                            <button
                                onClick={() => speak(targetSentence)}
                                className="text-hume-lavender hover:opacity-85 transition-opacity font-bold cursor-pointer focus:outline-none"
                            >
                                Listen 🔊
                            </button>
                        </div>
                    )}
                </div>

                {/* Words Drawer Tokens */}
                {!isChecked && shuffledTokens.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 p-2">
                        {shuffledTokens.map((word, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleTokenClick(word, idx)}
                                className="px-3 py-1.5 bg-canvas dark:bg-zinc-900 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 text-ink dark:text-canvas-cream font-mono text-xs uppercase tracking-wider border border-ink/15 dark:border-zinc-800 rounded-full cursor-pointer active:scale-95 transition-all focus:outline-none"
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                )}

                {/* Operations Buttons Panel */}
                <div className="flex justify-between items-center mt-2">
                    {!isChecked && selectedTokens.length > 0 ? (
                        <button
                            onClick={handleReset}
                            className="font-mono text-xs uppercase tracking-wider font-semibold text-ink/40 dark:text-canvas-cream/40 hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
                        >
                            Reset ↺
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-3">
                        {isChecked && !isCorrect && (
                            <button
                                onClick={handleReset}
                                className="px-5 py-2.5 bg-transparent text-ink dark:text-canvas-cream border border-ink/20 dark:border-canvas-cream/30 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Retry
                            </button>
                        )}
                        {!isChecked || !isCorrect ? (
                            <button
                                disabled={!isAllPlaced}
                                onClick={handleCheck}
                                className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                    isAllPlaced
                                        ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                        : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                                }`}
                            >
                                Check Structure
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                            >
                                Next Sentence →
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}
