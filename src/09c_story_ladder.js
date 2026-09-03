// ============================================================
// The Corporate Ladder: dock manager, Data Entry, Halvorsen deposit, the coffee can
// ============================================================
const CURE_COST = 10000;
SPECS.playerManager = { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#2c3444', shoes: '#3a3634', coat: '#4c5260', tie: '#8a2a2a' };
SPECS.playerManagerLate = { skin: '#cfae96', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#2c3444', shoes: '#3a3634', coat: '#4c5260', tie: '#8a2a2a', scarf: '#8a3a3a' };
function playerSpec() { const f = G.flags; if (f.manager) return G.day >= 60 ? 'playerManagerLate' : 'playerManager'; return G.day >= 60 ? 'playerLate' : 'player'; }

// ---------- DATA ENTRY (typing) ----------
class DataGame {
  start() {
    this.t = 0; this.entries = []; this.done = 0; this.correct = 0; this.errors = 0; this.total = 14 + Math.floor(difficulty() * 6); this.intro = 150; this.over = 0;
    this.limit = 60 * 60 + Math.floor(difficulty() * 60 * 12); this.timeLeft = this.limit; this.cursor = 4; this.flash = 0; this.streak = 0; this.best = 0;
    this.next();
    // on-screen keypad geometry
    this.keys = []; const labels = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '<', '0', 'OK'];
    for (let i = 0; i < 12; i++) this.keys.push({ l: labels[i], x: 330 + (i % 3) * 30, y: 96 + Math.floor(i / 3) * 24, w: 26, h: 20 });
  }
  next() {
    if (this.done >= this.total) { this.over = 150; this.pay = Math.round(this.correct * 4 + this.best * 1.5 - this.errors); return; }
    const R = Math.random; const pre = pick(['BK', 'MF', 'PL', 'HV', 'CR', 'DK']); const n = String(10000 + Math.floor(R() * 89990)); const q = 1 + Math.floor(R() * 60);
    this.cur = { pre, n, q, typed: '', item: pick(['pallet', 'drum', 'crate', 'skid', 'roll', 'bale']) };
  }
  input(ch) {
    const c = this.cur; if (!c) return;
    if (ch === '<') { c.typed = c.typed.slice(0, -1); return; }
    if (ch === 'OK') { this.submit(); return; }
    if (c.typed.length >= 5) return;
    c.typed += ch; Audio.tone(900 + Math.random() * 200, 0.03, 'square', 0.02);
    if (c.n[c.typed.length - 1] !== ch) { this.errors++; this.streak = 0; this.flash = 8; Audio.bad(); c.typed = c.typed.slice(0, -1); }
    else if (c.typed.length === 5) this.submit();
  }
  submit() { const c = this.cur; if (c.typed === c.n) { this.correct++; this.streak++; this.best = Math.max(this.best, this.streak); Audio.tone(1200, 0.06, 'square', 0.03); this.entries.push({ pre: c.pre, n: c.n, q: c.q, item: c.item, ok: true }); } else { this.errors++; this.streak = 0; this.flash = 8; Audio.bad(); this.entries.push({ pre: c.pre, n: c.n, q: c.q, item: c.item, ok: false }); } this.done++; this.next(); }
  update() {
    if (this.intro > 0) { this.intro--; if (Input.anyHit() || Input.digit() !== null || Input.tap) this.intro = 0; return; }
    if (this.over > 0) { this.over--; if (this.over === 0 || Input.hit('act')) endMinigame(this.pay, [`${this.correct}/${this.total} manifests entered`, `${this.errors} errors`]); return; }
    this.t++; this.timeLeft--; if (this.flash > 0) this.flash--;
    if (this.timeLeft <= 0) { this.over = 150; this.pay = Math.round(this.correct * 4 + this.best * 1.5 - this.errors); return; }
    const d = Input.digit(); if (d !== null) this.input(String(d));
    if (Input.raw.includes('Backspace')) this.input('<');
    if (Input.hit('act') && !Input.tap) { const k = this.keys[this.cursor]; if (Input.raw.includes('Enter')) this.submit(); else this.input(k.l); }
    if (Input.hit('left')) this.cursor = (this.cursor + 11) % 12; if (Input.hit('right')) this.cursor = (this.cursor + 1) % 12;
    if (Input.hit('up')) this.cursor = (this.cursor + 9) % 12; if (Input.hit('down')) this.cursor = (this.cursor + 3) % 12;
    if (Input.tap) { for (let i = 0; i < 12; i++) { const k = this.keys[i]; if (Input.tap.x >= k.x && Input.tap.x < k.x + k.w && Input.tap.y >= k.y && Input.tap.y < k.y + k.h) { this.cursor = i; this.input(k.l); } } }
  }
  draw(g, t) {
    mgFrame(g, 'MANIFESTS - MORROW FREIGHT OFFICE', `entered ${this.done}/${this.total}   errors ${this.errors}   time ${Math.ceil(this.timeLeft / 60)}s`);
    // CRT terminal
    px(g, 40, 44, 270, 190, '#0a120c'); px(g, 40, 44, 270, 1, '#2a4a30'); px(g, 40, 233, 270, 1, '#2a4a30');
    g.fillStyle = 'rgba(80,200,110,0.05)'; for (let y = 46; y < 232; y += 3) g.fillRect(40, y, 270, 1);
    drawText(g, 'MORROW FREIGHT  -  INBOUND MANIFEST  -  TERM 2', 48, 50, '#5ac87a');
    drawText(g, 'REF NO.        QTY   ITEM        STATUS', 48, 62, '#3a8a50');
    // completed entries scrolling up
    const list = this.entries.slice(-9);
    for (let i = 0; i < list.length; i++) { const e = list[i]; const y = 74 + i * 11; drawText(g, `${e.pre}-${e.n}`, 48, y, e.ok ? '#5ac87a' : '#d86a5a'); drawText(g, String(e.q).padStart(3, ' '), 122, y, '#5ac87a'); drawText(g, e.item, 150, y, '#3a8a50'); drawText(g, e.ok ? 'OK' : 'ERR', 220, y, e.ok ? '#5ac87a' : '#d86a5a'); }
    // current entry
    if (this.cur && this.over === 0) {
      const y = 74 + list.length * 11 + 6; const c = this.cur;
      px(g, 44, y - 3, 262, 26, this.flash ? 'rgba(216,74,74,0.18)' : 'rgba(90,200,122,0.08)');
      drawText(g, `PAPER: ${c.pre}-${c.n}   qty ${c.q}   ${c.item}`, 48, y, '#a8e8b8');
      drawText(g, `TYPE:  ${c.pre}-`, 48, y + 12, '#5ac87a');
      const tx = 48 + textWidth(`TYPE:  ${c.pre}-`) + 2;
      for (let i = 0; i < 5; i++) { const ch = c.typed[i]; px(g, tx + i * 8, y + 20, 6, 1, i === c.typed.length && (t % 40) < 24 ? '#a8e8b8' : '#2a4a30'); if (ch) drawText(g, ch, tx + i * 8, y + 12, '#e8ffe8'); }
    }
    // keypad
    UI.panel(g, 322, 60, 100, 172, 0.9); drawText(g, 'KEYPAD', 372, 66, '#8a92a4', { align: 'center' });
    drawText(g, Input.touch ? 'tap keys' : 'type digits', 372, 76, '#5a6070', { align: 'center' });
    for (let i = 0; i < 12; i++) { const k = this.keys[i]; const on = i === this.cursor; px(g, k.x, k.y, k.w, k.h, on ? '#3a3a52' : '#22222c'); px(g, k.x, k.y, k.w, 1, on ? '#8a8ab8' : '#3a3a48'); drawText(g, k.l, k.x + k.w / 2, k.y + 6, on ? '#f8f0d8' : '#c8ccd8', { align: 'center' }); }
    drawText(g, 'arrows + E also work', 372, 200, '#5a6070', { align: 'center' });
    // timer bar
    px(g, 40, 236, 270, 4, '#1a2a1e'); px(g, 40, 236, Math.round(270 * this.timeLeft / this.limit), 4, this.timeLeft < 600 ? '#d86a5a' : '#5ac87a');
    if (this.intro > 0) { UI.panel(g, W / 2 - 140, 200, 280, 40, 0.95); drawText(g, 'Copy each paper manifest number into the terminal.', W / 2, 206, '#f0ead8', { align: 'center' }); drawText(g, 'Type the 5 digits (keyboard, keypad, or arrows + E).', W / 2, 216, '#c8ccd8', { align: 'center' }); drawText(g, 'Wrong digit costs a dollar. Any key to start.', W / 2, 226, '#c8ccd8', { align: 'center' }); }
    else if (this.over > 0) { UI.panel(g, W / 2 - 100, 200, 200, 40, 0.95); drawText(g, 'Shift over. Six to six.', W / 2, 206, '#e8c84a', { align: 'center' }); drawText(g, `${this.correct} entered, ${this.errors} errors  -  $${this.pay}`, W / 2, 220, '#f0ead8', { align: 'center' }); }
  }
}

// ---------- LADDER (foreman side) ----------
const Ladder = {
  onStack(pay) {
    const f = G.flags; if (pay >= 30) f.dockGood = (f.dockGood || 0) + 1;
    if (!f.manager && !f.ladderOffered && (f.dockGood || 0) >= 4 && G.day >= 6) { f.ladderOffered = true; return this.offer(); }
    return null;
  },
  offer() {
    return [say('worker', "Hold up. Office. Now."), narr('The office is a trailer with a space heater and a terminal older than you. A stack of paper manifests a foot high.'), say('worker', "Guy who did the manifests quit Friday. I've watched you stack for two weeks; you don't drop things and you don't talk. That's the whole job."),
      say('worker', "Shift lead. Six to six, in here, on that thing. Seventy a day, cash, more if the numbers come out clean. You'd be the boss of nobody, but the title says manager."),
      choice({ t: "I'll take it.", do: () => { G.flags.manager = true; G.flags.managerDay = G.day; remember('ladder_manager'); clearPortrait('you'); return [say('worker', "Tomorrow. Six. Wear a shirt with a collar, the owner comes by sometimes."), narr(G.flags.cureKnown ? 'Seventy a day. You do the math on the walk home. At seventy a day Halvorsen is most of a year away. There is a chair above this one; you have seen the owner\'s car.' : 'Seventy a day. More than you have made in a week. You do the math on the walk home.')]; } },
        { t: "Not now.", do: () => [say('worker', "Suit yourself. Offer stands till it doesn't.")] })];
  },
  managerShift() {
    startMinigame('data', (pay, lines) => {
      useEnergy(65); addHunger(-20); G.flags.managerShifts = (G.flags.managerShifts || 0) + 1; addMoney(pay);
      const f = G.flags; const L = [narr(lines.join('. ') + '.')]; f.lateStreak = 0; if (pay >= 70) f.managerClean = (f.managerClean || 0) + 1;
      if (f.managerShifts === 1) L.push(say('worker', "Not bad for a first day. The owner asked who you were. I said 'the guy who doesn't drop things.'"));
      else if (f.managerShifts === 5) L.push(narr('Twelve hours in a trailer. When you come out it is dark and the street has happened without you.'));
      else if (f.managerShifts === 10) L.push(say('worker', "Owner wants to know if you'd do Saturdays. I told him you're sick. He said 'so?' I'm just passing it along."));
      else if (f.managerClean === 2 && !f.vpTeased) { f.vpTeased = true; L.push(say('worker', "Owner looked at your numbers. He doesn't look at numbers. He asked me if you had a suit.")); }
      else L.push(say('worker', fresh('worker', ["Numbers were clean. Tomorrow.", "Tomorrow, six.", "You cough like that in front of the owner, he'll ask. Don't cough in front of the owner."])));
      if (VP.offerReady()) L.push(VP.offer());
      Dlg.run(L);
    });
  },
  hireAmosAsManager() {
    Amos.hireAtDock(); trust('amos', 3);
    Dlg.run([narr("You do not ask the foreman. You are the shift lead; you write the name on the day-labor sheet yourself."), you("Amos Reed. Six a.m. He's got his ID."), say('worker', "The cardboard guy? ...Your sheet, your problem."), narr('It is the first thing the title has been good for.')]);
  },
  // ---- the coffee can: bequests ----
  bequestAvailable() { return G.day >= 70 || G.flags.cureRefunded; },
  coffeeCan() {
    const f = G.flags; G.bequests = G.bequests || {};
    const gifts = [
      { k: 'mei', t: "Mei's tuition", amt: 3600, hide: () => C('mei').cold, sub: 'An envelope under the counter, marked SCHOOL.' },
      { k: 'nadia', t: "Nadia's rent", amt: 2700, hide: () => C('nadia').closed, sub: "Six months of the difference. Slid under the diner door." },
      { k: 'amos', t: "Amos's deposit", amt: 2100, hide: () => !Amos.present(), sub: 'First and last on a room with a window. Given straight to the super.' },
      { k: 'walter', t: "Walter's headstone", amt: 2400, hide: () => !C('walter').dead || !C('walter').met, sub: 'St. Bartholomew\'s. Next to Ruth. The stonemason spells Ashby right the second time.' },
      { k: 'nora', t: "Nora's brother's fund", amt: 1500, hide: () => !G.chars.nora || !G.chars.nora.met || G.chars.nora.cold, sub: 'The leukemia fund at St. Anne\'s, in a name you never knew until she told you.' },
      { k: 'clinic', t: "The clinic's free-care fund", amt: 1800, sub: "Okafor's desk drawer. No note. She'll know." },
      { k: 'ortega', t: "Mrs. Ortega", amt: 900, hide: () => !G.flags.grannyHelped, sub: 'For oranges. For a year of terrible coffee for Amos.' },
      { k: 'busker', t: "The busker", amt: 600, hide: () => !G.flags.buskerTips, sub: 'Folded into the guitar case. Enough for strings, and a coat.' },
    ];
    const items = gifts.filter(x => !x.hide || !x.hide()).map(x => ({ t: x.t, r: () => G.bequests[x.k] ? 'left' : `$${x.amt}`, disabled: () => G.bequests[x.k] || G.money < x.amt, keep: true, do: () => { addMoney(-x.amt); G.bequests[x.k] = x.amt; remember('bequest_' + x.k); Audio.good(); UI.toast(x.sub, '#8ae88a'); } }));
    items.push({ t: 'Close the lid', do: () => { } });
    Menu.open(`The coffee can  -  $${G.money}`, items, { wide: true, sub: f.cureRefunded ? 'Halvorsen sent it back.' : 'What you have.' });
  },
  endingEntry() {
    const f = G.flags; const b = G.bequests || {}; const left = Object.values(b).reduce((a, v) => a + v, 0);
    if (!f.manager && !f.cureKnown) return null;
    let line = '';
    if (f.vp || f.vpShifts) line += `Vice President of Operations. ${f.vpShifts || 0} days in the corner office; you cut ${f.cutCount || 0} people${f.amosCut ? ', Amos among them' : f.foremanCut ? ', Kowalski among them' : ''}. `;
    else if (f.manager) line += `You made shift lead at Morrow Freight and worked ${f.managerShifts || 0} twelve-hour days in a trailer. `;
    if (f.vpFired) line += 'You lost the chair the day you brought the owner a list with no faces on it. ';
    if (f.lateDays) line += `${f.lateDays} morning${f.lateDays > 1 ? 's' : ''} you were late because you stopped for someone. `;
    if (f.curePaid && f.cureRefunded) line += 'You raised the Halvorsen deposit. The cohort closed before your name came up; the money came back on day ' + f.cureRefundDay + '. ';
    else if (f.curePaid) line += f.cureLetter ? 'You paid the Halvorsen deposit. The cohort closed; the money sat in a drawer at the clinic and you never went to collect it. ' : 'You paid the Halvorsen deposit. The letter about the cohort arrived after you did not. ';
    if (f.nanoPaid) line += `Fifty thousand for the nanobot protocol, ${f.nanoShots || 0} shot${f.nanoShots === 1 ? '' : 's'} in the arm every other day. ${f.nanoReveal ? 'The scans never moved. ' : 'The scans were due the week you died. '}The money did not come back. `;
    else if (f.cureKnown && f.manager) line += `Halvorsen wanted $${CURE_COST}. You got to $${Math.max(G.money, f.peakMoney || 0)}. `;
    if (left > 0) line += `You left $${left} behind in envelopes: ${Object.keys(b).map(k => ({ mei: "Mei's school", nadia: "Nadia's rent", amos: "Amos's room", walter: "Walter's stone", nora: "Nora's fund", clinic: 'the clinic', ortega: 'Mrs. Ortega', busker: 'the busker' })[k]).join(', ')}.`;
    else if (G.money >= 500) line += `You died with $${G.money} in a coffee can. Nobody knew it was there.`;
    else if (f.manager) line += 'The money went where money goes.';
    return { name: 'The money', line: line.trim(), bad: left === 0 && (G.money >= 500 || (f.manager && !f.curePaid)) };
  }
};

// ---------- DOCTOR (rewritten with the "other option") ----------
Doctor.menu = function () {
  const f = G.flags;
  const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }];
  items.push({ t: 'Refill the prescription', r: '$20', disabled: () => G.money < 20 || G.pills > 10, do: () => { if (spend(20)) { G.pills += 30; UI.toast(`pills: ${G.pills}`, '#8ab0d8'); Dlg.run([say('doctor', G.day - (G.lastPill || 1) >= 3 ? "Thirty more. You stopped taking them for a while; your chest told me before you did. Two a day. They're not a cure. They're a quieter day." : "Thirty more. Two a day, with water, not coffee. I know it's coffee.")]); } } });
  if (f.cureKnown && !f.curePaid) items.push({ t: 'Pay the Halvorsen deposit', r: `$${CURE_COST}`, disabled: () => G.money < CURE_COST, do: () => this.pay() });
  items.push({ t: 'Leave', do: () => { } });
  Menu.open('Dr. Okafor', items, { sub: f.cureKnown && !f.curePaid ? `Halvorsen Clinic: $${G.money} of $${CURE_COST}.` : '' });
};
Doctor.pay = function () {
  const f = G.flags; if (!spend(CURE_COST)) return; f.curePaid = true; f.curePaidDay = G.day; remember('cure_paid');
  Dlg.run([narr('A cashier\'s check, because nobody counts out twenty thousand dollars on a desk. She reads the number twice.'), say('doctor', "I'll wire it today. They'll put you in the queue for the next cohort. I want you to hear me say 'queue.'"), you("I heard."), say('doctor', "Whatever you did to get this, your bloodwork paid for it. I want you sleeping eight hours and eating twice a day until we hear back. That's the prescription."), { fn: () => { useEnergy(5); } }]);
};
Doctor.talk = function () {
  const d = G.day; const f = G.flags; const L = []; if (!talkEnergy()) return; f.docTalks = (f.docTalks || 0) + 1;
  if (!f.cureKnown) {
    f.cureKnown = true; remember('cure_known');
    L.push(say('doctor', "You came in. Good. Most people don't come back after the first conversation."), say('doctor', "The trial is still recruiting. If it opens to your cohort, you're first on my list. That's the free option and it's slow."),
      say('doctor', "There's another option. I'm obligated to tell you about it and I'm going to tell you what I think of it in the same breath."),
      say('doctor', "Halvorsen Clinic, upstate. Compassionate-use program, same compound, smaller cohort, faster. Not covered. Twenty thousand for the deposit, and the deposit gets you a place in line, not a chair."),
      choice({ t: "Twenty thousand.", do: () => [say('doctor', "Twenty thousand. I know what you make. I'm not telling you to get it. I'm telling you it exists, because if I didn't and you found out later, you'd never trust me again.")] },
        { t: "What do you think of it?", do: () => [say('doctor', "I think it's real and I think it's a lottery and I think people sell things to get lottery tickets. I think you should eat. That's what I think.")] },
        { t: "How would I even get that?", do: () => [say('doctor', "People find ways. Most of them involve sleeping less, and I'll see it in your numbers inside a week. If you do it, do it eating.")] }),
      say('doctor', "Eat. I know it's expensive. Eat anyway."));
  }
  else if (f.curePaid && !f.cureRefunded) L.push(say('doctor', pick(["Halvorsen has the deposit. No word on the cohort. I call every Tuesday.", "Nothing yet. The coordinator says 'soon' in a voice I don't like.", "Your weight's down again since you paid them. Go home. Eat something with fat in it."])));
  else if (f.cureRefunded) L.push(say('doctor', pick(["I'm sorry about Halvorsen. I said 'queue.' I hoped I was wrong.", "Rest. Keep the pills up. Come in the minute the breathing changes at night."])));
  else if (G.day - (G.lastPill || 1) >= 4 && !f.docPillNag) { f.docPillNag = true; L.push(say('doctor', "You stopped taking the pills. I can hear it. They don't fix anything, I told you that, but a day without coughing is a day you can spend on something. Take them.")); }
  else if (d < 40) L.push(say('doctor', fresh('doctor', ["No news on the trial. No news is not bad news. It's just no news.", "Halvorsen's still taking deposits. I'm still not telling you to.", "Your weight's down. Are you sleeping? Are you eating?", f.manager ? "Shift lead, I heard. Twelve-hour days. Your bloodwork agrees with me that this is a bad idea." : "Your bloodwork is better than I expected this month. I don't know why. Keep doing whatever you're eating."])));
  else if (d < 60) { if (!f.docDelay) { f.docDelay = true; L.push(say('doctor', "Sit down."), say('doctor', "The public trial's been pushed. Funding. Six months, they say. Maybe more."), say('doctor', "I'm sorry. I know what I said. I know what that number was for you."), say('doctor', "Halvorsen is still there. I'm still not recommending it. I'm telling you it's still there."), choice({ t: "I figured.", do: () => [say('doctor', "You're taking this better than I am.")] }, { t: "So it's Halvorsen or nothing.", do: () => [say('doctor', "The public trial isn't nothing. It's slow. Slow is not the same as nothing, medically. Keep your weight up so you're eligible for either.")] })); } else L.push(say('doctor', fresh('doctor', ["Nothing new. I'm sorry.", "Your oxygen is down two points from last month. I want you sitting more and walking less. I know that's not how the street works."]))); }
  else if (d < 90) L.push(say('doctor', fresh('doctor', ["Your lungs are worse. I'd tell you to rest, but I don't think you'd listen.", "I can give you something for the cough. It won't fix anything. It'll help you sleep.", "You know where we are now. I won't pretend otherwise. Is there anyone I should call, when it's time?", f.manager && !f.curePaid ? "Still doing twelve-hour days? Your lungs can't afford twelve. Six. I'll write it down if that helps." : "Halvorsen closes deposits at the end of the month. I'm telling you that as a fact, not a suggestion."])));
  else L.push(say('doctor', "There is nothing left in my bag that changes this. Keep warm. Keep the pills up. If the breathing gets worse at night, come in, any hour; I'll leave word at the desk."));
  Dlg.run(L);
};

// ---------- post-it on the kitchenette ----------
function readNote() {
  const f = G.flags; f.noteRead = true;
  Dlg.run([narr('A yellow post-it, curling at the corner, stuck to the cabinet above the sink. Your handwriting, from before.'), narr('"OKAFOR - TUES. Update on the trial. Ask about THE OTHER OPTION. Bring the letter."'), narr(f.cureKnown ? 'You asked. Twenty thousand. You have not taken the note down.' : 'The clinic is up the street, past the diner and the bus stop. Blue door with a cross.')]);
}
// refund / wake events for the ladder
function ladderWake() {
  const f = G.flags; const d = G.day;
  f.peakMoney = Math.max(f.peakMoney || 0, G.money);
  if (f.curePaid && !f.cureLetter && d >= f.curePaidDay + 9 && d <= 96) {
    f.cureLetter = true; f.cureLetterDay = d; remember('cure_letter');
    Dlg.run([narr('An envelope under the door with a clinic\'s letterhead. You know before you open it, the way you always know.'), narr('"...regret to inform you that the current compassionate-use cohort has closed to new enrollment. Your deposit has been returned in full to the referring physician\'s office. Please contact Dr. Okafor to..."'), narr('Twenty thousand dollars, somewhere in a drawer up the street. You fold the letter along its own creases.')]);
  }
  else if (f.manager && d === f.managerDay + 6 && Amos.present() && G.chars.amos.met) Dlg.run([narr('Amos, on the stoop, as you leave at a quarter to six: "You\'ve got the office walk now." He does not say it unkindly. He does not say it kindly either.')]);
  else if (f.manager && d === f.managerDay + 14 && G.chars.nora && G.chars.nora.met && !G.chars.nora.cold) Dlg.run([say('nora', "Twelve-hour days. I know what twelve-hour days do. I do them. I'm allowed; I'm not dying."), say('nora', "Whatever the number is, it's not worth the days. I'm saying that as a nurse and as the wall.")]);
}
