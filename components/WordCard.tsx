"use client";

import React from "react";
import { Word, POS } from "@/schemas/vocab.schema";
import { WordProgress } from "@/lib/storage";

interface WordCardProps {
    wordData: Word;
    revealed: boolean;
    typingValue?: string;
    isCorrect?: boolean;
    isWrong?: boolean;
    isTestMode?: boolean;
    progress?: WordProgress;
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

export default function WordCard({ wordData, revealed, typingValue = "", isCorrect, isWrong, isTestMode, progress }: WordCardProps) {
    const speak = (text: string) => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            window.speechSynthesis.speak(utterance);
        }
    };

    // Mask the word in the example sentence if in test mode
    const displayExample = isTestMode
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
                        if (typedChar === char) {
                            color = "text-zinc-900 font-bold"; // correct
                        } else {
                            color = "text-red-500 font-bold underline decoration-2 underline-offset-4"; // incorrect
                        }
                    } else if (revealed && !isTestMode) {
                        color = "text-zinc-900"; // revealed target
                    }

                    // In test mode, we show underscores for un-typed characters if not revealed
                    const displayChar = (!revealed && isTestMode && typedChar === undefined) ? "_" : char;

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
        <div className={`p-8 rounded-2xl border-2 transition-all duration-300 ${isCorrect
            ? "bg-green-50 border-green-200 shadow-green-100"
            : isWrong
                ? "bg-red-50 border-red-200 shadow-red-100"
                : "bg-white border-zinc-100 shadow-xl shadow-zinc-100"
            }`}>
            <div className="flex flex-col items-center gap-4 text-center">
                {/* POS Badge */}
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${posColorMap[wordData.pos]}`}>
                    {posFullMap[wordData.pos]}
                </span>

                {/* Primary Content */}
                <div className="flex flex-col items-center gap-2">
                    {isTestMode ? (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 Thai-font">
                                {wordData.meaning}
                            </h2>
                            <div className="text-4xl font-mono tracking-widest min-h-[1.5em] flex items-center justify-center">
                                {renderWord()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <h2 className="text-5xl font-black tracking-tight text-zinc-900 min-h-[1.5em] flex items-center justify-center">
                                {renderWord()}
                            </h2>
                            <button
                                onClick={() => speak(wordData.word)}
                                className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-blue-500 self-center"
                                title="Listen"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Example Sentence */}
                <p className="text-lg text-zinc-400 font-medium italic max-w-md">
                    &quot;{displayExample}&quot;
                </p>

                {/* Meaning Reveal / English Word Reveal */}
                <div className={`mt-2 transition-all duration-500 overflow-hidden ${revealed ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                                {isTestMode ? "The word is" : "Meaning"}
                            </p>
                            <p className="text-3xl font-black text-zinc-800">
                                {isTestMode ? wordData.word : wordData.meaning}
                            </p>
                        </div>

                        {/* SRS Stats */}
                        {progress && (
                            <div className="flex gap-4 items-center bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Strength</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-12 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${progress.memoryStrength * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-zinc-700">{(progress.memoryStrength * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-zinc-200" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Level</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${progress.level === "Mastered" ? "bg-green-100 text-green-700" :
                                        progress.level === "Strong" ? "bg-blue-100 text-blue-700" :
                                            "bg-zinc-100 text-zinc-600"
                                        }`}>
                                        {progress.level}
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

