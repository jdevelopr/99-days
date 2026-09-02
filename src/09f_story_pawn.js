// ============================================================
// Sol's Pawn & Loan: 25 items, the wardrobe, selling (and what it costs), Sol's ledger
// ============================================================
SPECS.sol = { skin: '#d8b898', hair: '#c8c4c0', hairStyle: 'thin', shirt: '#5a5a6a', pants: '#3a3a44', shoes: '#2a2420', glasses: true, old: true, vest: '#4a3a4a', tie: '#2a2a2a' };
SPEAKERS.sol = { name: 'Sol', color: '#d8b060', spec: 'sol' };
// outfits (player variants)
const OUTFITS = {
  overcoat: { name: 'wool overcoat', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#5c6270', pants: '#2c3444', shoes: '#3a3634', coat: '#3a3028', scarf: '#8a7a5a', stubble: true } },
  suit: { name: 'second-hand suit', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#2a2a34', shoes: '#1a1a1e', coat: '#3a3a4a', tie: '#6a2a2a' } },
  leather: { name: 'leather jacket', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#8a2a2a', pants: '#2c3444', shoes: '#3a3634', coat: '#2a2226', stubble: true } },
  flannel: { name: 'flannel & jeans', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#8a3a3a', pants: '#3a4a6a', shoes: '#5a4a3a', stubble: true } },
  shell: { name: 'rain shell', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#5c6270', pants: '#2c3444', shoes: '#3a3634', coat: '#2a6a5a', hat: 'hood', hatColor: '#2a6a5a' } },
  vpsuit: { name: 'the VP suit', noSale: true, spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#26262e', shoes: '#1a1a1e', coat: '#2a2a34', tie: '#5a2a3a' } },
  cardigan: { name: 'cardigan', spec: { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'messy', shirt: '#e8e0c8', pants: '#4a4a3a', shoes: '#3a3634', coat: '#6a5a3a', stubble: true } },
};
for (const k in OUTFITS) { SPECS['outfit_' + k] = OUTFITS[k].spec; SPECS['outfit_' + k + '_late'] = Object.assign({}, OUTFITS[k].spec, { skin: '#cfae96' }); }
playerSpec = function () {
  const f = G.flags; const late = G.day >= 60;
  if (G.outfit && OUTFITS[G.outfit] && G.wardrobe && G.wardrobe[G.outfit]) return 'outfit_' + G.outfit + (late ? '_late' : '');
  if (f.vp) return late ? 'playerVPLate' : 'playerVP';
  if (f.manager) return late ? 'playerManagerLate' : 'playerManager';
  return late ? 'playerLate' : 'player';
};

// ---------- the catalogue ----------
// kind: 'self' | 'gift' | 'outfit'. always: true = on the shelf until bought. give: who it's for.
const PAWN_ITEMS = {
  watch: { name: 'Wristwatch (works)', price: 250, kind: 'self', always: true, desc: 'A clock on your wrist. You will know what time it is.' },
  bed: { name: 'A real bed', price: 500, kind: 'self', always: true, desc: 'Delivered by two men who complain about the stairs. You sleep better.' },
  tools: { name: "Carpenter's tools, oak box", price: 180, kind: 'gift', always: true, give: 'amos', desc: 'Chisels, a plane, a square. The name burned into the lid is A. REED.' },
  textbook: { name: 'Drawing textbook (Bridgman)', price: 125, kind: 'gift', always: true, give: 'mei', desc: 'Constructive anatomy. The spine is cracked in all the right places.' },
  collar: { name: 'Dog collar, brass tag', price: 50, kind: 'gift', always: true, give: 'dog', desc: 'Sol will engrave the tag. You have to decide what it says.' },
  ruthWatch: { name: "Ladies' watch, 1979", price: 140, kind: 'gift', always: true, give: 'walter', desc: 'Small, gold-plated, keeps time. The ledger says ASHBY. Sol will not sell it to anyone else.' },
  heater: { name: 'Space heater', price: 110, kind: 'self', desc: 'The room is warm. You wake up less tired.' },
  boots: { name: 'Work boots, resoled', price: 85, kind: 'self', desc: 'Walking the street costs half the energy.' },
  coffee: { name: 'Coffee maker', price: 70, kind: 'self', desc: 'A little energy back every morning.' },
  umbrella: { name: 'Umbrella, only slightly bent', price: 60, kind: 'self', desc: 'The rain gets to your chest less. Fewer coughing fits on wet days.' },
  radio: { name: 'Transistor radio', price: 90, kind: 'self', desc: 'For the apartment. Kessler calls the ball games.' },
  overcoat: { name: 'Wool overcoat', price: 150, kind: 'outfit', desc: 'Heavy, grey, warm. Somebody wore it to funerals.' },
  suit: { name: 'Second-hand suit', price: 200, kind: 'outfit', desc: 'Fits. Nearly.' },
  leather: { name: 'Leather jacket', price: 120, kind: 'outfit', desc: 'Somebody was cooler than you in this once.' },
  flannel: { name: 'Flannel & jeans', price: 75, kind: 'outfit', desc: 'Soft. Clean. Like a day off.' },
  shell: { name: 'Rain shell', price: 95, kind: 'outfit', desc: 'Green, with a hood that stays up.' },
  cardigan: { name: 'Cardigan', price: 80, kind: 'outfit', desc: 'Cream, with wooden buttons. Walter would approve.' },
  chessClock: { name: 'Chess clock', price: 65, kind: 'gift', give: 'walter', desc: 'Two faces, one lever. So Walter can cheat on the clock instead of the board.' },
  strings: { name: 'Guitar strings & a capo', price: 55, kind: 'gift', give: 'busker', desc: "Cal's E string has been a fishing line since March." },
  checkers: { name: 'Checkers set', price: 50, kind: 'gift', give: 'sam', desc: 'Sam always wins. This will not change that.' },
  nurseShoes: { name: "Nurse's clogs, size 7", price: 95, kind: 'gift', give: 'nora', desc: 'Her feet have opinions. These are the answer.' },
  amosHeater: { name: 'Space heater (for Amos)', price: 110, kind: 'gift', give: 'amos', desc: 'Warm through the night, wherever the night is.' },
  gloves: { name: 'Winter gloves', price: 50, kind: 'gift', give: 'granny', desc: "For Mrs. Ortega, who carries oranges in the rain." },
  frame: { name: 'Picture frame, walnut', price: 60, kind: 'gift', give: 'nadia', desc: "For the photo of her father's diner she keeps under the register." },
  busPass: { name: 'Monthly bus pass', price: 50, kind: 'gift', give: 'mei', desc: 'So Mei can see the school before she decides.' },
};
const PAWN_POOL = Object.keys(PAWN_ITEMS).filter(k => !PAWN_ITEMS[k].always);
// what the player owns that can be pawned: [key, offer, giver, label]
const PAWNABLE = [
  ['bird', 40, 'amos', "Amos's carved bird"], ['chess', 60, 'walter', "Walter's chess set"], ['drawing', 15, 'mei', "Mei's drawing of you"], ['thermos', 20, 'nora', "Nora's thermos"],
];

const Pawn = {
  init() { return { stage: 0, trust: 0, met: false, talks: 0, bought: {}, sold: [], cold: false, ledger: false, watchTold: false, toolsTold: false, trumpet: false, played: false, spec: 'sol' }; },
  S() { if (!G.chars.sol) G.chars.sol = this.init(); return G.chars.sol; },
  todaysStock() {
    const s = this.S(); const R = seeded(G.weatherSeed + G.day * 7919);
    const always = Object.keys(PAWN_ITEMS).filter(k => PAWN_ITEMS[k].always && !s.bought[k]);
    const pool = PAWN_POOL.filter(k => !s.bought[k]).sort(() => R() - 0.5).slice(0, 3);
    return always.concat(pool);
  },
  menu() {
    const s = this.S();
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }, { t: 'Look at the shelves', do: () => this.shop() }];
    if (!s.cold) items.push({ t: 'Pawn something', do: () => this.sellMenu() });
    if (s.stage >= 3 && !s.played && s.trumpet) items.push({ t: 'Ask him to play it', do: () => this.play() });
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(s.met ? 'Sol' : 'The man behind the cage', items, { sub: s.cold ? 'He does not look up from the ledger.' : '' });
  },
  shop() {
    const s = this.S(); s.met = true; const stock = this.todaysStock();
    const items = stock.map(k => { const it = PAWN_ITEMS[k]; return { t: it.name, r: () => `$${it.price}`, disabled: () => G.money < it.price, do: () => this.buy(k) }; });
    items.push({ t: 'Nothing today', do: () => { } });
    Menu.open("Sol's Pawn & Loan", items, { wide: true, sub: `Six things that are always here, three that are here today. You have $${G.money}.` });
  },
  buy(k) {
    const it = PAWN_ITEMS[k]; const s = this.S();
    Menu.open(it.name, [{ t: `Buy it for $${it.price}`, disabled: () => G.money < it.price, do: () => { if (!spend(it.price)) return; s.bought[k] = G.day; this.applyBuy(k); } }, { t: 'Put it back', do: () => this.shop() }], { wide: true, sub: it.desc });
  },
  applyBuy(k) {
    const it = PAWN_ITEMS[k]; const f = G.flags; remember('pawn_' + k); Audio.coin();
    if (it.kind === 'outfit') { G.wardrobe = G.wardrobe || {}; G.wardrobe[k] = 1; Dlg.run([say('sol', pick(["Fits. Nearly. Change at home; I don't run a fitting room.", "It was a good coat on somebody. It'll be a good coat on you."])), narr('It goes in the wardrobe at home. Change there.')]); return; }
    if (it.kind === 'gift') { G.inv[k] = (G.inv[k] || 0) + 1; const lines = { tools: [say('sol', "Reed's tools. He pawned them in '21 and came in every week for a year to look at them. Then he stopped coming in."), say('sol', "Take them to him. Don't tell him what you paid. I never told him what I'd have taken.")], ruthWatch: [say('sol', "Ashby's. He brought it in a bad winter, 2009, and he's never come back for it, and I've never put it in the window."), say('sol', "I'm selling it to you because you're going to give it to him. If I'm wrong about that, don't come back.")], collar: [say('sol', "What's the tag say?"), choice({ t: "412.", do: () => { f.collarTag = '412'; return [say('sol', "Your apartment. So he can find his way home. Alright.")]; } }, { t: "Biscuit.", do: () => { f.collarTag = 'Biscuit'; return [say('sol', "Biscuit. Every third dog in this city is Biscuit. He'll answer to it.")]; } }, { t: "Nothing. Just the tag.", do: () => { f.collarTag = ''; return [say('sol', "Blank tag. Suit yourself. Means he's somebody's, anyway.")]; } })] }[k] || [say('sol', fresh('sol', ["Good. That one's going somewhere.", "Wrapped. Sort of.", "You've got somebody in mind. I can always tell."]))]; Dlg.run(lines); return; }
    // self items
    f['own_' + k] = true;
    const lines = { watch: [say('sol', "Keeps time. That's all a watch can do for you, and it's not nothing."), narr('A clock, top right. You will know what time it is now, whether you want to or not.')], bed: [say('sol', "I'll have Danny and his cousin bring it up. They'll complain about the stairs. Let them."), narr('That night the cot goes out to the curb and a real bed goes where it was.')], radio: [narr('Kessler is calling a ball game the moment you turn it on. Somebody, somewhere, is winning.')] }[k] || [narr(it.desc)];
    Dlg.run(lines);
    if (k === 'bed') { G.flags.betterBed = true; delete interiorCache.apartment; }
  },
  // ---------- selling ----------
  sellMenu() {
    const s = this.S(); s.met = true; const items = [];
    for (const [key, offer, giver, label] of PAWNABLE) if (G.inv[key]) items.push({ t: label, r: `$${offer}`, do: () => this.sell(key, offer, giver, label) });
    for (const k in s.bought) if (PAWN_ITEMS[k] && PAWN_ITEMS[k].kind !== 'gift' && !s.sold.includes(k)) { const back = Math.round(PAWN_ITEMS[k].price * 0.4); items.push({ t: PAWN_ITEMS[k].name, r: `$${back}`, do: () => { addMoney(back); s.sold.push(k); if (PAWN_ITEMS[k].kind === 'outfit') { delete G.wardrobe[k]; if (G.outfit === k) G.outfit = null; } else { delete G.flags['own_' + k]; if (k === 'bed') { G.flags.betterBed = false; delete interiorCache.apartment; } } delete s.bought[k]; Dlg.run([say('sol', "Forty cents on the dollar. That's the business. Nobody's happy with the business.")]); } }); }
    if (!items.length) { Dlg.run([say('sol', "You've got nothing I'd write down. That's a compliment, from me.")]); return; }
    items.push({ t: 'Never mind', do: () => { } });
    Menu.open('Pawn something', items, { wide: true, sub: 'He opens the ledger to a fresh line.' });
  },
  sell(key, offer, giver, label) {
    const s = this.S();
    Menu.open(label, [{ t: `Take the $${offer}`, do: () => {
      G.inv[key] = 0; addMoney(offer); s.sold.push(key); s.cold = true; s.coldDay = G.day; G.flags['pawned_' + key] = G.day; remember('pawned_' + key);
      const c = G.chars[giver]; if (c) { c.pawnedGift = key; c.trust -= 5; }
      Dlg.run([narr('Sol looks at it for a long time. Then he writes your name in the ledger, and a date, and the number.'), say('sol', "I'll hold it thirty days. That's the law. After that it goes in the window with the rest of the things people meant to come back for."), narr('He does not say anything else. He does not look up when you leave.')]);
    } }, { t: 'Keep it', do: () => { } }], { wide: true, sub: `${label}. He will not ask why.` });
  },
  // ---------- Sol ----------
  talk() {
    const s = this.S(); if (!talkEnergy()) return; s.talks++; const L = [];
    if (s.cold) { L.push(say('sol', fresh('sol', ["Buying or selling.", "Ledger's open. That's all.", "..."]))); if (G.day - s.coldDay > 20 && Math.random() < 0.3) L.push(narr('He has not forgiven it. He has written it down, which for Sol is the same thing.')); Dlg.run(L); return; }
    if (!s.met) { s.met = true; clearPortrait('sol'); L.push(narr('Behind a cage of brass wire, an old man with a jeweler\'s loupe pushed up on his forehead and a ledger the size of a paving stone.'), say('sol', "Sol. Forty-one years. Buying, selling, holding. Mostly holding."), say('sol', "Everything on these shelves has a name in this book. Most of the names never came back. You looking to buy, or you looking to be a name?")); }
    else if (s.stage === 0) {
      if (s.talks >= 3 && !s.ledger) { s.ledger = true; s.stage = 1; L.push(say('sol', "You want to see the book? Nobody wants to see the book."), narr('He turns it around. Columns of names and dates and objects, in the same careful hand, going back decades. Some entries have a line through them: redeemed. Most do not.'), say('sol', "Reed, A., 2021, tools, oak box. Ashby, W., 2009, ladies' watch. Marsh, C., this spring, a trumpet, and I'll tell you about that one when I know you better."), say('sol', "I don't sell the ones I think are coming back. Bad business. Forty-one years of bad business.")); }
      else L.push(say('sol', fresh('sol', ["Everything's worth what somebody desperate will take for it. That's the only economics I know.", "The watch in the case is a real one. Swiss. A dentist pawned it in '98 for a weekend he regrets.", "Kowalski from the dock comes in twice a year. Always the same ring. Always gets it back.", "You've got the walk of a man deciding what he can do without. I've seen it forty-one years."])));
    }
    else if (s.stage === 1) {
      if (!s.watchTold && G.chars.walter.met && !G.chars.walter.dead) { s.watchTold = true; L.push(say('sol', "The old man at the bus stop. Ashby. You know him?"), you("I sit with him."), say('sol', "The watch in the case was his wife's. She set it by the bus, he told me. He pawned it the winter she was in the hospital and the heat bill came, and he's never come in since. Can't face me, or can't face it."), say('sol', "I've kept it wound fourteen years. It's in the case, always, one-forty. That's what I paid him. I'm not making a dollar on it. Take it to him.")); }
      else if (!s.toolsTold && G.chars.amos.met) { s.toolsTold = true; L.push(say('sol', "The tools in the window. Reed's. Carpenter, before the fall. He'd come and stand at the glass and I'd pretend to be busy."), say('sol', "One-eighty. That's what I gave him. He's got hands, that man; he's just got nothing to put in them.")); }
      else L.push(say('sol', fresh('sol', ["Nobody redeems anymore. They just wave at the window on the way past.", "I had a kid in here this spring, sixteen maybe, pawned a trumpet. Case was worth more than the horn. He wouldn't take more.", "The bed in the back was a good bed. Somebody's marriage was in it. Beds don't know."])));
      if (s.trust >= 3) s.stage = 2;
    }
    else if (s.stage === 2) {
      if (!s.trumpet) { s.trumpet = true; s.stage = 3; remember('sol_trumpet'); L.push(say('sol', "The trumpet. Marsh, C. The busker's kid brother, this spring, right before he ran. I gave him twenty dollars for it and told him thirty days."), say('sol', "It's been a hundred and some. By the book it's mine to sell. I've had two offers."), say('sol', "My son played. Same model, near enough. He's been dead nineteen years and I still can't put a trumpet in a window."), you("So it stays in the case."), say('sol', "It stays in the case. Everything I can't sell stays in the case. It's a big case.")); }
      else L.push(say('sol', fresh('sol', ["Slow. It's always slow. That's not a complaint; fast is worse, fast means the block's in trouble.", "Ashby came in. First time in fourteen years. Stood at the case. Didn't say anything. Left. That's more than I expected.", "I closed the book on a name today. Redeemed. It happens. Not enough, but it happens."])));
    }
    else if (s.stage >= 3) {
      if (G.chars.theo && G.chars.theo.reunited && !s.trumpetBack) { s.trumpetBack = true; remember('sol_trumpet_back'); L.push(say('sol', "The Marsh kid came in. With the brother. He had twenty dollars and I took it, because that's the book, and then I gave it back to him, because that's me."), say('sol', "He played four notes on the sidewalk. Terrible. My son was terrible too, at first. Then he wasn't."), narr('He puts the loupe down and takes his glasses off and does not put them back on for a while.')); }
      else L.push(say('sol', fresh('sol', ["Play? Me? I'm seventy-three. I've got a horn in a case and no wind.", "You keep coming in and not buying. That's what a friend is, I think. It's been a while.", "I wrote your name in the book. No object. Just the name. I wanted it in there.", G.flags.foremanCut ? "Kowalski was in. Didn't want the ring back this time. Left it. Twenty years at that dock." : "The dock's changing hands, I hear. Everything does. The book doesn't."])));
    }
    if (s.talks % 2 === 0 && !s.cold) trust('sol', 1);
    Dlg.run(L);
  },
  play() {
    const s = this.S(); if (!talkEnergy(3)) return; s.played = true; remember('sol_played');
    Dlg.run([say('sol', "You want me to play it."), you("Once."), say('sol', "..."), narr('He unlocks the case. The trumpet is dull brass, a dent in the bell. He puts it to his mouth like a man picking up a phone he expects bad news on.'), narr('Four notes. Cracked, thin, exactly wrong. Then, on the fifth, something that is nearly music.'), say('sol', "That's it. That's all the wind I've got."), narr('He puts it back in the case. He does not lock the case.'), { fn: () => trust('sol', 2) }]);
  },
  endingLine() {
    const s = G.chars.sol; if (!s || !s.met) return null;
    const sold = (s.sold || []).filter(k => PAWNABLE.some(p => p[0] === k));
    if (sold.length) return { name: 'Sol', line: `Forty-one years of names in a ledger. Yours is in it now: ${sold.map(k => PAWNABLE.find(p => p[0] === k)[3].toLowerCase()).join(', ')}. He held them thirty days.`, bad: true };
    if (s.played) return { name: 'Sol Abramson', line: 'Forty-one years behind the cage. He played his son\'s trumpet once, for you, five notes. He did not lock the case afterward.' };
    if (s.stage >= 2) return { name: 'Sol', line: 'He showed you the ledger. Two names got a line through them this year: Reed and Ashby. He wrote yours in with no object next to it.' };
    return { name: 'Sol', line: 'The man behind the cage. You bought things. He wrote them down.' };
  }
};

// ---------- giving the gifts ----------
const Gifts = {
  item(who, key, label, fn) { if (!G.inv[key]) return null; return { t: label, do: () => { G.inv[key] = 0; remember('gift_' + key); fn(); } }; },
  amos(items) {
    const a = G.chars.amos;
    const t = this.item('amos', 'tools', 'Give him his tools', () => { a.tools = true; trust('amos', 4); G.flags.amosTools = true; Dlg.run([narr('You set the oak box on the cardboard, or the workbench, wherever he is. He knows it before he opens it. He knows it from the weight.'), say('amos', "..."), say('amos', "Sol kept them. That old crook kept them."), narr("He runs a thumb along the plane's sole the way other men touch a face."), say('amos', "I'm going to make you something. I don't know what. Something square.")]); });
    if (t) items.push(t);
    const h = this.item('amos', 'amosHeater', 'Give him the heater', () => { a.heater = true; trust('amos', 2); Dlg.run([say('amos', a.room ? "For the basement? It's got a boiler, but the boiler's got opinions. Thank you." : "Runs off what? ...The laundromat's got an outside outlet. Don't tell them."), narr('That night the alley glows faintly orange from the dumpster side.')]); });
    if (h) items.push(h);
  },
  mei(items) {
    const m = G.chars.mei;
    const t = this.item('mei', 'textbook', 'Give her the textbook', () => { m.textbook = true; trust('mei', 2); Dlg.run([say('mei', "Bridgman. Bridgman! Do you know what this costs? Don't tell me what this costs."), narr('She opens it on the counter and does not look up for the rest of your visit. Somebody has to ring up your bread. It is not her.')]); });
    if (t) items.push(t);
    const b = this.item('mei', 'busPass', 'Give her the bus pass', () => { m.busPass = true; trust('mei', 1); Dlg.run([say('mei', "A bus pass. To go where?"), you("The school. Go look at it before you decide."), say('mei', "...Saturday. Mom doesn't have to know it's Saturday.")]); });
    if (b) items.push(b);
  },
  walter(items) {
    const w = G.chars.walter;
    const r = this.item('walter', 'ruthWatch', "Give him Ruth's watch", () => { w.ruthWatch = true; trust('walter', 5); remember('walter_watch'); Dlg.run([narr('You put it on the bench between you. Small, gold-plated, ticking.'), say('walter', "..."), say('walter', "Where did you..."), you("Sol. He kept it wound."), say('walter', "Fourteen years. I couldn't go in. I walked past that window fourteen years and I couldn't go in."), narr('He does not put it on. He holds it against the inside of his wrist, where a pulse would be, and looks at the place the bus does not come from.'), say('walter', "It's still on her time. It's four minutes fast. She kept it four minutes fast so she'd never miss the 14.")]); });
    if (r) items.push(r);
    const c = this.item('walter', 'chessClock', 'Give him the chess clock', () => { w.chessClock = true; trust('walter', 2); Dlg.run([say('walter', "A clock! Now I can cheat on two fronts."), narr('He presses the lever and grins like a boy.')]); });
    if (c) items.push(c);
  },
  busker(items) { const s = this.item('busker', 'strings', 'Give him the strings', () => { G.flags.buskerStrings = true; G.flags.buskerTips = Math.max(G.flags.buskerTips || 0, 2); Dlg.run([say('busker', "Strings. Real ones. The E's been fishing line since March."), narr('He restrings it right there on the curb, tunes by ear, plays the first chord. It rings. Two people on the sidewalk stop.')]); }); if (s) items.push(s); },
  nora(items) { const s = this.item('nora', 'nurseShoes', 'Give her the clogs', () => { G.chars.nora.shoes = true; trust('nora', 2); Dlg.run([say('nora', "Size seven. How did you... Amos. Amos told you. That man notices feet."), say('nora', "Twelve hours a night, these are the difference between a bad night and a night. Thank you.")]); }); if (s) items.push(s); },
  nadia(items) { const s = this.item('nadia', 'frame', 'Give her the frame', () => { G.chars.nadia.frame = true; trust('nadia', 2); Dlg.run([narr("She takes the photo out from under the register: a man in an apron in front of the diner, 1971, squinting."), say('nadia', "Dad. He'd have hated a frame. He'd have said it was showing off."), narr("She hangs it over the pie case anyway, where the customers can see.")]); }); if (s) items.push(s); },
  granny(items) { const s = this.item('granny', 'gloves', 'Give her the gloves', () => { G.flags.grannyGloves = true; G.flags.grannyHelped = (G.flags.grannyHelped || 0) + 1; Dlg.run([say('granny', "Gloves! For me? Nobody's bought me gloves since Hector. Put them on me, my hands are full of oranges.")]); }); if (s) items.push(s); },
  sam(items) { const s = this.item('sam', 'checkers', 'Give him the checkers', () => { G.chars.nadia.checkers = true; trust('nadia', 1); Dlg.run([say('kid', "Checkers! Sit down. You're going to lose. That's not a threat, it's just true."), narr('You lose. It is not close. Nadia watches from the counter and does not wipe anything for a full minute.')]); }); if (s) items.push(s); },
  dog(items) { const s = this.item('dog', 'collar', 'Put the collar on him', () => { G.flags.dogCollar = true; G.flags.dogName = G.flags.collarTag || ''; Dlg.run([narr(`He holds still for it, which he does for nothing else. The tag says ${G.flags.collarTag ? '"' + G.flags.collarTag + '"' : 'nothing at all'}. He shakes once, like a dog who has been given a name, and looks up.`)]); }); if (s) items.push(s); },
};
// outfit notices
function outfitNotice(id) {
  if (!G.outfit) return null; const key = 'noticed_' + id + '_' + G.outfit; if (G.flags[key]) return null; G.flags[key] = true;
  const n = OUTFITS[G.outfit].name;
  const lines = {
    amos: { overcoat: "New coat. Good. You looked cold for a month.", suit: "A suit. Somebody die? ...Bad joke. Bad joke.", leather: "Leather. You look like trouble. It suits you, actually.", flannel: "Flannel. You look like you slept. Did you sleep?", shell: "Rain shell. Smart. About time one of us was smart.", cardigan: "Cardigan. You look like a librarian. I like librarians.", vpsuit: "That's not a second-hand suit. That's a suit somebody gave you. Who gives a man a suit?" },
    mei: { overcoat: "Big coat. Very dramatic. I'm drawing it.", suit: "Why are you dressed like a lawyer? Are you a lawyer now?", leather: "Okay, the jacket is cool. I'm not going to say it twice.", flannel: "Flannel. Cozy. You look like an ad for soup.", shell: "That's a good green. I'd draw that green.", cardigan: "You look like my art teacher. That's a compliment. Mostly.", vpsuit: "That suit costs more than the register. Don't lean on the counter in it." },
    nora: { overcoat: "Warm coat. Finally. I was going to steal you a blanket.", suit: "A suit. You look like you're going to sell me something or bury me.", leather: "Leather jacket. Okay. Okay! Twelve-hour shift and I get to see that. Worth it.", flannel: "Flannel. You look human. It's nice.", shell: "Good. Hood up. Your chest will thank you.", cardigan: "Cardigan. Cute. Nurse's honest opinion: cute.", vpsuit: "The suit again. You wear it like it's wearing you. Sorry. Long shift." },
    nadia: { overcoat: "Nice coat. Sit anywhere. Don't get soup on it.", suit: "A suit, in my diner. Sam, look, a suit.", leather: "Leather. Sam's going to want one now. Thanks.", flannel: "Flannel. You look like a regular. You are a regular.", shell: "Sensible. Somebody's been listening to Nora.", cardigan: "Walter had one just like that. He'd say so.", vpsuit: "A real suit. Sam, don't touch the suit. ...You can take it off in here, you know. Nobody's watching." },
  }[id];
  return lines && lines[G.outfit] ? say(id, lines[G.outfit]) : null;
}
// wardrobe at home
function wardrobeMenu() {
  const items = [];
  const wear = (k) => { G.outfit = k; clearPortrait('you'); UI.toast(k ? OUTFITS[k].name : G.flags.manager ? 'collar and tie' : 'old clothes', '#c8ccd8'); };
  items.push({ t: G.flags.vp || G.flags.manager ? 'Work clothes' : 'Your old clothes', r: () => G.outfit ? '' : 'wearing', do: () => wear(null) });
  for (const k in (G.wardrobe || {})) if (OUTFITS[k]) items.push({ t: OUTFITS[k].name, r: () => G.outfit === k ? 'wearing' : '', do: () => wear(k) });
  items.push({ t: 'Close', do: () => { } });
  Menu.open('Wardrobe', items, { sub: Object.keys(G.wardrobe || {}).length ? '' : 'A hook on the back of the door. One coat.' });
}
// HUD clock (wristwatch)
function clockText() { const mins = 6 * 60 + Math.round(G.tod * 17 * 60); const h = Math.floor(mins / 60) % 24, m = mins % 60; const hh = ((h + 11) % 12) + 1; return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; }
