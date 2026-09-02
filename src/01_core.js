// ============================================================
// 99 DAYS — core: canvas, scaling, input, rng, audio, utils
// ============================================================
const W = 480, H = 270;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

function mkCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  return [c, g];
}

let SCALE = 1;
function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  SCALE = Math.max(1, Math.floor(Math.min(ww / W, wh / H)));
  // allow fractional scale on very small screens so the whole scene fits
  if (ww < W || wh < H) SCALE = Math.min(ww / W, wh / H);
  canvas.style.width = (W * SCALE) + 'px';
  canvas.style.height = (H * SCALE) + 'px';
}
window.addEventListener('resize', resize); resize();

// ---------- utils ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rnd = (a, b) => Math.random() * (b - a) + a;
const irnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function seeded(seed) { // mulberry32
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbStr(r, g, b, a) { return a === undefined ? `rgb(${r|0},${g|0},${b|0})` : `rgba(${r|0},${g|0},${b|0},${a})`; }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbStr(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function mixRgb(A, B, t) { return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]; }

// ---------- input ----------
const Input = {
  down: {}, pressed: {}, _queue: [], touch: false, gamepadSeen: false,
  map: {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyE: 'act', Enter: 'act', Space: 'act', KeyX: 'back', Escape: 'menu', Backspace: 'back',
    KeyM: 'mute', KeyQ: 'back'
  },
  raw: [], _rawQ: [], _tap: null, tap: null,
  press(code) { this._rawQ.push(code); const k = this.map[code]; if (!k) return; if (!this.down[k]) this._queue.push(k); this.down[k] = true; },
  release(code) { const k = this.map[code]; if (!k) return; this.down[k] = false; },
  beginFrame() { this.pressed = {}; for (const k of this._queue) this.pressed[k] = true; this._queue.length = 0; this.raw = this._rawQ; this._rawQ = []; this.tap = this._tap; this._tap = null; this.pollGamepad(); },
  digit() { for (const c of this.raw) { const m = /^(?:Digit|Numpad)(\d)$/.exec(c); if (m) return +m[1]; } return null; },
  hit(k) { return !!this.pressed[k]; },
  held(k) { return !!this.down[k]; },
  anyHit() { return Object.keys(this.pressed).length > 0; },
  gp: { prev: {} },
  pollGamepad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let g = null; for (const x of gps) if (x) { g = x; break; }
    if (!g) return;
    this.gamepadSeen = true;
    const st = {};
    const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
    st.left = ax < -0.5 || (g.buttons[14] && g.buttons[14].pressed);
    st.right = ax > 0.5 || (g.buttons[15] && g.buttons[15].pressed);
    st.up = ay < -0.5 || (g.buttons[12] && g.buttons[12].pressed);
    st.down = ay > 0.5 || (g.buttons[13] && g.buttons[13].pressed);
    st.act = (g.buttons[0] && g.buttons[0].pressed) || (g.buttons[2] && g.buttons[2].pressed);
    st.back = (g.buttons[1] && g.buttons[1].pressed);
    st.menu = (g.buttons[9] && g.buttons[9].pressed);
    for (const k in st) {
      if (st[k] && !this.gp.prev[k]) { this.pressed[k] = true; this.down[k] = true; this.gpHeld = this.gpHeld || {}; this.gpHeld[k] = true; }
      if (!st[k] && this.gp.prev[k]) { if (this.gpHeld && this.gpHeld[k]) { this.down[k] = false; this.gpHeld[k] = false; } }
    }
    this.gp.prev = st;
  }
};
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  Input.press(e.code); Audio.unlock();
});
window.addEventListener('keyup', e => Input.release(e.code));
window.addEventListener('blur', () => { Input.down = {}; });

// touch controls
(function setupTouch() {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const layer = document.getElementById('touch');
  if (!isTouch) return;
  Input.touch = true; layer.classList.add('on');
  for (const b of layer.querySelectorAll('.tb')) {
    const code = b.dataset.k;
    const dn = e => { e.preventDefault(); b.classList.add('down'); Input.press(code); Audio.unlock(); };
    const up = e => { e.preventDefault(); b.classList.remove('down'); Input.release(code); };
    b.addEventListener('touchstart', dn, { passive: false }); b.addEventListener('touchend', up, { passive: false });
    b.addEventListener('touchcancel', up, { passive: false });
    b.addEventListener('mousedown', dn); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
  }
  // tap on canvas acts as "act" (advances dialogue)
  canvas.addEventListener('touchstart', e => { e.preventDefault(); Input.press('KeyE'); Audio.unlock(); setTimeout(() => Input.release('KeyE'), 60); }, { passive: false });
})();
canvas.addEventListener('mousedown', () => { Audio.unlock(); canvas.focus(); });
canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); Input._tap = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; });

// ---------- audio (procedural, tiny) ----------
const Audio = {
  ctx: null, master: null, muted: false, rainGain: null, rainNode: null, _unlocked: false,
  unlock() {
    if (this._unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this._unlocked = true; this.startRain();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { }
  },
  startRain() {
    const c = this.ctx; const len = c.sampleRate * 2; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = (w * 0.35 + last * 3) * 0.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.master); src.start();
    this.rainGain = g;
  },
  setRain(level) { if (!this.rainGain) return; this.rainGain.gain.setTargetAtTime(this.muted ? 0 : level * 0.35, this.ctx.currentTime, 0.8); },
  tone(freq, dur, type, vol, slide) {
    if (!this._unlocked || this.muted) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.value = freq; if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), c.currentTime + dur);
    g.gain.value = vol || 0.08; g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + dur + 0.02);
  },
  blip() { this.tone(660, 0.05, 'square', 0.04); },
  sel() { this.tone(520, 0.08, 'triangle', 0.06, 1.5); },
  back() { this.tone(300, 0.08, 'triangle', 0.05, 0.6); },
  coin() { this.tone(880, 0.07, 'square', 0.05); setTimeout(() => this.tone(1320, 0.12, 'square', 0.05), 60); },
  eat() { this.tone(200, 0.1, 'sawtooth', 0.04, 0.5); },
  good() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.06), i * 90)); },
  sad() { [392, 349, 311].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.05), i * 160)); },
  bad() { this.tone(140, 0.25, 'sawtooth', 0.06, 0.5); },
  step() { this.tone(90 + Math.random() * 40, 0.04, 'triangle', 0.025); },
  chord(notes, dur) { notes.forEach(f => this.tone(f, dur || 1.2, 'sine', 0.05)); },
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.5; }
};
