"use client";

import { Word } from "@/schemas/vocab.schema";
import { getProgress } from "./storage";

export interface SRSStats {
    dueCount: number;
    masteredCount: number;
    weakCount: number;
    retentionRate: number;
    avgRecallSpeed: number;
}

export function getSRSStats(allWords: Word[]): SRSStats {
    const progress = getProgress();
    const now = Date.now();

    let dueCount = 0;
    let masteredCount = 0;
    let weakCount = 0;
    let totalCorrect = 0;
    let totalAttempts = 0;
    let totalRecallTime = 0;
    let recallTimeCount = 0;

    allWords.forEach(word => {
        const p = progress[word.word];
        if (!p) return;

        if (p.nextReview <= now) dueCount++;
        if (p.level === "Mastered") masteredCount++;
        if (p.memoryStrength < 0.5) weakCount++;

        totalCorrect += p.totalCorrect;
        totalAttempts += (p.totalCorrect + p.wrongCount);

        if (p.avgResponseTime) {
            totalRecallTime += p.avgResponseTime;
            recallTimeCount++;
        }
    });

    return {
        dueCount,
        masteredCount,
        weakCount,
        retentionRate: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 100,
        avgRecallSpeed: recallTimeCount > 0 ? totalRecallTime / recallTimeCount : 0
    };
}

export function getWeightedWords(allWords: Word[]): Word[] {
    const progress = getProgress();
    const now = Date.now();

    const dueWords: Word[] = [];
    const otherWords: Word[] = [];

    allWords.forEach((word) => {
        const p = progress[word.word];

        if (p && p.nextReview <= now) {
            dueWords.push(word);
        } else {
            otherWords.push(word);
        }
    });

    // Strategy: 
    // 1. If we have due words, prioritize them heavily
    // 2. Add other words to the pool with normal weights

    const pool: Word[] = [];

    // Add due words with high priority
    dueWords.forEach(word => {
        const p = progress[word.word];
        const weight = p ? Math.ceil(p.weight * 3) : 3; // Triple weight for due words
        for (let i = 0; i < weight; i++) pool.push(word);
    });

    // Add other words with normal weights
    otherWords.forEach(word => {
        const p = progress[word.word];
        const weight = p ? Math.ceil(p.weight) : 1;
        for (let i = 0; i < weight; i++) pool.push(word);
    });

    // Shuffle and return
    return pool.sort(() => Math.random() - 0.5);
}
