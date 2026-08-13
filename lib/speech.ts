/**
 * "Novelty"/fun system voices (macOS in particular ships these) that are
 * designed to sound like effects rather than natural speech — e.g. Albert
 * is an intentionally raspy, monster-like voice. They must never be
 * auto-picked for reading words aloud.
 */
const NOVELTY_VOICE_NAMES = new Set([
    "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
    "Good News", "Jester", "Junior", "Organ", "Superstar", "Trinoids",
    "Whisper", "Wobble", "Zarvox", "Fred", "Ralph", "Kathy",
    "Grandma (English (United States))", "Grandma (English (United Kingdom))",
    "Grandpa (English (United States))", "Grandpa (English (United Kingdom))",
]);

function isUsableEnglishVoice(voice: SpeechSynthesisVoice) {
    return voice.lang.startsWith("en") && !NOVELTY_VOICE_NAMES.has(voice.name);
}

// Attempt to find an English voice, preferring known-clean local voices.
function pickEnglishVoice(voices: SpeechSynthesisVoice[]) {
    return voices.find(v => v.name === "Samantha") ||
        voices.find(v => v.lang.startsWith("en-US") && v.localService && isUsableEnglishVoice(v)) ||
        voices.find(v => v.lang.startsWith("en") && v.localService && isUsableEnglishVoice(v)) ||
        voices.find(v => v.lang.startsWith("en-US") && isUsableEnglishVoice(v)) ||
        voices.find(v => isUsableEnglishVoice(v));
}

// Bumped on every speak() call so a stale setTimeout from a superseded call
// (e.g. rapid double-clicks on a listen button) can detect it's been
// superseded and skip speaking out of order.
let speakToken = 0;

/**
 * Utility for speaking text using the Web Speech API.
 */
export function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("Speech synthesis not supported in this environment.");
        return;
    }

    const synth = window.speechSynthesis;
    const myToken = ++speakToken;

    const doSpeak = () => {
        if (myToken !== speakToken) return;

        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to find an English voice
        const voices = synth.getVoices();
        const englishVoice = pickEnglishVoice(voices);

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        synth.speak(utterance);
    };

    if (synth.speaking || synth.pending) {
        // Cancel any ongoing speech. Re-speaking immediately after makes
        // Chrome's TTS engine overlap the old audio buffer with the new
        // one, producing a garbled/raspy voice, so give it a beat to fully
        // tear down first.
        synth.cancel();
        setTimeout(doSpeak, 50);
    } else {
        doSpeak();
    }
}
