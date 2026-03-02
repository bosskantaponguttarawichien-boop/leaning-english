/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import vocabData from "@/data/vocab.json";
import { Word, VocabDBSchema } from "@/schemas/vocab.schema";
import WordCard, { DifficultyMode } from "@/components/WordCard";
import TypingInput from "@/components/TypingInput";
import Timer from "@/components/Timer";
import { saveWordResult, getProgress, WordProgress, toggleWordMark } from "@/lib/storage";
import { getWeightedWords, getSRSStats, SRSStats } from "@/lib/srs";
import { speak } from "@/lib/speech";

export default function WordPracticePage() {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [difficulty, setDifficulty] = useState<string>("all");
    const [selectedPOS, setSelectedPOS] = useState<string>("all");
    const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('normal');
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [typingValue, setTypingValue] = useState("");
    const [allProgress, setAllProgress] = useState<Record<string, WordProgress>>({});
    const [markedWords, setMarkedWords] = useState<Set<string>>(new Set());
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

    // Stats
    const [correctCount, setCorrectCount] = useState(0);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);
    const [totalChars, setTotalChars] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const wordStartTimeRef = useRef<number | null>(null);
    const [stats, setStats] = useState<SRSStats | null>(null);
    const [finalWpm, setFinalWpm] = useState(0);

    // Update SRS stats
    useEffect(() => {
        const progress = getProgress();
        setAllProgress(progress);
        setStats(getSRSStats(words));
        setMarkedWords(new Set(Object.values(progress).filter(p => p.isMarked).map(p => p.word)));
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
                if (difficulty === "difficult") {
                    const progressData = getProgress();
                    filteredWords = filteredWords.filter(w => (progressData[w.word]?.wrongCount || 0) > 0);
                } else if (difficulty === "marked") {
                    const progressData = getProgress();
                    filteredWords = filteredWords.filter(w => progressData[w.word]?.isMarked === true);
                } else {
                    filteredWords = filteredWords.filter(w => w.difficulty === difficulty);
                }
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
            setSessionWrongCount(0);
            setTotalChars(0);
            setIsRevealed(false);
            setIsWrong(false);
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
            saveWordResult(words[currentIndex].word, true, responseTime, { isTestMode: difficultyMode === 'hard' });
            if (isSpeechEnabled) {
                speak(words[currentIndex].word);
            }
        }

        // Short delay before next word
        setTimeout(() => {
            if (!isFinished) {
                if (!timerEnabled && words.length > 0 && currentIndex === words.length - 1) {
                    if (startTimeRef.current) {
                        const timeElapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
                        const chars = totalChars + words[currentIndex].word.length + 1;
                        setFinalWpm(Math.round((chars / 5) / (timeElapsedMinutes || 0.01)));
                    }
                    setIsFinished(true);
                    setIsStarted(false);
                } else {
                    setCurrentIndex((prev) => (prev + 1) % words.length);
                    setIsRevealed(false);
                    setIsCorrect(false);
                    setTypingValue("");
                }
            }
        }, 1200); // Increased delay slightly to allow speech to finish
    }, [words, currentIndex, isStarted, isFinished, isSpeechEnabled, timerEnabled, totalChars, difficultyMode]);

    const handleWrong = useCallback(() => {
        const now = Date.now();
        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = now;
        }

        setSessionWrongCount((prev) => prev + 1);

        const responseTime = wordStartTimeRef.current ? now - wordStartTimeRef.current : undefined;

        if (words[currentIndex]) {
            saveWordResult(words[currentIndex].word, false, responseTime, { isTestMode: difficultyMode === 'hard' });
        }

        setIsWrong(true);
        setIsRevealed(true);

        // Play buzz sound if speech enabled (simple beep)
        if (isSpeechEnabled && typeof window !== "undefined") {
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

        if (!isFinished) {
            setTimeout(() => {
                if (!timerEnabled && words.length > 0 && currentIndex === words.length - 1) {
                    if (startTimeRef.current) {
                        const timeElapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
                        setFinalWpm(Math.round((totalChars / 5) / (timeElapsedMinutes || 0.01)));
                    }
                    setIsFinished(true);
                    setIsStarted(false);
                } else {
                    setCurrentIndex((prev) => (prev + 1) % words.length);
                    setIsRevealed(false);
                    setIsCorrect(false);
                    setIsWrong(false);
                    setTypingValue("");
                }
            }, 1000);
        }
    }, [words, currentIndex, isStarted, isFinished, isSpeechEnabled, timerEnabled, totalChars, difficultyMode]);


    const handleTimeup = useCallback(() => {
        if (startTimeRef.current && timerEnabled) {
            const timeElapsedMinutes = 1; // It was hardcoded to 60s
            setFinalWpm(Math.round((totalChars / 5) / timeElapsedMinutes));
        }
        setIsFinished(true);
        setIsStarted(false);
    }, [totalChars, timerEnabled]);

    const currentWord = words[currentIndex];

    const handleToggleMark = useCallback(() => {
        if (!currentWord) return;
        const newState = toggleWordMark(currentWord.word);
        setMarkedWords(prev => {
            const next = new Set(prev);
            if (newState) next.add(currentWord.word);
            else next.delete(currentWord.word);
            return next;
        });
    }, [currentWord]);

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-50 relative">
            {/* Session Complete Modal Overlay */}
            {isFinished && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-zinc-100 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-zinc-900 leading-tight">Session Complete! 🏁</h2>

                        <div className="grid grid-cols-3 gap-4 w-full">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                                <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">WPM</p>
                                <p className="text-3xl md:text-4xl font-black text-blue-600">{timerEnabled ? finalWpm : "-"}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                                <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Words</p>
                                <p className="text-3xl md:text-4xl font-black text-green-600">{correctCount}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                                <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Errors</p>
                                <p className="text-3xl md:text-4xl font-black text-red-600">{sessionWrongCount}</p>
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
                </div>
            )}

            <div className={`w-full max-w-2xl flex flex-col gap-8 flex-1 px-4 sm:px-12 ${isFinished ? 'pointer-events-none opacity-50 blur-sm transition-all duration-300' : ''}`}>
                {/* Header / Settings */}
                <div className="flex flex-col gap-6 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-xl shadow-zinc-200/50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <a href="/practice" className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Practice Sessions</h1>
                        </div>
                        <div className="flex items-center">
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
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">Configuration</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full bg-zinc-50/50 border border-zinc-100/50 text-zinc-600 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">Any Level</option>
                                    <option value="marked">Marked Words</option>
                                    <option value="difficult">Difficult Words (Needs Review)</option>
                                    <option value="A1">A1 (Beginner)</option>
                                    <option value="A2">A2 (Elementary)</option>
                                    <option value="B1">B1 (Intermediate)</option>
                                </select>
                                <select
                                    value={selectedPOS}
                                    onChange={(e) => setSelectedPOS(e.target.value)}
                                    className="w-full bg-zinc-50/50 border border-zinc-100/50 text-zinc-600 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
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

                        <div className="flex flex-col gap-2 md:w-fit">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">Modes</label>
                            <div className="flex flex-col gap-2">
                                {/* Difficulty Mode Segment Control */}
                                <div className="flex bg-zinc-50/50 p-1 rounded-2xl border border-zinc-100/50 gap-1">
                                    {(['normal', 'test', 'hard'] as DifficultyMode[]).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setDifficultyMode(mode)}
                                            className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-xl capitalize transition-all ${
                                                difficultyMode === mode
                                                    ? 'bg-zinc-900 text-white shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-900'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                {/* Timer and Voice */}
                                <div className="flex flex-row items-center gap-4 bg-zinc-50/50 px-4 py-1 rounded-2xl border border-zinc-100/50">
                                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={timerEnabled}
                                            onChange={(e) => setTimerEnabled(e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        />
                                        <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">Timer</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={isSpeechEnabled}
                                            onChange={(e) => setIsSpeechEnabled(e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        />
                                        <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">Voice</span>
                                    </label>
                                </div>
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
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center px-2 mb-2">
                            <div className="flex w-full sm:w-auto items-center gap-6 sm:gap-16">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Session Progress</span>
                                    <span className="text-sm font-black text-zinc-700">{currentIndex + 1} / {words.length}</span>
                                </div>
                                {stats && (
                                    <>
                                        <div className="w-px h-8 bg-zinc-200" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Mastery</span>
                                            <span className="text-sm font-black text-zinc-700">{stats.masteredCount}</span>
                                        </div>
                                        <div className="w-px h-8 bg-zinc-200" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Retention</span>
                                            <span className="text-sm font-black text-zinc-700">{stats.retentionRate.toFixed(0)}%</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                            />
                        </div>

                        {/* Word Card */}
                        <div className="relative">
                            <WordCard
                                wordData={currentWord}
                                revealed={isRevealed}
                                typingValue={typingValue}
                                isCorrect={isCorrect}
                                isWrong={isWrong}
                                difficultyMode={difficultyMode}
                                progress={allProgress[currentWord.word]}
                                onToggleHint={() => setIsRevealed(!isRevealed)}
                                isMarked={markedWords.has(currentWord.word)}
                                onToggleMark={handleToggleMark}
                            />
                            {isCorrect && (
                                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                            {isWrong && (
                                <div className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <TypingInput
                            key={currentIndex} // Force reset of input component on word change
                            targetWord={currentWord.word}
                            onCorrect={handleCorrect}
                            onWrong={handleWrong}
                            onInputChange={(val) => {
                                setTypingValue(val);
                                if (!isStarted && val.length > 0) {
                                    setIsStarted(true);
                                    startTimeRef.current = Date.now();
                                    wordStartTimeRef.current = Date.now();
                                }
                            }}
                            disabled={isFinished}
                            isBlind={difficultyMode === 'hard'}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

