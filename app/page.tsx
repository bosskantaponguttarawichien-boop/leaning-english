"use client";

import React, { useEffect, useState } from "react";
import { WordProgress, listenToProgress } from "@/lib/storage";
import Link from "next/link";
import vocabData from "@/data/vocab.json";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [progress, setProgress] = useState<Record<string, WordProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Setup listener
    const unsubscribe = listenToProgress((data) => {
      setProgress(data);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
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

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-[24px] tracking-tight py-12">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
            <div className="flex flex-col gap-4 w-full max-w-md">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
            </div>
            <Skeleton className="h-12 w-36 rounded-2xl hidden sm:block" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-16" />
              </div>
            ))}
          </div>

          {/* Details Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Top Mistakes Skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Breakdown Skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 flex flex-col items-center justify-center gap-6">
                <Skeleton className="h-40 w-40 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-[24px] tracking-tight py-12">
      <div className="w-full max-w-4xl flex flex-col gap-10">
        {/* Apple Music Radial Gradient Hero Section */}
        <div className="relative overflow-hidden bg-apple-music-hero text-white rounded-md p-8 md:p-12 border-0 flex flex-col justify-between min-h-[300px] shadow-none">
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 text-white w-fit px-3 py-1 rounded-pill">
              Apple Music Design System 🎨
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-none text-white">
              EngList
            </h1>
            <p className="text-zinc-200 text-base md:text-lg font-medium leading-relaxed">
              ฝึกฝนคำศัพท์ภาษาอังกฤษผ่านระบบวิเคราะห์ระดับพรีเมียม ช่วยให้การพิมพ์สะกดคำและจำประโยคทำได้รวดเร็วลื่นไหล
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-8">
            <Link href="/practice" className="w-full sm:w-auto justify-center px-6 py-3.5 bg-white text-ink hover:bg-canvas-parchment font-bold rounded-pill transition-all text-sm flex items-center gap-2">
              Keep Practicing ⚡
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto justify-center px-6 py-3.5 bg-transparent text-white hover:bg-white/10 font-bold rounded-pill border border-white/30 transition-all text-sm flex items-center gap-2">
              Stats Dashboard 📊
            </Link>
          </div>
        </div>

        {/* Section: Your Progress in Plan-Card style */}
        <div className="flex flex-col gap-2 mt-2">
          <h2 className="font-display text-3xl font-semibold text-ink dark:text-white leading-none">Your Progress</h2>
          <p className="text-ink-secondary dark:text-zinc-400 font-medium text-sm">สถิติความก้าวหน้าและการเดินทางเพื่อการเรียนรู้ของคุณ</p>
        </div>

        {/* Stats Grid using Apple Plan-Card geometry: 10px rounded-sm, hairline borders, no shadows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 p-8 rounded-sm shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink-secondary dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">Words Learned</p>
            <div className="mt-4">
              <p className="text-5xl font-semibold font-display text-primary-action-blue leading-none">{totalCorrect}</p>
              <p className="text-xs text-ink-muted dark:text-zinc-500 font-semibold mt-2">จากทั้งหมด {totalWordsCount} คำ</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 p-8 rounded-sm shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink-secondary dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">Total Mistakes</p>
            <div className="mt-4">
              <p className="text-5xl font-semibold font-display text-brand-music-red leading-none">{totalMistakes}</p>
              <p className="text-xs text-ink-muted dark:text-zinc-500 font-semibold mt-2">ข้อผิดพลาดที่บันทึกไว้</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-hairline dark:border-zinc-800 p-8 rounded-sm shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink-secondary dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">Learning Streak</p>
            <div className="mt-4">
              <p className="text-5xl font-semibold font-display text-green-500 leading-none">1</p>
              <p className="text-xs text-ink-muted dark:text-zinc-500 font-semibold mt-2">วันเรียนติดต่อกัน</p>
            </div>
          </div>
        </div>

        {/* Dark Immersion Card Section for detail analytics */}
        <div className="bg-ink dark:bg-surface-near-black text-white rounded-md p-8 md:p-10 border border-zinc-800 dark:border-zinc-900 shadow-none grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Top Mistakes in Dark immersion design */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-2xl font-semibold text-white leading-none">Difficult Words ⚠️</h3>
            <p className="text-zinc-400 text-xs font-medium">คำศัพท์ที่ต้องการการฝึกฝนเพิ่มเติม</p>
            <div className="flex flex-col gap-3 mt-2">
              {topMistakes.length > 0 ? (
                topMistakes.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-sm border border-white/5 transition-all">
                    <span className="text-lg font-bold text-zinc-100">{w.word}</span>
                    <span className="px-3 py-1 bg-brand-music-red/20 text-brand-music-red text-xs font-bold rounded-pill border border-brand-music-red/20">
                      {w.wrongCount} errors
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 py-8 text-sm font-medium text-center">Keep practicing to track mistakes!</p>
              )}
            </div>
          </div>

          {/* Progress Retention Graph in Dark immersion design */}
          <div className="flex flex-col gap-4 items-center md:items-start">
            <h3 className="font-display text-2xl font-semibold text-white leading-none">Word Retention 🧠</h3>
            <p className="text-zinc-400 text-xs font-medium">อัตราความแม่นยำและการจำจดคำศัพท์</p>
            <div className="w-full flex flex-col items-center justify-center gap-6 mt-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-white/10"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-primary-action-blue"
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (masteryPercentage / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-semibold font-display text-white">{masteryPercentage}%</span>
                </div>
              </div>
              <p className="text-xs text-center text-zinc-400 font-medium max-w-[250px] leading-relaxed">
                คุณจดจำศัพท์ได้แล้ว <span className="font-semibold text-white">{totalCorrect}</span> คำ จากคอลเลกชันทั้งหมด
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

