"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";

interface GuidedOutputActivityProps {
    activity: Activity;
    onComplete: (confidence: number) => void;
}

export default function GuidedOutputActivity({ activity, onComplete }: GuidedOutputActivityProps) {
    const [text, setText] = useState("");
    const [isReviewed, setIsReviewed] = useState(false);
    const [confidence, setConfidence] = useState(3);

    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    const handleReview = () => {
        setIsReviewed(true);
    };

    const handleFinish = () => {
        onComplete(confidence);
    };

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-ink/5 dark:border-zinc-850 pb-4">
                <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Real Output Production</h2>
                <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">{activity.instruction}</h3>
            </div>

            {/* Prompt Instructions */}
            <div className="p-5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md">
                <h4 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50 mb-2">Prompt / Template:</h4>
                <p className="text-sm text-ink/80 dark:text-canvas-cream/80 font-mono whitespace-pre-wrap">{activity.question}</p>
            </div>

            {/* Input Text Area */}
            <div className="flex flex-col gap-2">
                <textarea
                    disabled={isReviewed}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="w-full p-5 bg-canvas dark:bg-zinc-950 border border-ink/10 dark:border-zinc-800 focus:border-hume-lavender rounded-md text-base font-medium text-ink dark:text-canvas-cream focus:outline-none transition-all resize-none focus:ring-0 shadow-none"
                />
                <div className="flex justify-between items-center font-mono text-[10px] text-ink/50 dark:text-canvas-cream/50 px-1">
                    <span>⏱️ Limit: ~8-10 mins</span>
                    <span>Words: {wordCount}</span>
                </div>
            </div>

            {/* Evaluation & Self Reflection */}
            {isReviewed && (
                <div className="flex flex-col gap-6 pt-4 border-t border-ink/5 dark:border-zinc-800 animate-fade-in">
                    {/* Natural Reference Example */}
                    <div className="p-5 bg-hume-mint/10 border-l-2 border-hume-mint rounded-r-md">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-hume-mint mb-1.5">Natural Reference Example:</h4>
                        <p className="text-sm text-ink dark:text-canvas-cream whitespace-pre-wrap">{activity.answer as string}</p>
                    </div>

                    {/* Confidence Rating Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-semibold text-ink dark:text-canvas-cream font-display">Rate your speaking confidence:</h4>
                            <p className="text-xs text-ink/50 dark:text-canvas-cream/50">How fluent and natural did you feel writing/saying this?</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setConfidence(star)}
                                    className={`text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all focus:outline-none ${
                                        star <= confidence ? "text-hume-orange" : "text-ink/10 dark:text-canvas-cream/10"
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                            <span className="text-[10px] font-mono font-bold text-ink/40 ml-1">({confidence} / 5)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-2 pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                {!isReviewed ? (
                    <button
                        disabled={wordCount < 4}
                        onClick={handleReview}
                        className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-none ${
                            wordCount >= 4
                                ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-[0.98] hover:opacity-90"
                                : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                        }`}
                    >
                        Review Writing
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 active:scale-[0.98] transition-all font-mono text-xs uppercase tracking-wider font-bold rounded-full cursor-pointer shadow-none"
                    >
                        Finish Lesson ✓
                    </button>
                )}
            </div>
        </div>
    );
}
