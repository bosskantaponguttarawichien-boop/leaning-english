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

function playTone(freq: number, gainVal: number, durationSec: number, type: OscillatorType = "sawtooth"): void {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = freq;
        gainNode.gain.value = gainVal;

        oscillator.start();
        oscillator.stop(ctx.currentTime + durationSec);
    } catch (e) {
        console.error("Audio playTone error:", e);
    }
}

export function playErrorBeep(): void {
    playTone(140, 0.15, 0.15);
}

export function playErrorBuzz(): void {
    playTone(150, 0.5, 0.20);
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
