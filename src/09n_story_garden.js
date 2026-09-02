// ============================================================
// Hector's garden: the lot behind the diner alley. Weeds, then beds, then food. It grows with whoever you bring.
// ============================================================
S('veg', ['..gg..', '.gGGg.', 'rRRRRr', 'rRrRRr', 'rRRRRr', '.rrrr.'], { g: '#4a8a3a', G: '#7ab85a', r: '#a83a2a', R: '#d84a3a' });
FOOD.veg = { name: 'vegetables', price: 0, hunger: 35, noShop: true };
const GARDEN = {
  w: 480, spawn: 52, spots: { gate: 40, bench: 78, beds: 220, barrel: 352, shed: 410 },
  doors: [{ x: 26, w: 26, to: 'street', at: 'garden', label: 'Back to the street' }],
  render(g, t) { renderGarden(g, t); }
};
OUTDOORS.garden = GARDEN;
const GardenWorld = { static: null };
const Garden = {
  init() { return { unlocked: false, seeds: false, cleared: 0, planted: false, growth: 0, lastWater: 0, wilted: false, helpers: {}, helperAsked: {}, harvests: 0, lastHarvest: 0, ready: 0, visits: 0, tendDay: 0, barrel: false, barrelDay: 0, flowers: false, drawn: false, ortegaTalks: 0, sat: 0, offered: false }; },
  S() { if (!G.garden) G.garden = this.init(); return G.garden; },
  stage() { const s = this.S(); if (!s.unlocked) return 0; if (s.cleared < 2) return 0; if (!s.planted) return 1; if (s.growth < 25) return 2; if (s.growth < 55) return 3; if (s.growth < 85) return 4; return 5; },
  helperCount() { return Object.keys(this.S().helpers).length; },
  // who is in the garden right now
  present(id) {
    const s = this.S(); if (!s.helpers[id]) return false;
    if (id === 'amos') return G.tod < 0.3 && !G.chars.amos.dead && !G.chars.amos.gone;
    if (id === 'nora') return G.day % 3 === 0 && G.tod > 0.3 && G.tod < 0.7 && G.chars.nora && !G.chars.nora.cold;
    if (id === 'mei') return G.day % 2 === 1 && G.tod > 0.45 && G.tod < 0.85 && !G.chars.mei.cold;
    return false;
  },
  ortegaHere() { const s = this.S(); return s.unlocked && G.day % 5 === 2 && G.tod > 0.4 && G.tod < 0.8; },
  // the offer, in Mrs. Ortega's menu once you have helped her twice
  offerItem() {
    const s = this.S(); const f = G.flags;
    if (s.unlocked || (f.grannyHelped || 0) < 2) return null;
    return { t: "Ask about Hector's garden", do: () => this.offer() };
  },
  offer() {
    const s = this.S(); s.unlocked = true; s.seeds = true; markTalked(); useEnergy(2); remember('garden_key');
    Dlg.run([say('granny', "Hector's garden. Behind the diner, down the alley, the lot with the fence. Nadia's father let him have it in 1979 and nobody's ever asked for it back."),
      say('granny', "Tomatoes, beans, peppers. Thirty years. Since he went it's weeds, and I can't bend, and I can't look at it either."),
      narr('A key on a loop of red wool. A coffee can, not the one on your table: this one is full of seed packets with the years written on them in a hand that is not hers.'),
      say('granny', "You can bend. Go clear it. Plant what's in the can; it's old seed but Hector's seed always came up, it was afraid not to."),
      say('granny', "And bring people. He always had people back there. A garden with one man in it is just a man digging."),
      { fn: () => { UI.toast('A key on red wool. A can of seeds.', '#8ae88a'); } }]);
  },
  // the menu at the beds
  menu() {
    const s = this.S(); const st = this.stage(); const items = []; const tended = s.tendDay === G.day;
    if (st === 0) items.push({ t: s.cleared === 0 ? 'Start clearing the weeds' : 'Finish clearing', r: '-12 energy', disabled: () => G.energy < 12 || tended, do: () => this.clear() });
    else if (st === 1) items.push({ t: "Plant Hector's seeds", r: '-10 energy', disabled: () => G.energy < 10, do: () => this.plant() });
    else items.push({ t: s.wilted ? 'Water it (it needs it)' : 'Water and weed', r: tended ? 'done today' : '-8 energy', disabled: () => G.energy < 8 || tended, do: () => this.tend() });
    if (st === 5 && s.ready > 0) items.push({ t: 'Pick what is ready', r: () => `${s.ready} vegetables`, do: () => this.harvest() });
    if (s.barrel) items.push({ t: 'Check the rain barrel', do: () => Dlg.run([narr(G.rain > 0.3 ? 'Full and running over. Amos put a stone on the lid so the wind would not take it. The wind has tried.' : 'Half full. The rain always comes back; Amos said so, and he would know.')]) });
    items.push({ t: 'Leave', do: () => { } });
    const sub = ['Weeds to the fence. Somewhere under them, three beds.', 'Three beds, cleared. Dirt that has not been turned in years.', 'Rows of dirt with the seed packets on sticks at the ends. Nothing yet.', 'Sprouts. Small, green, absurd, alive.', 'Tomato cages and bean poles. Something is going to happen.', s.wilted ? 'Leaves gone soft. It wants water.' : 'Red among the green. Hector\'s garden, thirty-one years on.'][st];
    Menu.open("Hector's garden", items, { sub });
  },
  clear() {
    const s = this.S(); s.cleared++; s.tendDay = G.day; s.visits++; useEnergy(12); addHunger(-4); markTalked(); remember('garden_clear');
    Dlg.run([narr(s.cleared === 1 ? 'You pull weeds until your hands are green and your chest tells you to stop. Under the weeds: the edge of a raised bed, the wood still sound. Hector built things to last.' : 'The second day is the roots. By the end there are three beds, three rectangles of tired dirt, and a rusted tomato cage you set upright because it seemed to want to be.'),
      s.cleared >= 2 ? narr('It looks like a garden now, the way an empty stage looks like a play.') : null]);
  },
  plant() {
    const s = this.S(); s.planted = true; s.lastWater = G.day; s.growth = 5; s.tendDay = G.day; s.visits++; useEnergy(10); markTalked(); remember('garden_plant');
    Dlg.run([narr('Tomatoes in the first bed, beans in the second, peppers in the third, because that is the order the packets were in and Hector had a system.'), narr('You water them from the diner spigot with a bucket that leaks. It takes eleven trips. On the eleventh you stop counting the days for a minute.')]);
  },
  tend() {
    const s = this.S(); s.tendDay = G.day; s.visits++; s.lastWater = G.day; const was = s.wilted; s.wilted = false; useEnergy(8); addHunger(-3); markTalked();
    const gain = 10 + (s.barrel ? 2 : 0); s.growth = Math.min(100, s.growth + gain); this.checkReady();
    const st = this.stage();
    Dlg.run([narr(was ? 'The leaves come back up while you watch, which is not possible, and which they do.' : pick(['You water. You weed. The bucket leaks the same amount every trip; there is something restful in that.', 'A bee. The first one you have seen on Harlan Street. It does not know it is the first.', 'You pinch the suckers off the tomatoes the way the packet says. The packet is from 1994 and it is still right.', 'Dirt under the nails. It stays there all day. You keep looking at it on the bus, at the counter, at the table.'])),
      st === 5 && s.ready > 0 ? narr('Something is red.') : null]);
  },
  harvest() {
    const s = this.S(); const n = s.ready; s.ready = 0; s.harvests++; s.lastHarvest = G.day; G.inv.veg = (G.inv.veg || 0) + n; markTalked(); remember('garden_harvest'); Audio.good();
    Dlg.run([narr(s.harvests === 1 ? `${n} tomatoes, a handful of beans, one pepper that is mostly a promise. You eat a tomato standing in the bed, warm, and it is the best thing you have eaten in ninety days or in your life; you cannot tell anymore and it does not matter.` : `${n} vegetables in the leaking bucket. There will be more in a few days. That is the arrangement.`)]);
  },
  checkReady() { const s = this.S(); if (this.stage() === 5 && G.day - s.lastHarvest >= 3 && s.ready === 0) { s.ready = 2 + this.helperCount() + (s.barrel ? 1 : 0); } },
  daily() {
    const s = this.S(); if (!s.unlocked || !s.planted) return;
    let watered = false, gain = 0;
    for (const id in s.helpers) { if (id === 'amos' && !G.chars.amos.dead) { watered = true; gain += 4; } if (id === 'nora' && G.day % 3 === 0) { watered = true; gain += 4; } if (id === 'mei' && G.day % 2 === 1) { watered = true; gain += 3; } }
    if (watered) { s.lastWater = G.day; s.wilted = false; }
    if (G.day - s.lastWater >= 3) s.wilted = true;
    if (!s.wilted) s.growth = Math.min(100, s.growth + gain + 1);
    if (s.helpers.amos && !s.barrel && G.day >= (s.barrelDay || 0)) s.barrel = true;
    this.checkReady();
  },
  // recruiting
  recruitItem(id) {
    const s = this.S(); if (!s.unlocked || s.cleared < 1 || s.helpers[id] || s.helperAsked[id]) return null;
    const labels = { amos: 'Ask him to help with the garden', nora: 'Tell her about the garden', mei: 'Tell her about the garden' };
    return { t: labels[id], do: () => this.recruit(id) };
  },
  recruit(id) {
    const s = this.S(); if (!talkEnergy(3)) return; s.helperAsked[id] = true;
    const c = G.chars[id];
    if (id === 'amos') {
      if (c.trust < 3) { Dlg.run([say('amos', "A garden. ...I've got a back like a dropped ladder. Ask me when I've got a reason to get up early."), narr('He does not say no. He says not yet, which from Amos is a calendar.')]); s.helperAsked[id] = false; return; }
      s.helpers.amos = G.day; s.barrelDay = G.day + 2; remember('garden_amos');
      Dlg.run([say('amos', "Hector's lot? Hector Ortega? He fixed a radiator for me once in a building I'd been thrown out of. Didn't ask why I was there."), say('amos', "I'll build you beds that don't rot. Rain barrel off the diner gutter; it's free water and it's falling anyway. Dawn. I'm up at dawn regardless."), narr('He is there the next morning before you are, with a hammer he did not have yesterday and will not explain.')]);
    } else if (id === 'nora') {
      if (c.trust < 2) { Dlg.run([say('nora', "A garden. That's nice. That's genuinely nice. Ask me on a day I've slept."), { fn: () => { s.helperAsked[id] = false; } }]); return; }
      s.helpers.nora = G.day; remember('garden_nora');
      Dlg.run([say('nora', "Dirt. Yes. God, yes. Twelve hours of fluorescent light and you're offering me dirt."), say('nora', "Days off. I'll come days off. I'll bring gloves; I've got a drawer of the blue ones."), narr('She comes on her days off in scrubs with the sleeves pushed up, and she weeds the way she does everything, fast and without discussion.')]);
    } else {
      if (c.trust < 2) { Dlg.run([say('mei', "A garden? Behind the diner? I didn't know there was a behind the diner."), { fn: () => { s.helperAsked[id] = false; } }]); return; }
      s.helpers.mei = G.day; remember('garden_mei');
      Dlg.run([say('mei', "Behind Nadia's? With actual dirt? I'm bringing the sketchbook. I'm bringing seeds; Mom's got marigolds she says keep bugs off, I don't know if that's true, they're orange."), narr('She plants a row of marigolds along the fence the first afternoon and draws them the second. The garden is in the sketchbook now, which is a kind of second garden.'), { fn: () => { s.flowers = true; s.drawn = true; } }]);
    }
  },
  helperTalk(id) {
    const s = this.S(); if (!talkEnergy(3)) return; const st = this.stage();
    const L = { amos: ["Beds are square now. Hector's were square; they'd gone. Wood remembers if you let it.", "Barrel's up. Diner gutter feeds it. Nadia said take the water, she said it like water was nothing, which it is, which it isn't.", st >= 4 ? "Tomatoes. I haven't grown a thing since the house. I didn't know my hands still knew." : "Dawn's the time. The plants don't know you're tired.", "Hector'd have liked you. He liked anybody who showed up twice."],
      nora: ["Blue gloves. Hospital gloves. Don't tell the ward.", "There's a bee. I'm a nurse; I'm allowed to be scared of a bee.", st >= 4 ? "I'm taking a tomato for the break room. I'm going to make them all watch me eat it." : "This is better than sleep. Don't tell sleep.", "Mrs. Ortega came by and stood at the gate. Didn't come in. Held onto it a while. I didn't say anything. That was the right thing; I checked later."],
      mei: ["The marigolds are doing the thing. Mom's right. I'm not telling her.", "I drew the beds from the shed roof. Amos held the ladder and complained the whole time.", st >= 4 ? "Red. I've been waiting weeks to use the red pencil." : "I'm drawing it every visit. Same angle. It's going to be a flipbook by the end.", "Mom asked where the vegetables came from. I said a friend. She said friends don't grow peppers. I said this one does."] };
    Dlg.run([say(id, fresh(id, L[id]))]);
  },
  ortegaTalk() {
    const s = this.S(); if (!talkEnergy(3)) return; s.ortegaTalks++; const st = this.stage();
    const L = [];
    if (s.ortegaTalks === 1) L.push(narr('She is at the gate, not in it. Both hands on the wire.'), say('granny', "I haven't been past this gate since the funeral. I'm not coming past it today either. I'm looking. Looking's allowed."));
    else if (st >= 5 && !s.ortegaIn) { s.ortegaIn = true; remember('garden_ortega'); L.push(narr('She comes in. She does not say anything about coming in. She goes to the first bed and puts her hand on a tomato without picking it.'), say('granny', "He said a man who can fix a radiator can grow a tomato. He was wrong for two years and then he was right for thirty."), say('granny', "Thirty-one now. Thirty-one."), narr('She sits on the bench. It is the first time you have seen her sit anywhere.')); }
    else L.push(say('granny', fresh('granny', [st < 3 ? "Weeds don't quit. Hector said that's what he liked about them." : "It's coming. It's coming up. I can see it from the gate.", "Bring people. I said. I see you brought people.", "The bench was his. He sat on it and told the tomatoes what to do. They did it, mostly."])));
    Dlg.run(L);
  },
  endingLine() {
    const s = this.S(); const st = this.stage(); const names = Object.keys(s.helpers).map(k => ({ amos: 'Amos', nora: 'Nora', mei: 'Mei' }[k]));
    if (!s.unlocked) return null;
    if (st === 0) return { name: "Hector's garden", line: 'She gave you the key on red wool. The weeds are still to the fence. She has not been past the gate.', bad: true };
    if (st < 5) return { name: "Hector's garden", line: `Three beds cleared and planted with thirty-year-old seed. ${names.length ? names.join(' and ') + ' came to water. ' : ''}It did not come up in time. It will come up.` };
    return { name: "Hector's garden", line: `Tomatoes, beans, peppers, thirty-one years on. ${s.harvests} harvest${s.harvests === 1 ? '' : 's'}. ${names.length ? names.join(', ') + ' still go back there. ' : ''}${s.ortegaIn ? 'Mrs. Ortega sits on his bench now and tells the tomatoes what to do.' : 'Mrs. Ortega watches from the gate.'}` };
  }
};

// ---------- the lot (its own diorama) ----------
function buildGardenStatic() {
  const [c, g] = mkCanvas(GARDEN.w, H);
  // the backs of the diner (left) and the laundry (right); the alley comes in at the far left
  paintConcrete(g, 60, GROUND_Y - 104, 220, 104, '#4e4e56', 91); paintBrick(g, 280, GROUND_Y - 150, 200, 150, '#52525c', 93);
  px(g, 60, GROUND_Y - 104, 420, 2, '#2a2a30');
  // alley mouth at the left, with the street light showing through
  px(g, 0, GROUND_Y - 120, 60, 120, '#1a1a22'); px(g, 24, GROUND_Y - 60, 14, 60, '#3a3a44'); px(g, 26, GROUND_Y - 58, 10, 56, '#5a6070');
  // diner back door, exhaust, a crate; laundry vent, fire escape
  px(g, 100, GROUND_Y - 44, 22, 44, '#3a3a40'); px(g, 102, GROUND_Y - 42, 18, 40, '#5a3a2a'); px(g, 116, GROUND_Y - 24, 2, 2, '#c8a850');
  px(g, 150, GROUND_Y - 80, 30, 14, '#5a5a62'); px(g, 154, GROUND_Y - 84, 8, 4, '#4a4a52'); px(g, 190, GROUND_Y - 20, 20, 20, '#7a6a4a');
  px(g, 300, GROUND_Y - 120, 60, 3, '#2a2a30'); px(g, 300, GROUND_Y - 117, 2, 30, '#2a2a30'); px(g, 358, GROUND_Y - 117, 2, 30, '#2a2a30'); for (let x = 300; x < 360; x += 6) px(g, x, GROUND_Y - 120, 1, 12, '#3a3a44');
  paintWindow(g, 320, GROUND_Y - 100, 18, 24, 'plain', 7); paintWindow(g, 400, GROUND_Y - 100, 18, 24, 'plain', 8); paintWindow(g, 400, GROUND_Y - 140, 18, 24, 'plain', 9);
  // the lot: packed dirt, a fence along the front cut edge
  px(g, 0, GROUND_Y, GARDEN.w, H - GROUND_Y, '#4a3e30'); px(g, 0, GROUND_Y, GARDEN.w, 1, '#6a5a44');
  const R = seeded(77); for (let i = 0; i < 420; i++) px(g, Math.floor(R() * GARDEN.w), GROUND_Y + 1 + Math.floor(R() * 60), 1 + Math.floor(R() * 3), 1, R() < 0.5 ? '#3e3226' : '#5a4a38');
  px(g, 60, GROUND_Y, 1, 60, '#3a3a44'); // alley wall edge
  // the shed with Hector's sign; the bench
  px(g, 384, GROUND_Y - 50, 56, 50, '#5a4a36'); px(g, 384, GROUND_Y - 50, 56, 1, '#7a6a4a'); for (let y = GROUND_Y - 46; y < GROUND_Y; y += 6) px(g, 384, y, 56, 1, 'rgba(0,0,0,0.15)');
  g.fillStyle = '#3a2e22'; g.beginPath(); g.moveTo(380, GROUND_Y - 50); g.lineTo(412, GROUND_Y - 66); g.lineTo(444, GROUND_Y - 50); g.closePath(); g.fill();
  px(g, 402, GROUND_Y - 34, 16, 34, '#3a2a1c'); px(g, 414, GROUND_Y - 18, 2, 2, '#c8a850');
  px(g, 390, GROUND_Y - 62, 44, 9, '#e8e0d0'); px(g, 390, GROUND_Y - 62, 44, 1, '#c8c0b0'); drawText(g, 'ORTEGA', 412, GROUND_Y - 61, '#6a3a2a', { align: 'center' });
  g.drawImage(SPR.bench, 66, FEET_Y - 19);
  // spigot on the diner wall
  px(g, 128, GROUND_Y - 16, 2, 16, '#8a8a92'); px(g, 126, GROUND_Y - 18, 6, 3, '#a8a8b0'); px(g, 124, GROUND_Y - 1, 10, 1, '#3a3a44');
  GardenWorld.static = c;
}
function paintBeds(g, camX, t) {
  const s = Garden.S(); const st = Garden.stage(); const wilt = s.wilted;
  const beds = [[110, 60], [190, 60], [270, 60]]; const leaf = wilt ? '#8a8a3a' : '#3a7a34', leaf2 = wilt ? '#a09a4a' : '#5aa04a';
  beds.forEach(([bx, bw], i) => {
    const x = bx - camX, top = GROUND_Y + 14, h = 10;
    if (st === 0) { // weeds to the fence
      const R = seeded(31 + i); for (let k = 0; k < 40; k++) { const wx = x + R() * bw, wh = 8 + R() * 22; px(g, wx, top - wh, 1, wh, R() < 0.5 ? '#5a6a3a' : '#7a7a4a'); if (R() < 0.3) px(g, wx - 1, top - wh, 3, 2, '#8a8a5a'); }
      if (s.cleared === 1 && i === 0) { px(g, x, top - h, bw, h, '#5a4a36'); px(g, x, top - h, bw, 1, '#7a6a4a'); px(g, x + 2, top - h + 2, bw - 4, h - 4, '#3e3226'); }
      return;
    }
    // raised bed frame (Amos rebuilt them square)
    px(g, x, top - h, bw, h, s.helpers.amos ? '#7a5a3a' : '#5a4a36'); px(g, x, top - h, bw, 1, s.helpers.amos ? '#9a7a4a' : '#7a6a4a'); px(g, x + 2, top - h + 2, bw - 4, h - 4, '#3e3226');
    if (st === 1) return;
    // rows and the packet on a stick
    for (let r = 0; r < 4; r++) px(g, x + 6 + r * 14, top - h + 3, 8, 1, '#5a4a38');
    px(g, x + bw - 6, top - h - 8, 1, 8, '#c8c0b0'); px(g, x + bw - 9, top - h - 12, 7, 5, '#e8e0d0');
    if (st === 2) { for (let r = 0; r < 4; r++) if ((t / 30 + r) % 3 > 1) px(g, x + 9 + r * 14, top - h - 1, 2, 2, leaf2); return; }
    if (st === 3) { for (let r = 0; r < 4; r++) { px(g, x + 9 + r * 14, top - h - 6, 2, 6, leaf); px(g, x + 6 + r * 14, top - h - 8, 8, 3, leaf2); } return; }
    // growing / mature: cages and poles, bushy leaves, then red
    for (let r = 0; r < 4; r++) {
      const px0 = x + 6 + r * 14;
      if (i === 1) { px(g, px0 + 4, top - h - 30, 1, 30, '#8a7a5a'); for (let y = 0; y < 26; y += 5) px(g, px0 + 2 + (y % 2) * 3, top - h - 28 + y, 4, 3, y % 10 ? leaf : leaf2); }
      else { px(g, px0 + 1, top - h - 22, 1, 22, '#8a8a92'); px(g, px0 + 8, top - h - 22, 1, 22, '#8a8a92'); px(g, px0, top - h - 16, 10, 1, '#8a8a92'); px(g, px0, top - h - 8, 10, 1, '#8a8a92'); for (let y = 0; y < 20; y += 4) px(g, px0 + (y % 8 ? 1 : 3), top - h - 20 + y, 7, 3, y % 8 ? leaf : leaf2); }
      if (st === 5) { const R = seeded(i * 7 + r); for (let k = 0; k < 3; k++) if (R() < (s.ready > 0 ? 0.95 : 0.35)) px(g, px0 + 1 + Math.floor(R() * 7), top - h - 6 - Math.floor(R() * 12), 2, 2, i === 2 ? '#e8b83a' : i === 1 ? '#5aa04a' : '#d84a3a'); }
    }
  });
  // marigolds along the fence, sunflowers by the wall when it is grown
  if (s.flowers) for (let x = 100; x < 340; x += 9) { const sx = x - camX; px(g, sx, GROUND_Y + 40, 1, 6, '#3a7a34'); px(g, sx - 1, GROUND_Y + 38, 3, 3, (x / 9) % 2 ? '#e8a03a' : '#f0c040'); }
  if (st >= 4) for (const x of [345, 356, 367]) { const sx = x - camX; const h = st === 5 ? 54 : 30; px(g, sx, GROUND_Y - h, 2, h, '#4a7a34'); px(g, sx - 3, GROUND_Y - h + 10, 8, 3, leaf); if (st === 5) { px(g, sx - 3, GROUND_Y - h - 6, 8, 8, '#f0c040'); px(g, sx - 1, GROUND_Y - h - 4, 4, 4, '#5a3a1a'); } }
  // the rain barrel
  if (s.barrel) { const sx = GARDEN.spots.barrel - camX; px(g, sx - 8, GROUND_Y - 26, 16, 26, '#3a4a5a'); px(g, sx - 8, GROUND_Y - 26, 16, 1, '#5a6a7a'); px(g, sx - 9, GROUND_Y - 18, 18, 1, '#6a6a72'); px(g, sx - 9, GROUND_Y - 8, 18, 1, '#6a6a72'); px(g, sx - 2, GROUND_Y - 60, 4, 34, '#5a5a62'); px(g, sx - 6, GROUND_Y - 28, 12, 2, '#8a8a92'); }
}
function renderGarden(g, t) {
  if (!GardenWorld.static) buildGardenStatic();
  const camX = 0; const pal = todPalette(G.tod, G.rain); G.pal = pal;
  drawSky(g, pal, 800, t);
  g.drawImage(GardenWorld.static, 0, 0);
  paintBeds(g, camX, t);
  const night = pal.night;
  if (night > 0.02) { g.fillStyle = `rgba(255,200,120,${night * 0.5})`; g.fillRect(320, GROUND_Y - 100, 18, 24); g.fillRect(400, GROUND_Y - 140, 18, 24); }
  const ents = G.entities.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const shadow = sunShadow(G.tod); shadow.alpha *= (1 - night) * (1 - G.rain * 0.55) * pal.sun;
  const lamps = night > 0.02 ? [{ x: 116, y: GROUND_Y - 30, alpha: night * 0.8, color: [255, 214, 150], r: 100 }] : [];
  for (const e of ents) { if (e.hidden || e.noShadow) continue; const fr = entFrame(e); drawShadow(g, e, fr, Math.round(e.x), e.y, shadow, lamps); }
  for (const e of ents) { if (e.hidden) continue; const fr = entFrame(e); const sx = Math.round(e.x); g.drawImage(fr.img, sx - fr.cx, e.y - fr.h + (e.sprite ? 0 : 2)); if (e.bubble) drawBubble(g, e, sx, t); }
  drawRain(g, t, camX);
  buildLighting(pal, camX, lamps, t);
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0); g.globalCompositeOperation = 'source-over';
  drawGlows(g, pal, camX, lamps, t, []);
  drawRays(g, pal, camX, t, shadow, [{ x0: 200, x1: 260, top: GROUND_Y - 104 }, { x0: 0, x1: 60, top: GROUND_Y - 120 }]);
  drawVignette(g);
}
// what you can see of it from Harlan Street, through the alley
function paintGardenFromStreet(g, camX) {
  const s = Garden.S(); const st = Garden.stage(); const x0 = 810 - camX; if (x0 + 50 < 0 || x0 > W) return;
  // gate across the alley mouth
  px(g, x0 + 2, GROUND_Y - 46, 2, 46, '#4a4a52'); px(g, x0 + 46, GROUND_Y - 46, 2, 46, '#4a4a52'); px(g, x0 + 2, GROUND_Y - 46, 46, 2, '#5a5a62');
  for (let x = x0 + 4; x < x0 + 46; x += 4) px(g, x, GROUND_Y - 44, 1, 44, 'rgba(140,150,160,0.35)'); for (let y = GROUND_Y - 44; y < GROUND_Y; y += 4) px(g, x0 + 4, y, 42, 1, 'rgba(140,150,160,0.35)');
  if (!s.unlocked) { px(g, x0 + 22, GROUND_Y - 26, 6, 8, '#8a8a92'); px(g, x0 + 23, GROUND_Y - 29, 4, 4, '#6a6a72'); }
  // the green at the back, more of it as it grows
  const green = st === 0 ? '#5a6a3a' : '#3a7a34';
  const hgt = [8, 4, 6, 10, 16, 22][st];
  for (let x = x0 + 6; x < x0 + 44; x += 3) { const h = hgt + ((x * 7) % 5); px(g, x, GROUND_Y - 4 - h, 2, h, green); }
  if (st === 5) { for (const x of [x0 + 14, x0 + 26, x0 + 38]) { px(g, x, GROUND_Y - 34, 1, 30, '#4a7a34'); px(g, x - 2, GROUND_Y - 38, 5, 5, '#f0c040'); } for (let k = 0; k < 6; k++) px(g, x0 + 8 + k * 6, GROUND_Y - 10 - (k % 3) * 4, 2, 2, '#d84a3a'); }
}

// ---------- hooks ----------
{
  STREET.doors.push({ x: 822, w: 26, to: 'garden', label: 'The alley' });
  STREET.spots.garden = 835;
  // the alley view is painted just before the puddle pass (after the static layer, before entities)
  const dp = drawPuddles; drawPuddles = function (g, ents, camX, pal, t) { paintGardenFromStreet(g, camX); dp(g, ents, camX, pal, t); };
  const gm = Minor.granny; Minor.granny = function () { gm.call(this); const it = Garden.offerItem(); if (it && Menu.active) Menu.items.splice(Menu.items.length - 1, 0, it); };
  const am = Amos.menu; Amos.menu = function () { am.call(this); const it = Garden.recruitItem('amos'); if (it && Menu.active) Menu.items.splice(Menu.items.length - 1, 0, it); };
  const nm = Nora.menu; Nora.menu = function () { nm.call(this); const it = Garden.recruitItem('nora'); if (it && Menu.active) Menu.items.splice(Menu.items.length - 1, 0, it); };
  const mm = Mei.menu; Mei.menu = function () { mm.call(this); const it = Garden.recruitItem('mei'); if (it && Menu.active) Menu.items.splice(Menu.items.length - 1, 0, it); };
  const aw2 = Amos.where; Amos.where = function () { if (Garden.present('amos')) return { scene: 'garden', x: 140, sit: false }; return aw2.call(this); };
  const nw2 = Nora.where; Nora.where = function () { if (Garden.present('nora')) return { scene: 'garden', x: 300, spec: 'nora' }; return nw2.call(this); };
  const bel2 = buildEndingList; buildEndingList = function () { const out = bel2(); const gl = Garden.endingLine(); if (gl) out.splice(Math.min(6, out.length), 0, gl); return out; };
  // Nadia takes vegetables for the soup
  const ndm = Nadia.menu; Nadia.menu = function () { ndm.call(this); if (Menu.active && G.inv.veg) Menu.items.splice(Menu.items.length - 1, 0, { t: 'Give her vegetables for the soup', r: () => `x${G.inv.veg}`, keep: true, hide: () => !G.inv.veg, do: () => { G.inv.veg--; const n = G.chars.nadia; n.veg = (n.veg || 0) + 1; if (n.veg === 1) { trust('nadia', 2); remember('garden_soup'); Dlg.run([say('nadia', "Tomatoes? From where? ...Hector's lot? You've got Hector's lot going?"), say('nadia', "My father let him have that lot. I was six. I used to steal the beans."), say('nadia', "These go in the 412. Tonight. That's not a soup anymore, that's a neighborhood.")]); } else { trust('nadia', n.veg % 3 === 0 ? 1 : 0); UI.toast('Into the 412.', '#8ae88a'); } } }); };
}
