"use client";

import { useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WordCard, { DifficultyMode } from "@/components/WordCard";
import TypingInput from "@/components/TypingInput";
import { Skeleton } from "@/components/ui/skeleton";
import SessionCompleteModal, { SRSDetails } from "@/components/SessionCompleteModal";
import { toggleWordMark } from "@/lib/storage";
import { playErrorBuzz } from "@/lib/audio";
import { useSettings } from "./hooks/useSettings";
import { useWordFilter } from "./hooks/useWordFilter";
import { useCardSession } from "./hooks/useCardSession";
import { useTypingSession } from "./hooks/useTypingSession";
import PracticeHeader from "./components/PracticeHeader";
import SessionStatsBar from "./components/SessionStatsBar";
import TypingView from "./components/TypingView";

function WordPracticeContent() {
    const searchParams = useSearchParams();
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const { settings, update, isDataLoaded } = useSettings();
    const { isSpeechEnabled, isSoundEnabled, timerEnabled, difficultyMode, difficulty, selectedPOS } = settings;

    const effectiveDifficultyMode = limit ? "typing" : difficultyMode;

    const { words, allProgress, markedWords, setMarkedWords, stats } = useWordFilter({
        difficulty, selectedPOS, difficultyMode: effectiveDifficultyMode, timerEnabled, isDataLoaded, limit,
    });

    const card = useCardSession({
        words, difficultyMode: effectiveDifficultyMode, timerEnabled, isSpeechEnabled,
    });

    const typing = useTypingSession({
        words, isSpeechEnabled, isSoundEnabled, difficulty, selectedPOS,
    });

    const isTypingMode = effectiveDifficultyMode === "typing";
    const isFinished = isTypingMode ? typing.isFinished : card.isFinished;
    const currentWord = words[card.currentIndex];

    // Reset both sessions whenever effectiveDifficultyMode or words change
    useEffect(() => {
        card.resetSession();
        typing.resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveDifficultyMode, words]);

    // Track word start time for card session
    useEffect(() => {
        if (!isTypingMode && card.isStarted && !card.isFinished) {
            card.wordStartTimeRef.current = Date.now();
        }
    }, [card.currentIndex, card.isStarted, card.isFinished, isTypingMode, card.wordStartTimeRef]);

    const handleDifficultyChange = (val: string) => {
        update("difficulty", val);
        if (val === "difficult") update("difficultyMode", "hard");
    };

    const handleModeChange = (mode: DifficultyMode) => {
        update("difficultyMode", mode);
    };

    const handleToggleMark = useCallback(() => {
        if (!currentWord) return;
        const newState = toggleWordMark(currentWord.word);
        setMarkedWords(prev => {
            const next = new Set(prev);
            if (newState) next.add(currentWord.word);
            else next.delete(currentWord.word);
            return next;
        });
    }, [currentWord, setMarkedWords]);

    const handleCardWrong = useCallback(() => {
        if (isSpeechEnabled) playErrorBuzz();
        card.handleWrong();
    }, [isSpeechEnabled, card]);

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

    const sessionStats = isTypingMode
        ? [
            { label: "WPM", value: typing.finalWpm, color: "text-blue-600 dark:text-blue-400" },
            { label: "Accuracy", value: `${typing.finalAccuracy}%`, color: "text-green-600 dark:text-green-400" },
            { label: "Errors", value: typing.sessionErrorCount, color: "text-red-600 dark:text-red-400" },
        ]
        : [
            { label: "WPM", value: timerEnabled ? card.finalWpm : "-", color: "text-blue-600 dark:text-blue-400" },
            { label: "Words", value: card.correctCount, color: "text-green-600 dark:text-green-400" },
            { label: "Errors", value: card.sessionWrongCount, color: "text-red-600 dark:text-red-400" },
        ];

    return (
        <main className="flex min-h-screen flex-col items-center relative">
            {isFinished && (
                <SessionCompleteModal
                    stats={sessionStats}
                    details={isTypingMode ? (
                        <SRSDetails
                            stats={stats!}
                            isTypingMode
                            elapsedTime={typing.elapsedTime}
                            wordCount={words.length}
                            correctCharCount={typing.correctCharCount}
                            totalTypedCharCount={typing.totalTypedCharCount}
                        />
                    ) : stats ? (
                        <SRSDetails stats={stats} />
                    ) : undefined}
                    onRetry={() => window.location.reload()}
                    backHref="/practice"
                />
            )}

            <div className={`w-full max-w-4xl flex flex-col gap-8 flex-1 px-4 sm:px-12 ${isFinished ? "pointer-events-none opacity-50 blur-sm transition-all duration-300" : ""}`}>
                <PracticeHeader
                    difficultyMode={effectiveDifficultyMode}
                    difficulty={difficulty}
                    isReviewMode={!!limit}
                    selectedPOS={selectedPOS}
                    timerEnabled={timerEnabled}
                    isSpeechEnabled={isSpeechEnabled}
                    isSoundEnabled={isSoundEnabled}
                    isStarted={isTypingMode ? typing.isStarted : card.isStarted}
                    stats={stats}
                    onDifficultyChange={handleDifficultyChange}
                    onPOSChange={(v) => update("selectedPOS", v)}
                    onModeChange={handleModeChange}
                    onTimerToggle={(v) => update("timerEnabled", v)}
                    onSpeechToggle={(v) => update("isSpeechEnabled", v)}
                    onSoundToggle={(v) => update("isSoundEnabled", v)}
                    onTimeup={isTypingMode ? () => typing.finishSession(typing.typedWordsHistory) : card.handleTimeup}
                />

                {words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-800 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-zinc-400 dark:text-zinc-500 font-bold">No words found for this filter.</p>
                        <button
                            onClick={() => { update("difficulty", "all"); update("selectedPOS", "all"); }}
                            className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-bold"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center px-2 mb-2">
                            <SessionStatsBar
                                difficultyMode={effectiveDifficultyMode}
                                currentIndex={isTypingMode ? typing.currentIndex : card.currentIndex}
                                wordCount={words.length}
                                realtimeWpm={typing.realtimeWpm}
                                realtimeAccuracy={typing.realtimeAccuracy}
                                stats={stats}
                            />
                        </div>

                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${(((isTypingMode ? typing.currentIndex : card.currentIndex) + 1) / words.length) * 100}%` }}
                            />
                        </div>

                        {isTypingMode ? (
                            <TypingView
                                words={words}
                                currentIndex={typing.currentIndex}
                                typedCurrentWord={typing.typedCurrentWord}
                                typedWordsHistory={typing.typedWordsHistory}
                                isFocused={typing.isFocused}
                                activeWordPos={typing.activeWordPos}
                                activeWordRef={typing.activeWordRef}
                                inputRef={typing.inputRef}
                                containerRef={typing.containerRef}
                                onFocus={() => typing.setIsFocused(true)}
                                onBlur={() => typing.setIsFocused(false)}
                                onChange={typing.handleTypingInput}
                                onKeyDown={typing.handleKeyDown}
                                onClick={typing.forceFocus}
                            />
                        ) : (
                            <>
                                <div className="relative">
                                    <WordCard
                                        wordData={currentWord}
                                        revealed={card.isRevealed}
                                        typingValue={card.typingValue}
                                        isCorrect={card.isCorrect}
                                        isWrong={card.isWrong}
                                        difficultyMode={effectiveDifficultyMode}
                                        progress={allProgress[currentWord?.word]}
                                        onToggleHint={() => card.setIsRevealed(!card.isRevealed)}
                                        isMarked={markedWords.has(currentWord?.word)}
                                        onToggleMark={handleToggleMark}
                                    />
                                    {card.isCorrect && (
                                        <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {card.isWrong && (
                                        <div className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <TypingInput
                                    key={card.currentIndex}
                                    targetWord={currentWord?.word}
                                    onCorrect={card.handleCorrect}
                                    onWrong={handleCardWrong}
                                    onInputChange={(val) => {
                                        card.setTypingValue(val);
                                        if (!card.isStarted && val.length > 0) {
                                            card.setIsStarted(true);
                                            card.startTimeRef.current = Date.now();
                                            card.wordStartTimeRef.current = Date.now();
                                        }
                                    }}
                                    disabled={card.isFinished}
                                    isBlind={effectiveDifficultyMode === "hard"}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function WordPracticePage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen flex-col items-center justify-center p-12">
                <div className="text-zinc-500 font-bold">Loading review session...</div>
            </main>
        }>
            <WordPracticeContent />
        </Suspense>
    );
}
