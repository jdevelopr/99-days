// ============================================================
// The lake: the 14 bus (Sundays, or once the bench is empty), the ride, Emmett on the dock, fishing
// ============================================================
SPECS.emmett = { skin: '#c8a080', hair: '#b8b0a0', hairStyle: 'thin', shirt: '#6a3a2a', pants: '#2a3a3a', shoes: '#2a2420', coat: '#5a3a2a', hat: 'beanie', hatColor: '#3a4a3a', beard: '#b8b0a0', old: true, stubble: false };
SPECS.lena = { skin: '#d8b090', hair: '#7a5a3a', hairStyle: 'long', shirt: '#4a6a8a', pants: '#3a3a44', shoes: '#2a2420', coat: '#8a7a6a' };
SPECS.pryor = { skin: '#e8c8a8', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#2a2a34', shoes: '#1a1a1e', coat: '#3a3a4a', tie: '#2a5a8a' };
SPECS.pryorDad = { skin: '#e0c0a0', hair: '#d8d8dc', hairStyle: 'bald', shirt: '#6a6a7a', pants: '#4a4a52', shoes: '#2a2420', coat: '#4a4a5a', old: true, hunch: true, short: true };
SPEAKERS.emmett = { name: 'Emmett', color: '#a8c8a0', spec: 'emmett' };
SPEAKERS.lena = { name: 'Lena', color: '#c8b0a0', spec: 'lena' };
SPEAKERS.pryor = { name: 'Mr. Pryor', color: '#8ab0d8', spec: 'pryor' };
SPEAKERS.driver = { name: 'Driver', color: '#c8c8d8', spec: 'worker' };
FOOD.fish = { name: 'lake fish', price: 0, hunger: 60, noShop: true };

// ---------- bus & lake availability ----------
function busDay() { const w = G.chars.walter; return w.dead || G.day % 7 === 0; }

// ---------- THE BUS (a cutaway of the 14, windows full of moving country) ----------
INTERIORS.bus = {
  id: 'bus', outdoor: false, floorY: FEET_Y, x0: 40, x1: 440, ceil: GROUND_Y - 56, ambient: [120, 118, 112],
  lamp: { x: 240, y: GROUND_Y - 50 }, window: null,
  doors: [{ x: 402, w: 24, to: null, label: 'Front door', bus: true }],
  spawnX: 380, spawnDir: -1, spawns: { front: 380 },
  spots: { pryor: 150, ortega: 270 },
  paint(g) {
    const I = this; const ceil = I.ceil;
    px(g, 0, 0, 480, 270, '#0d0d12');
    // bus body
    px(g, I.x0 - 8, ceil - 10, I.x1 - I.x0 + 16, 270 - ceil - 10, '#2a2a30');
    px(g, I.x0 - 6, ceil - 8, I.x1 - I.x0 + 12, 252 - ceil + 8, '#c8c0a8'); px(g, I.x0 - 6, ceil - 8, I.x1 - I.x0 + 12, 2, '#e8e0d0');
    px(g, I.x0, ceil, I.x1 - I.x0, GROUND_Y - ceil, '#6a6a72');                     // interior wall (windows painted dynamically)
    px(g, I.x0, GROUND_Y - 4, I.x1 - I.x0, 4, '#4a4a52');
    px(g, I.x0, GROUND_Y, I.x1 - I.x0, 46, '#3a3a40'); for (let x = I.x0; x < I.x1; x += 8) px(g, x, GROUND_Y + 20, 4, 1, '#4a4a52'); // ribbed floor
    px(g, I.x0 - 6, 252, I.x1 - I.x0 + 12, 6, '#2a2a30'); px(g, I.x0 - 6, 258, I.x1 - I.x0 + 12, 4, '#8a2a2a');
    // wheels
    for (const wx of [90, 370]) { px(g, wx - 12, 254, 24, 14, '#0d0c10'); px(g, wx - 8, 258, 16, 8, '#3a3a42'); }
    // window frames (glass drawn each frame)
    for (let i = 0; i < 5; i++) { const wx = I.x0 + 12 + i * 78; px(g, wx - 2, ceil + 6, 62, 34, '#3a3a44'); }
    // route sign, grab rail, stop cord
    px(g, I.x0, ceil - 6, 60, 6, '#1a1a20'); drawText(g, '14 LAKE', I.x0 + 30, ceil - 5, '#e8c84a', { align: 'center' });
    px(g, I.x0, ceil + 2, I.x1 - I.x0, 1, '#c8c8d0'); px(g, I.x0, ceil + 44, I.x1 - I.x0, 1, '#e8e0a0');
    // driver's cab at the right (front)
    px(g, 370, ceil, 30, GROUND_Y - ceil, '#4a4a52'); px(g, 372, ceil + 8, 26, 22, '#2a3a4a'); px(g, 376, GROUND_Y - 30, 18, 3, '#1a1a20'); px(g, 384, GROUND_Y - 30, 2, 10, '#1a1a20');
    // front door
    px(g, 402, GROUND_Y - 48, 24, 48, '#3a3a44'); px(g, 404, GROUND_Y - 46, 20, 44, '#2a3a4a'); px(g, 413, GROUND_Y - 46, 2, 44, '#3a3a44');
    // ceiling lights
    for (let i = 0; i < 4; i++) px(g, I.x0 + 40 + i * 90, ceil + 1, 30, 2, '#f0f0e0');
  },
  dynamic(g, t) {
    // the country going past the windows: city → houses → woods → water
    const I = this; const ceil = I.ceil; const prog = clamp((G.busT || 0) / (60 * 28), 0, 1); const rev = G.busDir === 'back';
    const p = rev ? 1 - prog : prog; const pal = G.pal || todPalette(G.tod, G.rain);
    const scroll = (G.busT || 0) * 2.2;
    for (let i = 0; i < 5; i++) {
      const wx = I.x0 + 14 + i * 78, wy = ceil + 8, ww = 58, wh = 30;
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
      const grd = g.createLinearGradient(0, wy, 0, wy + wh); grd.addColorStop(0, rgbStr(...pal.top)); grd.addColorStop(1, rgbStr(...pal.bot)); g.fillStyle = grd; g.fillRect(wx, wy, ww, wh);
      // ground band
      g.fillStyle = p < 0.35 ? '#3a3a44' : p < 0.7 ? '#4a5a3a' : '#2a4a5a'; g.fillRect(wx, wy + 22, ww, 8);
      // things going by
      const R = seeded(i * 31 + Math.floor(scroll / 400));
      for (let k = 0; k < 6; k++) {
        const ox = ((k * 90 + R() * 40 - scroll * (rev ? -1 : 1)) % 540 + 540) % 540 - 40 + (wx - I.x0);
        const sx = wx + ((ox % (ww + 60)) + (ww + 60)) % (ww + 60) - 30;
        if (p < 0.35) { const h = 8 + (k * 5) % 12; g.fillStyle = '#4a4a56'; g.fillRect(sx, wy + 22 - h, 14, h); g.fillStyle = '#c8b070'; if (k % 2) g.fillRect(sx + 4, wy + 22 - h + 3, 2, 2); }
        else if (p < 0.7) { g.fillStyle = '#6a5a4a'; g.fillRect(sx, wy + 14, 10, 8); g.fillStyle = '#8a3a3a'; g.fillRect(sx - 1, wy + 12, 12, 3); g.fillStyle = '#2a5a2a'; g.fillRect(sx + 16, wy + 8, 6, 14); }
        else { g.fillStyle = '#1e3a24'; g.fillRect(sx, wy + 6, 4, 16); g.fillRect(sx - 3, wy + 10, 10, 6); g.fillStyle = '#2a4a5a'; if (k % 3 === 0) g.fillRect(sx + 10, wy + 24, 20, 6); }
      }
      // reflection of the interior light, rain
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(wx, wy, Math.floor(ww * 0.35), wh);
      if (G.rain > 0.1) { g.strokeStyle = 'rgba(190,205,230,0.35)'; g.beginPath(); for (let d = 0; d < 6 * G.rain; d++) { const rx = wx + ((d * 37 + t * 3) % ww), ry = wy + ((d * 19 + t * 5) % wh); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 5); } g.stroke(); }
      g.restore();
    }
  },
  fg(g) {
    // seats (backs face the front/right); passengers sit between them
    for (const sx of [70, 120, 170, 240, 290, 340]) { px(g, sx, GROUND_Y - 10, 22, 4, '#3a5a5a'); px(g, sx + 20, GROUND_Y - 30, 5, 24, '#3a5a5a'); px(g, sx + 20, GROUND_Y - 30, 5, 1, '#5a7a7a'); px(g, sx + 2, GROUND_Y - 6, 2, 8, '#2a2a30'); px(g, sx + 18, GROUND_Y - 6, 2, 8, '#2a2a30'); }
  }
};

// ---------- THE LAKE (outdoor) ----------
const LAKE = { w: 960, spots: { stop: 60, shore: 200, pier: 380, pierEnd: 700, cabin: 860, emmett: 640 }, doors: [], spawn: 90, render: (g, t) => renderLake(g, t) };
OUTDOORS.lake = LAKE;
const LakeWorld = { static: null };
function buildLakeStatic() {
  const [c, g] = mkCanvas(LAKE.w, H);
  // shore path (dirt) from 0..330, then the pier over water to 760, then shore again toward the cabin
  px(g, 0, GROUND_Y, 330, CURB_Y - GROUND_Y + 30, '#5a4a36'); px(g, 0, GROUND_Y, 330, 1, '#7a6a52');
  px(g, 740, GROUND_Y, 220, CURB_Y - GROUND_Y + 30, '#5a4a36'); px(g, 740, GROUND_Y, 220, 1, '#7a6a52');
  const R = seeded(44); for (let i = 0; i < 160; i++) { const x = R() < 0.6 ? R() * 330 : 740 + R() * 220; px(g, x, GROUND_Y + 2 + R() * 40, 2, 1, R() < 0.5 ? '#4a3a2a' : '#6a5a42'); }
  // reeds and grass at the water's edge
  for (let x = 300; x < 340; x += 3) px(g, x, GROUND_Y - 10 - (x % 7), 1, 14 + (x % 7), '#4a6a3a'); for (let x = 736; x < 770; x += 3) px(g, x, GROUND_Y - 8 - (x % 5), 1, 12 + (x % 5), '#4a6a3a');
  // the pier: planks on posts, 330..760
  for (let x = 330; x < 760; x += 6) { px(g, x, GROUND_Y + 8, 5, 6, (x / 6) % 2 ? '#6a5a42' : '#7a6a4a'); px(g, x, GROUND_Y + 8, 5, 1, '#8a7a5a'); }
  px(g, 330, GROUND_Y + 14, 430, 2, '#3a3020');
  for (let x = 340; x < 760; x += 60) { px(g, x, GROUND_Y + 16, 4, 30, '#3a3020'); px(g, x, GROUND_Y + 16, 1, 30, '#5a4a30'); }
  px(g, 330, GROUND_Y + 2, 430, 2, '#4a3a28'); for (let x = 336; x < 760; x += 40) px(g, x, GROUND_Y - 14, 2, 18, '#4a3a28'); // rail posts
  px(g, 330, GROUND_Y - 14, 430, 2, '#5a4a30');
  // Emmett's boat tied at the end
  px(g, 700, GROUND_Y + 22, 44, 8, '#3a4a4a'); px(g, 698, GROUND_Y + 20, 48, 3, '#5a6a6a'); px(g, 720, GROUND_Y + 10, 2, 12, '#2a2a30');
  // bus stop sign at the left, bait bucket, a bench
  g.drawImage(SPR.busSign, 50, FEET_Y - 50); g.drawImage(SPR.bench, 90, FEET_Y - 19);
  px(g, 350, GROUND_Y - 2, 8, 8, '#8a8a92'); px(g, 351, GROUND_Y - 3, 6, 1, '#a8a8b0');
  // trees along the back (painted big; the sky shows between them)
  const trees = [20, 70, 130, 190, 250, 780, 820, 930];
  for (const tx of trees) { const h = 90 + (tx * 7) % 50; px(g, tx + 6, GROUND_Y - h, 6, h, '#2a2018'); for (let k = 0; k < 5; k++) { const w = 34 - k * 5, y = GROUND_Y - h + 6 + k * 14; px(g, tx + 9 - w / 2, y, w, 14, k % 2 ? '#1e3a24' : '#24462a'); } }
  // the A-frame cabin in the woods, right side, set back
  const cx = 820, base = GROUND_Y - 4;
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.moveTo(cx, base); g.lineTo(cx + 45, base - 78); g.lineTo(cx + 90, base); g.closePath(); g.fill();
  g.fillStyle = '#6a5a42'; g.beginPath(); g.moveTo(cx + 45, base - 78); g.lineTo(cx + 90, base); g.lineTo(cx + 84, base); g.lineTo(cx + 45, base - 70); g.closePath(); g.fill();
  for (let y = base - 70; y < base; y += 6) { const w = (y - (base - 78)) * 45 / 78; px(g, cx + 45 - w, y, 2 * w, 1, 'rgba(0,0,0,0.15)'); }
  px(g, cx + 36, base - 40, 18, 22, '#e8d8a0'); px(g, cx + 44, base - 40, 2, 22, '#4a3a2a'); px(g, cx + 36, base - 30, 18, 1, '#4a3a2a');   // window (lit at night)
  px(g, cx + 38, base - 22, 14, 22, '#3a2a1c'); px(g, cx + 49, base - 12, 2, 2, '#c8a850');                                              // door
  px(g, cx + 20, base - 2, 50, 4, '#5a4a36'); px(g, cx + 18, base - 4, 54, 2, '#6a5a42');                                                 // porch
  px(g, cx + 58, base - 100, 6, 30, '#3a3a40');                                                                                           // stovepipe
  px(g, cx + 6, base - 8, 10, 8, '#6a5a42'); px(g, cx + 4, base - 12, 14, 4, '#7a6a4a');                                                   // woodpile
  LakeWorld.static = c;
}
function renderLake(g, t) {
  if (!LakeWorld.static) buildLakeStatic();
  const camX = G.camX; const pal = todPalette(G.tod, G.rain * 0.6); G.pal = pal;
  // sky + far hills
  const grd = g.createLinearGradient(0, 0, 0, GROUND_Y); grd.addColorStop(0, rgbStr(...pal.top)); grd.addColorStop(1, rgbStr(...pal.bot)); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const hill = mixRgb(pal.bot, pal.top, 0.55); g.fillStyle = rgbStr(...hill);
  for (let x = -20; x < W + 40; x += 10) { const wx = x + camX * 0.2; const h = 40 + Math.sin(wx * 0.011) * 18 + Math.sin(wx * 0.037) * 8; g.fillRect(x, GROUND_Y - 60 - h, 11, 60 + h); }
  const hill2 = mixRgb(pal.bot, pal.top, 0.35); g.fillStyle = rgbStr(...hill2);
  for (let x = -20; x < W + 40; x += 8) { const wx = x + camX * 0.4; const h = 20 + Math.sin(wx * 0.019 + 2) * 14 + Math.sin(wx * 0.05) * 5; g.fillRect(x, GROUND_Y - 30 - h, 9, 30 + h); }
  // the lake: water from the shoreline down, with the far shore
  const wg = g.createLinearGradient(0, GROUND_Y - 18, 0, H); wg.addColorStop(0, rgbStr(...mixRgb(pal.bot, [20, 40, 60], 0.5))); wg.addColorStop(1, rgbStr(...mixRgb(pal.top, [6, 14, 24], 0.7)));
  g.fillStyle = wg; g.fillRect(0, GROUND_Y - 18, W, H - GROUND_Y + 18);
  g.fillStyle = 'rgba(200,220,240,0.10)'; for (let i = 0; i < 60; i++) { const y = GROUND_Y - 14 + (i * 41) % (H - GROUND_Y + 10); const x = ((i * 67 + t * (0.2 + (i % 3) * 0.15) - camX * 0.6) % (W + 60) + W + 60) % (W + 60) - 30; g.fillRect(x, y, 5 + (i % 4) * 3, 1); }
  // sun path on the water
  if (pal.sun > 0.2 && pal.night < 0.5) { const sx = W - 60 - G.tod * 300; const rg = g.createLinearGradient(0, GROUND_Y - 18, 0, H); rg.addColorStop(0, `rgba(255,230,180,${0.18 * pal.sun})`); rg.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = rg; g.fillRect(sx - 30, GROUND_Y - 18, 60, H); }
  g.drawImage(LakeWorld.static, -camX, 0);
  // cabin window at night
  if (pal.night > 0.05) { g.fillStyle = `rgba(255,200,120,${0.8 * pal.night})`; g.fillRect(856 - camX, GROUND_Y - 44, 18, 22); }
  // entities (shadows from the sun, reflections in the water under the pier)
  const ents = G.entities.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const shadow = sunShadow(G.tod); shadow.alpha *= (1 - pal.night) * (1 - G.rain * 0.5) * pal.sun;
  for (const e of ents) { if (e.hidden || e.noShadow) continue; const fr = entFrame(e); drawShadow(g, e, fr, Math.round(e.x - camX), e.y, shadow, []); }
  g.save(); g.beginPath(); g.rect(0, GROUND_Y + 16, W, H - GROUND_Y - 16); g.clip(); g.globalAlpha = 0.25;
  for (const e of ents) { if (e.hidden) continue; const fr = entFrame(e); const ex = Math.round(e.x - camX); g.setTransform(1, 0, 0, -1, ex, e.y * 2 + 8); g.drawImage(fr.img, -fr.cx, e.y - fr.h); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.restore();
  for (const e of ents) { if (e.hidden) continue; const fr = entFrame(e); const sx = Math.round(e.x - camX); g.drawImage(fr.img, sx - fr.cx, e.y - fr.h + (e.sprite ? 0 : 2)); if (e.bubble) drawBubble(g, e, sx, t); }
  // the fishing line, if a rod is out
  if (Fishing.active) Fishing.drawWorld(g, camX, t);
  drawRain(g, t, camX);
  // lighting: brighter ambient than the street, warm cabin glow at night
  lg.globalCompositeOperation = 'source-over'; lg.fillStyle = rgbStr(...mixRgb(pal.amb, [255, 255, 255], 0.1)); lg.fillRect(0, 0, W, H);
  if (pal.night > 0.05) { lg.globalCompositeOperation = 'lighter'; const rg = lg.createRadialGradient(865 - camX, GROUND_Y - 33, 4, 865 - camX, GROUND_Y - 33, 120); rg.addColorStop(0, `rgba(255,200,130,${0.7 * pal.night})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(0, 0, W, H); lg.globalCompositeOperation = 'source-over'; }
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0); g.globalCompositeOperation = 'source-over';
  // light through the trees
  const strength = pal.sun * (1 - pal.night) * (1 - G.rain * 0.8) * 0.8;
  if (strength > 0.02) { g.globalCompositeOperation = 'lighter'; const off = -shadow.skew * 0.5 * (GROUND_Y + 30); for (let i = 0; i < 9; i++) { const bx = ((i * 137 - camX * 0.5) % (W + 200) + W + 200) % (W + 200) - 100; const a = (0.06 + 0.04 * Math.sin(t * 0.011 + i)) * strength; const lg2 = g.createLinearGradient(0, -12, 0, GROUND_Y + 30); lg2.addColorStop(0, `rgba(255,240,200,${a})`); lg2.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = lg2; g.beginPath(); g.moveTo(bx, -12); g.lineTo(bx + 18, -12); g.lineTo(bx + 18 + off, GROUND_Y + 30); g.lineTo(bx + off, GROUND_Y + 30); g.closePath(); g.fill(); } g.globalCompositeOperation = 'source-over'; }
  drawVignette(g);
}

// ---------- FISHING ----------
const Fishing = {
  active: false, state: 'idle', t: 0, bite: 0, casts: 0, caught: [], x: 0,
  start() { this.active = true; this.state = 'idle'; this.t = 0; this.casts = 0; this.caught = []; this.x = G.px; G.state = 'fishing'; UI.toast('E to cast. E again when the bobber dips.', '#c8ccd8'); },
  update() {
    this.t++;
    const e = G.chars.emmett || {}; const skill = 1 + (e.tips || 0) * 0.35;
    if (this.state === 'idle') { if (Input.hit('act')) { this.state = 'wait'; this.t = 0; this.bite = 90 + Math.random() * 240; this.casts++; Audio.tone(400, 0.12, 'sine', 0.03, 0.5); } if (Input.hit('back') || Input.hit('menu')) this.finish(); }
    else if (this.state === 'wait') { if (this.t > this.bite) { this.state = 'bite'; this.t = 0; Audio.tone(700, 0.08, 'square', 0.04); } if (Input.hit('act')) { this.state = 'idle'; this.t = 0; } }
    else if (this.state === 'bite') {
      const window = 22 * skill;
      if (Input.hit('act')) { if (this.t <= window) { const size = Math.random() < 0.25 * skill ? 'big' : 'small'; this.caught.push(size); G.inv.fish = (G.inv.fish || 0) + (size === 'big' ? 2 : 1); Audio.good(); UI.toast(size === 'big' ? 'A big one. Two meals.' : 'A perch. One meal.', '#8ae88a'); } else { Audio.bad(); UI.toast('Too slow. It took the bait.', '#e86a6a'); } this.state = 'idle'; this.t = 0; }
      else if (this.t > window + 30) { this.state = 'idle'; this.t = 0; UI.toast('It got away.', '#8a92a4'); }
    }
    if (this.casts >= 6 && this.state === 'idle') this.finish();
  },
  finish() { this.active = false; G.state = 'play'; useEnergy(25); addHunger(-8); G.flags.fishSessions = (G.flags.fishSessions || 0) + 1; remember('fished'); const n = this.caught.length; Dlg.run([narr(n === 0 ? 'Six casts, nothing. The lake keeps its own counsel.' : n === 1 ? 'One fish, cleaned on the pier with a borrowed knife. It is enough to make the day feel like it happened.' : `${n} fish. Emmett nods at the bucket, which from Emmett is a parade.`)]); },
  drawWorld(g, camX, t) {
    const px0 = this.x - camX + 14, py = FEET_Y - 26; const bx = px0 + 40, by = GROUND_Y + 24 + Math.sin(t * 0.08) * 1;
    g.strokeStyle = 'rgba(230,230,240,0.6)'; g.beginPath(); g.moveTo(px0, py); g.lineTo(px0 + 22, py - 10); g.stroke(); // rod
    if (this.state !== 'idle') { g.beginPath(); g.moveTo(px0 + 22, py - 10); g.quadraticCurveTo(bx, py, bx, by); g.stroke(); const dip = this.state === 'bite' ? 3 : 0; px(g, bx - 2, by - 2 + dip, 4, 2, '#d84a3a'); px(g, bx - 2, by + dip, 4, 2, '#f0f0f0'); if (this.state === 'bite') { g.strokeStyle = 'rgba(200,220,240,0.6)'; g.beginPath(); g.ellipse(bx, by + 2, 6 + (t % 10), 2 + (t % 10) * 0.3, 0, 0, Math.PI * 2); g.stroke(); } }
  },
  drawHud(g, t) { UI.drawHint(g, this.state === 'idle' ? `${UI.keyName('act')} cast   ${UI.keyName('back')} stop   (${6 - this.casts} casts left)` : this.state === 'wait' ? 'watch the bobber...' : 'NOW'); }
};

// ---------- EMMETT ----------
const Emmett = {
  init() { return { stage: 0, trust: 0, met: false, visits: 0, tips: 0, told: false, pushed: 0, gone: false, letter: false, mailed: false, wrote: false, lenaCame: false, porch: false, spec: 'emmett', lastVisit: 0 }; },
  E() { if (!G.chars.emmett) G.chars.emmett = this.init(); return G.chars.emmett; },
  present() { const e = this.E(); return !e.gone && G.tod < 0.9; },
  menu() {
    const e = this.E();
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }];
    if (e.met && !e.gone) items.push({ t: 'Fish with him', r: '-25 energy', disabled: () => G.energy < 25, do: () => { if (e.tips < 3 && Math.random() < 0.6) { e.tips++; UI.toast('A tip about the drop-off. You will hook more.', '#8ae88a'); } Fishing.start(); } });
    if (e.letter && !e.mailed && !G.inv.letter) items.push({ t: 'Take the letter to mail', do: () => { G.inv.letter = 1; Dlg.run([say('emmett', "Blue mailbox by the diner. Don't read it. You'll read it. Don't tell me.")]); } });
    if (e.stage >= 2 && !e.gone && G.tod > 0.6) items.push({ t: 'Sleep on the porch', r: 'rough', do: () => { e.porch = true; remember('emmett_porch'); Dlg.run([say('emmett', "Blanket's on the chair. I'll be up at four; don't take it personal."), narr('The lake makes no sound at all. You had forgotten a place could do that.'), { fn: () => sleep(true) }]); } });
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(e.met ? 'Emmett' : 'The man on the pier', items);
  },
  talk() {
    const e = this.E(); if (!talkEnergy()) return; e.visits++; const L = [];
    if (!e.met) { e.met = true; clearPortrait('emmett'); L.push(narr('A man at the end of the pier with a rod and a thermos and the kind of stillness that takes years.'), say('emmett', "Bus only brings two kinds out here. People running from something, people running out of something. Which are you?"), choice({ t: "Out of.", do: () => { e.told = true; e.trust += 2; return [say('emmett', "Thought so. You've got the look. I had the look. Sit; the perch don't care what you've got.")]; } }, { t: "From.", do: () => [say('emmett', "Everybody says from. It's easier. Sit anyway.")] }, { t: "Just the day.", do: () => [say('emmett', "Just the day. That's the only answer that's ever true. Sit.")] }), say('emmett', "Emmett. Cabin's mine, more or less. The lake's nobody's. You want to learn to cast, or you want to watch?"), narr('He shows you once. Wrist, not arm. The line goes out like it was always going to.'), { fn: () => { e.stage = 1; } }); }
    else if (e.stage === 1) {
      if (e.visits >= 2 && !e.story1) { e.story1 = true; L.push(say('emmett', "Doctor gave me eight months. Two thousand and six. I sold the house, the truck, the business, drove out here with a tent and a plan to die looking at water."), say('emmett', "Eight months went by. I felt fine. A year. I went back and the doctor said the scans were wrong, or the drug was right, or God has a sense of humor; he wasn't sure which."), say('emmett', "I'd already sold everything. I'd already said the goodbyes. You can't un-say a goodbye. So I stayed."), choice({ t: "Twenty years.", do: () => [say('emmett', "Nineteen and change. Fish don't count, so I stopped.")] }, { t: "Do you regret it?", do: () => [say('emmett', "The staying? No. The goodbyes? Ask me next time. That's a next-time question.")] }), { fn: () => { e.trust += 1; if (e.told) e.stage = 2; } }); }
      else L.push(say('emmett', fresh('emmett', ["Wind's off the point. Cast left of the boat.", "Coffee in the thermos. It's terrible. It's hot.", "You cough like a city. Breathe this instead for a while."])));
      if (e.visits >= 3 && e.told) e.stage = 2;
    }
    else if (e.stage === 2) {
      if (!e.story2) { e.story2 = true; L.push(say('emmett', "You asked about regret. Lena. My daughter. She was twenty-two when I got the eight months."), say('emmett', "I didn't want her to watch it. So I did the goodbye, the whole thing, told her not to come, told her to remember me fishing. And then the eight months didn't come."), say('emmett', "By then I'd taught her not to expect me. That's a lesson that takes. She's forty-one. I know that from a Christmas card that came to the marina with no return address."),
        choice({ t: "Write to her.", do: () => { e.trust += 2; return [say('emmett', "Write what? 'Sorry I lived'?"), you("Start there."), say('emmett', "..."), say('emmett', "I've got paper. I've had paper for nineteen years.")]; } },
          { t: "That's yours to carry.", do: () => [say('emmett', "It is. It's heavier some days. Today it's about the weight of this thermos.")] },
          { t: "You owe her a call.", do: () => { e.pushed++; return [say('emmett', "I know what I owe. I've got the ledger. You don't get to read it."), narr('He reels in and does not cast again while you are there.')]; } })); }
      else if (!e.letter && e.pushed < 2 && e.trust >= 3) { e.letter = true; remember('emmett_letter'); L.push(say('emmett', "Wrote it. Took four nights and most of a bottle. It's one page. Most of it's about fish; the last line isn't."), say('emmett', "I can't mail it from here. If I hold it a week I'll burn it. Take it to the city. Blue box. Don't read it."), { fn: () => { } }); }
      else if (e.mailed && !e.wrote && G.day - (e.mailedDay || 0) >= 10) { e.wrote = true; e.stage = 3; remember('emmett_reply'); L.push(say('emmett', "She wrote back."), narr('He does not take it out. He touches the pocket it is in, once, the way Walter touches a watch.'), say('emmett', "She's coming Sunday after next. She says she doesn't know what she'll say. I said that makes two of us, and I've had nineteen years."), { fn: () => { e.lenaDay = G.day + 7 + (7 - (G.day + 7) % 7) % 7; } }); }
      else if (e.pushed >= 2 && !e.gone) { e.gone = true; remember('emmett_gone'); L.push(say('emmett', "I'm going to fish off the boat for a while. Out past the point. The pier's yours."), narr('The next bus you take, the pier is empty and the boat is a speck against the far shore.')); }
      else L.push(say('emmett', fresh('emmett', ["Perch are up. Something about the pressure.", "Nineteen years and I still can't tie a decent knot. Lena could. Eight years old, perfect clinch knot.", "You're thinner than last bus. Take the big one home. Fry it in butter, not oil; oil's for people with time.", "The cabin's not mine, you know. County's. Nobody's come to say so in nineteen years. That's a kind of owning."])));
    }
    else if (e.stage >= 3) {
      if (e.lenaCame) L.push(say('emmett', fresh('emmett', ["She's coming back in June. She said June like it was nothing. It's not nothing.", "She tied a clinch knot. First try. Forty-one years old and she still had it in her hands.", "I told her about you. She said to say thank you. So: thank you. From her. From me it's the same thing, I just can't say it as well."])));
      else L.push(say('emmett', fresh('emmett', ["Sunday after next. I've cleaned the cabin twice. It doesn't get cleaner.", "What do you say to a daughter after nineteen years? I've been practicing on the perch. They're not helpful."])));
    }
    Dlg.run(L);
  },
  lenaScene() {
    const e = this.E(); e.lenaCame = true; remember('emmett_lena');
    Dlg.run([narr('A woman in a good coat at the end of the pier, holding a rod like she is remembering how. Emmett is beside her, not fishing, not talking, standing exactly as close as he dares.'), say('lena', "You're the one who mailed it."), you("I just carried it."), say('lena', "That's the whole job, carrying it. He couldn't. I couldn't have either."), say('lena', "He wrote a page about fish and then one line. 'I'm sorry I taught you not to expect me. I'd like to unteach it, if there's time.' I read it forty times. Then I got in the car."), narr('She casts. The line goes out like it was always going to. Emmett makes a sound that is not a word.'), { fn: () => { e.trust += 3; } }]);
  },
  endingLine() {
    const e = G.chars.emmett; if (!e || !e.met) return G.flags.lakeTrips ? { name: 'The lake', line: `${G.flags.lakeTrips} bus ride${G.flags.lakeTrips > 1 ? 's' : ''} out to the water. The man on the pier never got a name.`, bad: true } : null;
    if (e.gone) return { name: 'Emmett', line: 'He fished from the boat, out past the point, after you told him what he owed. The pier stayed empty.', bad: true };
    if (e.lenaCame) return { name: 'Emmett & Lena', line: 'Nineteen years and one page, mostly about fish. She cast from his pier and tied a clinch knot on the first try. She is coming back in June.' };
    if (e.mailed) return { name: 'Emmett', line: 'You carried his letter to the blue box by the diner. The answer came after you stopped taking the bus.' };
    if (e.stage >= 2) return { name: 'Emmett', line: 'Eight months, in 2006. Nineteen years on a pier. He told you what the years after the number were like, and what they cost.' };
    return { name: 'Emmett', line: 'The man on the pier. He taught you to cast. Wrist, not arm.' };
  }
};

// ---------- the bus passengers ----------
const Passengers = {
  pryor() {
    const f = G.flags; f.pryorTalks = (f.pryorTalks || 0) + 1; if (!talkEnergy(3)) return;
    const n = f.pryorTalks; const L = [];
    if (n === 1) L.push(narr('A man in a good coat with a laptop open on his knees and a spreadsheet he is not reading.'), say('pryor', "Sorry. Sorry, do you need... no. Fine. Pryor. I do this every Sunday. The lake. There's a home out there."), say('pryor', "My father. He doesn't know what day it is, so it doesn't matter that it's Sunday, so I could come any day, so I come Sunday. Explain that."), you("You don't have to explain it."), say('pryor', "Everybody says that. Then they look at me like I should."));
    else if (n === 2) L.push(say('pryor', "You again. The pier guy, right? Emmett? My father used to fish. Before. He asks about the boat sometimes. There is no boat. There was never a boat."), say('pryor', "I sit with him for forty minutes and I look at my phone for thirty of them. I'm telling a stranger on a bus. That's where I am."), choice({ t: "Bring him to the pier.", do: () => { f.pryorIdea = true; return [say('pryor', "He can't... he's in a chair. The home has a van. The home has a van!"), narr('He closes the laptop.')]; } }, { t: "Forty minutes is forty minutes.", do: () => [say('pryor', "That's either very kind or very sad. I'm going to take it as kind.")] }));
    else if (n === 3 && f.pryorIdea && !f.pryorDock) { f.pryorDock = true; remember('pryor'); L.push(say('pryor', "We did it. The van, the chair, the pier. He held a rod for an hour and didn't catch anything and I didn't look at my phone once."), say('pryor', "He said 'Sunday.' Out of nowhere. First word in a month. 'Sunday.' Like he knew."), narr('The spreadsheet is closed. The laptop is in the bag. He watches the trees go by like they are the point.')); }
    else L.push(say('pryor', fresh('pryor', ["Sunday. Same bus. I've started to like the bus, which is a sentence I never expected to say.", "He asked about the boat again. I said it's tied at the pier. It is, technically. It's Emmett's. Close enough.", "Forty minutes and no phone. That's the whole plan now. Some plans are small."])));
    Dlg.run(L);
  },
  ortega() {
    const f = G.flags; f.ortegaBus = (f.ortegaBus || 0) + 1; if (!talkEnergy(3)) return;
    const n = f.ortegaBus; const L = [];
    if (n === 1) L.push(say('granny', "412! On the 14! Sit, sit. Mind the cooler. Sixty tamales. The marina, Sundays; the boat people pay four dollars and don't argue."), say('granny', "Hector's headstone. St. Bartholomew's wants nine hundred for the good granite. I'm at six-forty. Sixty tamales a week; you do the arithmetic, I'm too old."));
    else if (n === 2) L.push(say('granny', "Carry the cooler off for me at the marina and there's two in it for you. Don't argue. I said don't argue."), { fn: () => { addHunger(25); useEnergy(3); f.ortegaCooler = (f.ortegaCooler || 0) + 1; } }, narr('The cooler weighs like a small child. You carry it anyway.'));
    else if (n === 3 && !f.ortegaStone) { f.ortegaStone = true; remember('ortega_stone'); L.push(say('granny', "Nine hundred. I've got it. Forty-one Sundays."), say('granny', "Good granite. Grey, not black; black shows the rain. His name, the dates, and under it 'HE FIXED THINGS.' Because he did. Every radiator on the fourth floor.") , narr('She pats the cooler like it did the work. It did some of it.')); }
    else L.push(say('granny', fresh('granny', ["The stone goes in next month. You'll come. That's not a question.", "Amos carried the cooler last Sunday. Twenty-two years on roofs and he complained about a cooler!", "Eat. Two in the top. I counted; I always count."])), { fn: () => addHunger(20) });
    Dlg.run(L);
  }
};

// ---------- the ride ----------
const Bus = {
  ride(dir) {
    // dir: 'out' (city → lake) or 'back'
    UI.fadeOut(() => {
      G.busDir = dir; G.busT = 0; G.busArrived = false; G.scene = 'bus'; G.px = 380; G.facing = -1; G.camX = 0; G.walking = false; useEnergy(6);
      UI.fadeIn(); Audio.tone(90, 0.6, 'sawtooth', 0.03, 1.2);
      Dlg.run([narr(dir === 'out' ? 'The 14 pulls away from Harlan Street with a sound like something giving up. Nobody looks out of the windows at the city; everyone looks out at what comes after it.' : 'The 14, back toward the city. The trees thin, then the houses thicken, then the brick starts. The driver knows where you are going without asking.')]);
    }, 0.06);
  },
  update() {
    if (G.scene !== 'bus') return;
    G.busT = (G.busT || 0) + 1;
    if (G.busT > 60 * 28 && !G.busArrived) { G.busArrived = true; UI.toast(G.busDir === 'out' ? 'Lake Road. Front door.' : 'Harlan St. Front door.', '#e8c84a'); Audio.tone(520, 0.2, 'sine', 0.04); }
    if (G.busT % 40 === 0) Audio.tone(70 + Math.random() * 10, 0.3, 'sawtooth', 0.012);
  },
  door() {
    if (!G.busArrived) { UI.toast(G.busDir === 'out' ? 'Still on the highway. Sit.' : 'Not yet.', '#8a92a4'); return; }
    if (G.busDir === 'out') { UI.fadeOut(() => { G.scene = 'lake'; G.px = LAKE.spots.stop + 30; G.facing = 1; G.camX = 0; G.flags.lakeTrips = (G.flags.lakeTrips || 0) + 1; G.dogX = G.px - 20; UI.fadeIn(); if (G.flags.lakeTrips === 1) Dlg.run([narr('Lake Road. A gravel turnout, a bench, a bus sign, and then water all the way to the far hills. It smells like nothing you have smelled in months: pine, cold, mud.'), narr('A pier runs out from the shore. Past the trees, an A-frame with smoke coming from a stovepipe.')]); Emmett.checkLena(); }, 0.06); }
    else { UI.fadeOut(() => { goSceneNow('street', 'walter'); G.px = STREET.spots.walter + 30; G.camX = clamp(G.px - W / 2, 0, STREET.w - W); UI.fadeIn(); }, 0.06); }
  },
  back() {
    Menu.open('The 14 back to the city', [{ t: 'Ride back', r: 'return ticket', do: () => { if (G.inv.fish) UI.toast(`${G.inv.fish} fish in the bucket.`, '#8ae88a'); this.ride('back'); } }, { t: 'Stay a while', do: () => { } }], { sub: G.tod > 0.75 ? 'Last bus. The driver is already looking at his watch.' : 'It idles at the turnout for as long as it takes.' });
  },
  offer() {
    Menu.open('The 14 to the lake', [{ t: 'Buy a ticket and ride', r: '$10', disabled: () => G.money < 10 || G.energy < 30, do: () => { spend(10); remember('bus'); this.ride('out'); } }, { t: 'Not today', do: () => { } }], { sub: G.chars.walter.dead ? 'The 14 runs again. Nobody told the bench.' : 'The bench is empty. Sundays, Walter takes the long way to Ruth.' });
  }
};
Emmett.checkLena = function () { const e = this.E(); if (e.stage >= 3 && !e.lenaCame && e.lenaDay && G.day >= e.lenaDay) setTimeout(() => this.lenaScene(), 1500); };
