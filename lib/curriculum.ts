"use client";

import { readData, setData } from "./db";
import curriculumData from "@/data/curriculum.json";
import { CurriculumSchema, Lesson, LessonProgress, LessonProgressSchema } from "@/schemas/curriculum.schema";

const STORAGE_KEY = "englist_curriculum_progress_v1";
const DEFAULT_USER_ID = "default_user";

// Local cache
let localCache: Record<string, LessonProgress> | null = null;

/**
 * Validates and loads curriculum content from JSON.
 */
export function getCurriculum(): Lesson[] {
    try {
        const validated = CurriculumSchema.parse(curriculumData);
        return validated.lessons;
    } catch (error) {
        console.error("Failed to parse curriculum database:", error);
        return [];
    }
}

/**
 * Syncs curriculum progress from Firebase Realtime DB.
 */
export async function syncCurriculumProgressFromDB(): Promise<Record<string, LessonProgress>> {
    const result = await readData(`users/${DEFAULT_USER_ID}/curriculum_progress`);
    
    let localProg: Record<string, LessonProgress> = {};
    if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY);
        localProg = data ? JSON.parse(data) : {};
    }

    if (result.success) {
        const remoteProg = (result.data || {}) as Record<string, LessonProgress>;
        const mergedProg = { ...localProg };

        const STATUS_ORDER = { locked: 0, available: 1, learning: 2, review: 3, mastered: 4 };
        let hasNewLocalUpdates = false;
        const updatesToFirebase: Record<string, LessonProgress> = {};

        const allKeys = new Set([...Object.keys(localProg), ...Object.keys(remoteProg)]);
        for (const lessonId of allKeys) {
            const local = localProg[lessonId];
            const remote = remoteProg[lessonId];

            if (local && remote) {
                const localStatusVal = STATUS_ORDER[local.status] || 0;
                const remoteStatusVal = STATUS_ORDER[remote.status] || 0;

                if (localStatusVal > remoteStatusVal) {
                    mergedProg[lessonId] = local;
                    hasNewLocalUpdates = true;
                    updatesToFirebase[lessonId] = local;
                } else if (remoteStatusVal > localStatusVal) {
                    mergedProg[lessonId] = remote;
                } else {
                    const localTime = new Date(local.lastStudiedAt || 0).getTime();
                    const remoteTime = new Date(remote.lastStudiedAt || 0).getTime();
                    if (localTime >= remoteTime) {
                        mergedProg[lessonId] = local;
                        if (localTime > remoteTime) {
                            hasNewLocalUpdates = true;
                            updatesToFirebase[lessonId] = local;
                        }
                    } else {
                        mergedProg[lessonId] = remote;
                    }
                }
            } else if (local) {
                mergedProg[lessonId] = local;
                hasNewLocalUpdates = true;
                updatesToFirebase[lessonId] = local;
            } else if (remote) {
                mergedProg[lessonId] = remote;
            }
        }

        localCache = mergedProg;
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedProg));
        }

        if (hasNewLocalUpdates) {
            Object.entries(updatesToFirebase).forEach(([id, progressItem]) => {
                setData(`users/${DEFAULT_USER_ID}/curriculum_progress/${id}`, progressItem)
                    .catch(err => console.error(`Failed to sync-back curriculum progress for ${id} to Firebase:`, err));
            });
        }

        return mergedProg;
    } else {
        localCache = localProg;
        return localCache;
    }
}

/**
 * Returns all lesson progress records.
 */
export function getCurriculumProgress(): Record<string, LessonProgress> {
    if (localCache) return localCache;

    if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY);
        localCache = data ? JSON.parse(data) : {};
    } else {
        localCache = {};
    }
    return localCache as Record<string, LessonProgress>;
}

/**
 * Gets a single lesson progress record, instantiating defaults if not exists.
 */
export function getLessonProgress(lessonId: string): LessonProgress {
    const progress = getCurriculumProgress();
    if (progress[lessonId]) {
        return progress[lessonId];
    }

    const defaultProgress: LessonProgress = {
        lessonId,
        status: lessonId === "L01" ? "available" : "locked", // First lesson starts unlocked
        attempts: 0,
        recognitionAccuracy: 0,
        productionAccuracy: 0,
        speakingConfidence: 3,
        errorTags: {},
        weakChunks: [],
        lastStudiedAt: new Date().toISOString(),
        nextReviewAt: new Date().toISOString(),
    };

    return defaultProgress;
}

/**
 * Updates progress for a specific lesson and writes it to DB / Storage.
 */
export async function updateLessonProgress(lessonId: string, updates: Partial<LessonProgress>): Promise<void> {
    const progress = getCurriculumProgress();
    const current = getLessonProgress(lessonId);

    const updated: LessonProgress = {
        ...current,
        ...updates,
        lastStudiedAt: new Date().toISOString(),
    };

    // Parse with schema to ensure validity before writing
    try {
        LessonProgressSchema.parse(updated);
    } catch (err) {
        console.error("Invalid progress update schema:", err);
        throw err;
    }

    progress[lessonId] = updated;

    // Dynamic unlock of next lesson on mastery - LOCAL SYNCHRONOUS UPDATE
    let nextUpdated: LessonProgress | null = null;
    let nextLessonId: string | null = null;
    if (updated.status === "mastered") {
        const lessons = getCurriculum();
        const index = lessons.findIndex(l => l.id === lessonId);
        if (index !== -1 && index + 1 < lessons.length) {
            nextLessonId = lessons[index + 1].id;
            const nextProgress = getLessonProgress(nextLessonId);
            if (nextProgress.status === "locked") {
                nextUpdated = {
                    ...nextProgress,
                    status: "available",
                    lastStudiedAt: new Date().toISOString(),
                };
                progress[nextLessonId] = nextUpdated;
            }
        }
    }

    localCache = progress;

    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    // Save asynchronously to Firebase
    try {
        await setData(`users/${DEFAULT_USER_ID}/curriculum_progress/${lessonId}`, updated);
        if (nextLessonId && nextUpdated) {
            await setData(`users/${DEFAULT_USER_ID}/curriculum_progress/${nextLessonId}`, nextUpdated);
        }
    } catch (error) {
        console.error("Failed to sync curriculum progress to Firebase:", error);
    }
}

/**
 * Helper to log error tags (e.g., missing_be, spelling) to a lesson's progress.
 */
export async function logLessonError(lessonId: string, errorTag: string): Promise<void> {
    const current = getLessonProgress(lessonId);
    const tags = { ...current.errorTags };
    tags[errorTag] = (tags[errorTag] || 0) + 1;

    await updateLessonProgress(lessonId, { errorTags: tags });
}

/**
 * Finds and returns the current active lesson (most recently studied unmastered lesson, or first sequential unmastered lesson).
 */
export function getActiveLesson(): Lesson | null {
    const lessons = getCurriculum();
    const progress = getCurriculumProgress();
    
    // Check for started/unmastered lessons with lastStudiedAt timestamp
    const startedUnmastered = lessons.filter(lesson => {
        const prog = progress[lesson.id];
        return prog && prog.status !== "mastered" && prog.lastStudiedAt;
    });

    if (startedUnmastered.length > 0) {
        startedUnmastered.sort((a, b) => {
            const timeA = new Date(progress[a.id].lastStudiedAt || 0).getTime();
            const timeB = new Date(progress[b.id].lastStudiedAt || 0).getTime();
            return timeB - timeA;
        });
        return startedUnmastered[0];
    }

    // Fallback: Find the first lesson that is not mastered
    for (const lesson of lessons) {
        const prog = progress[lesson.id];
        if (!prog || prog.status !== "mastered") {
            return lesson;
        }
    }
    // If all lessons are mastered, return the last lesson
    return lessons[lessons.length - 1] || null;
}

