const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function weekdayName(day) { return WEEKDAYS[day % 7]; }
// ============================================================
// ui: hud, dialogue, menus, toasts, fades
// ============================================================
const UI = {
  toasts: [], fade: 0, fadeDir: 0, fadeCb: null, fadeSpeed: 0.05,
  panel(g, x, y, w, h, alpha) {
    g.fillStyle = `rgba(10,12,18,${alpha === undefined ? 0.86 : alpha})`; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(180,190,210,0.35)'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = 'rgba(180,190,210,0.12)'; g.fillRect(x + 1, y + 1, w - 2, 1);
  },
  bar(g, x, y, w, h, v, col, bg) {
    g.fillStyle = bg || 'rgba(0,0,0,0.6)'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = '#1e2028'; g.fillRect(x, y, w, h);
    const fw = Math.round(w * clamp(v, 0, 1)); if (fw > 0) { g.fillStyle = col; g.fillRect(x, y, fw, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, y, fw, 1); }
  },
  toast(text, color) { this.toasts.push({ text, color: color || '#e8e8f0', t: 0 }); if (this.toasts.length > 5) this.toasts.shift(); },
  fadeOut(cb, speed) { this.fadeDir = 1; this.fadeCb = cb; this.fadeSpeed = speed || 0.05; },
  fadeIn() { this.fadeDir = -1; },
  updateFade() {
    if (this.fadeDir === 1) { this.fade = Math.min(1, this.fade + this.fadeSpeed); if (this.fade >= 1) { this.fadeDir = 0; const cb = this.fadeCb; this.fadeCb = null; if (cb) cb(); } }
    else if (this.fadeDir === -1) { this.fade = Math.max(0, this.fade - this.fadeSpeed); if (this.fade <= 0) this.fadeDir = 0; }
  },
  drawFade(g) { if (this.fade > 0) { g.fillStyle = `rgba(4,5,9,${this.fade})`; g.fillRect(0, 0, W, H); } },
  drawHud(g, t) {
    if (G.hideHud) return;
    const PW = 150;                                                   // hud panel width
    this.panel(g, 4, 4, PW, 40, 0.7);
    const dayStr = `DAY ${G.day}`; drawText(g, dayStr, 10, 9, '#f0ead8');
    const wdX = 10 + textWidth(dayStr) + 5; const wd = weekdayName(G.day); drawText(g, wd, wdX, 9, G.day % 7 === 0 ? '#c8b070' : '#9aa4b8');
    drawText(g, `${99 - G.day} left`, wdX + textWidth(wd) + 6, 9, '#8a92a4');
    drawText(g, `$${G.money}`, PW - 2, 9, '#e8c84a', { align: 'right' });
    const BW = PW - 42;                                                // bar width
    drawText(g, 'FOOD', 10, 21, '#8a92a4'); this.bar(g, 38, 22, BW, 5, G.hunger / 100, G.hunger < 25 ? '#d84a4a' : '#c8843a');
    drawText(g, 'ENRG', 10, 32, '#8a92a4'); this.bar(g, 38, 33, BW, 5, G.energy / G.maxEnergy, '#4a9ad8');
    // max-energy loss marker
    g.fillStyle = 'rgba(216,74,74,0.5)'; g.fillRect(38 + Math.round(BW * G.maxEnergy / 100), 33, BW - Math.round(BW * G.maxEnergy / 100), 5);
    const f = G.flags; const goal = f.nanoPaid ? null : f.nanoKnown ? ['NANOBOTS', NANO_COST] : f.cureKnown && !f.curePaid ? ['HALVORSEN', CURE_COST] : null;
    if (goal) { this.panel(g, 4, 46, PW, 12, 0.7); drawText(g, goal[0], 10, 48, '#8a92a4'); this.bar(g, 68, 49, PW - 96, 5, G.money / goal[1], '#8ab0d8'); drawText(g, `${Math.min(100, Math.floor(G.money / (goal[1] / 100)))}%`, PW - 2, 48, '#c8ccd8', { align: 'right' }); }
    else if (f.nanoPaid) { this.panel(g, 4, 46, PW, 12, 0.7); const due = G.day >= f.nanoNext; drawText(g, 'NB-7 SHOT', 10, 48, '#8a92a4'); drawText(g, due ? (G.day > f.nanoNext ? 'OVERDUE' : 'DUE TODAY') : `next ${weekdayName(f.nanoNext)}`, PW - 2, 48, due ? '#e8c84a' : '#c8ccd8', { align: 'right' }); }
    if (G.flags.own_watch) { const ct = clockText(); const cw = textWidth(ct) + 10; this.panel(g, W - cw - 4, 4, cw, 13, 0.7); drawText(g, ct, W - 9, 7, '#e8e0c8', { align: 'right' }); }
    // inventory quick view
    const items = [['bread', SPR.bread], ['soup', SPR.soup], ['rice', SPR.rice], ['fish', SPR.fish], ['veg', SPR.veg]]; let ix = PW + 10;
    for (const [k, s] of items) { if (!G.inv[k]) continue; this.panel(g, ix, 4, 22, 18, 0.6); g.drawImage(s, ix + 5, 7); drawText(g, '' + G.inv[k], ix + 20, 13, '#f0ead8', { align: 'right' }); ix += 24; }
    // status icons
    const sy = goal || f.nanoPaid ? 60 : 46;
    if (G.hunger < 25) { const a = 0.6 + 0.4 * Math.sin(t * 0.15); g.globalAlpha = a; drawText(g, 'STARVING', 10, sy, '#ff6a5a'); g.globalAlpha = 1; }
    if (G.energy < 20 && G.hunger >= 25) drawText(g, 'exhausted', 10, sy, '#8ab0d8');
    // toasts
    for (let i = 0; i < this.toasts.length; i++) {
      const tt = this.toasts[i]; tt.t++;
      const a = tt.t < 20 ? tt.t / 20 : tt.t > 120 ? Math.max(0, 1 - (tt.t - 120) / 30) : 1;
      g.globalAlpha = a; drawText(g, tt.text, W - 8, 30 + i * 11 - Math.min(10, tt.t / 3), tt.color, { align: 'right', shadow: '#000' }); g.globalAlpha = 1;
    }
    this.toasts = this.toasts.filter(x => x.t < 150);
  },
  drawPrompt(g, text, x, y) {
    const w = textWidth(text) + 10; this.panel(g, Math.round(x - w / 2), y, w, 13, 0.8); drawText(g, text, Math.round(x), y + 3, '#f0ead8', { align: 'center' });
  },
  drawHint(g, text) { const w = textWidth(text) + 10; this.panel(g, Math.round(W / 2 - w / 2), H - 16, w, 13, 0.7); drawText(g, text, W / 2, H - 13, '#b8c0d0', { align: 'center' }); },
  keyName(k) { if (Input.touch) return { act: 'E', back: 'X', menu: 'MENU', up: 'UP' }[k]; if (Input.gamepadSeen) return { act: 'A', back: 'B', menu: 'START', up: 'UP' }[k]; return { act: 'E', back: 'X', menu: 'ESC', up: 'UP' }[k]; },
};

// ---------- speakers ----------
const SPEAKERS = {
  you: { name: 'You', color: '#d8dce8', spec: 'player' },
  amos: { name: 'Amos', color: '#c8b088', spec: 'amos0' },
  mei: { name: 'Mei', color: '#e8c84a', spec: 'mei' },
  walter: { name: 'Walter', color: '#c8a888', spec: 'walter' },
  nadia: { name: 'Nadia', color: '#6ac8c4', spec: 'nadia' },
  doctor: { name: 'Dr. Okafor', color: '#8ab0d8', spec: 'doctor' },
  busker: { name: 'Busker', color: '#c88ac8', spec: 'busker' },
  kid: { name: 'Kid', color: '#e88a6a', spec: 'kid' },
  granny: { name: 'Mrs. Ortega', color: '#d8a8c8', spec: 'granny' },
  worker: { name: 'Foreman', color: '#e8a020', spec: 'worker' },
  meiMom: { name: 'Mrs. Lin', color: '#c8c8d8', spec: 'meiMom' },
  woman1: { name: 'Woman', color: '#c8c8d8', spec: 'woman1' },
  man1: { name: 'Man', color: '#c8c8d8', spec: 'man1' },
  dog: { name: 'Dog', color: '#c8a878', sprite: 'dogSit' },
  narrator: { name: '', color: '#a8b0c0' },
};
const portraitCache = {};
function portrait(id) {
  if (portraitCache[id]) return portraitCache[id];
  const sp = SPEAKERS[id]; if (!sp) return null;
  const [c, g] = mkCanvas(32, 32);
  if (sp.sprite) { const s = SPR[sp.sprite]; g.drawImage(s, 0, 0, s.width, s.height, 2, 8, s.width * 2, s.height * 2); }
  else {
    const spec = id === 'you' && typeof playerSpec === 'function' && G ? playerSpec() : (G.chars && G.chars[id] && G.chars[id].spec) || sp.spec;
    const fr = charFrames(SPECS[spec]).idle;
    g.drawImage(fr, 2, 0, 20, 16, -4, 0, 40, 32);
  }
  portraitCache[id] = c; return c;
}
function clearPortrait(id) { delete portraitCache[id]; }

// ---------- dialogue engine ----------
const Dlg = {
  steps: [], i: 0, active: false, line: null, shown: 0, choices: null, sel: 0, done: null, autoT: 0,
  run(steps, done) {
    this.steps = flat(steps); this.i = 0; this.active = true; this.done = done || null; this.line = null; this.choices = null;
    if (G.state !== 'ending') G.state = 'dialogue'; this.next();
    function flat(s) { const out = []; for (const x of s) { if (Array.isArray(x)) out.push(...flat(x)); else if (x) out.push(x); } return out; }
  },
  insert(steps) { const f = []; (function fl(s) { for (const x of s) { if (Array.isArray(x)) fl(x); else if (x) f.push(x); } })(steps); this.steps.splice(this.i, 0, ...f); },
  next() {
    while (true) {
      if (this.i >= this.steps.length) { this.end(); return; }
      const s = this.steps[this.i++];
      if (typeof s === 'function') { const r = s(); if (Array.isArray(r)) this.insert(r); continue; }
      if (s.fn) { const r = s.fn(); if (Array.isArray(r)) this.insert(r); continue; }
      if (s.if !== undefined) { const ok = typeof s.if === 'function' ? s.if() : s.if; if (ok) { if (s.then) this.insert(Array.isArray(s.then) ? s.then : [s.then]); } else if (s.else) this.insert(Array.isArray(s.else) ? s.else : [s.else]); continue; }
      if (s.say !== undefined) { this.line = { who: s.say, text: s.text, mood: s.mood }; this.shown = 0; this.choices = null; return; }
      if (s.choice) { this.choices = s.choice.filter(c => !c.hide || !c.hide()); this.sel = 0; return; }
      if (s.wait) { this.line = null; this.autoT = s.wait; return; }
    }
  },
  end() { this.active = false; this.line = null; this.choices = null; if (G.state === 'dialogue') G.state = 'play'; const d = this.done; this.done = null; if (d) d(); },
  update() {
    if (this.autoT > 0) { this.autoT--; if (this.autoT === 0) this.next(); return; }
    if (this.choices) {
      if (Input.hit('up')) { this.sel = (this.sel + this.choices.length - 1) % this.choices.length; Audio.blip(); }
      if (Input.hit('down')) { this.sel = (this.sel + 1) % this.choices.length; Audio.blip(); }
      if (Input.hit('act')) {
        const c = this.choices[this.sel]; Audio.sel(); this.choices = null;
        if (c.do) { const r = c.do(); if (Array.isArray(r)) this.insert(r); }
        if (c.next) this.insert(Array.isArray(c.next) ? c.next : [c.next]);
        this.next();
      }
      return;
    }
    if (this.line) {
      const full = this.line.text.length;
      this.shown += 1;
      if (Input.hit('act') || Input.hit('back')) {
        if (this.shown < full) this.shown = full; else { Audio.blip(); this.next(); }
      }
    }
  },
  draw(g, t) {
    if (!this.active) return;
    if (this.line) {
      const who = SPEAKERS[this.line.who] || SPEAKERS.narrator;
      const bx = 8, by = H - 66, bw = W - 16, bh = 58;
      UI.panel(g, bx, by, bw, bh, 0.9);
      let tx = bx + 10;
      if (this.line.who !== 'narrator' && who.name) {
        const p = portrait(this.line.who);
        if (p) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(bx + 6, by + 8, 36, 36); g.drawImage(p, bx + 8, by + 10); g.fillStyle = who.color; g.fillRect(bx + 6, by + 44, 36, 1); tx = bx + 50; }
        drawText(g, who.name, tx, by + 6, who.color);
      }
      const maxW = bx + bw - tx - 10; const lines = wrapText(this.line.text, maxW);
      let remaining = Math.floor(this.shown * 1.2); let ly = by + (who.name && this.line.who !== 'narrator' ? 18 : 12);
      if (this.line.who === 'narrator') { g.globalAlpha = 0.9; }
      for (const ln of lines) { const s = ln.slice(0, Math.max(0, remaining)); remaining -= ln.length + 1; drawText(g, s, tx, ly, this.line.who === 'narrator' ? '#b8c0d0' : '#f0ead8'); ly += 10; if (remaining <= 0) break; }
      g.globalAlpha = 1;
      if (this.shown * 1.2 >= this.line.text.length && (t % 40) < 24) drawText(g, '>', bx + bw - 10, by + bh - 10, '#8a92a4');
    }
    if (this.choices) {
      const cw = 220, ch = this.choices.length * 12 + 10; const cx = W - cw - 8, cy = H - 66 - ch - 4;
      UI.panel(g, cx, cy, cw, ch, 0.92);
      for (let i = 0; i < this.choices.length; i++) {
        const c = this.choices[i]; const y = cy + 5 + i * 12; const on = i === this.sel;
        if (on) { g.fillStyle = 'rgba(232,200,74,0.12)'; g.fillRect(cx + 2, y - 2, cw - 4, 11); drawText(g, '>', cx + 6, y, '#e8c84a'); }
        let label = c.t; if (c.cost) label += `  (${c.cost})`;
        drawText(g, label, cx + 14, y, c.dim && c.dim() ? '#6a7080' : on ? '#f8f0d8' : '#c8ccd8');
      }
    }
  }
};

// ---------- generic menu ----------
const Menu = {
  active: false, title: '', items: [], sel: 0, onClose: null, sub: null, wide: false,
  open(title, items, opts) { this.active = true; this.title = title; this.items = items.filter(i => !i.hide || !i.hide()); this.sel = 0; this.onClose = (opts && opts.onClose) || null; this.sub = (opts && opts.sub) || null; this.wide = !!(opts && opts.wide); this.prev = G.state; G.state = 'menu'; },
  close() { this.active = false; if (G.state === 'menu') G.state = (this.prev === 'dialogue' && Dlg.active) ? 'dialogue' : (this.prev === 'ending' ? 'ending' : 'play'); const c = this.onClose; this.onClose = null; if (c) c(); },
  update() {
    if (!this.active) return;
    if (Input.hit('up')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; Audio.blip(); }
    if (Input.hit('down')) { this.sel = (this.sel + 1) % this.items.length; Audio.blip(); }
    if (Input.hit('back') || Input.hit('menu')) { Audio.back(); this.close(); return; }
    if (Input.hit('act')) { const it = this.items[this.sel]; if (it.disabled && it.disabled()) { Audio.bad(); return; } Audio.sel(); if (it.keep) { it.do(); this.items = this.items.filter(i => !i.hide || !i.hide()); this.sel = Math.min(this.sel, this.items.length - 1); } else { this.close(); it.do(); } }
  },
  draw(g, t) {
    if (!this.active) return;
    const w = this.wide ? 300 : 200, h = this.items.length * 13 + (this.sub ? 40 : 26);
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    UI.panel(g, x, y, w, h, 0.93);
    drawText(g, this.title, x + w / 2, y + 6, '#e8c84a', { align: 'center' });
    let iy = y + 20;
    if (this.sub) { const lines = wrapText(this.sub, w - 20); for (const ln of lines.slice(0, 2)) { drawText(g, ln, x + w / 2, iy, '#8a92a4', { align: 'center' }); iy += 9; } iy += 4; }
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]; const on = i === this.sel; const dis = it.disabled && it.disabled();
      if (on) { g.fillStyle = 'rgba(232,200,74,0.12)'; g.fillRect(x + 4, iy - 2, w - 8, 12); drawText(g, '>', x + 8, iy, '#e8c84a'); }
      drawText(g, it.t, x + 18, iy, dis ? '#5a6070' : on ? '#f8f0d8' : '#c8ccd8');
      if (it.r) drawText(g, typeof it.r === 'function' ? it.r() : it.r, x + w - 8, iy, dis ? '#5a6070' : '#8a92a4', { align: 'right' });
      iy += 13;
    }
  }
};
