// ============================================================
// art: procedural humanoid pixel sprites, props
// ============================================================
// helper: darken/lighten a hex color
function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); return rgbStr(clamp(r + amt, 0, 255), clamp(g + amt, 0, 255), clamp(b + amt, 0, 255)); }
function px(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }

// A humanoid is drawn facing RIGHT into a 24x40 canvas; feet baseline at y=38, center x=12.
// spec: { skin, hair, hairStyle, shirt, pants, shoes, coat, hat, hatColor, beard, apron, glasses, hunch, cane, short, dress, scarf, vest, tie }
// pose: { frame (0..3 walk), walk (bool), sit (bool), bob }
const HUMAN_W = 24, HUMAN_H = 40;
function drawHumanoid(spec, pose) {
  const [c, g] = mkCanvas(HUMAN_W, HUMAN_H);
  const cx = 12, feet = 38;
  const skin = spec.skin, skinD = shade(spec.skin, -35);
  const hair = spec.hair, hairD = shade(spec.hair, -30);
  const shirt = spec.shirt, shirtD = shade(spec.shirt, -35);
  const pants = spec.pants, pantsD = shade(spec.pants, -30);
  const shoes = spec.shoes || '#221e1c';
  const outline = '#0d0c10';
  const hunch = spec.hunch ? 1 : 0;
  const h = spec.short ? -3 : 0; // shorter characters (kids/old)
  const walk = pose.walk, f = pose.frame || 0, sit = pose.sit;
  const bob = walk ? (f === 1 || f === 3 ? -1 : 0) : 0;
  // leg offsets
  let fl = 0, bl = 0; // front / back leg horizontal offsets
  if (walk) { const sw = [3, 1, -3, -1][f]; fl = sw; bl = -sw; }
  const hipY = feet - 13 + h;

  if (sit) {
    // seated: legs forward, torso upright, feet at baseline
    const seatY = feet - 8;
    // back leg (further from viewer)
    px(g, cx - 1, seatY - 6, 4, 5, pantsD);      // thigh
    px(g, cx + 3, seatY - 6, 6, 4, pantsD);
    px(g, cx + 7, seatY - 3, 3, 9, pantsD);      // shin down
    px(g, cx + 7, feet - 2, 5, 2, shoes);
    // front leg
    px(g, cx - 3, seatY - 5, 8, 5, pants);
    px(g, cx + 4, seatY - 5, 3, 4, pants);
    px(g, cx + 3, seatY - 2, 3, 8, pants);
    px(g, cx + 3, feet - 2, 6, 2, shoes);
    px(g, cx + 3, feet - 2, 6, 1, shade(shoes, 25));
    drawTorso(g, cx, seatY - 5, 0);
  } else {
    // legs
    drawLeg(g, cx - 3 + bl, hipY, feet, pantsD, shade(shoes, -10), false, bl);
    drawLeg(g, cx + 0 + fl, hipY, feet, pants, shoes, true, fl);
    drawTorso(g, cx, hipY, bob);
  }

  function drawLeg(g, x, top, bottom, col, shoeCol, front, off) {
    const len = bottom - top - 2;
    // thigh + shin as slightly bent column
    px(g, x, top, 4, Math.ceil(len / 2), col);
    const kneeX = x + (off > 0 ? 1 : off < 0 ? -1 : 0) * 0 ;
    px(g, kneeX, top + Math.ceil(len / 2), 4, Math.floor(len / 2), col);
    if (front) px(g, x + 3, top, 1, len, shade(col, -25)); // side shading
    // shoe
    px(g, kneeX - (off < 0 ? 1 : 0), bottom - 2, 6, 2, shoeCol);
    px(g, kneeX + 4, bottom - 2, 1, 1, shade(shoeCol, 30));
    px(g, kneeX, bottom - 1, 6, 1, shade(shoeCol, -30));
  }

  function drawTorso(g, cx, hipY, bob) {
    const torsoTop = hipY - 12 + bob + hunch;
    const tw = 10, tx = cx - 5;
    // coat (longer, wider)
    if (spec.coat) {
      const coat = spec.coat, coatD = shade(coat, -30);
      px(g, tx - 1, torsoTop, tw + 2, 12 + (sit ? 2 : 5), coat);
      px(g, tx - 1, torsoTop, 2, 12 + (sit ? 2 : 5), coatD);
      px(g, tx + 4, torsoTop + 1, 1, 12, coatD); // lapel line
      px(g, tx + 5, torsoTop + 1, 1, 12, shade(coat, 15));
      if (spec.torn) { px(g, tx - 1, torsoTop + 14, 3, 1, 'rgba(0,0,0,0)'); g.clearRect(tx - 1, torsoTop + 15, 2, 2); g.clearRect(tx + 8, torsoTop + 13, 2, 3); }
    } else if (spec.dress) {
      px(g, tx, torsoTop, tw, 12, shirt);
      px(g, tx, torsoTop, 2, 12, shirtD);
      // skirt
      px(g, tx - 1, hipY - 1, tw + 2, 9, shirt);
      px(g, tx - 1, hipY - 1, 2, 9, shirtD);
      px(g, tx - 1, hipY + 7, tw + 2, 1, shirtD);
    } else {
      px(g, tx, torsoTop, tw, 12, shirt);
      px(g, tx, torsoTop, 2, 12, shirtD);
      px(g, tx + tw - 1, torsoTop, 1, 12, shade(shirt, 12));
    }
    if (spec.vest) { const v = spec.vest; px(g, tx + 1, torsoTop + 1, tw - 2, 10, v); px(g, tx + 1, torsoTop + 4, tw - 2, 1, '#e8e4c8'); px(g, tx + 1, torsoTop + 8, tw - 2, 1, '#e8e4c8'); }
    if (spec.apron) { const a = spec.apron; px(g, tx + 2, torsoTop + 3, tw - 3, 9 + (sit ? 0 : 7), a); px(g, tx + 2, torsoTop + 3, 1, 16, shade(a, -25)); px(g, tx + 5, torsoTop + 1, 1, 2, shade(a, -25)); }
    if (spec.tie) px(g, tx + 6, torsoTop + 1, 1, 6, spec.tie);
    // arms
    const swing = walk ? [2, 0, -2, 0][f] : 0;
    const sleeve = spec.coat || (spec.dress ? shirt : shirt);
    const sleeveD = shade(sleeve, -35);
    // back arm
    px(g, tx - 1 + (sit ? 1 : -swing), torsoTop + 2, 3, 9, sleeveD);
    px(g, tx - 1 + (sit ? 1 : -swing), torsoTop + 11, 3, 2, skinD);
    // front arm
    px(g, tx + tw - 2 + (sit ? 0 : swing), torsoTop + 2, 3, 9, sleeve);
    px(g, tx + tw - 2 + (sit ? 0 : swing), torsoTop + 2, 1, 9, sleeveD);
    px(g, tx + tw - 2 + (sit ? 0 : swing), torsoTop + 11, 3, 2, skin);
    if (spec.cane && !sit) { px(g, tx + tw + 1, torsoTop + 12, 1, 15, '#5a3b22'); px(g, tx + tw, torsoTop + 11, 3, 1, '#7a5432'); }
    if (spec.guitar && !walk) { px(g, tx - 2, torsoTop + 6, 14, 6, '#8a5a2a'); px(g, tx + 1, torsoTop + 7, 5, 4, '#2a1a0a'); px(g, tx + 10, torsoTop + 5, 8, 1, '#3a2a1a'); }
    // neck
    const neckY = torsoTop - 2;
    px(g, cx - 1, neckY, 3, 2, skinD);
    // head (8w x 9h), positioned slightly forward when hunched
    const hx = cx - 3 + hunch, hy = neckY - 9 + hunch;
    px(g, hx, hy, 8, 9, skin);
    px(g, hx, hy, 1, 9, skinD);           // back of head shade
    px(g, hx + 1, hy + 8, 6, 1, skinD);   // jaw shade
    px(g, hx - 1, hy + 4, 1, 3, skinD);   // ear-ish (back)
    // eye + brow + mouth (facing right)
    px(g, hx + 5, hy + 4, 1, 1, '#1a1418');
    if (spec.old) { px(g, hx + 4, hy + 5, 2, 1, skinD); px(g, hx + 6, hy + 3, 1, 1, skinD); }
    px(g, hx + 5, hy + 7, 2, 1, skinD);
    if (spec.glasses) { px(g, hx + 4, hy + 3, 3, 2, 'rgba(40,50,70,0.75)'); px(g, hx + 4, hy + 3, 3, 1, '#2a2a30'); px(g, hx + 1, hy + 3, 3, 1, '#2a2a30'); }
    // hair
    const hs = spec.hairStyle || 'short';
    if (hs !== 'bald') {
      px(g, hx - 1, hy - 1, 9, 3, hair);                   // top
      px(g, hx - 1, hy + 2, 2, 4, hair);                   // back
      px(g, hx - 1, hy - 1, 3, 2, hairD);
      if (hs === 'short') { px(g, hx + 6, hy + 1, 2, 1, hair); }
      if (hs === 'messy') { px(g, hx + 1, hy - 2, 2, 1, hair); px(g, hx + 4, hy - 2, 2, 1, hair); px(g, hx + 6, hy + 1, 2, 2, hair); px(g, hx - 2, hy + 1, 1, 3, hair); }
      if (hs === 'long') { px(g, hx - 2, hy + 2, 3, 10, hair); px(g, hx - 2, hy + 2, 1, 10, hairD); px(g, hx + 6, hy + 1, 2, 2, hair); }
      if (hs === 'ponytail') { px(g, hx - 3, hy + 1, 3, 3, hair); px(g, hx - 4, hy + 3, 2, 8, hair); px(g, hx - 4, hy + 3, 1, 8, hairD); px(g, hx + 6, hy + 1, 2, 1, hair); }
      if (hs === 'bun') { px(g, hx - 3, hy - 1, 3, 3, hair); px(g, hx - 3, hy - 1, 1, 3, hairD); }
      if (hs === 'thin') { g.clearRect(hx + 1, hy - 1, 5, 1); px(g, hx + 1, hy - 1, 5, 1, skin); px(g, hx - 1, hy, 2, 5, hair); px(g, hx + 6, hy + 1, 1, 1, hair); }
      if (hs === 'buzz') { px(g, hx - 1, hy - 1, 9, 2, hair); }
      if (hs === 'afro') { px(g, hx - 2, hy - 3, 11, 5, hair); px(g, hx - 3, hy - 1, 2, 7, hair); px(g, hx - 2, hy - 3, 3, 3, hairD); }
      if (hs === 'wavy') { px(g, hx - 2, hy + 1, 2, 6, hair); px(g, hx + 6, hy + 1, 3, 2, hair); px(g, hx + 7, hy + 3, 1, 1, hair); }
    }
    if (spec.beard) { const b = spec.beard; px(g, hx + 1, hy + 6, 7, 3, b); px(g, hx + 2, hy + 9, 5, spec.longBeard ? 3 : 1, b); px(g, hx + 5, hy + 6, 2, 1, skin); }
    if (spec.hat === 'beanie') { const hc = spec.hatColor || '#4a4a52'; px(g, hx - 1, hy - 2, 9, 4, hc); px(g, hx - 1, hy - 2, 2, 4, shade(hc, -30)); px(g, hx - 1, hy + 1, 9, 1, shade(hc, -20)); px(g, hx + 1, hy - 3, 5, 1, hc); }
    if (spec.hat === 'cap') { const hc = spec.hatColor || '#2a3a6a'; px(g, hx - 1, hy - 2, 9, 3, hc); px(g, hx - 1, hy - 2, 2, 3, shade(hc, -30)); px(g, hx + 5, hy, 6, 1, hc); }
    if (spec.hat === 'hood') { const hc = spec.hatColor || spec.coat; px(g, hx - 2, hy - 2, 10, 11, hc); px(g, hx - 2, hy - 2, 2, 11, shade(hc, -30)); px(g, hx + 1, hy + 1, 7, 8, skin); px(g, hx + 5, hy + 4, 1, 1, '#1a1418'); px(g, hx + 5, hy + 7, 2, 1, skinD); }
    if (spec.scarf) { px(g, cx - 3, neckY - 1, 8, 3, spec.scarf); px(g, cx - 3, neckY + 2, 3, 4, spec.scarf); }
    if (spec.stubble) { px(g, hx + 2, hy + 7, 6, 2, 'rgba(20,20,20,0.25)'); }
    if (spec.bandage) { px(g, hx + 2, hy + 1, 4, 2, '#ddd6c8'); }
    if (spec.grime) { px(g, hx + 2, hy + 3, 1, 1, 'rgba(30,25,20,0.35)'); px(g, hx + 6, hy + 6, 1, 2, 'rgba(30,25,20,0.35)'); px(g, tx + 2, torsoTop + 6, 3, 2, 'rgba(30,25,20,0.3)'); }
  }
  return c;
}

// Build animated frames for a spec; cache by spec key
const charFrameCache = {};
function charFrames(spec) {
  const key = JSON.stringify(spec);
  if (charFrameCache[key]) return charFrameCache[key];
  const idle = drawHumanoid(spec, { walk: false, frame: 0 });
  const walk = [0, 1, 2, 3].map(f => drawHumanoid(spec, { walk: true, frame: f }));
  const sit = drawHumanoid(spec, { sit: true });
  const fr = { idle, walk, sit, idleL: flipH(idle), walkL: walk.map(flipH), sitL: flipH(sit) };
  fr.sil = silhouette(idle, '#000'); fr.silWalk = walk.map(w => silhouette(w, '#000')); fr.silSit = silhouette(sit, '#000');
  fr.silL = flipH(fr.sil); fr.silWalkL = fr.silWalk.map(flipH); fr.silSitL = flipH(fr.silSit);
  charFrameCache[key] = fr; return fr;
}

// ---------- character specs ----------
const SPECS = {
  player: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#5c6270', pants: '#2c3444', shoes: '#3a3634', coat: '#4c5260', stubble: true },
  playerLate: { skin: '#cfae96', hair: '#3a2a22', hairStyle: 'messy', shirt: '#5c6270', pants: '#2c3444', shoes: '#3a3634', coat: '#4c5260', stubble: true, scarf: '#8a3a3a' },
  amos0: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'messy', shirt: '#4a4438', pants: '#5a4a34', shoes: '#2a2420', coat: '#5a5e42', torn: true, beard: '#9a948c', longBeard: true, hat: 'beanie', hatColor: '#3c3a3a', grime: true },
  amos1: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'messy', shirt: '#4a4438', pants: '#5a4a34', shoes: '#2a2420', coat: '#5a5e42', torn: true, beard: '#9a948c', longBeard: true, hat: 'beanie', hatColor: '#3c3a3a' },
  amos2: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'messy', shirt: '#4a4438', pants: '#5a4a34', shoes: '#4a3424', coat: '#2e3a5e', beard: '#9a948c', longBeard: true, hat: 'beanie', hatColor: '#3c3a3a' },
  amos3: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'short', shirt: '#6a6e78', pants: '#3a3a44', shoes: '#4a3424', coat: '#2e3a5e', beard: '#9a948c' },
  amos4: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'short', shirt: '#6a6e78', pants: '#3a3a44', shoes: '#4a3424', vest: '#e8a020', beard: '#9a948c' },
  amos5: { skin: '#7a5236', hair: '#9a948c', hairStyle: 'short', shirt: '#e8e8e0', pants: '#3a3a44', shoes: '#4a3424', apron: '#f0ece0', beard: '#9a948c' },
  amosSick: { skin: '#6a4a36', hair: '#9a948c', hairStyle: 'messy', shirt: '#4a4438', pants: '#5a4a34', shoes: '#2a2420', coat: '#5a5e42', torn: true, beard: '#9a948c', longBeard: true, hat: 'beanie', hatColor: '#3c3a3a', grime: true, bandage: false },
  mei: { skin: '#f0d2b4', hair: '#1c1a20', hairStyle: 'ponytail', shirt: '#e8c84a', pants: '#3a4a6a', shoes: '#f0f0f0', apron: '#b03a30' },
  meiOut: { skin: '#f0d2b4', hair: '#1c1a20', hairStyle: 'ponytail', shirt: '#e8c84a', pants: '#3a4a6a', shoes: '#f0f0f0', coat: '#6a8a5a', hat: 'hood', hatColor: '#6a8a5a' },
  meiEnd: { skin: '#f0d2b4', hair: '#1c1a20', hairStyle: 'long', shirt: '#e8c84a', pants: '#3a4a6a', shoes: '#f0f0f0', coat: '#6a8a5a' },
  walter: { skin: '#e8c8b0', hair: '#e8e4e0', hairStyle: 'thin', shirt: '#7a5a3a', pants: '#6a6a72', shoes: '#2a2420', glasses: true, hunch: true, cane: true, old: true, short: true, tie: '#5a2a2a' },
  walterEnd: { skin: '#e8c8b0', hair: '#e8e4e0', hairStyle: 'thin', shirt: '#7a5a3a', pants: '#6a6a72', shoes: '#2a2420', glasses: true, hunch: true, old: true, short: true, tie: '#5a2a2a', scarf: '#8a3a3a' },
  nadia: { skin: '#b07a52', hair: '#2a1a14', hairStyle: 'bun', shirt: '#3a8a86', pants: '#3a8a86', shoes: '#2a2420', dress: true, apron: '#f0ece0' },
  nadiaEnd: { skin: '#b07a52', hair: '#2a1a14', hairStyle: 'bun', shirt: '#3a8a86', pants: '#3a8a86', shoes: '#2a2420', dress: true, apron: '#f0ece0', scarf: '#e8c84a' },
  doctor: { skin: '#5a3a2a', hair: '#1a1210', hairStyle: 'buzz', shirt: '#f0f0f4', pants: '#3a3a4a', shoes: '#2a2420', coat: '#f0f0f4', glasses: true, tie: '#3a5a8a' },
  busker: { skin: '#c89a78', hair: '#8a4a2a', hairStyle: 'long', shirt: '#6a3a6a', pants: '#2c3444', shoes: '#4a3424', hat: 'beanie', hatColor: '#8a2a2a', guitar: true, stubble: true },
  kid: { skin: '#e8c0a0', hair: '#c08a3a', hairStyle: 'short', shirt: '#d84a3a', pants: '#3a4a8a', shoes: '#f0f0f0', short: true, hat: 'cap', hatColor: '#3a8a3a' },
  granny: { skin: '#e0b8a0', hair: '#d8d8dc', hairStyle: 'bun', shirt: '#7a3a5a', pants: '#7a3a5a', shoes: '#2a2420', dress: true, old: true, hunch: true, short: true, glasses: true },
  worker: { skin: '#b08a68', hair: '#2a2a2a', hairStyle: 'buzz', shirt: '#4a4a4a', pants: '#3a3a5a', shoes: '#4a3424', vest: '#e8a020', hat: 'cap', hatColor: '#e8a020' },
  woman1: { skin: '#8a5a3a', hair: '#1a1210', hairStyle: 'afro', shirt: '#8a3a3a', pants: '#2a2a3a', shoes: '#2a2420', coat: '#3a3a4a' },
  man1: { skin: '#e8c0a0', hair: '#5a4a3a', hairStyle: 'short', shirt: '#3a5a8a', pants: '#3a3a3a', shoes: '#2a2420', coat: '#2a2a2e', scarf: '#5a5a7a' },
  meiMom: { skin: '#e8c8a8', hair: '#2a2228', hairStyle: 'bun', shirt: '#5a5a6a', pants: '#3a3a44', shoes: '#2a2420', apron: '#b03a30', old: true },
};

// ---------- small hand-drawn sprites ----------
const P = {
  k: '#0d0c10', K: '#1c1a20', g: '#3a3a44', G: '#5a5a66', l: '#8a8a96', L: '#b8b8c4', w: '#e8e8f0',
  b: '#6a4a2a', B: '#8a6a3a', o: '#c88a3a', O: '#e8b04a', r: '#a03a30', R: '#d85a4a', y: '#e8c84a', Y: '#f8e88a',
  n: '#2a3a5e', N: '#3a5a8e', c: '#3a8a86', C: '#6ab8b4', e: '#4a7a3a', E: '#7ab05a', p: '#7a4a8a', s: '#d0b088', S: '#a08060', t: '#d8d0c0', q: '#5c4a3a'
};
const SPR = {};
function S(key, rows, pal) { SPR[key] = mkSprite(rows, pal || P, key); return SPR[key]; }
S('dog', [
  '......kk......',
  '.....kSSk..kk.',
  '.kk.kSSSSkkSk.',
  'kSSkSSSSSSSSk.',
  'kSSSSSSSSSSSk.',
  '.kSSSSSSSSSk..',
  '..kSSkkkSSk...',
  '..kSk..kSk....',
  '..kk...kk.....'], Object.assign({}, P, { S: '#8a6a4a' }));
S('dogSit', [
  '........kk....',
  '.......kSSk...',
  '......kSSSSk..',
  '.....kSSSSSSk.',
  '....kSSSSSSk..',
  '...kSSSSSSSk..',
  '..kSSSSSSSSk..',
  '..kSSkkkSSk...',
  '..kSk..kSk....',
  '..kk...kk.....'], Object.assign({}, P, { S: '#8a6a4a' }));
S('cat', [
  '..k..k....',
  '..kkkk.kk.',
  '.kSSSSkSSk',
  '.kSSSSSSSk',
  '..kSSSSSk.',
  '..kSSSSSk.',
  '..kkk.kk..'], Object.assign({}, P, { S: '#4a4a52' }));
S('bench', [
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '..g........................g',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '..gg......................gg',
  '..gg......................gg',
  '..gg......................gg',
  '..gg......................gg',
  '.ggg.....................ggg']);
S('bin', [
  '.GGGGGGGGGG.',
  'GGGGGGGGGGGG',
  '.gggggggggg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.glgggggglg.',
  '.gggggggggg.',
  '.kkkkkkkkkk.']);
S('dumpster', [
  '..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..',
  '.eEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEe.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.',
  '.qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq.',
  '..kk..............................kk..'], Object.assign({}, P, { e: '#2e5a3a', E: '#3e7a4a', q: '#1e3a2a' }));
S('hydrant', [
  '..RR..',
  '.RRRR.',
  '.rRRr.',
  'RRRRRR',
  '.rRRr.',
  '.rRRr.',
  '.rRRr.',
  '.rRRr.',
  'rrrrrr']);
S('cardboard', [
  '...........................',
  '.SSSSSSSSSSSSSSSSSSSSSSSSS.',
  'SssssssssssssssssssssssssSS',
  'SssSSSSSSSSSSSSSSSSSSSSssSS',
  'SssSSSSSSSSSSSSSSSSSSSSssSS',
  'SssSSSSSSSSSSSSSSSSSSSSssSS',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSS',
  'qqqqqqqqqqqqqqqqqqqqqqqqqqq'], Object.assign({}, P, { S: '#8a6a44', s: '#6a4a2a', q: '#4a3020' }));
S('blanket', [
  '....nnnnnnnnnnnnnnnnnnnn....',
  '..nnNNnnnnNNnnnnNNnnnnNNnn..',
  '.nnnnnnnnnnnnnnnnnnnnnnnnnn.',
  'nnnnNNnnnnNNnnnnNNnnnnNNnnnn',
  'nnnnnnnnnnnnnnnnnnnnnnnnnnnn'], Object.assign({}, P, { n: '#4a3a5a', N: '#5a4a6a' }));
S('crate', [
  'bBBBBBBBBBBBBBb',
  'BbbbbbbbbbbbbbB',
  'BbBBBBBBBBBBBbB',
  'BbBbbbbbbbbbBbB',
  'BbBbBBBBBBBbBbB',
  'BbBbBbbbbbBbBbB',
  'BbBbBBBBBBBbBbB',
  'BbBbbbbbbbbbBbB',
  'BbBBBBBBBBBBBbB',
  'BbbbbbbbbbbbbbB',
  'bBBBBBBBBBBBBBb',
  'qqqqqqqqqqqqqqq']);
S('busSign', [
  '.nnnnnnnnnnnnn.',
  'nNNNNNNNNNNNNNn',
  'nNwwwNNwNNwwwNn',
  'nNwNNNNwNNwNNNn',
  'nNwwwNNwNNwwwNn',
  'nNNNwNNwNNNNwNn',
  'nNwwwNNwNNwwwNn',
  '.nnnnnnnnnnnnn.',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '......ll.......',
  '.....gggg......']);
S('mailbox', [
  '.nnnnnnnn.',
  'nNNNNNNNNn',
  'nNNNNNNNNn',
  'nnnnnnnnnn',
  'nNNNNNNNNn',
  'nNNNNNNNNn',
  'nNNNNNNNNn',
  'nNNNNNNNNn',
  'nNNNNNNNNn',
  'nnnnnnnnnn',
  '..gg..gg..',
  '..gg..gg..',
  '..gg..gg..',
  '..gg..gg..',
  '..gg..gg..',
  '.ggg..ggg.']);
S('cart', [
  '.......llllllllll.',
  '......lLLLLLLLLLLl',
  '.....lLlLlLlLlLlLl',
  '....lLLLLLLLLLLLLl',
  '...lLlLlLlLlLlLlLl',
  '..lLLLLLLLLLLLLLLl',
  '.lllllllllllllllll',
  '.l...............l',
  '.l...............l',
  '.kk.............kk',
  'kkkk...........kkkk',
  '.kk.............kk']);
S('umbrella', [
  '.......rrrrrrr.......',
  '....rrrRRRRRRRrrr....',
  '..rrRRRRRRRRRRRRRrr..',
  '.rRRRRRRRRRRRRRRRRRr.',
  'rrrrrrrrrrrrrrrrrrrrr',
  '..........ll.........',
  '..........ll.........',
  '..........ll.........',
  '..........ll.........',
  '.........lll.........']);
S('sketchbook', [
  'kkkkkkkkkk',
  'kwwwwwwwwk',
  'kwwlwwlwwk',
  'kwwwlwwwwk',
  'kwwlwwlwwk',
  'kwwwwwwwwk',
  'kkkkkkkkkk']);
S('radio', [
  '..l.........',
  '..l.........',
  'bbbbbbbbbbbb',
  'bBBBBBbOOOOb',
  'bBkBkBbOkkOb',
  'bBBBBBbOOOOb',
  'bBkBkBbbbbbb',
  'bBBBBBbyybOb',
  'bbbbbbbbbbbb']);
S('chess', [
  'wkwkwkwk',
  'kwkwkwkw',
  'wkwkwkwk',
  'kwkwkwkw',
  'wkwkwkwk',
  'kwkwkwkw',
  'wkwkwkwk',
  'kwkwkwkw']);
S('letter', [
  'wwwwwwwwwwww',
  'wllwwwwwwwww',
  'wwwwwwwwwwww',
  'wllllllwwwww',
  'wwwwwwwwwwww',
  'wllllllllwww',
  'wwwwwwwwwwww',
  'wlllllwwwwww',
  'wwwwwwwwwwww']);
S('coffee', [
  '.LLLLLL.',
  '.LwwwwLL',
  '.LwwwwLL',
  '.LwwwwL.',
  '.LLLLLL.']);
S('bread', [
  '..oooooooo..',
  '.oOOOOOOOOo.',
  'oOOOOOOOOOOo',
  'oOOOOOOOOOOo',
  '.oooooooooo.'], Object.assign({}, P, { o: '#a8783a', O: '#d8a860' }));
S('soup', [
  '.rrrrrrrrr.',
  'rRRRRRRRRRr',
  'rRwwwwwwwRr',
  'rRwRRRRRwRr',
  'rRwwwwwwwRr',
  'rRRRRRRRRRr',
  '.rrrrrrrrr.']);
S('rice', [
  '.tttttttt.',
  'tTTTTTTTTt',
  'tTeeeeeeTt',
  'tTeEEEEeTt',
  'tTeeeeeeTt',
  'tTTTTTTTTt',
  '.tttttttt.'], Object.assign({}, P, { t: '#c8c0b0', T: '#e8e0d0' }));
S('fish', [
  '......ss..',
  '.sSSSs.ss.',
  'sSbSSSSss.',
  'sSSSSSSss.',
  '.sSSSs.ss.',
  '......ss..'], Object.assign({}, P, { s: '#4a6a7a', S: '#a8c8d0', b: '#1a1a20' }));
S('heart', [
  '.kk.kk.',
  'kRRkRRk',
  'kRRRRRk',
  '.kRRRk.',
  '..kRk..',
  '...k...']);
S('coin', [
  '.yyyy.',
  'yYYYYy',
  'yYyyYy',
  'yYyyYy',
  'yYYYYy',
  '.yyyy.']);
S('pill', [
  '.wwww.',
  'wwwwRR',
  'wwwRRR',
  'wwRRRR',
  '.RRRR.']);
const CAR_ROWS = [
  '..........kkkkkkkkkkkkkkkkkk..........',
  '........kknNNNNNNNNNNNNNNNNnkk........',
  '......kknNNNNwwwwNNNNwwwwNNNNnkk......',
  '.....knNNNNNwwwwwNNNNwwwwwNNNNNnk.....',
  '....knNNNNNNwwwwwNNNNwwwwwNNNNNNnk....',
  '...knnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnk..',
  '..knNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNnk.',
  '.knNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNnk',
  'kyNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNRk',
  'knnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '...kkGGkk......................kkGGkk.',
  '...kGllGk......................kGllGk.',
  '...kGllGk......................kGllGk.',
  '...kkGGkk......................kkGGkk.'];
S('car', CAR_ROWS, Object.assign({}, P, { n: '#2a3a5e', N: '#3e5a8a' }));
S('carRed', CAR_ROWS, Object.assign({}, P, { n: '#5a2a2a', N: '#8a3a34' }));
S('plate', ['.LLLLLLLL.', 'LwwwwwwwwL', '.LLLLLLLL.']);
S('plateDirty', ['.LLLLLLLL.', 'LwbwwbwwwL', '.LLLLLLLL.']);
S('bubbles', ['.w..w.', 'w.w...', '..w..w', '.w..w.']);
S('zz', ['ww.', '.w.', 'ww.', '...', 'www', '..w', 'www'], { w: '#c8d8f0' });
S('exclaim', ['.YY.', '.YY.', '.YY.', '.YY.', '....', '.YY.'], { Y: '#f8e88a' });
S('heartBig', ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#e85a6a' });
S('cough', ['w.w', '.w.', 'w.w'], { w: '#b8c0c8' });
S('tv', [
  'kkkkkkkkkkkkkkkk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kNNNNNNNNNNNNNNk',
  'kkkkkkkkkkkkkkkk',
  '......kkkk......'], Object.assign({}, P, { N: '#3a5a7a' }));

// ---------- true-scale street props (1px = 4.5cm), replacing the small hand-drawn ones ----------
function mkProp(w, h, fn) { const [c, g] = mkCanvas(w, h); fn(g); return c; }
function paintCarTo(g, body) {
  const b = body, bd = shade(body, -30), bl = shade(body, 18), k = '#0d0c10', glass = '#3a4a5c';
  // 98 x 32: sedan, roof 1.45m, wheels 0.6m
  px(g, 4, 14, 90, 12, b); px(g, 2, 18, 94, 8, b); px(g, 4, 14, 90, 1, bl);           // lower body
  px(g, 22, 4, 52, 10, b); px(g, 24, 3, 48, 1, bl); px(g, 20, 13, 56, 1, bd);          // cabin
  px(g, 26, 5, 18, 8, glass); px(g, 46, 5, 12, 8, glass); px(g, 60, 5, 12, 8, glass);  // windows
  px(g, 27, 6, 6, 3, '#5a6a7c'); px(g, 47, 6, 4, 3, '#5a6a7c');
  px(g, 2, 26, 94, 2, bd); px(g, 0, 20, 4, 6, '#2a2a30'); px(g, 94, 20, 4, 6, '#2a2a30');
  px(g, 1, 19, 3, 3, '#e8e0a0'); px(g, 94, 19, 3, 3, '#d84a3a');                       // lights
  px(g, 48, 19, 22, 1, bd); px(g, 12, 20, 1, 5, bd); px(g, 84, 20, 1, 5, bd);         // door lines
  for (const wx of [16, 70]) { px(g, wx, 20, 14, 12, k); px(g, wx + 2, 22, 10, 8, '#3a3a42'); px(g, wx + 5, 25, 4, 2, '#6a6a72'); }
  px(g, 0, 31, 98, 1, 'rgba(0,0,0,0.5)');
}
SPR.car = mkProp(98, 32, g => paintCarTo(g, '#3e5a8a'));
SPR.carRed = mkProp(98, 32, g => paintCarTo(g, '#8a3a34'));
SPR.dumpster = mkProp(40, 26, g => {
  const e = '#2e5a3a', E = '#3e7a4a', q = '#1e3a2a';
  px(g, 1, 4, 38, 20, e); px(g, 0, 2, 40, 3, E); px(g, 0, 2, 40, 1, shade(E, 20)); px(g, 1, 22, 38, 2, q);
  px(g, 4, 9, 32, 6, q); px(g, 6, 10, 28, 4, '#8ab08a'); px(g, 8, 11, 24, 2, q);
  px(g, 1, 4, 1, 20, shade(e, 15)); px(g, 38, 4, 1, 20, q); px(g, 3, 24, 4, 2, '#1a1a20'); px(g, 33, 24, 4, 2, '#1a1a20');
});
SPR.bench = mkProp(34, 20, g => {
  const b = '#6a4a2a', B = '#8a6a3a', k = '#2a2a30';
  px(g, 0, 0, 34, 3, B); px(g, 0, 0, 34, 1, shade(B, 25)); px(g, 0, 4, 34, 3, B); px(g, 0, 8, 34, 2, b);
  px(g, 0, 10, 34, 3, B); px(g, 0, 10, 34, 1, shade(B, 25)); px(g, 0, 13, 34, 1, b);
  px(g, 3, 0, 2, 20, k); px(g, 29, 0, 2, 20, k); px(g, 2, 18, 4, 2, k); px(g, 28, 18, 4, 2, k);
});
SPR.hydrant = mkProp(8, 16, g => { const r = '#a03a30', R = '#d85a4a'; px(g, 2, 0, 4, 3, R); px(g, 1, 3, 6, 2, r); px(g, 2, 5, 4, 9, R); px(g, 0, 6, 8, 3, R); px(g, 2, 5, 1, 9, r); px(g, 1, 14, 6, 2, r); });
SPR.bin = mkProp(14, 24, g => { const G1 = '#5a5a66', G0 = '#3a3a44', L = '#8a8a96'; px(g, 0, 0, 14, 3, G1); px(g, 0, 0, 14, 1, L); px(g, 1, 3, 12, 20, G0); for (let x = 2; x < 13; x += 3) px(g, x, 4, 1, 18, G1); px(g, 1, 22, 12, 2, '#1a1a20'); });
SPR.mailbox = mkProp(15, 26, g => { const n = '#2a3a5e', N = '#3a5a8e'; px(g, 0, 2, 15, 12, N); px(g, 1, 0, 13, 3, N); px(g, 1, 0, 13, 1, shade(N, 20)); px(g, 0, 14, 15, 2, n); px(g, 2, 5, 11, 4, n); drawText(g, 'US', 7, 9, '#c8d0e0', { align: 'center' }); px(g, 3, 16, 2, 10, '#2a2a30'); px(g, 10, 16, 2, 10, '#2a2a30'); px(g, 2, 25, 4, 1, '#2a2a30'); px(g, 9, 25, 4, 1, '#2a2a30'); });
SPR.cart = mkProp(22, 22, g => { const l = '#8a8a96', L = '#b8b8c4', k = '#1a1a20'; px(g, 4, 2, 16, 12, l); for (let y = 3; y < 14; y += 3) px(g, 5, y, 14, 1, L); for (let x = 6; x < 20; x += 4) px(g, x, 2, 1, 12, L); px(g, 0, 0, 4, 2, k); px(g, 2, 2, 2, 12, l); px(g, 4, 14, 16, 1, l); px(g, 5, 15, 1, 5, l); px(g, 18, 15, 1, 5, l); px(g, 3, 19, 4, 3, k); px(g, 16, 19, 4, 3, k); });
