// ============================================================
// world: scene definitions, procedural buildings & interiors
// ============================================================
const GROUND_Y = 206;   // where walls meet sidewalk
const FEET_Y = 221;     // where characters stand
const CURB_Y = 224;     // sidewalk/road edge
const GF_H = 48, FLOOR_H = 50;  // ground floor / upper floor pitch (2.2m / 2.25m)

// ---- brick / wall painters ----
function paintBrick(g, x, y, w, h, base, seed) {
  const R = seeded(seed);
  const b0 = base, b1 = shade(base, -10), b2 = shade(base, 8), mortar = shade(base, -28);
  px(g, x, y, w, h, b0);
  for (let yy = 0; yy < h; yy += 4) {
    const off = (Math.floor(yy / 4) % 2) * 4;
    px(g, x, y + yy + 3, w, 1, mortar);
    for (let xx = -off; xx < w; xx += 8) {
      const r = R();
      if (r < 0.18) px(g, x + Math.max(0, xx), y + yy, Math.min(7, w - Math.max(0, xx)), 3, b1);
      else if (r < 0.28) px(g, x + Math.max(0, xx), y + yy, Math.min(7, w - Math.max(0, xx)), 3, b2);
      if (xx + 7 < w && xx + 7 >= 0) px(g, x + xx + 7, y + yy, 1, 3, mortar);
    }
  }
}
function paintConcrete(g, x, y, w, h, base, seed) {
  const R = seeded(seed);
  px(g, x, y, w, h, base);
  for (let i = 0; i < w * h / 30; i++) { px(g, x + Math.floor(R() * w), y + Math.floor(R() * h), 1 + Math.floor(R() * 3), 1, shade(base, R() < 0.5 ? -8 : 6)); }
  // panel lines
  for (let yy = 12; yy < h; yy += 14) px(g, x, y + yy, w, 1, shade(base, -14));
  // grime streaks
  for (let i = 0; i < w / 18; i++) { const sx = x + Math.floor(R() * w); px(g, sx, y + Math.floor(R() * h * 0.5), 1, Math.floor(R() * h * 0.5), 'rgba(0,0,0,0.12)'); }
}
function paintCorrugated(g, x, y, w, h, base) {
  px(g, x, y, w, h, base);
  for (let xx = 0; xx < w; xx += 3) { px(g, x + xx, y, 1, h, shade(base, -14)); px(g, x + xx + 2, y, 1, h, shade(base, 8)); }
}
// window with frame; returns a "light" spec for the night layer
function paintWindow(g, x, y, w, h, style, seed) {
  const R = seeded(seed);
  const frame = style === 'concrete' ? '#3a3e48' : '#2a2226';
  px(g, x - 1, y - 1, w + 2, h + 2, frame);
  const glass = ['#2a3445', '#26303e', '#303a4a'][Math.floor(R() * 3)];
  px(g, x, y, w, h, glass);
  px(g, x + 1, y + 1, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, shade(glass, 12)); // reflection
  px(g, x + Math.floor(w / 2), y, 1, h, frame); px(g, x, y + Math.floor(h / 2), w, 1, frame); // muntins
  px(g, x - 2, y + h + 1, w + 4, 1, shade(frame, 30)); // sill
  // curtains / blinds variation
  const v = R();
  if (v < 0.25) { px(g, x, y, w, Math.floor(h * 0.4), '#5a4a3a'); px(g, x, y, w, 1, '#7a6a5a'); }
  else if (v < 0.4) { px(g, x, y, Math.floor(w * 0.3), h, '#6a3a3a'); px(g, x + w - Math.floor(w * 0.3), y, Math.floor(w * 0.3), h, '#6a3a3a'); }
  else if (v < 0.5) { for (let yy = 1; yy < h; yy += 2) px(g, x, y + yy, w, 1, shade(glass, 18)); }
  return { x, y, w, h, lit: R() < 0.45, warm: R() < 0.7, flicker: R() < 0.1 };
}

// ---- building painter: draws into static layer, returns lights + gap info ----
function paintBuilding(g, b, lights, signs) {
  const R = seeded(b.seed || 1);
  const top = GROUND_Y - b.h;
  const style = b.style || 'brick';
  if (style === 'brick') paintBrick(g, b.x, top, b.w, b.h, b.color, b.seed);
  else if (style === 'concrete') paintConcrete(g, b.x, top, b.w, b.h, b.color, b.seed);
  else if (style === 'corrugated') paintCorrugated(g, b.x, top, b.w, b.h, b.color);
  // roof cap
  px(g, b.x - 1, top - 2, b.w + 2, 2, shade(b.color, -40));
  px(g, b.x - 1, top - 3, b.w + 2, 1, shade(b.color, 20));
  // roof details
  if (b.roof !== false) {
    let rx = b.x + 8;
    while (rx < b.x + b.w - 20) {
      const r = R();
      if (r < 0.3) { px(g, rx, top - 10, 10, 8, '#3a3a42'); px(g, rx + 1, top - 9, 8, 6, '#4a4a54'); px(g, rx + 3, top - 7, 4, 2, '#2a2a30'); }
      else if (r < 0.45) { px(g, rx + 3, top - 22, 1, 20, '#5a5a62'); px(g, rx, top - 20, 7, 1, '#5a5a62'); px(g, rx + 1, top - 16, 5, 1, '#5a5a62'); }
      else if (r < 0.55) { px(g, rx, top - 14, 14, 10, '#4a3a2a'); px(g, rx + 1, top - 15, 12, 2, '#5a4a3a'); px(g, rx + 2, top - 18, 10, 3, '#3a2a1a'); px(g, rx + 2, top - 4, 2, 4, '#2a2a30'); px(g, rx + 10, top - 4, 2, 4, '#2a2a30'); }
      else if (r < 0.65) { px(g, rx, top - 6, 16, 4, '#2a2a30'); px(g, rx + 2, top - 8, 12, 2, '#3a3a40'); }
      rx += 24 + Math.floor(R() * 30);
    }
  }
  // floors of windows (ground floor 2.2m, upper floors 2.25m, windows 0.8 x 1.1m)
  const floors = b.floors || 0;
  const wW = b.winW || 18, wH = b.winH || 24;
  const cols = Math.max(1, Math.floor((b.w - 16) / (wW + 18)));
  const gapX = (b.w - cols * wW) / (cols + 1);
  for (let f = 0; f < floors; f++) {
    const wy = GROUND_Y - GF_H - (f + 1) * FLOOR_H + 12;
    for (let c = 0; c < cols; c++) {
      const wx = Math.round(b.x + gapX + c * (wW + gapX));
      const L = paintWindow(g, wx, Math.round(wy), wW, wH, style, b.seed * 7 + f * 31 + c * 13);
      lights.push(L);
    }
  }
  // fire escape
  if (b.fireEscape) {
    const fx = b.x + b.w - 34;
    for (let f = 0; f < floors; f++) {
      const fy = GROUND_Y - GF_H - (f + 1) * FLOOR_H + 12 + wH + 3;
      px(g, fx, fy, 30, 1, '#1e1e24'); px(g, fx, fy - 8, 1, 8, '#1e1e24'); px(g, fx + 29, fy - 8, 1, 8, '#1e1e24');
      for (let i = 3; i < 30; i += 4) px(g, fx + i, fy - 7, 1, 7, '#2a2a32');
      px(g, fx + 4, fy + 1, 3, 12, '#1e1e24'); px(g, fx + 24, fy + 1, 1, 14, '#1e1e24');
    }
  }
  // ground floor
  const gy = GROUND_Y;
  const kind = b.kind || 'plain';
  if (kind === 'apartment') {
    // door with steps and transom, house number
    const dx = b.door, dw = 22;
    px(g, dx - 8, gy - 50, dw + 16, 50, shade(b.color, -18));
    px(g, dx - 2, gy - 46, dw + 4, 46, '#1a1418');
    px(g, dx, gy - 44, dw, 44, '#4a2e22'); px(g, dx + 1, gy - 43, dw - 2, 12, '#2a3a4a'); px(g, dx + 2, gy - 42, 8, 10, '#3a4a5c');
    px(g, dx + dw / 2, gy - 44, 1, 44, '#2a1a12'); px(g, dx + 3, gy - 24, 6, 1, '#c8a850');
    px(g, dx - 6, gy - 6, dw + 12, 6, '#6a6a72'); px(g, dx - 4, gy - 3, dw + 8, 3, '#7a7a82'); px(g, dx - 6, gy - 6, dw + 12, 1, '#8a8a92');
    px(g, dx - 3, gy - 58, dw + 6, 8, '#3a3a42'); drawText(g, b.num || '412', dx + dw / 2, gy - 57, '#d8d0b8', { align: 'center' });
    lights.push({ x: dx + 1, y: gy - 43, w: dw - 2, h: 12, lit: true, warm: true, door: true });
    signs.push({ x: dx - 6, y: gy - 60, w: dw + 12, text: b.name, color: '#c8c0a8' });
  }
  if (kind === 'store') {
    const sx = b.x + 10, sw = b.w - 20;
    px(g, sx - 4, gy - 50, sw + 8, 50, '#2a3a2a');
    // big window
    px(g, sx, gy - 44, sw, 40, '#1a2430');
    px(g, sx + 1, gy - 43, sw - 2, 38, '#26303c'); px(g, sx + 2, gy - 42, Math.floor(sw * 0.4), 18, '#303c4a');
    // shelves visible inside
    for (let i = 0; i < 3; i++) { px(g, sx + 6, gy - 36 + i * 10, sw - 12, 1, '#5a4a3a'); for (let j = 0; j < (sw - 16) / 7; j++) px(g, sx + 8 + j * 7, gy - 41 + i * 10, 4, 5, ['#8a3a3a', '#3a6a8a', '#c8a84a', '#4a8a4a'][(i + j) % 4]); }
    // door in window
    const dx = b.door; px(g, dx - 1, gy - 44, 24, 44, '#2a3a2a'); px(g, dx, gy - 42, 22, 42, '#26303c'); px(g, dx + 10, gy - 42, 1, 42, '#2a3a2a'); px(g, dx + 6, gy - 24, 3, 1, '#c8a850');
    lights.push({ x: sx + 1, y: gy - 43, w: sw - 2, h: 38, lit: true, warm: false, store: true });
    // awning
    const aw = sw + 8, ax = sx - 4, ay = gy - 58;
    for (let i = 0; i < aw; i += 8) px(g, ax + i, ay, Math.min(8, aw - i), 10, (i / 8) % 2 ? '#2e6a3a' : '#e8e4d8');
    px(g, ax, ay + 10, aw, 2, '#1e4a2a'); px(g, ax, ay - 1, aw, 1, '#3a7a4a');
    for (let i = 0; i < aw; i += 8) px(g, ax + i + ((i / 8) % 2 ? 0 : 0), ay + 12, 8, 1, (i / 8) % 2 ? '#1e4a2a' : '#c8c4b8');
    px(g, ax, ay - 18, aw, 16, '#1e2a1e'); px(g, ax + 1, ay - 17, aw - 2, 14, '#2a3a2a');
    // lit sign box (text is drawn as emissive neon at render time)
    px(g, ax + 2, ay - 16, aw - 4, 12, '#243424'); px(g, ax + 2, ay - 16, aw - 4, 1, '#3a5a3a');
    signs.push({ x: ax, y: ay - 16, w: aw, neon: '#f0dc8a', text: b.name });
  }
  if (kind === 'diner') {
    const sx = b.x + 8, sw = b.w - 16;
    px(g, sx - 4, gy - 52, sw + 8, 52, '#8a2a2a');
    px(g, sx - 4, gy - 52, sw + 8, 4, '#c8c8d0'); px(g, sx - 4, gy - 4, sw + 8, 4, '#c8c8d0');
    // chrome trim stripes
    for (let i = 0; i < sw + 8; i += 2) px(g, sx - 4 + i, gy - 48, 1, 44, 'rgba(255,255,255,0.05)');
    // windows
    const wn = Math.floor(sw / 44);
    for (let i = 0; i < wn; i++) {
      const wx = sx + 4 + i * 44; if (wx + 36 > b.door - 2 && wx < b.door + 26) continue;
      px(g, wx - 1, gy - 45, 38, 34, '#c8c8d0'); px(g, wx, gy - 44, 36, 32, '#3a2a34'); px(g, wx + 1, gy - 43, 34, 30, '#4a3438');
      // booths inside
      px(g, wx + 2, gy - 26, 8, 12, '#8a2a2a'); px(g, wx + 26, gy - 26, 8, 12, '#8a2a2a'); px(g, wx + 10, gy - 20, 16, 2, '#d8d0c0');
      px(g, wx + 4, gy - 40, 28, 1, '#6a5a5a');
      lights.push({ x: wx, y: gy - 44, w: 36, h: 32, lit: true, warm: true, diner: true });
    }
    // door
    const dx = b.door; px(g, dx - 2, gy - 46, 28, 46, '#c8c8d0'); px(g, dx, gy - 44, 24, 44, '#3a2a34'); px(g, dx + 2, gy - 42, 20, 26, '#4a3438'); px(g, dx + 16, gy - 24, 3, 1, '#c8a850');
    // neon sign on top
    const nx = b.x + b.w / 2, ny = gy - 74;
    px(g, nx - 50, ny - 4, 100, 22, '#1a1418'); px(g, nx - 48, ny - 2, 96, 18, '#2a2028');
    signs.push({ x: nx - 48, y: ny - 2, w: 96, neon: '#ff5a7a', text: b.name, big: true, flicker: b.brokenSign });
  }
  if (kind === 'clinic') {
    const sx = b.x + 10, sw = b.w - 20;
    px(g, sx - 4, gy - 48, sw + 8, 48, '#3a4a5a');
    px(g, sx, gy - 42, Math.floor(sw / 2) - 20, 36, '#26303c'); px(g, sx + 1, gy - 41, Math.floor(sw / 2) - 22, 34, '#2e3a48');
    px(g, sx + Math.floor(sw / 2) + 20, gy - 42, Math.floor(sw / 2) - 20, 36, '#26303c'); px(g, sx + Math.floor(sw / 2) + 21, gy - 41, Math.floor(sw / 2) - 22, 34, '#2e3a48');
    lights.push({ x: sx + 1, y: gy - 41, w: Math.floor(sw / 2) - 22, h: 34, lit: true, warm: false });
    lights.push({ x: sx + Math.floor(sw / 2) + 21, y: gy - 41, w: Math.floor(sw / 2) - 22, h: 34, lit: true, warm: false });
    const dx = b.door; px(g, dx - 2, gy - 44, 30, 44, '#c8ccd4'); px(g, dx, gy - 42, 26, 42, '#3a4a5a'); px(g, dx + 2, gy - 40, 22, 30, '#8ab0c8'); px(g, dx + 13, gy - 40, 1, 40, '#c8ccd4');
    // cross sign
    px(g, dx + 4, gy - 62, 18, 14, '#f0f0f4'); px(g, dx + 11, gy - 60, 4, 10, '#c83a3a'); px(g, dx + 8, gy - 57, 10, 4, '#c83a3a');
    signs.push({ x: dx - 30, y: gy - 74, w: 90, text: b.name, color: '#d8e0e8' });
    px(g, dx - 32, gy - 76, 94, 12, '#2a3440'); drawText(g, b.name, dx + 15, gy - 74, '#d8e0e8', { align: 'center' });
  }
  if (kind === 'warehouse') {
    // roll-up doors
    for (let i = 0; i < 3; i++) {
      const dx = b.x + 30 + i * 110;
      px(g, dx - 3, gy - 58, 66, 58, '#2a2a30'); px(g, dx, gy - 54, 60, 54, i === 1 ? '#1a1a20' : '#4a4e58');
      if (i !== 1) for (let y = 0; y < 54; y += 4) px(g, dx, gy - 54 + y, 60, 1, '#3a3e48');
      else { px(g, dx + 2, gy - 52, 56, 50, '#141418'); for (let k = 0; k < 4; k++) g.drawImage(SPR.crate, dx + 6 + k * 13, gy - 12 - (k % 2) * 12); lights.push({ x: dx + 2, y: gy - 52, w: 56, h: 50, lit: true, warm: true, dock: true }); }
      px(g, dx - 3, gy - 60, 66, 3, '#e8a020');
    }
    signs.push({ x: b.x + b.w / 2 - 60, y: GROUND_Y - b.h + 8, w: 120, text: b.name, color: '#c8c0a8' });
    px(g, b.x + b.w / 2 - 62, GROUND_Y - b.h + 6, 124, 12, '#3a3a44'); drawText(g, b.name, b.x + b.w / 2, GROUND_Y - b.h + 8, '#d0c8b0', { align: 'center' });
  }
  if (kind === 'laundry') {
    const sx = b.x + 10, sw = b.w - 20;
    px(g, sx - 4, gy - 48, sw + 8, 48, '#4a5a6a');
    px(g, sx, gy - 42, sw, 36, '#26303c'); px(g, sx + 1, gy - 41, sw - 2, 34, '#2e3a48');
    for (let i = 0; i < sw / 22 - 1; i++) { px(g, sx + 6 + i * 22, gy - 30, 16, 20, '#c8ccd0'); px(g, sx + 9 + i * 22, gy - 26, 10, 10, '#2a3a4a'); px(g, sx + 11 + i * 22, gy - 24, 6, 6, '#4a6a8a'); }
    lights.push({ x: sx + 1, y: gy - 41, w: sw - 2, h: 34, lit: true, warm: false, cool: true });
    px(g, sx - 4, gy - 62, sw + 8, 12, '#2a3a4a');
    signs.push({ x: sx - 4, y: gy - 62, w: sw + 8, neon: '#8ad8f0', text: b.name });
  }
  if (kind === 'pawn') {
    const dx = b.door;
    // window full of other people's things, with a grille
    px(g, b.x + 6, gy - 46, 30, 42, '#1a1418'); px(g, b.x + 8, gy - 44, 26, 38, '#26303c');
    px(g, b.x + 10, gy - 26, 22, 1, '#5a4a3a'); px(g, b.x + 10, gy - 14, 22, 1, '#5a4a3a');
    px(g, b.x + 11, gy - 34, 8, 8, '#8a6a3a'); px(g, b.x + 21, gy - 32, 6, 6, '#c8a850'); px(g, b.x + 12, gy - 24, 5, 9, '#3a3a40'); px(g, b.x + 20, gy - 22, 9, 7, '#8a3a3a'); px(g, b.x + 24, gy - 12, 6, 10, '#a8845a');
    for (let x = b.x + 8; x < b.x + 34; x += 4) px(g, x, gy - 44, 1, 38, 'rgba(120,110,90,0.45)'); for (let y = gy - 44; y < gy - 6; y += 6) px(g, b.x + 8, y, 26, 1, 'rgba(120,110,90,0.45)');
    px(g, dx - 2, gy - 46, 26, 46, '#1a1418'); px(g, dx, gy - 44, 22, 44, '#3a2a24'); px(g, dx + 2, gy - 42, 18, 20, '#26303c'); px(g, dx + 15, gy - 24, 3, 2, '#c8a850');
    px(g, dx + 4, gy - 40, 14, 6, '#1a1418'); drawText(g, 'OPEN', dx + 11, gy - 39, '#e8a840', { align: 'center' });
    // three brass balls + sign
    for (let i = 0; i < 3; i++) px(g, dx - 14 + i * 8, gy - 62 + (i === 1 ? 4 : 0), 5, 5, '#c8a850');
    px(g, b.x + 4, gy - 76, b.w - 8, 12, '#2a2024'); px(g, b.x + 4, gy - 76, b.w - 8, 1, '#4a3a34');
    signs.push({ x: b.x + 4, y: gy - 76, w: b.w - 8, neon: '#e8a840', text: b.name });
    lights.push({ x: b.x + 8, y: gy - 44, w: 26, h: 38, lit: true, warm: true, store: true });
    lights.push({ x: dx + 2, y: gy - 42, w: 18, h: 20, lit: true, warm: true, door: true });
  }
  if (kind === 'plain' || kind === 'pawn') {
    if (b.graffiti) { drawText(g, b.graffiti, b.x + 20, gy - 30, '#b04a8a'); px(g, b.x + 18, gy - 32, textWidth(b.graffiti) + 4, 1, '#b04a8a'); }
    if (b.poster) { px(g, b.x + b.w - 42, gy - 52, 26, 32, '#d8d0b8'); px(g, b.x + b.w - 40, gy - 50, 22, 8, '#c83a3a'); drawText(g, 'LOST', b.x + b.w - 29, gy - 49, '#f0e8e0', { align: 'center' }); px(g, b.x + b.w - 36, gy - 40, 14, 12, '#8a8a92'); px(g, b.x + b.w - 33, gy - 38, 8, 8, '#d8b090'); px(g, b.x + b.w - 38, gy - 26, 18, 1, '#2a2a2a'); px(g, b.x + b.w - 38, gy - 23, 12, 1, '#2a2a2a'); }
  }
  // grime at base
  px(g, b.x, gy - 6, b.w, 6, 'rgba(0,0,0,0.18)');
}

// ---------- street scene ----------
const STREET = {
  id: 'street', w: 2460, outdoor: true,
  buildings: [
    { x: 0, w: 46, h: 204, color: '#3a2e2c', style: 'brick', seed: 3, floors: 3, roof: false, kind: 'plain' },
    { x: 46, w: 224, h: 204, color: '#6a3a30', style: 'brick', seed: 11, floors: 3, kind: 'apartment', door: 130, num: '412', name: 'HARLAN ARMS', fireEscape: true },
    // 270-310 alley gap
    { x: 310, w: 216, h: 154, color: '#4a4a3a', style: 'brick', seed: 21, floors: 2, kind: 'store', door: 412, name: "LIN'S MARKET" },
    // 526-560 gap
    { x: 560, w: 250, h: 104, color: '#5a5a62', style: 'concrete', seed: 31, floors: 1, kind: 'diner', door: 690, name: "NADIA'S", brokenSign: true },
    // 810-860 gap
    { x: 860, w: 250, h: 204, color: '#5c5c66', style: 'concrete', seed: 41, floors: 3, kind: 'laundry', name: 'WASH & FOLD', fireEscape: true },
    // 1110-1150 gap
    { x: 1150, w: 250, h: 154, color: '#8a7a62', style: 'concrete', seed: 51, floors: 2, kind: 'clinic', door: 1262, name: 'HARLAN CLINIC' },
    // 1400-1460 gap
    { x: 1460, w: 130, h: 204, color: '#5a3a3a', style: 'brick', seed: 61, floors: 3, kind: 'pawn', door: 1498, name: "SOL'S PAWN & LOAN", poster: true },
    { x: 1590, w: 380, h: 92, color: '#4a4e58', style: 'corrugated', seed: 71, floors: 0, kind: 'warehouse', name: 'MORROW FREIGHT', roof: false },
    // 1970-2040 lot gap (fence)
    { x: 2040, w: 100, h: 154, color: '#3a3a42', style: 'concrete', seed: 81, floors: 2, kind: 'plain', graffiti: 'NO ONE IS COMING' },
    // 2140-2460 river end
  ],
  lamps: [90, 300, 545, 838, 1132, 1440, 1720, 2010, 2200, 2400],
  doors: [
    { x: 130, w: 24, to: 'hall', label: 'Harlan Arms' },
    { x: 412, w: 24, to: 'store', label: "Lin's Market" },
    { x: 690, w: 26, to: 'diner', label: "Nadia's Diner" },
    { x: 1262, w: 28, to: 'clinic', label: 'Clinic' },
    { x: 1498, w: 22, to: 'pawn', label: "Sol's Pawn" },
    { x: 1730, w: 60, to: 'dock', label: 'Loading dock' },
  ],
  props: [
    { s: 'dumpster', x: 270, y: FEET_Y - 3 },
    { s: 'cardboard', x: 220, y: FEET_Y - 1 },
    { s: 'blanket', x: 250, y: FEET_Y + 1, hideIf: 'amosGone' },
    { s: 'bin', x: 330, y: FEET_Y },
    { s: 'hydrant', x: 500, y: FEET_Y },
    { s: 'mailbox', x: 640, y: FEET_Y },
    { s: 'busSign', x: 930, y: FEET_Y },
    { s: 'bench', x: 946, y: FEET_Y - 1, bench: true },
    { s: 'bin', x: 1120, y: FEET_Y },
    { s: 'bin', x: 1135, y: FEET_Y },
    { s: 'cart', x: 1420, y: FEET_Y },
    { s: 'crate', x: 1600, y: FEET_Y }, { s: 'crate', x: 1616, y: FEET_Y }, { s: 'crate', x: 1608, y: FEET_Y - 12 },
    { s: 'bench', x: 2290, y: FEET_Y - 1, bench: true },
    { s: 'bin', x: 2250, y: FEET_Y },
  ],
  cars: [{ x: 360, red: false }, { x: 1020, red: true }, { x: 1830, red: false }],
  puddles: [
    [120, 232, 44, 6], [260, 227, 22, 3], [470, 250, 60, 8], [600, 228, 30, 4], [760, 240, 40, 6], [980, 228, 50, 6],
    [1180, 254, 70, 8], [1340, 227, 24, 3], [1500, 236, 46, 6], [1660, 250, 60, 8], [1900, 229, 40, 4], [2120, 244, 60, 8], [2350, 230, 40, 5]
  ],
  spots: { amos: 236, mei: 412, walter: 962, nadia: 690, busker: 1440, dog: 2000, kid: 1300, granny: 780, worker: 1780, river: 2330, home: 142 }
};

// ---------- static street layer ----------
const World = { static: null, lights: [], signs: [], gaps: [] };
function buildStreetStatic() {
  const [c, g] = mkCanvas(STREET.w, H);
  World.lights = []; World.signs = [];
  // fill transparent; sky drawn dynamically
  // far river end: railing, water drawn dynamically. Wall bg for 2140+ none.
  // buildings
  for (const b of STREET.buildings) paintBuilding(g, b, World.lights, World.signs);
  // gaps between buildings (for light rays & alleys)
  World.gaps = [];
  const bs = STREET.buildings;
  for (let i = 0; i < bs.length - 1; i++) {
    const a = bs[i], b = bs[i + 1];
    if (b.x - (a.x + a.w) > 20) World.gaps.push({ x0: a.x + a.w, x1: b.x, top: GROUND_Y - Math.min(a.h, b.h) });
  }
  World.gaps.push({ x0: 2140, x1: 2460, top: 40 });
  // alley backs (dark walls inside gaps)
  for (const gp of World.gaps) {
    if (gp.x0 >= 2140) continue;
    px(g, gp.x0, gp.top + 30, gp.x1 - gp.x0, GROUND_Y - gp.top - 30, '#1e1c24');
    paintBrick(g, gp.x0, gp.top + 30, gp.x1 - gp.x0, GROUND_Y - gp.top - 30, '#2a2428', gp.x0);
    px(g, gp.x0, gp.top + 30, gp.x1 - gp.x0, GROUND_Y - gp.top - 30, 'rgba(0,0,0,0.45)');
    // pipes / wires
    px(g, gp.x0 + 4, gp.top + 30, 2, GROUND_Y - gp.top - 30, '#1a1a20');
    px(g, gp.x0, gp.top + 40, gp.x1 - gp.x0, 1, '#151518');
  }
  // fence at lot 1970-2040
  px(g, 1970, GROUND_Y - 40, 70, 40, 'rgba(0,0,0,0)');
  for (let x = 1970; x < 2040; x += 2) px(g, x, GROUND_Y - 40 + (x % 4 === 0 ? 0 : 2), 1, 40, 'rgba(120,130,140,0.35)');
  for (let y = GROUND_Y - 40; y < GROUND_Y; y += 4) px(g, 1970, y, 70, 1, 'rgba(120,130,140,0.35)');
  px(g, 1970, GROUND_Y - 42, 70, 2, '#6a6a72'); px(g, 1970, GROUND_Y - 42, 2, 42, '#6a6a72'); px(g, 2038, GROUND_Y - 42, 2, 42, '#6a6a72');
  // river railing 2140..2460 (drawn as posts + rails)
  px(g, 2140, GROUND_Y - 14, 320, 2, '#4a4e58'); px(g, 2140, GROUND_Y - 8, 320, 1, '#3a3e48'); px(g, 2140, GROUND_Y - 2, 320, 2, '#4a4e58');
  for (let x = 2140; x < 2460; x += 16) px(g, x, GROUND_Y - 16, 2, 16, '#5a5e68');
  px(g, 2140, GROUND_Y, 320, 2, '#5a5e68');
  // sidewalk
  px(g, 0, GROUND_Y, STREET.w, CURB_Y - GROUND_Y, '#585a62');
  px(g, 0, GROUND_Y, STREET.w, 1, '#6a6c74');
  for (let x = 0; x < STREET.w; x += 24) { px(g, x, GROUND_Y, 1, CURB_Y - GROUND_Y, '#4a4c54'); }
  px(g, 0, GROUND_Y + 9, STREET.w, 1, '#4e5058');
  const R = seeded(99);
  for (let i = 0; i < 260; i++) { const x = Math.floor(R() * STREET.w); px(g, x, GROUND_Y + 1 + Math.floor(R() * 16), 1 + Math.floor(R() * 3), 1, R() < 0.5 ? '#4c4e56' : '#62646c'); }
  // curb + road
  px(g, 0, CURB_Y - 2, STREET.w, 2, '#6c6e76'); px(g, 0, CURB_Y, STREET.w, 2, '#3a3c44');
  px(g, 0, CURB_Y + 2, STREET.w, H - CURB_Y - 2, '#2c2e36');
  for (let i = 0; i < 900; i++) { const x = Math.floor(R() * STREET.w); px(g, x, CURB_Y + 2 + Math.floor(R() * (H - CURB_Y - 2)), 1, 1, R() < 0.5 ? '#262830' : '#32343c'); }
  for (let x = 0; x < STREET.w; x += 40) px(g, x, 252, 22, 2, '#7a7a5a');
  // manholes, drains
  for (let x = 200; x < STREET.w; x += 520) { px(g, x, CURB_Y + 4, 14, 3, '#1a1a20'); px(g, x + 60, 246, 16, 6, '#3a3c44'); px(g, x + 62, 248, 12, 2, '#2a2c34'); }
  // parked cars
  // road grime at curb
  px(g, 0, CURB_Y + 2, STREET.w, 3, 'rgba(0,0,0,0.2)');
  World.static = c;
}

// ---------- interiors ----------
const interiorCache = {};
function interiorStatic(id) {
  if (interiorCache[id]) return interiorCache[id];
  const [c, g] = mkCanvas(480, 270); INTERIORS[id].paint(g); interiorCache[id] = c; return c;
}
