"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TypingInputProps {
    targetWord: string;
    onCorrect: () => void;
    onWrong?: () => void;
    onInputChange?: (value: string) => void;
    disabled?: boolean;
}

export default function TypingInput({
    targetWord,
    onCorrect,
    onWrong,
    onInputChange,
    disabled = false,
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
                className="w-full px-4 py-3 text-2xl text-center border-2 border-zinc-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-zinc-100 disabled:cursor-not-allowed"
                placeholder="Type the word here..."
            />
        </div>
    );
}
