"use client";

import React, { useState } from "react";

export default function BackupManager() {
    const [statusMessage, setStatusMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleExport = () => {
        try {
            const keysToBackup = [
                "englist_progress_v2",
                "englist_curriculum_progress_v1",
                "assessments",
                "openai_api_key"
            ];
            const backupData: Record<string, string | null> = {};

            keysToBackup.forEach(key => {
                backupData[key] = localStorage.getItem(key);
            });

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
            const downloadAnchor = document.createElement("a");
            
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", `englist-backup-${dateStr}.json`);
            
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            setStatusMessage("Backup downloaded successfully! ✅");
            setIsError(false);
        } catch (error) {
            console.error("Backup export failed:", error);
            setStatusMessage("Failed to export backup ❌");
            setIsError(true);
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonText = event.target?.result as string;
                const importedData = JSON.parse(jsonText);

                const keys = Object.keys(importedData);
                if (keys.length === 0 || !keys.some(k => k.includes("progress") || k.includes("englist") || k.includes("assessments"))) {
                    throw new Error("Invalid backup format");
                }

                keys.forEach(key => {
                    if (importedData[key] !== null) {
                        localStorage.setItem(key, importedData[key]);
                    }
                });

                setStatusMessage("Progress restored successfully! Reloading page... 🔄");
                setIsError(false);

                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (err) {
                console.error("Failed to import backup:", err);
                setStatusMessage("Failed to restore: Invalid backup file format ❌");
                setIsError(true);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 rounded-md bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 flex flex-col gap-4 shadow-none">
            <div className="font-display">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink/50 dark:text-canvas-cream/50">Security & Backup</span>
                <h4 className="text-lg font-semibold text-ink dark:text-canvas-cream mt-0.5 leading-none">Backup & Data Recovery</h4>
                <p className="text-xs text-ink/65 dark:text-canvas-cream/65 mt-1 leading-normal">Export your progress database or restore from a previous local backup file.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-1 items-stretch sm:items-center">
                {/* Export CTA */}
                <button
                    onClick={handleExport}
                    className="h-9 px-5 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink font-mono text-[10px] uppercase tracking-wider font-bold rounded-full transition-all hover:opacity-90 active:scale-[0.97] cursor-pointer text-center flex items-center justify-center gap-1.5 border-0 focus:outline-none"
                >
                    📥 Export Progress Backup
                </button>

                {/* Import File Button */}
                <label className="h-9 px-5 bg-transparent text-ink dark:text-canvas-cream border border-ink/20 dark:border-canvas-cream/30 font-mono text-[10px] uppercase tracking-wider font-bold rounded-full transition-all hover:bg-ink/5 dark:hover:bg-canvas-cream/5 cursor-pointer text-center flex items-center justify-center gap-1.5 focus:outline-none relative overflow-hidden">
                    📤 Restore Backup File
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </label>
            </div>

            {statusMessage && (
                <div className={`text-xs font-bold ${isError ? "text-red-500" : "text-green-600 dark:text-green-400"} mt-1 animate-pulse`}>
                    {statusMessage}
                </div>
            )}
        </div>
    );
}
