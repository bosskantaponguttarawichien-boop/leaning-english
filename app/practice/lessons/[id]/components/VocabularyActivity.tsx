"use client";

import React, { useMemo, useState } from "react";
import vocabData from "@/data/vocab.json";
import { Activity } from "@/schemas/curriculum.schema";
import { VocabDBSchema } from "@/schemas/vocab.schema";
import { speak } from "@/lib/speech";

interface VocabularyActivityProps {
    activity: Activity;
    onComplete: () => void;
}

export default function VocabularyActivity({ activity, onComplete }: VocabularyActivityProps) {
    const [showThai, setShowThai] = useState(true);
    const [reviewed, setReviewed] = useState<Set<string>>(new Set());

    const words = useMemo(() => {
        const database = VocabDBSchema.parse(vocabData);
        const byWord = new Map(database.words.map((item) => [item.word.toLowerCase(), item]));

        return (activity.options || [])
            .map((word) => byWord.get(word.toLowerCase()))
            .filter((word): word is NonNullable<typeof word> => Boolean(word));
    }, [activity.options]);

    const coreVocabularyCount = Math.min(activity.coreVocabularyCount || 8, words.length);
    const vocabularyNoteByWord = new Map(
        (activity.vocabularyNotes || []).map((note) => [note.word.toLowerCase(), note]),
    );
    const vocabularySections = [
        {
            title: "คำหลักของหัวข้อ",
            description: "คำที่ช่วยให้เข้าใจแนวคิดหลักและสร้างประโยคเป้าหมาย",
            words: words.slice(0, coreVocabularyCount),
        },
        {
            title: "คำช่วยอ่านทั้งบท",
            description: "คำสำคัญที่พบใน Story คำถาม แบบฝึก และ Roleplay",
            words: words.slice(coreVocabularyCount),
        },
    ].filter((section) => section.words.length > 0);

    const markReviewed = (word: string) => {
        setReviewed((current) => {
            const next = new Set(current);
            if (next.has(word)) next.delete(word);
            else next.add(word);
            return next;
        });
    };

    const allReviewed = words.length > 0 && reviewed.size === words.length;

    return (
        <div className="bg-canvas dark:bg-zinc-900 p-6 sm:p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/5 dark:border-zinc-800 pb-4">
                <div>
                    <h2 className="text-[10px] font-mono uppercase tracking-widest font-semibold text-hume-lavender">
                        Step 1 • Vocabulary Preview
                    </h2>
                    <h3 className="text-2xl font-semibold text-ink dark:text-canvas-cream mt-1 leading-snug font-display">
                        {activity.instruction}
                    </h3>
                    {activity.context && (
                        <p className="text-sm text-ink/60 dark:text-canvas-cream/60 mt-2">{activity.context}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowThai((value) => !value)}
                    className="px-4 py-2 rounded-full border border-ink/15 dark:border-canvas-cream/20 text-[10px] font-mono uppercase tracking-wider font-bold"
                >
                    {showThai ? "Hide Thai" : "Show Thai"}
                </button>
            </div>

            <div className="space-y-7">
                {vocabularySections.map((section, sectionIndex) => (
                    <section key={section.title}>
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-semibold text-ink dark:text-canvas-cream">{section.title}</h4>
                                <p className="mt-0.5 text-xs text-ink/50 dark:text-canvas-cream/50">{section.description}</p>
                            </div>
                            <span className="rounded-full bg-hume-lavender/10 px-3 py-1 text-[10px] font-mono font-bold text-hume-lavender">
                                {section.words.length} คำ
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {section.words.map((item) => {
                                const isReviewed = reviewed.has(item.word);
                                const vocabularyNote = vocabularyNoteByWord.get(item.word.toLowerCase());
                                return (
                                    <article
                                        key={item.word}
                                        className={`p-4 rounded-md border transition-colors ${
                                            isReviewed
                                                ? "bg-hume-mint/10 border-hume-mint/30"
                                                : "bg-canvas-cream dark:bg-black/20 border-ink/5 dark:border-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <strong className="text-lg text-ink dark:text-canvas-cream">{item.word}</strong>
                                                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-hume-lavender/12 text-hume-lavender">
                                                        {item.pos}
                                                    </span>
                                                </div>
                                                <p className={`text-sm mt-1 min-h-5 text-ink/70 dark:text-canvas-cream/70 ${showThai ? "" : "blur-sm select-none"}`}>
                                                    {showThai ? item.meaning : "ซ่อนความหมายไว้เพื่อทดสอบการจำ"}
                                                </p>
                                                {vocabularyNote && (
                                                    <div className={`mt-2 rounded-md bg-hume-orange/10 px-2.5 py-2 ${showThai ? "" : "blur-sm select-none"}`}>
                                                        <p className="text-[10px] font-mono font-bold text-hume-orange">
                                                            ในบท: {vocabularyNote.formInLesson}
                                                        </p>
                                                        <p className="mt-0.5 text-xs leading-relaxed text-ink/65 dark:text-canvas-cream/65">
                                                            {showThai ? vocabularyNote.contextualMeaning : "ซ่อนความหมายตามบริบท"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => speak(item.word)}
                                                aria-label={`Listen to ${item.word}`}
                                                className="w-9 h-9 shrink-0 rounded-full border border-ink/10 dark:border-zinc-700 hover:bg-ink/5 dark:hover:bg-white/5"
                                            >
                                                🔊
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => speak(item.example)}
                                            className="w-full text-left mt-3 p-3 rounded-md bg-canvas dark:bg-zinc-950/70 text-xs leading-relaxed text-ink/75 dark:text-canvas-cream/75 border border-ink/5 dark:border-zinc-800"
                                        >
                                            {item.example} <span className="opacity-40">↗</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => markReviewed(item.word)}
                                            className={`mt-3 text-[10px] font-mono uppercase tracking-wider font-bold ${
                                                isReviewed ? "text-hume-mint" : "text-ink/45 dark:text-canvas-cream/45"
                                            }`}
                                        >
                                            {isReviewed ? "✓ จำความหมายได้แล้ว" : "ทำเครื่องหมายเมื่อจำได้"}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>

                        {sectionIndex === 0 && vocabularySections.length > 1 && (
                            <div className="mt-6 border-b border-dashed border-ink/10 dark:border-canvas-cream/10" />
                        )}
                    </section>
                ))}
            </div>

            <div className="pt-4 border-t border-ink/5 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-ink/55 dark:text-canvas-cream/55">
                    ทบทวนแล้ว {reviewed.size}/{words.length} คำ — พยายามนึกความหมายก่อนเปิดดูภาษาไทย
                </p>
                <button
                    type="button"
                    disabled={!allReviewed}
                    onClick={onComplete}
                    className={`px-6 py-3 rounded-full font-mono text-xs uppercase tracking-wider font-bold ${
                        allReviewed
                            ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink"
                            : "bg-ink/5 dark:bg-white/5 text-ink/30 dark:text-white/30 cursor-not-allowed"
                    }`}
                >
                    Continue to the situation →
                </button>
            </div>
        </div>
    );
}
