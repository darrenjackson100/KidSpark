let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function isMuted() {
  return localStorage.getItem("kidspark_muted") === "true";
}

function playTone(
  freq: number,
  endFreq: number,
  duration: number,
  volume: number = 0.08,
  type: OscillatorType = "sine"
) {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  } catch {
    // ignore
  }
}

export const sounds = {
  click() {
    playTone(600, 400, 0.08, 0.06, "sine");
  },
  correct() {
    playTone(523, 783, 0.12, 0.09, "sine");
    setTimeout(() => playTone(783, 1046, 0.12, 0.09, "sine"), 130);
  },
  wrong() {
    playTone(280, 220, 0.18, 0.07, "triangle");
  },
  celebrate() {
    playTone(523, 1046, 0.1, 0.09, "sine");
    setTimeout(() => playTone(659, 1318, 0.1, 0.08, "sine"), 100);
    setTimeout(() => playTone(783, 1568, 0.12, 0.08, "sine"), 200);
  },
  pop() {
    playTone(700, 350, 0.07, 0.07, "sine");
  },
};
