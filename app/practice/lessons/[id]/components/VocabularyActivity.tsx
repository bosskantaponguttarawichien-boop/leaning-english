"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import vocabData from "@/data/vocab.json";
import { Activity } from "@/schemas/curriculum.schema";
import { VocabDBSchema } from "@/schemas/vocab.schema";
import { playErrorBuzz } from "@/lib/audio";
import { speak } from "@/lib/speech";

interface VocabularyActivityProps {
    activity: Activity;
    onComplete: () => void;
}

type SessionPhase = "learn" | "learn-result" | "test" | "test-result";
type AnswerStatus = "idle" | "correct" | "wrong";
type ActiveSession = Extract<SessionPhase, "learn" | "test">;

function normalizeAnswer(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function maskWordInExample(example: string, word: string) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return example.replace(new RegExp(escapedWord, "gi"), "_____");
}

export default function VocabularyActivity({ activity, onComplete }: VocabularyActivityProps) {
    const words = useMemo(() => {
        const database = VocabDBSchema.parse(vocabData);
        const byWord = new Map(database.words.map((item) => [item.word.toLowerCase(), item]));

        return (activity.options || [])
            .map((word) => byWord.get(word.toLowerCase()))
            .filter((word): word is NonNullable<typeof word> => Boolean(word));
    }, [activity.options]);

    const coreVocabularyCount = Math.min(activity.coreVocabularyCount || 8, words.length);
    const vocabularyNoteByWord = useMemo(
        () => new Map(
            (activity.vocabularyNotes || []).map((note) => [note.word.toLowerCase(), note]),
        ),
        [activity.vocabularyNotes],
    );

    const [phase, setPhase] = useState<SessionPhase>("learn");
    const [position, setPosition] = useState(0);
    const [typedAnswer, setTypedAnswer] = useState("");
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("idle");
    const [errorCount, setErrorCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [failedWordIndices, setFailedWordIndices] = useState<Set<number>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    const isActiveSession = phase === "learn" || phase === "test";
    const isTest = phase === "test";
    const currentWord = words[position];
    const vocabularyNote = currentWord
        ? vocabularyNoteByWord.get(currentWord.word.toLowerCase())
        : undefined;
    const answerLocked = answerStatus !== "idle";
    const revealTarget = !isTest || answerLocked;
    const progressNumerator = Math.min(position + (answerLocked ? 1 : 0), words.length);
    const progressPercent = words.length > 0
        ? Math.round((progressNumerator / words.length) * 100)
        : 0;
    const totalAttempts = correctCount + errorCount;
    const accuracy = totalAttempts > 0
        ? Math.round((correctCount / totalAttempts) * 100)
        : 100;

    useEffect(() => {
        if (isActiveSession) {
            inputRef.current?.focus();
        }
    }, [isActiveSession, phase, position]);

    const resetAnswer = () => {
        setTypedAnswer("");
        setAnswerStatus("idle");
    };

    const startSession = (session: ActiveSession) => {
        setPhase(session);
        setPosition(0);
        setErrorCount(0);
        setCorrectCount(0);
        setFailedWordIndices(new Set());
        resetAnswer();
    };

    const advanceSession = () => {
        if (position + 1 < words.length) {
            setPosition((current) => current + 1);
            resetAnswer();
            return;
        }

        setPhase(isTest ? "test-result" : "learn-result");
        resetAnswer();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentWord || answerLocked) return;

        const isCorrect = normalizeAnswer(typedAnswer) === normalizeAnswer(currentWord.word);
        if (isCorrect) {
            setAnswerStatus("correct");
            setCorrectCount((current) => current + 1);
            if (!isTest) speak(currentWord.word);
            return;
        }

        setAnswerStatus("wrong");
        setErrorCount((current) => current + 1);
        setFailedWordIndices((current) => new Set(current).add(position));
        playErrorBuzz();
    };

    if (words.length === 0) {
        return (
            <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 text-center">
                <p className="text-sm text-ink/60 dark:text-canvas-cream/60">ไม่พบคำศัพท์สำหรับบทนี้</p>
                <button
                    type="button"
                    onClick={onComplete}
                    className="mt-4 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-canvas-cream dark:bg-canvas-cream dark:text-ink"
                >
                    Continue →
                </button>
            </div>
        );
    }

    if (phase === "learn-result" || phase === "test-result") {
        const isLearnResult = phase === "learn-result";
        const testPassed = phase === "test-result"
            && correctCount === words.length
            && errorCount === 0;
        const failedWords = Array.from(failedWordIndices)
            .map((index) => words[index])
            .filter((word): word is NonNullable<typeof word> => Boolean(word));

        return (
            <div className="bg-canvas dark:bg-zinc-900 p-6 sm:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
                <div className={`rounded-md border p-8 text-center ${
                    isLearnResult
                        ? "border-hume-lavender/30 bg-hume-lavender/10"
                        : testPassed
                          ? "border-hume-mint/30 bg-hume-mint/10"
                          : "border-hume-coral/30 bg-hume-coral/10"
                }`}>
                    <span className="text-4xl" aria-hidden="true">
                        {isLearnResult ? "⌨️" : testPassed ? "✓" : "↻"}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-canvas-cream">
                        {isLearnResult
                            ? `เรียนครบ ${words.length} คำแล้ว`
                            : testPassed
                              ? "ผ่าน Vocabulary Test"
                              : "ยังไม่ผ่าน Vocabulary Test"}
                    </h2>
                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 dark:text-canvas-cream/60">
                        {isLearnResult
                            ? "รอบนี้เป็นการเรียนรู้ ยังไม่ถือว่าผ่าน Step 1 เลือกเรียนอีกครั้ง หรือเริ่ม Test เพื่อวัดว่าจำได้จริง"
                            : testPassed
                              ? `คุณพิมพ์ถูกครบทุกคำ ${words.length}/${words.length} โดยไม่มีข้อผิดพลาด พร้อมเข้าสู่สถานการณ์แล้ว`
                              : `Test ต้องพิมพ์ถูกทุกคำ คุณตอบถูก ${correctCount}/${words.length} กลับไปเรียนคำศัพท์ หรือสอบใหม่ได้`}
                    </p>

                    <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
                        <div className="rounded-md bg-canvas/80 p-3 dark:bg-zinc-950/60">
                            <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Vocabulary</span>
                            <strong className="mt-1 block text-xl text-ink dark:text-canvas-cream">{words.length}</strong>
                        </div>
                        <div className="rounded-md bg-canvas/80 p-3 dark:bg-zinc-950/60">
                            <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Accuracy</span>
                            <strong className={`mt-1 block text-xl ${
                                testPassed ? "text-hume-mint" : "text-ink dark:text-canvas-cream"
                            }`}>
                                {accuracy}%
                            </strong>
                        </div>
                        <div className="rounded-md bg-canvas/80 p-3 dark:bg-zinc-950/60">
                            <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Errors</span>
                            <strong className="mt-1 block text-xl text-hume-coral">{errorCount}</strong>
                        </div>
                    </div>

                    {!isLearnResult && !testPassed && failedWords.length > 0 && (
                        <div className="mx-auto mt-6 max-w-2xl">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-hume-coral">
                                คำที่ต้องทบทวน
                            </p>
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                {failedWords.map((word) => (
                                    <span
                                        key={word.word}
                                        className="rounded-full border border-hume-coral/25 bg-canvas/70 px-3 py-1.5 text-xs font-semibold text-ink dark:bg-zinc-950/50 dark:text-canvas-cream"
                                    >
                                        {word.word} · {word.meaning}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-ink/5 pt-4 sm:flex-row sm:justify-end dark:border-zinc-800">
                    {isLearnResult && (
                        <>
                            <button
                                type="button"
                                onClick={() => startSession("learn")}
                                className="rounded-full border border-ink/15 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 dark:border-canvas-cream/15 dark:text-canvas-cream"
                            >
                                เรียนอีกครั้ง
                            </button>
                            <button
                                type="button"
                                onClick={() => startSession("test")}
                                className="rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-canvas-cream transition-opacity hover:opacity-90 dark:bg-canvas-cream dark:text-ink"
                            >
                                เริ่ม Test →
                            </button>
                        </>
                    )}

                    {!isLearnResult && !testPassed && (
                        <>
                            <button
                                type="button"
                                onClick={() => startSession("learn")}
                                className="rounded-full border border-ink/15 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 dark:border-canvas-cream/15 dark:text-canvas-cream"
                            >
                                กลับไปเรียนคำศัพท์
                            </button>
                            <button
                                type="button"
                                onClick={() => startSession("test")}
                                className="rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-canvas-cream transition-opacity hover:opacity-90 dark:bg-canvas-cream dark:text-ink"
                            >
                                Test Again →
                            </button>
                        </>
                    )}

                    {testPassed && (
                        <>
                            <button
                                type="button"
                                onClick={() => startSession("test")}
                                className="rounded-full border border-ink/15 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 dark:border-canvas-cream/15 dark:text-canvas-cream"
                            >
                                Test Again
                            </button>
                            <button
                                type="button"
                                onClick={onComplete}
                                className="rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-canvas-cream transition-opacity hover:opacity-90 dark:bg-canvas-cream dark:text-ink"
                            >
                                Continue to the situation →
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const sectionLabel = position < coreVocabularyCount
        ? "คำหลักของหัวข้อ"
        : "คำช่วยอ่านทั้งบท";
    const displayExample = isTest && !answerLocked
        ? maskWordInExample(currentWord.example, currentWord.word)
        : currentWord.example;

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-6 sm:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-ink/5 pb-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-hume-lavender">
                        Step 1 • Vocabulary {isTest ? "Test" : "Typing"}
                    </h2>
                    {isTest && (
                        <span className="rounded-full bg-hume-coral/12 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-hume-coral">
                            Hard Test
                        </span>
                    )}
                </div>
                <h3 className="mt-1 text-2xl font-semibold leading-snug text-ink dark:text-canvas-cream">
                    {isTest
                        ? "สอบจำคำศัพท์ให้ได้ครบทุกคำ"
                        : "พิมพ์คำศัพท์เพื่อให้สมองจำผ่านการลงมือ"}
                </h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-canvas-cream/60">
                    {isTest
                        ? "คำอังกฤษและเสียงถูกซ่อน ใช้ความหมายกับประโยคช่วยจำ แล้วพิมพ์ให้ถูกตั้งแต่ครั้งแรก"
                        : "ดูคำ ฟังเสียง และพิมพ์ตามให้ถูก เมื่อครบแล้วคุณจะเลือกเรียนอีกครั้งหรือเริ่ม Test ได้"}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Session progress</span>
                    <p className="mt-1 text-sm font-semibold text-ink dark:text-canvas-cream">
                        {position + 1} / {words.length}
                    </p>
                </div>
                <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Correct</span>
                    <p className="mt-1 text-sm font-semibold text-hume-mint">{correctCount}</p>
                </div>
                <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">Errors</span>
                    <p className="mt-1 text-sm font-semibold text-hume-coral">{errorCount}</p>
                </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-canvas-cream/10">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${
                        isTest ? "bg-hume-coral" : "bg-hume-lavender"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className={`rounded-md border p-6 sm:p-10 text-center transition-colors ${
                answerStatus === "correct"
                    ? "border-hume-mint/40 bg-hume-mint/10"
                    : answerStatus === "wrong"
                      ? "border-hume-coral/40 bg-hume-coral/10"
                      : "border-ink/5 bg-canvas-cream dark:border-zinc-800 dark:bg-black/25"
            }`}>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full bg-hume-lavender/12 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-hume-lavender">
                        {currentWord.pos}
                    </span>
                    <span className="rounded-full border border-ink/10 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-ink/45 dark:border-canvas-cream/10 dark:text-canvas-cream/45">
                        {sectionLabel}
                    </span>
                    {isTest && (
                        <span className="rounded-full bg-hume-coral/12 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-hume-coral">
                            Test
                        </span>
                    )}
                </div>

                <div className="mt-7 flex items-center justify-center gap-3 sm:gap-5">
                    <h4
                        className={`font-display text-4xl font-semibold tracking-tight sm:text-6xl ${
                            revealTarget
                                ? "text-ink dark:text-canvas-cream"
                                : "font-mono text-ink/20 dark:text-canvas-cream/20"
                        }`}
                        aria-label={revealTarget ? currentWord.word : "คำศัพท์ถูกซ่อน"}
                    >
                        {revealTarget
                            ? currentWord.word
                            : currentWord.word.split("").map(() => "_").join(" ")}
                    </h4>
                    {!isTest && (
                        <button
                            type="button"
                            onClick={() => speak(currentWord.word)}
                            aria-label={`Listen to ${currentWord.word}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 text-lg transition-colors hover:bg-ink hover:text-canvas-cream dark:border-canvas-cream/15 dark:hover:bg-canvas-cream dark:hover:text-ink"
                        >
                            🔊
                        </button>
                    )}
                </div>

                <p className="mt-5 text-lg font-semibold text-ink/70 dark:text-canvas-cream/70">
                    {currentWord.meaning}
                </p>

                {vocabularyNote && (!isTest || answerLocked) && (
                    <div className="mx-auto mt-4 max-w-xl rounded-md bg-hume-orange/10 p-3 text-left">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-hume-orange">
                            ในบท: {vocabularyNote.formInLesson}
                        </span>
                        <p className="mt-1 text-xs leading-relaxed text-ink/65 dark:text-canvas-cream/65">
                            {vocabularyNote.contextualMeaning}
                        </p>
                    </div>
                )}

                {isTest ? (
                    <div className="mx-auto mt-5 block max-w-xl rounded-md border border-ink/5 bg-canvas px-5 py-4 text-sm italic leading-relaxed text-ink/55 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-canvas-cream/55">
                        “{displayExample}”
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => speak(currentWord.example)}
                        className="mx-auto mt-5 block max-w-xl rounded-md border border-ink/5 bg-canvas px-5 py-4 text-sm italic leading-relaxed text-ink/55 transition-colors hover:border-ink/15 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-canvas-cream/55"
                        aria-label={`Listen to example: ${currentWord.example}`}
                    >
                        “{displayExample}” <span className="not-italic opacity-40">🔊</span>
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
                <label
                    htmlFor={`vocabulary-answer-${activity.id}`}
                    className="block text-center text-xs font-semibold text-ink/50 dark:text-canvas-cream/50"
                >
                    {isTest
                        ? "พิมพ์คำอังกฤษจากความหมายด้านบน"
                        : "พิมพ์คำอังกฤษที่เห็นด้านบนอีกครั้ง"}
                </label>
                <input
                    ref={inputRef}
                    id={`vocabulary-answer-${activity.id}`}
                    type="text"
                    value={typedAnswer}
                    onChange={(event) => {
                        setTypedAnswer(event.target.value);
                        if (!isTest && answerStatus === "wrong") setAnswerStatus("idle");
                    }}
                    disabled={answerLocked}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Type the word here..."
                    className={`mt-3 w-full rounded-md border-2 bg-canvas px-4 py-4 text-center font-mono text-2xl text-ink outline-none transition-colors dark:bg-zinc-950 dark:text-canvas-cream ${
                        answerStatus === "correct"
                            ? "border-hume-mint"
                            : answerStatus === "wrong"
                              ? "border-hume-coral"
                              : "border-ink/10 focus:border-hume-lavender dark:border-zinc-700"
                    }`}
                />

                <div className="mt-3 min-h-6 text-center text-sm font-semibold" role="status">
                    {answerStatus === "correct" && (
                        <span className="text-hume-mint">✓ ถูกต้อง — คุณพิมพ์ “{currentWord.word}” ได้แล้ว</span>
                    )}
                    {answerStatus === "wrong" && (
                        <span className="text-hume-coral">
                            {isTest
                                ? `✕ ยังไม่ผ่านข้อนี้ — คำที่ถูกคือ “${currentWord.word}”`
                                : "ยังไม่ตรง ลองตรวจตัวสะกดแล้วพิมพ์อีกครั้ง"}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex justify-center">
                    {answerLocked ? (
                        <button
                            type="button"
                            onClick={advanceSession}
                            className={`rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider ${
                                answerStatus === "correct"
                                    ? "bg-hume-mint text-ink"
                                    : "bg-hume-coral text-ink"
                            }`}
                        >
                            {position + 1 < words.length
                                ? "คำถัดไป →"
                                : isTest
                                  ? "ดูผล Test →"
                                  : "ดูผลการเรียน →"}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={typedAnswer.trim().length === 0}
                            className={`rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider ${
                                typedAnswer.trim().length > 0
                                    ? "bg-ink text-canvas-cream dark:bg-canvas-cream dark:text-ink"
                                    : "cursor-not-allowed bg-ink/5 text-ink/25 dark:bg-canvas-cream/5 dark:text-canvas-cream/25"
                            }`}
                        >
                            ตรวจคำตอบ ↵
                        </button>
                    )}
                </div>
            </form>

            <p className="text-center text-[11px] text-ink/45 dark:text-canvas-cream/45">
                {isTest
                    ? "Test จะผ่านเมื่อพิมพ์ถูกทุกคำตั้งแต่ครั้งแรก • ไม่มีเสียงหรือคำใบ้ภาษาอังกฤษ"
                    : "กด Enter เพื่อตรวจคำตอบ • พิมพ์ครบแล้วยังต้องผ่าน Test ก่อนเริ่มบท"}
            </p>
        </div>
    );
}
