// ============================================================
// game: state, loop, interactions, shop, sleep, ending, save
// ============================================================
let G = null;
const SAVE_KEY = '99days_save_v1';

const SAVE_VERSION = 3;
function freshState() {
  return {
    version: SAVE_VERSION, state: 'play', day: 1, money: 12, hunger: 62, energy: 100, maxEnergy: 100, tod: 0,
    inv: { bread: 1, soup: 0, rice: 0, coat: 0, radioParts: 0, signParts: 0, chess: 0, bird: 0, drawing: 0, thermos: 0, tools: 0, textbook: 0, collar: 0, ruthWatch: 0, chessClock: 0, strings: 0, checkers: 0, nurseShoes: 0, amosHeater: 0, gloves: 0, frame: 0, busPass: 0, fish: 0, letter: 0, veg: 0 },
    outfit: null, wardrobe: {},
    flags: {}, bequests: {}, memories: [], chars: { amos: Amos.init(), mei: Mei.init(), walter: Walter.init(), nadia: Nadia.init(), nora: Nora.init(), theo: Theo.init(), sol: Pawn.init(), emmett: Emmett.init() },
    scene: 'apartment', px: 330, facing: -1, walking: false, frame: 0, camX: 0, rain: 0.8, wind: 0.2, weatherSeed: irnd(1, 99999),
    starveDays: 0, ateToday: false, walkers: [], dogX: 0, coughT: 600, stun: 0, dockShifts: 0, deliveries: 0, jobsToday: 0, hideHud: false,
    pendingStreet: null, pendingDiner: null, dayCard: null, dead: false, t: 0, elevatorBroken: false, pills: 30, lastPill: 1, pillPenalty: 0, phone: Phone.init(), pass: Passing.init(), house: House.init(), garden: Garden.init(), seen: {}, busT: 0, busDir: 'out', busArrived: false,
  };
}
function newGame() { G = freshState(); rollWeather(); }
// fill anything an older save is missing (new characters, flags, inventory keys, fields added in updates)
function migrate(s) {
  const base = freshState();
  for (const k in base) if (!(k in s)) s[k] = base[k];
  s.inv = Object.assign({}, base.inv, s.inv || {}); s.flags = s.flags || {}; s.bequests = s.bequests || {}; s.memories = s.memories || [];
  s.chars = s.chars || {};
  for (const c in base.chars) { if (!s.chars[c]) s.chars[c] = base.chars[c]; else for (const k in base.chars[c]) if (!(k in s.chars[c])) s.chars[c][k] = base.chars[c][k]; }
  if (!INTERIORS[s.scene] && !isOutdoor(s.scene)) { s.scene = 'apartment'; s.px = 330; }
  if (!isOutdoor(s.scene)) { const I = INTERIORS[s.scene]; if (I && (s.px < I.x0 + 12 || s.px > I.x1 - 12)) s.px = I.spawnX; }
  s.version = SAVE_VERSION;
  return s;
}
function rollWeather() {
  const R = seeded(G.weatherSeed + G.day * 131);
  const kindness = Math.min(0.35, G.memories.length * 0.012);
  const r = R();
  if (r < 0.55 - kindness) G.rain = 0.45 + R() * 0.55; else if (r < 0.8 - kindness * 0.5) G.rain = 0.12 + R() * 0.3; else G.rain = 0;
  if (G.day === 1) G.rain = 0.85;
  if (G.day === 99) G.rain = 0;
  G.wind = R() * 0.8;
  G.elevatorBroken = G.day >= 3 && R() < 0.22;
  Audio.setRain(G.rain);
}
function save() {
  if (!G || G.dead || G.state === 'title' || G.state === 'ending' || G.hideHud) return;
  try { const s = Object.assign({}, G); delete s.walkers; delete s.dayCard; delete s.entities; delete s.visitors; delete s.near; s.state = 'play'; s.stun = 0; s.lying = false; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { }
}
// autosave: every few seconds at a safe moment, and whenever the page is hidden or closed
let lastAutosave = 0;
function autosave(force) {
  if (!G) return;
  const safe = G.state === 'play' || G.state === 'menu' || G.state === 'dialogue' || G.state === 'daycard';
  if (!safe && !force) return;
  const now = Date.now(); if (!force && now - lastAutosave < 4000) return;
  lastAutosave = now; save();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(true); });
window.addEventListener('pagehide', () => autosave(true));
window.addEventListener('beforeunload', () => autosave(true));
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!s) return false;
    G = migrate(s); G.walkers = []; G.dayCard = null; G.state = 'play'; G.stun = 0; G.hideHud = false; G.camX = isOutdoor(G.scene) ? clamp(G.px - W / 2, 0, sceneW(G.scene) - W) : 0;
    Audio.setRain(G.rain); for (const k in G.chars) clearPortrait(k); Theo.ensure(); Pawn.S(); Emmett.E(); G.wardrobe = G.wardrobe || {}; if (G.chars.amos.bird && !G.inv.bird && !G.flags.pawned_bird) G.inv.bird = 1; if (G.chars.mei.portraitDone && !G.inv.drawing && !G.flags.pawned_drawing) G.inv.drawing = 1;
    if (G.day >= 99) { setTimeout(() => beginEnding(), 50); }
    return true;
  } catch (e) { return false; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

// ---------- entities ----------
function refreshEntities() { /* entities are rebuilt every frame in buildEntities */ }
function buildEntities() {
  const E = []; const sc = G.scene; const f = G.flags;
  const feet = isOutdoor(sc) ? FEET_Y : INTERIORS[sc].floorY;
  // player
  if (G.lying) E.push({ id: 'player', x: 312, y: feet, spec: 'playerLate', dir: -1, lying: true });
  else E.push({ id: 'player', x: G.px, y: feet, spec: playerSpec(), dir: G.facing, walk: G.walking, frame: G.frame, bubble: G.stun > 0 ? 'cough' : null, light: 0 });
  const add = (e) => E.push(e);
  // Amos
  const aw = Amos.where(); const a = G.chars.amos;
  if (aw && aw.scene === sc) add({ id: 'amos', x: aw.x, y: feet, spec: a.spec, dir: aw.x > G.px ? -1 : 1, sit: aw.sit, bubble: Amos.bubble(), on: () => Amos.menu(), label: a.met ? 'Amos' : 'Man' });
  if (sc === 'street') {
    if (a.dead && !f.candleSeen) { }
    if (Walter.present()) { const w = G.chars.walter; const wx = w.atRiver ? STREET.spots.river : STREET.spots.walter; add({ id: 'walter', x: wx, y: feet, spec: w.spec, dir: 1, sit: !w.atRiver, on: () => Walter.menu(), label: w.met ? 'Walter' : 'Old man' }); }
    if (G.day >= 3 && G.tod > 0.15 && G.tod < 0.9) add({ id: 'busker', x: STREET.spots.busker, y: feet, spec: 'busker', dir: -1, on: () => Minor.busker(), label: 'Busker', light: 0 });
    if (G.day >= 2 && !f.dogFollows) add({ id: 'dog', x: STREET.spots.dog, y: feet, sprite: G.tod > 0.5 ? 'dogSit' : 'dog', dir: -1, on: () => Minor.dog(), label: 'Dog' });
    if ([6, 15, 27, 40, 55, 72, 88].includes(G.day) && G.tod < 0.7) add({ id: 'granny', x: STREET.spots.granny, y: feet, spec: 'granny', dir: -1, on: () => Minor.granny(), label: 'Mrs. Ortega', bubble: f.grannyDay === G.day ? null : 'exclaim' });
    if (G.day === 9 && !f.kidDone && G.tod < 0.8) add({ id: 'kid', x: STREET.spots.kid, y: feet, spec: 'kid', dir: -1, on: () => Minor.kid(), label: 'Kid', bubble: 'exclaim' });
    if (G.chars.nadia.closed && !f.nadiaGoodbye && G.day <= G.chars.nadia.rentDay + 1) add({ id: 'nadiaLeaving', x: STREET.spots.walter + 40, y: feet, spec: 'nadia', dir: -1, on: () => nadiaGoodbye(), label: 'Nadia' });
    if (G.day >= 8 && G.tod > 0.2 && G.tod < 0.7 && G.day % 3 === 0 && !f.workerCut) add({ id: 'worker', x: STREET.spots.worker, y: feet, spec: 'worker', dir: -1, label: 'Dock worker', on: () => { const items = [{ t: 'Talk', r: '-2 energy', do: () => talkEnergy(2) && Dlg.run([say('worker', fresh('danny', ["Dock's hiring day labor. Roll-up door, ask for the foreman.", "Smoke break. Don't tell the foreman.", "You're the one from 412? Amos talks about you."]))]) }]; const ci = Theo.clueItem('dock'); if (ci) items.push(ci); items.push({ t: 'Leave', do: () => { } }); Menu.open('Danny', items); } });
    { const tw = Theo.where(); if (tw && tw.scene === 'street') add({ id: 'theo', x: tw.x, y: feet, spec: tw.spec, dir: -1, range: 40, on: () => (G.chars.theo.reunited ? Theo.cornerTalk() : Theo.talk()), label: G.chars.theo.reunited ? 'Theo' : 'Kid in a hoodie' }); }
    for (const car of STREET.cars) add({ id: 'car', x: car.x + 49, y: 266, sprite: car.red ? 'carRed' : 'car', dir: 1, prop: true, noShadow: true });
    for (const p of STREET.props) { if (p.hideIf && f[p.hideIf]) continue; if (p.s === 'cardboard' && G.chars.amos.room) continue; add({ id: 'prop', x: p.x + Math.floor(SPR[p.s].width / 2), y: p.y, sprite: p.s, dir: 1, prop: true }); }
    for (const wk of G.walkers) add({ id: 'walker', x: wk.x, y: feet + wk.dy, spec: wk.spec, dir: wk.dir, walk: true, frame: wk.frame });
  }
  if (sc === 'store') add({ id: 'mei', range: 60, x: INTERIORS.store.spots.counter, y: 212, spec: G.chars.mei.spec, dir: 1, on: () => Mei.menu(), label: G.chars.mei.met ? 'Mei' : 'Clerk' });
  if (sc === 'diner') {
    add({ id: 'nadia', range: 60, x: INTERIORS.diner.spots.counter, y: 212, spec: G.chars.nadia.spec, dir: -1, on: () => Nadia.menu(), label: G.chars.nadia.met ? 'Nadia' : 'Owner' });
    if (G.chars.nadia.sam && G.tod > 0.5) add({ id: 'sam', x: 104, y: 215, spec: 'kid', dir: 1, sit: true, range: 40, on: () => { if (G.inv.checkers) { const gi = []; Gifts.sam(gi); gi[0].do(); return; } const ci = Theo.clueItem('sam'); if (ci) { Theo.clue('sam'); return; } talkEnergy(2) && Dlg.run([say('kid', fresh('sam', ["It's done. The homework. It's done.", "Do you know how to do fractions? Don't tell Mom I asked.", "Mom says you're sick. Are you going to be okay?", "Wanna play checkers? I always win. That's a warning."]))]); }, label: 'Sam' });
    if (f.buskerTips >= 3 && G.chars.nadia.saved && G.tod > 0.6) add({ id: 'busker2', x: 140, y: feet, spec: 'busker', dir: 1, label: 'Busker', on: () => Minor.busker() });
  }
  if (sc === 'pawn') add({ id: 'sol', range: 60, x: INTERIORS.pawn.spots.counter, y: 212, spec: 'sol', dir: -1, on: () => Pawn.menu(), label: G.chars.sol.met ? 'Sol' : 'Pawnbroker' });
  if (sc === 'bus') {
    add({ id: 'pryor', x: INTERIORS.bus.spots.pryor, y: feet, spec: 'pryor', dir: 1, sit: true, range: 30, on: () => Passengers.pryor(), label: f.pryorTalks ? 'Mr. Pryor' : 'Man with a laptop' });
    add({ id: 'ortega', x: INTERIORS.bus.spots.ortega, y: feet, spec: 'granny', dir: 1, sit: true, range: 30, on: () => Passengers.ortega(), label: 'Mrs. Ortega', bubble: f.ortegaBus ? null : 'exclaim' });
    add({ id: 'driver', x: 386, y: feet, spec: 'worker', dir: 1, sit: true, noShadow: true });
  }
  if (sc === 'lake') {
    const em = G.chars.emmett;
    if (Emmett.present()) add({ id: 'emmett', x: LAKE.spots.emmett, y: feet, spec: 'emmett', dir: 1, range: 40, on: () => Emmett.menu(), label: em.met ? 'Emmett' : 'Man on the pier' });
    if (em.lenaCame || (em.lenaDay && G.day >= em.lenaDay && em.stage >= 3)) add({ id: 'lena', x: LAKE.spots.emmett + 40, y: feet, spec: 'lena', dir: -1, range: 30, on: () => talkEnergy(2) && Dlg.run([say('lena', fresh('lena', ["He's teaching me the knot again. I remembered it. I let him teach me anyway.", "Thank you. I know I said it. I'm going to keep saying it.", "He wrote a page about fish. I'm going to frame the fish part too."]))]), label: 'Lena' });
  }
  if (sc === 'garden') {
    if (Garden.present('mei')) add({ id: 'meiG', x: 250, y: feet, spec: G.chars.mei.spec, dir: -1, range: 30, on: () => Garden.helperTalk('mei'), label: 'Mei', bubble: G.t % 400 < 200 ? null : 'exclaim' });
    if (Garden.ortegaHere()) { const s = Garden.S(); add({ id: 'ortegaG', x: s.ortegaIn ? 90 : 46, y: feet, spec: 'granny', dir: 1, sit: !!s.ortegaIn, range: 30, on: () => Garden.ortegaTalk(), label: 'Mrs. Ortega' }); }
  }
  if (sc === 'clinic') add({ id: 'doctor', range: 60, x: INTERIORS.clinic.spots.desk, y: 212, spec: 'doctor', dir: -1, on: () => Doctor.menu(), label: 'Dr. Okafor' });
  if (sc === 'dock') add({ id: 'foreman', x: INTERIORS.dock.spots.boss, y: feet, spec: f.foremanCut ? 'man1' : 'worker', dir: 1, on: () => foremanMenu(), label: f.foremanCut ? 'New foreman' : 'Foreman' });
  if (sc === homeScene()) { const P = G.phone || {}; const pp = INTERIORS[sc].phone || { x: PHONE_X, y: PHONE_Y }; add({ id: 'phone', x: pp.x, y: pp.y, sprite: 'phone', dir: 1, noShadow: true, range: 14, bubble: P.ringing ? 'ring' : null, bubbleY: pp.y - 24, on: () => (P.ringing ? Phone.answer() : Phone.menu()), label: P.ringing ? 'Answer' : 'Phone' }); }
  if (sc === 'house' && House.walterHere()) add({ id: 'walter', x: INTERIORS.house.spots.chair, y: feet, spec: G.chars.walter.spec, dir: -1, sit: true, range: 30, on: () => Walter.houseTalk(), label: 'Walter' });
  // Nora (411)
  const nw = Nora.where();
  if (nw && nw.scene === sc) add({ id: 'nora', x: nw.x, y: nw.sit ? feet : (sc === 'diner' ? feet : feet), spec: nw.spec, dir: nw.x > G.px ? -1 : 1, sit: !!nw.sit, range: 40, on: () => (sc === 'hall' ? Nora.menu() : Nora.cameoTalk(sc)), label: G.chars.nora.met ? 'Nora' : 'Neighbor', bubble: (sc === 'hall' && G.day <= 9 && !G.chars.nora.boxes) ? 'exclaim' : null });
  // dog follower
  if (f.dogFollows && (sc === 'street' || sc === 'apartment' || sc === 'hall' || sc === 'lane' || sc === 'house' || sc === 'garden')) add({ id: 'dogF', x: G.dogX, y: feet, sprite: Math.abs(G.dogX - G.px) > 26 ? 'dog' : 'dogSit', dir: G.dogX > G.px ? -1 : 1, on: () => Minor.dog(), label: 'Dog' });
  // ending visitors
  if (G.visitors) for (const v of G.visitors) add(v);
  G.entities = E;
}

// ---------- doors / interaction targets ----------
function currentDoors() { return G.scene === 'street' ? STREET.doors : OUTDOORS[G.scene] ? (OUTDOORS[G.scene].doors || []) : INTERIORS[G.scene].doors; }
function nearest() {
  let best = null, bd = 34; if (!G.entities) return null;
  for (const e of G.entities) { if (!e.on || e.hidden) continue; const d = Math.abs(e.x - G.px); if (d < (e.range || bd)) { bd = d; best = { kind: 'ent', e, label: e.label }; } }
  for (const d of currentDoors()) { const dd = Math.abs(d.x + d.w / 2 - G.px); if (dd < Math.max(24, d.w / 2 + 10) && dd < bd) { bd = dd; best = { kind: 'door', d, label: d.label }; } }
  if (G.scene === 'apartment') {
    const sp = INTERIORS.apartment.spots;
    if (Math.abs(G.px - sp.bed) < 30 && bd > 20) best = { kind: 'bed', label: 'Sleep' };
    else if (Math.abs(G.px - sp.table) < 16 && bd > 14) best = { kind: 'table', label: 'Table' };
    else if (Math.abs(G.px - sp.sink) < 16 && bd > 14) best = { kind: 'note', label: G.flags.noteRead ? 'Post-it' : 'A note' };
  }
  if (G.scene === 'basement' && Math.abs(G.px - INTERIORS.basement.spots.chair) < 14 && bd > 14) best = { kind: 'chair', label: 'The chair' };
  if (G.scene === 'house') {
    const sp = INTERIORS.house.spots; const mine = G.flags.house === 'mine';
    if (Math.abs(G.px - sp.bed) < 30 && bd > 20) best = mine ? { kind: 'bed', label: 'Sleep' } : (House.walterHere() && G.tod > 0.6 ? { kind: 'couch', label: 'The couch' } : { kind: 'clocks', label: 'The daybed' });
    else if (Math.abs(G.px - sp.clocks) < 16 && bd > 14) best = { kind: 'clocks', label: 'The clocks' };
    else if (mine && Math.abs(G.px - sp.table) < 16 && bd > 14) best = { kind: 'table', label: 'Table' };
  }
  if (G.scene === 'garden') { if (Math.abs(G.px - GARDEN.spots.beds) < 70 && bd > 20) best = { kind: 'beds', label: Garden.stage() === 0 ? 'The weeds' : 'The beds' }; else if (Math.abs(G.px - GARDEN.spots.bench) < 12 && bd > 12) best = { kind: 'bench', label: "Hector's bench" }; }
  if (G.scene === 'lane' && House.S().listed && Math.abs(G.px - LANE.spots.sign) < 14 && bd > 14) best = { kind: 'sign', label: House.S().owner ? 'SOLD' : 'FOR SALE' };
  if (G.scene === 'street') { for (const p of STREET.props) if (p.bench && Math.abs(G.px - (p.x + 14)) < 12 && bd > 12) best = { kind: 'bench', label: 'Bench', p }; if (Math.abs(G.px - 1561) < 14 && bd > 14) best = { kind: 'poster', label: G.chars.theo && G.chars.theo.reunited ? 'Wall' : 'Poster' }; if (G.inv.letter && Math.abs(G.px - 648) < 14 && bd > 14) best = { kind: 'mailbox', label: 'Mail the letter' }; }
  if (G.scene === 'lake') {
    if (Math.abs(G.px - (LAKE.spots.stop + 10)) < 16 && bd > 16) best = { kind: 'lakebus', label: 'The 14 back to the city' };
    else if (Math.abs(G.px - 104) < 12 && bd > 12) best = { kind: 'bench', label: 'Bench' };
    else if (Math.abs(G.px - LAKE.spots.pierEnd) < 22 && bd > 22) best = { kind: 'fish', label: G.energy < 25 ? 'Too tired to fish' : 'Fish' };
    else if (Math.abs(G.px - (LAKE.spots.cabin + 5)) < 16 && bd > 16) best = { kind: 'cabin', label: 'Cabin' };
  }
  return best;
}
function interact(n) {
  if (!n) return;
  if (n.kind === 'ent') { n.e.on(); return; }
  if (n.kind === 'door') { if (n.d.bus) Bus.door(); else if (n.d.to === 'house') House.enter(); else if (n.d.to === 'garden' && !Garden.S().unlocked) Dlg.run([narr(G.day < 6 ? 'A chain-link gate across the alley, padlocked. Weeds behind it to the fence, and the backs of buildings.' : 'Padlocked. Through the wire: weeds, a shed, a hand-painted sign you cannot read from here. Somebody kept this once.')]); else if (G.scene === 'hall') hallDoor(n.d); else if (n.d.to === 'hall' && G.scene === 'street') enterBuilding(); else goScene(n.d.to, n.d.at); return; }
  if (n.kind === 'lakebus') { Bus.back(); return; }
  if (n.kind === 'fish') { if (G.energy < 25) { UI.toast('Too tired to hold a rod.', '#8ab0d8'); return; } Fishing.start(); return; }
  if (n.kind === 'cabin') { cabinDoor(); return; }
  if (n.kind === 'mailbox') { mailLetter(); return; }
  if (n.kind === 'sign') { House.sign(); return; }
  if (n.kind === 'beds') { Garden.menu(); return; }
  if (n.kind === 'clocks') { Dlg.run([narr(G.flags.house === 'mine' ? pick(['Seven clocks. The one you wound is still going. It is the only sound in the house that is not you.', 'Ruth, laughing, in 1962. You have started saying goodnight to the photograph. Nobody has to know.']) : G.chars.walter.dead ? 'Seven clocks, none of them wound. A photograph of a woman laughing. Somebody should dust them; nobody will.' : 'Seven clocks. Retirement gifts, mostly; one was a wedding present. He has told you which and you have already forgotten.')]); return; }
  if (n.kind === 'couch') { Menu.open("Walter's couch", [{ t: 'Sleep here tonight', r: 'the stairs are far', do: () => { House.S().couch++; remember('walter_couch'); Dlg.run([say('walter', "Blanket's on the arm. I'm up at five. I'll try not to wind anything."), { fn: () => sleep('couch') }]); } }, { t: 'Not tonight', do: () => { } }]); return; }
  if (n.kind === 'bed') { bedMenu(); return; }
  if (n.kind === 'table') { tableMenu(); return; }
  if (n.kind === 'note') { readNote(); return; }
  if (n.kind === 'poster') { Theo.readPoster(); return; }
  if (n.kind === 'chair') { amosChair(); return; }
  if (n.kind === 'bench') { benchMenu(); return; }
}
function goScene(to, at) {
  Audio.sel(); Passing.leave();
  UI.fadeOut(() => {
    const from = G.scene; G.scene = to; G.walking = false;
    if (to === 'street') { const sx = STREET.spots[at] || STREET.spots.home; const door = STREET.doors.find(d => d.to === from); G.px = door ? door.x + door.w / 2 : sx; G.facing = 1; G.camX = clamp(G.px - W / 2, 0, STREET.w - W); G.dogX = G.px - 30; }
    else if (OUTDOORS[to]) { const D = OUTDOORS[to]; G.px = D.spots[at] || D.spawn; G.facing = 1; G.camX = clamp(G.px - W / 2, 0, D.w - W); G.dogX = G.px - 30; }
    else { const I = INTERIORS[to]; G.px = (I.spawns && I.spawns[at]) || I.spawnX; G.facing = I.spawnDir; G.camX = 0; G.dogX = G.px - I.spawnDir * 22; }
    UI.fadeIn();
    onEnterScene(to);
    autosave(true);
  }, 0.08);
}
function onEnterScene(sc) {
  if (sc === 'street' && G.pendingStreet) { const p = G.pendingStreet; G.pendingStreet = null; setTimeout(() => streetEvent(p), 400); }
  if (sc === 'diner' && G.pendingDiner) { G.pendingDiner = null; }
  if (sc === 'diner' && G.chars.nadia.saved && !G.chars.nadia.savedStory) { setTimeout(() => Nadia.talk(), 400); }
  if (sc === 'store' && G.day === 1 && !G.flags.storeIntro) { G.flags.storeIntro = true; }
}
function streetEvent(p) {
  if (p === 'amosGone') Dlg.run([narr('The cardboard is there. The blanket is folded, which it never was.'), narr('Someone has put a candle in a jar beside it. The wind has already put it out.'), narr(G.chars.amos.met ? 'Mrs. Ortega tells you later. Pneumonia. The ambulance came at four in the morning and nobody rode with him.' : 'You never asked his name.')]);
  if (p === 'walterGone') { const w = G.chars.walter; Dlg.run(w.sat >= 6 ? [narr('The bench is empty. The 14 does not come. Nothing comes.'), narr('Mrs. Ortega finds you on the sidewalk. Walter Ashby died in his sleep on Tuesday. He had left an envelope with your apartment number on it.'), narr(G.inv.chess ? 'Inside: a photograph of a woman laughing, mid-snort. On the back, in typesetter\'s capitals: SHE WOULD HAVE LIKED YOU.' : 'Inside: a photograph of a woman laughing, and a note. YOU SAT WITH ME. THANK YOU. W.A.'), { fn: () => remember('walter_letter') }] : w.sat >= 3 ? [narr('The bench is empty. It stays empty the next day, and the next.'), narr('The busker tells you: the old man with the cane. Heart. In his sleep, they think. Nobody is sure who they are.')] : [narr('The bench is empty today. You notice, and then you notice that you noticed.')]); }
  if (p === 'dinerClosed') Dlg.run([narr("The neon is dark. There is a sheet of paper taped inside the door: CLOSED. THANK YOU FOR 26 YEARS."), narr('Through the glass the stools are upside down on the counter like they are waiting for something.')]);
  if (p === 'amosRoom') Dlg.run([narr('The cardboard by the stoop is gone. Swept. Just the sidewalk, wet and ordinary, as if nobody ever lived there.')]);
}
function nadiaGoodbye() {
  const n = G.chars.nadia; G.flags.nadiaGoodbye = true;
  Dlg.run(n.trust >= 3 ? [say('nadia', "My sister's in Dayton. Sam thinks it's an adventure. Let him."), say('nadia', "You tried. I know you tried. It was never going to be enough and you tried anyway, and that's... that's the thing I'm taking with me."), narr('She hugs you at the bus stop and does not let go for a while. The real bus comes. She gets on.')] : [say('nadia', "Dayton. My sister's. It's fine."), narr('The bus comes. She gets on. You did not know her well enough to say anything, and so you do not.')]);
}

// ---------- menus ----------
const Shop = {
  open() {
    const items = [];
    for (const k in FOOD) { if (FOOD[k].noShop) continue; items.push({ t: FOOD[k].name, r: () => `$${FOOD[k].price}`, keep: true, disabled: () => G.money < FOOD[k].price, do: () => { if (spend(FOOD[k].price)) { G.inv[k]++; Mei.bought(); UI.toast('+1 ' + FOOD[k].name, '#8ae88a'); } } }); }
    if (G.chars.mei.stage >= 2 && G.tod > 0.7) items.push({ t: 'day-old bread (free)', keep: true, hide: () => G.flags.dayOld === G.day, do: () => { G.flags.dayOld = G.day; G.inv.bread++; UI.toast('+1 bread', '#8ae88a'); } });
    items.push({ t: 'Done', do: () => { } });
    Menu.open("Lin's Market", items, { sub: `You have $${G.money}.` });
  }
};
function eatMenu(back) {
  const items = [];
  for (const k in FOOD) items.push({ t: `Eat ${FOOD[k].name}`, r: () => `x${G.inv[k]}  +${FOOD[k].hunger}`, hide: () => !G.inv[k], keep: true, do: () => { G.inv[k]--; addHunger(FOOD[k].hunger); G.ateToday = true; } });
  if (G.flags.freeSoup && G.scene === 'diner') items.push({ t: 'The 412 (free)', keep: true, hide: () => G.flags.soupDay === G.day, do: () => { G.flags.soupDay = G.day; addHunger(50); G.ateToday = true; } });
  items.push({ t: 'Back', do: () => { if (back) back(); } });
  Menu.open('Eat', items, { sub: `Food ${Math.round(G.hunger)}/100` });
}
function pauseMenu() {
  Menu.open('99 DAYS', [
    { t: 'Resume', do: () => { } },
    { t: 'Eat', do: () => eatMenu(pauseMenu) },
    { t: 'People', do: () => peopleScreen() },
    { t: () => 'Sound: ' + (Audio.muted ? 'off' : 'on'), keep: true, do: () => { Audio.toggleMute(); Menu.items[3].t = 'Sound: ' + (Audio.muted ? 'off' : 'on'); } },
    { t: 'Save & quit to title', do: () => { save(); UI.fadeOut(() => { G.state = 'title'; titleInit(); UI.fadeIn(); }); } },
  ].map(i => { if (typeof i.t === 'function') i.t = i.t(); return i; }), { sub: `Day ${G.day}. ${99 - G.day} left.` });
}
function peopleScreen() {
  const lines = [];
  const a = G.chars.amos, m = G.chars.mei, w = G.chars.walter, n = G.chars.nadia;
  const hearts = v => '+'.repeat(clamp(Math.round(v / 2), 0, 6)) || '-';
  lines.push({ t: (a.met ? 'Amos' : 'Man by the stoop') + (a.dead ? ' (gone)' : a.room ? ' (housed)' : a.job ? ' (working)' : ''), r: hearts(a.trust), do: () => { } });
  lines.push({ t: (m.met ? 'Mei' : 'Girl at the counter') + (m.accepted ? ' (accepted!)' : m.applied ? ' (applied)' : m.cold ? ' (distant)' : ''), r: hearts(m.trust), do: () => { } });
  lines.push({ t: (w.met ? 'Walter' : 'Old man on the bench') + (w.dead ? ' (passed)' : ''), r: hearts(w.trust), do: () => { } });
  lines.push({ t: (n.met ? 'Nadia' : 'Diner owner') + (n.closed ? ' (closed)' : n.saved ? ' (open!)' : ''), r: hearts(n.trust), do: () => { } });
  { const j = Jo.J(); if (j.stage >= 1 || j.stopped) lines.push({ t: 'Jo (sister)' + (j.visited ? ' (came)' : j.stopped ? ' (stopped calling)' : j.coming ? ' (coming)' : ''), r: `${j.calls} call${j.calls === 1 ? '' : 's'}`, do: () => { } }); }
  const em = G.chars.emmett; if (em && em.met) lines.push({ t: 'Emmett' + (em.gone ? ' (out past the point)' : em.lenaCame ? ' (Lena came)' : em.mailed ? ' (letter sent)' : ''), r: hearts(em.trust), do: () => { } });
  lines.push({ t: 'Back', do: () => pauseMenu() });
  Menu.open('People', lines, { wide: true });
}
function bedMenu() {
  Menu.open('Bed', [
    { t: 'Sleep', r: () => `end day ${G.day}`, do: () => sleep(false) },
    { t: 'Eat first', do: () => eatMenu(bedMenu) },
    { t: 'Not yet', do: () => { } },
  ], { sub: G.hunger < 25 ? "You're starving. Sleeping hungry is dangerous." : G.energy > G.maxEnergy * 0.6 ? "It's early. You could still do things today." : 'You are tired.' });
}
function takePills() {
  if (G.flags.pillDay === G.day) { Dlg.run([narr('You already took them today. The bottle says two, and the bottle is not a suggestion.')]); return; }
  if (G.pills <= 0) { Dlg.run([narr('The bottle is empty. You shake it anyway, the way people do.'), narr('Okafor refills it at the clinic. Twenty dollars.')]); return; }
  G.pills--; G.flags.pillDay = G.day; G.lastPill = G.day; G.coughT = 99999; Audio.tone(700, 0.05, 'triangle', 0.03);
  UI.toast(`pills: ${G.pills} left`, '#8ab0d8');
  const skipped = G.day - (G.flags.prevPill || G.day) >= 3; G.flags.prevPill = G.day;
  Dlg.run([narr(G.day < 40 ? 'Two, with water. They do not do anything you can feel, except that you will not cough in the street today.' : G.day < 80 ? 'Two, with water. The cough goes quiet for the day, like something waiting outside a door.' : 'Two, with water. You are not sure why you bother. You bother anyway. The cough backs off for the day.'), skipped ? narr('You had let it slide for a few days. Your chest noticed.') : null]);
}
function tableMenu() {
  const items = [{ t: 'Eat', do: () => eatMenu(tableMenu) }];
  if (G.inv.bird) items.push({ t: 'Look at the wooden bird', do: () => Dlg.run([narr('Rough wings, perfect head. It sits on the table facing the window, like it is waiting for the rain to stop.')]) });
  if (G.inv.chess) items.push({ t: "Look at Walter's chess set", do: () => Dlg.run([narr("The board is set up mid-game. Knight first. You have not moved anything since.")]) });
  if (G.inv.drawing) items.push({ t: "Look at Mei's drawing", do: () => Dlg.run([narr("You, at the counter, hands in your pockets. Like you're waiting for a bus. It's a good stand. It's got shape.")]) });
  if (Ladder.bequestAvailable()) items.push({ t: 'The coffee can', r: () => `$${G.money}`, do: () => Ladder.coffeeCan() });
  items.push({ t: 'Wardrobe', r: () => G.outfit ? OUTFITS[G.outfit].name : 'old clothes', do: () => wardrobeMenu() });
  if (G.flags.own_radio) items.push({ t: 'Turn on the radio', do: () => Dlg.run([narr(pick(['Kessler, calling the seventh inning of something. The score does not matter. The voice does.', 'A station that plays what it wants. Somebody sings about a river.', 'Static, then a weather report: rain. You could have told them that.']))]) });
  if (G.scene === 'apartment') items.push({ t: 'Listen at the wall', do: () => Dlg.run([narr(Nora.wallListen())]) });
  items.push({ t: 'Take the pills', r: () => G.pills > 0 ? `${G.pills} left` : 'empty', do: () => takePills() });
  items.push({ t: 'Back', do: () => { } });
  Menu.open('Table', items);
}
function benchMenu() {
  const lake = G.scene === 'lake'; const garden = G.scene === 'garden'; const busStop = !lake && Math.abs(G.px - STREET.spots.walter) < 40;
  const items = [
    { t: 'Sit a while', do: () => { useEnergy(3); Dlg.run([narr(garden ? pick(['Hector\'s bench. It faces the beds, because that is what he wanted to look at.', 'The diner exhaust hums. Somewhere over the wall, Nadia is arguing with the fryer.', 'You sit. The garden does not need you to do anything for a minute. That is what it is for.']) : lake ? pick(['Water on stones. A loon, maybe, or something that wants to be one.', 'The pier creaks in a rhythm. You could set a watch by it, if you had a watch.', 'Nothing here needs you to do anything. It takes a while to believe that.']) : pick(['Rain on the shelter roof. Cars. Somebody laughing a block away.', 'You sit. Your legs are grateful. Your lungs are not.', 'The street goes on doing what it does whether you watch it or not.', G.px > 2100 ? 'The river is the color of the sky. A barge goes by, slow as a thought.' : 'A pigeon investigates your shoe and moves on.']))]); } }];
  if (busStop && busDay() && !Walter.present() && G.tod < 0.7) items.push({ t: 'Wait for the 14', r: '$10 ticket', do: () => Bus.offer() });
  else if (busStop && !busDay() && G.tod < 0.7) items.push({ t: 'Wait for the 14', do: () => Dlg.run([narr(G.chars.walter.met ? 'Walter looks up. "Sundays," he says. "It runs Sundays. Don\'t ask me why; nobody at the city could tell you either."' : 'A timetable under scratched plastic. The 14: SUNDAYS ONLY. LAKE ROAD. Somebody has written "still?" next to it in pen.')]) });
  items.push({ t: 'Sleep here tonight', r: 'rough', do: () => sleep(true) }, { t: 'Leave', do: () => { } });
  Menu.open(garden ? "Hector's bench" : lake ? 'Bench by the water' : 'Bench', items, busStop && busDay() && !Walter.present() ? { sub: G.chars.walter.dead ? 'The bench is empty now.' : 'Sunday. The bench is empty.' } : undefined);
}
function cabinDoor() {
  const e = Emmett.E();
  if (e.gone) { Dlg.run([narr('Locked. Through the window, a chair, a stove, a rod rack with one rod missing.')]); return; }
  if (!e.met) { Dlg.run([narr('You knock. Nobody. Out on the pier, a man with a rod does not turn around, which is an answer.')]); return; }
  if (Emmett.present()) { Dlg.run([narr('The door is on the latch. You do not go in. He is on the pier; that is where the conversation is.')]); return; }
  Dlg.run([narr('Dark. A lamp goes on inside and off again, which is Emmett saying goodnight.')]);
}
function mailLetter() {
  const e = Emmett.E(); if (!G.inv.letter) return;
  G.inv.letter = 0; e.mailed = true; e.mailedDay = G.day; remember('emmett_mailed'); Audio.good();
  Dlg.run([narr('Blue box by the diner. One page, folded three times, an address in a careful hand that has not addressed anything in nineteen years.'), narr('You did not read it. You thought about it on the bus and in the hall and at the table, and you did not read it.'), narr('It drops. The box makes the sound boxes make.')]);
}
// office shifts must be the first thing you do after waking; stopping to talk to anyone makes you late
function officeShift(kind) {
  const f = G.flags; f.officeToday = G.day;
  if (!f.talkedToday) { if (kind === 'vp') VP.shift(); else Ladder.managerShift(); return; }
  f.lateStreak = (f.lateStreak || 0) + 1; f.lateDays = (f.lateDays || 0) + 1; remember('ladder_late');
  const who = kind === 'vp' ? 'owner' : 'worker';
  if (f.lateStreak >= 3) {
    if (kind === 'vp') { f.vp = false; f.vpOffered = false; f.managerClean = 0; if (G.outfit === 'vpsuit') G.outfit = null; Dlg.run([say('owner', "Three days. Three. The chair's got somebody in it now, and he was here at eight-forty."), say('owner', "Kowalski can have you back on the terminal. Or not. I don't do the terminal."), narr('The suit goes back in the closet. You are a manager again, which yesterday would have sounded like a demotion and today sounds like a mercy.')]); }
    else { f.manager = false; f.ladderOffered = false; f.dockGood = 0; Dlg.run([say('worker', "Three days late. Owner noticed. The terminal's got a new guy on it; he's terrible, and he's on time."), say('worker', "You can stack. Stacking's always here. Prove yourself and I'm sure another promotion is close.")]); }
    f.lateStreak = 0; clearPortrait('you'); return;
  }
  const lines = kind === 'vp'
    ? [say('owner', f.lateStreak === 1 ? "Nine sharp, I said. It's not nine and it's not sharp. Somebody else sat in the chair today. Try again tomorrow." : "Late again. Twice. There is not a third time, I want to be clear about that.")]
    : [say('worker', f.lateStreak === 1 ? "You're late. Stopped to chat, did you? Somebody else took the terminal. Try again tomorrow, six." : "Late twice. Owner asked. I said you were sick. Don't make me say it a third time; I only lie once per employee.")];
  lines.push(narr('You can still stack crates today.'));
  Dlg.run(lines);
}
function amosChair() {
  const a = G.chars.amos; const here = Amos.where(); const amosHere = here && here.scene === 'basement';
  if (G.flags.chairDay === G.day) { Dlg.run([narr('You sat already. The chair remembers.')]); return; }
  if (!amosHere) { Dlg.run([narr(G.tod <= 0.55 ? 'His chair. He is out; the river, probably, or the dock. The room waits the way rooms do.' : 'His chair. Empty.')]); return; }
  if (!talkEnergy(3)) return; G.flags.chairDay = G.day; trust('amos', 1); remember('amos_chair'); Passing.talked('amos');
  Dlg.run([narr('You sit. He stands, because that is what he does. The boiler ticks. Neither of you says anything for a while, and it is not the kind of nothing that needs fixing.'),
    say('amos', pick(["Stay as long as you want. I've got nowhere, and I mean that in a good way for once.", "Eyes closed is fine. I'll be here.", "First guest. You're the first guest. I should've bought a second chair."]))]);
}
function foremanMenu() {
  const f = G.flags; const a = G.chars.amos;
  const items = [];
  if (f.vp) items.push({ t: 'VP: payroll review', r: f.talkedToday ? 'late' : '-70 energy', disabled: () => G.energy < 45 || f.officeToday === G.day, do: () => officeShift('vp') });
  else if (f.manager) items.push({ t: 'Manager shift: manifests', r: f.talkedToday ? 'late' : '-65 energy', disabled: () => G.energy < 40 || f.officeToday === G.day, do: () => officeShift('manager') });
  if (f.manager && !f.vp && f.vpOffered) items.push({ t: 'Ask the owner about the chair', do: () => Dlg.run(VP.askAgain()) });
  items.push({ t: 'Work the crates', r: '-35 energy', disabled: () => G.energy < 25, do: () => startMinigame('crates', (pay, lines) => { useEnergy(35); addHunger(-15); G.dockShifts++; addMoney(pay); const extra = Ladder.onStack(pay); const tease = !f.manager && !f.ladderTeased && (f.dockGood || 0) >= 2 && pay >= 30; if (tease) f.ladderTeased = true;
    Dlg.run([narr(lines.join('. ') + '.'), tease ? say('worker', "Hell of a stack. Keep that up and there may be a promotion in your future. Office job. Sit down all day.") : say('worker', pay >= 36 ? "Hell of a stack. Come back tomorrow." : pay >= 18 ? "Alright. Alright. Tomorrow." : "You'll get it. Or you won't. Tomorrow."), tease ? narr('He says it like a joke. He does not walk away like it was a joke.') : null, extra]); }) });
  if (!f.manager && f.ladderOffered) items.push({ t: 'Ask about the office job', do: () => Dlg.run([say('worker', "Still open. Nobody wants twelve hours in a trailer."), choice({ t: "I'll take it.", do: () => { f.manager = true; f.managerDay = G.day; remember('ladder_manager'); return [say('worker', "Tomorrow. Six. Collar.")]; } }, { t: 'Never mind.', do: () => [] })]) });
  if (f.manager && f.amosWantsJob && !a.job && Amos.present()) items.push({ t: 'Put Amos on the day sheet', do: () => Ladder.hireAmosAsManager() });
  else if (f.amosWantsJob && !a.job && Amos.present()) items.push({ t: 'Put in a word for Amos', disabled: () => G.dockShifts < 3, r: () => G.dockShifts < 3 ? `${G.dockShifts}/3 shifts` : '', do: () => { Amos.hireAtDock(); Dlg.run([you("Amos Reed. He's got his ID. Twenty-two years carpentry before his back went. He'll show up. He'll show up before you do."), say('worker', "The guy on the cardboard by Harlan Arms."), you("Yeah."), say('worker', "..."), say('worker', "You've stacked for me three times and never dropped a load. That buys you one favor. Tell him six a.m. If he's late once, he's done and so are you."), you("He won't be late.")]); } });
  items.push({ t: 'Leave', do: () => { } });
  Menu.open(f.foremanCut ? 'New foreman' : 'Foreman', items, { sub: f.foremanCut ? 'A clipboard with a new name on it. He does not know yours.' : f.vp ? `Vice President. ${f.vpShifts || 0} days in the corner office.` : f.manager ? `Shift lead. ${f.managerShifts || 0} days in the trailer.` : G.dockShifts ? ((f.dockGood || 0) >= 2 && !f.ladderOffered ? 'He has started watching how you stack.' : '') : 'A man with a clipboard and no patience.' });
}

// ---------- sleep / day cycle ----------
function sleep(rough) {
  Audio.sel();
  UI.fadeOut(() => {
    // night
    const n = G.chars;
    G.hunger = clamp(G.hunger - (rough && rough !== 'couch' ? 36 : 30) + (G.flags.own_bed && !rough ? 5 : 0), 0, 100);
    if (G.hunger <= 5) G.starveDays++; else G.starveDays = 0;
    if (G.starveDays >= 2) { die('starved'); return; }
    G.day++;
    if (G.day - (G.lastPill || 1) >= 3) G.pillPenalty = (G.pillPenalty || 0) + 0.7;
  G.maxEnergy = Math.max(20, Math.round(100 - (G.day - 1) * 0.45 - (G.pillPenalty || 0)));
    let restore = G.hunger >= 40 ? 1 : G.hunger >= 15 ? 0.75 : 0.5; if (rough === 'couch') restore *= 0.9; else if (rough) restore *= 0.65; if (!rough) { if (G.flags.own_bed) restore *= 1.15; if (G.flags.own_heater) restore += 0.05; if (G.flags.own_coffee) restore += 0.05; }
    G.energy = Math.round(G.maxEnergy * restore); G.tod = 1 - G.energy / G.maxEnergy;
    G.ateToday = false; G.jobsToday = 0; n.nadia.freeToday = false; G.coughT = 400; G.flags.talkedToday = false;
    rollWeather();
    Amos.daily(); Walter.daily(); Nadia.daily(); Phone.daily(); Passing.daily(); House.daily(); Garden.daily();
    if (G.day >= 99) { beginEnding(); return; }
    // wake in apartment (or on bench)
    if (!rough) { const hs = homeScene(); G.scene = hs; G.px = INTERIORS[hs].spots.bed - 20; G.facing = -1; G.camX = 0; G.dogX = G.px - 30; }
    else if (rough === 'couch') { G.px = INTERIORS.house.spots.bed - 20; G.facing = -1; }
    G.dayCard = { t: 0, line: dayLine() };
    save();
    G.state = 'daycard';
    UI.fade = 1;
  }, 0.03);
}
function dayLine() {
  const d = G.day, m = G.memories.length;
  if (d === 2) return 'Ninety-seven. You count them now.';
  if (d === 3) return 'Work. Eat. Sleep. Subtract one.';
  if (d === 5) return 'You wake up and for a second you forget. Then you remember.';
  if (d === 7) return 'A week. It went nowhere. It went exactly where it was going.';
  if (d === 8) return 'Something is different in the hall. Boxes.';
  if (d === 10) return m < 2 ? 'What is the point of any of it. You go anyway.' : 'Amos said your name yesterday. You had not heard it in a while.';
  if (d === 14) return m < 3 ? 'The rain does not care. Neither do you, mostly.' : 'The days are still the same shape. They have different things in them now.';
  if (d === 20) return 'Twenty. The cough is new.';
  if (d === 30) return 'A third of the way. You do not think about the fraction. You think about it constantly.';
  if (d === 45) return 'The doctor wants to see you. You already know what she will say.';
  if (d === 60) return 'Rent day, for everyone but you.';
  if (d === 75) return 'You are slower on the stairs now. Amos noticed. So did the dog.';
  if (d === 85) return 'Fourteen left. You have stopped subtracting.';
  if (d === 90) return 'Nine. You are not afraid. That surprises you.';
  if (d === 95) return 'Four. Everything is very bright and very far away.';
  if (d === 98) return 'One. Tomorrow.';
  if (G.hunger < 20) return 'You wake up hungry. Hungrier than you were.';
  if (G.rain === 0) return 'It stopped raining. You had forgotten it could.';
  if (G.rain > 0.7) return pick(['Rain. Of course.', 'The gutter outside your window is a river.', 'Grey on grey.']);
  return pick(['Another one.', 'Up. Go.', 'The ceiling. The same crack.', 'You slept. That is something.', '']);
}
function die(cause) {
  G.dead = true; G.deathCause = cause; G.state = 'ending'; Ending.start(cause);
}
function beginEnding() { G.state = 'ending'; Ending.start('day99'); }

// ---------- title ----------
const Title = { sel: 0, items: [], t: 0 };
function titleInit() {
  Title.items = []; if (hasSave()) Title.items.push({ t: 'Continue', do: () => { if (load()) { UI.fadeOut(() => { G.state = 'play'; UI.fadeIn(); }); } } });
  Title.items.push({ t: 'New game', do: () => { UI.fadeOut(() => { newGame(); clearSave(); G.state = 'daycard'; G.dayCard = { t: 0, line: 'The doctor said ninety-nine days. Maybe more, if the trial comes through.', intro: true }; UI.fade = 1; }); } });
  Title.items.push({ t: () => 'Sound: ' + (Audio.muted ? 'off' : 'on'), do: () => Audio.toggleMute() });
  Title.sel = 0;
  if (!G) { newGame(); G.state = 'title'; G.scene = 'street'; G.px = 190; G.camX = 40; G.tod = 0.88; G.rain = 0.7; G.hideHud = true; }
  else { G.state = 'title'; G.scene = 'street'; G.px = 190; G.camX = 40; G.hideHud = true; }
}
function titleUpdate() {
  Title.t++;
  if (Input.hit('up')) { Title.sel = (Title.sel + Title.items.length - 1) % Title.items.length; Audio.blip(); }
  if (Input.hit('down')) { Title.sel = (Title.sel + 1) % Title.items.length; Audio.blip(); }
  if (Input.hit('act')) { Audio.sel(); Title.items[Title.sel].do(); }
}
function titleDraw(g, t) {
  G.hideHud = true; G.tod = 0.88 + 0.04 * Math.sin(t * 0.002); G.entities = [{ id: 'amos', x: STREET.spots.amos, y: FEET_Y, spec: 'amos0', dir: -1, sit: true }, { id: 'player', x: 160, y: FEET_Y, spec: 'player', dir: 1 }];
  renderStreet(g, t);
  g.fillStyle = 'rgba(4,5,9,0.35)'; g.fillRect(0, 0, W, H);
  // big title: scaled bitmap text
  const [tc, tgc] = mkCanvas(80, 12); drawText(tgc, '99 DAYS', 1, 1, '#f0ead8');
  const tw = textWidth('99 DAYS') + 2; const sc = 4; const tx = Math.round(W / 2 - tw * sc / 2);
  const [tc2, tgc2] = mkCanvas(80, 12); drawText(tgc2, '99 DAYS', 1, 1, '#0a0b12'); g.drawImage(tc2, 0, 0, tw, 12, tx + 3, 44 + 3, tw * sc, 12 * sc);
  g.drawImage(tc, 0, 0, tw, 12, tx, 44, tw * sc, 12 * sc);
  drawText(g, 'a small game about the time you have', W / 2, 100, '#a8b0c0', { align: 'center' });
  for (let i = 0; i < Title.items.length; i++) { const it = Title.items[i]; const on = i === Title.sel; const label = typeof it.t === 'function' ? it.t() : it.t; drawText(g, (on ? '> ' : '  ') + label, W / 2, 140 + i * 13, on ? '#e8c84a' : '#c8ccd8', { align: 'center' }); }
  drawText(g, Input.touch ? 'touch: arrows move, E interacts, X back, MENU pauses' : 'WASD/arrows move  -  E interact  -  X back  -  ESC menu  -  gamepad ok', W / 2, H - 22, '#6a7080', { align: 'center' });
  if (hasSave()) drawText(g, 'progress autosaves in this browser', W / 2, H - 12, '#4a5060', { align: 'center' });
  UI.drawFade(g);
}

// ---------- day card ----------
function dayCardUpdate() {
  const c = G.dayCard; c.t++;
  if (c.t > 150 && (Input.hit('act') || c.t > 260)) {
    G.dayCard = null; G.hideHud = false; G.state = 'play'; UI.fadeIn();
    if (c.intro) setTimeout(() => introScene(), 300);
    else wakeEvents();
  }
}
function dayCardDraw(g, t) {
  const c = G.dayCard; g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H);
  const a = clamp(c.t / 40, 0, 1);
  g.globalAlpha = a;
  const [tc, tgc] = mkCanvas(80, 12); drawText(tgc, `DAY ${G.day}`, 1, 1, '#f0ead8'); const w = textWidth(`DAY ${G.day}`) + 2;
  g.drawImage(tc, 0, 0, w, 12, W / 2 - w * 1.5, 96, w * 3, 36);
  drawText(g, `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][G.day % 7]}.  ${99 - G.day} left`, W / 2, 138, '#8a92a4', { align: 'center' });
  g.globalAlpha = clamp((c.t - 50) / 40, 0, 1);
  const lines = wrapText(c.line, 300); lines.forEach((ln, i) => drawText(g, ln, W / 2, 160 + i * 10, '#c8ccd8', { align: 'center' }));
  g.globalAlpha = 1;
}
function introScene() {
  Dlg.run([narr('Your apartment. Four-twelve. One room, one window, one bed.'), narr('On the table: a bottle of pills that do not do anything, and a letter from the clinic with a number on it. On the cabinet over the sink, a post-it in your own handwriting.'), narr('Ninety-nine days. A trial might open. It might not. In the meantime you have twelve dollars and a loaf of bread, and rent is somebody else\'s problem now.'), narr("You need to eat to stay alive long enough to find out. That's the whole job. Work, eat, sleep."), narr(`Move with ${Input.touch ? 'the arrows' : 'A/D or the arrow keys'}. ${UI.keyName('act')} talks, opens doors, does things. ${UI.keyName('menu')} for the menu. The door is to the left.`)]);
}
function wakeEvents() {
  const d = G.day; ladderWake();
  if (House.wake()) return;
  { const j = Jo.J(); if (j.coming && !j.visited && d >= j.visitDay && !j.stopped) { Jo.visit(); return; } }
  if (d === 2 && !G.flags.w2) { G.flags.w2 = true; Dlg.run([narr("Lin's Market sells food. Nadia's diner and the freight dock pay cash for work. Everything costs energy. When you're out, you sleep, and the number goes down.")]); }
  if (d === 4 && !G.flags.w4) { G.flags.w4 = true; Dlg.run([narr("A flyer under your door: LIN'S MARKET - DELIVERY RUNNERS WANTED - CASH SAME DAY. Ask at the counter.")]); G.flags.deliveryAvailable = true; }
  if (d === 8 && !G.flags.w8) { G.flags.w8 = true; Dlg.run([narr('Boxes scraping in the hall since six. Somebody is moving into 411.')]); }
  if (G.chars.nora && !G.chars.nora.cold && G.chars.nora.trust >= 5 && d % 5 === 2 && !G.flags['noraKnock' + d] && d < 97) { G.flags['noraKnock' + d] = true; Dlg.run([narr('Two knocks on the wall, seven a.m. sharp. You knock back twice. That is the whole conversation, and it is enough.')]); }
  if (d === 30 && !G.flags.w30) { G.flags.w30 = true; Dlg.run([narr('You cough for a full minute before you can stand. There is a taste of pennies. You get up anyway.')]); }
  if (d === 70 && !G.flags.w70) { G.flags.w70 = true; Dlg.run([narr('Some days now you cannot do much. Today is one of them. Choose what matters.')]); }
  if (G.chars.amos.room && G.day % 4 === 0 && !G.flags['amosVisit' + G.day] && G.day < 95 && !Passing.isBrushed('amos')) { G.flags['amosVisit' + G.day] = true; Dlg.run([narr('A knock. Amos, with two coffees from Nadia\'s. He does not come in. He does not need to.'), say('amos', "Drink it. I'm not leaving till you drink it."), { fn: () => addHunger(10) }]); }
  if (G.flags.grannyHelped >= 3 && G.day >= 80 && G.day % 5 === 0 && !G.flags['grannyVisit' + G.day]) { G.flags['grannyVisit' + G.day] = true; Dlg.run([narr('Tamales outside your door, wrapped in foil, still warm. No note. There does not need to be.'), { fn: () => addHunger(30) }]); }
}

// ---------- ending ----------
const Ending = {
  phase: 0, t: 0, cause: null, list: [], scroll: 0, listH: 0,
  start(cause) {
    this.cause = cause; this.phase = 0; this.t = 0; this.list = buildEndingList(); this.scroll = 0;
    G.hideHud = true; Audio.setRain(0);
    if (cause === 'day99') {
      G.scene = homeScene(); G.px = 312; G.facing = -1; G.tod = 0.1; G.rain = 0; G.lying = true; G.visitors = [];
      UI.fade = 1; UI.fadeIn();
      const V = []; const a = G.chars.amos, m = G.chars.mei, n = G.chars.nadia, f = G.flags;
      const feet = INTERIORS[G.scene].floorY;
      const lines = G.flags.house === 'mine' ? [narr('Day ninety-nine. You cannot get up. You try, and the room tilts, and you lie back down on the daybed and look at the seven clocks. The one you wound is still going.'), narr('The rain has stopped. Light comes through Ruth\'s window and lies across the floor like something left there on purpose.')] : [narr('Day ninety-nine. You cannot get up. You try, and the room tilts, and you lie back down and look at the crack in the ceiling.'), narr('The rain has stopped. Light comes through the window and lies across the floor like something left there on purpose.')];
      if (a.room || a.job) { V.push({ x: 262, y: feet, spec: a.spec, dir: 1, id: 'v_amos' }); lines.push(say('amos', "Hey. Hey. I brought the chair up. I'm going to sit in it. You don't have to say anything."), say('amos', "I'm here. That's all. I'm here.")); }
      else if (a.fed >= 2 && !a.dead) { V.push({ x: 262, y: feet, spec: a.spec, dir: 1, id: 'v_amos' }); lines.push(say('amos', "Mrs. Ortega let me in. I didn't know if I should. I'm going to sit here a while, if that's alright."), say('amos', "You fed me. Nobody feeds anybody. I just wanted to say it while you could hear it.")); }
      if (m.accepted || (m.applied && !m.cold)) { V.push({ x: 234, y: feet, spec: m.spec, dir: 1, id: 'v_mei' }); lines.push(say('mei', "I'm drawing you. Don't move. I mean, you weren't going to, but. Don't."), say('mei', "It's the best one. It's going in the first show. I'm going to put a title on it and the title is going to be your apartment number, and nobody's going to get it but me.")); }
      else if (m.sketch && !m.cold) { V.push({ x: 234, y: feet, spec: m.spec, dir: 1, id: 'v_mei' }); lines.push(say('mei', "I brought the sketchbook. It's full. You should see it before... you should see it.")); }
      if (n.saved) { V.push({ x: 206, y: feet, spec: n.spec, dir: 1, id: 'v_nadia' }); lines.push(say('nadia', "Soup. The 412. I'm going to feed it to you with a spoon and you're going to let me."), say('nadia', "Sam's in the hall. He made a card. It's terrible. You're going to love it.")); }
      else if (n.trust >= 3 && n.closed) lines.push(narr('A card in the mail from Dayton, in a child\'s handwriting: GET BETTER. IT WAS A GOOD SOUP. -SAM'));
      const no = G.chars.nora;
      if (no && !no.cold && (no.person || no.stage >= 2)) { V.push({ x: 282, y: feet, spec: 'nora', dir: 1, id: 'v_nora' }); lines.push(no.person ? say('nora', "Keys in my teeth. Told you. Straight from shift, I smell like the ward, sorry.") : say('nora', "I heard you through the wall. Two knocks. I'm here."), say('nora', "I'm not going to say the word. You know the word. I'm just going to sit here and hold this and you don't have to do anything."), narr('She takes your hand the way she has taken a hundred hands, and it is not less because of that. It is more.')); }
      { const j = Jo.J(); if (j.visited) { V.push({ x: 250, y: feet, spec: 'jo', dir: 1, id: 'v_jo' }); lines.push(say('jo', "I took the 10:40. I'm going to sit here and you're going to let me, and I'm not going to say one word about the room."), say('jo', "Micah drew you. It's mostly a hat. You don't wear a hat; I told him; he said you should.")); } }
      if (f.dogFollows) { V.push({ x: 286, y: feet + 8, sprite: 'dogSit', dir: -1, id: 'v_dog' }); lines.push(narr('The dog is on the bed. It is not allowed on the bed. Nobody says anything.')); }
      if (G.inv.chess) lines.push(narr("Walter's chess set is on the table. Knight first. You never moved anything. You did not need to."));
      if (f.buskerTips >= 3) lines.push(narr('Somewhere below the window, a guitar. A song about rain. He is playing it badly and on purpose.'));
      if (V.length === 0) lines.push(narr('Nobody comes. You did not expect anybody. The room is very quiet.'), narr('Through the wall, a kettle. Down on the street, somebody laughing at something. The building goes on around you.'));
      else lines.push(narr(V.length >= 3 ? 'The room is full. It is a small room and it is full.' : 'It is a small room. Somebody is in it.'));
      lines.push(narr('The light moves across the floor. You watch it go.'), narr('...'));
      this.visitorsToAdd = V; this.lines = lines;
      G.visitors = [];
      setTimeout(() => { G.visitors = V; Dlg.run(lines, () => { this.phase = 1; this.t = 0; }); }, 1200);
    } else {
      this.phase = 1; this.t = 0; UI.fade = 1;
    }
  },
  update() {
    this.t++;
    if (this.phase === 0) { if (Dlg.active) Dlg.update(); return; }
    if (this.phase === 1) { UI.fade = clamp(this.t / 180, 0, 1); if (this.t > 260) { this.phase = 2; this.t = 0; Audio.chord([196, 247, 294, 392], 3); } return; }
    if (this.phase === 2) { if (this.t > 200 && Input.hit('act')) { this.phase = 3; this.t = 0; } return; }
    if (this.phase === 3) { const maxS = Math.max(0, this.listH - 190); if (Input.held('down')) this.scroll += 2; if (Input.held('up')) this.scroll -= 2; if (Input.hit('down')) this.scroll += 24; if (Input.hit('up')) this.scroll -= 24; this.scroll = clamp(this.scroll, 0, maxS); if (this.t > 120 && Input.hit('act')) { if (this.scroll >= maxS - 1) { this.phase = 4; this.t = 0; } else this.scroll = Math.min(maxS, this.scroll + 100); } return; }
    if (this.phase === 4) { if (this.t > 200 && Input.hit('act')) { clearSave(); G = null; titleInit(); UI.fade = 1; UI.fadeIn(); } }
  },
  draw(g, t) {
    if (this.phase === 0) { buildEntities(); renderInterior(g, t); Dlg.draw(g, t); UI.drawFade(g); return; }
    if (this.phase === 1) { if (this.cause === 'day99') { buildEntities(); renderInterior(g, t); } else { g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H); } UI.drawFade(g); return; }
    g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H);
    if (this.phase === 2) {
      const a = clamp(this.t / 90, 0, 1); g.globalAlpha = a;
      if (this.cause === 'day99') { drawText(g, `Day 99.`, W / 2, 100, '#f0ead8', { align: 'center' }); drawText(g, 'You die in the morning, with the light on the floor.', W / 2, 116, '#a8b0c0', { align: 'center' }); }
      else { drawText(g, `Day ${G.day}.`, W / 2, 100, '#f0ead8', { align: 'center' }); drawText(g, 'You did not make it to the end. You starved, in the room.', W / 2, 116, '#a8b0c0', { align: 'center' }); drawText(g, `${99 - G.day} days you did not get.`, W / 2, 128, '#6a7080', { align: 'center' }); }
      g.globalAlpha = 1;
      g.globalAlpha = clamp((this.t - 200) / 60, 0, 1); drawText(g, `${UI.keyName('act')} to continue`, W / 2, 240, '#6a7080', { align: 'center' }); g.globalAlpha = 1;
    }
    if (this.phase === 3) {
      drawText(g, 'THE PEOPLE', W / 2, 14, '#e8c84a', { align: 'center' }); drawText(g, 'Harlan Street, days 1 to 99', W / 2, 24, '#8a92a4', { align: 'center' });
      g.save(); g.beginPath(); g.rect(0, 38, W, 200); g.clip();
      let y = 44 - this.scroll;
      for (let i = 0; i < this.list.length; i++) {
        const it = this.list[i]; const a = clamp((this.t - i * 25) / 40, 0, 1); g.globalAlpha = a;
        drawText(g, it.name, 60, y, it.bad ? '#8a8a96' : '#f0ead8');
        const lines = wrapText(it.line, 340); lines.forEach((ln, k) => drawText(g, ln, 60, y + 10 + k * 9, it.bad ? '#6a7080' : '#b8c0d0')); y += 14 + lines.length * 9 + 8;
      }
      this.listH = y + this.scroll - 44;
      g.globalAlpha = 1; g.restore();
      if (this.listH > 190) drawText(g, 'UP/DOWN to scroll', W / 2, 244, '#4a5060', { align: 'center' });
      g.globalAlpha = clamp((this.t - 120) / 60, 0, 1); drawText(g, `${UI.keyName('act')} to continue`, W / 2, 256, '#6a7080', { align: 'center' }); g.globalAlpha = 1;
    }
    if (this.phase === 4) {
      const good = this.list.filter(x => !x.bad).length;
      g.globalAlpha = clamp(this.t / 90, 0, 1);
      drawText(g, this.cause === 'day99' ? 'Ninety-nine days.' : `${G.day} days.`, W / 2, 110, '#f0ead8', { align: 'center' });
      g.globalAlpha = clamp((this.t - 120) / 60, 0, 1);
      drawText(g, `${this.list.length} people. ${good} of them better off.`, W / 2, 130, '#8a92a4', { align: 'center' });
      g.globalAlpha = clamp((this.t - 200) / 60, 0, 1); drawText(g, `${UI.keyName('act')} to begin again`, W / 2, 240, '#6a7080', { align: 'center' }); g.globalAlpha = 1;
    }
  }
};

// ---------- play update ----------
function playUpdate() {
  const sc = G.scene; const outdoor = isOutdoor(sc); const sw = sceneW(sc);
  const maxX = outdoor ? sw - 12 : INTERIORS[sc].x1 - 12;
  let dx = 0;
  if (G.stun > 0) { G.stun--; }
  else {
    if (Input.held('left')) dx = -1; if (Input.held('right')) dx = 1;
  }
  const speed = G.day >= 70 ? 1.35 : 1.7;
  if (dx !== 0) { G.px = clamp(G.px + dx * speed, outdoor ? 12 : INTERIORS[sc].x0 + 12, maxX); G.facing = dx; G.walking = true; G.frame = (G.frame + 0.16) % 4; if (Math.floor(G.frame) !== G._lastF && (Math.floor(G.frame) % 2 === 0)) Audio.step(); G._lastF = Math.floor(G.frame); if (outdoor) { useEnergy(G.flags.own_boots ? 0.002 : 0.004); G.hunger = Math.max(0, G.hunger - 0.002); } }
  else G.walking = false;
  // camera
  if (outdoor) { const target = clamp(G.px - W / 2 + G.facing * 30, 0, sw - W); G.camX = lerp(G.camX, target, 0.08); } else G.camX = 0;
  // dog follower
  if (G.flags.dogFollows) { const want = G.px - G.facing * 28; if (Math.abs(G.dogX - want) > 30) G.dogX = lerp(G.dogX, want, 0.06); }
  // walkers
  if (outdoor) {
    if (sc === 'street' && Math.random() < 0.003 && G.walkers.length < 3 && G.tod < 0.92) { const dir = Math.random() < 0.5 ? 1 : -1; G.walkers.push({ x: dir > 0 ? G.camX - 30 : G.camX + W + 30, dir, spec: pick(['woman1', 'man1']), frame: 0, dy: -3 }); }
    for (const w of G.walkers) { w.x += w.dir * 1.1; w.frame = (w.frame + 0.12) % 4; }
    G.walkers = G.walkers.filter(w => w.x > -60 && w.x < STREET.w + 60 && Math.abs(w.x - G.camX - W / 2) < W);
    // cough
    if (G.day >= 20) { G.coughT -= (1 + (G.day - 20) / 40) * (G.day - (G.lastPill || 1) >= 3 ? 1.8 : 1) * (G.flags.own_umbrella && G.rain > 0.3 ? 0.6 : 1); if (G.coughT <= 0) { G.coughT = 500 + Math.random() * 500; G.stun = 40; G.walking = false; Audio.tone(120, 0.15, 'sawtooth', 0.03, 0.6); } }
  }
  Phone.update(); Passing.update();
  // interactions
  const n = nearest(); G.near = n;
  if (Input.hit('act') || (Input.hit('up') && n && n.kind === 'door')) { if (n && G.stun === 0) { interact(n); } }
  if (Input.hit('menu')) { Audio.blip(); pauseMenu(); }
  if (Input.hit('mute')) Audio.toggleMute();
  // energy exhaustion: forced to sleep? no; but at zero you can only walk home. handled by disabled jobs.
  if (G.energy <= 0 && !G.flags.exhaustToast) { G.flags.exhaustToast = true; UI.toast('Out of energy. Go home and sleep.', '#8ab0d8'); }
  if (G.energy > 0) G.flags.exhaustToast = false;
}

// ---------- draw play ----------
function drawPlayer(g) { }
function playDraw(g, t) {
  buildEntities();
  renderScene(g, t);
  // lying player for ending is handled in ending
  // prompt
  if (G.state === 'play' && G.near && G.stun === 0) {
    const n = G.near; const label = n.kind === 'door' ? `${UI.keyName('act')}: ${n.label}` : n.kind === 'ent' ? `${UI.keyName('act')}: ${n.label}` : `${UI.keyName('act')}: ${n.label}`;
    UI.drawPrompt(g, label, G.px - G.camX, (isOutdoor(G.scene) ? FEET_Y : INTERIORS[G.scene].floorY) - 52);
  }
  UI.drawHud(g, t);
}

// ---------- main loop ----------
let frame = 0, last = 0, acc = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min(50, ts - last); last = ts; acc += dt;
  let steps = 0;
  while (acc >= 16.67 && steps < 3) { acc -= 16.67; steps++; tick(); }
  if (steps > 0) render();
}
function tick() {
  Input.beginFrame(); frame++;
  if (G) { G.t = frame; if (isOutdoor(G.scene) || (INTERIORS[G.scene] && INTERIORS[G.scene].window)) updateRain(G.camX); if (G.scene === 'bus' && (G.state === 'play' || G.state === 'dialogue' || G.state === 'menu')) Bus.update(); }
  UI.updateFade();
  if (!G) return;
  if (frame % 60 === 0) autosave(false);
  switch (G.state) {
    case 'title': titleUpdate(); break;
    case 'daycard': dayCardUpdate(); break;
    case 'play': if (UI.fadeDir === 0) playUpdate(); break;
    case 'dialogue': Dlg.update(); break;
    case 'menu': Menu.update(); break;
    case 'minigame': if (MG.cur) MG.cur.update(); break;
    case 'elevator': Elevator.update(); break;
    case 'fishing': Fishing.update(); break;
    case 'song': Song.update(); break;
    case 'ending': Ending.update(); break;
  }
}
function render() {
  const g = ctx; const t = frame;
  if (!G) return;
  switch (G.state) {
    case 'title': titleDraw(g, t); return;
    case 'daycard': dayCardDraw(g, t); return;
    case 'ending': Ending.draw(g, t); return;
    case 'minigame': buildEntities(); renderScene(g, t); if (MG.cur) MG.cur.draw(g, t); UI.drawFade(g); return;
    case 'fishing': buildEntities(); renderLake(g, t); UI.drawHud(g, t); Fishing.drawHud(g, t); UI.drawFade(g); return;
    case 'song': Song.draw(g, t); UI.drawFade(g); return;
    case 'elevator': Elevator.draw(g, t); UI.drawFade(g); return;
    default:
      playDraw(g, t);
      Dlg.draw(g, t); Menu.draw(g, t);
      UI.drawFade(g);
  }
}
// boot
World.static || buildStreetStatic(); paintLampPosts(World.static.getContext('2d'));
titleInit();
requestAnimationFrame(loop);
// debug hooks
window.__99 = { get G() { return G; }, set G(v) { G = v; }, sleep, Amos, Mei, Walter, Nadia, Nora, Elevator, Ladder, Doctor, MG, readNote, Theo, VP, Pawn, Gifts, OUTFITS, PAWN_ITEMS, Dlg, Menu, startMinigame, buildEndingList, save, load, newGame, goScene, Ending, refresh: buildEntities, titleInit, Emmett, Bus, Fishing, Passengers, LAKE, busDay, Phone, Jo, Passing, House, LANE, homeScene, Song, SONGS, Garden, GARDEN };
