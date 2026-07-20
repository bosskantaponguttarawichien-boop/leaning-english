"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { speak } from "@/lib/speech";
import { logLessonError } from "@/lib/curriculum";

interface ChatMessage {
    sender: "user" | "tutor";
    content: string;
    correction?: string;
}

interface Scenario {
    id: string;
    title: string;
    description: string;
    prompt: string;
    initMsg: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: "standup",
        title: "Daily Stand-up Update",
        description: "Report what you did yesterday, today's focus, and blockers.",
        initMsg: "Hi Boss! Ready for the daily stand-up? Let's start: What did you work on yesterday?",
        prompt: "You are a tech team lead conducting a daily stand-up. You are speaking with Boss. Keep your messages under 3 sentences. Be professional."
    },
    {
        id: "bug",
        title: "Troubleshooting a Bug",
        description: "Explain a production database timeout error to a peer developer.",
        initMsg: "Hey Boss, I heard the staging database connection dropped. What happened?",
        prompt: "You are a senior peer developer troubleshooting a database connection timeout issue. Boss is describing the bug. Keep replies under 3 sentences."
    },
    {
        id: "tradeoff",
        title: "Database Trade-offs Discussion",
        description: "Argue the trade-offs of using Redis cache vs PostgreSQL.",
        initMsg: "Hi Boss. For our session caches, should we use Redis or stick with PostgreSQL? Why?",
        prompt: "You are a systems architect debating caching choices between Redis and PostgreSQL. Ask Boss to explain the trade-offs. Keep replies under 3 sentences."
    }
];

function AITutorContent() {
    const searchParams = useSearchParams();
    const scenarioParam = searchParams.get("scenario");

    const [step, setStep] = useState<"setup" | "chat">("setup");
    
    // Config states
    const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
    const [coachMode, setCoachMode] = useState<"gentle" | "balanced" | "strict">("balanced");
    const [apiKey, setApiKey] = useState("");
    const [savedKey, setSavedKey] = useState("");

    useEffect(() => {
        if (scenarioParam) {
            const found = SCENARIOS.find(s => s.id === scenarioParam);
            if (found) {
                setSelectedScenario(found);
            }
        }
    }, [scenarioParam]);

    // Chat states
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isResponding, setIsResponding] = useState(false);
    const [localCorrectionsList, setLocalCorrectionsList] = useState<string[]>([]);

    useEffect(() => {
        const storedKey = localStorage.getItem("openai_api_key") || "";
        setApiKey(storedKey);
        setSavedKey(storedKey);
    }, []);

    const handleSaveKey = () => {
        localStorage.setItem("openai_api_key", apiKey);
        setSavedKey(apiKey);
        alert("API Key saved locally! 🔑");
    };

    const handleClearKey = () => {
        localStorage.removeItem("openai_api_key");
        setApiKey("");
        setSavedKey("");
    };

    const handleStartChat = () => {
        setMessages([
            { sender: "tutor", content: selectedScenario.initMsg }
        ]);
        setLocalCorrectionsList([]);
        setStep("chat");
        speak(selectedScenario.initMsg);
    };

    // Smart Local Rule-based Response & Correction engine
    const generateLocalResponse = (userInput: string): { response: string; correction?: string } => {
        const lower = userInput.toLowerCase();
        let response = "That makes sense. Can you explain more details about it?";
        let correction = "";

        // Grammar checks
        if (lower.includes("i am write") || lower.includes("i am code") || lower.includes("i am go")) {
            correction = "Correction: Avoid using 'am' directly before action verbs. Say 'I write code' or 'I code' instead of 'I am write/code'.";
            logLessonError("L01", "extra_be");
        } else if (lower.includes("i developer") || lower.includes("i tired") || lower.includes("i interested")) {
            correction = "Correction: Missing auxiliary 'be'. Say 'I am a developer' or 'I am interested' instead.";
            logLessonError("L01", "missing_be");
        } else if (lower.includes("since three years") || lower.includes("since 3 years")) {
            correction = "Correction: Use 'for' for total duration (e.g., 'for three years') and 'since' for starting point (e.g., 'since 2023').";
            logLessonError("L12", "prepositions_time");
        } else if (lower.includes("yesterday i fix") || lower.includes("yesterday i work")) {
            correction = "Correction: Use past tense form (e.g., 'yesterday I fixed / worked') when speaking about the past.";
            logLessonError("L09", "wrong_tense");
        }

        // Scenario replies
        if (selectedScenario.id === "standup") {
            if (lower.includes("yesterday")) {
                response = "Got it. Thanks for the update on yesterday's work. What's the plan for today?";
            } else if (lower.includes("today") || lower.includes("going to")) {
                response = "Understood. That sounds like a solid focus for today. Any blockers in your way?";
            } else if (lower.includes("blocker") || lower.includes("no blockers")) {
                response = "Excellent. Glad to hear there are no blockers. Let's touch base again tomorrow!";
            }
        } else if (selectedScenario.id === "bug") {
            if (lower.includes("timeout") || lower.includes("slow")) {
                response = "Hmm, timeout errors can be tough. Did you check if the connection pool limit was reached?";
            } else if (lower.includes("log") || lower.includes("check")) {
                response = "Good idea to review logs. Let me know if you find any out-of-memory traceback details.";
            }
        } else if (selectedScenario.id === "tradeoff") {
            if (lower.includes("redis") || lower.includes("fast") || lower.includes("cache")) {
                response = "True, Redis is extremely fast since it stores data in memory. What about data persistence? Do we need it?";
            } else if (lower.includes("postgres") || lower.includes("sql")) {
                response = "PostgreSQL gives us robust transaction queries, but caching might slow down database memory under high request loads.";
            }
        }

        return { response, correction };
    };

    // OpenAI Chat Completion API Caller
    const callOpenAIApi = async (userInput: string): Promise<{ response: string; correction?: string }> => {
        try {
            // Prompt guides the model to return JSON with a "reply" and optionally a "correction" string
            const promptInstruction = `${selectedScenario.prompt}
You are talking to Boss (who has starting level English).
Coaching mode: ${coachMode}.
If coaching mode is 'strict', check their grammar closely.
If coaching mode is 'balanced', highlight major mistakes.
If coaching mode is 'gentle', ignore minor mistakes during conversation.

IMPORTANT: Respond strictly in JSON format matching this schema:
{
  "reply": "your conversation response to them",
  "correction": "any grammatical or spelling correction in English/Thai, or empty if none"
}`;

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${savedKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: promptInstruction },
                        ...messages.map(msg => ({
                            role: msg.sender === "user" ? "user" : "assistant",
                            content: msg.content
                        })),
                        { role: "user", content: userInput }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error("API response error");

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            const parsed = JSON.parse(resultText);

            return {
                response: parsed.reply || "I understand. Let's continue.",
                correction: parsed.correction || ""
            };
        } catch (e) {
            console.error("OpenAI call failed, falling back to local simulator:", e);
            return generateLocalResponse(userInput);
        }
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === "" || isResponding) return;

        const userMsg = inputValue.trim();
        setInputValue("");
        setIsResponding(true);

        // Add user message to stack
        const nextMessages = [...messages, { sender: "user", content: userMsg } as ChatMessage];
        setMessages(nextMessages);

        let replyObj;
        if (savedKey) {
            replyObj = await callOpenAIApi(userMsg);
        } else {
            // Simulating network lag
            await new Promise(resolve => setTimeout(resolve, 800));
            replyObj = generateLocalResponse(userMsg);
        }

        // Apply corrections formatting based on coaching mode
        let displayCorrection = replyObj.correction;
        if (coachMode === "gentle" && displayCorrection) {
            // In gentle mode, push corrections to exit checklist instead of showing them in chat bubbles
            setLocalCorrectionsList(prev => [...prev, displayCorrection!]);
            displayCorrection = undefined;
        }

        // Add assistant message
        setMessages(prev => [
            ...prev,
            { sender: "tutor", content: replyObj.response, correction: displayCorrection }
        ]);
        setIsResponding(false);

        // Auto speak the reply
        speak(replyObj.response);
    };

    return (
        <main className="flex min-h-screen flex-col items-center px-6 py-12 bg-background text-foreground tracking-tight">
            <div className="w-full max-w-2xl flex flex-col gap-6 flex-1 justify-center">

                {/* SETUP VIEW PANEL */}
                {step === "setup" && (
                    <div className="bg-canvas dark:bg-zinc-900 p-8 rounded-md border border-ink/10 dark:border-zinc-800 shadow-none flex flex-col gap-6 animate-fade-in">
                        <div>
                            <Link href="/practice" className="font-mono text-xs uppercase tracking-wider font-semibold text-hume-lavender hover:opacity-85 transition-opacity">
                                ← Cancel Setup
                            </Link>
                            <h1 className="text-3xl font-semibold text-ink dark:text-canvas-cream mt-4 font-display leading-none">AI Coach Settings</h1>
                            <p className="text-ink/65 dark:text-canvas-cream/65 font-medium text-sm mt-1">Select a scenario and choose your coach coaching strictness level.</p>
                        </div>

                        {/* Scenario Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Select Scenario:</label>
                            <div className="flex flex-col gap-2">
                                {SCENARIOS.map((sc) => (
                                    <button
                                        key={sc.id}
                                        onClick={() => setSelectedScenario(sc)}
                                        className={`w-full text-left p-4 rounded-md border text-sm transition-all flex flex-col gap-1 cursor-pointer focus:outline-none ${
                                            selectedScenario.id === sc.id
                                                ? "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender"
                                                : "bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800 hover:bg-ink/5 dark:hover:bg-canvas-cream/5"
                                        }`}
                                    >
                                        <span className="font-semibold text-ink dark:text-canvas-cream font-display">{sc.title}</span>
                                        <span className="text-xs text-ink/50 dark:text-canvas-cream/50">{sc.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Coach Mode Strictness Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">Coach Feedback Level:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "gentle", label: "Gentle 🟢", desc: "No inline breaks" },
                                    { id: "balanced", label: "Balanced 🟡", desc: "Major changes" },
                                    { id: "strict", label: "Strict 🔴", desc: "Corrects everything" },
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setCoachMode(mode.id as "gentle" | "balanced" | "strict")}
                                        className={`p-3.5 rounded-md border text-center transition-all flex flex-col gap-1 cursor-pointer focus:outline-none ${
                                            coachMode === mode.id
                                                ? "bg-hume-lavender/10 text-ink dark:text-canvas-cream border-hume-lavender font-bold"
                                                : "bg-canvas dark:bg-zinc-900 text-ink dark:text-canvas-cream border-ink/10 dark:border-zinc-800 hover:bg-ink/5 dark:hover:bg-canvas-cream/5"
                                        }`}
                                    >
                                        <span className="text-xs font-bold text-ink dark:text-canvas-cream">{mode.label}</span>
                                        <span className="text-[10px] text-ink/50 dark:text-canvas-cream/50">{mode.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional OpenAI API configuration */}
                        <div className="p-5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase tracking-widest font-semibold text-ink/50 dark:text-canvas-cream/50">OpenAI API Key (Optional):</label>
                                {savedKey && (
                                    <span className="text-[9px] font-mono bg-hume-mint/15 border border-hume-mint/10 text-hume-mint font-bold uppercase px-2 py-0.5 rounded-full">Active</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-proj-..."
                                    className="flex-1 px-3.5 py-2.5 bg-canvas dark:bg-zinc-950 border border-ink/10 dark:border-zinc-850 rounded-full text-xs font-medium focus:outline-none text-ink dark:text-canvas-cream focus:border-hume-lavender"
                                />
                                {savedKey ? (
                                    <button
                                        onClick={handleClearKey}
                                        className="px-4 py-2.5 bg-hume-coral/20 hover:opacity-85 text-hume-coral font-bold text-xs rounded-full transition-all cursor-pointer focus:outline-none"
                                    >
                                        Clear
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSaveKey}
                                        className="px-4 py-2.5 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 font-mono uppercase tracking-wider text-[10px] font-bold rounded-full transition-all cursor-pointer focus:outline-none"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>
                            <span className="text-[10px] text-ink/40 dark:text-canvas-cream/40 font-semibold leading-tight">Stored in your browser local storage. If omitted, a smart simulated local engine will reply.</span>
                        </div>

                        {/* CTA trigger */}
                        <div className="pt-4 border-t border-ink/5 dark:border-zinc-800 flex justify-end">
                            <button
                                onClick={handleStartChat}
                                className="px-6 py-3 bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer font-mono text-xs uppercase tracking-wider font-bold rounded-full shadow-none"
                            >
                                Start Roleplay →
                            </button>
                        </div>
                    </div>
                )}

                {/* ACTIVE CHAT WORKSPACE PANEL */}
                {step === "chat" && (
                    <div className="bg-canvas dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 shadow-none rounded-md flex flex-col h-[520px] animate-fade-in relative">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-ink/5 dark:border-zinc-800 flex justify-between items-center bg-canvas-cream dark:bg-black/10 rounded-t-md">
                            <div>
                                <h3 className="font-semibold text-sm text-ink dark:text-canvas-cream leading-tight font-display">{selectedScenario.title}</h3>
                                <span className="text-[10px] uppercase font-mono tracking-widest text-ink/50 dark:text-canvas-cream/50">Coach strictness: {coachMode}</span>
                            </div>
                            <button
                                onClick={() => setStep("setup")}
                                className="font-mono text-xs uppercase tracking-wider font-semibold text-ink/40 dark:text-canvas-cream/40 hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
                            >
                                Leave ✕
                            </button>
                        </div>

                        {/* Messages logs */}
                        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
                            {messages.map((msg, idx) => {
                                const isTutor = msg.sender === "tutor";
                                return (
                                    <div key={idx} className={`flex flex-col max-w-[85%] ${isTutor ? "self-start items-start" : "self-end items-end"}`}>
                                        <div className={`p-4 rounded-md text-sm font-semibold leading-relaxed shadow-none ${
                                            isTutor
                                                ? "bg-canvas-cream dark:bg-black/25 text-ink dark:text-canvas-cream rounded-tl-none border border-ink/5 dark:border-zinc-850"
                                                : "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink rounded-tr-none border-0"
                                        }`}>
                                            {msg.content}
                                            
                                            {isTutor && (
                                                <button
                                                    onClick={() => speak(msg.content)}
                                                    className="block text-[10px] text-hume-lavender hover:opacity-85 mt-1.5 font-bold cursor-pointer focus:outline-none"
                                                >
                                                    Listen 🔊
                                                </button>
                                            )}
                                        </div>

                                        {/* Show inline corrections immediately in balanced/strict modes */}
                                        {msg.correction && (
                                            <div className="my-1.5 p-3 bg-hume-orange/10 border-l-2 border-hume-orange rounded-r-md text-ink dark:text-canvas-cream font-medium text-xs max-w-full leading-normal">
                                                💡 {msg.correction}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isResponding && (
                                <div className="self-start flex gap-1.5 p-3.5 bg-canvas-cream dark:bg-black/25 border border-ink/5 dark:border-zinc-800 rounded-md rounded-tl-none items-center">
                                    <div className="w-1.5 h-1.5 bg-ink/50 dark:bg-canvas-cream/50 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-ink/50 dark:bg-canvas-cream/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-ink/50 dark:bg-canvas-cream/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                        </div>

                        {/* Gentle Mode cumulative review checklist */}
                        {coachMode === "gentle" && localCorrectionsList.length > 0 && (
                            <div className="p-3 bg-hume-blue/10 border-y border-hume-blue/20 text-[10px] font-bold text-hume-blue px-4 leading-normal flex items-center justify-between">
                                <span>📝 {localCorrectionsList.length} feedback tips ready for exit checklist review.</span>
                            </div>
                        )}

                        {/* Input Footer */}
                        <div className="p-4 border-t border-ink/5 dark:border-zinc-800 flex gap-2 items-center bg-canvas-cream dark:bg-black/10 rounded-b-md">
                            <input
                                disabled={isResponding}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type your reply here..."
                                className="flex-1 px-4 py-2.5 bg-canvas dark:bg-zinc-950 border border-ink/10 dark:border-zinc-800 rounded-full text-sm font-medium focus:outline-none text-ink dark:text-canvas-cream focus:border-hume-lavender transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSendMessage();
                                }}
                            />
                            <button
                                disabled={isResponding || inputValue.trim() === ""}
                                onClick={handleSendMessage}
                                className={`px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-none ${
                                    inputValue.trim() !== "" && !isResponding
                                        ? "bg-ink dark:bg-canvas-cream text-canvas-cream dark:text-ink cursor-pointer active:scale-95 hover:opacity-90"
                                        : "bg-ink/5 dark:bg-canvas-cream/5 text-ink/30 dark:text-canvas-cream/30 cursor-not-allowed"
                                }`}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}

export default function AITutorPage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-background text-foreground tracking-tight">
                <div className="text-ink/65 dark:text-canvas-cream/65 font-mono text-xs uppercase tracking-wider font-bold">Loading AI Coach...</div>
            </main>
        }>
            <AITutorContent />
        </Suspense>
    );
}
