"use client";

import React, { useState, useEffect } from "react";
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
    const cleanedTargetWords = targetSentence
        ? targetSentence.replace(/[\.\?!,]/g, "").split(/\s+/).filter(w => w.trim() !== "")
        : [];

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
            <main className="flex min-h-screen flex-col items-center justify-center p-12">
                <div className="w-full max-w-xl flex flex-col gap-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            </main>
        );
    }

    const isAllPlaced = shuffledTokens.length === 0;

    return (
        <main className="flex min-h-screen flex-col items-center px-[24px] py-12 tracking-tight">
            <div className="w-full max-w-xl flex flex-col gap-6">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <Link href="/practice" className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors font-bold text-sm">
                        ← Back to Menu
                    </Link>
                    <div className="flex gap-4 text-xs font-black uppercase tracking-wider text-zinc-400">
                        <span>Score: {score}</span>
                        <span>Streak: {streak} 🔥</span>
                    </div>
                </div>

                {/* Question Info Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/40 dark:shadow-zinc-950/40 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Word Focus: &quot;{currentWord.word}&quot; ({currentWord.pos})</span>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight mt-1">{currentWord.meaning}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300">{currentWord.difficulty}</span>
                    </div>
                </div>

                {/* Active construction arena */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 transition-all min-h-[160px] ${
                    isChecked && isCorrect ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" :
                    isChecked && !isCorrect ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" :
                    "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-800"
                }`}>
                    <span className="text-xs uppercase tracking-widest font-black text-zinc-400">Assembled Sentence</span>
                    
                    <div className="min-h-12 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750/80 rounded-2xl flex flex-wrap gap-2 items-center">
                        {selectedTokens.length === 0 ? (
                            <span className="text-xs font-semibold text-zinc-400 select-none">Tap words below to arrange them...</span>
                        ) : (
                            selectedTokens.map((word, idx) => (
                                <button
                                    disabled={isChecked}
                                    key={idx}
                                    onClick={() => handleRemoveToken(word, idx)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-750 dark:text-blue-300 font-extrabold text-sm border border-blue-100 dark:border-blue-900/20 rounded-xl cursor-pointer active:scale-95 transition-all"
                                >
                                    {word}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Show correct answer with sound trigger when checked */}
                    {isChecked && (
                        <div className="text-xs font-black uppercase tracking-wider flex items-center justify-between mt-1">
                            {isCorrect ? (
                                <span className="text-green-600 dark:text-green-400">✓ Correct!</span>
                            ) : (
                                <span className="text-red-600 dark:text-red-400">Expected: &quot;{targetSentence}&quot;</span>
                            )}
                            <button
                                onClick={() => speak(targetSentence)}
                                className="text-blue-500 hover:text-blue-600 font-black transition-colors"
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
                                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-sm rounded-xl cursor-pointer active:scale-95 transition-all border border-zinc-200/50 dark:border-zinc-700"
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
                            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
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
                                className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold text-sm rounded-2xl transition-all"
                            >
                                Retry
                            </button>
                        )}
                        {!isChecked || !isCorrect ? (
                            <button
                                disabled={!isAllPlaced}
                                onClick={handleCheck}
                                className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                    isAllPlaced
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 shadow-none cursor-not-allowed"
                                }`}
                            >
                                Check Structure
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none"
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
