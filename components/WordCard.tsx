"use client";

import React from "react";
import { Word, POS } from "@/schemas/vocab.schema";
import { WordProgress } from "@/lib/storage";

export type DifficultyMode = 'normal' | 'test' | 'hard';

interface WordCardProps {
    wordData: Word;
    revealed: boolean;
    typingValue?: string;
    isCorrect?: boolean;
    isWrong?: boolean;
    difficultyMode?: DifficultyMode;
    progress?: WordProgress;
    onToggleHint?: () => void;
    isMarked?: boolean;
    onToggleMark?: () => void;
}

const posColorMap: Record<POS, string> = {
    n: "bg-blue-100 text-blue-700 border-blue-200",
    v: "bg-red-100 text-red-700 border-red-200",
    adj: "bg-green-100 text-green-700 border-green-200",
    adv: "bg-purple-100 text-purple-700 border-purple-200",
    pron: "bg-yellow-100 text-yellow-700 border-yellow-200",
    prep: "bg-indigo-100 text-indigo-700 border-indigo-200",
    conj: "bg-pink-100 text-pink-700 border-pink-200",
    int: "bg-orange-100 text-orange-700 border-orange-200",
};

const posFullMap: Record<POS, string> = {
    n: "noun",
    v: "verb",
    adj: "adjective",
    adv: "adverb",
    pron: "pronoun",
    prep: "preposition",
    conj: "conjunction",
    int: "interjection",
};

export default function WordCard({ wordData, revealed, typingValue = "", isCorrect, isWrong, difficultyMode = 'normal', progress, onToggleHint, isMarked, onToggleMark }: WordCardProps) {
    const speak = (text: string) => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            window.speechSynthesis.speak(utterance);
        }
    };

    const isTestLike = difficultyMode !== 'normal';

    // Mask the word in the example sentence if in test/hard mode
    const displayExample = isTestLike
        ? wordData.example.replace(new RegExp(wordData.word, "gi"), "____")
        : wordData.example;

    const renderWord = () => {
        const target = wordData.word;
        const typing = typingValue;

        return (
            <div className="flex flex-wrap justify-center gap-x-1">
                {target.split("").map((char, idx) => {
                    const typedChar = typing[idx];

                    // Always render space as a space with a larger gap
                    if (char === " ") {
                        return (
                            <span key={idx} className="inline-block w-4"></span>
                        );
                    }

                    let color = "text-zinc-300"; // un-typed

                    if (typedChar !== undefined) {
                        if (difficultyMode === 'hard') {
                            color = "text-zinc-900 dark:text-zinc-100 font-bold";
                        } else {
                            if (typedChar === char) {
                                color = "text-zinc-900 dark:text-zinc-100 font-bold"; // correct
                            } else {
                                color = "text-red-500 font-bold underline decoration-2 underline-offset-4"; // incorrect
                            }
                        }
                    } else if (revealed && !isTestLike) {
                        color = "text-zinc-900 dark:text-zinc-100"; // revealed target
                    }

                    let displayChar = char;
                    if (!revealed && isTestLike) {
                        if (difficultyMode === 'hard') {
                            displayChar = "_";
                        } else if (typedChar === undefined) {
                            displayChar = "_";
                        }
                    }

                    return (
                        <span key={idx} className={`${color} transition-colors duration-200`}>
                            {displayChar}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${isCorrect
            ? "bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50 premium-shadow shadow-green-100 dark:shadow-green-900/20"
            : isWrong
                ? "bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 premium-shadow shadow-red-100 dark:shadow-red-900/20"
                : "bg-white dark:bg-zinc-800 border-white dark:border-zinc-700 premium-shadow-lg dark:shadow-zinc-900/50"
            }`}>

            {/* Bookmark / Mark for Review Button */}
            {onToggleMark && (
                <button
                    onClick={onToggleMark}
                    className={`absolute top-6 left-6 p-3 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/50 group z-10 ${isMarked
                        ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30"
                        : "text-zinc-300 dark:text-zinc-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        }`}
                    title={isMarked ? "Remove bookmark" : "Mark for review"}
                >
                    {isMarked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    )}
                </button>
            )}

            {/* Hint Toggle Button */}
            {onToggleHint && (
                <button
                    onClick={onToggleHint}
                    className="absolute top-6 right-6 p-3 text-zinc-300 dark:text-zinc-600 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/50 group z-10"
                    title={revealed ? "Hide Hint" : "Need a Hint?"}
                >
                    {revealed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    )}
                </button>
            )}

            <div className="flex flex-col items-center gap-6 text-center mt-2">
                {/* POS Badge */}
                <span className={`px-4 py-1 text-[10px] font-black uppercase rounded-full border tracking-widest ${posColorMap[wordData.pos]}`}>
                    {posFullMap[wordData.pos]}
                </span>

                {/* Primary Content */}
                <div className="flex flex-col items-center gap-2">
                    {isTestLike ? (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white Thai-font text-gradient leading-tight">
                                {wordData.meaning}
                            </h2>
                            <div className="text-5xl font-mono tracking-widest min-h-[1.5em] flex items-center justify-center">
                                {renderWord()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <h2 className="text-6xl font-black tracking-tight text-zinc-900 dark:text-white min-h-[1.5em] flex items-center justify-center">
                                {renderWord()}
                            </h2>
                            <button
                                onClick={() => speak(wordData.word)}
                                className="p-4 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all text-zinc-300 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 self-center group"
                                title="Listen"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Example Sentence */}
                <p className="text-xl text-zinc-400 font-medium italic max-w-md leading-relaxed selection:bg-blue-50 selection:text-blue-500">
                    &quot;{displayExample}&quot;
                </p>

                {/* Meaning Reveal / English Word Reveal */}
                <div className={`w-full transition-all duration-700 ease-in-out overflow-hidden ${revealed ? "max-h-64 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"}`}>
                    <div className="pt-8 mt-4 border-t border-zinc-50 dark:border-zinc-700 flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-zinc-300 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                {isTestLike ? "The word is" : "Meaning"}
                            </p>
                            <p className="text-4xl font-black text-zinc-800 dark:text-zinc-200 text-gradient leading-none">
                                {isTestLike ? wordData.word : wordData.meaning}
                            </p>
                        </div>

                        {/* SRS Stats */}
                        {progress && (
                            <div className="flex gap-8 items-center bg-zinc-50/50 dark:bg-zinc-800/50 px-6 py-4 rounded-[1.5rem] border border-zinc-100/50 dark:border-zinc-700/50">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Strength</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-700"
                                                style={{ width: `${progress.memoryStrength * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{(progress.memoryStrength * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700" />
                                <div className="flex flex-col items-center gap-1.5">
                                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Mastery</span>
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg shadow-sm ${progress.level === "Mastered" ? "bg-green-500 text-white" :
                                        progress.level === "Strong" ? "bg-blue-500 text-white" :
                                            "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                                        }`}>
                                        {progress.level.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
