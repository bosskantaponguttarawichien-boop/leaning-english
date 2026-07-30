"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { speak } from "@/lib/speech";

interface RoleplayActivityProps {
    activity: Activity;
    onComplete: (confidence: number) => void;
}

export default function RoleplayActivity({ activity, onComplete }: RoleplayActivityProps) {
    const prompts = activity.options || [];
    const models = Array.isArray(activity.answer) ? activity.answer : [];
    const [turn, setTurn] = useState(0);
    const [responses, setResponses] = useState<string[]>(() => prompts.map(() => ""));
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    const [confidence, setConfidence] = useState(3);

    const currentResponse = responses[turn] || "";
    const isLast = turn === prompts.length - 1;

    const setCurrentResponse = (value: string) => {
        setResponses((current) => {
            const next = [...current];
            next[turn] = value;
            return next;
        });
    };

    const revealModel = () => setRevealed((current) => new Set(current).add(turn));

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-6 sm:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-ink/5 dark:border-zinc-800 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-hume-coral">
                    Real-life Roleplay
                </h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 font-display">
                    {activity.instruction}
                </h3>
                {activity.context && (
                    <p className="text-sm text-ink/60 dark:text-canvas-cream/60 mt-2">{activity.context}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {prompts.map((_, index) => (
                    <span
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${
                            index <= turn ? "bg-hume-coral" : "bg-ink/10 dark:bg-white/10"
                        }`}
                    />
                ))}
            </div>

            <div className="p-5 rounded-md bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink/45 dark:text-white/45">
                    คู่สนทนา • Turn {turn + 1}/{prompts.length}
                </span>
                <div className="flex items-start justify-between gap-4 mt-2">
                    <p className="text-lg font-semibold text-ink dark:text-canvas-cream">{prompts[turn]}</p>
                    <button
                        type="button"
                        onClick={() => speak(prompts[turn])}
                        className="w-9 h-9 shrink-0 rounded-full border border-ink/10 dark:border-zinc-700"
                    >
                        🔊
                    </button>
                </div>
            </div>

            {activity.hint && (
                <div className="p-4 rounded-md bg-hume-lavender/10 border border-hume-lavender/20">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-hume-lavender font-bold">Phrase bank</span>
                    <p className="text-sm mt-1 text-ink/75 dark:text-canvas-cream/75">{activity.hint}</p>
                </div>
            )}

            <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink/45 dark:text-white/45">
                    พูดออกเสียงก่อน แล้วพิมพ์สิ่งที่คุณพูด
                </label>
                <textarea
                    rows={3}
                    value={currentResponse}
                    onChange={(event) => setCurrentResponse(event.target.value)}
                    placeholder="Your response..."
                    className="w-full mt-2 p-4 rounded-md bg-canvas dark:bg-zinc-950 border border-ink/10 dark:border-zinc-800 focus:border-hume-coral focus:outline-none resize-none"
                />
            </div>

            {revealed.has(turn) && (
                <div className="p-4 rounded-md bg-hume-mint/10 border-l-2 border-hume-mint">
                    <div className="flex justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-hume-mint font-bold">
                                Natural model — ไม่จำเป็นต้องเหมือนทุกคำ
                            </span>
                            <p className="text-sm mt-1 text-ink dark:text-canvas-cream">{models[turn]}</p>
                        </div>
                        <button type="button" onClick={() => speak(models[turn])} className="shrink-0">🔊</button>
                    </div>
                </div>
            )}

            {isLast && revealed.has(turn) && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-ink/5 dark:border-zinc-800">
                    <div>
                        <strong className="text-sm">ความมั่นใจในการตอบ</strong>
                        <p className="text-xs text-ink/50 dark:text-white/50">ประเมินความคล่อง ไม่ใช่ความสมบูรณ์แบบ</p>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                type="button"
                                key={score}
                                onClick={() => setConfidence(score)}
                                className={score <= confidence ? "text-hume-orange text-xl" : "text-ink/15 dark:text-white/15 text-xl"}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end gap-3">
                {!revealed.has(turn) ? (
                    <button
                        type="button"
                        disabled={currentResponse.trim().split(/\s+/).length < 2}
                        onClick={revealModel}
                        className={`px-6 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold ${
                            currentResponse.trim().split(/\s+/).length >= 2
                                ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink"
                                : "bg-ink/5 dark:bg-white/5 text-ink/30 dark:text-white/30 cursor-not-allowed"
                        }`}
                    >
                        Compare with model
                    </button>
                ) : !isLast ? (
                    <button
                        type="button"
                        onClick={() => setTurn((value) => value + 1)}
                        className="px-6 py-3 rounded-full bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono text-xs uppercase tracking-wider font-bold"
                    >
                        Next turn →
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onComplete(confidence)}
                        className="px-6 py-3 rounded-full bg-hume-mint text-ink font-mono text-xs uppercase tracking-wider font-bold"
                    >
                        Finish roleplay ✓
                    </button>
                )}
            </div>
        </div>
    );
}
