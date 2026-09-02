// ============================================================
// render: sky, parallax, shadows, puddles, rain, lighting, rays
// ============================================================
const [lightCanvas, lg] = mkCanvas(W, H);
const [tmpCanvas, tg] = mkCanvas(W, H);

// time-of-day palette
const TOD_KEYS = [
  { t: 0.0, top: [66, 74, 108], bot: [154, 140, 140], amb: [212, 202, 210], sun: 1.0 },
  { t: 0.25, top: [98, 114, 144], bot: [166, 172, 184], amb: [240, 240, 244], sun: 1.0 },
  { t: 0.55, top: [84, 100, 126], bot: [148, 156, 170], amb: [226, 226, 236], sun: 0.8 },
  { t: 0.78, top: [52, 42, 78], bot: [168, 106, 88], amb: [200, 160, 160], sun: 0.6 },
  { t: 0.9, top: [18, 20, 40], bot: [46, 42, 70], amb: [95, 92, 130], sun: 0.1 },
  { t: 1.0, top: [8, 10, 24], bot: [24, 28, 50], amb: [52, 58, 100], sun: 0.0 },
];
function todPalette(tod, rain) {
  let a = TOD_KEYS[0], b = TOD_KEYS[1];
  for (let i = 0; i < TOD_KEYS.length - 1; i++) if (tod >= TOD_KEYS[i].t && tod <= TOD_KEYS[i + 1].t) { a = TOD_KEYS[i]; b = TOD_KEYS[i + 1]; }
  const t = smooth(clamp((tod - a.t) / (b.t - a.t), 0, 1));
  let top = mixRgb(a.top, b.top, t), bot = mixRgb(a.bot, b.bot, t), amb = mixRgb(a.amb, b.amb, t);
  const sun = lerp(a.sun, b.sun, t);
  // rain desaturates + darkens
  const grey = v => { const m = (v[0] + v[1] + v[2]) / 3; return [lerp(v[0], m, 0.5) * 0.85, lerp(v[1], m, 0.5) * 0.85, lerp(v[2], m, 0.4) * 0.9]; };
  const r = rain * 0.8;
  top = mixRgb(top, grey(top), r); bot = mixRgb(bot, grey(bot), r); amb = mixRgb(amb, grey(amb), r * 0.6);
  const night = clamp((tod - 0.72) / 0.22, 0, 1);
  return { top, bot, amb, sun: sun * (1 - rain * 0.7), night };
}
function sunShadow(tod) {
  // returns {skew, scaleY, alpha}
  const d = clamp(tod / 0.82, 0, 1);
  const skew = Math.cos(d * Math.PI) * 1.9;           // +1.9 at dawn (sun right) → -1.9 at dusk
  const el = Math.sin(d * Math.PI);                   // elevation 0..1
  return { skew, scaleY: lerp(0.5, 0.2, el), alpha: lerp(0.25, 0.42, el) };
}

// ---------- far skyline (parallax) ----------
const skylineLayers = [];
function buildSkyline() {
  const specs = [{ w: 960, seed: 5, minH: 40, maxH: 120, col: null }, { w: 960, seed: 9, minH: 20, maxH: 80, col: null }];
  for (const s of specs) {
    const [c, g] = mkCanvas(s.w, 200); const R = seeded(s.seed); let x = 0;
    while (x < s.w) {
      const w = 20 + Math.floor(R() * 50), h = s.minH + Math.floor(R() * (s.maxH - s.minH));
      px(g, x, 200 - h, w, h, '#fff');
      if (R() < 0.3) px(g, x + Math.floor(w / 2) - 1, 200 - h - 10, 2, 10, '#fff');
      if (R() < 0.4) px(g, x + 4, 200 - h - 4, w - 8, 4, '#fff');
      // windows as holes
      for (let wy = 200 - h + 6; wy < 196; wy += 8) for (let wx = x + 4; wx < x + w - 4; wx += 6) if (R() < 0.35) g.clearRect(wx, wy, 2, 3);
      x += w + Math.floor(R() * 12);
    }
    skylineLayers.push(c);
  }
}
buildSkyline();
function tintedLayer(src, color) {
  tg.clearRect(0, 0, W, H);
  return null;
}

// ---------- sky ----------
function drawSky(g, pal, camX, t) {
  const grd = g.createLinearGradient(0, 0, 0, GROUND_Y);
  grd.addColorStop(0, rgbStr(...pal.top)); grd.addColorStop(1, rgbStr(...pal.bot));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // clouds (slow drifting bands)
  g.globalAlpha = 0.12 + G.rain * 0.15;
  for (let i = 0; i < 6; i++) {
    const cy = 10 + i * 18, cx = ((t * (0.08 + i * 0.03) - camX * 0.05 + i * 170) % (W + 240)) - 120;
    g.fillStyle = rgbStr(...mixRgb(pal.bot, [255, 255, 255], 0.15));
    g.fillRect(cx, cy, 120 + i * 20, 8); g.fillRect(cx + 20, cy - 4, 60 + i * 10, 4); g.fillRect(cx - 10, cy + 8, 90, 3);
  }
  g.globalAlpha = 1;
  // sun / moon
  const night = pal.night;
  if (night < 0.5) {
    const sx = W - 60 - G.tod * 300 + camX * -0.02, sy = 90 - Math.sin(clamp(G.tod / 0.82, 0, 1) * Math.PI) * 70;
    const rg = g.createRadialGradient(sx, sy, 2, sx, sy, 60);
    rg.addColorStop(0, `rgba(255,236,200,${0.55 * pal.sun})`); rg.addColorStop(0.2, `rgba(255,220,170,${0.22 * pal.sun})`); rg.addColorStop(1, 'rgba(255,220,170,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, GROUND_Y);
  } else {
    const mx = 80 + camX * -0.02, my = 40;
    g.fillStyle = `rgba(220,226,240,${0.8 * (night - 0.4)})`; g.beginPath(); g.arc(mx, my, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = rgbStr(...pal.top); g.beginPath(); g.arc(mx - 3, my - 2, 6, 0, Math.PI * 2); g.fill();
    // stars
    if (G.rain < 0.4) { g.fillStyle = `rgba(255,255,255,${0.5 * (night - 0.4)})`; const R = seeded(7); for (let i = 0; i < 40; i++) { const x = R() * W * 3 - camX * 0.02, y = R() * 90; g.fillRect(((x % W) + W) % W, y, 1, 1); } }
  }
  // skyline layers
  const fog = 0.45 + G.rain * 0.3;
  const layerCols = [mixRgb(pal.bot, pal.top, 0.5), mixRgb(pal.bot, pal.top, 0.75)];
  [0.15, 0.32].forEach((par, i) => {
    const c = skylineLayers[i]; const off = ((camX * par) % c.width);
    tg.clearRect(0, 0, W, H);
    for (let x = -off; x < W; x += c.width) tg.drawImage(c, x, GROUND_Y - 200 + (i ? 0 : 20));
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = rgbStr(...mixRgb(layerCols[i], pal.bot, fog * (i ? 0.4 : 0.7))); tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'source-over';
    g.drawImage(tmpCanvas, 0, 0);
  });
  // ground fog band
  const fg = g.createLinearGradient(0, GROUND_Y - 60, 0, GROUND_Y);
  fg.addColorStop(0, 'rgba(160,170,190,0)'); fg.addColorStop(1, `rgba(160,170,190,${0.25 + G.rain * 0.2})`);
  g.fillStyle = fg; g.fillRect(0, GROUND_Y - 60, W, 60);
}

// river water (world x >= 2140)
function drawRiver(g, pal, camX, t) {
  const x0 = 2140 - camX; if (x0 > W) return;
  const grd = g.createLinearGradient(0, GROUND_Y, 0, H);
  grd.addColorStop(0, rgbStr(...mixRgb(pal.bot, [10, 14, 30], 0.6))); grd.addColorStop(1, rgbStr(...mixRgb(pal.top, [4, 6, 16], 0.7)));
  g.fillStyle = grd; g.fillRect(Math.max(0, x0), GROUND_Y + 2, W, H - GROUND_Y);
  // far shore
  g.fillStyle = rgbStr(...mixRgb(pal.top, pal.bot, 0.5)); g.fillRect(Math.max(0, x0), GROUND_Y - 22, W, 10);
  for (let i = 0; i < 20; i++) g.fillRect(Math.max(0, x0) + i * 26, GROUND_Y - 22 - (i * 7 % 13), 8, (i * 7 % 13));
  // shimmer
  g.fillStyle = 'rgba(200,215,240,0.12)';
  for (let i = 0; i < 40; i++) { const y = GROUND_Y + 6 + (i * 37) % (H - GROUND_Y - 8); const x = Math.max(0, x0) + ((i * 53 + t * (0.3 + (i % 3) * 0.2)) % (W + 40)) - 20; g.fillRect(x, y, 6 + (i % 4) * 3, 1); }
  // reflected lamp lights
  const night = pal.night; if (night > 0) for (const lx of STREET.lamps) if (lx > 2140) { const sx = lx - camX; const rg = g.createRadialGradient(sx, GROUND_Y + 30, 2, sx, GROUND_Y + 30, 40); rg.addColorStop(0, `rgba(255,210,140,${0.35 * night})`); rg.addColorStop(1, 'rgba(255,210,140,0)'); g.fillStyle = rg; g.fillRect(sx - 40, GROUND_Y, 80, 80); }
}

// ---------- lamp posts (added to static) ----------
function paintLampPosts(g) {
  for (const x of STREET.lamps) {
    px(g, x - 1, GROUND_Y - 74, 3, 74, '#1e2028'); px(g, x - 1, GROUND_Y - 74, 1, 74, '#3a3c48');
    px(g, x - 3, GROUND_Y - 2, 7, 2, '#1e2028'); px(g, x - 2, GROUND_Y - 4, 5, 2, '#2a2c38');
    px(g, x - 1, GROUND_Y - 78, 12, 3, '#1e2028'); px(g, x + 6, GROUND_Y - 80, 10, 6, '#2a2c38'); px(g, x + 7, GROUND_Y - 75, 8, 2, '#e8d8a0');
  }
}

// ---------- entity sprite fetch ----------
function entFrame(e) {
  if (e.sprite) return { img: SPR[e.sprite], sil: null, w: SPR[e.sprite].width, h: SPR[e.sprite].height, cx: Math.floor(SPR[e.sprite].width / 2) };
  const fr = charFrames(SPECS[e.spec]);
  const L = e.dir < 0;
  let img, sil;
  if (e.sit) { img = L ? fr.sitL : fr.sit; sil = L ? fr.silSitL : fr.silSit; }
  else if (e.walk) { const f = e.frame | 0; img = L ? fr.walkL[f] : fr.walk[f]; sil = L ? fr.silWalkL[f] : fr.silWalk[f]; }
  else { img = L ? fr.idleL : fr.idle; sil = L ? fr.silL : fr.sil; }
  return { img, sil, w: HUMAN_W, h: HUMAN_H, cx: 12 };
}
const silCache = {};
function spriteSil(key) { if (!silCache[key]) silCache[key] = silhouette(SPR[key], '#000'); return silCache[key]; }

function drawShadow(g, e, fr, sx, sy, shadow, lampsOnScreen) {
  const sil = fr.sil || (e.sprite ? spriteSil(e.sprite) : null); if (!sil) return;
  const list = [];
  if (shadow.alpha > 0.02) list.push({ skew: shadow.skew, scaleY: shadow.scaleY, alpha: shadow.alpha });
  for (const L of lampsOnScreen) {
    const d = sx - L.x; const dist = Math.abs(d); if (dist > 110) continue;
    const a = L.alpha * (1 - dist / 110) * 0.55; if (a < 0.02) continue;
    list.push({ skew: clamp(d / 45, -2.2, 2.2), scaleY: 0.32, alpha: a });
  }
  for (const s of list) {
    g.save(); g.globalAlpha = s.alpha;
    g.setTransform(1, 0, s.skew, s.scaleY, sx, sy);
    g.drawImage(sil, -fr.cx, -fr.h + (e.sprite ? 0 : 2));
    g.restore();
  }
  // contact shadow
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(sx - fr.cx + 2, sy - 1, fr.w - 4, 2);
}

// ---------- lights list for a frame ----------
function collectLamps(camX, pal) {
  const out = [];
  const night = pal.night; if (night <= 0.02) return out;
  for (const x of STREET.lamps) { const sx = x - camX; if (sx < -140 || sx > W + 140) continue; out.push({ x: sx + 10, y: GROUND_Y - 76, alpha: night, color: [255, 214, 150], r: 120 }); }
  return out;
}

// ---------- main street render ----------
function renderStreet(g, t) {
  const camX = G.camX; const pal = todPalette(G.tod, G.rain); G.pal = pal;
  drawSky(g, pal, camX, t);
  drawRiver(g, pal, camX, t);
  g.drawImage(World.static, -camX, 0);
  if (G.chars && G.chars.theo && G.chars.theo.reunited) { const px0 = 1548 - camX; if (px0 > -40 && px0 < W) { paintBrick(g, px0, GROUND_Y - 52, 26, 32, '#6a4848', 5); px(g, px0, GROUND_Y - 52, 2, 2, '#d8d0b8'); px(g, px0 + 24, GROUND_Y - 52, 2, 2, '#d8d0b8'); px(g, px0, GROUND_Y - 22, 2, 2, '#d8d0b8'); px(g, px0 + 24, GROUND_Y - 22, 2, 2, '#d8d0b8'); } }
  // lit windows (night)
  const night = pal.night;
  if (night > 0.02) {
    for (const L of World.lights) {
      const sx = L.x - camX; if (sx + L.w < 0 || sx > W) continue;
      if (!L.lit && !L.door) continue;
      let a = night * (L.store || L.diner || L.dock || L.door ? 0.85 : 0.55);
      if (L.flicker) a *= 0.6 + 0.4 * Math.abs(Math.sin(t * 0.02 + L.x));
      if (L.diner && G.flags.dinerClosed) continue;
      g.fillStyle = L.cool ? `rgba(170,220,255,${a})` : L.warm ? `rgba(255,200,120,${a})` : `rgba(230,235,255,${a * 0.8})`;
      g.fillRect(sx, L.y, L.w, L.h);
      if (L.warm && !L.diner) { g.fillStyle = `rgba(80,60,40,${a * 0.5})`; g.fillRect(sx + 2, L.y + Math.floor(L.h * 0.55), Math.floor(L.w * 0.4), Math.floor(L.h * 0.35)); }
    }
  }
  // neon signs
  for (const s of World.signs) {
    const sx = s.x - camX; if (sx + s.w < -60 || sx > W + 60) continue;
    if (s.neon) {
      let a = 0.55 + 0.45 * night;
      if (s.flicker && !G.flags.signFixed) { a *= (Math.sin(t * 0.3) > 0.7 || Math.sin(t * 0.07) > 0.9) ? 0.15 : 1; if (Math.sin(t * 0.011) > 0.6) a *= 0.3; }
      if (s.big && G.flags.dinerClosed) a = 0;
      s._a = a;
    }
  }
  // entities
  const ents = G.entities.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const shadow = sunShadow(G.tod); shadow.alpha *= (1 - night) * (1 - G.rain * 0.55) * pal.sun;
  const lamps = collectLamps(camX, pal);
  // puddles (with reflections) sit on the ground, under everything that stands on it
  drawPuddles(g, ents, camX, pal, t);
  for (const e of ents) { if (e.hidden || e.noShadow) continue; const fr = entFrame(e); drawShadow(g, e, fr, Math.round(e.x - camX), e.y, shadow, lamps); }
  for (const e of ents) {
    if (e.hidden) continue; const fr = entFrame(e); const sx = Math.round(e.x - camX);
    g.drawImage(fr.img, sx - fr.cx, e.y - fr.h + (e.sprite ? 0 : 2));
    if (e.bubble) drawBubble(g, e, sx, t);
  }
  // rain
  drawRain(g, t, camX);
  // lighting overlay
  buildLighting(pal, camX, lamps, t);
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0); g.globalCompositeOperation = 'source-over';
  // additive glows + rays
  drawGlows(g, pal, camX, lamps, t);
  drawRays(g, pal, camX, t, shadow);
  drawVignette(g);
}

function drawBubble(g, e, sx, t) {
  const b = e.bubble; const by = (e.bubbleY !== undefined ? e.bubbleY : e.y - HUMAN_H - 6) + Math.round(Math.sin(t * 0.08) * 1.5);
  const img = SPR[b]; if (!img) return;
  g.fillStyle = 'rgba(20,22,30,0.7)'; g.fillRect(sx - 6, by - img.height - 3, img.width + 6, img.height + 6);
  g.drawImage(img, sx - 3, by - img.height);
}

function drawPuddles(g, ents, camX, pal, t) {
  for (const p of STREET.puddles) {
    const [wx, wy, rw, rh] = p; const sx = wx - camX; if (sx + rw < 0 || sx - rw > W) continue;
    g.save(); g.beginPath(); g.ellipse(sx, wy, rw, rh, 0, 0, Math.PI * 2); g.clip();
    // water base: reflected sky
    g.fillStyle = rgbStr(...mixRgb(pal.top, pal.bot, 0.5)); g.globalAlpha = 0.55; g.fillRect(sx - rw, wy - rh, rw * 2, rh * 2); g.globalAlpha = 1;
    // reflect static layer about GROUND_Y
    g.globalAlpha = 0.28; g.setTransform(1, 0, 0, -1, 0, GROUND_Y * 2); g.drawImage(World.static, -camX, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    // reflect entities about their feet
    g.globalAlpha = 0.35;
    for (const e of ents) { if (e.hidden) continue; const fr = entFrame(e); const ex = Math.round(e.x - camX); if (Math.abs(ex - sx) > rw + 20) continue; g.setTransform(1, 0, 0, -1, ex, e.y * 2 - 1); g.drawImage(fr.img, -fr.cx, e.y - fr.h); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // lamp / neon reflections
    if (pal.night > 0) for (const lx of STREET.lamps) { const lsx = lx - camX + 10; if (Math.abs(lsx - sx) < rw + 30) { const rg = g.createRadialGradient(lsx, wy, 1, lsx, wy, 26); rg.addColorStop(0, `rgba(255,210,140,${0.5 * pal.night})`); rg.addColorStop(1, 'rgba(255,210,140,0)'); g.fillStyle = rg; g.fillRect(lsx - 30, wy - 12, 60, 24); } }
    // ripples
    g.globalAlpha = 0.5; g.strokeStyle = 'rgba(210,225,245,0.5)';
    const R = seeded(wx + Math.floor(t / 14)); for (let i = 0; i < 2 + G.rain * 4; i++) { const rx = sx - rw + R() * rw * 2, ry = wy - rh + R() * rh * 2, r = 1 + ((t + i * 5) % 14) / 3; g.beginPath(); g.ellipse(rx, ry, r, r * 0.4, 0, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1;
    // edge highlight
    g.strokeStyle = 'rgba(180,195,215,0.25)'; g.beginPath(); g.ellipse(sx, wy, rw - 1, rh - 1, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
}

// ---------- rain ----------
const rainDrops = []; const splashes = [];
function initRain() { rainDrops.length = 0; for (let i = 0; i < 260; i++) rainDrops.push({ x: Math.random() * (W + 80), y: Math.random() * H, v: 6 + Math.random() * 4, l: 5 + Math.random() * 6, z: Math.random() }); }
initRain();
function updateRain(camX) {
  const n = Math.floor(rainDrops.length * G.rain);
  const dx = -1.4 - G.wind;
  for (let i = 0; i < n; i++) {
    const d = rainDrops[i]; d.x += dx * (0.6 + d.z * 0.6); d.y += d.v * (0.6 + d.z * 0.6);
    if (d.y > H || d.x < -20) {
      if (d.y > H && Math.random() < 0.5) splashes.push({ x: d.x, y: G.scene === 'street' ? (GROUND_Y + 2 + Math.random() * (H - GROUND_Y - 4)) : H - 10, t: 0 });
      d.y = -10 - Math.random() * 40; d.x = Math.random() * (W + 80);
    }
  }
  for (let i = splashes.length - 1; i >= 0; i--) { splashes[i].t++; if (splashes[i].t > 8) splashes.splice(i, 1); }
  if (splashes.length > 90) splashes.splice(0, splashes.length - 90);
}
function drawRain(g, t, camX, clipRect) {
  if (G.rain <= 0.01) return;
  const n = Math.floor(rainDrops.length * G.rain);
  g.save(); if (clipRect) { g.beginPath(); g.rect(...clipRect); g.clip(); }
  g.strokeStyle = 'rgba(190,205,230,0.5)'; g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < n; i++) { const d = rainDrops[i]; const dx = (-1.4 - G.wind) * (0.6 + d.z * 0.6); g.moveTo(d.x, d.y); g.lineTo(d.x + dx * d.l / 6, d.y + d.l * (0.6 + d.z * 0.6)); }
  g.stroke();
  if (!clipRect) { g.strokeStyle = 'rgba(200,215,240,0.55)'; for (const s of splashes) { const r = 1 + s.t * 0.6; g.globalAlpha = 1 - s.t / 8; g.beginPath(); g.ellipse(s.x, s.y, r, r * 0.35, 0, 0, Math.PI * 2); g.stroke(); } }
  g.globalAlpha = 1; g.restore();
}

// ---------- lighting overlay ----------
function buildLighting(pal, camX, lamps, t) {
  lg.globalCompositeOperation = 'source-over';
  lg.fillStyle = rgbStr(...pal.amb); lg.fillRect(0, 0, W, H);
  lg.globalCompositeOperation = 'lighter';
  const night = pal.night;
  for (const L of lamps) {
    const rg = lg.createRadialGradient(L.x, L.y, 4, L.x, L.y, L.r);
    rg.addColorStop(0, `rgba(${L.color[0]},${L.color[1]},${L.color[2]},${0.95 * L.alpha})`);
    rg.addColorStop(0.35, `rgba(${L.color[0]},${L.color[1]},${L.color[2]},${0.5 * L.alpha})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = rg; lg.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    // ground pool
    const pg = lg.createRadialGradient(L.x - 4, GROUND_Y + 8, 2, L.x - 4, GROUND_Y + 8, 70);
    pg.addColorStop(0, `rgba(${L.color[0]},${L.color[1]},${L.color[2]},${0.5 * L.alpha})`); pg.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = pg; lg.save(); lg.scale(1, 0.45); lg.fillRect(L.x - 80, (GROUND_Y + 8) / 0.45 - 80, 160, 160); lg.restore();
  }
  if (night > 0.02) {
    // window spill
    for (const L of World.lights) {
      if (!L.lit) continue; const sx = L.x - camX; if (sx + L.w < -40 || sx > W + 40) continue;
      if (L.diner && G.flags.dinerClosed) continue;
      const cx = sx + L.w / 2, cy = L.y + L.h / 2; const r = Math.max(L.w, L.h) * (L.store || L.diner || L.dock ? 1.6 : 1.1);
      const col = L.cool ? [150, 210, 255] : L.warm ? [255, 200, 130] : [220, 225, 255];
      const rg = lg.createRadialGradient(cx, cy, 2, cx, cy, r); rg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.45 * night})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = rg; lg.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    // neon spill
    for (const s of World.signs) { if (!s.neon || !s._a) continue; const sx = s.x - camX + s.w / 2; if (sx < -80 || sx > W + 80) continue; const [r, gg, b] = hexToRgb(s.neon); const rg = lg.createRadialGradient(sx, s.y + 6, 4, sx, s.y + 6, 90); rg.addColorStop(0, `rgba(${r},${gg},${b},${0.5 * night * s._a})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(sx - 90, s.y - 84, 180, 180); }
    // dynamic lights carried by entities (e.g. phone / cigarette / lantern)
    for (const e of G.entities) if (e.light) { const sx = e.x - camX; const rg = lg.createRadialGradient(sx, e.y - 20, 2, sx, e.y - 20, e.light); rg.addColorStop(0, `rgba(255,180,100,${0.4 * night})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(sx - e.light, e.y - 20 - e.light, e.light * 2, e.light * 2); }
  }
  lg.globalCompositeOperation = 'source-over';
}

// ---------- glows (additive halos + volumetric cones) ----------
function drawGlows(g, pal, camX, lamps, t, signs) {
  signs = signs || World.signs;
  g.globalCompositeOperation = 'lighter';
  const night = pal.night;
  for (const L of lamps) {
    // bulb halo
    const rg = g.createRadialGradient(L.x, L.y, 1, L.x, L.y, 26 + G.rain * 12);
    rg.addColorStop(0, `rgba(255,230,180,${0.5 * L.alpha})`); rg.addColorStop(0.3, `rgba(255,210,150,${0.18 * L.alpha})`); rg.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = rg; g.fillRect(L.x - 40, L.y - 40, 80, 80);
    // volumetric cone
    const cg = g.createLinearGradient(0, L.y, 0, GROUND_Y + 10);
    cg.addColorStop(0, `rgba(255,214,150,${(0.16 + G.rain * 0.1) * L.alpha})`); cg.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = cg; g.beginPath(); g.moveTo(L.x - 3, L.y); g.lineTo(L.x + 3, L.y); g.lineTo(L.x + 46, GROUND_Y + 10); g.lineTo(L.x - 52, GROUND_Y + 10); g.closePath(); g.fill();
  }
  // neon text (emissive, drawn after the lighting multiply)
  g.globalCompositeOperation = 'source-over';
  for (const s of signs) {
    if (!s.neon || !s._a) continue; const sx = s.x - camX + s.w / 2; if (sx < -80 || sx > W + 80) continue;
    g.globalAlpha = s._a; drawText(g, s.text, sx, s.y + (s.big ? 5 : 2), s.neon, { align: 'center' }); g.globalAlpha = 1;
  }
  g.globalCompositeOperation = 'lighter';
  // neon halos
  for (const s of signs) {
    if (!s.neon || !s._a) continue; const sx = s.x - camX + s.w / 2; if (sx < -80 || sx > W + 80) continue;
    const [r, gg, b] = hexToRgb(s.neon);
    const rg = g.createRadialGradient(sx, s.y + 5, 2, sx, s.y + 5, s.big ? 70 : 40);
    rg.addColorStop(0, `rgba(${r},${gg},${b},${0.28 * s._a * (0.4 + night * 0.6)})`); rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = rg; g.fillRect(sx - 80, s.y - 70, 160, 150);
  }
  g.globalCompositeOperation = 'source-over';
}

// ---------- god rays through the gaps ----------
function drawRays(g, pal, camX, t, shadow, gaps) {
  gaps = gaps || World.gaps;
  const strength = pal.sun * (1 - pal.night) * (1 - G.rain * 0.8) * (0.9 - Math.abs(G.tod - 0.15) * 1.6);
  if (strength <= 0.02) return;
  g.globalCompositeOperation = 'lighter';
  const TOP = -12, BOT = GROUND_Y + 30;
  for (const gp of gaps) {
    const x0 = gp.x0 - camX, x1 = gp.x1 - camX; if (x1 < -400 || x0 > W + 400) continue;
    // the beam is a straight shaft of light from the top edge of the screen to the ground, aimed so it passes through the gap
    const slope = -shadow.skew * 0.55;                       // horizontal drift per vertical pixel
    const H = BOT - TOP; const off = slope * H;              // total drift top→bottom
    const upDrift = slope * (gp.top - TOP);                  // how far the shaft has drifted by the time it reaches the gap
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.01 + gp.x0);
    const nb = Math.max(2, Math.floor((x1 - x0) / 14));
    for (let i = 0; i < nb; i++) {
      const gx0 = x0 + (i / nb) * (x1 - x0), bw = (x1 - x0) / nb * 0.7;
      const tx0 = gx0 - upDrift;                             // where this shaft crosses the top edge
      const a = (0.10 + 0.08 * Math.sin(t * 0.013 + i * 1.7 + gp.x0)) * strength * pulse;
      const lg2 = g.createLinearGradient(0, TOP, 0, BOT);
      lg2.addColorStop(0, `rgba(255,236,200,${a * 0.55})`); lg2.addColorStop(0.35, `rgba(255,236,200,${a})`); lg2.addColorStop(0.8, `rgba(255,230,190,${a * 0.3})`); lg2.addColorStop(1, 'rgba(255,230,190,0)');
      g.fillStyle = lg2; g.beginPath(); g.moveTo(tx0, TOP); g.lineTo(tx0 + bw, TOP); g.lineTo(tx0 + bw + off, BOT); g.lineTo(tx0 + off, BOT); g.closePath(); g.fill();
    }
    // dust motes along the shaft
    g.fillStyle = `rgba(255,240,210,${0.5 * strength})`; const R = seeded(gp.x0);
    for (let i = 0; i < 18; i++) { const p = ((t * 0.15 + R() * 300) % 300) / 300; const y = TOP + p * H; const x = (x0 - upDrift) + R() * (x1 - x0) + off * p + Math.sin(t * 0.03 + i) * 3; g.fillRect(x, y, 1, 1); }
  }
  g.globalCompositeOperation = 'source-over';
}

function drawVignette(g) {
  const rg = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.36)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}

// ---------- interiors ----------
function renderInterior(g, t) {
  const I = INTERIORS[G.scene]; const pal = todPalette(G.tod, G.rain); G.pal = pal;
  g.drawImage(interiorStatic(G.scene), 0, 0);
  // window: sky + rain
  if (I.window) {
    const w = I.window; g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    const grd = g.createLinearGradient(0, w.y, 0, w.y + w.h); grd.addColorStop(0, rgbStr(...pal.top)); grd.addColorStop(1, rgbStr(...pal.bot)); g.fillStyle = grd; g.fillRect(w.x, w.y, w.w, w.h);
    tg.clearRect(0, 0, W, H); tg.drawImage(skylineLayers[1], w.x - 100, w.y + w.h - 150); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = rgbStr(...mixRgb(pal.top, pal.bot, 0.6)); tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'source-over'; g.drawImage(tmpCanvas, 0, 0);
    if (pal.night > 0.1) { g.fillStyle = `rgba(255,200,120,${0.5 * pal.night})`; g.fillRect(w.x + 8, w.y + w.h - 40, 6, 8); g.fillRect(w.x + 30, w.y + w.h - 52, 5, 7); }
    drawRain(g, t, 0, [w.x, w.y, w.w, w.h]);
    // glass reflection
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(w.x, w.y, Math.floor(w.w * 0.4), w.h);
    g.restore();
  }
  if (I.dynamic) I.dynamic(g, t);   // per-frame scenery (the bus windows)
  // entities with lamp shadows
  const ents = G.entities.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const lamps = [{ x: I.lamp.x, y: I.lamp.y, alpha: 0.8, color: I.cool ? [220, 235, 255] : [255, 220, 170], r: 260 }];
  const shadow = { skew: 0, scaleY: 0, alpha: 0 };
  for (const e of ents) { if (e.hidden || e.lying || e.noShadow) continue; const fr = entFrame(e); const sx = Math.round(e.x); drawShadow(g, e, fr, sx, e.y, shadow, [{ x: I.lamp.x, alpha: 0.7 }]); }
  const drawEnt = (e) => {
    if (e.hidden) return; const fr = entFrame(e); const sx = Math.round(e.x);
    if (e.lying) { const bed = INTERIORS[G.scene].bed || INTERIORS.apartment.bed; const hx = bed.x + bed.w - 4, top = GROUND_Y + 8 - 18; g.save(); g.translate(hx, top - 20); g.rotate(Math.PI / 2); g.drawImage(charFrames(SPECS[e.spec]).idle, 0, 0); g.restore(); px(g, bed.x + 1, top - 12, bed.w - 16, 14, '#5a5a7a'); px(g, bed.x + 1, top - 12, bed.w - 16, 1, '#7a7a9a'); return; }
    g.drawImage(fr.img, sx - fr.cx, e.y - fr.h + (e.sprite ? 0 : 2)); if (e.bubble) drawBubble(g, e, sx, t);
  };
  for (const e of ents) if (e.y <= COUNTER_BASE + 2) drawEnt(e);   // behind counters
  if (I.fg) I.fg(g);
  for (const e of ents) if (e.y > COUNTER_BASE + 2) drawEnt(e);    // in front of counters
  // lighting
  lg.globalCompositeOperation = 'source-over';
  const amb = I.ambient; const nightDim = 1 - pal.night * 0.35;
  lg.fillStyle = rgbStr(amb[0] * nightDim, amb[1] * nightDim, amb[2] * nightDim); lg.fillRect(0, 0, W, H);
  lg.globalCompositeOperation = 'lighter';
  for (const L of lamps) { const rg = lg.createRadialGradient(L.x, L.y, 6, L.x, L.y, L.r); rg.addColorStop(0, `rgba(${L.color[0]},${L.color[1]},${L.color[2]},0.9)`); rg.addColorStop(0.5, `rgba(${L.color[0]},${L.color[1]},${L.color[2]},0.35)`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(0, 0, W, H); }
  if (I.window) { const w = I.window; const rg = lg.createRadialGradient(w.x + w.w / 2, w.y + w.h / 2, 4, w.x + w.w / 2, w.y + w.h / 2, 120); const a = 0.5 * (1 - pal.night); rg.addColorStop(0, `rgba(200,215,240,${a})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(0, 0, W, H); }
  lg.globalCompositeOperation = 'source-over';
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0); g.globalCompositeOperation = 'source-over';
  // window light rays (daytime) - beam from window across the room floor
  if (I.window && pal.sun * (1 - pal.night) > 0.1 && G.rain < 0.7) {
    const w = I.window; const a = 0.10 * pal.sun * (1 - pal.night) * (1 - G.rain);
    g.globalCompositeOperation = 'lighter';
    const lg2 = g.createLinearGradient(w.x, w.y, w.x + 120, w.y + 160); lg2.addColorStop(0, `rgba(230,235,255,${a})`); lg2.addColorStop(1, 'rgba(230,235,255,0)');
    g.fillStyle = lg2; g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(w.x + w.w, w.y); g.lineTo(w.x + w.w + 110, I.floorY + 30); g.lineTo(w.x + 60, I.floorY + 30); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
  }
  // lamp halo
  g.globalCompositeOperation = 'lighter';
  const rg = g.createRadialGradient(I.lamp.x, I.lamp.y, 2, I.lamp.x, I.lamp.y, 30); rg.addColorStop(0, 'rgba(255,240,200,0.35)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = rg; g.fillRect(I.lamp.x - 30, I.lamp.y - 30, 60, 60);
  g.globalCompositeOperation = 'source-over';
  drawVignette(g);
}

// which painter a scene uses (street / lake are outdoors and scroll; everything else is a cutaway room)
const OUTDOORS = {};   // extra outdoor scenes register here: id -> { w, spots, doors, render }
function isOutdoor(sc) { return sc === 'street' || !!OUTDOORS[sc]; }
function sceneW(sc) { return sc === 'street' ? STREET.w : OUTDOORS[sc] ? OUTDOORS[sc].w : W; }
function renderScene(g, t) { if (G.scene === 'street') renderStreet(g, t); else if (OUTDOORS[G.scene]) OUTDOORS[G.scene].render(g, t); else renderInterior(g, t); }
