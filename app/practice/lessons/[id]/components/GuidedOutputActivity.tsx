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
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Real Output Production</h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Prompt Instructions */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                <h4 className="text-xs uppercase tracking-widest font-black text-zinc-400 mb-2">Prompt / Template:</h4>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre-wrap">{activity.question}</p>
            </div>

            {/* Input Text Area */}
            <div className="flex flex-col gap-2">
                <textarea
                    disabled={isReviewed}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="w-full p-5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl text-base font-medium text-zinc-800 dark:text-white focus:outline-none transition-all resize-none shadow-inner"
                />
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
                    <span>⏱️ Limit: ~8-10 mins</span>
                    <span>Words: {wordCount}</span>
                </div>
            </div>

            {/* Evaluation & Self Reflection */}
            {isReviewed && (
                <div className="flex flex-col gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 animate-fade-in">
                    {/* Natural Reference Example */}
                    <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/10 border-l-4 border-emerald-500 rounded-r-2xl">
                        <h4 className="text-xs uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 mb-1.5">Natural Reference Example:</h4>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">{activity.answer as string}</p>
                    </div>

                    {/* Confidence Rating Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">Rate your speaking confidence:</h4>
                            <p className="text-xs font-semibold text-zinc-400">How fluent and natural did you feel writing/saying this?</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setConfidence(star)}
                                    className={`text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all ${
                                        star <= confidence ? "text-yellow-400" : "text-zinc-200 dark:text-zinc-700"
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                            <span className="text-xs font-black text-zinc-500 dark:text-zinc-400 ml-1">({confidence} / 5)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex justify-end">
                {!isReviewed ? (
                    <button
                        disabled={wordCount < 4}
                        onClick={handleReview}
                        className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                            wordCount >= 4
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                        }`}
                    >
                        Review Writing
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        Finish Lesson ✓
                    </button>
                )}
            </div>
        </div>
    );
}
