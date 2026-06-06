let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playErrorBeep(): void {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sawtooth";
        oscillator.frequency.value = 140;
        gainNode.gain.value = 0.15;

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.error("Audio beep error:", e);
    }
}

export function playErrorBuzz(): void {
    try {
        const AudioCtx = typeof window !== "undefined"
            ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
            : null;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = "sawtooth";
        oscillator.frequency.value = 150;
        gainNode.gain.value = 0.5;
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            ctx.close();
        }, 200);
    } catch (e) {
        console.error("Audio buzz error:", e);
    }
}

export function playKeyClickSound(isSpace = false): void {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gainOsc = ctx.createGain();
        osc.connect(gainOsc);
        gainOsc.connect(ctx.destination);

        osc.type = isSpace ? "triangle" : "sine";
        const freq = isSpace ? 180 : 700;
        const duration = isSpace ? 0.035 : 0.015;
        const vol = isSpace ? 0.40 : 0.28;

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gainOsc.gain.setValueAtTime(vol, ctx.currentTime);
        gainOsc.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.start();
        osc.stop(ctx.currentTime + duration);

        const noiseLength = isSpace ? 0.025 : 0.010;
        const bufferSize = ctx.sampleRate * noiseLength;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = isSpace ? 1000 : 4500;
        filter.Q.value = isSpace ? 2.0 : 6.0;

        const gainNoise = ctx.createGain();
        noiseNode.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(ctx.destination);

        gainNoise.gain.setValueAtTime(isSpace ? 0.30 : 0.45, ctx.currentTime);
        gainNoise.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + noiseLength);
        noiseNode.start();
    } catch (e) {
        console.error("Audio click sound error:", e);
    }
}
