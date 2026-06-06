"use client";

import { useState, useEffect } from "react";
import vocabData from "@/data/vocab.json";
import { Word, VocabDBSchema } from "@/schemas/vocab.schema";
import { getProgress, WordProgress } from "@/lib/storage";
import { getWeightedWords, getSRSStats, SRSStats } from "@/lib/srs";
import { DifficultyMode } from "@/components/WordCard";

interface UseWordFilterParams {
    difficulty: string;
    selectedPOS: string;
    difficultyMode: DifficultyMode;
    timerEnabled: boolean;
    isDataLoaded: boolean;
}

export function useWordFilter({ difficulty, selectedPOS, difficultyMode, timerEnabled, isDataLoaded }: UseWordFilterParams) {
    const [words, setWords] = useState<Word[]>([]);
    const [allProgress, setAllProgress] = useState<Record<string, WordProgress>>({});
    const [markedWords, setMarkedWords] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<SRSStats | null>(null);

    // Load filtered words whenever filters or data readiness change
    useEffect(() => {
        if (!isDataLoaded) return;

        try {
            if (!vocabData?.words) { setWords([]); return; }

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
                if (!timerEnabled) {
                    weighted = weighted.slice(0, 50);
                }
            }

            setWords(weighted);
        } catch (error) {
            console.error("Failed to validate vocab data:", error);
            setWords([]);
        }
    }, [difficulty, selectedPOS, difficultyMode, timerEnabled, isDataLoaded]);

    // Refresh progress/stats whenever words change
    useEffect(() => {
        if (!isDataLoaded) return;
        const prog = getProgress();
        setAllProgress(prog);
        setStats(getSRSStats(words));
        setMarkedWords(new Set(Object.values(prog).filter(p => p.isMarked).map(p => p.word)));
    }, [words, isDataLoaded]);

    return { words, allProgress, markedWords, setMarkedWords, stats };
}
