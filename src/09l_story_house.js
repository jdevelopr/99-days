// ============================================================
// Ashby Lane: Walter's house. The invitation, the will, the sign, the sale. Twenty thousand dollars, 1961 money.
// Buy it for yourself and it is where the last morning happens. Buy it for Amos and it is his.
// ============================================================
const HOUSE_COST = 20000;
function homeScene() { return G.flags.house === 'mine' ? 'house' : 'apartment'; }

// ---------- the lane (outdoor) ----------
const LANE = {
  w: 760, lamps: [40, 340, 650], spawn: 30,
  gaps: [{ x0: 162, x1: 198, top: GROUND_Y - 100 }, { x0: 332, x1: 378, top: GROUND_Y - 100 }, { x0: 522, x1: 558, top: GROUND_Y - 100 }],
  spots: { entry: 30, porch: 470, sign: 505, house: 451 },
  doors: [{ x: 2, w: 26, to: 'street', at: 'river', label: 'Harlan Street' }, { x: 440, w: 22, to: 'house', label: "Walter's house" }],
  houses: [
    { x: 40, w: 122, h: 104, color: '#5a4a42', style: 'brick', seed: 301, floors: 2, kind: 'plain', roof: false },
    { x: 198, w: 134, h: 104, color: '#6a5a4a', style: 'brick', seed: 311, floors: 2, kind: 'plain', roof: false },
    { x: 378, w: 144, h: 104, color: '#3e4e5e', style: 'brick', seed: 321, floors: 2, kind: 'plain', roof: false, walter: true },
    { x: 558, w: 140, h: 104, color: '#5a4a4a', style: 'brick', seed: 331, floors: 2, kind: 'plain', roof: false },
  ],
  render(g, t) { renderLane(g, t); }
};
OUTDOORS.lane = LANE;
const LaneWorld = { static: null, lights: [] };
function buildLaneStatic() {
  const [c, g] = mkCanvas(LANE.w, H); const lights = [], signs = [];
  for (const b of LANE.houses) {
    paintBuilding(g, b, lights, signs);
    // pitched roof cap over the brick
    g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(b.x - 4, GROUND_Y - b.h); g.lineTo(b.x + b.w / 2, GROUND_Y - b.h - 26); g.lineTo(b.x + b.w + 4, GROUND_Y - b.h); g.closePath(); g.fill();
    px(g, b.x + b.w - 30, GROUND_Y - b.h - 36, 8, 22, '#3a2e2c');   // chimney
    // stoop
    px(g, b.x + b.w / 2 - 16, GROUND_Y - 6, 32, 6, '#6a6a72'); px(g, b.x + b.w / 2 - 14, GROUND_Y - 10, 28, 4, '#7a7a82');
  }
  // Walter's porch: roof on posts, two chairs, a mailbox with ASHBY on it
  const wb = LANE.houses[2]; const px0 = wb.x + 4, pw = wb.w - 8, roofY = GROUND_Y - 40;
  px(g, px0 - 4, roofY - 4, pw + 8, 4, '#2e3a48'); px(g, px0 - 4, roofY - 5, pw + 8, 1, '#4e5a68'); px(g, px0 - 2, roofY, pw + 4, 2, '#1e2630');
  for (const x of [px0, px0 + pw - 4]) { px(g, x, roofY, 4, GROUND_Y - roofY, '#c8c0b0'); px(g, x, roofY, 1, GROUND_Y - roofY, '#e0d8c8'); }
  px(g, px0, GROUND_Y - 12, pw, 1, '#c8c0b0'); for (let x = px0 + 6; x < px0 + pw - 6; x += 8) px(g, x, GROUND_Y - 12, 2, 12, '#b8b0a0');   // railing
  px(g, px0 - 2, GROUND_Y - 2, pw + 4, 2, '#5a5a62');
  fChair(g, px0 + 12, GROUND_Y - 2, '#6a5a4a', 1); fChair(g, px0 + 30, GROUND_Y - 2, '#6a5a4a', -1);
  px(g, wb.x + wb.w - 22, GROUND_Y - 30, 3, 30, '#3a3a40'); px(g, wb.x + wb.w - 27, GROUND_Y - 36, 13, 8, '#2a3a4a'); px(g, wb.x + wb.w - 26, GROUND_Y - 34, 11, 1, '#c8c0b0');
  // door (blue, sticks) and a lit window either side
  px(g, 440, GROUND_Y - 44, 22, 44, '#2a3a5a'); px(g, 442, GROUND_Y - 42, 18, 40, '#3a4a6a'); px(g, 456, GROUND_Y - 24, 2, 2, '#c8a850');
  // trees in the gaps
  for (const tx of [170, 345, 530, 710]) { px(g, tx + 4, GROUND_Y - 70, 5, 70, '#2a2018'); for (let k = 0; k < 4; k++) { const w = 30 - k * 5, y = GROUND_Y - 70 + k * 12 - 6; px(g, tx + 6 - w / 2, y, w, 12, k % 2 ? '#2a3a26' : '#324630'); } }
  // sidewalk / road (as the street)
  px(g, 0, GROUND_Y, LANE.w, CURB_Y - GROUND_Y, '#585a62'); px(g, 0, GROUND_Y, LANE.w, 1, '#6a6c74'); for (let x = 0; x < LANE.w; x += 24) px(g, x, GROUND_Y, 1, CURB_Y - GROUND_Y, '#4a4c54'); px(g, 0, GROUND_Y + 9, LANE.w, 1, '#4e5058');
  px(g, 0, CURB_Y - 2, LANE.w, 2, '#6c6e76'); px(g, 0, CURB_Y, LANE.w, 2, '#3a3c44'); px(g, 0, CURB_Y + 2, LANE.w, H - CURB_Y - 2, '#2c2e36');
  const R = seeded(313); for (let i = 0; i < 300; i++) { const x = Math.floor(R() * LANE.w); px(g, x, CURB_Y + 2 + Math.floor(R() * (H - CURB_Y - 2)), 1, 1, R() < 0.5 ? '#262830' : '#32343c'); }
  // lamp posts
  for (const x of LANE.lamps) { px(g, x - 1, GROUND_Y - 74, 3, 74, '#1e2028'); px(g, x - 1, GROUND_Y - 74, 1, 74, '#3a3c48'); px(g, x - 3, GROUND_Y - 2, 7, 2, '#1e2028'); px(g, x - 1, GROUND_Y - 78, 12, 3, '#1e2028'); px(g, x + 6, GROUND_Y - 80, 10, 6, '#2a2c38'); px(g, x + 7, GROUND_Y - 75, 8, 2, '#e8d8a0'); }
  // street name at the entry
  px(g, 20, GROUND_Y - 62, 2, 62, '#3a3c48'); px(g, 12, GROUND_Y - 68, 40, 8, '#2a4a3a'); drawText(g, 'ASHBY LN', 32, GROUND_Y - 67, '#e8e8e0', { align: 'center' });
  LaneWorld.static = c; LaneWorld.lights = lights;
}
function renderLane(g, t) {
  if (!LaneWorld.static) buildLaneStatic();
  const camX = G.camX; const pal = todPalette(G.tod, G.rain); G.pal = pal; const h = House.S();
  drawSky(g, pal, camX, t);
  g.drawImage(LaneWorld.static, -camX, 0);
  // the sign on the porch
  if (h.listed) { const sx = LANE.spots.sign - camX; px(g, sx, GROUND_Y - 34, 2, 34, '#c8c0b0'); px(g, sx - 12, GROUND_Y - 44, 26, 12, h.owner ? '#8a2a2a' : '#e8e0d0'); drawText(g, h.owner ? 'SOLD' : 'SALE', sx + 1, GROUND_Y - 43, h.owner ? '#f0e0d0' : '#8a2a2a', { align: 'center' }); }
  // lit windows at night: Walter's when he is home, the others always
  const night = pal.night;
  if (night > 0.02) for (const L of LaneWorld.lights) { const sx = L.x - camX; if (sx + L.w < 0 || sx > W) continue; if (!L.lit) continue; const walters = L.x > 378 && L.x < 522; if (walters && !House.lit()) continue; g.fillStyle = `rgba(255,200,120,${night * 0.6})`; g.fillRect(sx, L.y, L.w, L.h); }
  const ents = G.entities.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const shadow = sunShadow(G.tod); shadow.alpha *= (1 - night) * (1 - G.rain * 0.55) * pal.sun;
  const lamps = []; if (night > 0.02) for (const x of LANE.lamps) { const sx = x - camX; if (sx > -140 && sx < W + 140) lamps.push({ x: sx + 10, y: GROUND_Y - 76, alpha: night, color: [255, 214, 150], r: 120 }); }
  for (const e of ents) { if (e.hidden || e.noShadow) continue; const fr = entFrame(e); drawShadow(g, e, fr, Math.round(e.x - camX), e.y, shadow, lamps); }
  for (const e of ents) { if (e.hidden) continue; const fr = entFrame(e); const sx = Math.round(e.x - camX); g.drawImage(fr.img, sx - fr.cx, e.y - fr.h + (e.sprite ? 0 : 2)); if (e.bubble) drawBubble(g, e, sx, t); }
  drawRain(g, t, camX);
  buildLighting(pal, camX, lamps, t);
  if (night > 0.05 && House.lit()) { lg.globalCompositeOperation = 'lighter'; const rg = lg.createRadialGradient(451 - camX, GROUND_Y - 30, 4, 451 - camX, GROUND_Y - 30, 90); rg.addColorStop(0, `rgba(255,200,130,${0.5 * night})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = rg; lg.fillRect(0, 0, W, H); lg.globalCompositeOperation = 'source-over'; }
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0); g.globalCompositeOperation = 'source-over';
  drawGlows(g, pal, camX, lamps, t, []);
  drawRays(g, pal, camX, t, shadow, LANE.gaps);
  drawVignette(g);
}

// ---------- the front room ----------
INTERIORS.house = {
  id: 'house', outdoor: false, floorY: FEET_Y, x0: 60, x1: 420, ceil: CEIL_Y, ambient: [104, 92, 80],
  lamp: { x: 240, y: CEIL_Y + 20 }, window: { x: 330, y: 158, w: 24, h: 30 },
  doors: [{ x: 72, w: 20, to: 'lane', label: 'Ashby Lane', at: 'porch' }], spawnX: 104, spawnDir: 1, spawns: { door: 104, chair: 200 },
  spots: { bed: 312, table: 150, chair: 205, clocks: 262, phone: 118 }, bed: { x: 290, w: 44 }, phone: { x: 118, y: 170 },
  paint(g) {
    const I = this; paintRoom(g, I, '#5a5048', '#6a5238', gg => { for (let x = I.x0; x < I.x1; x += 14) px(gg, x, GROUND_Y, 1, 64, 'rgba(0,0,0,0.16)'); });
    // wallpaper: faded stripes
    for (let x = I.x0 + 4; x < I.x1 - 4; x += 10) px(g, x, CEIL_Y + 2, 3, GROUND_Y - CEIL_Y - 6, 'rgba(255,255,255,0.035)');
    fDoor(g, 72, GROUND_Y, '#2a3a5a');
    // the mantel with seven clocks, a photograph, a radio
    px(g, 226, 150, 76, 3, '#4a3a2a'); px(g, 226, 150, 76, 1, '#6a5a4a'); px(g, 230, 153, 68, 30, '#3e3430'); px(g, 236, 158, 56, 22, '#1e1a18'); for (let i = 0; i < 5; i++) px(g, 240 + i * 10, 172, 6, 6, i % 2 ? '#8a4a2a' : '#6a3a22');   // hearth
    const clocks = [[230, 138], [241, 142], [252, 136], [263, 141], [274, 137], [285, 142], [296, 139]];
    clocks.forEach(([cx, cy], i) => { px(g, cx, cy, 8, 10, i === 3 ? '#c8b070' : '#5a4a3a'); px(g, cx + 1, cy + 1, 6, 6, '#e8e0d0'); px(g, cx + 4, cy + 2, 1, 3, '#2a2a30'); px(g, cx + 4, cy + 4, 2, 1, '#2a2a30'); });
    px(g, 304, 132, 14, 18, '#3a3a40'); px(g, 305, 133, 12, 16, '#c8b898'); px(g, 308, 137, 6, 6, '#d8a888');   // Ruth, laughing
    px(g, 212, 138, 12, 12, '#4a3a2a'); px(g, 214, 140, 8, 4, '#2a2a30'); px(g, 215, 146, 6, 2, '#c8b070');       // radio
    // Ruth's armchair (nobody sits in it) and Walter's
    px(g, 176, GROUND_Y - 22, 26, 22, '#6a3a3a'); px(g, 176, GROUND_Y - 22, 26, 1, '#8a5a5a'); px(g, 174, GROUND_Y - 12, 4, 12, '#5a2a2a'); px(g, 200, GROUND_Y - 12, 4, 12, '#5a2a2a'); px(g, 178, GROUND_Y - 24, 22, 3, '#f0e8d8');
    px(g, 132, GROUND_Y - 20, 24, 20, '#4a5a4a'); px(g, 132, GROUND_Y - 20, 24, 1, '#6a7a6a'); px(g, 130, GROUND_Y - 10, 4, 10, '#3a4a3a'); px(g, 154, GROUND_Y - 10, 4, 10, '#3a4a3a');
    // chess table between them
    fTable(g, 160, GROUND_Y + 2, 14, '#5a4a3a'); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) px(g, 161 + i * 3, GROUND_Y + 2 - 17 - 1 + j, 3, 1, (i + j) % 2 ? '#e8e0d0' : '#3a2a1a');
    // window with curtains, radiator, the daybed at the right (he sleeps downstairs now)
    fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#e8e0d0'); px(g, 324, 156, 5, 36, '#8a6a5a'); px(g, 355, 156, 5, 36, '#8a6a5a'); fRadiator(g, 336, GROUND_Y, 24);
    fBed(g, this.bed.x, GROUND_Y + 8, this.bed.w, true); px(g, this.bed.x + 2, GROUND_Y - 4, this.bed.w - 20, 6, '#6a4a5a');
    // stairs going up at the far right
    for (let i = 0; i < 6; i++) px(g, 392 + i * 5, GROUND_Y - 6 - i * 7, 28 - i * 5, 3, '#4a3a2a');
    px(g, 392, GROUND_Y - 50, 1, 50, '#3a2a1a');
    // bookshelf, coat hook
    fShelf(g, 92, GROUND_Y - 22, 30, 42, ['#8a3a3a', '#3a6a8a', '#c8a84a', '#4a8a4a', '#6a4a7a'], 7); px(g, 96, CEIL_Y + 30, 2, 5, '#c8c0b0');
    fBulb(g, this.lamp.x, CEIL_Y, 14);
  },
  fg(g) { }
};

// ---------- the arc ----------
const House = {
  init() { return { invited: false, visits: 0, listed: false, listedDay: 0, deadline: 0, owner: null, letter: false, boughtDay: 0, soldDay: 0, amosLine: false, warned: false, couch: 0, walterHome: false }; },
  S() { if (!G.house) G.house = this.init(); return G.house; },
  lit() { const h = this.S(); const w = G.chars.walter; return (!w.dead && (G.tod >= 0.8 || h.walterHome)) || h.owner === 'mine' || h.owner === 'amos' || h.owner === 'other'; },
  walterHere() { const h = this.S(); const w = G.chars.walter; return !w.dead && h.invited && (G.tod >= 0.86 || h.walterHome); },
  // the walk home, from the bench
  walkHome() {
    const h = this.S(); const w = G.chars.walter; if (!talkEnergy(6)) return; h.walterHome = true;
    UI.fadeOut(() => {
      goSceneNow('house', 'door'); UI.fadeIn();
      const L = [narr('Four doors off the river. Blue, or it was. A porch with two chairs, one of them worn to the shape of a man.'),
        narr('Inside: a front room that has not been rearranged since 1994. Seven clocks on the mantel, none of them ticking. A photograph of a woman laughing at something.'),
        say('walter', "Sit. Not that one; that one's Ruth's. Nobody sits in it. I know how that sounds.")];
      if (!h.invited) {
        L.push(say('walter', "I asked you here because I want somebody to have seen it. The house. With me in it. Before."),
          say('walter', "There's no one. Ruth's sister died in '09. The county gets it, and the county will put a fence round it and let the porch fall in, and I have made my peace with that except I haven't."),
          say('walter', "So I've done a thing. It's in the will: thirty days after, it goes to the first person who'll pay what I paid for it in 1961. Twenty thousand dollars. Then the realtor. Then the county."),
          say('walter', "I'm telling you so you don't think it's a mistake when the letter comes. It's not a mistake. It's the only trick I've got left."),
          choice({ t: "Twenty thousand.", do: () => [say('walter', "I know what it is. I know what you make. I'm not asking. I'm telling you where the door is.")] },
            { t: "Why me?", do: () => [say('walter', "Because you sat. Ten times, twelve; I lost count, and I have never in my life lost count. That's the whole reason. It's enough.")] },
            { t: "Give it to Amos.", do: () => { h.amosLine = true; return [say('walter', "The man by the stoop."), say('walter', "...You'd do that. Buy a house and hand it to a man on cardboard."), you("If I could."), say('walter', "Then that's where the door is. I'll put his name next to yours. Twenty thousand either way; the will doesn't know the difference.")]; } }),
          narr('He winds one clock. One. It ticks like it is surprised.'),
          say('walter', "Couch is there if the stairs are too much for you tonight. I sleep down here myself now. The stairs and I have an arrangement."),
          { fn: () => { h.invited = true; h.visits++; trust('walter', 2); remember('walter_house'); } });
      } else { h.visits++; L.push(say('walter', fresh('walter', ["Knight first. You know that by now.", "The clock I wound has stopped. I'm not winding it again. Once was the gesture."])), narr('You play, or you sit. The clocks do not tick. It is the quietest room in the city.')); }
      Dlg.run(L);
    }, 0.08);
  },
  // house door on the lane
  enter() {
    const h = this.S(); const w = G.chars.walter;
    if (h.owner === 'mine') { goScene('house', 'door'); return; }
    if (h.owner === 'amos') { const aw = Amos.where(); if (aw && aw.scene === 'house') goScene('house', 'door'); else Dlg.run([narr("Amos's door. Locked; he is at the river, or the dock, or wherever the day has him. The porch step is fixed. That was the first thing.")]); return; }
    if (h.owner === 'other') { Dlg.run([narr('The door is red now. It was blue. A stroller on the porch, a wind chime. Somebody else\'s life, already.')]); return; }
    if (w.dead) { Dlg.run([narr(h.listed ? 'Locked. The realtor\'s lockbox hangs on the knob like a padlock on a diary.' : 'Locked. The porch chair is still worn to his shape. Nobody has moved it.')]); return; }
    if (this.walterHere()) { goScene('house', 'door'); return; }
    Dlg.run([narr(h.invited ? "Nobody answers. He is at the bench, where he is." : 'A blue door, a brass knocker, no answer. Through the window: clocks.')]);
  },
  // the sign on the porch
  sign() {
    const h = this.S(); const a = G.chars.amos;
    if (h.owner) { Dlg.run([narr(h.owner === 'other' ? `SOLD. A couple from Dayton, Mrs. Ortega says. They have already painted the door.` : 'SOLD. The realtor has not come for the sign. You have not asked him to.')]); return; }
    const left = h.deadline - G.day;
    const items = [
      { t: 'Buy it. For yourself.', r: `$${HOUSE_COST}`, disabled: () => G.money < HOUSE_COST, do: () => this.buy('mine') },
      { t: 'Buy it. For Amos.', r: `$${HOUSE_COST}`, hide: () => !a.met || a.dead || a.gone, disabled: () => G.money < HOUSE_COST, do: () => this.buy('amos') },
      { t: 'Not yet', do: () => { } }];
    Menu.open(h.invited ? '4 Ashby Lane' : 'HALLORAN REALTY - ESTATE SALE', items, { wide: true, sub: h.invited ? `First refusal, by the will of W. Ashby. ${left} day${left === 1 ? '' : 's'} left. $${HOUSE_COST}.` : `$${HOUSE_COST}. A phone number. The porch chair is still there. Somebody else is looking.` });
  },
  buy(who) {
    const h = this.S(); if (!spend(HOUSE_COST)) return; h.owner = who; h.boughtDay = G.day; G.flags.house = who; Audio.good();
    if (who === 'mine') {
      remember('house_mine'); G.flags.left412 = true; G.flags.leftDay = G.day;
      UI.fadeOut(() => {
        goSceneNow('house', 'door'); UI.fadeIn();
        Dlg.run([narr('The keys come in an envelope from Fenwick & Doyle with a receipt that says PAID IN FULL and nothing else.'),
          narr('You carry what you own down four flights of Harlan Arms. It takes one trip. Nora is on shift; you leave a note under 411 with the address, and then go back and add "come for tea."'),
          narr('The porch. The door, which sticks. Seven clocks. You wind one.'),
          narr(G.chars.amos.met && !G.chars.amos.dead ? 'Amos carried the box with the pills in it and would not let you take it back until the door was open.' : 'The room is exactly as he left it, down to the knight on f3.'),
          { fn: () => { if (G.inv.chess) remember('house_chess'); } }]);
      }, 0.08);
    } else {
      remember('house_amos'); const a = G.chars.amos; a.house = true; a.stage = Math.max(a.stage, 5); trust('amos', 3);
      UI.fadeOut(() => {
        goSceneNow('house', 'door'); G.px = 130; UI.fadeIn();
        Dlg.run([narr('You bring him at dusk, because that is when the lamp on the lane is on and the door looks like a door and not a decision.'),
          narr('He stands in the doorway a long time before he goes in. Then he goes in and does not say anything for longer.'),
          say('amos', "...There's a chair. There's two chairs. There's seven clocks."),
          say('amos', "I'm going to fix the porch step. First thing. It's the least... it's the first thing."),
          you("It's yours. The paper says so."),
          say('amos', "Paper says a lot of things. I've had paper say I didn't exist. This one I'm going to frame."),
          narr('He sits, finally, in the worn chair, and puts both hands flat on the arms of it like he is checking it will hold. It holds.'),
          say('amos', "Stay. I mean it. There's a couch, there's a bed upstairs I'm never using; my knees. Stay whenever. This door's got your name on it too, whatever the paper says.")]);
      }, 0.08);
    }
  },
  daily() {
    const h = this.S(); const w = G.chars.walter; h.walterHome = false;
    if (w.dead && !h.listed && G.day >= w.deadDay + 2) { h.listed = true; h.listedDay = G.day; h.deadline = G.day + (h.invited ? 30 : 12); }
    if (h.listed && !h.owner && G.day >= h.deadline) { h.owner = 'other'; h.soldDay = G.day; G.flags.house = 'other'; remember('house_sold'); }
  },
  wake() {
    const h = this.S(); const d = G.day;
    if (h.listed && h.invited && !h.letter) { h.letter = true; Dlg.run([narr('An envelope, cream, heavy. Fenwick & Doyle, Attorneys at Law.'), narr(`"...in accordance with the last will of Walter J. Ashby... first refusal on the property at 4 Ashby Lane... for the sum of twenty thousand dollars ($${HOUSE_COST.toLocaleString()})... thirty (30) days from the date of this letter, after which the property will be listed for public sale..."`), narr('At the bottom, in blue ink that is not the lawyer\'s: KNIGHT FIRST. - W.')]); return true; }
    if (h.listed && !h.invited && !h.letter) { h.letter = true; Dlg.run([narr("Mrs. Ortega, in the hall: the Ashby place is up. A sign on the porch already. \"Twenty thousand, they want. For that house. Somebody will pay it, too; somebody always does.\"")]); return true; }
    if (h.listed && !h.owner && h.deadline - d === 5 && !h.warned) { h.warned = true; Dlg.run([narr(h.invited ? 'Five days left on the letter. You have not thrown it away. You have not done anything else with it either.' : 'The realtor\'s sign has a second sign on it now: UNDER OFFER. Five days, Mrs. Ortega thinks.')]); return true; }
    if (h.owner === 'other' && h.soldDay === d) { Dlg.run([narr(h.invited ? 'The thirty days are up. The lawyer does not write again. The sign on the porch says SOLD by the afternoon.' : 'SOLD. A couple from Dayton, Mrs. Ortega says, with a baby. She says it like it is good news, and it is, for somebody.')]); return true; }
    if (h.owner === 'mine' && G.chars.nora && G.chars.nora.trust >= 3 && !G.chars.nora.cold && d % 5 === 0 && !G.flags['noraHouse' + d]) { G.flags['noraHouse' + d] = true; Dlg.run([narr('A knock. Nora, off shift, having walked from Harlan Street in the rain with a bag of oranges and a face that says she will not be discussing the walk.'), say('nora', "Tea. You said tea. I'm holding you to the note."), { fn: () => addHunger(15) }]); return true; }
    return false;
  },
  endingFix(out) {
    const h = this.S(); const a = G.chars.amos;
    if (h.owner === 'amos' && !a.dead) { const i = out.findIndex(x => /Amos|stoop/.test(x.name)); const e = { name: 'Amos Delacroix Reed', line: 'Carpenter. Homeowner. Four doors off the river, blue, with seven clocks he has started winding one at a time. The porch step was the first thing.' }; if (i >= 0) out[i] = e; else out.unshift(e); }
    const wi = out.findIndex(x => /Walter/.test(x.name));
    if (wi >= 0 && h.owner === 'mine') out[wi].line += ' He left you the house at the price he paid in 1961. You died in his front room, with the clocks.';
    else if (wi >= 0 && h.owner === 'amos') out[wi].line += ' He left the house at the price he paid in 1961, and you gave it to Amos.';
    else if (wi >= 0 && h.owner === 'other' && h.invited) { out[wi].line += ' He left you first refusal on the house. Thirty days went by. A couple from Dayton painted the door red.'; }
    return out;
  }
};

// ---------- hooks ----------
{
  // the way in, at the river end of Harlan Street
  STREET.doors.push({ x: 2434, w: 24, to: 'lane', at: 'entry', label: 'Ashby Lane' });
  // Walter: walk him home
  const wm = Walter.menu; Walter.menu = function () { wm.call(this); const w = G.chars.walter; const h = House.S(); if (w.met && w.stage >= 3 && w.sat >= 5 && !w.dead && G.tod > 0.45 && Walter.present() && Menu.items) { Menu.items.splice(Menu.items.length - 1, 0, { t: h.invited ? 'Walk him home' : 'Walk him home', r: '-6 energy', do: () => House.walkHome() }); } };
  const wp = Walter.present; Walter.present = function () { return wp.call(this) && !House.S().walterHome; };
  Walter.houseTalk = function () { const w = G.chars.walter; if (!talkEnergy()) return; w.talked++; Dlg.run([say('walter', fresh('walter', ["Knight first. Sit; the board's where it was.", "Ruth's chair. I know. Sit in the other one.", "The clocks don't tick. I like them not ticking. You can hear the rain that way."]))]); };
  // Amos lives there, evenings, once it is his
  const aw = Amos.where; Amos.where = function () { const a = G.chars.amos; if (a.house && !a.dead && !a.gone && G.tod > 0.55) return { scene: 'house', x: 205, sit: true }; const r = aw.call(this); if (r && a.house && r.scene === 'basement') return { scene: 'house', x: 205, sit: true }; return r; };
  // 412 after you have left it
  const hd = hallDoor; hallDoor = function (d) { if (d.to === 'apartment' && G.flags.left412) { Dlg.run([narr(G.day - (G.flags.leftDay || 0) < 3 ? '412. Your key still works. You do not use it; there is nothing in there but the crack in the ceiling.' : '412. A welcome mat that is not yours. Through the door, a television. Somebody else\'s evening.')]); return; } return hd(d); };
  const bel = buildEndingList; buildEndingList = function () { return House.endingFix(bel()); };
  // Jo, at a house instead of a room
  const jv = Jo.visit; Jo.visit = function () { jv.call(this); if (G.flags.house === 'mine' && Dlg.steps) { const i = Dlg.steps.findIndex(s => s.say === 'jo' && /It's small/.test(s.text)); if (i >= 0) { Dlg.steps[i] = say('jo', "It's a house. You've got a house. Six years and a number and you've got a house with a porch."); Dlg.steps.splice(i + 1, 2, say('jo', "Don't explain it. I don't want it explained. I want to sit on the porch.")); } } };
}
