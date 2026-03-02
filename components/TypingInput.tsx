"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TypingInputProps {
    targetWord: string;
    onCorrect: () => void;
    onWrong?: () => void;
    onInputChange?: (value: string) => void;
    disabled?: boolean;
    isBlind?: boolean;
}

export default function TypingInput({
    targetWord,
    onCorrect,
    onWrong,
    onInputChange,
    disabled = false,
    isBlind = false,
}: TypingInputProps) {
    const { register, watch, reset } = useForm<{ typing: string }>({
        defaultValues: { typing: "" },
    });

    const typingValue = watch("typing");

    useEffect(() => {
        if (onInputChange) {
            onInputChange(typingValue);
        }

        if (typingValue === targetWord) {
            onCorrect();
            reset();
        } else if (targetWord && typingValue.length >= targetWord.length && typingValue !== targetWord) {
            if (onWrong) {
                onWrong();
            }
            reset();
        }
    }, [typingValue, targetWord, onCorrect, onWrong, onInputChange, reset]);

    return (
        <div className="w-full max-w-md mx-auto">
            <input
                {...register("typing")}
                type="text"
                autoFocus
                autoComplete="off"
                autoCapitalize="none"
                disabled={disabled}
                className={`w-full px-4 py-3 text-2xl text-center border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 outline-none transition-all disabled:bg-zinc-100 dark:disabled:bg-zinc-900/50 disabled:cursor-not-allowed ${isBlind ? "text-transparent dark:text-transparent caret-zinc-900 dark:caret-white selection:bg-transparent dark:selection:bg-transparent" : "placeholder:text-zinc-400 dark:placeholder:text-zinc-600"}`}
                placeholder="Type the word here..."
            />
        </div>
    );
}
