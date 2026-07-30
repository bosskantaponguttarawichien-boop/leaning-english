import { z } from "zod";

export const ActivityTypeSchema = z.enum([
    "vocabulary",
    "concept",
    "classify",
    "fill_blank",
    "reorder",
    "transform",
    "dictation",
    "shadowing",
    "guided_output",
    "free_output",
    "roleplay",
    "reading",
    "work_task"
]);

export const SentenceNoteSchema = z.object({
    translation: z.string(),
    tense: z.string(),
    structure: z.string(),
    usage: z.string(),
});

export const VocabularyNoteSchema = z.object({
    word: z.string(),
    formInLesson: z.string(),
    contextualMeaning: z.string(),
});

export const ActivitySchema = z.object({
    id: z.string(),
    type: ActivityTypeSchema,
    instruction: z.string(),
    content: z.string().optional(), // Used for concept explanations / slides
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    answer: z.union([z.string(), z.array(z.string())]).optional(),
    hint: z.string().optional(),
    context: z.string().optional(),
    coreVocabularyCount: z.number().int().positive().optional(),
    vocabularyNotes: z.array(VocabularyNoteSchema).optional(),
    sentenceNotes: z.array(SentenceNoteSchema).optional(),
});

export const LessonSchema = z.object({
    id: z.string(),
    slug: z.string(),
    level: z.enum(["A1", "A2", "B1"]),
    phase: z.enum(["foundation", "communication", "connector", "technical"]),
    title_th: z.string(),
    title_en: z.string(),
    situation_th: z.string(),
    situation_en: z.string(),
    tense_focus: z.array(z.string()),
    exit_task: z.string(),
    safe_default: z.string(),
    estimated_minutes: z.number(),
    prerequisites: z.array(z.string()),
    goals: z.array(z.string()),
    grammar_targets: z.array(z.string()),
    vocabulary_tags: z.array(z.string()),
    chunks: z.array(z.string()),
    activities: z.array(ActivitySchema),
    mastery: z.object({
        recognition_accuracy: z.number(),
        production_accuracy: z.number(),
        required_outputs: z.number().optional(),
    }),
});

export const CurriculumSchema = z.object({
    lessons: z.array(LessonSchema),
});

export const LessonProgressSchema = z.object({
    lessonId: z.string(),
    status: z.enum(["locked", "available", "learning", "review", "mastered"]),
    attempts: z.number(),
    recognitionAccuracy: z.number(),
    productionAccuracy: z.number(),
    speakingConfidence: z.number().min(1).max(5),
    errorTags: z.record(z.string(), z.number()),
    weakChunks: z.array(z.string()),
    lastStudiedAt: z.string(),
    nextReviewAt: z.string(),
});

export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Curriculum = z.infer<typeof CurriculumSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
