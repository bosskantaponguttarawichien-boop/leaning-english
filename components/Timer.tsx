"use client";

import React, { useState, useEffect } from "react";

interface TimerProps {
    initialSeconds: number;
    isActive: boolean;
    onTimeup: () => void;
}

export default function Timer({ initialSeconds, isActive, onTimeup }: TimerProps) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            onTimeup();
        }

        return () => clearInterval(interval);
    }, [isActive, seconds, onTimeup]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-lg font-mono text-2xl font-bold border-2 transition-colors ${seconds <= 10 ? "text-red-600 border-red-200 bg-red-50 animate-pulse" : "text-zinc-700 border-zinc-200 bg-white"
                }`}>
                {formatTime(seconds)}
            </div>
        </div>
    );
}
