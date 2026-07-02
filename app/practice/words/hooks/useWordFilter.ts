"use client";

import { useState, useEffect, useMemo } from "react";
import vocabData from "@/data/vocab.json";
import { Word, VocabDBSchema } from "@/schemas/vocab.schema";
import { getProgress } from "@/lib/storage";
import { getWeightedWords, getSRSStats } from "@/lib/srs";
import { DifficultyMode } from "@/components/WordCard";

interface UseWordFilterParams {
    difficulty: string;
    selectedPOS: string;
    difficultyMode: DifficultyMode;
    timerEnabled: boolean;
    isDataLoaded: boolean;
    limit?: number;
}

export function useWordFilter({ difficulty, selectedPOS, difficultyMode, timerEnabled, isDataLoaded, limit }: UseWordFilterParams) {
    const [markedWords, setMarkedWords] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        const prog = getProgress();
        return new Set(Object.values(prog).filter(p => p.isMarked).map(p => p.word));
    });

    // Compute filtered words list dynamically using useMemo
    const words = useMemo(() => {
        if (!isDataLoaded) return [];

        try {
            if (!vocabData?.words) return [];

            const validated = VocabDBSchema.parse(vocabData);
            let filtered = validated.words;

            if (difficulty === "difficult") {
                const prog = getProgress();
                filtered = filtered.filter(w => (prog[w.word]?.wrongCount || 0) > 0);
            } else if (difficulty === "marked") {
                const prog = getProgress();
                filtered = filtered.filter(w => prog[w.word]?.isMarked === true);
            } else if (difficulty !== "all") {
                filtered = filtered.filter(w => w.difficulty === difficulty);
            }

            if (selectedPOS !== "all") {
                filtered = filtered.filter(w => w.pos === selectedPOS);
            }

            let weighted = getWeightedWords(filtered);

            if (difficultyMode === "typing") {
                weighted = weighted.map(w => ({
                    ...w,
                    word: w.word.replace(/\.\.\./g, " ").replace(/\s+/g, " ").trim(),
                    originalWord: w.word,
                } as Word & { originalWord: string }));
                if (!timerEnabled && !limit) {
                    weighted = weighted.slice(0, 50);
                }
            }

            if (limit) {
                weighted = weighted.slice(0, limit);
            }

            return weighted;
        } catch (error) {
            console.error("Failed to validate vocab data:", error);
            return [];
        }
    }, [difficulty, selectedPOS, difficultyMode, timerEnabled, isDataLoaded, limit]);

    // Compute progress mapping dynamically
    const allProgress = useMemo(() => {
        if (!isDataLoaded) return {};
        // Depend on markedWords to force re-evaluation on bookmark updates
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        markedWords;
        return getProgress();
    }, [isDataLoaded, markedWords]);

    // Compute SRS stats dynamically
    const stats = useMemo(() => {
        if (!isDataLoaded) return null;
        return getSRSStats(words);
    }, [words, isDataLoaded]);

    // Sync markedWords state asynchronously after data has loaded to prevent cascading render warnings
    useEffect(() => {
        if (!isDataLoaded) return;
        const prog = getProgress();
        const nextMarked = new Set(Object.values(prog).filter(p => p.isMarked).map(p => p.word));
        const timer = setTimeout(() => {
            setMarkedWords(nextMarked);
        }, 0);
        return () => clearTimeout(timer);
    }, [isDataLoaded]);

    return { words, allProgress, markedWords, setMarkedWords, stats };
}
