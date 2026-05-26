const KEY = "ogd:soundOn";

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundOn(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * A short, soft tone for MIT-done. Synthesised on the fly via WebAudio so we
 * don't ship an mp3 placeholder. Replace with a real sample later if desired.
 */
export function playDoneTone() {
  if (typeof window === "undefined") return;
  if (!isSoundOn()) return;
  type WindowWithWebkitAudio = Window &
    typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const w = window as WindowWithWebkitAudio;
  const Ctx = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;

  // Two-note chime: D5 → F#5
  const notes = [
    { freq: 587.33, start: 0, duration: 0.32 },
    { freq: 739.99, start: 0.12, duration: 0.45 },
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(0, now + note.start);
    gain.gain.linearRampToValueAtTime(0.18, now + note.start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.duration + 0.05);
  }

  // Close the context shortly after.
  window.setTimeout(() => {
    void ctx.close().catch(() => {});
  }, 800);
}
