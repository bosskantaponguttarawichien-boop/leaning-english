/**
 * Novelty / fun system voices (macOS in particular ships these) that are
 * designed to sound like sound effects rather than natural speech — e.g. Albert
 * is an intentionally raspy, monster-like voice. They must never be
 * auto-picked for reading text aloud.
 */
const NOVELTY_PATTERNS = [
    "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
    "good news", "jester", "junior", "organ", "superstar", "trinoids",
    "whisper", "wobble", "zarvox", "fred", "ralph", "kathy",
    "grandma", "grandpa", "deranged", "hysterical", "novelty", "pipe organ", "princess"
];

// Preferred clean, high-quality voices in order of priority across macOS, iOS, Windows, Chrome, Android
const PREFERRED_VOICES = [
    "samantha",
    "alex",
    "karen",
    "victoria",
    "daniel",
    "google us english",
    "google uk english female",
    "google uk english male",
    "microsoft jenny",
    "microsoft aria",
    "microsoft guy",
    "microsoft zira",
    "microsoft david",
    "microsoft mark",
    "moira",
    "fiona",
    "tessa",
    "siri"
];

export function isUsableEnglishVoice(voice: SpeechSynthesisVoice): boolean {
    if (!voice || !voice.lang) return false;
    const lang = voice.lang.toLowerCase();
    if (!lang.startsWith("en")) return false;

    const lowerName = voice.name.toLowerCase();
    return !NOVELTY_PATTERNS.some(pattern => lowerName.includes(pattern));
}

// Attempt to find an English voice, preferring known-clean local/online natural voices.
export function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    if (!voices || voices.length === 0) return undefined;

    const usableVoices = voices.filter(isUsableEnglishVoice);
    if (usableVoices.length === 0) {
        return voices.find(v => v.lang.toLowerCase().startsWith("en"));
    }

    // 1. Check preferred clean voices in priority order
    for (const pref of PREFERRED_VOICES) {
        const found = usableVoices.find(v => v.name.toLowerCase().includes(pref));
        if (found) return found;
    }

    // 2. Try any "Natural", "Enhanced", or "Online" en-US voice
    const naturalUs = usableVoices.find(v =>
        v.lang.toLowerCase().startsWith("en-us") &&
        (v.name.includes("Natural") || v.name.includes("Enhanced") || v.name.includes("Online"))
    );
    if (naturalUs) return naturalUs;

    // 3. Try local en-US voice
    const localUs = usableVoices.find(v => v.lang.toLowerCase().startsWith("en-us") && v.localService);
    if (localUs) return localUs;

    // 4. Try any en-US voice
    const anyUs = usableVoices.find(v => v.lang.toLowerCase().startsWith("en-us"));
    if (anyUs) return anyUs;

    // 5. Try any local en voice
    const localEn = usableVoices.find(v => v.localService);
    if (localEn) return localEn;

    // 6. Return first usable English voice
    return usableVoices[0];
}

export function createEnglishUtterance(text: string, rate = 1.0): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = pickEnglishVoice(voices);
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    return utterance;
}

export function cancelSpeech() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

// Warm up voices on platforms like Chrome where voices load asynchronously
if (typeof window !== "undefined" && window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}

export interface SpeakOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (event: SpeechSynthesisErrorEvent) => void;
}

// Bumped on every speak() call so a stale setTimeout from a superseded call
// can detect it's been superseded and skip speaking out of order.
let speakToken = 0;

/**
 * Utility for speaking text using the Web Speech API with clean voice selection.
 */
export function speak(text: string, options: SpeakOptions = {}) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("Speech synthesis not supported in this environment.");
        return;
    }

    const synth = window.speechSynthesis;
    const myToken = ++speakToken;

    const doSpeak = () => {
        if (myToken !== speakToken) return;

        const utterance = createEnglishUtterance(text, options.rate ?? 1.0);
        if (options.pitch !== undefined) utterance.pitch = options.pitch;
        if (options.volume !== undefined) utterance.volume = options.volume;

        if (options.onEnd) utterance.onend = options.onEnd;
        if (options.onError) utterance.onerror = options.onError;

        synth.speak(utterance);
    };

    if (synth.speaking || synth.pending) {
        // Cancel any ongoing speech. Re-speaking immediately after makes
        // Chrome's TTS engine overlap the old audio buffer with the new
        // one, producing a garbled/raspy voice, so give it a beat to fully
        // tear down first.
        synth.cancel();
        setTimeout(doSpeak, 60);
    } else {
        doSpeak();
    }
}

