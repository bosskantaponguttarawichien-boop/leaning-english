"use client";

import React, { useMemo } from "react";
import { Word } from "@/schemas/vocab.schema";

interface TypingViewProps {
    words: Word[];
    currentIndex: number;
    typedCurrentWord: string;
    typedWordsHistory: string[];
    isFocused: boolean;
    activeWordPos: { top: number; left: number; width: number; height: number };
    activeWordRef: React.RefObject<HTMLSpanElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onFocus: () => void;
    onBlur: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClick: () => void;
}

export default function TypingView({
    words, currentIndex, typedCurrentWord, typedWordsHistory,
    isFocused, activeWordPos, activeWordRef, inputRef, containerRef,
    onFocus, onBlur, onChange, onKeyDown, onClick,
}: TypingViewProps) {
    const wordStream = useMemo(() => {
        if (words.length === 0) return null;

        return words.map((wordObj, wordIdx) => {
            const word = wordObj.word;
            const isCurrent = wordIdx === currentIndex;
            const isTyped = wordIdx < currentIndex;
            const typedVal = isTyped ? typedWordsHistory[wordIdx] : (isCurrent ? typedCurrentWord : "");

            let wordClass = "transition-all duration-150 inline-block mr-4 py-1 select-none ";
            if (isCurrent) {
                wordClass += "border-b-2 border-yellow-500/50 dark:border-yellow-400/50 pb-0.5 rounded-sm";
            }

            return (
                <span key={wordIdx} ref={isCurrent ? activeWordRef : undefined} className={wordClass}>
                    {word.split("").map((char, charIdx) => {
                        const typedChar = typedVal[charIdx];
                        let charClass = "transition-colors duration-100 ";

                        if (isTyped) {
                            const wasCorrect = typedWordsHistory[wordIdx] === word;
                            charClass += wasCorrect
                                ? "text-zinc-800 dark:text-zinc-200"
                                : "text-red-500 dark:text-red-400 underline decoration-red-400/50 decoration-2 underline-offset-4";
                        } else if (isCurrent) {
                            if (typedChar === undefined) {
                                charClass += "text-zinc-300 dark:text-zinc-600";
                            } else if (typedChar === char) {
                                charClass += "text-zinc-800 dark:text-zinc-100 font-semibold";
                            } else {
                                charClass += "text-red-500 dark:text-red-400 underline decoration-red-400/50 decoration-2 underline-offset-4 font-semibold";
                            }
                        } else {
                            charClass += "text-zinc-300 dark:text-zinc-600/70";
                        }

                        return (
                            <span key={charIdx} className="relative inline">
                                {isCurrent && charIdx === typedVal.length && isFocused && (
                                    <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-yellow-500 dark:bg-yellow-400 animate-pulse z-10" />
                                )}
                                <span className={charClass}>{char}</span>
                            </span>
                        );
                    })}
                    {isCurrent && typedVal.length > word.length && (
                        <span className="relative inline">
                            {typedVal.slice(word.length).split("").map((extraChar, extraIdx) => (
                                <span key={extraIdx} className="text-red-600 dark:text-red-400 line-through opacity-80">{extraChar}</span>
                            ))}
                            {isFocused && (
                                <span className="absolute -right-[1px] top-0 bottom-0 w-[2px] bg-yellow-500 dark:bg-yellow-400 animate-pulse z-10" />
                            )}
                        </span>
                    )}
                </span>
            );
        });
    }, [words, currentIndex, typedWordsHistory, typedCurrentWord, isFocused, activeWordRef]);

    return (
        <div className="relative" onClick={onClick}>
            <div
                ref={containerRef}
                className={`relative p-8 rounded-[2.5rem] bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-xl cursor-text transition-all duration-300 h-[150px] overflow-hidden sm:h-auto sm:min-h-[160px] sm:overflow-visible ${!isFocused ? "blur-[2px] opacity-50 scale-[0.99]" : ""}`}
            >
                <div className="relative flex flex-wrap leading-relaxed text-xl font-sans text-justify gap-y-2 select-none z-10 pointer-events-none">
                    <input
                        ref={inputRef}
                        type="text"
                        value={typedCurrentWord}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="absolute opacity-0 z-20 cursor-default select-none pointer-events-auto"
                        style={{
                            top: activeWordPos.top,
                            left: activeWordPos.left,
                            width: activeWordPos.width || "100px",
                            height: activeWordPos.height || "30px",
                            fontSize: "16px",
                        }}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    {wordStream}
                </div>
            </div>

            {!isFocused && (
                <div
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xs rounded-[2.5rem] z-30 cursor-text"
                >
                    <span className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg animate-pulse">
                        Click to Focus and Type
                    </span>
                </div>
            )}
        </div>
    );
}
