import { useRef, useCallback, useState } from 'react';

const MUTE_KEY = 'king_parking_muted';

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1');

  function getCtx(): AudioContext | null {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      try {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        masterGainRef.current = ctxRef.current.createGain();
        masterGainRef.current.gain.value = localStorage.getItem(MUTE_KEY) === '1' ? 0 : 1;
        masterGainRef.current.connect(ctxRef.current.destination);
      } catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }

  function getOutput(): AudioNode | null {
    const ctx = getCtx();
    return masterGainRef.current ?? (ctx ? ctx.destination : null);
  }

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = next ? 0 : 1;
      }
      return next;
    });
  }, []);

  const playHorn = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  }, []);

  const playTireScreech = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    const bufSize = ctx.sampleRate * 0.18;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    src.connect(filter); filter.connect(gain); gain.connect(out);
    src.start(ctx.currentTime);
  }, []);

  const playCollision = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  }, []);

  const playParked = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    [0, 0.08, 0.16].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(out);
      osc.type = 'sine';
      const freqs = [523, 659, 784];
      osc.frequency.value = freqs[i];
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.2);
    });
  }, []);

  const playVictory = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    const notes = [
      { freq: 523, t: 0 }, { freq: 659, t: 0.1 }, { freq: 784, t: 0.2 },
      { freq: 1047, t: 0.3 }, { freq: 1047, t: 0.45 }, { freq: 1175, t: 0.55 },
    ];
    notes.forEach(({ freq, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(out);
      osc.type = 'triangle'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.25);
    });
  }, []);

  const playNitro = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
  }, []);

  const playEliminated = useCallback(() => {
    const ctx = getCtx(); const out = getOutput();
    if (!ctx || !out) return;
    [0, 0.1, 0.2].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(out);
      osc.type = 'sawtooth';
      const freqs = [440, 330, 220];
      osc.frequency.value = freqs[i];
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.15);
    });
  }, []);

  const init = useCallback(() => { getCtx(); }, []);

  return { playHorn, playTireScreech, playCollision, playParked, playVictory, playNitro, playEliminated, init, muted, toggleMute };
}
