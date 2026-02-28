/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import vocabData from "@/data/vocab.json";
import { Word, VocabDBSchema } from "@/schemas/vocab.schema";
import WordCard from "@/components/WordCard";
import TypingInput from "@/components/TypingInput";
import Timer from "@/components/Timer";
import { saveWordResult, getProgress, WordProgress } from "@/lib/storage";
import { getWeightedWords, getSRSStats, SRSStats } from "@/lib/srs";
import { speak } from "@/lib/speech";

export default function WordPracticePage() {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [difficulty, setDifficulty] = useState<string>("all");
    const [selectedPOS, setSelectedPOS] = useState<string>("all");
    const [isTestMode, setIsTestMode] = useState(false);
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [typingValue, setTypingValue] = useState("");
    const [allProgress, setAllProgress] = useState<Record<string, WordProgress>>({});
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

    // Stats
    const [correctCount, setCorrectCount] = useState(0);
    const [totalChars, setTotalChars] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const wordStartTimeRef = useRef<number | null>(null);
    const [stats, setStats] = useState<SRSStats | null>(null);

    // Update SRS stats
    useEffect(() => {
        setAllProgress(getProgress());
        setStats(getSRSStats(words));
    }, [words, currentIndex, isCorrect]);

    useEffect(() => {
        // Validate and load data
        try {
            if (!vocabData || !vocabData.words) {
                setWords([]);
                return;
            }
            const validated = VocabDBSchema.parse(vocabData);
            let filteredWords = validated.words;

            if (difficulty !== "all") {
                filteredWords = filteredWords.filter(w => w.difficulty === difficulty);
            }

            if (selectedPOS !== "all") {
                filteredWords = filteredWords.filter(w => w.pos === selectedPOS);
            }

            // Use SRS weighting
            const weighted = getWeightedWords(filteredWords);
            setWords(weighted);
            setCurrentIndex(0);
            setIsStarted(false);
            setIsFinished(false);
            setCorrectCount(0);
            setTotalChars(0);
            setIsRevealed(false);
            setTypingValue("");
        } catch (error) {
            console.error("Failed to validate vocab data:", error);
            setWords([]);
        }
    }, [difficulty, selectedPOS]);

    // Start word timer whenever currentIndex changes
    useEffect(() => {
        if (isStarted && !isFinished) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, isStarted, isFinished]);

    const handleCorrect = useCallback(() => {
        const now = Date.now();
        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = now;
        }

        const responseTime = wordStartTimeRef.current ? now - wordStartTimeRef.current : undefined;

        setIsCorrect(true);
        setIsRevealed(true);
        setCorrectCount((prev) => prev + 1);
        setTotalChars((prev) => prev + words[currentIndex].word.length + 1); // +1 space

        // Save SRS result
        if (words[currentIndex]) {
            saveWordResult(words[currentIndex].word, true, responseTime);
            if (isSpeechEnabled) {
                speak(words[currentIndex].word);
            }
        }

        // Short delay before next word
        setTimeout(() => {
            if (!isFinished) {
                setCurrentIndex((prev) => (prev + 1) % words.length);
                setIsRevealed(false);
                setIsCorrect(false);
                setTypingValue("");
            }
        }, 1200); // Increased delay slightly to allow speech to finish
    }, [words, currentIndex, isStarted, isFinished, isSpeechEnabled]);

    const [finalWpm, setFinalWpm] = useState(0);
    const handleTimeup = useCallback(() => {
        if (startTimeRef.current && timerEnabled) {
            const timeElapsedMinutes = 1; // It was hardcoded to 60s
            setFinalWpm(Math.round((totalChars / 5) / timeElapsedMinutes));
        }
        setIsFinished(true);
        setIsStarted(false);
    }, [totalChars, timerEnabled]);

    if (isFinished) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-24">
                <div className="w-full max-w-md bg-zinc-50 border border-zinc-100 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center">
                    <h2 className="text-3xl font-black text-zinc-900 leading-tight">Session Complete! 🏁</h2>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">WPM</p>
                            <p className="text-4xl font-black text-blue-600">{timerEnabled ? finalWpm : "-"}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Words</p>
                            <p className="text-4xl font-black text-green-600">{correctCount}</p>
                        </div>
                    </div>

                    {stats && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col gap-4">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest text-left">SRS Summary</h3>
                            <div className="grid grid-cols-2 gap-y-4 text-left">
                                <div>
                                    <p className="text-xs font-bold text-zinc-400">Retention</p>
                                    <p className="text-xl font-black text-zinc-900">{stats.retentionRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-400">Mastered</p>
                                    <p className="text-xl font-black text-zinc-900">{stats.masteredCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-400">Due Words</p>
                                    <p className="text-xl font-black text-blue-600">{stats.dueCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-400">Recall Speed</p>
                                    <p className="text-xl font-black text-zinc-900">{stats.avgRecallSpeed > 0 ? (stats.avgRecallSpeed / 1000).toFixed(2) + "s" : "-"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                    >
                        Try Again
                    </button>
                    <a href="/practice" className="text-zinc-500 font-bold hover:text-zinc-900 transition-all">
                        Back to Menu
                    </a>
                </div>
            </main>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-50 p-6 md:p-12">
            <div className="w-full max-w-2xl flex flex-col gap-8">
                {/* Header / Settings */}
                <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <a href="/practice" className="text-zinc-400 hover:text-zinc-900">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Practice Sessions</h1>
                        </div>
                        {timerEnabled ? (
                            <Timer initialSeconds={60} isActive={isStarted} onTimeup={handleTimeup} />
                        ) : (
                            <div className="flex items-center gap-3">
                                {stats && stats.dueCount > 0 && (
                                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-100 animate-pulse">
                                        {stats.dueCount} DUE
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-black rounded-full uppercase">Zen Mode</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Configuration</label>
                            <div className="flex gap-2">
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="flex-1 bg-zinc-50 border border-zinc-100 text-zinc-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                >
                                    <option value="all">Any Level</option>
                                    <option value="A1">A1 (Beginner)</option>
                                    <option value="A2">A2 (Elementary)</option>
                                    <option value="B1">B1 (Intermediate)</option>
                                </select>
                                <select
                                    value={selectedPOS}
                                    onChange={(e) => setSelectedPOS(e.target.value)}
                                    className="flex-1 bg-zinc-50 border border-zinc-100 text-zinc-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                >
                                    <option value="all">Any Type</option>
                                    <option value="n">Noun</option>
                                    <option value="v">Verb</option>
                                    <option value="adj">Adjective</option>
                                    <option value="adv">Adverb</option>
                                    <option value="pron">Pronoun</option>
                                    <option value="prep">Preposition</option>
                                    <option value="conj">Conjunction</option>
                                    <option value="int">Interjection</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Modes</label>
                            <div className="flex items-center gap-4 h-full">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isTestMode}
                                        onChange={(e) => setIsTestMode(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Test Mode</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={timerEnabled}
                                        onChange={(e) => setTimerEnabled(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Timer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isSpeechEnabled}
                                        onChange={(e) => setIsSpeechEnabled(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Voice</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-zinc-200">
                        <p className="text-zinc-400 font-bold">No words found for this filter.</p>
                        <button onClick={() => { setDifficulty("all"); setSelectedPOS("all"); }} className="mt-2 text-blue-600 text-sm font-bold">Reset Filters</button>
                    </div>
                ) : (
                    <>
                        {/* Word Card */}
                        <div className="relative">
                            <WordCard
                                wordData={currentWord}
                                revealed={isRevealed}
                                typingValue={typingValue}
                                isCorrect={isCorrect}
                                isTestMode={isTestMode}
                                progress={allProgress[currentWord.word]}
                            />
                            {isCorrect && (
                                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="flex flex-col gap-4">
                            <TypingInput
                                targetWord={currentWord.word}
                                onCorrect={handleCorrect}
                                onInputChange={(val) => {
                                    setTypingValue(val);
                                    if (!isStarted && val.length > 0) {
                                        setIsStarted(true);
                                        startTimeRef.current = Date.now();
                                        wordStartTimeRef.current = Date.now();
                                    }
                                }}
                                disabled={isFinished}
                            />

                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Session Progress</span>
                                        <span className="text-sm font-black text-zinc-700">{currentIndex + 1} / {words.length}</span>
                                    </div>
                                    <div className="w-px h-6 bg-zinc-200" />
                                    {stats && (
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Mastery</span>
                                                <span className="text-sm font-black text-zinc-700">{stats.masteredCount}</span>
                                            </div>
                                            <div className="w-px h-6 bg-zinc-200" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Retention</span>
                                                <span className="text-sm font-black text-zinc-700">{stats.retentionRate.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsRevealed(!isRevealed)}
                                    className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors uppercase tracking-wider"
                                >
                                    {isRevealed ? "Hide Hint" : "Need a Hint?"}
                                </button>
                            </div>

                            {/* Progress indicator */}
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mt-2">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-300"
                                    style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

