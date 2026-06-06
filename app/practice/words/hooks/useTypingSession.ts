"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Word } from "@/schemas/vocab.schema";
import { saveWordResult } from "@/lib/storage";
import { speak } from "@/lib/speech";
import { playErrorBeep, playKeyClickSound } from "@/lib/audio";
import { pushData } from "@/lib/db";

const DEFAULT_USER_ID = "default_user";

interface UseTypingSessionParams {
    words: Word[];
    isSpeechEnabled: boolean;
    isSoundEnabled: boolean;
    timerEnabled: boolean;
    difficulty: string;
    selectedPOS: string;
}

export function useTypingSession({ words, isSpeechEnabled, isSoundEnabled, timerEnabled, difficulty, selectedPOS }: UseTypingSessionParams) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [typedCurrentWord, setTypedCurrentWord] = useState("");
    const [typedWordsHistory, setTypedWordsHistory] = useState<string[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [correctCharCount, setCorrectCharCount] = useState(0);
    const [totalTypedCharCount, setTotalTypedCharCount] = useState(0);
    const [sessionErrorCount, setSessionErrorCount] = useState(0);
    const [realtimeWpm, setRealtimeWpm] = useState(0);
    const [realtimeAccuracy, setRealtimeAccuracy] = useState(100);
    const [finalWpm, setFinalWpm] = useState(0);
    const [finalAccuracy, setFinalAccuracy] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);
    const [isFocused, setIsFocused] = useState(true);

    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeWordRef = useRef<HTMLSpanElement>(null);
    const [activeWordPos, setActiveWordPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const resetSession = useCallback(() => {
        setCurrentIndex(0);
        setIsStarted(false);
        setIsFinished(false);
        setTypedCurrentWord("");
        setTypedWordsHistory([]);
        setElapsedTime(0);
        setCorrectCharCount(0);
        setTotalTypedCharCount(0);
        setSessionErrorCount(0);
        setRealtimeWpm(0);
        setRealtimeAccuracy(100);
        setFinalWpm(0);
        setFinalAccuracy(0);
        setCorrectCount(0);
        setSessionWrongCount(0);
        if (timerRef.current) clearInterval(timerRef.current);
        startTimeRef.current = null;
    }, []);

    // Timer tick
    useEffect(() => {
        if (isStarted && !isFinished && startTimeRef.current) {
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
                setElapsedTime(elapsed || 1);
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isStarted, isFinished]);

    // Realtime WPM/accuracy
    useEffect(() => {
        if (!isStarted || elapsedTime === 0) return;
        const minutes = elapsedTime / 60;
        setRealtimeWpm(Math.round((correctCharCount / 5) / minutes));
        if (totalTypedCharCount > 0) {
            setRealtimeAccuracy(Math.round((correctCharCount / totalTypedCharCount) * 100));
        }
    }, [elapsedTime, correctCharCount, totalTypedCharCount, isStarted]);

    // Track active word position
    useEffect(() => {
        const activeWord = activeWordRef.current;
        if (activeWord) {
            setActiveWordPos({
                top: activeWord.offsetTop,
                left: activeWord.offsetLeft,
                width: activeWord.offsetWidth,
                height: activeWord.offsetHeight,
            });
        }
    }, [currentIndex, words, typedCurrentWord]);

    // Auto-scroll container on mobile
    useEffect(() => {
        const container = containerRef.current;
        const activeWord = activeWordRef.current;
        if (!container || !activeWord) return;
        if (container.scrollHeight <= container.clientHeight) return;

        const containerRect = container.getBoundingClientRect();
        const wordRect = activeWord.getBoundingClientRect();
        const relativeWordTop = wordRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({ top: relativeWordTop - containerRect.height / 2 + wordRect.height / 2, behavior: "smooth" });
    }, [currentIndex]);

    // Scroll page to top on mobile when session starts
    useEffect(() => {
        if (isStarted && !isFinished && window.innerWidth < 640) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [isStarted, isFinished]);

    const finishSession = useCallback((finalHistory: string[]) => {
        setIsFinished(true);
        setIsStarted(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const elapsedSec = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
        const elapsedMin = elapsedSec / 60;
        let totalCorrectChars = 0;
        let totalTypedChars = 0;
        let correctWords = 0;
        let wrongWords = 0;

        words.forEach((targetWord, idx) => {
            const typedVal = idx === currentIndex ? typedCurrentWord : (finalHistory[idx] || "");
            const isWordCorrect = typedVal === targetWord.word;

            if (isWordCorrect) { correctWords++; totalCorrectChars += targetWord.word.length + 1; }
            else { wrongWords++; }

            const minLen = Math.min(targetWord.word.length, typedVal.length);
            for (let i = 0; i < minLen; i++) {
                if (typedVal[i] === targetWord.word[i]) totalCorrectChars++;
            }
            totalTypedChars += typedVal.length + (idx < words.length - 1 ? 1 : 0);

            saveWordResult((targetWord as Word & { originalWord?: string }).originalWord || targetWord.word, isWordCorrect, undefined, { isTestMode: true });
        });

        const wpm = Math.round((totalCorrectChars / 5) / (elapsedMin || 0.01));
        const accuracy = totalTypedChars > 0 ? Math.round((totalCorrectChars / totalTypedChars) * 100) : 0;

        setFinalWpm(wpm);
        setFinalAccuracy(accuracy);
        setCorrectCount(correctWords);
        setSessionWrongCount(wrongWords);

        pushData(`users/${DEFAULT_USER_ID}/history/vocab-typing`, {
            date: Date.now(), wpm, accuracy,
            wordCount: words.length, correctCount: correctWords, wrongCount: wrongWords,
            difficulty, selectedPOS, elapsedTime: Math.round(elapsedSec)
        });
    }, [words, currentIndex, typedCurrentWord, difficulty, selectedPOS]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (typedCurrentWord.length === 0 && currentIndex > 0) {
                e.preventDefault();
            } else if (typedCurrentWord.length > 0 && isSoundEnabled) {
                playKeyClickSound(false);
            }
        }
    };

    const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isFinished) return;
        const val = e.target.value;

        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = Date.now();
        }

        if (val.endsWith(" ")) {
            const currentInputWord = val.trim();
            const currentTargetWord = words[currentIndex]?.word || "";

            if (val.length <= currentTargetWord.length && currentTargetWord[val.length - 1] === " ") {
                setTypedCurrentWord(val);
                if (isSoundEnabled) playKeyClickSound(true);
                return;
            }

            if (currentInputWord.length === 0) { e.target.value = ""; return; }

            const isWordCorrect = currentInputWord === currentTargetWord;
            let correctIncrement = 0;
            const minLen = Math.min(currentTargetWord.length, currentInputWord.length);
            for (let i = 0; i < minLen; i++) {
                if (currentTargetWord[i] === currentInputWord[i]) correctIncrement++;
            }
            if (isWordCorrect) correctIncrement += 1;

            setCorrectCharCount(prev => prev + correctIncrement);
            setTotalTypedCharCount(prev => prev + currentInputWord.length + 1);

            if (isSpeechEnabled && isWordCorrect) speak(currentTargetWord);
            if (isSoundEnabled) playKeyClickSound(true);

            const nextHistory = [...typedWordsHistory, currentInputWord];
            setTypedWordsHistory(nextHistory);
            setTypedCurrentWord("");
            e.target.value = "";

            if (currentIndex === words.length - 1) {
                finishSession(nextHistory);
            } else {
                setCurrentIndex(prev => prev + 1);
            }
            return;
        }

        const targetWordStr = words[currentIndex]?.word || "";
        const charIdx = val.length - 1;
        if (charIdx >= 0 && val[charIdx] !== targetWordStr[charIdx]) {
            if (isSoundEnabled) playErrorBeep();
            setSessionErrorCount(prev => prev + 1);
        } else if (isSoundEnabled) {
            playKeyClickSound(false);
        }

        setTypedCurrentWord(val);
    };

    const forceFocus = () => {
        if (!isFinished) {
            inputRef.current?.focus();
            setIsFocused(true);
        }
    };

    return {
        currentIndex, isStarted, isFinished, isFocused,
        typedCurrentWord, typedWordsHistory,
        elapsedTime, correctCharCount, totalTypedCharCount,
        sessionErrorCount, realtimeWpm, realtimeAccuracy,
        finalWpm, finalAccuracy, correctCount, sessionWrongCount,
        activeWordPos, activeWordRef, inputRef, containerRef,
        setIsFocused, resetSession, finishSession,
        handleKeyDown, handleTypingInput, forceFocus,
    };
}
