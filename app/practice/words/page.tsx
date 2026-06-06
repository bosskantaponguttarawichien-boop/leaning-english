"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import vocabData from "@/data/vocab.json";
import { Word, VocabDBSchema } from "@/schemas/vocab.schema";
import WordCard, { DifficultyMode } from "@/components/WordCard";
import TypingInput from "@/components/TypingInput";
import Timer from "@/components/Timer";
import { saveWordResult, getProgress, WordProgress, toggleWordMark, syncProgressFromDB } from "@/lib/storage";
import { getWeightedWords, getSRSStats, SRSStats } from "@/lib/srs";
import { speak } from "@/lib/speech";
import { readData, setData, pushData } from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_USER_ID = "default_user";

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
    const [isSoundEnabled, setIsSoundEnabled] = useState(true); // Sound Beep toggle
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Typing Mode Specific States
    const [typedCurrentWord, setTypedCurrentWord] = useState("");
    const [typedWordsHistory, setTypedWordsHistory] = useState<string[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [correctCharCount, setCorrectCharCount] = useState(0);
    const [totalTypedCharCount, setTotalTypedCharCount] = useState(0);
    const [sessionErrorCount, setSessionErrorCount] = useState(0);
    const [realtimeWpm, setRealtimeWpm] = useState(0);
    const [realtimeAccuracy, setRealtimeAccuracy] = useState(100);
    const [isFocused, setIsFocused] = useState(true);
    const [finalAccuracy, setFinalAccuracy] = useState(0);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (typeof window === "undefined") return null;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // Stats for normal/test/hard modes
    const [correctCount, setCorrectCount] = useState(0);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);
    const [totalChars, setTotalChars] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const wordStartTimeRef = useRef<number | null>(null);
    const [stats, setStats] = useState<SRSStats | null>(null);
    const [finalWpm, setFinalWpm] = useState(0);

    // Update SRS stats
    useEffect(() => {
        if (!isDataLoaded) return;
        const progress = getProgress();
        setAllProgress(progress);
        setStats(getSRSStats(words));
        setMarkedWords(new Set(Object.values(progress).filter(p => p.isMarked).map(p => p.word)));
    }, [words, currentIndex, isCorrect, isDataLoaded]);

    // Initial Load from Firebase
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Load Settings
                const settingsRes = await readData(`users/${DEFAULT_USER_ID}/settings`);
                if (settingsRes.success && settingsRes.data) {
                    const s = settingsRes.data;
                    if (s.isSpeechEnabled !== undefined) setIsSpeechEnabled(s.isSpeechEnabled);
                    if (s.timerEnabled !== undefined) setTimerEnabled(s.timerEnabled);
                    if (s.difficultyMode !== undefined) setDifficultyMode(s.difficultyMode);
                    if (s.difficulty !== undefined) setDifficulty(s.difficulty);
                    if (s.selectedPOS !== undefined) setSelectedPOS(s.selectedPOS);
                    if (s.isSoundEnabled !== undefined) setIsSoundEnabled(s.isSoundEnabled);
                }

                // 2. Sync Progress
                await syncProgressFromDB();
            } catch (error) {
                console.error("Failed to load initial data from Firebase:", error);
            } finally {
                setIsDataLoaded(true);
            }
        };

        loadInitialData();
    }, []);

    // Save Settings to Firebase when they change (skip initial mount save)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current || !isDataLoaded) {
            isFirstRender.current = false;
            return;
        }

        const saveSettings = async () => {
            await setData(`users/${DEFAULT_USER_ID}/settings`, {
                isSpeechEnabled,
                timerEnabled,
                difficultyMode,
                difficulty,
                selectedPOS,
                isSoundEnabled
            });
        };

        saveSettings();
    }, [isSpeechEnabled, timerEnabled, difficultyMode, difficulty, selectedPOS, isSoundEnabled, isDataLoaded]);

    // Words loader / filters
    useEffect(() => {
        if (!isDataLoaded) return;

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

            // Capping the stream list in Typing Mode with Zen Mode (no timer) to 50 words
            let processedWords = weighted;
            if (difficultyMode === 'typing') {
                processedWords = weighted.map(w => {
                    const cleaned = w.word.replace(/\.\.\./g, " ").replace(/\s+/g, " ").trim();
                    return {
                        ...w,
                        word: cleaned,
                        originalWord: w.word
                    } as any;
                });
                if (!timerEnabled) {
                    processedWords = processedWords.slice(0, 50);
                }
            }

            setWords(processedWords);
            setCurrentIndex(0);
            setIsStarted(false);
            setIsFinished(false);
            setCorrectCount(0);
            setSessionWrongCount(0);
            setTotalChars(0);
            setIsRevealed(false);
            setIsWrong(false);
            setTypingValue("");

            // Reset typing mode states
            setTypedCurrentWord("");
            setTypedWordsHistory([]);
            setElapsedTime(0);
            setCorrectCharCount(0);
            setTotalTypedCharCount(0);
            setSessionErrorCount(0);
            setRealtimeWpm(0);
            setRealtimeAccuracy(100);
            if (timerRef.current) clearInterval(timerRef.current);
        } catch (error) {
            console.error("Failed to validate vocab data:", error);
            setWords([]);
        }
    }, [difficulty, selectedPOS, difficultyMode, timerEnabled, isDataLoaded]);

    // Start word timer whenever currentIndex changes (normal/test/hard mode)
    useEffect(() => {
        if (difficultyMode !== 'typing' && isStarted && !isFinished) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, isStarted, isFinished, difficultyMode]);

    // Reset session whenever difficultyMode changes
    useEffect(() => {
        setIsStarted(false);
        setIsFinished(false);
        setCurrentIndex(0);
        setCorrectCount(0);
        setSessionWrongCount(0);
        setTotalChars(0);
        setIsRevealed(false);
        setIsWrong(false);
        setIsCorrect(false);
        setTypingValue("");
        setTypedCurrentWord("");
        setTypedWordsHistory([]);
        setElapsedTime(0);
        setCorrectCharCount(0);
        setTotalTypedCharCount(0);
        setSessionErrorCount(0);
        setRealtimeWpm(0);
        setRealtimeAccuracy(100);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [difficultyMode]);

    // Timer Interval for Typing Mode
    useEffect(() => {
        if (difficultyMode === 'typing' && isStarted && !isFinished && startTimeRef.current) {
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
                setElapsedTime(elapsed || 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isStarted, isFinished, difficultyMode]);

    // Realtime WPM and Accuracy updates for Typing Mode
    useEffect(() => {
        if (difficultyMode !== 'typing' || !isStarted || elapsedTime === 0) return;

        const minutes = elapsedTime / 60;
        const wpm = Math.round((correctCharCount / 5) / minutes);
        setRealtimeWpm(wpm);

        if (totalTypedCharCount > 0) {
            const acc = Math.round((correctCharCount / totalTypedCharCount) * 100);
            setRealtimeAccuracy(acc);
        }
    }, [elapsedTime, correctCharCount, totalTypedCharCount, isStarted, difficultyMode]);

    // Low buzz sound generator for errors
    const playErrorBeep = useCallback(() => {
        if (!isSoundEnabled) return;
        try {
            const audioCtx = getAudioContext();
            if (!audioCtx) return;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "sawtooth";
            oscillator.frequency.value = 140; // Low frequency buzz
            gainNode.gain.value = 0.15;

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            console.error("Audio beep error:", e);
        }
    }, [isSoundEnabled, getAudioContext]);

    // Mechanical keyboard key click sound synthesis (MX Blue clack & space thock)
    const playKeyClickSound = useCallback((isSpace = false) => {
        if (!isSoundEnabled) return;
        try {
            const audioCtx = getAudioContext();
            if (!audioCtx) return;

            // 1. Oscillator for the keycap/switch structural hit
            const osc = audioCtx.createOscillator();
            const gainOsc = audioCtx.createGain();
            osc.connect(gainOsc);
            gainOsc.connect(audioCtx.destination);

            osc.type = isSpace ? "triangle" : "sine";
            const freq = isSpace ? 180 : 700; 
            const duration = isSpace ? 0.035 : 0.015; // Extremely short duration for crisp mechanical clack
            const vol = isSpace ? 0.40 : 0.28; // Louder volumes

            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainOsc.gain.setValueAtTime(vol, audioCtx.currentTime);
            gainOsc.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);

            // 2. Bandpass noise for the high frequency plastic contact snap (clicky switch click)
            const noiseLength = isSpace ? 0.025 : 0.010;
            const bufferSize = audioCtx.sampleRate * noiseLength;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = isSpace ? 1000 : 4500; // High resonant click for regular keys, low for space
            filter.Q.value = isSpace ? 2.0 : 6.0; // Sharp filter makes it crisp and snap

            const gainNoise = audioCtx.createGain();
            noiseNode.connect(filter);
            filter.connect(gainNoise);
            gainNoise.connect(audioCtx.destination);

            gainNoise.gain.setValueAtTime(isSpace ? 0.30 : 0.45, audioCtx.currentTime); // Louder noise snap
            gainNoise.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + noiseLength);

            noiseNode.start();
        } catch (e) {
            console.error("Audio click sound error:", e);
        }
    }, [isSoundEnabled, getAudioContext]);

    // Handle backspace or custom keys in Typing Mode
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (difficultyMode === 'typing') {
            if (e.key === "Backspace") {
                if (typedCurrentWord.length === 0 && currentIndex > 0) {
                    e.preventDefault();
                } else if (typedCurrentWord.length > 0) {
                    playKeyClickSound(false);
                }
            }
        }
    };

    // Commit and End Practice for Typing Mode
    const finishTypingSession = useCallback((finalHistory: string[]) => {
        setIsFinished(true);
        setIsStarted(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const elapsedSec = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
        const elapsedMin = elapsedSec / 60;

        let totalCorrectChars = 0;
        let totalTypedChars = 0;
        let correctWordsCount = 0;
        let wrongWordsCount = 0;

        words.forEach((targetWord, idx) => {
            const typedVal = idx === currentIndex ? typedCurrentWord : (finalHistory[idx] || "");
            const isWordCorrect = typedVal === targetWord.word;

            if (isWordCorrect) {
                correctWordsCount++;
                totalCorrectChars += targetWord.word.length + 1; // +1 space
            } else {
                wrongWordsCount++;
            }

            const minLen = Math.min(targetWord.word.length, typedVal.length);
            let correctCharsInWord = 0;
            for (let i = 0; i < minLen; i++) {
                if (typedVal[i] === targetWord.word[i]) {
                    correctCharsInWord++;
                }
            }
            totalCorrectChars += correctCharsInWord;
            totalTypedChars += typedVal.length + (idx < words.length - 1 ? 1 : 0);

            // Save SRS stats per word
            saveWordResult((targetWord as any).originalWord || targetWord.word, isWordCorrect, undefined, {
                isTestMode: true
            });
        });

        const wpm = Math.round((totalCorrectChars / 5) / (elapsedMin || 0.01));
        const accuracy = totalTypedChars > 0 ? Math.round((totalCorrectChars / totalTypedChars) * 100) : 0;

        setFinalWpm(wpm);
        setFinalAccuracy(accuracy);
        setCorrectCount(correctWordsCount);
        setSessionWrongCount(wrongWordsCount);

        pushData(`users/${DEFAULT_USER_ID}/history/vocab-typing`, {
            date: Date.now(),
            wpm,
            accuracy,
            wordCount: words.length,
            correctCount: correctWordsCount,
            wrongCount: wrongWordsCount,
            difficulty,
            selectedPOS,
            elapsedTime: Math.round(elapsedSec)
        });
    }, [words, currentIndex, typedCurrentWord, difficulty, selectedPOS]);

    // Handle typing inputs in Typing Mode
    const handleTypingModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isFinished) return;

        const val = e.target.value;

        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = Date.now();
        }

        if (val.endsWith(" ")) {
            const currentInputWord = val.trim();
            const currentTargetWord = words[currentIndex]?.word || "";

            // If the next character we expect in the target word is actually a space,
            // we do NOT commit the word. We treat the space as a normal typed character.
            if (val.length <= currentTargetWord.length && currentTargetWord[val.length - 1] === " ") {
                setTypedCurrentWord(val);
                playKeyClickSound(true); // Space click sound
                return;
            }

            if (currentInputWord.length === 0) {
                e.target.value = "";
                return;
            }

            const isWordCorrect = currentInputWord === currentTargetWord;

            let correctCountIncrement = 0;
            const minLen = Math.min(currentTargetWord.length, currentInputWord.length);
            for (let i = 0; i < minLen; i++) {
                if (currentTargetWord[i] === currentInputWord[i]) {
                    correctCountIncrement++;
                }
            }
            if (isWordCorrect) {
                correctCountIncrement += 1;
            }

            setCorrectCharCount(prev => prev + correctCountIncrement);
            setTotalTypedCharCount(prev => prev + currentInputWord.length + 1);

            if (isSpeechEnabled && isWordCorrect) {
                speak(currentTargetWord);
            }

            // Play spacebar thock sound!
            playKeyClickSound(true);

            const nextHistory = [...typedWordsHistory, currentInputWord];
            setTypedWordsHistory(nextHistory);
            setTypedCurrentWord("");
            e.target.value = "";

            if (currentIndex === words.length - 1) {
                finishTypingSession(nextHistory);
            } else {
                setCurrentIndex(prev => prev + 1);
            }
            return;
        }

        const targetWordStr = words[currentIndex]?.word || "";
        const charIdx = val.length - 1;

        if (charIdx >= 0 && val[charIdx] !== targetWordStr[charIdx]) {
            playErrorBeep();
            setSessionErrorCount(prev => prev + 1);
        } else {
            // Play normal mechanical key click sound!
            playKeyClickSound(false);
        }

        setTypedCurrentWord(val);
    };

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
            saveWordResult(words[currentIndex].word, true, responseTime, {
                isTestMode: difficultyMode === 'test',
                isHardMode: difficultyMode === 'hard'
            });
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
                        const wpm = Math.round((chars / 5) / (timeElapsedMinutes || 0.01));
                        setFinalWpm(wpm);

                        // Push Session History
                        pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                            date: Date.now(),
                            wpm,
                            correctCount: correctCount + 1,
                            wrongCount: sessionWrongCount,
                            difficulty: difficultyMode,
                            timerEnabled
                        });
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
    }, [words, currentIndex, isStarted, isFinished, isSpeechEnabled, timerEnabled, totalChars, difficultyMode, correctCount, sessionWrongCount]);

    const handleWrong = useCallback(() => {
        const now = Date.now();
        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = now;
        }

        setSessionWrongCount((prev) => prev + 1);

        const responseTime = wordStartTimeRef.current ? now - wordStartTimeRef.current : undefined;

        if (words[currentIndex]) {
            saveWordResult(words[currentIndex].word, false, responseTime, {
                isTestMode: difficultyMode === 'test',
                isHardMode: difficultyMode === 'hard'
            });
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
                        const wpm = Math.round((totalChars / 5) / (timeElapsedMinutes || 0.01));
                        setFinalWpm(wpm);

                        pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                            date: Date.now(),
                            wpm,
                            correctCount: correctCount,
                            wrongCount: sessionWrongCount + 1,
                            difficulty: difficultyMode,
                            timerEnabled
                        });
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
    }, [words, currentIndex, isStarted, isFinished, isSpeechEnabled, timerEnabled, totalChars, difficultyMode, correctCount, sessionWrongCount]);

    const handleTimeup = useCallback(() => {
        if (difficultyMode === 'typing') {
            finishTypingSession(typedWordsHistory);
            return;
        }

        if (startTimeRef.current && timerEnabled) {
            const timeElapsedMinutes = 1; // It was hardcoded to 60s
            const wpm = Math.round((totalChars / 5) / timeElapsedMinutes);
            setFinalWpm(wpm);

            pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                date: Date.now(),
                wpm,
                correctCount,
                wrongCount: sessionWrongCount,
                difficulty: difficultyMode,
                timerEnabled
            });
        }
        setIsFinished(true);
        setIsStarted(false);
    }, [totalChars, timerEnabled, correctCount, sessionWrongCount, difficultyMode, typedWordsHistory, finishTypingSession]);

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

    // Continuous words typing flow stream builder
    const renderWordsStream = useMemo(() => {
        if (difficultyMode !== 'typing' || words.length === 0) return null;

        return words.map((wordObj, wordIdx) => {
            const word = wordObj.word;
            const isCurrent = wordIdx === currentIndex;
            const isTyped = wordIdx < currentIndex;
            const typedVal = isTyped ? typedWordsHistory[wordIdx] : (isCurrent ? typedCurrentWord : "");

            let wordClass = "transition-all duration-150 inline-block mr-4 py-1 select-none ";

            if (isCurrent) {
                wordClass += "border-b-2 border-yellow-500/50 dark:border-yellow-400/50 pb-0.5 rounded-sm";
            }

            return (
                <span key={wordIdx} className={wordClass}>
                    {word.split("").map((char, charIdx) => {
                        const typedChar = typedVal[charIdx];
                        let charClass = "transition-colors duration-100 ";

                        if (isTyped) {
                            const wasCorrect = typedWordsHistory[wordIdx] === word;
                            charClass += wasCorrect
                                ? "text-zinc-800 dark:text-zinc-200"
                                : "text-red-500 dark:text-red-400 underline decoration-red-400/50 decoration-2 underline-offset-4";
                        } else if (isCurrent) {
                            if (typedChar === undefined) {
                                charClass += "text-zinc-300 dark:text-zinc-600";
                            } else if (typedChar === char) {
                                charClass += "text-zinc-800 dark:text-zinc-100 font-semibold";
                            } else {
                                charClass += "text-red-500 dark:text-red-400 underline decoration-red-400/50 decoration-2 underline-offset-4 font-semibold";
                            }
                        } else {
                            charClass += "text-zinc-300 dark:text-zinc-600/70";
                        }

                        return (
                            <span key={charIdx} className="relative inline">
                                {isCurrent && charIdx === typedVal.length && isFocused && (
                                    <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-yellow-500 dark:bg-yellow-400 animate-pulse z-10" />
                                )}
                                <span className={charClass}>{char}</span>
                            </span>
                        );
                    })}
                    {isCurrent && typedVal.length > word.length && (
                        <span className="relative inline">
                            {typedVal.slice(word.length).split("").map((extraChar, extraIdx) => (
                                <span key={extraIdx} className="text-red-600 dark:text-red-400 line-through opacity-80">
                                    {extraChar}
                                </span>
                            ))}
                            {isFocused && (
                                <span className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-yellow-500 dark:bg-yellow-400 animate-pulse z-10" />
                            )}
                        </span>
                    )}
                </span>
            );
        });
    }, [words, currentIndex, typedWordsHistory, typedCurrentWord, isFocused, difficultyMode]);

    // Focus handler for typing mode
    const forceFocus = () => {
        if (!isFinished && difficultyMode === 'typing') {
            inputRef.current?.focus();
            setIsFocused(true);
        }
    };

    if (!isDataLoaded) {
        return (
            <main className="flex min-h-screen flex-col items-center relative">
                <div className="w-full max-w-4xl flex flex-col gap-8 flex-1 px-4 sm:px-12 animate-fade-in mt-12 mb-12">
                    <div className="flex flex-col gap-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white dark:border-zinc-700/50 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col gap-2 flex-1">
                                <Skeleton className="h-3 w-20" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 md:w-fit">
                                <Skeleton className="h-3 w-16" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-10 w-48 rounded-2xl" />
                                    <Skeleton className="h-8 w-48 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Skeleton className="w-full h-1.5 rounded-full mb-2" />
                        <Skeleton className="w-full h-64 rounded-3xl" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center relative">
            {/* Session Complete Modal Overlay */}
            {isFinished && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">Session Complete! 🏁</h2>

                        <div className="grid grid-cols-3 gap-4 w-full">
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">WPM</p>
                                <p className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400">
                                    {difficultyMode === 'typing' ? finalWpm : (timerEnabled ? finalWpm : "-")}
                                </p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                    {difficultyMode === 'typing' ? "Accuracy" : "Words"}
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-green-600 dark:text-green-400">
                                    {difficultyMode === 'typing' ? `${finalAccuracy}%` : correctCount}
                                </p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Errors</p>
                                <p className="text-3xl md:text-4xl font-black text-red-600 dark:text-red-400">
                                    {difficultyMode === 'typing' ? sessionErrorCount : sessionWrongCount}
                                </p>
                            </div>
                        </div>

                        {difficultyMode === 'typing' ? (
                            <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-left text-sm text-zinc-500 dark:text-zinc-400 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="font-bold">Words Completed:</span>
                                    <span className="font-black text-zinc-850 dark:text-zinc-200">{words.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold">Elapsed Time:</span>
                                    <span className="font-black text-zinc-850 dark:text-zinc-200">{elapsedTime}s</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold">Keystrokes:</span>
                                    <span className="font-black text-zinc-850 dark:text-zinc-200">{correctCharCount} correct / {totalTypedCharCount} total</span>
                                </div>
                            </div>
                        ) : (
                            stats && (
                                <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-left">SRS Summary</h3>
                                    <div className="grid grid-cols-2 gap-y-4 text-left">
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Retention</p>
                                            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.retentionRate.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Mastered</p>
                                            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.masteredCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Due Words</p>
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.dueCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Recall Speed</p>
                                            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.avgRecallSpeed > 0 ? (stats.avgRecallSpeed / 1000).toFixed(2) + "s" : "-"}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50"
                        >
                            Try Again
                        </button>
                        <a href="/practice" className="text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-zinc-100 transition-all">
                            Back to Menu
                        </a>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-4xl flex flex-col gap-8 flex-1 px-4 sm:px-12 ${isFinished ? 'pointer-events-none opacity-50 blur-sm transition-all duration-300' : ''}`}>
                {/* Header / Settings */}
                <div className="flex flex-col gap-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white dark:border-zinc-700/50 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <a href="/practice" className="p-2 -ml-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Practice Sessions</h1>
                        </div>
                        <div className="flex items-center">
                            {timerEnabled ? (
                                <Timer initialSeconds={60} isActive={isStarted} onTimeup={handleTimeup} />
                            ) : (
                                <div className="flex items-center gap-3">
                                    {difficultyMode !== 'typing' && stats && stats.dueCount > 0 && (
                                        <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-100 animate-pulse">
                                            {stats.dueCount} DUE
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black rounded-full uppercase">Zen Mode</span>
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDifficulty(val);
                                        if (val === "difficult") {
                                            setDifficultyMode("hard");
                                        }
                                    }}
                                    className="w-full bg-zinc-50/50 dark:bg-zinc-800/80 border border-zinc-100/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-zinc-900 transition-all appearance-none cursor-pointer"
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
                                    className="w-full bg-zinc-50/50 dark:bg-zinc-800/80 border border-zinc-100/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-zinc-900 transition-all appearance-none cursor-pointer"
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
                                <div className="flex bg-zinc-50/50 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-100/50 dark:border-zinc-700/50 gap-1">
                                    {(['normal', 'test', 'hard', 'typing'] as DifficultyMode[]).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setDifficultyMode(mode)}
                                            className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-xl capitalize transition-all ${difficultyMode === mode
                                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                {/* Timer and Voice */}
                                <div className="flex flex-row items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/80 px-4 py-1 rounded-2xl border border-zinc-100/50 dark:border-zinc-700/50">
                                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={timerEnabled}
                                            onChange={(e) => setTimerEnabled(e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                                        />
                                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Timer</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={isSpeechEnabled}
                                            onChange={(e) => setIsSpeechEnabled(e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                                        />
                                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Voice</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group py-1">
                                        <input
                                            type="checkbox"
                                            checked={isSoundEnabled}
                                            onChange={(e) => setIsSoundEnabled(e.target.checked)}
                                            className="w-4 h-4 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                                        />
                                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Beep</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-800 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-zinc-400 dark:text-zinc-500 font-bold">No words found for this filter.</p>
                        <button onClick={() => { setDifficulty("all"); setSelectedPOS("all"); }} className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-bold">Reset Filters</button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center px-2 mb-2">
                            {difficultyMode === 'typing' ? (
                                <div className="flex w-full sm:w-auto items-center gap-6 sm:gap-16">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">WPM</span>
                                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{realtimeWpm}</span>
                                    </div>
                                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Accuracy</span>
                                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{realtimeAccuracy}%</span>
                                    </div>
                                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{currentIndex + 1} / {words.length}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex w-full sm:w-auto items-center gap-6 sm:gap-16">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Session Progress</span>
                                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{currentIndex + 1} / {words.length}</span>
                                    </div>
                                    {stats && (
                                        <>
                                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Mastery</span>
                                                <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{stats.masteredCount}</span>
                                            </div>
                                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Retention</span>
                                                <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{stats.retentionRate.toFixed(0)}%</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Progress indicator */}
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                            />
                        </div>

                        {difficultyMode === 'typing' ? (
                            <>
                                {/* Hidden native input for keyboard capturing */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={typedCurrentWord}
                                    onChange={handleTypingModeChange}
                                    onKeyDown={handleKeyDown}
                                    className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none"
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                />

                                {/* typing canvas stream */}
                                <div
                                    onClick={forceFocus}
                                    className={`relative p-10 rounded-[2.5rem] bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-xl cursor-text transition-all duration-300 min-h-[160px] ${!isFocused ? "blur-[2px] opacity-50 scale-[0.99]" : ""}`}
                                >
                                    <div className="flex flex-wrap leading-relaxed text-xl font-sans text-justify gap-y-2 select-none">
                                        {renderWordsStream}
                                    </div>

                                    {!isFocused && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xs rounded-[2.5rem]">
                                            <span className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg animate-pulse">
                                                Click to Focus and Type
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
