"use client";

import React, { useState, useEffect } from "react";
import vocabData from "@/data/vocab.json";
import { VocabDBSchema } from "@/schemas/vocab.schema";
import { useForm } from "react-hook-form";
import Link from "next/link";

export default function SentencePracticePage() {
    const [sentences, setSentences] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { register, watch, reset } = useForm<{ typing: string }>();
    const [isCorrect, setIsCorrect] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);

    useEffect(() => {
        try {
            const validated = VocabDBSchema.parse(vocabData);
            const allSentences = validated.words.map(w => w.example);
            setSentences([...allSentences].sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error("Failed to load sentences:", error);
        }
    }, []);

    const typingValue = watch("typing") || "";
    const targetSentence = sentences[currentIndex] || "";

    useEffect(() => {
        if (typingValue === targetSentence && targetSentence !== "") {
            setIsCorrect(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % sentences.length);
                setIsCorrect(false);
                reset();
            }, 1000);
        } else if (targetSentence !== "" && typingValue.length >= targetSentence.length && typingValue !== targetSentence) {
            setIsWrong(true);
            setSessionWrongCount(prev => prev + 1);

            // Play buzz sound (simple beep)
            if (typeof window !== "undefined") {
                try {
                    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                    const audioCtx = new AudioCtx();
                    if (audioCtx) {
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        oscillator.type = "sawtooth";
                        oscillator.frequency.value = 150; // Low buzz
                        gainNode.gain.value = 0.5;
                        oscillator.start();
                        setTimeout(() => {
                            oscillator.stop();
                            audioCtx.close();
                        }, 200);
                    }
                } catch (e) {
                    console.error("Audio block", e);
                }
            }

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % sentences.length);
                setIsWrong(false);
                reset();
            }, 1000);
        }
    }, [typingValue, targetSentence, sentences.length, reset]);

    useEffect(() => {
        if (sentences.length > 0 && currentIndex >= sentences.length && !isFinished) {
            setIsFinished(true);
        }
    }, [currentIndex, sentences.length, isFinished]);

    if (sentences.length === 0) {
        return <div className="p-24 text-center">Loading sentences...</div>;
    }

    // Tokenize for highlighting
    const targetTokens = targetSentence.split(" ");
    const typingTokens = typingValue.split(" ");

    return (
        <main className="flex min-h-screen flex-col items-center relative">
            {/* Session Complete Modal Overlay */}
            {isFinished && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">Session Complete! 🏁</h2>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Sentences</p>
                                <p className="text-3xl md:text-4xl font-black text-green-600 dark:text-green-500">{sentences.length}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Errors</p>
                                <p className="text-3xl md:text-4xl font-black text-red-600 dark:text-red-500">{sessionWrongCount}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-lg shadow-zinc-200 dark:shadow-none"
                        >
                            Try Again
                        </button>
                        <a href="/practice" className="text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-white transition-all">
                            Back to Menu
                        </a>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-3xl flex flex-col gap-12 p-6 md:p-12 ${isFinished ? 'pointer-events-none opacity-50 blur-sm transition-all duration-300' : ''}`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Link href="/practice" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Sentence Mode</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium ml-7">Practice typing full natural sentences.</p>
                </div>

                {/* Sentence Display with Highlighting */}
                <div className="p-10 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-3xl shadow-xl shadow-zinc-100 dark:shadow-zinc-900/50 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-3xl font-medium">
                        {targetTokens.map((token, idx) => {
                            const typed = typingTokens[idx];
                            let color = "text-zinc-300 dark:text-zinc-600"; // un-typed

                            if (typed !== undefined) {
                                if (typed === token) {
                                    color = "text-zinc-900 dark:text-zinc-100"; // correct
                                } else if (idx < typingTokens.length - 1 || (idx === typingTokens.length - 1 && typingValue.endsWith(" "))) {
                                    color = "text-red-500 dark:text-red-400"; // incorrect after word ended
                                } else if (token.startsWith(typed)) {
                                    color = "text-zinc-500 dark:text-zinc-400"; // partially correct current word
                                } else {
                                    color = "text-red-500 dark:text-red-400"; // incorrect current word
                                }
                            }

                            return (
                                <span key={idx} className={`${color} transition-colors duration-200`}>
                                    {token}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Keyboard Hint */}
                <div className="flex justify-center mb-0">
                    <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-widest">
                        Progress: {currentIndex + 1} / {sentences.length}
                    </div>
                </div>

                {/* Input area */}
                <div className="relative">
                    <textarea
                        {...register("typing")}
                        autoFocus
                        autoCapitalize="none"
                        rows={3}
                        className={`w-full p-6 text-2xl border-2 rounded-2xl outline-none transition-all resize-none shadow-sm dark:text-white ${isCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : isWrong
                                ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 focus:ring-red-100 dark:focus:ring-red-900/30"
                                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                            }`}
                        placeholder="Start typing the sentence above..."
                    />
                    {isCorrect && (
                        <div className="absolute top-4 right-4 text-green-600 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                    {isWrong && (
                        <div className="absolute top-4 right-4 text-red-600 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
