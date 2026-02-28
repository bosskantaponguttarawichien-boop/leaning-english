"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TypingInputProps {
    targetWord: string;
    onCorrect: () => void;
    onInputChange?: (value: string) => void;
    disabled?: boolean;
}

export default function TypingInput({
    targetWord,
    onCorrect,
    onInputChange,
    disabled = false,
}: TypingInputProps) {
    const { register, watch, setValue, reset } = useForm<{ typing: string }>({
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
        }
    }, [typingValue, targetWord, onCorrect, onInputChange, reset]);

    return (
        <div className="w-full max-w-md mx-auto">
            <input
                {...register("typing")}
                type="text"
                autoFocus
                autoComplete="off"
                disabled={disabled}
                className="w-full px-4 py-3 text-2xl text-center border-2 border-zinc-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-zinc-100 disabled:cursor-not-allowed"
                placeholder="Type the word here..."
            />
        </div>
    );
}
