let ctx: AudioContext | null = null;

function getCtx() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  return ctx;
}

export async function playHoverWhisper() {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  const now = audioCtx.currentTime;
  const duration = 0.18;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(88 + Math.random() * 30, now);
  osc.detune.setValueAtTime(-35 + Math.random() * 25, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420 + Math.random() * 120, now);
  filter.Q.setValueAtTime(0.9, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.02 + Math.random() * 0.01, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

export async function playClickTick() {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  const now = audioCtx.currentTime;
  const duration = 0.045;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "square";
  osc.frequency.setValueAtTime(980 + Math.random() * 120, now);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(380, now);
  filter.Q.setValueAtTime(0.7, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
