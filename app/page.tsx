"use client";

import React, { useEffect, useState } from "react";
import { getProgress, WordProgress } from "@/lib/storage";
import Link from "next/link";
import vocabData from "@/data/vocab.json";

export default function Home() {
  const [progress, setProgress] = useState<Record<string, WordProgress>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const data = getProgress();
    setProgress(data);
  }, []);

  const totalWordsCount = vocabData.words.length;
  const progressArray = Object.values(progress);
  const totalCorrect = progressArray.reduce((sum, w) => sum + (w.correctStreak > 0 ? 1 : 0), 0);
  const totalMistakes = progressArray.reduce((sum, w) => sum + w.wrongCount, 0);

  const masteryPercentage = totalWordsCount > 0
    ? Math.round((totalCorrect / totalWordsCount) * 100)
    : 0;

  // Frequently mistyped words (sorted by wrongCount)
  const topMistakes = [...progressArray]
    .filter(w => w.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 p-6 md:p-24 tracking-tight">
      <div className="w-full max-w-4xl flex flex-col gap-10">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-zinc-900 leading-none">
              ยินดีต้อนรับสู่ EngList 🧠
            </h1>
            <p className="text-zinc-500 font-medium">
              เริ่มต้นฝึกพิมพ์คำศัพท์ภาษาอังกฤษเพื่อพัฒนาทักษะของคุณ
            </p>
          </div>
          <Link href="/practice" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            Keep Practicing
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-zinc-900 leading-none">Your Progress</h2>
          <p className="text-zinc-500 font-medium">Visualization of your learning journey.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Words Learned</p>
            <p className="text-5xl font-black text-blue-600">{totalCorrect} <span className="text-xl text-zinc-300">/ {totalWordsCount}</span></p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Mistakes</p>
            <p className="text-5xl font-black text-red-500">{totalMistakes}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Learning Streak</p>
            <p className="text-5xl font-black text-green-500">1</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Top Mistakes */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-zinc-900">Difficult Words ⚠️</h2>
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 flex flex-col gap-4">
              {topMistakes.length > 0 ? (
                topMistakes.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="text-xl font-bold text-zinc-800">{w.word}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-black rounded-full uppercase">
                      {w.wrongCount} errors
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-zinc-400 font-medium">Keep practicing to track mistakes!</p>
              )}
            </div>
          </div>

          {/* Progress Breakdown */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-zinc-900">Word Retention 🧠</h2>
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 flex flex-col items-center justify-center gap-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="#F4F4F5"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (masteryPercentage / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-zinc-900">{masteryPercentage}%</span>
                </div>
              </div>
              <p className="text-sm text-center text-zinc-500 font-medium">
                You&apos;ve mastered <span className="font-bold text-zinc-900">{totalCorrect}</span> words from the collection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

