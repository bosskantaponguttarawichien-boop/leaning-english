"use client";

import React, { useState } from "react";
import vocabData from "@/data/vocab.json";
import { VocabDBSchema } from "@/schemas/vocab.schema";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import SessionCompleteModal from "@/components/SessionCompleteModal";
import { playErrorBuzz } from "@/lib/audio";

export default function SentencePracticePage() {
    const [sentences] = useState<string[]>(() => {
        try {
            const validated = VocabDBSchema.parse(vocabData);
            const allSentences = validated.words.map(w => w.example);
            return [...allSentences].sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error("Failed to load sentences:", error);
            return [];
        }
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [typingValue, setTypingValue] = useState("");
    const [isCorrect, setIsCorrect] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);

    const targetSentence = sentences[currentIndex] || "";
    const isFinished = sentences.length > 0 && currentIndex >= sentences.length;

    const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setTypingValue(val);

        if (isCorrect || isWrong) return; // Prevent double checking during transition delay

        if (val === targetSentence && targetSentence !== "") {
            setIsCorrect(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % sentences.length);
                setIsCorrect(false);
                setTypingValue("");
            }, 1000);
        } else if (targetSentence !== "" && val.length >= targetSentence.length && val !== targetSentence) {
            setIsWrong(true);
            setSessionWrongCount(prev => prev + 1);
            playErrorBuzz();
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % sentences.length);
                setIsWrong(false);
                setTypingValue("");
            }, 1000);
        }
    };

    if (sentences.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center relative gap-12 p-6 md:p-12 animate-fade-in bg-background text-foreground">
                <div className="w-full max-w-3xl flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-10 w-48 rounded-md" />
                        </div>
                        <Skeleton className="h-5 w-64 ml-7 rounded-md" />
                    </div>
                    <div className="p-10 bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 rounded-md shadow-none">
                        <div className="flex flex-wrap gap-2">
                            {[16, 24, 20, 32, 12, 28, 16].map((w, i) => (
                                <Skeleton key={i} className={`h-10 w-${w} rounded-md`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center mb-0">
                        <Skeleton className="h-8 w-32 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-32 rounded-md" />
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
                <div className="flex flex-col gap-2 font-display">
                    <div className="flex items-center gap-2">
                        <Link href="/practice" className="font-mono text-xs uppercase tracking-wider font-semibold text-hume-lavender hover:opacity-80 transition-opacity">
                            ← Back to Today
                        </Link>
                        <h1 className="text-4xl font-semibold text-ink dark:text-canvas-cream tracking-tight leading-none">Sentence Mode</h1>
                    </div>
                    <p className="text-ink/65 dark:text-canvas-cream/65 font-medium text-sm ml-7">Practice typing full natural sentences.</p>
                </div>

                <div className="p-10 bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 rounded-md shadow-none leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-3xl font-medium">
                        {targetTokens.map((token, idx) => {
                            const typed = typingTokens[idx];
                            let color = "text-ink/20 dark:text-canvas-cream/20";

                            if (typed !== undefined) {
                                if (typed === token) {
                                    color = "text-ink dark:text-canvas-cream";
                                } else if (idx < typingTokens.length - 1 || (idx === typingTokens.length - 1 && typingValue.endsWith(" "))) {
                                    color = "text-hume-coral";
                                } else if (token.startsWith(typed)) {
                                    color = "text-ink/60 dark:text-canvas-cream/60";
                                } else {
                                    color = "text-hume-coral";
                                }
                            }

                            return (
                                <span key={idx} className={`${color} transition-colors duration-200`}>{token}</span>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-center mb-0">
                    <div className="px-4 py-2 bg-ink/5 dark:bg-canvas-cream/5 text-ink/50 dark:text-canvas-cream/50 font-mono text-[10px] font-bold rounded-full uppercase tracking-widest">
                        Progress: {currentIndex + 1} / {sentences.length}
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={typingValue}
                        onChange={handleTypingChange}
                        autoFocus
                        autoCapitalize="none"
                        rows={3}
                        disabled={isCorrect || isWrong}
                        className={`w-full p-6 text-2xl border outline-none transition-all resize-none shadow-none rounded-md ${isCorrect
                            ? "border-hume-mint bg-hume-mint/10 text-ink dark:text-canvas-cream"
                            : isWrong
                                ? "border-hume-coral bg-hume-coral/10 text-ink dark:text-canvas-cream"
                                : "border-ink/10 dark:border-zinc-800 bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream focus:border-hume-lavender dark:focus:border-hume-lavender"
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
