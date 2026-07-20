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
    const unsubscribe = listenToProgress((data) => {
      setProgress(data);
      setIsLoading(false);
    });
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

  const topMistakes = [...progressArray]
    .filter(w => w.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-canvas dark:bg-zinc-900 p-8 rounded-lg border border-ink/10 dark:border-zinc-800 shadow-none gap-6">
            <div className="flex flex-col gap-4 w-full max-w-md">
              <Skeleton className="h-10 w-3/4 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
            </div>
            <Skeleton className="h-11 w-36 rounded-full hidden sm:block" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-canvas dark:bg-zinc-900 p-6 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-4 min-h-[140px]">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-12 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
      <div className="w-full max-w-4xl flex flex-col gap-10">
        
        {/* Hume AI Hero Section with Subtle Radial Gradient Orb */}
        <div className="relative overflow-hidden bg-hume-hero-gradient rounded-xl p-8 md:p-12 border border-ink/10 dark:border-canvas-cream/15 flex flex-col justify-between min-h-[320px] shadow-none">
          <div className="flex flex-col gap-4 max-w-xl relative z-10">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/60 dark:text-canvas-cream/60">
              Hume UI Core Design System 🧪
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-none text-ink dark:text-canvas-cream">
              Master your <span className="text-hume-lavender font-bold">English</span> vocabulary
            </h1>
            <p className="text-ink/80 dark:text-canvas-cream/80 text-sm md:text-base font-sans leading-relaxed mt-2">
              ฝึกฝนคลังคำศัพท์และรูปแบบประโยคผ่านระบบการพิมพ์สะกดคำที่มีประสิทธิภาพ 
              ออกแบบด้วยความใส่ใจและสร้างอยู่บนมาตรฐานของความถูกต้องตามหลักการจำแบบ SRS
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-8 relative z-10">
            <Link 
              href="/practice" 
              className="w-full sm:w-auto justify-center px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono text-xs uppercase tracking-wider font-bold rounded-full transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-none"
            >
              Keep Practicing ⚡
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto justify-center px-6 py-3 bg-transparent text-ink dark:text-canvas-cream font-mono text-xs uppercase tracking-wider font-bold rounded-full border border-ink/20 dark:border-canvas-cream/30 transition-all hover:bg-ink/5 dark:hover:bg-canvas-cream/5 flex items-center gap-2 cursor-pointer"
            >
              Stats Dashboard 📊
            </Link>
          </div>
        </div>

        {/* Section: Your Progress */}
        <div className="flex flex-col gap-1 mt-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Dashboard Overview</span>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink dark:text-canvas-cream leading-none">Your Progress</h2>
        </div>

        {/* Stats Grid using Hume card geometry: 12px rounded-md, hairline borders, no shadows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-md shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink/60 dark:text-canvas-cream/60 text-[10px] font-mono font-semibold uppercase tracking-widest">Words Learned</p>
            <div className="mt-4">
              <p className="text-4xl font-semibold font-display text-hume-lavender leading-none">{totalCorrect}</p>
              <p className="text-[11px] text-ink/50 dark:text-canvas-cream/50 font-sans mt-2">จากคำศัพท์ทั้งหมด {totalWordsCount} คำ</p>
            </div>
          </div>
          
          <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-md shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink/60 dark:text-canvas-cream/60 text-[10px] font-mono font-semibold uppercase tracking-widest">Total Mistakes</p>
            <div className="mt-4">
              <p className="text-4xl font-semibold font-display text-hume-coral leading-none">{totalMistakes}</p>
              <p className="text-[11px] text-ink/50 dark:text-canvas-cream/50 font-sans mt-2">ข้อผิดพลาดที่เกิดขึ้น</p>
            </div>
          </div>

          <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 p-6 rounded-md shadow-none flex flex-col justify-between min-h-[140px]">
            <p className="text-ink/60 dark:text-canvas-cream/60 text-[10px] font-mono font-semibold uppercase tracking-widest">Learning Streak</p>
            <div className="mt-4">
              <p className="text-4xl font-semibold font-display text-hume-mint leading-none">1</p>
              <p className="text-[11px] text-ink/50 dark:text-canvas-cream/50 font-sans mt-2">วันเรียนรู้ติดต่อกัน</p>
            </div>
          </div>
        </div>

        {/* Hume Custom Card Variant Section for detail analytics (Zero shadows, flat borders) */}
        <div className="bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream rounded-md p-6 md:p-8 border border-ink/10 dark:border-zinc-800 shadow-none grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Top Mistakes */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Needs attention</span>
              <h3 className="font-display text-xl font-semibold leading-none mt-1">Difficult Words ⚠️</h3>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {topMistakes.length > 0 ? (
                topMistakes.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-canvas-cream dark:bg-black/20 rounded-md border border-ink/5 dark:border-zinc-800/80 transition-all hover:bg-hume-lavender/5 dark:hover:bg-hume-lavender/5">
                    <span className="text-base font-bold text-ink dark:text-canvas-cream">{w.word}</span>
                    <span className="px-2.5 py-0.5 bg-hume-pink/20 text-hume-coral font-mono text-[10px] font-semibold rounded-full border border-hume-pink/30 uppercase">
                      {w.wrongCount} errors
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-ink/50 dark:text-canvas-cream/50 py-8 text-sm font-sans text-center">Keep practicing to track mistakes!</p>
              )}
            </div>
          </div>

          {/* Progress Retention Graph */}
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Cognitive status</span>
              <h3 className="font-display text-xl font-semibold leading-none mt-1">Word Retention 🧠</h3>
            </div>
            <div className="w-full flex flex-col items-center justify-center gap-4 mt-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-ink/5 dark:text-canvas-cream/5"
                    strokeWidth="8"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-hume-lavender"
                    strokeWidth="8"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * (masteryPercentage / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-semibold font-display text-ink dark:text-canvas-cream">{masteryPercentage}%</span>
                </div>
              </div>
              <p className="text-[11px] text-center text-ink/60 dark:text-canvas-cream/60 font-sans max-w-[240px] leading-relaxed">
                คุณจดจำศัพท์ได้แล้ว <span className="font-semibold text-ink dark:text-canvas-cream">{totalCorrect}</span> คำ จากคอลเลกชันทั้งหมด
              </p>
            </div>
          </div>

        </div>

        {/* Hume Full-Bleed Pastel Gradient Footer Section */}
        <footer className="w-full bg-hume-footer-gradient text-ink rounded-xl overflow-hidden shadow-none border-0">
          <div className="px-8 py-12 flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="flex flex-col gap-3">
              <h3 className="font-display text-2xl font-bold tracking-tight">EngList</h3>
              <p className="font-sans text-xs text-ink/80 max-w-sm leading-relaxed">
                คลังพัฒนาทักษะภาษาอังกฤษเพื่อวิศวกรและการเขียนโค้ด 
                สร้างขึ้นเพื่อตอบสนองการจำอย่างมีประสิทธิภาพผ่านระบบดีไซน์ Hume
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Stay in the loop</span>
              <div className="flex gap-2 w-full max-w-md">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-4 py-2.5 rounded-full bg-canvas/80 text-ink placeholder:text-ink/40 text-xs border border-ink/10 outline-none focus:bg-canvas flex-1"
                />
                <button className="px-5 py-2.5 rounded-full bg-ink text-canvas-cream font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
