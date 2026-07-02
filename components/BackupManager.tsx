"use client";

import React, { useState } from "react";

export default function BackupManager() {
    const [statusMessage, setStatusMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleExport = () => {
        try {
            // Retrieve all relevant learning keys from localStorage
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

            // Create file payload
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

                // Simple validation check
                const keys = Object.keys(importedData);
                if (keys.length === 0 || !keys.some(k => k.includes("progress") || k.includes("englist") || k.includes("assessments"))) {
                    throw new Error("Invalid backup format");
                }

                // Restore items to localStorage
                keys.forEach(key => {
                    if (importedData[key] !== null) {
                        localStorage.setItem(key, importedData[key]);
                    }
                });

                setStatusMessage("Progress restored successfully! Reloading page... 🔄");
                setIsError(false);

                // Reload the page to refresh app state
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
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 flex flex-col gap-4">
            <div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">Backup & Data Recovery</h4>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Export your progress database or restore from a previous local backup file.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-1 items-stretch sm:items-center">
                {/* Export CTA */}
                <button
                    onClick={handleExport}
                    className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md cursor-pointer text-center"
                >
                    📥 Export Progress Backup
                </button>

                {/* Import File Button */}
                <label className="px-5 py-3 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-850 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-750 font-extrabold text-xs rounded-2xl transition-all shadow-sm cursor-pointer text-center relative overflow-hidden">
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
