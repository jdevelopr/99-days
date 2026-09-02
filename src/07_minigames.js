// ============================================================
// minigames: dishes (rhythm), crates (stacking), delivery (runner)
// ============================================================
const MG = { cur: null, onDone: null };
function startMinigame(kind, onDone) {
  MG.onDone = onDone;
  MG.cur = kind === 'dishes' ? new DishGame() : kind === 'crates' ? new CrateGame() : kind === 'data' ? new DataGame() : kind === 'cuts' ? new CutsGame() : new DeliveryGame();
  MG.cur.start(); G.state = 'minigame';
}
function endMinigame(pay, lines) {
  const cur = MG.cur; MG.cur = null; G.state = 'play';
  const cb = MG.onDone; MG.onDone = null; if (cb) cb(pay, lines);
}
function mgFrame(g, title, sub) {
  g.fillStyle = 'rgba(6,8,14,0.82)'; g.fillRect(0, 0, W, H);
  UI.panel(g, 20, 14, W - 40, H - 28, 0.9);
  drawText(g, title, W / 2, 20, '#e8c84a', { align: 'center' });
  if (sub) drawText(g, sub, W / 2, 30, '#8a92a4', { align: 'center' });
}
function difficulty() { return clamp((G.day - 1) / 60, 0, 1); }

// ---------- DISHES ----------
class DishGame {
  start() {
    this.t = 0; this.plates = []; this.score = 0; this.combo = 0; this.maxCombo = 0; this.hits = 0; this.miss = 0; this.total = 18 + Math.floor(difficulty() * 8); this.spawned = 0;
    this.speed = 1.3 + difficulty() * 0.9; this.gap = Math.max(36, 70 - difficulty() * 30); this.nextSpawn = 30; this.intro = 150; this.over = 0; this.flash = 0; this.suds = [];
  }
  update() {
    if (this.intro > 0) { this.intro--; if (Input.anyHit()) this.intro = 0; return; }
    if (this.over > 0) { this.over--; if (this.over === 0 || Input.hit('act')) this.finish(); return; }
    this.t++; this.nextSpawn--;
    if (this.nextSpawn <= 0 && this.spawned < this.total) { this.plates.push({ x: W - 30, dir: pick(['up', 'down', 'left', 'right']), state: 0 }); this.spawned++; this.nextSpawn = this.gap + irnd(-8, 8); }
    const zoneX = 120;
    for (const p of this.plates) { if (p.state === 0) p.x -= this.speed; }
    // input
    for (const k of ['up', 'down', 'left', 'right']) if (Input.hit(k)) {
      let best = null;
      for (const p of this.plates) if (p.state === 0 && Math.abs(p.x - zoneX) < 22) { if (!best || Math.abs(p.x - zoneX) < Math.abs(best.x - zoneX)) best = p; }
      if (best) {
        if (best.dir === k) { best.state = 1; best.fade = 20; this.hits++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); const perfect = Math.abs(best.x - zoneX) < 8; this.score += perfect ? 1.5 : 1; Audio.tone(perfect ? 880 : 660, 0.06, 'square', 0.04); for (let i = 0; i < 5; i++) this.suds.push({ x: zoneX + rnd(-8, 8), y: 150 + rnd(-6, 6), vy: -rnd(0.5, 1.5), t: 30 }); }
        else { best.state = 2; best.fade = 20; this.miss++; this.combo = 0; Audio.bad(); this.flash = 8; }
      } else { this.combo = 0; }
    }
    for (const p of this.plates) { if (p.state === 0 && p.x < zoneX - 24) { p.state = 3; p.fade = 20; this.miss++; this.combo = 0; this.flash = 6; Audio.tone(200, 0.1, 'sawtooth', 0.03); } if (p.state > 0) p.fade--; }
    this.plates = this.plates.filter(p => p.state === 0 || p.fade > 0);
    for (const s of this.suds) { s.y += s.vy; s.t--; } this.suds = this.suds.filter(s => s.t > 0);
    if (this.flash > 0) this.flash--;
    if (this.spawned >= this.total && this.plates.length === 0) { this.over = 140; this.pay = Math.round(this.score * 1 + this.maxCombo * 0.3); Audio.coin(); }
  }
  finish() { const lines = [`${this.hits}/${this.total} plates clean`, `best streak ${this.maxCombo}`]; endMinigame(this.pay, lines); }
  draw(g, t) {
    mgFrame(g, "DISHWASHING - NADIA'S", `plates ${this.spawned}/${this.total}   streak ${this.combo}   pay $${Math.round(this.score + this.maxCombo * 0.3)}`);
    // sink area
    px(g, 40, 120, W - 80, 70, '#3a4048'); px(g, 40, 120, W - 80, 2, '#6a7078'); px(g, 40, 184, W - 80, 6, '#2a3038');
    // water
    px(g, 40, 160, W - 80, 24, 'rgba(90,140,180,0.35)'); for (let i = 0; i < 20; i++) px(g, 40 + ((i * 47 + t * 0.5) % (W - 80)), 160 + (i * 13) % 20, 6, 1, 'rgba(200,230,255,0.25)');
    // conveyor line
    px(g, 40, 150, W - 80, 2, '#1a1e24'); for (let x = 40; x < W - 40; x += 12) px(g, x - (t * this.speed) % 12 + 12, 150, 6, 2, '#4a5058');
    // wash zone
    const zx = 120; g.fillStyle = `rgba(232,200,74,${0.18 + 0.1 * Math.sin(t * 0.2)})`; g.fillRect(zx - 16, 122, 32, 62); px(g, zx - 16, 122, 32, 1, '#e8c84a'); px(g, zx - 16, 183, 32, 1, '#e8c84a');
    if (this.flash) { g.fillStyle = `rgba(216,74,74,${this.flash / 16})`; g.fillRect(zx - 16, 122, 32, 62); }
    // plates
    for (const p of this.plates) {
      const y = 146; g.globalAlpha = p.state ? p.fade / 20 : 1;
      g.drawImage(p.state === 1 ? SPR.plate : SPR.plateDirty, Math.round(p.x) - 5, y - 6 + (p.state === 1 ? -(20 - p.fade) : p.state ? (20 - p.fade) : 0));
      const arrow = { up: '^', down: 'v', left: '<', right: '>' }[p.dir];
      const col = p.state === 1 ? '#8ae88a' : p.state ? '#e86a6a' : '#f0ead8';
      if (p.dir === 'up') { px(g, p.x - 1, y - 20, 3, 8, col); px(g, p.x - 3, y - 18, 7, 1, col); px(g, p.x - 2, y - 19, 5, 1, col); }
      else if (p.dir === 'down') { px(g, p.x - 1, y - 20, 3, 8, col); px(g, p.x - 3, y - 14, 7, 1, col); px(g, p.x - 2, y - 13, 5, 1, col); }
      else if (p.dir === 'left') { px(g, p.x - 4, y - 17, 8, 3, col); px(g, p.x - 6, y - 16, 1, 1, col); px(g, p.x - 5, y - 17, 1, 3, col); px(g, p.x - 4, y - 18, 1, 5, col); }
      else { px(g, p.x - 4, y - 17, 8, 3, col); px(g, p.x + 5, y - 16, 1, 1, col); px(g, p.x + 4, y - 17, 1, 3, col); px(g, p.x + 3, y - 18, 1, 5, col); }
      g.globalAlpha = 1;
    }
    for (const s of this.suds) { g.fillStyle = `rgba(230,240,255,${s.t / 30})`; g.fillRect(s.x, s.y, 2, 2); }
    // hands
    const fr = charFrames(SPECS.player).idle; g.drawImage(fr, zx - 12, 190 - 40 + 6, 24, 40, zx - 12, 160, 24, 40);
    if (this.intro > 0) { UI.panel(g, W / 2 - 130, 200, 260, 40, 0.95); drawText(g, 'Plates slide in from the right.', W / 2, 206, '#f0ead8', { align: 'center' }); drawText(g, 'Press the matching ARROW while a plate', W / 2, 216, '#c8ccd8', { align: 'center' }); drawText(g, 'is inside the yellow zone. Any key to start.', W / 2, 226, '#c8ccd8', { align: 'center' }); }
    else if (this.over > 0) { UI.panel(g, W / 2 - 100, 200, 200, 40, 0.95); drawText(g, 'Shift over.', W / 2, 206, '#e8c84a', { align: 'center' }); drawText(g, `${this.hits} clean, ${this.miss} missed  -  $${this.pay}`, W / 2, 220, '#f0ead8', { align: 'center' }); }
    else UI.drawHint(g, 'ARROWS to scrub');
  }
}

// ---------- CRATES ----------
class CrateGame {
  start() {
    this.t = 0; this.stack = [{ x: 200, w: 60 }]; this.cur = { x: 100, w: 60, dir: 1 }; this.speed = 1.6 + difficulty() * 1.2; this.falling = null; this.intro = 150; this.over = 0; this.count = 0; this.max = 12; this.pay = 0; this.debris = [];
  }
  update() {
    if (this.intro > 0) { this.intro--; if (Input.anyHit()) this.intro = 0; return; }
    if (this.over > 0) { this.over--; if (this.over === 0 || Input.hit('act')) endMinigame(this.pay, [`${this.count} crates stacked`]); return; }
    this.t++;
    if (this.falling) {
      this.falling.y += 6;
      const targetY = 200 - this.stack.length * 12;
      if (this.falling.y >= targetY) {
        const top = this.stack[this.stack.length - 1]; const f = this.falling; this.falling = null;
        const left = Math.max(top.x, f.x), right = Math.min(top.x + top.w, f.x + f.w); const w = right - left;
        if (w <= 6) { // toppled
          this.debris.push({ x: f.x, y: targetY, vx: f.x < top.x ? -2 : 2, vy: -1, r: 0 }); Audio.bad(); this.over = 150; this.pay = Math.round(this.count * 3 + (this.count >= 8 ? 6 : 0)); return;
        }
        if (f.w - w > 2) { this.debris.push({ x: f.x < top.x ? f.x : right, y: targetY, vx: f.x < top.x ? -1.5 : 1.5, vy: -1, r: 0, w: f.w - w }); Audio.tone(300, 0.08, 'square', 0.03); } else { Audio.tone(900, 0.08, 'square', 0.04); this.pay += 2; }
        this.stack.push({ x: left, w: w }); this.count++; this.pay += 3; Audio.coin();
        if (this.count >= this.max) { this.over = 150; this.pay += 12; return; }
        this.cur = { x: irnd(0, 1) ? 60 : 340, w: w, dir: irnd(0, 1) ? 1 : -1 }; this.speed += 0.18;
      }
    } else {
      this.cur.x += this.cur.dir * this.speed; if (this.cur.x < 50) { this.cur.x = 50; this.cur.dir = 1; } if (this.cur.x + this.cur.w > W - 50) { this.cur.x = W - 50 - this.cur.w; this.cur.dir = -1; }
      if (Input.hit('act') || Input.hit('down')) { this.falling = { x: this.cur.x, w: this.cur.w, y: 60 }; Audio.tone(220, 0.1, 'triangle', 0.03, 0.7); }
    }
    for (const d of this.debris) { d.x += d.vx; d.vy += 0.4; d.y += d.vy; d.r += d.vx * 0.05; }
    this.debris = this.debris.filter(d => d.y < H + 20);
  }
  drawCrate(g, x, y, w) {
    px(g, x, y, w, 12, '#8a6a3a'); px(g, x, y, w, 1, '#a8864a'); px(g, x, y + 11, w, 1, '#5a4020'); px(g, x, y, 1, 12, '#a8864a'); px(g, x + w - 1, y, 1, 12, '#5a4020');
    for (let i = 8; i < w - 4; i += 12) px(g, x + i, y + 1, 1, 10, '#6a4a2a'); px(g, x + 2, y + 5, w - 4, 1, '#6a4a2a');
  }
  draw(g, t) {
    mgFrame(g, 'LOADING DOCK - MORROW FREIGHT', `crates ${this.count}/${this.max}   pay $${this.pay}`);
    // rails
    px(g, 40, 50, W - 80, 4, '#3a3e48'); px(g, 40, 50, W - 80, 1, '#6a6e78');
    // floor
    px(g, 40, 200, W - 80, 30, '#4a4a50'); px(g, 40, 200, W - 80, 2, '#6a6a72'); px(g, 40, 212, W - 80, 2, '#e8a020');
    // stack
    for (let i = 0; i < this.stack.length; i++) this.drawCrate(g, this.stack[i].x, 200 - (i + 1) * 12, this.stack[i].w);
    // current or falling crate with cable
    const c = this.falling || this.cur; const cy = this.falling ? this.falling.y : 60;
    px(g, c.x + c.w / 2, 54, 1, cy - 54, '#8a8a92'); px(g, c.x + c.w / 2 - 6, 52, 13, 6, '#5a5e68');
    this.drawCrate(g, c.x, cy, c.w);
    if (!this.falling) { const top = this.stack[this.stack.length - 1]; g.fillStyle = 'rgba(232,200,74,0.12)'; g.fillRect(top.x, 60, top.w, 140); }
    for (const d of this.debris) { g.save(); g.translate(d.x, d.y); g.rotate(d.r); this.drawCrate(g, 0, 0, d.w || 60); g.restore(); }
    if (this.intro > 0) { UI.panel(g, W / 2 - 130, 224, 260, 30, 0.95); drawText(g, 'Drop the crate with E when it lines up.', W / 2, 230, '#f0ead8', { align: 'center' }); drawText(g, 'Overhang gets sliced off. Any key to start.', W / 2, 240, '#c8ccd8', { align: 'center' }); }
    else if (this.over > 0) { UI.panel(g, W / 2 - 100, 224, 200, 30, 0.95); drawText(g, this.count >= this.max ? 'Full pallet. Nice.' : 'It toppled.', W / 2, 230, '#e8c84a', { align: 'center' }); drawText(g, `${this.count} crates  -  $${this.pay}`, W / 2, 240, '#f0ead8', { align: 'center' }); }
    else UI.drawHint(g, `${UI.keyName('act')} to drop`);
  }
}

// ---------- DELIVERY ----------
class DeliveryGame {
  start() {
    this.t = 0; this.x = 0; this.py = 0; this.vy = 0; this.speed = 2.2 + difficulty() * 1.0; this.len = 2600 + difficulty() * 1200; this.obs = []; this.pkgs = []; this.got = 0; this.hits = 0; this.intro = 150; this.over = 0; this.frame = 0; this.hurt = 0;
    let x = 300; while (x < this.len - 200) { if (Math.random() < 0.7) this.obs.push({ x, k: pick(['bin', 'puddle', 'cone', 'cart']) }); if (Math.random() < 0.7) this.pkgs.push({ x: x + 90, y: irnd(0, 1) ? 0 : 34 }); x += 150 + Math.random() * 120; }
    this.total = this.pkgs.length;
  }
  update() {
    if (this.intro > 0) { this.intro--; if (Input.anyHit()) this.intro = 0; return; }
    if (this.over > 0) { this.over--; if (this.over === 0 || Input.hit('act')) endMinigame(this.pay, [`${this.got}/${this.total} packages delivered`]); return; }
    this.t++; this.x += this.speed; this.frame = (this.frame + 0.25) % 4;
    if ((Input.hit('up') || Input.hit('act')) && this.py === 0) { this.vy = -5.2; Audio.tone(500, 0.08, 'square', 0.03, 1.4); }
    this.vy += 0.32; this.py += this.vy; if (this.py > 0) { this.py = 0; this.vy = 0; }
    if (this.hurt > 0) this.hurt--;
    const px0 = this.x + 60;
    for (const o of this.obs) { if (o.hit) continue; const ow = o.k === 'cart' ? 20 : 12; if (px0 + 5 > o.x && px0 - 5 < o.x + ow && this.py > -14) { o.hit = true; this.hits++; this.hurt = 20; Audio.bad(); this.speed = Math.max(1.6, this.speed - 0.2); } }
    for (const p of this.pkgs) { if (p.got) continue; if (Math.abs(px0 - p.x) < 10 && Math.abs(-this.py - p.y) < 22) { p.got = true; this.got++; Audio.coin(); } }
    if (this.x > this.len) { this.over = 150; this.pay = Math.max(0, Math.round(this.got * 2 - this.hits)); }
  }
  draw(g, t) {
    mgFrame(g, "DELIVERY RUN - LIN'S MARKET", `packages ${this.got}/${this.total}   bumps ${this.hits}`);
    // scrolling street strip
    const camX = this.x; const sy = 150; const gy = 200;
    g.save(); g.beginPath(); g.rect(24, 40, W - 48, 190); g.clip();
    // background: static street, tiled
    const sw = World.static.width; let off = -(camX % sw);
    g.globalAlpha = 0.9; for (let x = off - sw; x < W; x += sw) g.drawImage(World.static, x, 0); g.globalAlpha = 1;
    g.fillStyle = 'rgba(6,8,14,0.45)'; g.fillRect(0, 0, W, H);
    // obstacles & packages
    for (const o of this.obs) { const sx = o.x - camX; if (sx < -40 || sx > W) continue; if (o.k === 'bin') g.drawImage(SPR.bin, sx, FEET_Y - 12); else if (o.k === 'cart') g.drawImage(SPR.cart, sx, FEET_Y - 12); else if (o.k === 'cone') { px(g, sx + 3, FEET_Y - 10, 6, 10, '#e87a2a'); px(g, sx + 1, FEET_Y - 1, 10, 2, '#e87a2a'); px(g, sx + 4, FEET_Y - 6, 4, 2, '#f0f0f0'); } else { g.fillStyle = 'rgba(120,150,190,0.5)'; g.beginPath(); g.ellipse(sx + 6, FEET_Y, 14, 3, 0, 0, Math.PI * 2); g.fill(); } if (o.hit) { g.fillStyle = 'rgba(216,74,74,0.5)'; g.fillRect(sx, FEET_Y - 14, 12, 14); } }
    for (const p of this.pkgs) { if (p.got) continue; const sx = p.x - camX; if (sx < -20 || sx > W) continue; const by = FEET_Y - 8 - p.y + Math.sin(t * 0.1 + p.x) * 2; px(g, sx - 5, by - 5, 10, 8, '#c8a06a'); px(g, sx - 5, by - 5, 10, 1, '#e8c08a'); px(g, sx - 1, by - 5, 2, 8, '#8a6a4a'); }
    // player
    const fr = charFrames(SPECS.player); const img = this.py < 0 ? fr.walk[1] : fr.walk[Math.floor(this.frame)];
    if (this.hurt % 4 < 2) g.drawImage(img, 60 - 12, FEET_Y - 38 + this.py);
    g.restore();
    // progress
    px(g, 40, 236, W - 80, 4, '#2a2e38'); px(g, 40, 236, Math.round((W - 80) * clamp(this.x / this.len, 0, 1)), 4, '#e8c84a');
    if (this.intro > 0) { UI.panel(g, W / 2 - 130, 92, 260, 30, 0.95); drawText(g, 'Run the street. UP jumps. Grab packages,', W / 2, 98, '#f0ead8', { align: 'center' }); drawText(g, 'dodge junk. Any key to start.', W / 2, 108, '#c8ccd8', { align: 'center' }); }
    else if (this.over > 0) { UI.panel(g, W / 2 - 100, 92, 200, 30, 0.95); drawText(g, 'Route done.', W / 2, 98, '#e8c84a', { align: 'center' }); drawText(g, `${this.got} delivered, ${this.hits} bumps  -  $${this.pay}`, W / 2, 108, '#f0ead8', { align: 'center' }); }
    else UI.drawHint(g, 'UP to jump');
  }
}
