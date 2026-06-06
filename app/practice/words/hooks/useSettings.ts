"use client";

import { useState, useEffect, useRef } from "react";
import { DifficultyMode } from "@/components/WordCard";
import { readData, setData } from "@/lib/db";
import { syncProgressFromDB } from "@/lib/storage";

const DEFAULT_USER_ID = "default_user";

export interface Settings {
    isSpeechEnabled: boolean;
    isSoundEnabled: boolean;
    timerEnabled: boolean;
    difficultyMode: DifficultyMode;
    difficulty: string;
    selectedPOS: string;
}

const DEFAULTS: Settings = {
    isSpeechEnabled: true,
    isSoundEnabled: true,
    timerEnabled: true,
    difficultyMode: "normal",
    difficulty: "all",
    selectedPOS: "all",
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULTS);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await readData(`users/${DEFAULT_USER_ID}/settings`);
                if (res.success && res.data) {
                    const s = res.data;
                    setSettings(prev => ({
                        ...prev,
                        ...(s.isSpeechEnabled !== undefined && { isSpeechEnabled: s.isSpeechEnabled }),
                        ...(s.isSoundEnabled !== undefined && { isSoundEnabled: s.isSoundEnabled }),
                        ...(s.timerEnabled !== undefined && { timerEnabled: s.timerEnabled }),
                        ...(s.difficultyMode !== undefined && { difficultyMode: s.difficultyMode }),
                        ...(s.difficulty !== undefined && { difficulty: s.difficulty }),
                        ...(s.selectedPOS !== undefined && { selectedPOS: s.selectedPOS }),
                    }));
                }
                await syncProgressFromDB();
            } catch (error) {
                console.error("Failed to load settings from Firebase:", error);
            } finally {
                setIsDataLoaded(true);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (isFirstRender.current || !isDataLoaded) {
            isFirstRender.current = false;
            return;
        }
        setData(`users/${DEFAULT_USER_ID}/settings`, settings);
    }, [settings, isDataLoaded]);

    const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return { settings, update, isDataLoaded };
}
