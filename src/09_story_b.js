// ============================================================
// story B: Walter, Nadia, minor kindnesses, doctor, ending
// ============================================================
const Walter = {
  init() { return { stage: 0, trust: 0, met: false, sat: 0, talked: 0, radio: false, chess: false, river: false, dead: false, deadDay: 0, learned: null, gaveSet: false, spec: 'walter', lastSat: 0, deathDay: 68 + irnd(0, 5) }; },
  present() { const w = C('walter'); return !w.dead && G.tod < 0.86 && G.tod > 0.03 && G.day % 7 !== 0; },   // Sundays he takes the long way to Ruth
  daily() {
    const w = C('walter');
    if (!w.dead && G.day >= w.deathDay) { w.dead = true; w.deadDay = G.day; G.pendingStreet = 'walterGone'; }
  },
  menu() {
    const w = C('walter');
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }, { t: 'Sit with him a while', r: 'energy', do: () => this.sit() }];
    if (G.inv.radioParts && !w.radio) items.push({ t: 'Fix his radio', do: () => this.fixRadio() });
    Gifts.walter(items);
    if (w.stage >= 3 && !w.river) items.push({ t: 'Walk with him to the river', r: 'energy', do: () => this.riverWalk() });
    if (C('nadia').stage >= 2 && !G.flags.dinerClosed && !G.flags.toldWalterDiner && w.met) items.push({ t: "Mention Nadia's diner", do: () => { G.flags.toldWalterDiner = true; C('nadia').customers = (C('nadia').customers || 0) + 1; Dlg.run([you("Nadia's does a decent coffee. Better than waiting in the rain."), say('walter', "Ruth and I had our anniversary there. 1988. The pie was terrible and we went back every year."), say('walter', "I'll go in. For the terrible pie.")]); } });
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(w.met ? 'Walter' : 'The old man on the bench', items);
  },
  sit() {
    const w = C('walter'); w.sat++; w.lastSat = G.day; useEnergy(6); markTalked(); trust('walter', 1); remember('walter_sat');
    const L = [];
    const talks = [
      [say('walter', "The 14 used to come every twelve minutes. You could set a watch. Ruth did, actually. She had a watch she'd set by it."), say('walter', "They cut the route in March. I know that. I'm not senile."), say('walter', "I just like the waiting. Is that strange?"), you("No.")],
      [say('walter', "Forty-one years I set type at the Herald. Real type, then the machines, then a computer with a screen the size of a dinner plate."), say('walter', "When they shut it down they gave me a clock. I've got seven clocks. What am I going to do with a clock.")],
      [say('walter', "Ruth's at St. Bartholomew's. The cemetery, not the church. She'd have liked that I still visit. She'd have hated that I'm not eating properly."), say('walter', "You don't eat properly either. I can see your wrists.")],
      [say('walter', "I'm not afraid of dying. I'm afraid of the part just before. The part where you know and nobody's there."), narr('The rain ticks on the bus shelter roof.'), say('walter', "That's a grim thing to say to a stranger. Sorry."), you("I'm not a stranger."), say('walter', "No. I suppose you're not, anymore.")],
      [say('walter', "This whole block was mills, once. My father worked the one where the warehouse is. Twelve-hour shifts and he still came home and built us a treehouse."), say('walter', "People had less and did more. Or maybe I just remember it that way.")],
      [say('walter', "Ruth and I fought about everything. Money, the thermostat, whose turn it was to call her mother. Fought like cats."), say('walter', "I'd give anything to fight with her about the thermostat one more time. Anything.")],
      [say('walter', "You've got a cough. I notice these things. Typesetter's ear, I hear everything."), you("It's nothing."), say('walter', "It's not nothing. But I'll let you have it.")],
      [say('walter', "Sit. Don't say anything. Sometimes that's the whole thing, you know. Just the two of us and the rain.")],
    ];
    const idx = Math.min(w.sat - 1, talks.length - 1);
    L.push(...(w.sat <= talks.length ? talks[idx] : pick(talks.slice(4))));
    if (!w.met) { L.unshift(narr('You sit down at the other end of the bench. He nods, once, as if this had been arranged.')); L.push(say('walter', "Walter. Walter Ashby."), { fn: () => { w.met = true; clearPortrait('walter'); } }); }
    if (w.sat === 2 && !w.radio && !G.flags.radioAvailable) { L.push(say('walter', "My radio died. Little transistor. Ruth gave it to me in '79. Lin's might have the part, a capacitor or something. I never learned that side of things."), { fn: () => { G.flags.radioAvailable = true; } }); }
    if (w.sat >= 4 && !w.chess) { L.push(say('walter', "Do you play chess?"), you("Badly."), say('walter', "Good. I only ever beat Ruth by cheating and she knew it. Next time you sit, I'll bring the board.")); w.chess = true; w.stage = Math.max(w.stage, 2); remember('walter_chess'); }
    else if (w.chess && w.sat >= 5 && !w.chessPlayed) { w.chessPlayed = true; L.push(narr('He has the board on his knees before you sit down. Wood, worn pale at the corners.'), say('walter', "Knight. Always the knight first, it confuses people."), choice({ t: 'Move the knight', do: () => [say('walter', "See? Confused already. I'm confused, anyway.")] }, { t: 'Move a pawn', do: () => [say('walter', "Pawn. Sensible. Ruth was a pawn person. Drove me mad.")] }), narr('You lose in nineteen moves. He is delighted.'), say('walter', "You're terrible. Same time tomorrow?")); }
    if (w.sat >= 6) w.stage = Math.max(w.stage, 3);
    if (w.stage >= 3 && !w.river && !w.askedRiver) { w.askedRiver = true; L.push(say('walter', "Would you walk with me to the river? I haven't been since Ruth. It's not far. I just... need someone to walk with.")); }
    if (w.sat >= 8 && G.day >= w.deathDay - 4 && !w.gaveSet) { w.gaveSet = true; G.inv.chess = 1; remember('walter_set'); L.push(say('walter', "Take the board. No, take it. I've been carrying it around for you anyway, might as well be honest about it."), say('walter', "Ruth's father made it. Now it's yours. Beat somebody with it. Cheat if you have to.")); }
    Dlg.run(L);
  },
  talk() {
    const w = C('walter'); if (!talkEnergy()) return; w.talked++;
    if (w.pawnedGift && !w.pawnTalked) { w.pawnTalked = true; Dlg.run([say('walter', "Ruth's father's board is in Sol's window. Sixty dollars."), say('walter', "I gave it to you. That means it was yours to sell. I'm choosing to believe the sixty dollars mattered."), narr('He looks at the place the bus does not come from and does not say anything else.')]); return; }
    if (!w.met) Dlg.run([narr('An old man on the bench under the bus sign, hat dripping, hands folded over a cane.'), say('walter', "Waiting for the 14. You?"), choice({ t: "There's no 14 anymore.", do: () => [say('walter', "I know that, son. I know that better than anyone.")] }, { t: "Just walking.", do: () => [say('walter', "Good day for it. If you're a duck.")] })]);
    else Dlg.run([say('walter', fresh('walter', ["Sit down if you're going to hover.", "They've got the bus stop still. That's something. They took the bus, but they left the stop.", "Have you eaten? You look grey.", "I fed the pigeons this morning. Ruth hated pigeons. I do it out of spite."]))]);
  },
  fixRadio() {
    const w = C('walter'); G.inv.radioParts = 0; w.radio = true; w.stage = Math.max(w.stage, 1); trust('walter', 3); useEnergy(8); remember('walter_radio');
    Dlg.run([narr('You open the back of the radio on the bench with a butter knife. The capacitor has leaked; you swap it. It takes twenty minutes and a lot of squinting.'), narr('Static. Then a voice, tinny and warm, calling a ball game.'), say('walter', "..."), say('walter', "That's Kessler. He's been calling games since I was fifty."), narr('He holds the radio in both hands against his chest for the rest of the afternoon.')]);
  },
  riverWalk() {
    const w = C('walter'); w.river = true; useEnergy(20); trust('walter', 4); remember('walter_river');
    UI.fadeOut(() => {
      G.px = STREET.spots.river - 30; G.facing = 1; G.camX = clamp(G.px - W / 2, 0, STREET.w - W); w.atRiver = true; refreshEntities(); UI.fadeIn();
      Dlg.run([narr('You walk slowly. He stops to look at things: a door, a crack, a place where a tree used to be.'), narr('At the railing the water is the color of the sky, which is the color of nothing.'), say('walter', "We came here the night we got engaged. She said yes and then she said she'd only said yes because it was raining and she wanted to go inside."), say('walter', "Fifty-one years. She never took it back."),
        choice({ t: "I'm dying, Walter.", do: () => { w.told = true; trust('walter', 2); remember('walter_told'); return [say('walter', "I know. I've known for weeks."), say('walter', "I'm not going to tell you it's alright. It isn't. But you've been sitting with an old man on a bench, and that's what you did with the time. That's not nothing. That's the opposite of nothing."), narr('You stand there together for a long while.')]; } },
          { t: "Tell me about her.", do: () => [say('walter', "She snorted when she laughed. Every time. Sixty years old, snorting like a girl. I never got tired of it."), say('walter', "That's what's left, you know. Not the big things. The snort.")] }),
        say('walter', "Thank you for walking me. I couldn't have come alone. I tried, twice."),
        { fn: () => { w.atRiver = false; } }]);
    });
  }
};

// ============================================================
// NADIA
// ============================================================
const Nadia = {
  init() { return { stage: 0, trust: 0, met: false, shifts: 0, freeShifts: 0, customers: 0, signFixed: false, closed: false, saved: false, talked: 0, spec: 'nadia', sam: false, rentDay: 60 }; },
  present() { return !C('nadia').closed; },
  daily() {
    const n = C('nadia');
    if (G.day >= n.rentDay && !n.closed && !n.saved) {
      const score = (n.signFixed ? 1 : 0) + Math.min(2, n.customers) + Math.min(2, n.freeShifts) + (n.trust >= 6 ? 1 : 0);
      if (score >= 4) { n.saved = true; n.stage = 4; G.pendingDiner = 'saved'; remember('nadia_saved'); }
      else { n.closed = true; G.flags.dinerClosed = true; G.pendingStreet = 'dinerClosed'; remember('nadia_closed'); }
    }
  },
  menu() {
    const n = C('nadia');
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }, { t: 'Work a dish shift', r: '-30 energy', disabled: () => G.energy < 20, do: () => this.work(false) }, { t: 'Buy soup', r: '$8', disabled: () => G.money < 8, do: () => { if (spend(8)) { addHunger(45); n.trust += 0; } } }];
    Gifts.nadia(items);
    if (G.inv.fish) items.push({ t: 'Sell her a lake fish', r: () => `x${G.inv.fish}  $12`, keep: true, hide: () => !G.inv.fish, do: () => { G.inv.fish--; addMoney(12); n.fishBought = (n.fishBought || 0) + 1; if (n.fishBought === 1) Dlg.run([say('nadia', "Perch? Where did you... the lake? You went to the lake? Twelve. I'll put it on the board tonight. 'Catch of the day.' First time that's been true in this building.")]); else UI.toast('+$12. Catch of the day.', '#8ae88a'); } });
    if (n.stage >= 1 && !n.signFixed && G.inv.signParts) items.push({ t: 'Fix the sign', r: '-15 energy', disabled: () => G.energy < 15, do: () => this.fixSign() });
    if (n.stage >= 1 && n.askedFree && !n.freeToday) items.push({ t: 'Work a shift for free', r: '-30 energy', disabled: () => G.energy < 20, do: () => this.work(true) });
    if (n.saved && C('amos').id && !C('amos').job && Amos.present()) items.push({ t: 'Suggest she hire Amos', do: () => this.hireAmos() });
    items.push({ t: 'Leave', do: () => { } });
    Menu.open(n.met ? 'Nadia' : 'The woman at the counter', items);
  },
  work(free) {
    const n = C('nadia'); if (free) n.freeToday = true;
    const go = () => startMinigame('dishes', (pay, lines) => {
      useEnergy(30); addHunger(-12); n.shifts++;
      if (free) { n.freeShifts++; trust('nadia', 2); remember('nadia_free'); Dlg.run([say('nadia', "I'll remember this. I don't forget things like this."), narr(lines.join('. ') + '.')]); }
      else { addMoney(pay); Dlg.run([narr(lines.join('. ') + '.'), say('nadia', pay >= 15 ? "Not bad. Coffee's on the house. It's always on the house, but I'm saying it anyway." : pay >= 8 ? "It's a start. Coffee's free." : "Well. You showed up. That's more than the last guy.")]); }
      if (n.shifts >= 3 && n.stage === 0) n.stage = 1;
    });
    if (!n.met) { n.met = true; clearPortrait('nadia'); Dlg.run([narr('The diner is empty except for the smell of coffee and a woman wiping a counter that is already clean.'), say('nadia', "Sink's in the back. Dollar a plate, more if you're fast, nothing if you break them. I'm Nadia. Don't break them.")], go); }
    else go();
  },
  fixSign() {
    const n = C('nadia'); G.inv.signParts = 0; n.signFixed = true; G.flags.signFixed = true; useEnergy(15); trust('nadia', 3); remember('nadia_sign');
    Dlg.run([narr('A ladder, a wet roof edge, a transformer that bites your fingers twice. The rain finds the back of your neck.'), narr('The sign hums, stutters, and then holds: NADIA\'S, steady pink, the whole width of the street.'), say('nadia', "Get down from there before you kill yourself. ...It looks like 1994. It looks like my dad's place."), narr("She stands under it in the rain longer than she needs to.")]);
  },
  hireAmos() {
    Amos.hireAtDiner(); trust('nadia', 2); trust('amos', 3);
    Dlg.run([you("Amos. He's got an ID now. He's reliable, he's a carpenter, and he's never once asked me for anything."), say('nadia', "The man on the cardboard by your building?"), you("The man on the cardboard by my building."), say('nadia', "..."), say('nadia', "Prep and dishes, six to two, and he gets fed. Tell him to come in tomorrow. If he's late, that's on you."), you("He won't be late.")]);
  },
  talk() {
    const n = C('nadia'); if (!talkEnergy()) return; n.talked++; const L = [];
    { const on = outfitNotice('nadia'); if (on) L.push(on); }
    if (!n.met) { n.met = true; clearPortrait('nadia'); L.push(narr('The diner is empty except for the smell of coffee and a woman wiping a counter that is already clean.'), say('nadia', "Sit anywhere. Or if you're looking for work, the sink's in the back. Dollar a plate. I'm Nadia.")); }
    else if (n.stage >= 1 && n.stage < 4 && !n.askedFree && n.shifts >= 4) { n.askedFree = true; L.push(say('nadia', "I have to ask you something and I hate it. Can you work tonight and let me pay you next week? I'm short. I'm just... short."), choice({ t: "Sure. Don't worry about next week.", do: () => { trust('nadia', 1); return [say('nadia', "..."), say('nadia', "You're a strange person. Thank you.")]; } }, { t: "I can't afford to.", do: () => [say('nadia', "I know. I know. Forget I asked.")] })); }
    else if (n.stage === 0) L.push(say('nadia', fresh('nadia', ["Slow. It's always slow now. The office across the way closed and took my lunch crowd with it.", "You want coffee? It's free. It's always free. I gave up charging for it.", "Sink's open if you want it."])));
    else if (n.stage === 1) {
      if (!n.story1) { n.story1 = true; L.push(say('nadia', "Landlord's raising the rent in two months. Not a lot. Just enough."), say('nadia', "The sign's been dying for a year. Transformer. Lin's could order one, twenty-two bucks, but I'd have to get on the roof and I've got a nine-year-old who needs a mother with all her limbs."), narr("Lin's Market could sell you the part."), { fn: () => { G.flags.signAvailable = true; } }); }
      else if (!n.sam && G.tod > 0.5) { n.sam = true; L.push(say('nadia', "That's Sam in the booth. Homework. He'll tell you it's done. It's not done."), say('kid', "It's done!"), say('nadia', "It's not done.")); }
      else L.push(say('nadia', fresh('nadia', ["Two months. Sixty days. I count them on the register tape.", "If a few more regulars came in I could make it. That's all it would take. A few more faces.", "Sam asked why you're so thin. I said some people are. He said that's not a reason. He's not wrong.", "Amos came in. Sat at the counter for an hour with a coffee. Didn't say much. Left a dollar under the cup he couldn't afford."])));
      if (n.signFixed || n.freeShifts >= 1 || n.customers >= 1) n.stage = 2;
    }
    else if (n.stage === 2) {
      L.push(say('nadia', fresh('nadia', ["Walter came in. Ordered pie and told me it was terrible and then ordered another slice.", "Mrs. Lin sent over a case of soup, cost. Said you told her to. Did you?", "I've got until the sixtieth. If I make it, I make it.", "Sam wants to know if you'll play checkers with him. I told him you're busy. He said 'doing what.' I didn't have an answer."])));
    }
    else if (n.stage >= 4) {
      if (!n.savedStory) { n.savedStory = true; L.push(say('nadia', "Paid. In full. First time in a year I didn't have to call and beg for a week."), say('nadia', "The sign, the regulars, the nights you worked for nothing. I sat down and did the math and it was you. Every column."), say('nadia', "There's a soup now. It's on the board. It's called the 412. It's yours whenever you want it, forever, and if you try to pay for it I'll throw you out."), { fn: () => { remember('nadia_soup'); G.flags.freeSoup = true; } }); }
      else L.push(say('nadia', fresh('nadia', ["Sam drew a picture of the diner for school. You're in it. You're mostly a coat.", "Busker played in the corner Friday. People stayed. People stayed!", "Eat the soup. Don't argue. Eat it.", "You look worse. Sit down. I mean it. Sit."])));
    }
    if (n.stage === 3) n.stage = 2;
    Dlg.run(L);
  }
};

// ============================================================
// MINOR KINDNESSES
// ============================================================
const Minor = {
  busker() {
    const f = G.flags; f.buskerTalks = (f.buskerTalks || 0) + 1;
    const items = [{ t: 'Tip him $1', disabled: () => G.money < 1, do: () => { addMoney(-1); markTalked(); f.buskerTips = (f.buskerTips || 0) + 1; remember('busker'); useEnergy(1); Audio.chord([262, 330, 392], 1.5); Dlg.run([f.buskerTips === 1 ? say('busker', "Hey, thanks. Any requests? I know four songs and I know them all badly.") : f.buskerTips === 3 ? say('busker', "You again. Okay. This one's for you. I wrote it. It's about rain. Everything I write is about rain.") : say('busker', fresh('busker', ["Cheers, friend.", "This one's an old one.", "For the lady in 412. Wait, that's you. For you."]))]); } },
      { t: 'Listen a while', r: '-3 energy', do: () => { if (!talkEnergy(3)) return; Song.play(Song.next()); } },
      { t: 'Leave', do: () => { } }];
    Theo.buskerItems(items); Gifts.busker(items);
    if (C('nadia').stage >= 2 && !G.flags.dinerClosed && !G.flags.toldBuskerDiner) items.push({ t: "Mention Nadia's diner", do: () => { G.flags.toldBuskerDiner = true; C('nadia').customers++; Dlg.run([you("Nadia's could use some music. Fridays. She'd probably feed you."), say('busker', "A roof and a plate? I'd play the phone book.")]); } });
    Menu.open(G.chars.theo && G.chars.theo.calNamed ? 'Cal' : 'Busker', items);
  },
  dog() {
    const f = G.flags; f.dogFed = f.dogFed || 0;
    const items = [{ t: 'Give it some bread', hide: () => !G.inv.bread, do: () => { G.inv.bread--; markTalked(); f.dogFed++; useEnergy(1); remember('dog'); Audio.tone(600, 0.1, 'sine', 0.04, 1.3); if (f.dogFed >= 3 && !f.dogFollows) { f.dogFollows = true; Dlg.run([narr('The dog eats, then does not go back through the fence. It sits by your foot and looks up.'), narr('It follows you home. It follows you everywhere after that.')]); } else Dlg.run([narr(pick(['The dog eats without taking its eyes off you.', 'It takes the bread gently, like it has been hit for taking things before.', 'It eats and then leans, very slightly, against your leg.']))]); } },
      { t: 'Crouch down', do: () => { if (!talkEnergy(2)) return; Dlg.run([narr(f.dogFed ? 'It comes over and pushes its head under your hand.' : 'It backs up two steps and watches you through the fence. Ribs like a radiator.')]); } },
      { t: 'Leave', do: () => { } }];
    const leave = items.pop(); Gifts.dog(items); items.push(leave);
    Menu.open(f.dogFollows ? (f.dogName ? f.dogName : 'The dog') : 'A stray dog', items);
  },
  granny() {
    const f = G.flags;
    if (f.grannyDay === G.day) { Dlg.run([say('granny', pick(["Go on, go on. You've done enough for one day.", "Eat something! You're all corners."]))]); return; }
    const gi = []; Gifts.granny(gi);
    Menu.open('Mrs. Ortega', gi.concat([{ t: 'Help with the bags', do: () => { f.grannyDay = G.day; markTalked(); f.grannyHelped = (f.grannyHelped || 0) + 1; useEnergy(3); remember('granny'); if (f.grannyHelped === 1) Dlg.run([narr('Oranges roll into the gutter. You gather them. The bag has split down the side.'), say('granny', "Third bag this month. They make them out of nothing now."), say('granny', "You're the one in 412. Thin one. I see you feeding Amos. Good. Somebody should. Here."), narr('A foil-wrapped tamale, still warm.'), { fn: () => addHunger(25) }]); else Dlg.run([say('granny', fresh('granny', ["You again! Take one. Take two, you're all bones.", "My grandson could learn from you. Here. Tamale.", "Bless you. Eat."])), { fn: () => addHunger(25) }]); } }, { t: 'Keep walking', do: () => { } }]));
  },
  kid() {
    const f = G.flags;
    Menu.open('A crying kid', [{ t: 'Ask what happened', do: () => { f.kidHelped = true; markTalked(); useEnergy(4); remember('kid'); Dlg.run([say('kid', "I got off at the wrong stop. Mom's at the clinic. I don't know which way."), you("It's this way. Come on. I'll walk you."), narr('He holds your sleeve the whole way, not your hand, like a compromise.'), narr('At the clinic door a woman in scrubs runs out and folds him up. She looks at you over his head and mouths thank you.'), { fn: () => { G.flags.kidDone = true; } }]); } }, { t: 'Not your problem', do: () => { } }]);
  },
};

// ============================================================
// DOCTOR
// ============================================================
const Doctor = {
  talk() {
    const d = G.day; const L = []; if (!talkEnergy()) return; G.flags.docTalks = (G.flags.docTalks || 0) + 1;
    if (G.flags.docTalks === 1) L.push(say('doctor', "You came in. Good. Most people don't come back after the first conversation."), say('doctor', "The trial is still recruiting. If it opens to your cohort, you'll be first on my list. I can't promise more than that."), say('doctor', "In the meantime: eat. I know it's expensive. Eat anyway."));
    else if (d < 40) L.push(say('doctor', fresh('doctor', ["No news on the trial. No news is not bad news. It's just no news.", "Your weight's down. Are you sleeping? Are you eating?", "Whatever you're doing out there, keep doing it. Your bloodwork says it's helping. I don't know how, and I'm not going to argue with it."])));
    else if (d < 60) { if (!G.flags.docDelay) { G.flags.docDelay = true; L.push(say('doctor', "Sit down."), say('doctor', "The trial's been pushed. Funding. Six months, they say. Maybe more."), say('doctor', "I'm sorry. I know what I said. I know what that number was for you."), choice({ t: "I figured.", do: () => [say('doctor', "You're taking this better than I am.")] }, { t: "So that's it.", do: () => [say('doctor', "That's it for the trial. It's not it for you. Not today.")] })); } else L.push(say('doctor', fresh('doctor', ["Nothing new. I'm sorry.", "You've got people asking about you. A girl from the market. A man in a navy coat. That's more than most of my patients have."]))); }
    else if (d < 90) L.push(say('doctor', fresh('doctor', ["Your lungs are worse. I'd tell you to rest, but I don't think you'd listen.", "I can give you something for the cough. It won't fix anything. It'll help you sleep.", "You know where we are now. I won't pretend otherwise. Is there anyone I should call, when it's time?"])));
    else L.push(say('doctor', "I don't have anything to give you that you don't already have. Go home. Be with whoever you've got."));
    Dlg.run(L);
  }
};

// ============================================================
// ENDING LIST
// ============================================================
function buildEndingList() {
  const out = []; const a = C('amos'), m = C('mei'), w = C('walter'), n = C('nadia'), f = G.flags;
  // Amos
  if (a.dead) out.push({ name: 'Amos', line: a.met ? 'He got sick in the cold. You knew his name, and then he was gone.' : 'You never learned his name. The cardboard is still there.', bad: true });
  else if (a.room) out.push({ name: 'Amos Delacroix Reed', line: 'Carpenter. Neighbor. He has a door that locks and a chair that is yours. He carved you a bird.' });
  else if (a.job) out.push({ name: 'Amos Reed', line: `Working ${a.job === 'diner' ? "at Nadia's" : 'the freight dock'}, six to two. First paycheck in three years.` });
  else if (a.id) out.push({ name: 'Amos Reed', line: 'He has a coat, an ID, and his own name on a card. He is still looking for work. He will find it.' });
  else if (a.coat) out.push({ name: 'Amos', line: 'He slept through a whole night in the coat you bought. He is still on the cardboard, but he is warm.' });
  else if (a.fed >= 2) out.push({ name: 'Amos', line: 'You fed him when no one else would. He knows your face. It is not enough, and it is not nothing.' });
  else out.push({ name: 'The man by the stoop', line: 'You walked past him every day. He is still there.', bad: true });
  // Mei
  if (m.cold) out.push({ name: 'Mei', line: 'You told her drawing was a waste. She stopped showing anyone.', bad: true });
  else if (m.accepted) out.push({ name: 'Mei Lin', line: 'Illustration program, half grant. She put your portrait in the portfolio. Her mother laughed for the first time in years.' });
  else if (m.applied) out.push({ name: 'Mei Lin', line: 'She sent the application. The letter will come after you are gone. She will read it at the counter and go quiet.' });
  else if (m.missed) out.push({ name: 'Mei', line: 'The deadline passed. She still draws when it is slow. Next year, maybe.', bad: true });
  else if (m.sketch) out.push({ name: 'Mei', line: 'She filled the sketchbook you bought her. The street, the lamp, Amos, you.' });
  else if (m.seen) out.push({ name: 'Mei', line: 'You asked to see her drawings. Nobody had before.' });
  else out.push({ name: 'The girl at the counter', line: "Bread's five. That is all you ever said to each other.", bad: true });
  // Walter
  if (w.sat >= 6) out.push({ name: 'Walter Ashby', line: `He died on day ${w.deadDay}, in his sleep, after ${w.sat} afternoons on a bench with you. He walked to the river again. ${G.inv.chess ? "His chess set is on your table." : ''}`.trim() });
  else if (w.sat >= 3) out.push({ name: 'Walter', line: `You sat with him ${w.sat} times. ${w.radio ? 'His radio works again. ' : ''}He died waiting for a bus that does not come, but not alone. Not entirely.` });
  else if (w.met) out.push({ name: 'Walter', line: 'The old man at the bus stop. You sat with him once. Then the bench was empty and you never knew why.', bad: true });
  else out.push({ name: 'The old man on the bench', line: 'He waited for the 14 every day. One day he was not there.', bad: true });
  // Nadia
  if (n.saved) out.push({ name: 'Nadia & Sam', line: `The diner made rent. The sign says NADIA'S in steady pink. There is a soup on the board called the 412.${a.job === 'diner' ? ' Amos runs the kitchen.' : ''}` });
  else if (n.closed) out.push({ name: 'Nadia', line: `The diner closed on day ${n.rentDay}. She took Sam to her sister's. ${n.trust >= 3 ? 'She hugged you at the bus stop and did not let go for a while.' : 'You did not say goodbye.'}`, bad: n.trust < 3 });
  else if (n.shifts >= 3) out.push({ name: 'Nadia', line: 'Free coffee, always. You washed a lot of her plates.' });
  else out.push({ name: 'The woman at the diner', line: 'You never learned her name.', bad: true });
  // minors
  if (f.dogFollows) out.push({ name: 'The dog', line: 'It slept at the foot of your bed every night after that. It is still there.' });
  else if (f.dogFed) out.push({ name: 'A stray dog', line: 'You fed it through the fence. It remembered you.' });
  if (G.chars.theo && G.chars.theo.reunited) { }
  else if (f.buskerTips >= 3) out.push({ name: 'The busker', line: 'He wrote a song about rain and played it for you. You were his best audience.' });
  else if (f.buskerTips) out.push({ name: 'The busker', line: 'A dollar in a guitar case. He played anyway.' });
  if (f.grannyHelped >= 3) out.push({ name: 'Mrs. Ortega', line: `Oranges in the gutter, ${f.grannyHelped} times. She brought tamales to your door at the end.` });
  else if (f.grannyHelped) out.push({ name: 'Mrs. Ortega', line: 'You picked up her oranges once. She never forgot it.' });
  if (f.kidHelped) out.push({ name: 'A lost kid', line: 'He held your sleeve all the way to the clinic. His mother mouthed thank you over his head.' });
  const nl = Nora.endingLine(); if (nl) out.splice(4, 0, nl);
  const el = Emmett.endingLine(); if (el) out.splice(5, 0, el);
  for (const x of Phone.endingLines()) out.splice(1, 0, x);
  if (f.pryorDock) out.push({ name: 'Mr. Pryor', line: 'A man on the Sunday bus with a spreadsheet he was not reading. His father held a rod on the pier for an hour and said the first word in a month.' });
  else if (f.pryorTalks >= 2) out.push({ name: 'Mr. Pryor', line: 'Forty minutes a Sunday, thirty of them on his phone. He told a stranger on a bus. That was you.' });
  if (f.ortegaStone) out.push({ name: 'Hector Ortega', line: 'Grey granite, not black. HE FIXED THINGS. Sixty tamales a week and forty-one Sundays on the 14, and you carried the cooler.' });
  const le = Ladder.endingEntry(); if (le) out.push(le);
  for (const x of Theo.endingLines()) out.splice(5, 0, x);
  return out;
}
