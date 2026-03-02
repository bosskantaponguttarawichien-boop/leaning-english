"use client";


export type WordLevel = "New" | "Learning" | "Reviewing" | "Familiar" | "Strong" | "Mastered";

export interface WordProgress {
    word: string;
    correctStreak: number;
    wrongCount: number;
    totalCorrect: number;
    lastTested: number;
    nextReview: number;
    memoryStrength: number; // 0.0 to 1.0
    level: WordLevel;
    weight: number; // probability multiplier for backward compatibility or non-SRS modes
    avgResponseTime?: number;
    isMarked?: boolean;
}

const STORAGE_KEY = "englist_progress_v2"; // Incrementing version for schema change

export function getProgress(): Record<string, WordProgress> {
    if (typeof window === "undefined") return {};
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

const STREAK_LEVELS: WordLevel[] = ["New", "Learning", "Reviewing", "Familiar", "Strong", "Mastered"];

export function saveWordResult(word: string, isCorrect: boolean, responseTimeMs?: number, options?: { isTestMode?: boolean }) {
    const progress = getProgress();
    const current = progress[word] || {
        word,
        correctStreak: 0,
        wrongCount: 0,
        totalCorrect: 0,
        lastTested: Date.now(),
        nextReview: Date.now(),
        memoryStrength: 0,
        level: "New" as WordLevel,
        weight: 1.0,
    };

    if (isCorrect) {
        current.correctStreak += 1;
        current.totalCorrect += 1;

        // Bonus streak for fast recall (< 3s)
        if (responseTimeMs && responseTimeMs < 3000) {
            current.correctStreak += 0.5;
        }
    } else {
        current.correctStreak = Math.max(0, current.correctStreak > 1 ? 1 : 0); // Drop to 1 if failed after success, else 0
        if (options?.isTestMode) {
            current.wrongCount += 1;
        }
    }

    // Update Average Response Time
    if (responseTimeMs) {
        current.avgResponseTime = current.avgResponseTime
            ? (current.avgResponseTime * 0.7) + (responseTimeMs * 0.3)
            : responseTimeMs;
    }

    // Calculate Level
    const levelIdx = Math.min(STREAK_LEVELS.length - 1, Math.floor(current.correctStreak));
    current.level = STREAK_LEVELS[levelIdx];

    // Calculate Memory Strength (MVP formula)
    const total = current.totalCorrect + current.wrongCount;
    current.memoryStrength = total > 0 ? current.totalCorrect / total : 0;

    // Schedule Next Review (2^streak days)
    // We use floor of streak for the exponent to handle 0.5 bonus streaks smoothly
    const intervalDays = Math.pow(2, Math.floor(current.correctStreak));
    const oneDayMs = 24 * 60 * 60 * 1000;
    current.nextReview = Date.now() + (intervalDays * oneDayMs);

    // Update Weight (for legacy selection fallback)
    if (isCorrect) {
        current.weight = Math.max(0.1, current.weight * 0.8);
    } else {
        current.weight = Math.min(5.0, current.weight * 1.5);
    }

    current.lastTested = Date.now();
    progress[word] = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

export function toggleWordMark(word: string): boolean {
    const progress = getProgress();
    const current = progress[word] || {
        word,
        correctStreak: 0,
        wrongCount: 0,
        totalCorrect: 0,
        lastTested: Date.now(),
        nextReview: Date.now(),
        memoryStrength: 0,
        level: "New" as WordLevel,
        weight: 1.0,
    };
    current.isMarked = !current.isMarked;
    progress[word] = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return !!current.isMarked;
}
