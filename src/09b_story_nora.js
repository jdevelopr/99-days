// ============================================================
// Nora (411): night-shift nurse next door. Hallway + elevator.
// ============================================================
SPECS.nora = { skin: '#a8724e', hair: '#1e1614', hairStyle: 'ponytail', shirt: '#3a8a86', pants: '#2e6a68', shoes: '#f0f0f0', tie: null };
SPECS.noraCoat = { skin: '#a8724e', hair: '#1e1614', hairStyle: 'ponytail', shirt: '#3a8a86', pants: '#2e6a68', shoes: '#f0f0f0', coat: '#2a3050', scarf: '#c8c0a8' };
SPEAKERS.nora = { name: 'Nora', color: '#7ad0c8', spec: 'nora' };

// ---------- hallway interior (4th floor of Harlan Arms) ----------
INTERIORS.hall = {
  id: 'hall', outdoor: false, floorY: FEET_Y, x0: 60, x1: 420, ceil: CEIL_Y, ambient: [104, 92, 84],
  lamp: { x: 240, y: CEIL_Y + 20 }, window: { x: 84, y: 156, w: 20, h: 30 },
  doors: [
    { x: 112, w: 20, to: 'street', label: 'Stairs', stairs: true },
    { x: 300, w: 20, to: 'apartment', label: 'Your door (412)', at: 'flat' },
    { x: 230, w: 20, to: null, label: '411', knock: true },
    { x: 372, w: 32, to: 'street', label: 'Elevator', elevator: true },
  ],
  spawnX: 322, spawnDir: -1, spawns: { flat: 322, elevator: 384, stairs: 138 },
  spots: { nora: 222, boxes: 262, elevator: 372 },
  paint(g) {
    const I = this; paintRoom(g, I, '#4a4238', '#5a3a30', gg => { for (let y = GROUND_Y + 3; y < 252; y += 6) px(gg, I.x0, y, I.x1 - I.x0, 1, 'rgba(0,0,0,0.12)'); for (let x = I.x0 + 6; x < I.x1; x += 14) px(gg, x, GROUND_Y + 2, 6, 1, 'rgba(120,60,50,0.35)'); });
    // wainscot + wallpaper stripes
    px(g, I.x0, GROUND_Y - 30, I.x1 - I.x0, 26, '#3a3028'); px(g, I.x0, GROUND_Y - 31, I.x1 - I.x0, 1, '#5a4a3a');
    for (let x = I.x0 + 4; x < I.x1; x += 8) px(g, x, CEIL_Y + 2, 2, GROUND_Y - 34 - CEIL_Y, 'rgba(0,0,0,0.08)');
    px(g, I.x0 + 200, CEIL_Y + 8, 40, 60, 'rgba(60,45,30,0.25)');
    // window at the stair end
    fWindow(g, this.window.x, this.window.y, this.window.w, this.window.h, '#2a2a30');
    // stairwell door (metal, push bar) + EXIT sign
    fDoor(g, 112, GROUND_Y, '#5a5e68', { frame: '#2a2a30' }); px(g, 114, GROUND_Y - 22, 16, 2, '#8a8a92');
    px(g, 110, GROUND_Y - 54, 24, 8, '#2a2a30'); drawText(g, 'EXIT', 122, GROUND_Y - 53, '#d84a4a', { align: 'center' });
    // apartment doors with numbers
    for (const [dx, num] of [[168, '410'], [230, '411'], [300, '412']]) { fDoor(g, dx, GROUND_Y, '#4a2e22'); px(g, dx + 4, GROUND_Y - 52, 12, 7, '#2a2a30'); drawText(g, num, dx + 10, GROUND_Y - 51, '#d8d0b8', { align: 'center' }); px(g, dx + 6, GROUND_Y - 38, 8, 1, '#3a2a1a'); }
    px(g, 171, GROUND_Y - 30, 14, 1, '#c8a850');  // 410 mail slot
    // elevator: brass doors, indicator
    px(g, 368, GROUND_Y - 50, 40, 50, '#2a2a30'); px(g, 372, GROUND_Y - 44, 32, 44, '#8a7a4a'); px(g, 387, GROUND_Y - 44, 2, 44, '#2a2a30');
    px(g, 372, GROUND_Y - 44, 32, 1, '#c8b070'); px(g, 372, GROUND_Y - 24, 14, 1, '#6a5a30'); px(g, 390, GROUND_Y - 24, 14, 1, '#6a5a30');
    px(g, 376, GROUND_Y - 56, 24, 8, '#1a1a20'); for (let i = 0; i < 4; i++) px(g, 379 + i * 6, GROUND_Y - 54, 3, 4, i === 3 ? '#e8b84a' : '#3a3a44');
    px(g, 362, GROUND_Y - 30, 4, 6, '#8a7a4a'); px(g, 363, GROUND_Y - 29, 2, 2, '#e8b84a');
    // sconces at 2m
    for (const sx of [150, 270, 350]) { px(g, sx - 4, GROUND_Y - 46, 8, 5, '#c8a850'); px(g, sx - 3, GROUND_Y - 50, 6, 4, '#f8e8a0'); }
    // fire extinguisher, radiator
    px(g, 200, GROUND_Y - 24, 5, 14, '#c83a3a'); px(g, 201, GROUND_Y - 26, 3, 2, '#2a2a30'); fRadiator(g, 66, GROUND_Y, 22);
    // runner carpet edge
    px(g, I.x0, GROUND_Y + 1, I.x1 - I.x0, 1, '#7a3a34'); px(g, I.x0, 250, I.x1 - I.x0, 1, '#7a3a34');
  },
  fg(g) {
    if (G.elevatorBroken) { px(g, 376, GROUND_Y - 34, 24, 12, '#e8e0c8'); drawText(g, 'OUT OF', 388, GROUND_Y - 33, '#a83030', { align: 'center' }); px(g, 378, GROUND_Y - 25, 20, 1, '#a83030'); }
    if (G.day >= 8 && G.day <= 9) { for (let i = 0; i < 3; i++) { const bx = 262 + i * 14, by = GROUND_Y + 4 - (i === 1 ? 12 : 0); px(g, bx, by - 12, 14, 12, '#a8845a'); px(g, bx, by - 12, 14, 1, '#c8a878'); px(g, bx + 6, by - 12, 2, 12, '#7a5a3a'); } }
  }
};

// ---------- elevator ----------
const Elevator = {
  active: false, dir: 'down', t: 0, phase: 0, onArrive: null, floor: 4, rattle: 0,
  start(dir, onArrive, from, to) { this.active = true; this.dir = dir; this.from = from === undefined ? (dir === 'down' ? 4 : 1) : from; this.to = to === undefined ? (dir === 'down' ? 1 : 4) : to; this.t = 0; this.phase = 0; this.onArrive = onArrive; this.floor = this.from; this.prev = G.state; G.state = 'elevator'; Audio.tone(180, 0.3, 'triangle', 0.04, 0.8); },
  steps() { return Math.max(1, Math.abs(this.to - this.from)); },
  update() {
    this.t++;
    if (Input.hit('act') && this.phase < 2) { this.phase = 2; this.t = 0; this.arrive(); }
    if (this.phase === 0 && this.t > 34) { this.phase = 1; this.t = 0; }
    else if (this.phase === 1) {
      const step = Math.min(this.steps(), Math.floor(this.t / 28));
      const fl = this.from + Math.sign(this.to - this.from) * step;
      if (fl !== this.floor) { this.floor = fl; Audio.tone(520, 0.05, 'sine', 0.03); }
      if (this.t % 9 === 0) Audio.tone(70 + Math.random() * 30, 0.08, 'sawtooth', 0.015);
      if (this.t > 28 * this.steps() + 20) { this.phase = 2; this.t = 0; this.arrive(); Audio.tone(660, 0.12, 'sine', 0.04); }
    }
    else if (this.phase === 2 && this.t > 34) { this.active = false; G.state = 'play'; }
  },
  arrive() { if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); } },
  draw(g, t) {
    const inHall = G.scene === 'hall' || G.scene === 'basement';
    const tt = this.t;
    if (this.phase === 0 || this.phase === 2) {
      // departure / arrival scene; brass panels close or open over the elevator doorway in the hall
      buildEntities();
      if (inHall) { const pl = G.entities[0]; pl.x = G.scene === 'basement' ? 340 : 388; pl.dir = -1; pl.walk = false; }
      renderScene(g, t);
      if (inHall) {
        const closing = this.phase === 0; const k = Math.min(1, tt / 30); const shut = closing ? k : 1 - k;
        const dx = G.scene === 'basement' ? 324 : 372, dw = 32, top = GROUND_Y - 44; const half = Math.round(dw / 2 * shut);
        px(g, dx, top, half, 44, '#8a7a4a'); px(g, dx + dw - half, top, half, 44, '#8a7a4a');
        if (half > 0) { px(g, dx + half - 1, top, 1, 44, '#c8b070'); px(g, dx + dw - half, top, 1, 44, '#5a4a20'); }
        UI.drawHud(g, t);
      } else {
        // street side: simple fade in/out to the shaft
        const a = this.phase === 0 ? Math.min(1, tt / 30) : 1 - Math.min(1, tt / 30);
        g.fillStyle = `rgba(4,5,9,${a})`; g.fillRect(0, 0, W, H); UI.drawHud(g, t);
      }
      return;
    }
    // ---- phase 1: shaft diorama, same scale as the rooms ----
    const sh = Math.round(Math.sin(t * 0.9) * 1) ;
    const prog = clamp(tt / (28 * this.steps() + 20), 0, 1);
    const cur = this.from + (this.to - this.from) * prog;   // fractional floor of the car
    const PITCH = 81; // 73px ceiling + 8px slab
    px(g, 0, 0, W, H, '#0d0d12');
    paintBrick(g, 0, 0, W, H, '#2a2226', 91); px(g, 0, 0, W, H, 'rgba(6,6,10,0.55)');
    // floors passing (hallway cutaways left and right of the shaft)
    const carFloor = FEET_Y + 2;
    for (let n = 0; n <= 4; n++) {
      const slabY = Math.round(carFloor + 8 - (n - cur) * PITCH);
      if (slabY < -90 || slabY > H + 10) continue;
      const wallTop = slabY - 8 - 73;
      for (const [x0, x1] of [[40, 216], [264, 440]]) {
        px(g, x0, wallTop, x1 - x0, 73, n === 0 ? '#2a2a30' : '#3a3630'); px(g, x0, slabY - 12, x1 - x0, 4, '#2a2420');
        px(g, x0, wallTop, x1 - x0, 2, '#4a4438');
        if (n === 0) { px(g, x0, wallTop, x1 - x0, 73, '#1e1c1e'); if (G.chars.amos.room && x0 > 240) { px(g, x0 + 30, slabY - 8 - 44, 20, 44, '#3a241c'); px(g, x0 + 34, slabY - 8 - 20, 3, 2, '#c8a850'); px(g, x0 + 56, slabY - 8 - 40, 8, 6, '#e8d8a0'); } for (let p = x0 + 10; p < x1 - 10; p += 40) px(g, p, wallTop + 6, 30, 3, '#3a3a40'); continue; }
        // doors + sconces, unlit
        for (let dx = x0 + 30; dx < x1 - 30; dx += 70) { px(g, dx, slabY - 8 - 44, 20, 44, '#3a241c'); px(g, dx + 15, slabY - 8 - 20, 3, 2, '#8a7a40'); px(g, dx + 34, slabY - 8 - 46, 6, 4, '#6a5a30'); }
        if (n === 1) { px(g, x0, wallTop, x1 - x0, 73, 'rgba(120,100,60,0.08)'); }
      }
      // slab across (shaft wall shows it as a ledge)
      px(g, 40, slabY - 8, 400, 8, '#1e1e26'); px(g, 40, slabY - 8, 400, 1, '#34343e');
      // floor number on the shaft wall
      drawText(g, n ? '' + n : 'B', 268, slabY - 8 - 66, '#6a6050');
      drawText(g, n ? '' + n : 'B', 208, slabY - 8 - 66, '#6a6050', { align: 'right' });
      // darkened where the shaft cuts through
    }
    // shaft column
    px(g, 216, 0, 48, H, '#141418'); for (let y = (tt * (this.dir === 'down' ? -3 : 3)) % 12; y < H; y += 12) px(g, 216, y, 48, 1, 'rgba(255,255,255,0.03)');
    px(g, 218, 0, 2, H, '#3a3a44'); px(g, 260, 0, 2, H, '#3a3a44');
    { const roofY = Math.round(carFloor + 8 - (5 - cur) * PITCH) - 8; if (roofY > -10) { px(g, 0, 0, W, Math.max(0, roofY - 4), '#08080c'); px(g, 36, roofY - 4, 408, 6, '#2a2a32'); px(g, 36, roofY - 4, 408, 1, '#4a4a54'); px(g, 226, roofY - 16, 28, 12, '#1e1e26'); } }
    // cables above the car, counterweight
    { const roofY = Math.round(carFloor + 8 - (5 - cur) * PITCH) - 8; const top = Math.max(0, roofY - 6); px(g, 239, top, 2, Math.max(0, carFloor - 55 - top), '#5a5a62'); px(g, 226, Math.max(top, ((tt * 4) % 200) - 60), 6, 30, '#2a2a30'); }
    // the car (2m wide, 2.4m tall), lit
    const cx0 = 220, cw = 40, ctop = carFloor - 53 + sh, cfl = carFloor + sh;
    px(g, cx0 - 2, ctop - 3, cw + 4, 56, '#2a2a30');
    px(g, cx0, ctop, cw, 53, '#3a3a42'); for (let x = cx0 + 4; x < cx0 + cw; x += 8) px(g, x, ctop + 2, 1, 49, '#44444e');
    px(g, cx0, ctop + 24, cw, 2, '#8a7a4a'); px(g, cx0, cfl - 1, cw, 1, '#1e1e24');
    px(g, cx0, ctop, cw, 1, '#5a5a62');
    // light + flicker
    const fl = (Math.sin(t * 0.7) > 0.92) ? 0.4 : 1;
    px(g, cx0 + 14, ctop + 1, 12, 2, `rgba(248,232,160,${fl})`);
    // indicator above the door inside the car
    px(g, cx0 + 6, ctop + 5, 28, 7, '#1a1a20'); for (let i = 0; i < 5; i++) px(g, cx0 + 8 + i * 5, ctop + 7, 3, 3, (4 - i) === this.floor ? '#e8b84a' : '#3a3a44');
    // player + lamp shadow
    const fr = charFrames(SPECS[playerSpec()]); const img = fr.idle;
    g.save(); g.globalAlpha = 0.35; g.setTransform(1, 0, 0.3, 0.3, 240, cfl); g.drawImage(fr.sil, -12, -40 + 2); g.restore();
    g.drawImage(img, 240 - 12, cfl - 40 + 2);
    // warm glow spilling from the car
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(240, ctop + 26, 6, 240, ctop + 26, 90); rg.addColorStop(0, `rgba(255,220,160,${0.22 * fl})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(150, ctop - 70, 180, 200);
    g.globalCompositeOperation = 'source-over';
    drawText(g, this.dir === 'down' ? 'going down' : 'going up', W / 2, 250, '#6a7080', { align: 'center' });
    drawVignette(g);
    { const a = this.dir === 'up' ? 1 - Math.min(1, tt / 20) : clamp((tt - 86) / 18, 0, 1); if (a > 0) { g.fillStyle = `rgba(4,5,9,${a})`; g.fillRect(0, 0, W, H); } }
    if (G.day >= 30 && t % 90 < 4) Audio.tone(120, 0.1, 'sawtooth', 0.02, 0.6);
    UI.drawHud(g, t);
  }
};
function goSceneNow(to, at) {
  Passing.leave(); const from = G.scene; G.scene = to; G.walking = false;
  if (to === 'street') { const sx = STREET.spots[at] || STREET.spots.home; const door = STREET.doors.find(d => d.to === from || (from === 'hall' && d.to === 'hall')); G.px = door ? door.x + door.w / 2 : sx; G.facing = 1; G.camX = clamp(G.px - W / 2, 0, STREET.w - W); G.dogX = G.px - 30; }
  else if (OUTDOORS[to]) { const D = OUTDOORS[to]; G.px = D.spots[at] || D.spawn; G.facing = 1; G.camX = clamp(G.px - W / 2, 0, D.w - W); G.dogX = G.px - 30; }
  else { const I = INTERIORS[to]; G.px = (I.spawns && I.spawns[at]) || I.spawnX; G.facing = I.spawnDir; G.camX = 0; G.dogX = G.px - I.spawnDir * 22; }
  onEnterScene(to); autosave(true);
}
function useStairs(dir) {
  const cost = 3 + Math.round(G.day * 0.08);
  useEnergy(cost);
  const lines = dir === 'up'
    ? (G.day < 30 ? ['Four flights. Your knees have opinions.', 'Four flights. Somebody is cooking onions on two.', 'Four flights. The light on three has been out since you moved in.'] : G.day < 70 ? ['Four flights. You stop on two and pretend to read a flyer.', 'Four flights. You count the steps now. Sixty-eight.', 'Four flights. You sit on the landing for a minute. Then another minute.'] : ['Four flights. You stop on every landing. Nobody sees.', 'Four flights. Halfway up you cannot remember why you went out.', 'Four flights. Mrs. Ortega finds you on three and does not say anything, just walks with you.'])
    : (G.day < 50 ? ['Down is easier. Down is always easier.', 'Sixty-eight steps down. The stairwell smells like wet coats.'] : ['Down, one hand on the rail the whole way.', 'You take the stairs slowly. The elevator sign says the repairman is "coming".']);
  Dlg.run([narr(pick(lines))]);
}
// street building door → hallway (elevator up or stairs)
function enterBuilding() {
  Audio.sel();
  const goUp = () => { if (G.elevatorBroken) { UI.fadeOut(() => { goSceneNow('hall', 'stairs'); UI.fadeIn(); useStairs('up'); }, 0.08); } else Elevator.start('up', () => { goSceneNow('hall', 'elevator'); }); };
  const goDown = () => { if (G.elevatorBroken) { UI.fadeOut(() => { goSceneNow('basement', 'stairs'); UI.fadeIn(); Dlg.run([narr('One flight down. The stairwell smells like the boiler and, faintly, sawdust.')]); }, 0.08); } else Elevator.start('down', () => { goSceneNow('basement', 'elevator'); }, 1, 0); };
  if (G.chars.amos.room) Menu.open('Harlan Arms', [{ t: 'Up to your floor (4)', do: goUp }, { t: "Down to the basement (Amos)", do: goDown }, { t: 'Never mind', do: () => { } }]);
  else goUp();
}
function hallDoor(d) {
  const here = G.scene; const room = G.chars.amos.room;
  if (d.elevator) {
    if (G.elevatorBroken) { UI.toast('Out of order. Again.', '#e86a6a'); Audio.bad(); return; }
    Audio.sel();
    const toStreet = () => Elevator.start(here === 'hall' ? 'down' : 'up', () => { goSceneNow('street', 'home'); }, here === 'hall' ? 4 : 0, 1);
    if (here === 'hall' && room) Menu.open('Elevator', [{ t: 'Street (1)', do: toStreet }, { t: 'Basement (B)', do: () => Elevator.start('down', () => { goSceneNow('basement', 'elevator'); }, 4, 0) }, { t: 'Never mind', do: () => { } }]);
    else if (here === 'basement') Menu.open('Elevator', [{ t: 'Street (1)', do: toStreet }, { t: 'Your floor (4)', do: () => Elevator.start('up', () => { goSceneNow('hall', 'elevator'); }, 0, 4) }, { t: 'Never mind', do: () => { } }]);
    else toStreet();
    return;
  }
  if (d.stairs) {
    Audio.sel();
    const toStreet = () => UI.fadeOut(() => { goSceneNow('street', 'home'); UI.fadeIn(); if (here === 'hall') useStairs('down'); else Dlg.run([narr('One flight up, and out.')]); }, 0.08);
    if (here === 'hall' && room) Menu.open('Stairs', [{ t: 'Down to the street', do: toStreet }, { t: 'Down to the basement (Amos)', do: () => UI.fadeOut(() => { goSceneNow('basement', 'stairs'); UI.fadeIn(); useEnergy(2); Dlg.run([narr('Five flights down. The last one is unlit. You count the steps by the boiler getting louder.')]); }, 0.08) }, { t: 'Never mind', do: () => { } }]);
    else if (here === 'basement') Menu.open('Stairs', [{ t: 'Up to the street', do: toStreet }, { t: 'Up to your floor (4)', do: () => UI.fadeOut(() => { goSceneNow('hall', 'stairs'); UI.fadeIn(); useStairs('up'); }, 0.08) }, { t: 'Never mind', do: () => { } }]);
    else toStreet();
    return;
  }
  if (d.knock) { Nora.knock(); return; }
  goScene(d.to, d.at);
}

// ---------- Nora ----------
const Nora = {
  init() { return { stage: 0, trust: 0, met: false, talks: 0, pushed: 0, cold: false, told: false, boxes: false, soup: 0, asked: false, person: false, spec: 'nora', lastTalk: 0, checkedAmos: false, riverSat: false }; },
  ensure() { if (!G.chars.nora) G.chars.nora = this.init(); },
  present() { return G.day >= 8 && !!G.chars.nora; },
  where() {
    if (!this.present()) return null; const n = G.chars.nora;
    if (G.day <= 9) return { scene: 'hall', x: INTERIORS.hall.spots.nora + 34, spec: 'nora' };
    if (G.tod < 0.16) return { scene: 'hall', x: INTERIORS.hall.spots.nora, spec: 'noraCoat' };        // coming home off shift
    if (G.tod > 0.74 && G.tod < 0.92) return { scene: 'hall', x: INTERIORS.hall.spots.elevator - 22, spec: 'noraCoat' }; // leaving for shift
    if (!n.cold && n.trust >= 2 && G.day >= 15 && G.tod > 0.82 && !G.chars.nadia.closed && G.day % 3 === 0) return { scene: 'diner', x: 372, spec: 'nora' };
    if (!n.cold && n.trust >= 4 && G.day >= 40 && G.tod < 0.14 && G.day % 4 === 1) return { scene: 'street', x: STREET.spots.river - 20, spec: 'noraCoat', sit: true };
    return null;
  },
  knock() {
    const n = G.chars.nora;
    if (G.day < 8) { Dlg.run([narr(G.day < 4 ? '411. Empty since spring. A strip of masking tape over the bell.' : 'A "Welcome" mat has appeared outside 411. Nobody home yet.')]); return; }
    if (n.cold) { Dlg.run([narr('You hear the TV through the door. Nobody comes.')]); return; }
    if (n.trust >= 5 && G.tod > 0.3 && G.tod < 0.7) { Dlg.run([narr('You knock softly. A long pause.'), say('nora', "...It's open. I'm decent. Mostly."), narr('She is on the couch under two blankets, eyes half shut.'), say('nora', "I got off at seven. What time is it? Never mind. Sit."), narr('You sit. She falls asleep mid-sentence. You let yourself out.'), { fn: () => { trust('nora', 1); useEnergy(3); } }]); return; }
    Dlg.run([narr('Blackout curtains, a hand-lettered sign: NIGHT SHIFT - PLEASE DO NOT KNOCK BEFORE 4PM. You do not knock again.')]);
  },
  menu() {
    const n = G.chars.nora;
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }];
    if (G.day <= 9 && !n.boxes) items.push({ t: 'Help with the boxes', r: '-5 energy', do: () => this.boxes() });
    if (!n.cold && n.trust >= 2 && Amos.present() && G.chars.amos.sick && !n.checkedAmos) items.push({ t: 'Ask her to look at Amos', do: () => this.checkAmos() });
    if (C('nadia').stage >= 2 && !G.flags.dinerClosed && !G.flags.toldNoraDiner && n.met && !n.cold) items.push({ t: "Mention Nadia's diner", do: () => { G.flags.toldNoraDiner = true; C('nadia').customers = (C('nadia').customers || 0) + 1; Dlg.run([you("Nadia's is open late. Real coffee. If you ever get off and can't sleep."), say('nora', "Can't sleep is my whole personality. I'll go.")]); } });
    { const ci = n.met && !n.cold ? Theo.clueItem('nora') : null; if (ci) items.push(ci); }
    if (n.met && !n.cold) Gifts.nora(items);
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(n.met ? 'Nora' : 'The woman from 411', items);
  },
  boxes() {
    const n = G.chars.nora; n.boxes = true; n.met = true; useEnergy(5); trust('nora', 2); remember('nora_boxes'); clearPortrait('nora');
    Dlg.run([narr('You take the heavy one. It says KITCHEN and weighs like BOOKS.'), say('nora', "Careful, that's every mug I own. I have a problem with mugs."), narr('Four trips. Her apartment is the mirror of yours. Same crack in the ceiling, other direction.'), say('nora', "Nora. 411, obviously. I work nights at St. Anne's, so if you hear me at six a.m. it's not a burglar, it's a nurse having a breakdown over her keys."), you("412. I'll keep it down."), say('nora', "You can keep it up. I sleep through anything. Occupational.")]);
  },
  checkAmos() {
    const n = G.chars.nora; const a = G.chars.amos; n.checkedAmos = true; a.sick = false; a.spec = a.coat ? 'amos2' : 'amos1'; clearPortrait('amos'); trust('nora', 2); trust('amos', 2); remember('nora_amos'); useEnergy(6);
    Dlg.run([narr('She goes down in her scrubs with a bag from under the sink. It takes twenty minutes.'), say('nora', "Chest is bad, but it's not pneumonia yet. I've got a Z-pack from a friend who owes me. Don't ask."), say('nora', "He needs to be dry and warm for a week. That's the medicine. The pills are just to make the medicine work."), narr('Amos watches her walk back inside like she might be a hallucination.'), say('amos', "Who was that?"), you("My neighbor."), say('amos', "You've got good neighbors.")]);
  },
  talk() {
    const n = G.chars.nora; if (!talkEnergy()) return; n.talks++; n.lastTalk = G.day; const L = [];
    if (n.cold) { L.push(say('nora', fresh('nora', ["Morning.", "Long night. Sorry, I'm dead on my feet.", "Hey."]))); Dlg.run(L); return; }
    if (n.pawnedGift && !n.pawnTalked) { n.pawnTalked = true; Dlg.run([say('nora', "My thermos is in Sol's window. Twenty dollars. I walked past it twice to be sure."), say('nora', "It's a thermos. It's fine. It was my grandmother's, and it's fine.")]); return; }
    { const on = outfitNotice('nora'); if (on) L.push(on); }
    if (!n.met) { n.met = true; clearPortrait('nora'); L.push(narr('A woman in scrubs and a parka, keys in her teeth, a box balanced on one knee.'), say('nora', "Hi. Sorry. Hi. Nora, 411, as of about an hour ago."), say('nora', "You're 412? Great. I'll be the one coming in at six a.m. Wear earplugs, I'm not quiet."), you("412. I don't sleep much either."), say('nora', "Then we'll be a matched set.")); if (G.day <= 9) L.push(narr('There are still boxes in the hall.')); }
    else if (n.stage === 0) {
      if (n.talks >= 2 && !n.askedCough) {
        n.askedCough = true;
        L.push(say('nora', "Can I say something? Nurse thing, ignore me if you want."), say('nora', "That cough. How long?"),
          choice({ t: "Since before you moved in. It's not going to get better.", do: () => { n.told = true; trust('nora', 3); remember('nora_told'); n.stage = 1; return [narr("You tell her. The clinic, the number, the trial. It comes out flat, like a grocery list."), say('nora', "..."), say('nora', "Okay. Thank you for telling me. I'm not going to do the face. You've had enough of the face."), say('nora', "Okafor's good. I've sent people to her. And if you ever need someone to translate what she says into English, I'm thirty feet away.")]; } },
            { t: "It's nothing. Damp building.", do: () => { n.pushed++; trust('nora', -1); return [say('nora', "Damp building. Sure."), narr('She does not push. She has the look of someone who has learned exactly when not to push.')]; } },
            { t: "I'd rather not talk about it.", do: () => { n.pushed++; return [say('nora', "Fair. Door's thirty feet away if that changes.")]; } }));
      } else L.push(say('nora', fresh('nora', ["Twelve hours on the ward. My feet have opinions.", "The elevator ate my grocery bag Tuesday. Just took it. I'm scared to ask what floor it's on.", "Does the hot water do the thing where it screams for a minute first? Yours too? Good. Solidarity.", "I met the man by the stoop. Amos? He asked if I was your nurse. I said I was your neighbor, which is a kind of nurse."])));
      if (n.talks >= 4 && n.trust >= 1 && !n.told) n.stage = 1;
    }
    else if (n.stage === 1) {
      if (n.soup === 0 && G.tod < 0.2) { n.soup = 1; L.push(say('nora', "Hold on."), narr('She comes back with a thermos.'), say('nora', "Congee. My grandmother's. I made too much, which is a lie, I made it for you. Eat it while it's hot or I'll know."), { fn: () => { addHunger(35); trust('nora', 1); remember('nora_soup'); G.inv.thermos = 1; } }); }
      else if (!n.story1 && n.trust >= 4) { n.story1 = true; L.push(say('nora', "My brother died when I was nineteen. Leukemia. Eleven months from the word to the end."), say('nora', "Everyone kept saying he was brave. He wasn't brave, he was scared, he was scared the whole time and he did it anyway. That's not brave. That's just the only option."), say('nora', "I became a nurse because I wanted to be the person in the room who doesn't say brave."), you("What do you say instead?"), say('nora', "'I'm here.' It's all anybody wants. It's all he wanted."), { fn: () => { trust('nora', 1); n.stage = 2; } }); }
      else L.push(say('nora', fresh('nora', ["Rough shift. Lost one. You learn to leave it in the parking lot, and then you carry it up four flights anyway.", "You're thinner. I'm not going to say anything about it. I just said it. Sorry.", "There's a trial coordinator at St. Anne's who owes me a favor. I asked. It's real, it's just slow. I'll keep asking.", "Sam from the diner thinks I'm a spy. I told him I am. He's terrified. It's wonderful."])));
      if (n.trust >= 4 && n.story1) n.stage = 2;
    }
    else if (n.stage === 2) {
      if (!n.story2 && G.day >= 45) { n.story2 = true; remember('nora_honest'); L.push(say('nora', "Okafor told you about the trial. I could tell from the way you took the stairs."), say('nora', "I'm going to say the thing nobody says. Can I?"), you("Say it."), say('nora', "It's going to get worse and then it's going to be over, and before it's over there's going to be a stretch where you can't do much of anything, and that stretch is the one people are afraid of."), say('nora', "So what do you want that stretch to be?"),
        choice({ t: "Not alone.", do: () => { n.wish = 'company'; return [say('nora', "Okay. That's a thing I know how to do.")]; } },
          { t: "Quiet. Just the rain.", do: () => { n.wish = 'quiet'; return [say('nora', "Okay. Quiet, I can do. I'm loud but I can do quiet.")]; } },
          { t: "I don't know yet.", do: () => { n.wish = 'unsure'; return [say('nora', "That's honest. Most people say 'not alone' because they think it's the right answer. You can decide later. I'll still be thirty feet away.")]; } }),
        { fn: () => { trust('nora', 2); } }); }
      else if (!n.person && G.day >= 80 && n.trust >= 7) { n.person = true; remember('nora_person'); L.push(say('nora', "Okafor asked me who to call. When it's time. I said me, if that's alright."), say('nora', "I get off at seven. I'll come straight up. I'll have my keys in my teeth and I'll be loud on purpose so you know it's me."), you("You don't have to."), say('nora', "I know I don't have to. That's the whole point of it.")); }
      else L.push(say('nora', fresh('nora', ["I brought you a pulse oximeter from work. It's stolen. Put your finger in it when you feel bad and if the number's under ninety, bang on the wall.", "Amos brought coffee up for both of us. He knocked on the wrong door first. We're a building now, apparently.", "Mei drew me. I look like I haven't slept since 2019. It's accurate.", "Walter's radio. Did you fix that? He told me a neighbor fixed it. I said, that's my neighbor. I was proud. Is that weird?", "Bang on the wall if you need me. Two for 'come over.' Three for 'bring the bag.'"])));
    }
    if (n.pushed >= 2 && !n.cold && !n.told) { n.cold = true; remember('nora_cold'); L.push(narr('Something in her shuts, politely. She will nod to you in the hall from now on. That is all.')); }
    if (L.length === 0) L.push(say('nora', "Hey."));
    Dlg.run(L);
  },
  cameoTalk(where) {
    const n = G.chars.nora; if (!talkEnergy(3)) return;
    if (where === 'diner') Dlg.run([say('nora', fresh('nora', ["Post-shift pie. Nadia's started keeping a slice back for me. I'm never leaving this building.", "Sit. I've got twenty minutes before I turn into a pumpkin.", "Nadia asked if you were okay. I said define okay. She said fair."]))]);
    else { n.riverSat = true; remember('nora_river'); Dlg.run([narr('She is on the bench at the river in her parka, a coffee going cold in both hands.'), say('nora', "I come here after the bad ones. Amos told me about it. You've got a whole network of people sending each other to this bench, you know that?"), say('nora', "Sit. Don't say anything. Watch the water do nothing for a while."), { fn: () => { trust('nora', 1); useEnergy(4); } }]); }
  },
  wallListen() {
    const n = G.chars.nora;
    if (G.day < 8) return 'Through the wall: nothing. 411 has been empty since spring.';
    if (n.cold) return pick(['Through the wall: the TV, a laugh at something. You shared a wall for months and that laugh is all you know of her.', 'Through the wall: a kettle. A door. Quiet.']);
    if (n.trust >= 5) return pick(['Through the wall: Nora, home from shift, dropping her keys, swearing, laughing at herself. You bang twice. She bangs twice back.', 'Through the wall: nothing. She is on shift. The wall is just a wall until seven.']);
    return pick(['Through the wall: a kettle, a radio, someone humming badly.', 'Through the wall: keys, a sigh, the TV.']);
  },
  endingLine() {
    const n = G.chars.nora; if (!n) return null;
    if (n.cold) return { name: 'Nora, 411', line: 'You shared a wall for ninety days. You heard her laugh through it once. That is all you know.', bad: true };
    if (n.person) return { name: 'Nora Reyes', line: 'Night-shift nurse, thirty feet away. She was the one they called. She came straight from work with her keys in her teeth.' };
    if (n.stage >= 2) return { name: 'Nora Reyes', line: "She said the thing nobody says, and then she said 'I'm here.' She meant it." };
    if (n.told) return { name: 'Nora', line: 'You told her the truth about the cough. She did not do the face. She brought congee.' };
    if (n.met) return { name: 'Nora', line: 'The nurse in 411. You helped with the boxes. You nodded in the hall.' };
    return { name: 'The woman in 411', line: 'Keys at six a.m. through the wall. You never learned her name.', bad: true };
  }
};
