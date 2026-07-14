"use client";

import React, { useState } from "react";
import { Activity } from "@/schemas/curriculum.schema";
import { playErrorBuzz } from "@/lib/audio";

interface ClassifyActivityProps {
    activity: Activity;
    onComplete: (errors: number) => void;
    onErrorLogged: (errorTag: string) => void;
}

export default function ClassifyActivity({ activity, onComplete, onErrorLogged }: ClassifyActivityProps) {
    const questions = (activity.question || "").split("\n");
    const options = activity.options || [];
    const correctAnswers = (activity.answer as string || "").split(",").map(a => a.trim());

    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(""));
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const handleSelect = (idx: number, val: string) => {
        if (isChecked) return;
        setUserAnswers(prev => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const handleCheck = () => {
        let isAllCorrect = true;
        let currentErrors = 0;

        userAnswers.forEach((ans, idx) => {
            const correct = correctAnswers[idx];
            if (ans !== correct) {
                isAllCorrect = false;
                currentErrors++;

                // Logging specific error tags for L01 Be/Action
                if (activity.id.startsWith("L01")) {
                    if (correct === "am" && ans === "-") {
                        onErrorLogged("missing_be");
                    } else if (correct === "-" && ans === "am") {
                        onErrorLogged("extra_be");
                    } else {
                        onErrorLogged("wrong_tense");
                    }
                } else {
                    onErrorLogged("grammar_error");
                }
            }
        });

        setErrorCount(prev => prev + currentErrors);
        setIsChecked(true);

        if (isAllCorrect) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
            playErrorBuzz();
        }
    };

    const handleNext = () => {
        onComplete(errorCount);
    };

    const handleRetry = () => {
        setIsChecked(false);
    };

    const isAllSelected = userAnswers.every(ans => ans !== "");

    return (
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-700/50 pb-4">
                <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Classification Challenge</h2>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">{activity.instruction}</h3>
            </div>

            {/* Questions List */}
            <div className="flex-1 flex flex-col gap-4 py-2">
                {questions.map((q, idx) => {
                    const isQuestionCorrect = isChecked && userAnswers[idx] === correctAnswers[idx];
                    const isQuestionWrong = isChecked && userAnswers[idx] !== correctAnswers[idx];

                    // Replace the "___" with a drop down select box
                    let textParts = q.split("___");
                    if (textParts.length === 1) {
                        // Fallback: If "___" is missing, check for a parenthesized segment like (word)
                        const match = q.match(/\(([^)]+)\)/);
                        if (match) {
                            const index = q.indexOf(match[0]);
                            textParts = [q.substring(0, index), q.substring(index)];
                        }
                    }
                    return (
                        <div key={idx} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                            isQuestionCorrect ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" : 
                            isQuestionWrong ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" :
                            "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                        }`}>
                            <div className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                                {textParts[0]}
                                <span className="inline-block mx-1.5 align-middle">
                                    <select
                                        disabled={isChecked}
                                        value={userAnswers[idx]}
                                        onChange={(e) => handleSelect(idx, e.target.value)}
                                        className={`px-3 py-1.5 font-bold font-mono rounded-xl border text-sm focus:outline-none transition-all ${
                                            isChecked 
                                                ? (isQuestionCorrect ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300") 
                                                : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        }`}
                                    >
                                        <option value="" disabled>-- select --</option>
                                        {options.map((opt, oIdx) => (
                                            <option key={oIdx} value={opt}>{opt === "-" ? "[ leave blank ]" : opt}</option>
                                        ))}
                                    </select>
                                </span>
                                {textParts[1]}
                            </div>

                            {isChecked && (
                                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-end sm:self-auto">
                                    {isQuestionCorrect ? (
                                        <span className="text-green-600 dark:text-green-400">Correct ✓</span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400">Correct: {correctAnswers[idx] === "-" ? "[blank]" : correctAnswers[idx]}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Feedback & Actions */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isChecked && (
                    <div className="text-base font-bold">
                        {isCorrect ? (
                            <span className="text-green-600 dark:text-green-400">✨ Great job! All answers are correct.</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400">⚠️ {correctAnswers.length - userAnswers.filter((a, i) => a === correctAnswers[i]).length} incorrect selections. Try again!</span>
                        )}
                    </div>
                )}
                <div className="flex justify-end gap-3 w-full sm:w-auto">
                    {isChecked && !isCorrect && (
                        <button
                            onClick={handleRetry}
                            className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-extrabold text-sm rounded-2xl transition-all"
                        >
                            Retry
                        </button>
                    )}
                    {(!isChecked || !isCorrect) ? (
                        <button
                            disabled={!isAllSelected}
                            onClick={handleCheck}
                            className={`px-8 py-3.5 font-black text-base rounded-2xl shadow-lg transition-all ${
                                isAllSelected 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-[0.98]" 
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
                            }`}
                        >
                            Check Answers
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
