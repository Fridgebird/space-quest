// Sound effects, made in the browser so there are no sound files to upload.
// Browsers only allow sound after a tap, so the audio starts on the first touch.

window.Sfx = (function () {
  let ctx = null;
  function init() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    return ctx;
  }
  document.addEventListener("pointerdown", init, { once: true });

  function noise(dur, freq, q, gain) {
    if (!ctx) return;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(ctx.destination); src.start();
  }
  function tone(type, freq, dur, gain, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }

  return {
    init,
    tick() { noise(0.012, 4200, 2, 0.5); },                                  // knob detent, fader notch
    click() { noise(0.03, 2600, 1.2, 0.8); tone("sine", 900, 0.03, 0.05); }, // toggle switch
    clunk() { noise(0.07, 700, 0.8, 1.2); tone("sine", 110, 0.12, 0.25); },  // heavy button, cover, selector
    buzz() { tone("square", 92, 0.35, 0.08); },                              // doesn't work
    beep() { tone("square", 1180, 0.07, 0.03); },                            // screen message
    ping() { tone("sine", 1480, 0.45, 0.16); tone("sine", 1110, 0.5, 0.12, 0.16); }, // undervolt alarm
    chime() { [523, 784, 1047, 1568].forEach((f, i) => tone("triangle", f, 0.5, 0.2, i * 0.1)); },
    warp() {
      if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(50, t0);
      o.frequency.exponentialRampToValueAtTime(1200, t0 + 3.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 2.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 3.7);
    }
  };
})();
