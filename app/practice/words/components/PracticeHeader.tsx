"use client";

import React from "react";
import Timer from "@/components/Timer";
import { DifficultyMode } from "@/components/WordCard";
import { SRSStats } from "@/lib/srs";

interface PracticeHeaderProps {
    difficultyMode: DifficultyMode;
    difficulty: string;
    selectedPOS: string;
    timerEnabled: boolean;
    isSpeechEnabled: boolean;
    isSoundEnabled: boolean;
    isStarted: boolean;
    stats: SRSStats | null;
    onDifficultyChange: (v: string) => void;
    onPOSChange: (v: string) => void;
    onModeChange: (m: DifficultyMode) => void;
    onTimerToggle: (v: boolean) => void;
    onSpeechToggle: (v: boolean) => void;
    onSoundToggle: (v: boolean) => void;
    onTimeup: () => void;
}

const MODES: DifficultyMode[] = ["normal", "test", "hard", "typing"];

export default function PracticeHeader({
    difficultyMode, difficulty, selectedPOS,
    timerEnabled, isSpeechEnabled, isSoundEnabled,
    isStarted, stats,
    onDifficultyChange, onPOSChange, onModeChange,
    onTimerToggle, onSpeechToggle, onSoundToggle, onTimeup,
}: PracticeHeaderProps) {
    const selectClass = "w-full bg-zinc-50/50 dark:bg-zinc-800/80 border border-zinc-100/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-zinc-900 transition-all appearance-none cursor-pointer";

    return (
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
                        <Timer initialSeconds={60} isActive={isStarted} onTimeup={onTimeup} />
                    ) : (
                        <div className="flex items-center gap-3">
                            {difficultyMode !== "typing" && stats && stats.dueCount > 0 && (
                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-100 animate-pulse">
                                    {stats.dueCount} DUE
                                </span>
                            )}
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black rounded-full uppercase">Zen Mode</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex flex-col md:flex-row gap-6 transition-all duration-300 ${isStarted && difficultyMode === "typing" ? "hidden sm:flex" : ""}`}>
                <div className="flex flex-col gap-2 flex-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">Configuration</label>
                    <div className="grid grid-cols-2 gap-2">
                        <select value={difficulty} onChange={(e) => onDifficultyChange(e.target.value)} className={selectClass}>
                            <option value="all">Any Level</option>
                            <option value="marked">Marked Words</option>
                            <option value="difficult">Difficult Words (Needs Review)</option>
                            <option value="A1">A1 (Beginner)</option>
                            <option value="A2">A2 (Elementary)</option>
                            <option value="B1">B1 (Intermediate)</option>
                        </select>
                        <select value={selectedPOS} onChange={(e) => onPOSChange(e.target.value)} className={selectClass}>
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
                        <div className="flex bg-zinc-50/50 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-100/50 dark:border-zinc-700/50 gap-1">
                            {MODES.map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => onModeChange(mode)}
                                    className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-xl capitalize transition-all ${difficultyMode === mode
                                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-row items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/80 px-4 py-1 rounded-2xl border border-zinc-100/50 dark:border-zinc-700/50">
                            {([
                                { label: "Timer", checked: timerEnabled, onChange: onTimerToggle },
                                { label: "Voice", checked: isSpeechEnabled, onChange: onSpeechToggle },
                                { label: "Beep", checked: isSoundEnabled, onChange: onSoundToggle },
                            ] as const).map(({ label, checked, onChange }) => (
                                <label key={label} className="flex items-center gap-2 cursor-pointer group py-1">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => onChange(e.target.checked)}
                                        className="w-4 h-4 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
