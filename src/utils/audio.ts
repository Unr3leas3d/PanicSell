// Web Audio API Synthesizer for Panic Sell

let audioCtx: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export function playAlarm() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Stop any existing sound
    stopSound();

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);

    // Siren effect: oscillate frequency up and down
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.9);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.2);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);

    currentOscillator = osc;
}

export function playSuccess() {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopSound();

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Cash register / chime effect
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
}

export function stopSound() {
    if (currentOscillator) {
        try {
            currentOscillator.stop();
        } catch (e) {
            // Ignore if already stopped
        }
        currentOscillator = null;
    }
}
