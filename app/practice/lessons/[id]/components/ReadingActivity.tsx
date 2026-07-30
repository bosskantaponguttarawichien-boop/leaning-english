"use client";

import React, { useEffect, useRef, useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { playErrorBuzz } from "@/lib/audio";

interface ReadingActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

const PLAYBACK_RATES = [
    { label: "ช้า", value: 0.75 },
    { label: "ฝึกตาม", value: 0.88 },
    { label: "ปกติ", value: 1 },
];

function splitIntoSentences(text: string) {
    const sentences = text.match(/[^.!?]+(?:[.!?]+["”']?|$)/g);
    return (sentences || [text]).map(sentence => sentence.trim()).filter(Boolean);
}

function createEnglishUtterance(text: string, rate: number) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith("en-US"))
        || voices.find(voice => voice.lang.startsWith("en"));

    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    return utterance;
}

export default function ReadingActivity({ activity, onComplete, onErrorLogged }: ReadingActivityProps) {
    const docText = activity.content || "";
    const storySentences = splitIntoSentences(docText);
    const questions = (activity.question || "").split("\n");
    const correctAnswers = (activity.answer as string || "").split(",").map(a => a.trim());
    const options = activity.options || [];
    const sentenceNotes = activity.sentenceNotes || [];

    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(""));
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(0.88);
    const [playbackMode, setPlaybackMode] = useState<"story" | "sentence" | null>(null);
    const [activeSentence, setActiveSentence] = useState<number | null>(null);
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    const playbackIdRef = useRef(0);
    const pauseTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            playbackIdRef.current += 1;
            if (pauseTimerRef.current !== null) {
                window.clearTimeout(pauseTimerRef.current);
            }
            window.speechSynthesis?.cancel();
        };
    }, [docText]);

    const stopAudio = () => {
        playbackIdRef.current += 1;
        if (pauseTimerRef.current !== null) {
            window.clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setPlaybackMode(null);
        setActiveSentence(null);
    };

    const playStoryFrom = (sentenceIndex: number, playbackId: number) => {
        if (playbackIdRef.current !== playbackId) return;

        if (sentenceIndex >= storySentences.length) {
            setPlaybackMode(null);
            setActiveSentence(null);
            return;
        }

        setActiveSentence(sentenceIndex);
        const utterance = createEnglishUtterance(storySentences[sentenceIndex], playbackRate);

        utterance.onend = () => {
            if (playbackIdRef.current !== playbackId) return;

            if (sentenceIndex === storySentences.length - 1) {
                setPlaybackMode(null);
                setActiveSentence(null);
                return;
            }

            pauseTimerRef.current = window.setTimeout(
                () => playStoryFrom(sentenceIndex + 1, playbackId),
                450,
            );
        };

        utterance.onerror = () => {
            if (playbackIdRef.current === playbackId) {
                setPlaybackMode(null);
                setActiveSentence(null);
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    const handlePlayStory = () => {
        if (playbackMode === "story") {
            stopAudio();
            return;
        }

        if (!window.speechSynthesis || storySentences.length === 0) return;

        stopAudio();
        const playbackId = playbackIdRef.current;
        setPlaybackMode("story");
        playStoryFrom(0, playbackId);
    };

    const handlePlaySentence = (sentenceIndex: number) => {
        if (!window.speechSynthesis) return;

        stopAudio();
        const playbackId = playbackIdRef.current;
        setPlaybackMode("sentence");
        setActiveSentence(sentenceIndex);

        const utterance = createEnglishUtterance(storySentences[sentenceIndex], playbackRate);
        utterance.onend = () => {
            if (playbackIdRef.current === playbackId) {
                setPlaybackMode(null);
                setActiveSentence(null);
            }
        };
        utterance.onerror = utterance.onend;
        window.speechSynthesis.speak(utterance);
    };

    const toggleSentenceNote = (sentenceIndex: number) => {
        setExpandedNotes((current) => {
            const next = new Set(current);
            if (next.has(sentenceIndex)) next.delete(sentenceIndex);
            else next.add(sentenceIndex);
            return next;
        });
    };

    const handleSelectOption = (qIdx: number, val: string) => {
        if (isChecked) return;
        setUserAnswers(prev => {
            const next = [...prev];
            next[qIdx] = val;
            return next;
        });
    };

    const handleCheck = () => {
        let allCorrect = true;
        let currentErrors = 0;

        userAnswers.forEach((ans, idx) => {
            if (ans !== correctAnswers[idx]) {
                allCorrect = false;
                currentErrors++;
                onErrorLogged("reading_error");
            }
        });

        setErrorCount(prev => prev + currentErrors);
        setIsChecked(true);

        if (allCorrect) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
            playErrorBuzz();
        }
    };

    const handleRetry = () => {
        setIsChecked(false);
        setUserAnswers(new Array(questions.length).fill(""));
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    const isAllSelected = userAnswers.every(ans => ans !== "");

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in max-w-4xl w-full">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Reading Comprehension</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[300px]">
                {/* Left Pane: Documentation Reading Material */}
                <div className="p-6 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md overflow-y-auto max-h-[480px]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Story / Dialogue:</h4>
                        <button
                            type="button"
                            onClick={handlePlayStory}
                            className={`px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider font-bold transition-all active:scale-[0.98] ${
                                playbackMode === "story"
                                    ? "bg-hume-coral text-white"
                                    : "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90"
                            }`}
                            aria-label={playbackMode === "story" ? "หยุดเสียงอ่านทั้งเรื่อง" : "ฟังเสียงอ่านทั้งเรื่อง"}
                        >
                            {playbackMode === "story" ? "■ หยุดเสียง" : "▶ ฟังทั้งเรื่อง"}
                        </button>
                    </div>

                    <div className="mb-4 rounded-md border border-hume-lavender/25 bg-hume-lavender/10 p-3">
                        <p className="text-xs font-semibold text-ink/75 dark:text-canvas-cream/75">
                            ฟังแล้วอ่านตาม: หยุดสั้นที่ <span className="font-mono text-hume-coral">,</span> และหยุดเต็มจังหวะเมื่อจบประโยค
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="เลือกความเร็วเสียง">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-ink/50 dark:text-canvas-cream/50">ความเร็ว</span>
                            {PLAYBACK_RATES.map(rate => (
                                <button
                                    key={rate.value}
                                    type="button"
                                    onClick={() => {
                                        stopAudio();
                                        setPlaybackRate(rate.value);
                                    }}
                                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                                        playbackRate === rate.value
                                            ? "border-ink bg-ink text-canvas-cream dark:border-canvas-cream dark:bg-canvas-cream dark:text-ink"
                                            : "border-ink/15 text-ink/65 hover:border-ink/40 dark:border-canvas-cream/20 dark:text-canvas-cream/65"
                                    }`}
                                    aria-pressed={playbackRate === rate.value}
                                >
                                    {rate.label} {rate.value}×
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2" aria-live="polite">
                        {storySentences.map((sentence, sentenceIndex) => {
                            const isActive = activeSentence === sentenceIndex;
                            const isExpanded = expandedNotes.has(sentenceIndex);
                            const note = sentenceNotes[sentenceIndex];

                            return (
                                <div
                                    key={`${sentence}-${sentenceIndex}`}
                                    className={`group rounded-md border p-3 transition-colors ${
                                        isActive
                                            ? "border-hume-lavender/60 bg-hume-lavender/20"
                                            : "border-transparent hover:border-ink/10 dark:hover:border-canvas-cream/10"
                                    }`}
                                    aria-current={isActive ? "true" : undefined}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePlaySentence(sentenceIndex)}
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-[10px] text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-canvas-cream dark:border-canvas-cream/20 dark:text-canvas-cream/60 dark:hover:border-canvas-cream dark:hover:bg-canvas-cream dark:hover:text-ink"
                                            aria-label={`ฟังประโยคที่ ${sentenceIndex + 1}`}
                                        >
                                            ▶
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-ink/80 dark:text-canvas-cream/80 leading-relaxed whitespace-pre-wrap font-mono">
                                                {sentence}
                                            </p>
                                            {note && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSentenceNote(sentenceIndex)}
                                                    className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-hume-lavender hover:underline"
                                                    aria-expanded={isExpanded}
                                                >
                                                    {isExpanded ? "ซ่อนคำอธิบาย ↑" : "ดูคำแปล + โครงสร้าง + Tense ↓"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {note && isExpanded && (
                                        <div className="mt-3 ml-10 grid gap-2 rounded-md border border-hume-lavender/20 bg-canvas/70 p-3 dark:bg-zinc-950/50">
                                            <div>
                                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">คำแปล</span>
                                                <p className="mt-0.5 text-sm font-semibold text-ink dark:text-canvas-cream">{note.translation}</p>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div className="rounded-md bg-hume-mint/10 p-2.5">
                                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-hume-mint">Tense / Form</span>
                                                    <p className="mt-0.5 text-xs font-semibold text-ink dark:text-canvas-cream">{note.tense}</p>
                                                </div>
                                                <div className="rounded-md bg-hume-lavender/10 p-2.5">
                                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-hume-lavender">โครงสร้าง</span>
                                                    <p className="mt-0.5 text-xs text-ink/75 dark:text-canvas-cream/75">{note.structure}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/40 dark:text-canvas-cream/40">ทำไมใช้รูปนี้</span>
                                                <p className="mt-0.5 text-xs leading-relaxed text-ink/70 dark:text-canvas-cream/70">{note.usage}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {activeSentence !== null && (
                        <p className="mt-3 text-[11px] font-semibold text-hume-lavender" role="status">
                            กำลังอ่านประโยคที่ {activeSentence + 1} จาก {storySentences.length}
                        </p>
                    )}
                </div>

                {/* Right Pane: Comprehension Questions */}
                <div className="flex flex-col gap-6 overflow-y-auto max-h-[400px]">
                    {questions.map((q, qIdx) => {
                        const isQCorrect = isChecked && userAnswers[qIdx] === correctAnswers[qIdx];
                        const isQWrong = isChecked && userAnswers[qIdx] !== correctAnswers[qIdx];

                        // Find options for this question.
                        // Assuming choices are in blocks of 2, or standard selection
                        // For simplicity, we show all options or relevant chunks
                        const relevantOptions = options.slice(qIdx * 2, (qIdx + 1) * 2);

                        return (
                            <div key={qIdx} className={`p-4 rounded-md border flex flex-col gap-3 ${
                                isQCorrect ? "bg-hume-mint/10 border-hume-mint/20" : 
                                isQWrong ? "bg-hume-coral/10 border-hume-coral/20" :
                                "bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-850"
                            }`}>
                                <h5 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">{q}</h5>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {relevantOptions.map((opt, oIdx) => {
                                        const isSelected = userAnswers[qIdx] === opt;
                                        const isCorrectOpt = opt === correctAnswers[qIdx];
                                        
                                        let btnStyle = "bg-canvas dark:bg-zinc-900 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800";
                                        if (isSelected) {
                                            btnStyle = "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender font-bold";
                                        }
                                        if (isChecked) {
                                            if (isCorrectOpt) {
                                                btnStyle = "bg-hume-mint/15 text-hume-mint border-hume-mint/30 font-bold";
                                            } else if (isSelected && !isCorrectOpt) {
                                                btnStyle = "bg-hume-coral/15 text-hume-coral border-hume-coral/30";
                                            }
                                        }

                                        return (
                                            <button
                                                disabled={isChecked}
                                                key={oIdx}
                                                onClick={() => handleSelectOption(qIdx, opt)}
                                                className={`w-full text-left px-4 py-2.5 rounded-md border text-sm font-semibold transition-all ${btnStyle} ${
                                                    isChecked ? "cursor-not-allowed" : "cursor-pointer focus:outline-none"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-sm font-semibold">
                        {isCorrect ? (
                            <span className="text-hume-mint">✨ Correct! Excellent reading comprehension.</span>
                        ) : (
                            <span className="text-hume-coral">⚠️ Some answers are incorrect. Review the snippet and retry.</span>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 w-full sm:w-auto">
                    {isChecked && !isCorrect && (
                        <button
                            onClick={handleRetry}
                            className="px-5 py-2.5 bg-transparent text-ink dark:text-canvas-cream border border-ink/20 dark:border-canvas-cream/30 hover:bg-ink/5 dark:hover:bg-canvas-cream/5 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all active:scale-[0.98] cursor-pointer"
                        >
                            Retry
                        </button>
                    )}
                    {(!isChecked || !isCorrect) ? (
                        <button
                            disabled={!isAllSelected}
                            onClick={handleCheck}
                            className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                                isAllSelected
                                    ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                    : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                            }`}
                        >
                            Check Reading
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
