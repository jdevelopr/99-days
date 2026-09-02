// ============================================================
// story A: helpers, Amos, Mei
// ============================================================
const say = (who, text) => ({ say: who, text });
const narr = text => ({ say: 'narrator', text });
const you = text => ({ say: 'you', text });
const choice = (...opts) => ({ choice: opts });
const wait = n => ({ wait: n });
const C = id => G.chars[id];

function addMoney(n) { G.money += n; UI.toast((n >= 0 ? '+$' : '-$') + Math.abs(n), n >= 0 ? '#e8c84a' : '#e88a6a'); if (n > 0) Audio.coin(); }
function spend(n) { if (G.money < n) return false; addMoney(-n); return true; }
function addHunger(n) { G.hunger = clamp(G.hunger + n, 0, 100); if (n > 0) { UI.toast('ate  +' + n, '#c8a06a'); Audio.eat(); } }
function useEnergy(n) { G.energy = clamp(G.energy - n, 0, G.maxEnergy); G.tod = 1 - G.energy / G.maxEnergy; }
const TALK_COST = 4;
// talking costs energy; refuse when there is none left
function talkEnergy(n) { n = n || TALK_COST; if (G.energy < n) { UI.toast('Too tired to talk. Sleep.', '#8ab0d8'); Audio.bad(); return false; } useEnergy(n); return true; }
function trust(id, n) { const c = C(id); c.trust += n; if (n > 0) { UI.toast(`${SPEAKERS[id].name} +`, '#8ae88a'); } else UI.toast(`${SPEAKERS[id].name} -`, '#e86a6a'); }
function remember(text) { if (!G.memories.includes(text)) G.memories.push(text); }
const FOOD = { bread: { name: 'bread', price: 5, hunger: 25 }, soup: { name: 'canned soup', price: 9, hunger: 45 }, rice: { name: 'rice & beans', price: 16, hunger: 70 } };
function hasFood() { return G.inv.bread + G.inv.soup + G.inv.rice > 0; }

// generic give-food menu; cb(item) when given
function giveFoodMenu(who, cb) {
  const items = [];
  for (const k in FOOD) items.push({ t: FOOD[k].name, r: () => 'x' + G.inv[k], hide: () => !G.inv[k], do: () => { G.inv[k]--; cb(k); } });
  if (!items.some(i => !i.hide())) { UI.toast('You have no food to give.', '#e86a6a'); Audio.bad(); return false; }
  items.push({ t: 'Never mind', do: () => { } });
  Menu.open(`Give food to ${SPEAKERS[who].name}`, items);
  return true;
}
function giveMoneyMenu(who, cb) {
  const amounts = [1, 5, 10, 20];
  const items = amounts.map(a => ({ t: `$${a}`, disabled: () => G.money < a, do: () => { addMoney(-a); cb(a); } }));
  items.push({ t: 'Never mind', do: () => { } });
  Menu.open(`Give money to ${SPEAKERS[who].name}`, items, { sub: `You have $${G.money}.` });
}

// ============================================================
// AMOS
// ============================================================
const Amos = {
  init() { return { stage: 0, trust: 0, fed: 0, cash: 0, met: false, sick: false, gone: false, dead: false, coat: false, id: false, job: null, room: false, spec: 'amos0', lastFed: 0, lastTalk: 0, jobDay: 0, told: false, bird: false, portrait: false, talked: 0 }; },
  present() { const a = C('amos'); return !a.gone && !a.dead; },
  where() { // returns {scene, x, sit, spec}
    const a = C('amos'); if (!this.present()) return null;
    if (a.job === 'dock' && G.tod < 0.62 && G.scene !== 'dock') return { scene: 'dock', x: 200, sit: false };
    if (a.job === 'dock' && G.tod < 0.62) return { scene: 'dock', x: 200, sit: false };
    if (a.job === 'diner' && G.tod < 0.8) return { scene: 'diner', x: 400, sit: false };
    if (a.room) return G.tod > 0.55 ? { scene: 'basement', x: 292, sit: false } : { scene: 'street', x: STREET.spots.river - 40, sit: true };
    return { scene: 'street', x: STREET.spots.amos, sit: true };
  },
  bubble() { const a = C('amos'); if (a.sick) return 'cough'; if (!a.coat && G.rain > 0.5 && G.tod > 0.6 && a.stage < 3) return 'cough'; return null; },
  daily() {
    const a = C('amos'); if (!this.present()) return;
    // neglect / sickness
    if (a.stage < 3 && !a.coat) {
      if (G.day >= 12 && a.fed === 0 && !a.sick) { a.sick = true; a.spec = 'amosSick'; a.sickDay = G.day; }
      if (G.day >= 16 && a.fed <= 1 && !a.sick && G.day - a.lastFed > 8) { a.sick = true; a.spec = 'amosSick'; a.sickDay = G.day; }
      if (a.sick && G.day - a.sickDay >= 7) { a.gone = true; a.dead = true; a.goneDay = G.day; G.flags.amosGone = true; G.pendingStreet = 'amosGone'; return; }
    }
    if (a.stage >= 3 && a.stage < 4 && a.sick) { a.sick = false; a.spec = 'amos3'; }
    if (a.job && !a.room && G.day - a.jobDay >= 12) { a.room = true; a.stage = 5; G.pendingStreet = 'amosRoom'; }
  },
  menu() {
    const a = C('amos');
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }];
    if (!a.room) items.push({ t: 'Give food', do: () => giveFoodMenu('amos', k => this.gaveFood(k)) });
    if (!a.room) items.push({ t: 'Give money', do: () => giveMoneyMenu('amos', n => this.gaveMoney(n)) });
    if (G.inv.coat && !a.coat) items.push({ t: 'Give him the coat', do: () => { G.inv.coat = 0; this.buyCoat(); } });
    if (a.sick && a.stage >= 1) items.push({ t: 'Take him to the clinic', r: '$35', disabled: () => G.money < 35, do: () => this.clinic() });
    if (C('nadia').stage >= 2 && !G.flags.dinerClosed && !G.flags.toldAmosDiner && a.stage >= 1) items.push({ t: "Mention Nadia's diner", do: () => this.tellDiner() });
    { const ci = a.met ? Theo.clueItem('amos') : null; if (ci) items.push(ci); }
    Gifts.amos(items);
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(a.met ? 'Amos' : 'The man by the stoop', items);
  },
  gaveFood(k) {
    const a = C('amos'); a.fed++; a.lastFed = G.day; useEnergy(3); markTalked();
    if (a.sick) { a.sickFed = (a.sickFed || 0) + 1; if (a.sickFed >= 4) { a.sick = false; a.spec = a.coat ? 'amos2' : 'amos1'; clearPortrait('amos'); UI.toast('Amos is looking better.', '#8ae88a'); } }
    trust('amos', 1); remember('amos_food');
    const lines = [];
    if (a.fed === 1) lines.push(narr(`You hold out the ${FOOD[k].name}. He looks at it a long moment, like it might be a trick.`), say('amos', "...Huh. Alright. Thank you."), narr('He eats slowly, with his back to the wind.'));
    else if (a.fed === 2) lines.push(say('amos', "You again. You don't have to keep doing this, you know."), you("I know."), say('amos', "Well. Thank you."));
    else if (a.fed === 3 && !a.met) lines.push(say('amos', "Hey. Name's Amos. Figured you should know who you're feeding."), you("Amos. Okay."), { fn: () => { a.met = true; clearPortrait('amos'); } });
    else if (a.sick) lines.push(say('amos', "*cough* ...appreciate it. Can't seem to shake this."), narr("His hands are shaking. It's not just the cold."));
    else lines.push(pick([say('amos', "Bless you. Sit a minute if you want."), say('amos', "Still warm. You didn't have to."), say('amos', "You eat too, yeah? You look worse than me some days."), say('amos', "Thank you, friend.")]));
    Dlg.run(lines);
  },
  gaveMoney(n) {
    const a = C('amos'); a.cash += n; a.lastFed = G.day; markTalked(); if (n >= 3) a.fed++; trust('amos', n >= 5 ? 1 : 0); useEnergy(1); remember('amos_money');
    Dlg.run([n >= 10 ? say('amos', "That's... that's a lot. You sure?") : say('amos', "Thank you. Every bit."), n >= 10 ? you("I'm sure.") : null]);
  },
  clinic() {
    const a = C('amos'); if (!spend(35)) return; a.sick = false; a.spec = a.coat ? 'amos2' : 'amos1'; clearPortrait('amos'); useEnergy(15); trust('amos', 3); remember('amos_clinic');
    Dlg.run([narr('You walk him to the clinic. It takes a long time. He stops twice to cough.'), say('doctor', "Bronchitis, on its way to pneumonia. Another week out there and we'd be having a different conversation."), say('doctor', "Antibiotics. Keep him dry if you can."), narr('You pay at the desk. Amos watches you do it and says nothing.'), say('amos', "...I'll pay you back."), you("No, you won't. It's fine."), say('amos', "Then I'll owe you. That's different.")]);
  },
  tellDiner() {
    G.flags.toldAmosDiner = true; C('nadia').customers = (C('nadia').customers || 0) + 1;
    Dlg.run([you("Nadia's, down the block. If you ever have a couple dollars, the soup's good. She's decent."), say('amos', "Nadia's. I remember when that place had a line out the door."), say('amos', "Maybe I'll go in. Been a while since I sat somewhere with a roof.")]);
  },
  talk() {
    const a = C('amos'); if (!talkEnergy()) return; a.talked++; a.lastTalk = G.day;
    const L = [];
    if (a.gone) return;
    if (a.pawnedGift && !a.pawnTalked) { a.pawnTalked = true; Dlg.run([say('amos', "Sol's got a bird in his window. Oak. Rough wings."), say('amos', "I'm not going to ask. I'm going to stand here and not ask, and you're going to know I'm not asking."), narr('He does not say anything else that day.')]); return; }
    if (a.cutByYou && !a.cutTalked) { a.cutTalked = true; Dlg.run([say('amos', "You cut me."), say('amos', "You sat in that office and you put your initials next to my name. I saw the sheet. Danny showed me the sheet."), you("The owner wanted-"), say('amos', "I know what the owner wanted. I've known what owners want for twenty-two years. I wanted to know what you wanted. Now I do."), narr('He does not take the food you are holding. He does not look at it.')]); return; }
    // stage progression
    if (a.stage === 0) {
      if (a.fed === 0 && a.talked === 1) L.push(narr('A man sits on flattened cardboard under the awning, a blanket over his knees. He does not look up right away.'), say('amos', "Spare anything? Food, change. Anything."),
        choice({ t: 'Give him something', do: () => { if (hasFood()) return [{ fn: () => giveFoodMenu('amos', k => this.gaveFood(k)) }]; else if (G.money >= 1) return [{ fn: () => giveMoneyMenu('amos', n => this.gaveMoney(n)) }]; else return [you("I... don't have anything. I'm sorry."), say('amos', "Yeah. Nobody does.")]; } },
          { t: "Sorry, not today.", do: () => [say('amos', "Sure. Tomorrow, maybe."), narr('He goes back to watching the rain.')] },
          { t: 'Walk past without answering', do: () => { a.trust--; return [narr("You keep walking. He doesn't call after you.")]; } }));
      else if (a.fed === 0) L.push(say('amos', fresh('amos', ["Cold one today.", "Spare anything?", "You live up there? Four-twelve? I see you come and go."])));
      else if (a.fed < 3) L.push(say('amos', fresh('amos', ["Slow day. They're all slow days.", "That building's got a leak on the third floor. Been there since March. Nobody fixes anything.", "You work? You've got that walk. The going-to-work walk."])));
      if (a.fed >= 3 && a.met) { a.stage = 1; }
    }
    if (a.stage === 1 && L.length === 0) {
      if (a.trust >= 3 && !a.story1) {
        a.story1 = true;
        L.push(say('amos', "I was a carpenter. Twenty-two years. Framing, finish work, cabinets. My hands used to be worth something."), say('amos', "Fell off a roof in Millbrook. Two vertebrae. Company said I wasn't on the clock. Lawyer said it'd take years."), say('amos', "Rent doesn't take years."), you("I'm sorry."), say('amos', "Don't be. I'm telling you because you keep showing up. Figured you'd want to know who you're feeding."), { fn: () => { trust('amos', 1); remember('amos_story'); } });
      } else L.push(say('amos', fresh('amos', ["The cold gets in the joints. That's the real thing about winter. It gets in the joints.", "Mrs. Ortega from the third floor brings me coffee Sundays. Good woman. Terrible coffee.", "You look tired. You sleeping?", "Ever notice how nobody looks up? Whole street walks around looking at the ground."])));
      if (a.trust >= 5 && a.fed >= 4) a.stage = 2;
    }
    if (a.stage === 2 && L.length === 0) {
      if (!a.told) {
        L.push(say('amos', "Can I ask you something? Why do you do this? Nobody does this."),
          choice({ t: "I'm dying. Ninety-nine days, they said.", do: () => { a.told = true; trust('amos', 2); remember('amos_told'); return [narr('You say it plainly. It is the first time you have said it out loud to anyone who was not paid to hear it.'), say('amos', "..."), say('amos', "Well. Hell."), say('amos', "That's not an answer, you know. Plenty of dying people walk right past me."), you("I don't know. It felt like the only thing that made the days different from each other."), say('amos', "Yeah. I know that feeling exactly.")]; } },
            { t: "Because I can.", do: () => { a.told = true; trust('amos', 1); return [say('amos', "Plenty of people can."), you("I guess I'm not plenty of people."), say('amos', "No. Guess not.")]; } },
            { t: "I don't want to talk about it.", do: () => { a.told = true; return [say('amos', "Fair enough. I've got a few of those too.")]; } }));
      } else if (!a.coat && !a.askedCoat && a.fed >= 6) { a.askedCoat = true; L.push(say('amos', "This coat's done. See that? Whole seam's gone. The rain just comes right in."), say('amos', "Lin's has a rack in the back. Work coats. Forty-five bucks. Might as well be forty-five hundred."), narr("You could buy a coat at Lin's Market.")); G.flags.coatAvailable = true; }
      else if (!a.coat) L.push(say('amos', fresh('amos', ["Cold. That's all. Just cold.", "Lin's. Forty-five. I'm not asking. I'm just saying."])));
      else if (a.coat && !a.story2) { a.story2 = true; L.push(say('amos', "This coat. I slept last night. Actually slept. First time since... I don't know."), say('amos', "There's a thing I need. An ID. Mine got stolen with my bag last year. Can't get work without it, can't get a bed at the shelter without it."), say('amos', "Twenty-five dollars at the county office. And somebody to vouch that I exist."), narr("You could pay for his ID.")); G.flags.idAvailable = true; }
      else if (a.coat && !a.id) L.push({ fn: () => Menu.open('The ID', [{ t: 'Pay the $25 and go with him', disabled: () => G.money < 25, do: () => this.getId() }, { t: 'Not today', do: () => { } }], { sub: 'A morning at the county office. It will take most of your energy.' }) });
      if (a.id) a.stage = 3;
    }
    if (a.stage === 3 && L.length === 0) {
      if (!a.story3) { a.story3 = true; L.push(say('amos', "Shaved. Mrs. Lin let me use the sink in the back. Said I looked like a serial killer before."), say('amos', "With the ID I can get on the list at the shelter. But what I need is work. Any work."), say('amos', "The freight dock hires day labor. Foreman's a hard case, but he's fair. If somebody put in a word..."), narr("If you've worked at the dock, you could talk to the foreman about Amos."), { fn: () => { G.flags.amosWantsJob = true; } }); }
      else L.push(say('amos', fresh('amos', ["Any luck at the dock?", "Went to the library today. Sat in a chair for four hours. Nobody asked me to leave.", "I keep thinking about cabinets. Dovetail joints. Stupid thing to miss."])));
    }
    if (a.stage === 4 && L.length === 0) {
      if (!a.story4) { a.story4 = true; L.push(a.job === 'diner' ? say('amos', "Nadia's got me on dishes and prep. Says I'm the only one who shows up on time.") : say('amos', "Foreman put me on the dock. Six to two. My back screams, but it's a paycheck."), say('amos', "First one in three years. I held it for a while before I cashed it."), say('amos', "You did that. Don't argue.")); }
      else if (G.flags.manager && !a.managerNoted) { a.managerNoted = true; L.push(say('amos', "Shift lead. I heard. The foreman calls you 'the office' now."), say('amos', "I'm not going to say anything about it. I'm going to say: I see you at a quarter to six and I don't see you again till dark, and I know what that is, because I did it for twenty-two years."), say('amos', "Just make sure the number's for something. That's all.")); }
      else L.push(say('amos', fresh('amos', ["Saving up. Super says there's a basement unit coming free. Basement's still a door that locks.", "Paid Mrs. Ortega back for a year of coffee. She cried. Terrible coffee.", "How are you holding up? Really.", "I saw you coughing yesterday. Don't think I don't notice."])));
    }
    if (a.stage === 5 && L.length === 0) {
      if (!a.bird) { a.bird = true; G.inv.bird = 1; remember('amos_bird'); L.push(say('amos', "Got the room. Basement of your building, if you can believe it. We're neighbors."), say('amos', "Here. I made this. Found some scrap oak behind the dock."), narr('A small carved bird. The wings are rough, the head is perfect. It sits in your palm like it weighs nothing.'), say('amos', "First thing I've made in three years. I wanted you to have the first thing."), you("Amos..."), say('amos', "Don't. Just take it.")); }
      else if (G.scene === 'basement') L.push(say('amos', fresh('amos', ["Boiler kicks on at five. You get used to it. I like it, actually. Something in the building that works.", "Super gave me the scrap pile behind the dock. I'm making a shelf. I've got nothing to put on it. That's not the point.", "Sit. That's what the chair's for. I stand; I've been standing for three years, it's a hard habit.", "You know what a door that locks does to a man? It lets him sleep with both eyes. Both.", "Mrs. Ortega brought a plant down. It's dying. Everything dies down here, there's no window. I'm keeping it anyway."])));
      else L.push(say('amos', fresh('amos', ["Come by the basement sometime. I've got a chair now. One chair. It's yours if you visit.", "Nadia's kid beat me at checkers. Twice.", "I sit by the river some mornings now. It's a good spot. You should come.", "You look thin. Are you eating? Let me buy you something for once."])));
    }
    if (L.length === 0) L.push(say('amos', "..."));
    { const on = outfitNotice('amos'); if (on) L.unshift(on); }
    Dlg.run(L);
  },
  buyCoat() {
    const a = C('amos'); a.coat = true; a.spec = a.sick ? 'amosSick' : 'amos2'; clearPortrait('amos'); trust('amos', 3); remember('amos_coat');
    Dlg.run([narr('You hand him the coat. Navy canvas, lined, stiff with newness.'), say('amos', "..."), narr('He puts it on right there in the rain and stands for a moment with his eyes closed.'), say('amos', "I'm not going to cry in front of you. I want that on record."), you("Noted.")]);
  },
  getId() {
    if (!spend(25)) return; const a = C('amos'); a.id = true; a.stage = 3; a.spec = 'amos3'; clearPortrait('amos'); useEnergy(30); trust('amos', 3); remember('amos_id');
    Dlg.run([narr('The county office smells like carpet and old radiators. You wait two hours. Amos fills out forms with a pen chained to the desk.'), say('amos', "They wanted proof of address. I said the corner of Harlan and 4th. The lady laughed, then she stopped laughing, then she stamped it."), narr('He holds the card up to the fluorescent light and reads his own name off it.'), say('amos', "Amos Delacroix Reed. That's me. Apparently.")]);
  },
  hireAtDock() { const a = C('amos'); a.job = 'dock'; a.jobDay = G.day; a.stage = 4; a.spec = 'amos4'; clearPortrait('amos'); remember('amos_job'); },
  hireAtDiner() { const a = C('amos'); a.job = 'diner'; a.jobDay = G.day; a.stage = 4; a.spec = 'amos5'; clearPortrait('amos'); remember('amos_job_diner'); },
};

// ============================================================
// MEI
// ============================================================
const Mei = {
  init() { return { stage: 0, trust: 0, met: false, purchases: 0, talked: 0, sketch: false, pushed: 0, cold: false, applied: false, missed: false, accepted: false, fee: 0, spec: 'mei', portraitDone: false }; },
  menu() {
    const m = C('mei');
    const items = [{ t: 'Buy food', do: () => Shop.open() }, { t: 'Talk', r: '-4 energy', do: () => this.talk() }];
    if (G.flags.deliveryAvailable) items.push({ t: 'Run deliveries', r: '-25 energy', disabled: () => G.energy < 18, do: () => startMinigame('delivery', (pay, lines) => { useEnergy(25); addHunger(-10); G.deliveries++; addMoney(pay); if (m.stage === 0 && !m.met) { m.met = true; clearPortrait('mei'); } Dlg.run([narr(lines.join('. ') + '.'), say('mei', pay >= 12 ? "Fast. Mom says you can have a route whenever." : pay >= 6 ? "Cool. Same time tomorrow?" : "You okay? You look like the packages won.")]); }) });
    if (G.flags.coatAvailable && !C('amos').coat) items.push({ t: 'Buy a work coat', r: '$45', disabled: () => G.money < 45, do: () => { if (spend(45)) { G.inv.coat = 1; UI.toast('Got a coat for Amos.', '#8ae88a'); } } });
    if (G.flags.radioAvailable && !G.inv.radioParts && !C('walter').radio) items.push({ t: 'Buy radio parts', r: '$10', disabled: () => G.money < 10, do: () => { if (spend(10)) { G.inv.radioParts = 1; UI.toast('Radio parts.', '#8ae88a'); } } });
    if (G.flags.signAvailable && !G.inv.signParts && !G.flags.signFixed) items.push({ t: 'Buy neon transformer', r: '$22', disabled: () => G.money < 22, do: () => { if (spend(22)) { G.inv.signParts = 1; UI.toast('Sign parts.', '#8ae88a'); } } });
    Gifts.mei(items);
    if (m.stage >= 1 && !m.sketch && !m.cold) items.push({ t: 'Buy her a sketchbook', r: '$14', disabled: () => G.money < 14, do: () => this.sketchbook() });
    if (m.stage >= 2 && !m.applied && !m.missed && !m.cold && G.day <= 50) items.push({ t: 'Pay her application fee', r: `$${this.feeNeeded()}`, disabled: () => G.money < this.feeNeeded(), do: () => this.payFee() });
    if (C('nadia').stage >= 2 && !G.flags.dinerClosed && !G.flags.toldMeiDiner && m.stage >= 1) items.push({ t: "Mention Nadia's diner", do: () => { G.flags.toldMeiDiner = true; C('nadia').customers = (C('nadia').customers || 0) + 1; Dlg.run([you("Nadia's is trying to stay open. If your mom ever wants a night off from cooking..."), say('mei', "Mom hasn't taken a night off since 2019. But... yeah. I'll tell her. She likes pie.")]); } });
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(m.met ? 'Mei' : 'The girl at the counter', items);
  },
  feeNeeded() { return C('mei').trust >= 6 ? 40 : 75; },
  bought() { const m = C('mei'); m.purchases++; if (m.purchases >= 3 && m.stage === 0 && m.talked >= 1) m.stage = 1; },
  sketchbook() {
    if (!spend(14)) return; const m = C('mei'); m.sketch = true; trust('mei', 2); remember('mei_sketch'); useEnergy(2);
    Dlg.run([narr('You put the sketchbook on the counter and slide it toward her. Heavy paper. The good kind.'), say('mei', "That's... I can't take that."), you("It's already paid for. I'd have to return it, and I don't have the receipt."), say('mei', "You literally just bought it. I was here."), narr('She opens it and runs her thumb down the first blank page.'), say('mei', "...Okay. Thank you. Seriously.")]);
  },
  payFee() {
    const need = this.feeNeeded(); if (!spend(need)) return; const m = C('mei'); m.applied = true; m.fee = need; trust('mei', 3); remember('mei_fee'); useEnergy(2);
    Dlg.run([need === 40 ? say('mei', "I saved forty. I was going to give up on the rest.") : narr('You count out seventy-five dollars in small bills on the counter.'), say('mei', "This is the fee. You know that, right? This is the whole fee."), you("Send it."), say('mei', "Mom's going to kill me."), you("Send it tonight. Before she can."), narr("She looks at the money, then at the door to the back room, then at you."), say('mei', "Okay. Okay. I'm doing it.")]);
  },
  talk() {
    const m = C('mei'); if (!talkEnergy()) return; m.talked++; const L = [];
    if (m.cold) { L.push(say('mei', fresh('mei', ["Are you buying something?", "Bread's five.", "..."]))); Dlg.run(L); return; }
    if (m.pawnedGift && !m.pawnTalked) { m.pawnTalked = true; Dlg.run([say('mei', "Sol's has a drawing in the window. Fifteen dollars. It's of you."), say('mei', "I'm not mad. I drew it, it's yours, you can do what you want with a thing that's yours."), narr('She does not take the sketchbook out while you are there.')]); return; }
    { const on = outfitNotice('mei'); if (on) L.push(on); }
    if (m.stage === 0) {
      if (m.talked === 1) L.push(narr('A teenager behind the counter, earbuds in, one hand hidden below the register. A sketchbook, maybe.'), say('mei', "You buying? Bread's five. Soup's nine."), { fn: () => { m.met = true; clearPortrait('mei'); } });
      else L.push(say('mei', fresh('mei', ["Mom's in the back. If you need the bathroom it's staff only. Sorry.", "It's been raining for like nine days. I checked.", "Yeah, the awning leaks. Everyone tells us."])));
      if (m.purchases >= 3 && m.talked >= 2) m.stage = 1;
    }
    else if (m.stage === 1) {
      if (!m.seen) {
        L.push(narr('She is drawing again. Quick, sure lines. She flips the book face-down when she sees you looking.'),
          choice({ t: "Can I see?", do: () => { m.seen = true; trust('mei', 2); remember('mei_seen'); return [say('mei', "It's nothing. It's just the street."), narr('She turns it around. It is the street: the awning, the puddles, the lamp outside. ' + (Amos.present() ? 'And Amos, on his cardboard, drawn with more care than anything else on the page.' : 'Drawn like someone who has looked at it for a long time.')), you("This is really good."), say('mei', "It's fine. I do it when it's slow. Which is always."), say('mei', "I'm Mei, by the way. Since you're apparently going to keep coming in.")]; } },
            { t: "None of my business.", do: () => { m.seen = true; return [say('mei', "Cool. Bread's five.")]; } }));
      } else if (!m.story1) { m.story1 = true; L.push(say('mei', "There's a program. Illustration. At the state school. Applications close in six weeks."), say('mei', "Seventy-five bucks to apply. Then a portfolio. Then, if they take you, a whole thing about money that I haven't figured out."), say('mei', "Mom needs me here. She says that a lot. She's not wrong."),
        choice({ t: "You should apply.", do: () => { trust('mei', 2); m.stage = 2; return [say('mei', "Easy for you to say."), you("It is. That's why I'm saying it."), say('mei', "...I'll think about it.")]; } },
          { t: "Your mom does need you.", do: () => { m.pushed++; trust('mei', -2); return [say('mei', "Yeah. I know. That's what I said."), narr('She puts the sketchbook away and does not take it out again while you are there.')]; } },
          { t: "Drawing's not a real job.", do: () => { m.pushed += 2; trust('mei', -4); return [say('mei', "..."), say('mei', "Right. Bread's five."), narr('Something closes behind her eyes.')]; } }));
      } else { L.push(say('mei', fresh('mei', ["Still thinking about it.", "Mom found the brochure. We didn't talk for two days.", "I drew the lamp outside forty times. It's never right."]))); if (m.trust >= 3 && !m.pushed) m.stage = 2; }
    }
    else if (m.stage === 2) {
      if (m.sketch && !m.sketchStory) { m.sketchStory = true; L.push(say('mei', "I filled six pages in the new book already. Look."), narr("She turns it around. It's you. Standing at the counter with your hands in your coat pockets, drawn from memory."), say('mei', "You always stand like that. Like you're waiting for a bus."), you("Do I?"), say('mei', "It's a good stand. It's got shape."), { fn: () => { m.portraitDone = true; G.inv.drawing = 1; remember('mei_portrait'); trust('mei', 1); } }); }
      else if (G.day > 50 && !m.applied && !m.missed) { m.missed = true; L.push(say('mei', "Deadline was Friday."), you("Did you..."), say('mei', "No. Mom needed the seventy-five for the cooler repair. It's fine. Next year, maybe."), narr('Neither of you says anything for a while.'), { fn: () => remember('mei_missed') }); }
      else if (m.applied && !m.appliedStory) { m.appliedStory = true; L.push(say('mei', "I sent it. Portfolio and everything. Twelve pieces."), say('mei', "I put the one of Amos in. And the one of you. Hope that's okay."), you("It's okay.")); }
      else L.push(say('mei', fresh('mei', ["Seventy-five bucks. I've got nineteen.", "Mom says if I go she'll have to hire someone. Then she says she can't afford to hire someone. Then she goes in the back.", "I drew the diner sign last night. The flicker's kind of beautiful, actually. Don't tell Nadia.", "You look tired. Do you want the day-old? I'm supposed to throw it out."])));
      if (m.applied && m.appliedStory) m.stage = 3;
    }
    else if (m.stage === 3) {
      if (G.day >= 84 && !m.accepted) { m.accepted = true; m.stage = 4; m.spec = 'meiEnd'; clearPortrait('mei'); remember('mei_accepted'); L.push(say('mei', "It came."), narr('She has the envelope in both hands like it might blow away.'), say('mei', "I got in. With a grant. Half. Mom read it four times and then she went in the back and I heard her laughing. Laughing."), say('mei', "I wouldn't have sent it. You know that, right? I would've let it go."), you("You'd have sent it eventually."), say('mei', "No. I really wouldn't have."), narr("She comes around the counter and hugs you, quick and hard, and then goes back behind it like nothing happened."), say('mei', "Bread's still five.")); }
      else L.push(say('mei', fresh('mei', ["Nothing yet. They said eight to ten weeks.", "I check the mail before Mom does. Every day.", "I drew you again. You're getting thinner. I don't like it.", "Amos said you're the reason he's got a coat. Is that true?"])));
    }
    else if (m.stage === 4) L.push(say('mei', fresh('mei', ["Orientation is in August. I'm going to take the bus. The real bus, not Walter's ghost bus.", "Mom hired a kid from 7th. He's terrible. She loves him.", "I'm going to draw you one more time. Properly. Sit still next time you're in.", "Thank you. I know I keep saying it. I'm going to keep saying it."])));
    if (L.length === 0) L.push(say('mei', "Bread's five."));
    if (m.pushed >= 3 && !m.cold) { m.cold = true; remember('mei_cold'); }
    Dlg.run(L);
  }
};
