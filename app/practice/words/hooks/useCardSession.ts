"use client";

import { useState, useRef, useCallback } from "react";
import { Word } from "@/schemas/vocab.schema";
import { DifficultyMode } from "@/components/WordCard";
import { saveWordResult } from "@/lib/storage";
import { speak } from "@/lib/speech";
import { pushData } from "@/lib/db";

const DEFAULT_USER_ID = "default_user";

interface UseCardSessionParams {
    words: Word[];
    difficultyMode: DifficultyMode;
    timerEnabled: boolean;
    isSpeechEnabled: boolean;
}

export function useCardSession({ words, difficultyMode, timerEnabled, isSpeechEnabled }: UseCardSessionParams) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [typingValue, setTypingValue] = useState("");
    const [correctCount, setCorrectCount] = useState(0);
    const [sessionWrongCount, setSessionWrongCount] = useState(0);
    const [totalChars, setTotalChars] = useState(0);
    const [finalWpm, setFinalWpm] = useState(0);

    const startTimeRef = useRef<number | null>(null);
    const wordStartTimeRef = useRef<number | null>(null);

    const resetSession = useCallback(() => {
        setCurrentIndex(0);
        setIsStarted(false);
        setIsFinished(false);
        setIsRevealed(false);
        setIsCorrect(false);
        setIsWrong(false);
        setTypingValue("");
        setCorrectCount(0);
        setSessionWrongCount(0);
        setTotalChars(0);
        setFinalWpm(0);
        startTimeRef.current = null;
        wordStartTimeRef.current = null;
    }, []);

    const finishSession = useCallback((correct: number, wrong: number, chars: number) => {
        if (startTimeRef.current && timerEnabled) {
            const wpm = Math.round((chars / 5) / 1);
            setFinalWpm(wpm);
            pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                date: Date.now(), wpm,
                correctCount: correct, wrongCount: wrong,
                difficulty: difficultyMode, timerEnabled
            });
        }
        setIsFinished(true);
        setIsStarted(false);
    }, [timerEnabled, difficultyMode]);

    const handleCorrect = useCallback(() => {
        if (isCorrect || isWrong) return; // Prevent double-triggering during transition delay

        const now = Date.now();
        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = now;
        }

        const responseTime = wordStartTimeRef.current ? now - wordStartTimeRef.current : undefined;
        const word = words[currentIndex];

        setIsCorrect(true);
        setIsRevealed(true);

        const newCorrect = correctCount + 1;
        const newChars = totalChars + word.word.length + 1;
        setCorrectCount(newCorrect);
        setTotalChars(newChars);

        if (word) {
            saveWordResult(word.word, true, responseTime, {
                isTestMode: difficultyMode === "test",
                isHardMode: difficultyMode === "hard",
            });
            if (isSpeechEnabled) speak(word.word);
        }

        setTimeout(() => {
            if (!timerEnabled && currentIndex === words.length - 1) {
                if (startTimeRef.current) {
                    const elapsed = (Date.now() - startTimeRef.current) / 60000;
                    const wpm = Math.round((newChars / 5) / (elapsed || 0.01));
                    setFinalWpm(wpm);
                    pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                        date: Date.now(), wpm,
                        correctCount: newCorrect, wrongCount: sessionWrongCount,
                        difficulty: difficultyMode, timerEnabled
                    });
                }
                setIsFinished(true);
                setIsStarted(false);
            } else {
                setCurrentIndex(prev => (prev + 1) % words.length);
                setIsRevealed(false);
                setIsCorrect(false);
                setTypingValue("");
            }
        }, 1200);
    }, [words, currentIndex, isStarted, isSpeechEnabled, timerEnabled, totalChars, correctCount, sessionWrongCount, difficultyMode, isCorrect, isWrong]);

    const handleWrong = useCallback(() => {
        if (isCorrect || isWrong) return; // Prevent double-triggering during transition delay

        const now = Date.now();
        if (!isStarted) {
            setIsStarted(true);
            startTimeRef.current = now;
        }

        const responseTime = wordStartTimeRef.current ? now - wordStartTimeRef.current : undefined;
        const word = words[currentIndex];
        const newWrong = sessionWrongCount + 1;

        setSessionWrongCount(newWrong);
        setIsWrong(true);
        setIsRevealed(true);

        if (word) {
            saveWordResult(word.word, false, responseTime, {
                isTestMode: difficultyMode === "test",
                isHardMode: difficultyMode === "hard",
            });
        }

        setTimeout(() => {
            if (!timerEnabled && currentIndex === words.length - 1) {
                if (startTimeRef.current) {
                    const elapsed = (Date.now() - startTimeRef.current) / 60000;
                    const wpm = Math.round((totalChars / 5) / (elapsed || 0.01));
                    setFinalWpm(wpm);
                    pushData(`users/${DEFAULT_USER_ID}/history/words`, {
                        date: Date.now(), wpm,
                        correctCount, wrongCount: newWrong,
                        difficulty: difficultyMode, timerEnabled
                    });
                }
                setIsFinished(true);
                setIsStarted(false);
            } else {
                setCurrentIndex(prev => (prev + 1) % words.length);
                setIsRevealed(false);
                setIsCorrect(false);
                setIsWrong(false);
                setTypingValue("");
            }
        }, 1000);
    }, [words, currentIndex, isStarted, timerEnabled, totalChars, correctCount, sessionWrongCount, difficultyMode, isCorrect, isWrong]);

    const handleTimeup = useCallback(() => {
        finishSession(correctCount, sessionWrongCount, totalChars);
    }, [correctCount, sessionWrongCount, totalChars, finishSession]);

    return {
        currentIndex, isStarted, isFinished, isRevealed, isCorrect, isWrong,
        typingValue, correctCount, sessionWrongCount, finalWpm,
        startTimeRef, wordStartTimeRef,
        setIsStarted, setTypingValue, setIsRevealed,
        handleCorrect, handleWrong, handleTimeup, resetSession,
    };
}
