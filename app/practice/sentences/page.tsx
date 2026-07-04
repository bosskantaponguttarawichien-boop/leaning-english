"use client";

import React, { useState, useEffect } from "react";
import vocabData from "@/data/vocab.json";
import { VocabDBSchema } from "@/schemas/vocab.schema";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import SessionCompleteModal from "@/components/SessionCompleteModal";
import { playErrorBuzz } from "@/lib/audio";

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
        if (isCorrect || isWrong) return; // Prevent double checking during transition delay

        if (typingValue === targetSentence && targetSentence !== "") {
            setIsCorrect(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % sentences.length);
                setIsCorrect(false);
                reset();
            }, 1000);
        } else if (targetSentence !== "" && typingValue.length >= targetSentence.length && typingValue !== targetSentence) {
            setIsWrong(true);
            setSessionWrongCount(prev => prev + 1);
            playErrorBuzz();
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % sentences.length);
                setIsWrong(false);
                reset();
            }, 1000);
        }
    }, [typingValue, targetSentence, sentences.length, reset, isCorrect, isWrong]);

    useEffect(() => {
        if (sentences.length > 0 && currentIndex >= sentences.length && !isFinished) {
            setIsFinished(true);
        }
    }, [currentIndex, sentences.length, isFinished]);

    if (sentences.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center relative gap-12 p-6 md:p-12 animate-fade-in">
                <div className="w-full max-w-3xl flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-10 w-48 rounded-md" />
                        </div>
                        <Skeleton className="h-5 w-64 ml-7 rounded-md" />
                    </div>
                    <div className="p-10 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-3xl shadow-xl shadow-zinc-100 dark:shadow-zinc-900/50">
                        <div className="flex flex-wrap gap-2">
                            {[16, 24, 20, 32, 12, 28, 16].map((w, i) => (
                                <Skeleton key={i} className={`h-10 w-${w} rounded-md`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center mb-0">
                        <Skeleton className="h-8 w-32 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-32 rounded-2xl" />
                </div>
            </main>
        );
    }

    const targetTokens = targetSentence.split(" ");
    const typingTokens = typingValue.split(" ");

    return (
        <main className="flex min-h-screen flex-col items-center relative">
            {isFinished && (
                <SessionCompleteModal
                    stats={[
                        { label: "Sentences", value: sentences.length, color: "text-green-600 dark:text-green-500" },
                        { label: "Errors", value: sessionWrongCount, color: "text-red-600 dark:text-red-500" },
                    ]}
                    onRetry={() => window.location.reload()}
                    backHref="/practice"
                />
            )}

            <div className={`w-full max-w-3xl flex flex-col gap-12 p-6 md:p-12 ${isFinished ? "pointer-events-none opacity-50 blur-sm transition-all duration-300" : ""}`}>
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

                <div className="p-10 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-3xl shadow-xl shadow-zinc-100 dark:shadow-zinc-900/50 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-3xl font-medium">
                        {targetTokens.map((token, idx) => {
                            const typed = typingTokens[idx];
                            let color = "text-zinc-300 dark:text-zinc-600";

                            if (typed !== undefined) {
                                if (typed === token) {
                                    color = "text-zinc-900 dark:text-zinc-100";
                                } else if (idx < typingTokens.length - 1 || (idx === typingTokens.length - 1 && typingValue.endsWith(" "))) {
                                    color = "text-red-500 dark:text-red-400";
                                } else if (token.startsWith(typed)) {
                                    color = "text-zinc-500 dark:text-zinc-400";
                                } else {
                                    color = "text-red-500 dark:text-red-400";
                                }
                            }

                            return (
                                <span key={idx} className={`${color} transition-colors duration-200`}>{token}</span>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-center mb-0">
                    <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-widest">
                        Progress: {currentIndex + 1} / {sentences.length}
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        {...register("typing")}
                        autoFocus
                        autoCapitalize="none"
                        rows={3}
                        disabled={isCorrect || isWrong}
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
