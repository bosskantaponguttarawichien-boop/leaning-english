"use client";

import { readData, setData, onDataChange } from "./db";

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

const STORAGE_KEY = "englist_progress_v2"; // Local fallback
const DEFAULT_USER_ID = "default_user";

// Local cache to keep synchronous functions working immediately
let localCache: Record<string, WordProgress> | null = null;

/**
 * Initializes the data by fetching from DB first.
 * Should be called once when the app loads (e.g., inside useEffect in layout or page).
 */
export async function syncProgressFromDB(): Promise<Record<string, WordProgress>> {
    const result = await readData(`users/${DEFAULT_USER_ID}/progress`);
    if (result.success) {
        // If data exists, use it. If null (meaning deleted in Firebase), use empty object
        localCache = result.data || {};

        // Sync local storage to match Firebase state exactly
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localCache));
        }
        return localCache as Record<string, WordProgress>;
    } else {
        // Fallback to local storage
        if (typeof window !== "undefined") {
            const data = localStorage.getItem(STORAGE_KEY);
            localCache = data ? JSON.parse(data) : {};
        } else {
            localCache = {};
        }
        return localCache as Record<string, WordProgress>;
    }
}

/**
 * Listens to Realtime DB and keeps local state continuously updated.
 */
export function listenToProgress(callback: (progress: Record<string, WordProgress>) => void) {
    return onDataChange(`users/${DEFAULT_USER_ID}/progress`, (data) => {
        const progress = data || {};
        localCache = progress as Record<string, WordProgress>;

        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localCache));
        }

        callback(localCache);
    });
}

/**
 * Synchronous get function. Relies on the localCache or localStorage.
 */
export function getProgress(): Record<string, WordProgress> {
    if (localCache) return localCache;

    if (typeof window === "undefined") return {};
    const data = localStorage.getItem(STORAGE_KEY);
    localCache = data ? JSON.parse(data) : {};
    return localCache as Record<string, WordProgress>;
}

const STREAK_LEVELS: WordLevel[] = ["New", "Learning", "Reviewing", "Familiar", "Strong", "Mastered"];

export function saveWordResult(word: string, isCorrect: boolean, responseTimeMs?: number, options?: { isTestMode?: boolean, isHardMode?: boolean }) {
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

        if (options?.isHardMode) {
            current.wrongCount = 0; // successfully spelled in hard mode clears it from the 'difficult words'
        }
    } else {
        current.correctStreak = Math.max(0, current.correctStreak > 1 ? 1 : 0); // Drop to 1 if failed after success, else 0
        if (options?.isTestMode || options?.isHardMode) {
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

    // 1. Update Memory (Local Cache)
    progress[word] = current;
    localCache = progress;

    // 2. Update Local Storage Fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    // 3. Update Firebase asynchronously
    setData(`users/${DEFAULT_USER_ID}/progress/${word}`, current);
}

export function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    localCache = {};
    // Also remove from Firebase
    setData(`users/${DEFAULT_USER_ID}/progress`, null);
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
    localCache = progress;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    // Sync to Firebase
    setData(`users/${DEFAULT_USER_ID}/progress/${word}`, current);

    return !!current.isMarked;
}
