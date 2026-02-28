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
        }
    }, [typingValue, targetSentence, sentences.length, reset]);

    if (sentences.length === 0) {
        return <div className="p-24 text-center">Loading sentences...</div>;
    }

    // Tokenize for highlighting
    const targetTokens = targetSentence.split(" ");
    const typingTokens = typingValue.split(" ");

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-zinc-950 p-6 md:p-24">
            <div className="w-full max-w-3xl flex flex-col gap-12">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Link href="/practice" className="text-zinc-400 hover:text-zinc-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Sentence Mode</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium ml-7">Practice typing full natural sentences.</p>
                </div>

                {/* Sentence Display with Highlighting */}
                <div className="p-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-100 dark:shadow-zinc-900/50 leading-relaxed">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-3xl font-medium">
                        {targetTokens.map((token, idx) => {
                            const typed = typingTokens[idx];
                            let color = "text-zinc-300 dark:text-zinc-600"; // un-typed

                            if (typed !== undefined) {
                                if (typed === token) {
                                    color = "text-zinc-900 dark:text-zinc-100"; // correct
                                } else if (idx < typingTokens.length - 1 || (idx === typingTokens.length - 1 && typingValue.endsWith(" "))) {
                                    color = "text-red-500"; // incorrect after word ended
                                } else if (token.startsWith(typed)) {
                                    color = "text-zinc-500 dark:text-zinc-400"; // partially correct current word
                                } else {
                                    color = "text-red-500"; // incorrect current word
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

                {/* Input area */}
                <div className="relative">
                    <textarea
                        {...register("typing")}
                        autoFocus
                        rows={3}
                        className={`w-full p-6 text-2xl border-2 rounded-2xl outline-none transition-all resize-none shadow-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
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
                </div>

                {/* Keyboard Hint */}
                <div className="flex justify-center">
                    <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-widest">
                        Progress: {currentIndex + 1} / {sentences.length}
                    </div>
                </div>
            </div>
        </main>
    );
}
