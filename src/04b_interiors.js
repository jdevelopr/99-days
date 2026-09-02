// ============================================================
// interiors: same-scale cutaway rooms. 1px = 4.5cm. Character = 38px (1.7m).
// Wall base (back wall meets floor) at GROUND_Y=206; characters stand at FEET_Y=221;
// things behind a counter stand at y=212. Floor visible 206..270. Ceiling at CEIL_Y.
// ============================================================
const CEIL_Y = 133;              // 3.3m ceiling
const COUNTER_TOP = 194;         // 0.8m counter: top surface 194..200, front face 200..214
const COUNTER_BASE = 214;

// ---- furniture painters (x = left edge, base = y where it meets the floor) ----
function fDoor(g, x, base, col, opts) {
  opts = opts || {}; const h = 44, w = 20; const y = base - h;
  px(g, x - 2, y - 2, w + 4, h + 2, opts.frame || '#1a1418');
  px(g, x, y, w, h, col); px(g, x, y, 1, h, shade(col, 22)); px(g, x + w - 1, y, 1, h, shade(col, -30));
  if (opts.glass) { px(g, x + 3, y + 4, w - 6, 16, '#26303c'); px(g, x + 4, y + 5, 5, 6, '#3a4a5c'); }
  else { px(g, x + 3, y + 4, w - 6, 14, shade(col, -14)); px(g, x + 3, y + 22, w - 6, 16, shade(col, -14)); }
  px(g, x + w - 5, y + 24, 3, 2, '#c8a850');
}
function fWindow(g, x, y, w, h, frame) {
  px(g, x - 2, y - 2, w + 4, h + 4, frame || '#3a3a44'); px(g, x, y, w, h, '#1a2030');
  px(g, x + Math.floor(w / 2), y, 1, h, frame || '#3a3a44'); px(g, x, y + Math.floor(h / 2), w, 1, frame || '#3a3a44');
  px(g, x - 4, y + h + 2, w + 8, 2, shade(frame || '#3a3a44', 30));
}
// counter running along the back wall between x0..x1; NPCs stand behind at y=212
function fCounter(g, x0, x1, topCol, frontCol, opts) {
  opts = opts || {};
  px(g, x0, COUNTER_TOP, x1 - x0, 6, topCol); px(g, x0, COUNTER_TOP, x1 - x0, 1, shade(topCol, 30));
  px(g, x0, COUNTER_TOP + 6, x1 - x0, COUNTER_BASE - COUNTER_TOP - 6, frontCol);
  px(g, x0, COUNTER_TOP + 6, x1 - x0, 1, shade(frontCol, 20)); px(g, x0, COUNTER_BASE - 1, x1 - x0, 1, shade(frontCol, -30));
  if (opts.panels) for (let x = x0 + 6; x < x1 - 6; x += 22) px(g, x, COUNTER_TOP + 9, 14, 8, shade(frontCol, -12));
  if (opts.chrome) { px(g, x0, COUNTER_TOP + 6, x1 - x0, 2, '#d8d8e0'); px(g, x0, COUNTER_BASE - 3, x1 - x0, 2, '#d8d8e0'); }
  px(g, x0, COUNTER_BASE, x1 - x0, 2, 'rgba(0,0,0,0.35)');
}
function fShelf(g, x, base, w, h, cols, seed) {
  const R = seeded(seed || x);
  px(g, x, base - h, w, h, '#5a4636'); px(g, x, base - h, 1, h, '#7a6650'); px(g, x + w - 1, base - h, 1, h, '#3a2a1e');
  const rows = Math.floor(h / 12);
  for (let r = 0; r < rows; r++) {
    const sy = base - h + 3 + r * 12; px(g, x + 1, sy + 9, w - 2, 2, '#3a2a1e');
    for (let ix = x + 2; ix < x + w - 4; ix += 4) { if (R() < 0.15) continue; px(g, ix, sy, 3, 9, cols[Math.floor(R() * cols.length)]); px(g, ix, sy, 3, 1, 'rgba(255,255,255,0.3)'); }
  }
  px(g, x, base, w, 2, 'rgba(0,0,0,0.35)');
}
function fFridge(g, x, base, w, h) {
  px(g, x, base - h, w, h, '#c8ccd0'); px(g, x + 1, base - h + 1, w - 2, h - 2, '#2a3a44');
  const rows = Math.floor((h - 6) / 12);
  for (let r = 0; r < rows; r++) { const sy = base - h + 4 + r * 12; px(g, x + 2, sy + 9, w - 4, 1, '#8ab0c0'); for (let ix = x + 3; ix < x + w - 4; ix += 4) px(g, ix, sy, 3, 8, ['#e8e8f0', '#e8b84a', '#d84a4a', '#4a8ad8', '#8a4a9a'][(ix + r) % 5]); }
  px(g, x + 1, base - h + 1, w - 2, 1, '#e8f0ff'); px(g, x + w - 3, base - h + 8, 1, h - 16, '#e8ecf0');
  px(g, x, base, w, 2, 'rgba(0,0,0,0.35)');
}
function fTable(g, x, base, w, col) { const h = 17; px(g, x, base - h, w, 3, col); px(g, x, base - h, w, 1, shade(col, 25)); px(g, x + 2, base - h + 3, 2, h - 3, shade(col, -20)); px(g, x + w - 4, base - h + 3, 2, h - 3, shade(col, -20)); }
function fChair(g, x, base, col, dir) { const seat = 10, back = 20; px(g, x, base - seat, 10, 2, col); px(g, x + 1, base - seat + 2, 1, seat - 2, shade(col, -20)); px(g, x + 8, base - seat + 2, 1, seat - 2, shade(col, -20)); if (dir > 0) { px(g, x, base - back, 2, back - seat, col); px(g, x, base - back, 10, 1, col); } else { px(g, x + 8, base - back, 2, back - seat, col); px(g, x, base - back, 10, 1, col); } }
function fStool(g, x, base) { px(g, x, base - 17, 10, 3, '#c83a3a'); px(g, x, base - 17, 10, 1, '#e86a6a'); px(g, x + 4, base - 14, 2, 14, '#8a8a92'); px(g, x + 1, base - 1, 8, 1, '#6a6a72'); }
function fBed(g, x, base, w, headRight) {
  // frame 2m long; mattress top 0.5m; headboard 0.9m
  px(g, x, base - 12, w, 12, '#4a3428'); px(g, x, base - 12, w, 1, '#6a4a38');
  px(g, x + 1, base - 18, w - 2, 7, '#7a7a96'); px(g, x + 1, base - 18, w - 2, 1, '#9a9ab4');   // mattress
  px(g, x + 1, base - 11, w - 2, 5, '#3a3050');                                                    // hanging blanket edge
  const hx = headRight ? x + w - 3 : x; px(g, hx, base - 20, 3, 20, '#4a3428'); px(g, hx, base - 20, 3, 1, '#6a4a38');
  const pxl = headRight ? x + w - 16 : x + 3; px(g, pxl, base - 21, 13, 4, '#e0e0e8');            // pillow
  px(g, x, base - 1, 2, 1, '#2a1a10'); px(g, x + w - 2, base - 1, 2, 1, '#2a1a10');
}
function fRadiator(g, x, base, w) { for (let i = 0; i < w; i += 4) px(g, x + i, base - 13, 3, 13, '#6a6a72'); px(g, x, base - 14, w, 1, '#8a8a92'); px(g, x, base - 13, w, 1, '#7a7a82'); }
function fPendant(g, x, ceil, drop, col) { px(g, x, ceil, 1, drop, '#2a2a30'); px(g, x - 7, ceil + drop, 15, 5, col); px(g, x - 5, ceil + drop + 5, 11, 2, '#f8e8a0'); }
function fBulb(g, x, ceil, drop) { px(g, x, ceil, 1, drop, '#2a2a30'); px(g, x - 3, ceil + drop, 7, 6, '#e8d8a0'); px(g, x - 2, ceil + drop + 6, 5, 2, '#f8f0c0'); }
function fPoster(g, x, y, w, h, col, text) { px(g, x, y, w, h, '#ece8e0'); px(g, x + 2, y + 2, w - 4, Math.floor(h * 0.5), col); if (text) drawText(g, text, x + w / 2, y + Math.floor(h * 0.5) + 5, '#3a3a44', { align: 'center' }); }
function fBooth(g, x, base) { // two facing benches with a table; 1.6m wide
  px(g, x, base - 24, 6, 24, '#a83030'); px(g, x, base - 24, 6, 1, '#c85050'); px(g, x, base - 10, 14, 3, '#a83030');
  px(g, x + 14, base - 17, 18, 2, '#e8e8f0'); px(g, x + 22, base - 15, 2, 15, '#8a8a92');
  px(g, x + 32, base - 10, 14, 3, '#a83030'); px(g, x + 40, base - 24, 6, 24, '#a83030'); px(g, x + 40, base - 24, 6, 1, '#c85050');
}

// ---- room shell ----
function paintRoom(g, I, wallCol, floorCol, floorLine) {
  // building mass everywhere
  px(g, 0, 0, 480, 270, '#0d0d12');
  paintBrick(g, 0, 0, 480, 270, '#2a2226', 77); px(g, 0, 0, 480, 270, 'rgba(6,6,10,0.55)');
  const ceil = I.ceil || CEIL_Y;
  const FLOOR_END = 252;
  // room walls
  px(g, I.x0, ceil, I.x1 - I.x0, GROUND_Y - ceil, wallCol);
  // floor (perspective): from wall base to the front cut edge
  const fl = g.createLinearGradient(0, GROUND_Y, 0, FLOOR_END); fl.addColorStop(0, floorCol); fl.addColorStop(1, shade(floorCol, -30));
  g.fillStyle = fl; g.fillRect(I.x0, GROUND_Y, I.x1 - I.x0, FLOOR_END - GROUND_Y);
  if (floorLine) { g.save(); g.beginPath(); g.rect(I.x0, GROUND_Y, I.x1 - I.x0, FLOOR_END - GROUND_Y); g.clip(); floorLine(g); g.restore(); }
  // floor slab (cut edge) and foundation below
  px(g, I.x0 - 4, FLOOR_END, I.x1 - I.x0 + 8, 7, '#1e1e26'); px(g, I.x0 - 4, FLOOR_END, I.x1 - I.x0 + 8, 1, '#3a3a44');
  px(g, I.x0 - 4, FLOOR_END + 7, I.x1 - I.x0 + 8, 270 - FLOOR_END - 7, 'rgba(0,0,0,0.35)');
  // baseboard
  px(g, I.x0, GROUND_Y - 4, I.x1 - I.x0, 4, shade(wallCol, -30)); px(g, I.x0, GROUND_Y - 4, I.x1 - I.x0, 1, shade(wallCol, -10));
  // cornice + ceiling slab
  px(g, I.x0, ceil, I.x1 - I.x0, 2, shade(wallCol, 18));
  px(g, I.x0 - 4, ceil - 8, I.x1 - I.x0 + 8, 8, '#1e1e26'); px(g, I.x0 - 4, ceil - 8, I.x1 - I.x0 + 8, 1, '#34343e');
  // side walls (cut)
  px(g, I.x0 - 4, ceil - 8, 4, 260 - ceil + 8, '#1e1e26'); px(g, I.x1, ceil - 8, 4, 260 - ceil + 8, '#1e1e26');
  px(g, I.x0 - 1, ceil, 1, GROUND_Y - ceil, shade(wallCol, -40)); px(g, I.x1, ceil, 1, GROUND_Y - ceil, shade(wallCol, -40));
}

const INTERIORS = {
  // ---------------- APARTMENT: 9m studio ----------------
  apartment: {
    id: 'apartment', outdoor: false, floorY: FEET_Y, x0: 140, x1: 340, ceil: CEIL_Y, ambient: [96, 86, 82],
    lamp: { x: 240, y: CEIL_Y + 22 }, window: { x: 214, y: 158, w: 22, h: 28 },
    doors: [{ x: 148, w: 20, to: 'hall', label: 'Hallway', at: 'flat' }], spawnX: 178, spawnDir: 1,
    spots: { bed: 312, table: 258, sink: 190 }, bed: { x: 290, w: 44 },
    paint(g) {
      const I = this; paintRoom(g, I, '#3e3a40', '#5a4a3a', gg => { for (let x = I.x0; x < I.x1; x += 24) px(gg, x, GROUND_Y, 1, 64, 'rgba(0,0,0,0.18)'); for (let y = GROUND_Y + 8; y < 270; y += 8) px(gg, I.x0, y, I.x1 - I.x0, 1, 'rgba(0,0,0,0.12)'); });
      // wallpaper pattern + water stain
      for (let y = CEIL_Y + 4; y < GROUND_Y - 4; y += 6) for (let x = I.x0 + 2; x < I.x1 - 2; x += 12) if (((x - I.x0) / 12 + (y - CEIL_Y) / 6) % 2 === 0) px(g, x, y, 6, 3, 'rgba(255,255,255,0.03)');
      px(g, I.x0 + 20, CEIL_Y, 30, 40, 'rgba(60,45,30,0.35)'); px(g, I.x0 + 28, CEIL_Y, 14, 58, 'rgba(60,45,30,0.25)');
      fDoor(g, 148, GROUND_Y, '#5a3a2a');
      // kitchenette: sink counter 0.9m, shelf with cans above
      px(g, 176, COUNTER_TOP + 8, 34, 12, '#6a6a72'); px(g, 176, COUNTER_TOP, 34, 8, '#8a8a92'); px(g, 176, COUNTER_TOP, 34, 1, '#a8a8b0'); px(g, 183, COUNTER_TOP + 2, 20, 5, '#5a5a62'); px(g, 192, COUNTER_TOP - 8, 2, 9, '#b0b0b8'); px(g, 190, COUNTER_TOP - 9, 6, 1, '#b0b0b8');
      px(g, 178, 152, 30, 2, '#5a3a2a'); for (let i = 0; i < 4; i++) px(g, 181 + i * 7, 145, 5, 7, ['#8a3a3a', '#3a6a8a', '#c8a84a', '#4a8a4a'][i]);
      // post-it on the cabinet
      px(g, 197, 158, 11, 11, '#e8d860'); px(g, 197, 158, 11, 2, '#f0e890'); px(g, 199, 162, 7, 1, '#6a6040'); px(g, 199, 165, 5, 1, '#6a6040'); px(g, 206, 167, 2, 2, '#c8b850');
      // window + radiator
      fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#2a2a30'); fRadiator(g, 212, GROUND_Y, 26);
      // table, chair, pills, cup
      fTable(g, 244, GROUND_Y + 4, 28, '#6a4a2a'); g.drawImage(SPR.pill, 250, GROUND_Y + 4 - 17 - 5); g.drawImage(SPR.coffee, 260, GROUND_Y + 4 - 17 - 5); fChair(g, 276, GROUND_Y + 6, '#5a3a1a', -1);
      // bed against right wall, head at right
      if (G && G.flags && G.flags.betterBed) { const bx = this.bed.x - 4, bw = this.bed.w + 4, base = GROUND_Y + 8; px(g, bx, base - 14, bw, 14, '#5a3a2a'); px(g, bx, base - 14, bw, 1, '#7a5a3a'); px(g, bx + 1, base - 22, bw - 2, 9, '#a8a8c8'); px(g, bx + 1, base - 22, bw - 2, 1, '#c8c8e8'); px(g, bx + 1, base - 13, bw - 2, 6, '#6a4a7a'); px(g, bx + bw - 4, base - 30, 4, 30, '#5a3a2a'); px(g, bx + bw - 18, base - 25, 14, 5, '#f0f0f8'); px(g, bx + bw - 34, base - 25, 14, 5, '#f0f0f8'); } else fBed(g, this.bed.x, GROUND_Y + 8, this.bed.w, true);
      // (the wall phone is an entity; see 09h)
      // calendar + photo
      px(g, 262, 150, 16, 20, '#e8e0d0'); px(g, 262, 150, 16, 5, '#b03a30'); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) px(g, 264 + c * 3, 158 + r * 3, 2, 2, '#c8c0b0');
      px(g, 160, 156, 10, 12, '#3a3a40'); px(g, 161, 157, 8, 10, '#7a8a9a');
      fBulb(g, this.lamp.x, CEIL_Y, 16);
    },
    fg(g) { /* nothing in front */ }
  },
  // ---------------- LIN'S MARKET: 15m ----------------
  store: {
    id: 'store', outdoor: false, floorY: FEET_Y, x0: 70, x1: 410, ceil: CEIL_Y, ambient: [130, 135, 130], cool: true,
    lamp: { x: 240, y: CEIL_Y + 6 }, window: { x: 330, y: 150, w: 46, h: 40 },
    doors: [{ x: 384, w: 20, to: 'street', label: 'Street', at: 'mei' }], spawnX: 360, spawnDir: -1,
    spots: { counter: 138 },
    paint(g) {
      const I = this; paintRoom(g, I, '#d0ccc0', '#b8b4a0', gg => { for (let y = GROUND_Y; y < 270; y += 10) for (let x = I.x0; x < I.x1; x += 10) if (((x - I.x0) / 10 + (y - GROUND_Y) / 10) % 2) px(gg, x, y, 10, 10, 'rgba(0,0,0,0.08)'); });
      for (let y = CEIL_Y + 6; y < GROUND_Y - 4; y += 8) px(g, I.x0, y, I.x1 - I.x0, 1, 'rgba(0,0,0,0.05)');
      // fridges along the left wall (1.7m tall)
      fFridge(g, 74, GROUND_Y, 18, 38); fFridge(g, 93, GROUND_Y, 18, 38);
      // counter with register, tip jar
      fCounter(g, 116, 176, '#8a6a4a', '#6a4a3a', { panels: true });
      px(g, 122, COUNTER_TOP - 10, 16, 10, '#4a4a52'); px(g, 124, COUNTER_TOP - 14, 12, 5, '#7a8a9a'); px(g, 150, COUNTER_TOP - 8, 8, 8, '#c8d8e0'); px(g, 152, COUNTER_TOP - 5, 4, 4, '#c8a850');
      // shelving units 1.8m tall
      const cols = ['#c83a3a', '#3a6ac8', '#e8c84a', '#4a9a4a', '#e88a3a', '#8a4a9a'];
      for (let i = 0; i < 5; i++) fShelf(g, 196 + i * 26, GROUND_Y, 22, 40, cols, 11 + i);
      // storefront window right of the door, sign
      fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#2a3a2a');
      fDoor(g, 384, GROUND_Y, '#2a3a2a', { glass: true });
      drawText(g, 'OPEN 7-11', 146, 150, '#8a3a30'); px(g, 122, 158, 50, 1, '#8a3a30');
      fPoster(g, 240, 142, 22, 26, '#4a8ad8', 'SALE');
      // fluorescent tubes on the ceiling
      for (let i = 0; i < 3; i++) { px(g, 100 + i * 110, CEIL_Y + 2, 60, 3, '#f0f0e8'); px(g, 100 + i * 110, CEIL_Y + 5, 60, 1, '#c8c8c0'); }
    },
    fg(g) { fCounter(g, 116, 176, '#8a6a4a', '#6a4a3a', { panels: true }); px(g, 122, COUNTER_TOP - 10, 16, 10, '#4a4a52'); px(g, 124, COUNTER_TOP - 14, 12, 5, '#7a8a9a'); px(g, 150, COUNTER_TOP - 8, 8, 8, '#c8d8e0'); px(g, 152, COUNTER_TOP - 5, 4, 4, '#c8a850'); g.drawImage(SPR.sketchbook, 160, COUNTER_TOP + 1); }
  },
  // ---------------- NADIA'S: 18m ----------------
  diner: {
    id: 'diner', outdoor: false, floorY: FEET_Y, x0: 40, x1: 440, ceil: CEIL_Y, ambient: [150, 120, 100],
    lamp: { x: 240, y: CEIL_Y + 30 }, window: { x: 70, y: 146, w: 70, h: 36 },
    doors: [{ x: 46, w: 20, to: 'street', label: 'Street', at: 'nadia' }], spawnX: 78, spawnDir: 1,
    spots: { counter: 250, kitchen: 410, booth: 100 },
    paint(g) {
      const I = this; paintRoom(g, I, '#7a3e3e', '#e8e4d8', gg => { for (let y = GROUND_Y; y < 270; y += 8) for (let x = I.x0; x < I.x1; x += 8) if (((x - I.x0) / 8 + (y - GROUND_Y) / 8) % 2) px(gg, x, y, 8, 8, '#2a2a30'); });
      // wainscot + chrome band at 1.1m
      px(g, I.x0, GROUND_Y - 26, I.x1 - I.x0, 22, '#d8c8a8'); for (let x = I.x0; x < I.x1; x += 12) px(g, x, GROUND_Y - 26, 1, 22, '#c8b898');
      px(g, I.x0, GROUND_Y - 28, I.x1 - I.x0, 2, '#d8d8e0');
      // windows behind the booths (1.1m sill)
      fWindow(g, 70, 146, 70, 36, '#c8c8d0'); drawText(g, "S'AIDAN", 105, 154, '#ff5a7a', { align: 'center' });
      fDoor(g, 46, GROUND_Y, '#3a2a34', { glass: true, frame: '#c8c8d0' });
      // booth in front of the window
      fBooth(g, 74, GROUND_Y + 12);
      // counter (chrome trim) with pie case, coffee pot, napkins; stools in front
      fCounter(g, 160, 360, '#e8e8f0', '#c83a3a', { chrome: true });
      px(g, 170, COUNTER_TOP - 12, 22, 12, '#c8d8e0'); px(g, 173, COUNTER_TOP - 8, 6, 6, '#c8a850'); px(g, 182, COUNTER_TOP - 8, 6, 6, '#8a3a3a');
      px(g, 300, COUNTER_TOP - 10, 9, 10, '#4a4a52'); px(g, 302, COUNTER_TOP - 8, 5, 5, '#2a1a10'); px(g, 330, COUNTER_TOP - 5, 10, 5, '#e8e8f0');
      // back bar: coffee machine, shelves with cups
      px(g, 200, 150, 120, 2, '#8a8a92'); for (let i = 0; i < 10; i++) px(g, 204 + i * 12, 144, 6, 6, '#e8e8f0');
      px(g, 260, 158, 24, 28, '#4a4a52'); px(g, 264, 162, 16, 8, '#2a2a30'); px(g, 266, 176, 12, 6, '#8a8a92');
      // menu board
      px(g, 166, 140, 60, 30, '#1a1a20'); drawText(g, 'COFFEE 2', 170, 143, '#e8e0c8'); drawText(g, 'EGGS 7', 170, 152, '#e8e0c8'); drawText(g, 'PIE 5   SOUP 8', 170, 161, '#e8e0c8');
      // kitchen door with porthole + pass-through
      fDoor(g, 402, GROUND_Y, '#8a8a92', { frame: '#c8c8d0' }); px(g, 408, GROUND_Y - 36, 8, 8, '#3a3a40');
      px(g, 370, 150, 26, 18, '#3a3a40'); px(g, 372, 152, 22, 14, '#5a4a3a');
      // pendant lamps at 2.2m
      for (let i = 0; i < 3; i++) fPendant(g, 200 + i * 60, CEIL_Y, 24, '#e8b84a');
      // clock
      px(g, 120, 142, 12, 12, '#e8e8f0'); px(g, 125, 145, 2, 5, '#2a2a30'); px(g, 126, 148, 4, 1, '#2a2a30');
    },
    fg(g) {
      fCounter(g, 160, 360, '#e8e8f0', '#c83a3a', { chrome: true });
      px(g, 170, COUNTER_TOP - 12, 22, 12, '#c8d8e0'); px(g, 173, COUNTER_TOP - 8, 6, 6, '#c8a850'); px(g, 182, COUNTER_TOP - 8, 6, 6, '#8a3a3a');
      px(g, 300, COUNTER_TOP - 10, 9, 10, '#4a4a52'); px(g, 302, COUNTER_TOP - 8, 5, 5, '#2a1a10'); px(g, 330, COUNTER_TOP - 5, 10, 5, '#e8e8f0');
      for (let i = 0; i < 5; i++) fStool(g, 176 + i * 40, COUNTER_BASE + 4);
      // booth table front bench (in front of Sam)
      px(g, 106, GROUND_Y + 2, 14, 3, '#a83030'); px(g, 114, GROUND_Y - 12, 6, 24, '#a83030'); px(g, 114, GROUND_Y - 12, 6, 1, '#c85050');
    }
  },
  // ---------------- CLINIC: 14m ----------------
  clinic: {
    id: 'clinic', outdoor: false, floorY: FEET_Y, x0: 80, x1: 400, ceil: CEIL_Y, ambient: [140, 150, 160], cool: true,
    lamp: { x: 240, y: CEIL_Y + 2 }, window: { x: 214, y: 150, w: 30, h: 32 },
    doors: [{ x: 86, w: 20, to: 'street', label: 'Street', at: 'clinic' }], spawnX: 118, spawnDir: 1,
    spots: { desk: 320, chairs: 150 },
    paint(g) {
      const I = this; paintRoom(g, I, '#dce2e6', '#c0c8cc', gg => { for (let y = GROUND_Y; y < 270; y += 12) for (let x = I.x0; x < I.x1; x += 12) if (((x - I.x0) / 12 + (y - GROUND_Y) / 12) % 2) px(gg, x, y, 12, 12, 'rgba(0,0,0,0.07)'); });
      px(g, I.x0, GROUND_Y - 30, I.x1 - I.x0, 26, '#a8c0c8'); px(g, I.x0, GROUND_Y - 30, I.x1 - I.x0, 1, '#88a0a8');
      fDoor(g, 86, GROUND_Y, '#8ab0c8', { glass: true, frame: '#c8ccd4' });
      // waiting chairs (0.45 seat)
      for (let i = 0; i < 4; i++) fChair(g, 120 + i * 14, GROUND_Y + 6, '#4a6a8a', 1);
      fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#8a9aa2');
      // reception desk with monitor + clipboard, doctor behind
      fCounter(g, 280, 364, '#eef0f4', '#c8ccd4', {});
      px(g, 296, COUNTER_TOP - 12, 14, 11, '#3a3a44'); px(g, 297, COUNTER_TOP - 11, 12, 8, '#5a8ac8'); px(g, 330, COUNTER_TOP - 3, 14, 3, '#f0f0f4');
      // posters + trial flyer
      fPoster(g, 260, 140, 22, 28, '#4a8ad8', 'WASH'); fPoster(g, 370, 140, 22, 28, '#d84a4a', 'TRIAL');
      // plant (1.2m)
      px(g, 384, GROUND_Y - 10, 10, 10, '#8a5a3a'); px(g, 380, GROUND_Y - 26, 18, 16, '#3a7a4a'); px(g, 384, GROUND_Y - 30, 10, 6, '#4a9a5a');
      // fluorescent panel
      px(g, 200, CEIL_Y + 2, 80, 3, '#f8f8ff'); px(g, 200, CEIL_Y + 5, 80, 1, '#c8d0d8');
    },
    fg(g) { fCounter(g, 280, 364, '#eef0f4', '#c8ccd4', {}); px(g, 296, COUNTER_TOP - 12, 14, 11, '#3a3a44'); px(g, 297, COUNTER_TOP - 11, 12, 8, '#5a8ac8'); px(g, 330, COUNTER_TOP - 3, 14, 3, '#f0f0f4'); }
  },
  // ---------------- LOADING DOCK: warehouse floor, 6m ceiling ----------------
  dock: {
    id: 'dock', outdoor: false, floorY: FEET_Y, x0: 0, x1: 480, ceil: 73, ambient: [110, 100, 90],
    lamp: { x: 240, y: 100 }, window: null,
    doors: [{ x: 12, w: 40, to: 'street', label: 'Street', at: 'dock' }], spawnX: 60, spawnDir: 1,
    spots: { boss: 120, stack: 300 },
    paint(g) {
      const I = this; paintRoom(g, I, '#3a3e48', '#4a4a50', gg => { for (let x = 0; x < 480; x += 40) px(gg, x, GROUND_Y, 1, 64, 'rgba(0,0,0,0.2)'); px(gg, 0, GROUND_Y + 22, 480, 2, '#e8a020'); });
      paintCorrugated(g, 0, 73, 480, GROUND_Y - 73 - 4, '#3a3e48');
      // roll-up door (open) at left
      px(g, 8, GROUND_Y - 60, 48, 60, '#1a1a20'); px(g, 8, GROUND_Y - 62, 48, 3, '#e8a020'); for (let y = 0; y < 8; y += 4) px(g, 8, GROUND_Y - 60 + y, 48, 1, '#4a4e58');
      // racking 3m tall with crates
      for (let i = 0; i < 3; i++) {
        const rx = 100 + i * 130; px(g, rx, GROUND_Y - 66, 3, 66, '#5a5a62'); px(g, rx + 97, GROUND_Y - 66, 3, 66, '#5a5a62');
        for (let s = 0; s < 3; s++) { const sy = GROUND_Y - 66 + s * 22; px(g, rx, sy, 100, 2, '#7a7a82'); for (let k = 0; k < 6; k++) if ((k + s + i) % 4 !== 3) g.drawImage(SPR.crate, rx + 4 + k * 16, sy + 2 + 8); }
      }
      // hanging lamps
      for (let i = 0; i < 3; i++) { px(g, 80 + i * 160, 73, 1, 22, '#1a1a20'); px(g, 70 + i * 160, 95, 21, 5, '#4a4a52'); px(g, 72 + i * 160, 100, 17, 2, '#f8e8a0'); }
      // forklift (2m tall, 2.5m long)
      px(g, 400, GROUND_Y - 22, 50, 20, '#e8a020'); px(g, 404, GROUND_Y - 44, 22, 22, '#1a1a20'); px(g, 406, GROUND_Y - 42, 18, 12, '#3a4a5a'); px(g, 450, GROUND_Y - 44, 4, 44, '#3a3a40'); px(g, 454, GROUND_Y - 4, 22, 3, '#5a5a62');
      px(g, 404, GROUND_Y - 6, 12, 8, '#1a1a20'); px(g, 434, GROUND_Y - 6, 12, 8, '#1a1a20');
      // signage
      px(g, 200, 90, 80, 12, '#3a3a44'); drawText(g, 'BAY 2', 240, 92, '#e8a020', { align: 'center' });
    },
    fg(g) { }
  }
};

// ---------------- THE BASEMENT: Amos's room under Harlan Arms (2.4m ceiling, no window) ----------------
INTERIORS.basement = {
  id: 'basement', outdoor: false, floorY: FEET_Y, x0: 110, x1: 370, ceil: GROUND_Y - 53, ambient: [96, 84, 74],
  lamp: { x: 250, y: GROUND_Y - 53 + 14 }, window: null,
  doors: [
    { x: 122, w: 20, to: 'street', label: 'Stairs', stairs: true },
    { x: 324, w: 32, to: 'street', label: 'Elevator', elevator: true },
  ],
  spawnX: 152, spawnDir: 1, spawns: { stairs: 152, elevator: 336 },
  spots: { chair: 232, bench: 292 },
  paint(g) {
    const I = this; const ceil = I.ceil;
    paintRoom(g, I, '#4a4642', '#3e3a38', gg => { for (let x = I.x0; x < I.x1; x += 20) px(gg, x, GROUND_Y, 1, 46, 'rgba(0,0,0,0.2)'); for (let y = GROUND_Y + 10; y < 252; y += 10) px(gg, I.x0, y, I.x1 - I.x0, 1, 'rgba(0,0,0,0.15)'); });
    // bare block wall, damp corner
    for (let y = ceil + 2; y < GROUND_Y - 4; y += 6) for (let x = I.x0 + ((y / 6) % 2 ? 0 : 8); x < I.x1; x += 16) px(g, x, y, 15, 5, 'rgba(255,255,255,0.025)');
    px(g, I.x0, ceil, 34, GROUND_Y - ceil, 'rgba(30,40,50,0.35)');
    // pipes along the ceiling, boiler at the right
    px(g, I.x0, ceil + 4, I.x1 - I.x0, 3, '#5a5a62'); px(g, I.x0, ceil + 9, I.x1 - I.x0, 2, '#4a3a2a'); px(g, 340, ceil + 4, 3, 24, '#5a5a62');
    px(g, 336, GROUND_Y - 40, 26, 40, '#5a5a62'); px(g, 338, GROUND_Y - 38, 22, 36, '#6a6a72'); px(g, 344, GROUND_Y - 30, 10, 10, '#3a3a40'); px(g, 347, GROUND_Y - 27, 4, 4, '#e88a3a'); px(g, 340, GROUND_Y - 12, 18, 2, '#4a4a52');
    // stairwell door + elevator (the car opens down here too)
    fDoor(g, 122, GROUND_Y, '#5a5e68', { frame: '#2a2a30' }); px(g, 124, GROUND_Y - 22, 16, 2, '#8a8a92');
    px(g, 320, GROUND_Y - 50, 40, 50, '#2a2a30'); px(g, 324, GROUND_Y - 44, 32, 44, '#8a7a4a'); px(g, 339, GROUND_Y - 44, 2, 44, '#2a2a30'); px(g, 324, GROUND_Y - 44, 32, 1, '#c8b070');
    px(g, 328, GROUND_Y - 56, 24, 8, '#1a1a20'); for (let i = 0; i < 5; i++) px(g, 330 + i * 5, GROUND_Y - 54, 3, 4, i === 0 ? '#e8b84a' : '#3a3a44');
    // cot with a folded army blanket
    fBed(g, 160, GROUND_Y + 8, 40, false); px(g, 172, GROUND_Y - 12, 20, 4, '#5a5e42');
    // the one chair
    fChair(g, 228, GROUND_Y + 6, '#6a4a2a', -1);
    // workbench: scrap oak, a hand plane, the beginnings of a shelf
    fTable(g, 270, GROUND_Y + 2, 44, '#5a4a3a'); px(g, 274, GROUND_Y + 2 - 21, 8, 4, '#8a6a3a'); px(g, 286, GROUND_Y + 2 - 20, 14, 3, '#a8845a'); px(g, 302, GROUND_Y + 2 - 22, 3, 5, '#3a3a40');
    px(g, 262, GROUND_Y - 6, 6, 6, '#8a6a3a'); px(g, 262, GROUND_Y - 12, 6, 6, '#a8845a'); px(g, 256, GROUND_Y - 6, 6, 6, '#8a6a3a');
    // a shelf with nothing on it, a carved bird, a dying plant
    px(g, 200, ceil + 24, 40, 2, '#6a5a4a'); px(g, 200, ceil + 26, 2, 6, '#6a5a4a'); px(g, 238, ceil + 26, 2, 6, '#6a5a4a');
    px(g, 216, ceil + 18, 6, 4, '#a8845a'); px(g, 221, ceil + 17, 2, 2, '#a8845a');
    px(g, 148, GROUND_Y - 8, 8, 8, '#8a5a3a'); px(g, 146, GROUND_Y - 16, 12, 8, '#4a6a3a'); px(g, 150, GROUND_Y - 19, 4, 4, '#6a8a4a');
    // hot plate + mug, extension cord, bare bulb
    px(g, 314, GROUND_Y - 24, 14, 4, '#3a3a40'); px(g, 316, GROUND_Y - 27, 10, 3, '#2a2a30'); g.drawImage(SPR.coffee, 304, GROUND_Y - 24);
    fBulb(g, this.lamp.x, ceil, 14);
    // a milk crate of books, a calendar with days crossed off
    px(g, 210, GROUND_Y - 10, 14, 10, '#8a3a3a'); px(g, 212, GROUND_Y - 16, 4, 6, '#e8e0d0'); px(g, 217, GROUND_Y - 15, 4, 5, '#3a6a8a');
    px(g, 290, ceil + 16, 16, 20, '#e8e0d0'); px(g, 290, ceil + 16, 16, 5, '#3a6a8a'); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) px(g, 292 + c * 3, ceil + 24 + r * 3, 2, 2, (r * 4 + c) < 7 ? '#a83030' : '#c8c0b0');
  },
  fg(g) { }
};

// ---------------- SOL'S PAWN & LOAN: 13m, a cage, and forty-one years of other people's things ----------------
INTERIORS.pawn = {
  id: 'pawn', outdoor: false, floorY: FEET_Y, x0: 90, x1: 390, ceil: CEIL_Y, ambient: [118, 104, 86],
  lamp: { x: 240, y: CEIL_Y + 18 }, window: { x: 100, y: 150, w: 40, h: 40 },
  doors: [{ x: 150, w: 20, to: 'street', label: 'Street', at: 'pawn' }], spawnX: 180, spawnDir: 1,
  spots: { counter: 300 },
  paint(g) {
    const I = this; paintRoom(g, I, '#4a4038', '#5a4a3a', gg => { for (let x = I.x0; x < I.x1; x += 12) px(gg, x, GROUND_Y, 1, 46, 'rgba(0,0,0,0.18)'); });
    for (let y = CEIL_Y + 6; y < GROUND_Y - 4; y += 8) px(g, I.x0, y, I.x1 - I.x0, 1, 'rgba(0,0,0,0.06)');
    // front window (street side) and door
    fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#2a2226');
    for (let x = 102; x < 140; x += 4) px(g, x, 150, 1, 40, 'rgba(120,110,90,0.4)');
    fDoor(g, 150, GROUND_Y, '#3a2a24', { glass: true });
    // wall of clocks
    for (let i = 0; i < 6; i++) { const cx = 190 + (i % 3) * 22, cy = CEIL_Y + 10 + Math.floor(i / 3) * 18; px(g, cx, cy, 12, 12, '#e8e0d0'); px(g, cx, cy, 12, 1, '#8a7a5a'); px(g, cx + 5, cy + 3, 2, 4, '#2a2a30'); px(g, cx + 6, cy + 6, 3, 1, '#2a2a30'); }
    // shelves of junk: lamps, a typewriter, a trumpet case, boots, a radio, a stack of records
    fShelf(g, 180, GROUND_Y, 22, 40, ['#8a6a3a', '#c8c8d0', '#3a3a40', '#c8a850', '#5a3a2a'], 3);
    fShelf(g, 206, GROUND_Y, 22, 40, ['#3a5a8a', '#e8e0d0', '#8a3a3a', '#8a8a92', '#4a4a52'], 4);
    px(g, 232, GROUND_Y - 40, 40, 40, '#4a3a2a'); px(g, 232, GROUND_Y - 40, 40, 2, '#6a5a4a'); px(g, 232, GROUND_Y - 20, 40, 2, '#6a5a4a');
    px(g, 236, GROUND_Y - 36, 14, 10, '#3a3a40'); px(g, 238, GROUND_Y - 34, 10, 4, '#8a8a92'); // typewriter
    px(g, 254, GROUND_Y - 34, 14, 8, '#2a2226'); px(g, 256, GROUND_Y - 32, 10, 4, '#c8a850'); // trumpet case, open
    px(g, 236, GROUND_Y - 16, 8, 12, '#5a3a2a'); px(g, 246, GROUND_Y - 16, 8, 12, '#5a3a2a'); px(g, 258, GROUND_Y - 14, 12, 10, '#3a3a40'); // boots, radio
    // guitars on the wall
    px(g, 150, CEIL_Y + 10, 10, 26, '#8a5a2a'); px(g, 154, CEIL_Y + 4, 2, 10, '#3a2a1a'); px(g, 164, CEIL_Y + 12, 10, 26, '#a86a3a'); px(g, 168, CEIL_Y + 6, 2, 10, '#3a2a1a');
    // the counter with a brass cage above it; the ledger; the case underneath
    fCounter(g, 262, 372, '#8a7a5a', '#4a3a2a', { panels: true });
    for (let x = 264; x < 372; x += 5) px(g, x, COUNTER_TOP - 40, 1, 40, 'rgba(200,170,90,0.5)'); for (let y = COUNTER_TOP - 40; y < COUNTER_TOP; y += 6) px(g, 264, y, 108, 1, 'rgba(200,170,90,0.5)');
    px(g, 300, COUNTER_TOP - 26, 30, 26, 'rgba(0,0,0,0)'); // the window in the cage
    px(g, 270, COUNTER_TOP - 8, 18, 6, '#3a2a24'); px(g, 272, COUNTER_TOP - 7, 14, 4, '#e8e0d0'); // the ledger
    px(g, 340, COUNTER_TOP - 6, 8, 5, '#c8a850'); px(g, 352, COUNTER_TOP - 5, 6, 4, '#8a8a92'); // loupe, scale
    // glass case in front-left of the counter with the watches and the tools
    px(g, 290, COUNTER_BASE + 2, 60, 2, 'rgba(0,0,0,0.3)');
    // sign
    px(g, 280, CEIL_Y + 8, 80, 12, '#2a2024'); drawText(g, 'WE HOLD 30 DAYS', 320, CEIL_Y + 10, '#e8a840', { align: 'center' });
    fBulb(g, this.lamp.x, CEIL_Y, 14);
  },
  fg(g) {
    fCounter(g, 262, 372, '#8a7a5a', '#4a3a2a', { panels: true });
    px(g, 270, COUNTER_TOP - 8, 18, 6, '#3a2a24'); px(g, 272, COUNTER_TOP - 7, 14, 4, '#e8e0d0'); px(g, 340, COUNTER_TOP - 6, 8, 5, '#c8a850'); px(g, 352, COUNTER_TOP - 5, 6, 4, '#8a8a92');
    // display case: what's still for sale shows here
    const s = G.chars.sol || {}; const b = s.bought || {};
    px(g, 296, COUNTER_TOP + 2, 44, 10, '#2a3a44'); px(g, 296, COUNTER_TOP + 2, 44, 1, '#8ab0c0');
    if (!b.ruthWatch) px(g, 300, COUNTER_TOP + 5, 5, 4, '#c8a850'); if (!b.watch) px(g, 308, COUNTER_TOP + 5, 6, 4, '#e8e0d0'); if (!b.tools) { px(g, 318, COUNTER_TOP + 4, 12, 6, '#8a6a3a'); px(g, 320, COUNTER_TOP + 5, 8, 1, '#c8a850'); }
  }
};
