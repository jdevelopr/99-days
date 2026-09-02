// ============================================================
// VP of Operations: The Cuts. Lateness rules for office shifts.
// ============================================================
SPECS.playerVP = { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#26262e', shoes: '#1a1a1e', coat: '#2a2a34', tie: '#5a2a3a' };
SPECS.playerVPLate = { skin: '#cfae96', hair: '#3a2a22', hairStyle: 'short', shirt: '#e8e8f0', pants: '#26262e', shoes: '#1a1a1e', coat: '#2a2a34', tie: '#5a2a3a', scarf: '#8a3a3a' };
playerSpec = function () { const f = G.flags; if (f.vp) return G.day >= 60 ? 'playerVPLate' : 'playerVP'; if (f.manager) return G.day >= 60 ? 'playerManagerLate' : 'playerManager'; return G.day >= 60 ? 'playerLate' : 'player'; };

// any conversation with a person marks the day; office shifts after that are "late"
function markTalked() { G.flags.talkedToday = true; }
const _talkEnergy = talkEnergy;
talkEnergy = function (n) { const ok = _talkEnergy(n); if (ok) markTalked(); return ok; };

const FOREMAN_NAME = 'Ray Kowalski', WORKER_NAME = 'Danny Pruitt';
const STRANGERS = [
  ['Luis Ortega', 'forklift', 'Two kids. Never late.'], ['Kim Tran', 'receiving', 'Nine years. Bad back.'], ['Dwayne Hill', 'night watch', 'Sleeps in his car some nights.'],
  ['Sofia Marks', 'dispatch', 'Just started. Fast.'], ['Bill Yancey', 'yard', 'Six months from pension.'], ['Ana Reyes', 'receiving', 'Owner\'s niece.'],
  ['Tomas Vela', 'forklift', 'Union rep. Owner circled this one.'], ['Gary Pole', 'yard', 'Late four times in March.'], ['Priya Nair', 'dispatch', 'Does two people\'s jobs.'],
  ['Hal Brenner', 'night watch', 'Drinks. Everybody knows.'], ['Mo Farouk', 'receiving', 'Sends money home.'], ['Cass Whitlow', 'yard', 'Twenty-two. Wants to be a nurse.'],
];

// ---------- THE CUTS ----------
class CutsGame {
  start() {
    this.t = 0; this.intro = 170; this.over = 0; this.i = 0; this.cut = []; this.kept = []; this.saved = 0; this.bonus = 0; this.perFolder = 60 * 6; this.timer = this.perFolder;
    const R = seeded(G.day * 977 + 13); const a = G.chars.amos; const f = G.flags;
    const folders = [];
    const pool = STRANGERS.slice().sort(() => R() - 0.5).slice(0, 8);
    for (const [name, role, note] of pool) { const hrs = 30 + Math.floor(R() * 20), wage = 14 + Math.floor(R() * 9); const cost = hrs * wage; folders.push({ name, role, note, hrs, wage, cost, bonus: Math.round(cost * 0.03 / 5) * 5, known: null }); }
    if (!f.foremanCut) folders.push({ name: FOREMAN_NAME, role: 'foreman', note: 'Twenty years. Owner: "expensive."', hrs: 50, wage: 26, cost: 1300, bonus: Math.round(1300 * 0.06 / 5) * 5 + 50, known: 'foreman' });
    if (!f.workerCut) folders.push({ name: WORKER_NAME, role: 'day labor', note: 'Smoke breaks. Talks about you.', hrs: 40, wage: 15, cost: 600, bonus: Math.round(600 * 0.06 / 5) * 5 + 50, known: 'worker' });
    if (a.job === 'dock' && Amos.present() && !f.amosCut) folders.push({ name: 'Amos D. Reed', role: 'day labor', note: 'Hired off a day sheet. Back problems.', hrs: 40, wage: 15, cost: 600, bonus: Math.round(600 * 0.06 / 5) * 5 + 70, known: 'amos' });
    this.folders = folders.sort(() => R() - 0.5);
    this.target = Math.round(folders.reduce((s, x) => s + x.cost, 0) * 0.28 / 50) * 50;
    this.base = 120;
    // from the second VP shift on, the owner demands at least one of the foreman's people; meeting it doubles the bonus, failing it costs the chair
    this.requireKnown = (f.vpShifts || 0) >= 1 && folders.some(x => x.known);
  }
  decide(cut) {
    const fo = this.folders[this.i]; if (!fo) return;
    if (cut) { this.cut.push(fo); this.saved += fo.cost; this.bonus += fo.bonus; Audio.tone(220, 0.12, 'sawtooth', 0.03, 0.6); } else { this.kept.push(fo); Audio.tone(600, 0.06, 'triangle', 0.03); }
    this.i++; this.timer = this.perFolder;
    if (this.i >= this.folders.length) { this.over = 170; this.knownCut = this.cut.some(x => x.known); this.doubled = this.requireKnown && this.knownCut; this.pay = this.base + this.bonus * (this.doubled ? 2 : 1) + (this.saved >= this.target ? 40 : 0); }
  }
  update() {
    if (this.intro > 0) { this.intro--; if (Input.anyHit()) this.intro = 0; return; }
    if (this.over > 0) { this.over--; if (this.over === 0 || Input.hit('act')) endMinigame(this.pay, [`${this.cut.length} cut, ${this.kept.length} kept`, `$${this.saved} saved of $${this.target}`]); return; }
    this.t++; this.timer--;
    if (this.timer <= 0) this.decide(false); // undecided folders stay
    if (Input.hit('left')) this.decide(false); if (Input.hit('right')) this.decide(true);
    if (Input.tap) { if (Input.tap.x < W / 2) this.decide(false); else this.decide(true); }
  }
  draw(g, t) {
    mgFrame(g, 'PAYROLL REVIEW - CORNER OFFICE', `folder ${Math.min(this.i + 1, this.folders.length)}/${this.folders.length}   saved $${this.saved} / $${this.target}   bonus $${this.bonus}`);
    // desk
    px(g, 40, 200, W - 80, 40, '#4a3424'); px(g, 40, 200, W - 80, 2, '#6a4a34');
    // window behind: the dock at dusk
    px(g, 60, 44, 150, 60, '#2a3a50'); px(g, 62, 46, 146, 56, '#3a4a60'); px(g, 62, 84, 146, 18, '#2a2a30'); for (let i = 0; i < 6; i++) px(g, 70 + i * 22, 88, 14, 10, '#8a6a3a');
    drawText(g, 'MORROW FREIGHT', 135, 50, '#5a6a80', { align: 'center' });
    // owner's memo
    UI.panel(g, 250, 44, 190, 44, 0.9); drawText(g, 'FROM THE OWNER', 258, 50, '#e8c84a'); drawText(g, `Payroll is fat. Trim $${this.target}/wk.`, 258, 60, '#c8ccd8'); if (this.requireKnown) { drawText(g, 'One of Kowalski\'s people. Minimum.', 258, 70, '#e86a6a'); drawText(g, 'Do it: double bonus. Don\'t: the chair.', 258, 80, '#e86a6a'); } else { drawText(g, 'Bonus: a cut of what you save.', 258, 70, '#8a92a4'); drawText(g, 'Bigger cut for the ones he hides.', 258, 80, '#8a92a4'); }
    // folder
    const fo = this.folders[this.i];
    if (fo && this.over === 0) {
      const fx = 120, fy = 104, fw = 240, fh = 92;
      px(g, fx + 3, fy + 3, fw, fh, 'rgba(0,0,0,0.4)'); px(g, fx, fy, fw, fh, '#d8c8a0'); px(g, fx, fy, fw, 8, '#c8b088'); px(g, fx, fy, 60, 8, '#b8a078');
      drawText(g, 'PERSONNEL', fx + 4, fy + 1, '#5a4a30');
      drawText(g, fo.name, fx + 10, fy + 14, fo.known ? '#8a2a2a' : '#2a2a2a'); drawText(g, fo.role, fx + fw - 10, fy + 14, '#5a5a5a', { align: 'right' });
      px(g, fx + 10, fy + 24, fw - 20, 1, '#a89870');
      drawText(g, `${fo.hrs} hrs/wk   $${fo.wage}/hr   $${fo.cost}/wk`, fx + 10, fy + 30, '#3a3a3a');
      const note = wrapText('"' + fo.note + '"', fw - 20); note.forEach((ln, k) => drawText(g, ln, fx + 10, fy + 42 + k * 9, '#4a4a5a'));
      px(g, fx + 10, fy + 64, fw - 20, 1, '#a89870');
      drawText(g, `bonus if cut: $${fo.bonus}  (${fo.known ? '6% of savings + a premium' : '3% of savings'})`, fx + 10, fy + 70, fo.known ? '#a83030' : '#6a5a30');
      if (fo.known) drawText(g, 'you know this one', fx + fw - 10, fy + 70, '#a83030', { align: 'right' });
      // timer
      px(g, fx, fy + fh - 3, fw, 3, '#8a7a50'); px(g, fx, fy + fh - 3, Math.round(fw * this.timer / this.perFolder), 3, this.timer < 90 ? '#d84a4a' : '#5a8a5a');
      // stamps
      UI.panel(g, 60, 208, 100, 22, 0.9); drawText(g, '< LEFT: KEEP', 110, 215, '#8ae88a', { align: 'center' });
      UI.panel(g, 320, 208, 100, 22, 0.9); drawText(g, 'RIGHT: CUT >', 370, 215, '#e86a6a', { align: 'center' });
      drawText(g, 'undecided folders are kept', W / 2, 218, '#5a6070', { align: 'center' });
    }
    if (this.intro > 0) { UI.panel(g, W / 2 - 150, 100, 300, 50, 0.95); drawText(g, 'The owner wants payroll down. Every folder is a person.', W / 2, 106, '#f0ead8', { align: 'center' }); drawText(g, 'LEFT keeps them. RIGHT cuts them and pays you a bonus.', W / 2, 116, '#c8ccd8', { align: 'center' }); drawText(g, 'The bonus is biggest for the ones you know.', W / 2, 126, '#e86a6a', { align: 'center' }); drawText(g, 'Any key to start.', W / 2, 138, '#8a92a4', { align: 'center' }); }
    else if (this.over > 0) { UI.panel(g, W / 2 - 120, 100, 240, 50, 0.95); drawText(g, this.saved >= this.target ? 'The owner is pleased.' : 'The owner is not pleased.', W / 2, 106, '#e8c84a', { align: 'center' }); drawText(g, `${this.cut.length} cut. $${this.saved} saved.`, W / 2, 118, '#f0ead8', { align: 'center' }); drawText(g, `$${this.base} + $${this.bonus} bonus${this.doubled ? ' x2' : ''}${this.saved >= this.target ? ' + $40 target' : ''}  =  $${this.pay}`, W / 2, 130, '#c8ccd8', { align: 'center' }); if (this.requireKnown && !this.knownCut) drawText(g, 'No faces on the list.', W / 2, 142, '#e86a6a', { align: 'center' }); }
  }
}

// ---------- VP logic ----------
const VP = {
  take() { G.flags.vp = true; G.flags.vpDay = G.day; remember('ladder_vp'); G.wardrobe = G.wardrobe || {}; G.wardrobe.vpsuit = 1; G.outfit = 'vpsuit'; clearPortrait('you'); UI.toast('the VP suit: added to your wardrobe', '#c8ccd8'); },
  offerReady() { const f = G.flags; return f.manager && !f.vp && !f.vpOffered && (f.managerClean || 0) >= 4; },
  offer() {
    G.flags.vpOffered = true;
    return [narr('A car you have never seen idles at the dock. The owner. Cufflinks. He does not come into the trailer; you are sent out to him.'),
      say('owner', "Kowalski says you don't drop things and you don't talk. I've got a corner office nobody's sitting in since Halvorsen took my last one."),
      say('owner', "Vice President of Operations. Hundred and twenty a day, plus bonus. The bonus is the job: I need payroll down, and I need somebody who can look at a folder and not see a face."),
      choice({ t: "I'll take it.", do: () => { VP.take(); return [say('owner', "Good. Nine sharp. Not six; executives don't do six. If you're late, somebody else sits in the chair that day. There's always somebody else."), narr('Vice President. You say it once on the walk home to see how it sounds. It sounds like somebody else.')]; } },
        { t: "No.", do: () => [say('owner', "Then keep typing. Offer's open until it isn't.")] })];
  },
  askAgain() { return [say('owner', "Chair's still empty."), choice({ t: "I'll take it.", do: () => { VP.take(); return [say('owner', "Nine sharp."), narr('A suit, from a closet on the second floor of the office. It fits somebody. It is in your wardrobe now.')]; } }, { t: 'Never mind.', do: () => [] })]; },
  shift() {
    startMinigame('cuts', (pay, lines) => {
      useEnergy(70); addHunger(-20); const f = G.flags; f.vpShifts = (f.vpShifts || 0) + 1; addMoney(pay); f.lateStreak = 0;
      const cur = MG.last; const L = [narr(lines.join('. ') + '.')];
      // consequences
      const cutNames = cur ? cur.cut : [];
      f.cutCount = (f.cutCount || 0) + cutNames.length;
      for (const fo of cutNames) {
        if (fo.known === 'foreman') { f.foremanCut = true; remember('cut_foreman'); L.push(narr('Kowalski clears out his trailer in twenty minutes. Twenty years fits in a milk crate. He does not look at the office window, which is worse than if he had.')); }
        if (fo.known === 'worker') { f.workerCut = true; remember('cut_worker'); L.push(narr('Pruitt is gone by lunch. He leaves his gloves on the crate where he took his breaks.')); }
        if (fo.known === 'amos') { f.amosCut = true; const a = G.chars.amos; a.job = null; a.cutByYou = true; a.spec = a.room ? 'amos3' : 'amos3'; a.stage = Math.min(a.stage, 3); clearPortrait('amos'); a.trust -= 8; remember('cut_amos'); L.push(narr("Amos's name is on the sheet in your handwriting. You wrote it there to hire him. You initial next to it to let him go.")); }
      }
      if (cur && cur.requireKnown && !cur.knownCut) {
        f.vp = false; f.vpOffered = false; f.managerClean = 0; f.vpFired = true; remember('vp_fired'); if (G.outfit === 'vpsuit') G.outfit = null; clearPortrait('you');
        L.push(say('owner', "No faces. I said one of Kowalski's people and you brought me a list of strangers."), say('owner', "The chair's not for people who can't. Kowalski can have you back on the terminal. Suit stays; it's mine."), narr('Vice President for as many days as you could stand it. The terminal is where you left it.'));
      }
      else if (cur && cur.doubled) L.push(say('owner', "Now that's a VP. One of his own. Doubled it, like I said. Same time tomorrow, and I'll want another."));
      else if (cutNames.length === 0) L.push(say('owner', "Zero. You cut zero. You know what that costs me? You know what it costs you? Look at your envelope. Now look at the door."), say('owner', "Tomorrow I want one of Kowalski's people on the list. One. Or the chair's got somebody else in it."));
      else if (cutNames.some(x => x.known)) L.push(say('owner', "Now that's a VP. The hard ones. Those pay. Same time tomorrow."));
      else if ((f.vpShifts || 0) === 1) L.push(say('owner', "Strangers. Fine, for a first day. Tomorrow I want one of Kowalski's people on the list. One, minimum. Do that and I double the bonus. Don't, and the chair's got somebody else in it."));
      else L.push(say('owner', fresh('owner', ["Payroll's lighter. Tomorrow, nine."])));
      Dlg.run(L);
    });
  }
};
SPEAKERS.owner = { name: 'The Owner', color: '#c8a850', spec: 'man1' };
// remember the last minigame instance so the callback can read its results
const _endMG = endMinigame;
endMinigame = function (pay, lines) { MG.last = MG.cur; _endMG(pay, lines); };
