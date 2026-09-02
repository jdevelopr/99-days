// ============================================================
// The LOST poster: Theo Marsh, 16. The busker is his brother, Cal.
// ============================================================
SPECS.theo = { skin: '#d8b090', hair: '#4a3a2a', hairStyle: 'messy', shirt: '#6a6a72', pants: '#2a2a34', shoes: '#c8c8c8', coat: '#6a6a72', hat: 'hood', hatColor: '#6a6a72' };
SPECS.theoEnd = { skin: '#d8b090', hair: '#4a3a2a', hairStyle: 'messy', shirt: '#6a6a72', pants: '#2a2a34', shoes: '#c8c8c8', coat: '#6a6a72' };
SPEAKERS.theo = { name: 'Theo', color: '#a8b8c8', spec: 'theo' };

const Theo = {
  init() { return { posterRead: false, calAsked: false, clues: {}, visits: 0, pushed: 0, gone: false, agreed: false, reunited: false, calNamed: false, spec: 'theo', foundDay: 0, lastVisit: 0 }; },
  ensure() { if (!G.chars.theo) G.chars.theo = this.init(); if (G.chars.theo.calNamed) SPEAKERS.busker.name = 'Cal'; },
  T() { this.ensure(); return G.chars.theo; },
  clueCount() { return Object.keys(this.T().clues).length; },
  // ---- the poster on the wall by the busker's corner ----
  readPoster() {
    const t = this.T(); useEnergy(1);
    if (!t.posterRead) { t.posterRead = true; t.posterDay = G.day; remember('theo_poster'); }
    if (t.reunited) { Dlg.run([narr('The poster is gone. A clean rectangle on the brick where it was, and four bits of tape.')]); return; }
    if (t.gone) { Dlg.run([narr('The poster is sun-faded now. THEO MARSH, 16. Somebody has re-taped one corner. Somebody keeps re-taping it.')]); return; }
    Dlg.run([narr('MISSING. THEO MARSH, 16. Grey hoodie, blue sneakers. Last seen Harlan St. & 4th, March 3rd. A phone number. A photo of a kid squinting at whoever held the camera.'),
      narr(G.day >= 3 ? 'The busker on the corner is standing exactly under it. He is always standing exactly under it.' : 'The tape is new. Somebody keeps this one up.'),
      { fn: () => { if (G.chars.theo.calAsked) return; } }]);
  },
  // ---- Cal (the busker) ----
  buskerItems(items) {
    const t = this.T();
    if (t.posterRead && !t.calAsked) items.splice(1, 0, { t: 'Ask about the poster', do: () => this.askCal() });
    if (t.agreed && !t.reunited) items.splice(1, 0, { t: 'Tell him about Theo', do: () => this.reunion() });
    else if (this.clueCount() >= 1 && t.calAsked && !t.agreed && !t.gone && !t.toldClues) items.splice(1, 0, { t: 'Tell him what you heard', do: () => this.tellClues() });
  },
  askCal() {
    const t = this.T(); if (!talkEnergy()) return; t.calAsked = true; t.calNamed = true; SPEAKERS.busker.name = 'Cal'; clearPortrait('busker'); remember('theo_cal');
    Dlg.run([say('busker', "That's my brother. Theo. I'm Cal, since you're asking."), say('busker', "Sixteen. He and our dad had it out in March, the big one, and he walked. Dad said he'd be back by dinner. That was four months ago."),
      say('busker', "This corner's the last place anybody saw him. So this is where I play. Somebody's got to be here if he comes back through, and it's not going to be Dad."),
      you("The police?"), say('busker', "Took a report. Sixteen-year-olds walk off all the time, they said. They'll call if he turns up in a hospital or a morgue. Those were the two options they gave me."),
      narr('He goes back to the guitar. The song is the same one as always. You had not noticed before that it is a lullaby.')]);
  },
  tellClues() {
    const t = this.T(); if (!talkEnergy()) return; t.toldClues = true;
    const c = t.clues; const L = [];
    if (c.amos) L.push(you("Amos says a kid in a grey hoodie slept in the alley by the dumpster in March. Went toward the river."));
    if (c.nora) L.push(you("A nurse I know saw a kid with a broken wrist at St. Anne's in April. Fake name. He asked about the shelter on 9th."));
    if (c.sam) L.push(you("Nadia's boy says a kid draws on the railing at the river with a marker. Early mornings."));
    if (c.dock) L.push(you("Somebody named T. Marsh is on the day-labor sheet at the dock. Cash. Tuesdays."));
    L.push(say('busker', "He's alive."), narr('Cal sits down on the wet curb like his legs have been cut.'), say('busker', "He's alive and he's ten blocks from here and he hasn't... okay. Okay. He doesn't want Dad. I get that. Does he know I'm out here?"), you("I don't know yet."), say('busker', "If you see him. If. Tell him it's just me. Tell him I'm not Dad."));
    Dlg.run(L);
  },
  reunion() {
    const t = this.T(); if (!talkEnergy()) return; t.reunited = true; t.spec = 'theoEnd'; remember('theo_reunited'); G.flags.buskerTips = Math.max(G.flags.buskerTips || 0, 3);
    UI.fadeOut(() => {
      G.px = STREET.spots.busker + 30; G.facing = -1; G.camX = clamp(G.px - W / 2, 0, STREET.w - W); t.atCorner = true; UI.fadeIn();
      Dlg.run([you("He's at the river. Mornings. He said he'd come if it was just you."), say('busker', "..."), narr('Cal does not go to the river. He does not move. He looks at the corner, at the poster, at the empty sidewalk where the street turns.'),
        narr('It takes eleven minutes. Then a grey hoodie comes around the corner from 4th with its hands in its pockets, walking like someone who has decided to walk.'),
        say('theo', "Hey."), say('busker', "Hey."), narr('That is all either of them can manage for a while. Then Cal takes the guitar off and puts it on the ground, which you have never seen him do, and they stand there on the corner holding on to each other in the rain.'),
        say('theo', "I'm not going home."), say('busker', "I know. I've got a couch. It's a bad couch."), say('theo', "Okay."),
        narr('Cal takes the poster down himself. He folds it small and puts it in the guitar case, under the coins.'),
        { fn: () => { t.atCorner = false; } }]);
    });
  },
  // ---- clues from people ----
  clueItem(who) {
    const t = this.T(); if (!t.posterRead || t.clues[who] || t.reunited || t.gone) return null;
    return { t: 'Ask about the missing kid', do: () => this.clue(who) };
  },
  clue(who) {
    const t = this.T(); if (!talkEnergy()) return; t.clues[who] = G.day; remember('theo_clue_' + who);
    const L = {
      amos: [say('amos', "Grey hoodie? Sixteen, maybe? Yeah. He slept in the alley by the dumpster three nights in March. Cold ones."), say('amos', "Took my spare blanket. I let him. Kid that age shouldn't be learning what I know about cardboard."), say('amos', "Last I saw him he went toward the river. Didn't look back. They never look back at that age; that's the whole trouble with them.")],
      nora: [say('nora', "A kid, sixteen, seventeen? Came into the ER in April with a wrist broken in two places. Said his name was 'Tom Miller.' Nobody's name is Tom Miller."), say('nora', "He left before the cast set. Asked the desk about the shelter on 9th first. I flagged the chart; nobody read the flag. Nobody reads the flags.")],
      sam: [say('kid', "The hoodie kid? He draws on the fence at the river. With a marker. Mom says that's vandalism. It's really good vandalism though."), say('kid', "He's there in the morning when Mom opens. Before school. He waved once.")],
      dock: [say('worker', "Marsh? There's a T. Marsh on the day sheet Tuesdays. Cash, no ID, foreman doesn't ask. Skinny kid, hood up. Stacks okay. Doesn't talk. You'd like him.")],
    }[who];
    Dlg.run(L);
    if (this.clueCount() >= 2 && !t.foundDay) t.foundDay = G.day;
  },
  // ---- Theo himself, at the railing ----
  where() {
    const t = this.T();
    if (t.reunited) { if (t.atCorner) return { scene: 'street', x: STREET.spots.busker + 16, spec: 'theoEnd' }; if (G.tod > 0.3 && G.tod < 0.9 && G.day % 2 === 0) return { scene: 'street', x: STREET.spots.busker + 18, spec: 'theoEnd' }; return null; }
    if (t.gone || this.clueCount() < 2 || G.day <= (t.foundDay || 0)) return null;
    if (G.tod < 0.22) return { scene: 'street', x: STREET.spots.river + 40, spec: 'theo' };
    return null;
  },
  talk() {
    const t = this.T(); if (!talkEnergy()) return; t.visits++; t.lastVisit = G.day;
    if (t.visits === 1) {
      Dlg.run([narr('A kid in a grey hoodie at the railing, a marker in one hand, drawing the far shore onto the rail one line at a time. He does not look up.'), say('theo', "If you're from Dad, no."), you("I'm not from anybody."), say('theo', "Everybody's from somebody."),
        choice({ t: "Your brother plays on the corner every day. Under your poster.", do: () => { t.knowsCal = true; return [say('theo', "..."), say('theo', "Cal's still there?"), you("Every day. Same song."), say('theo', "It's a lullaby. Mom used to... it's a stupid song."), narr('He caps the marker. Uncaps it.')]; } },
          { t: "You should go home.", do: () => { t.pushed++; return [say('theo', "You don't know what home is. You don't know anything."), narr('He is gone before you can answer, over the railing and along the bank.')]; } },
          { t: "Nice drawing.", do: () => [say('theo', "It's the bridge. It's not done. Nothing's done."), narr('You stand there a while. He keeps drawing.')] })]);
    } else if (t.visits === 2) {
      Dlg.run([say('theo', "You again."), say('theo', "I stack crates Tuesdays. The foreman pays cash and doesn't ask. I've got a spot at the shelter till the end of the month, then I don't."), you("And then?"), say('theo', "Then something."),
        choice({ t: "Cal has a couch.", do: () => [say('theo', "Cal has Dad. That's the thing about Cal, he's got Dad in the next room."), you("He's not at Dad's. He's got a place on 6th. Bad couch."), say('theo', "...Since when?"), you("Since March.")] },
          { t: "Go home. This isn't a life.", do: () => { t.pushed++; return [say('theo', "It's mine though."), narr('He pulls the hood up. The conversation is over.')]; } },
          { t: "What are you drawing today?", do: () => [say('theo', "The bridge again. I keep getting the middle wrong."), say('theo', "Cal draws. Drew. He's better. He stopped when Mom died. I didn't.")] })]);
    } else if (!t.agreed && t.pushed < 2) {
      t.agreed = true; remember('theo_agreed');
      Dlg.run([say('theo', "If it's just Cal."), narr("He says it to the railing, not to you."), say('theo', "Not Dad. Not the police. Not a 'surprise.' Just Cal, on the corner, and I walk up. If anybody else is there I'm gone and you won't find me twice."), you("Just Cal."), say('theo', "Tell him... tell him I know the song. Tell him that.")]);
    } else if (t.agreed) {
      Dlg.run([say('theo', fresh('theo', ["Did you tell him?", "I'm here every morning. Until I'm not.", "Just Cal. I meant that."]))]);
    } else {
      Dlg.run([say('theo', "..."), narr('He does not look up. The next morning the railing is bare and the drawing has been washed off, or scrubbed.'), { fn: () => { t.gone = true; remember('theo_gone'); } }]);
    }
    if (t.pushed >= 2 && !t.gone) { t.gone = true; remember('theo_gone'); }
  },
  cornerTalk() { if (!talkEnergy(2)) return; Dlg.run([say('theo', fresh('theo', ["Cal's couch is exactly as bad as advertised.", "I'm finishing the bridge. On paper this time.", "He plays a different song now. I don't know it. I think he's making it up.", "Thanks. I'm not going to keep saying it. Once."]))]); },
  endingLines() {
    const t = G.chars.theo; if (!t) return [];
    const out = [];
    if (t.reunited) out.push({ name: 'Theo & Cal Marsh', line: 'Sixteen and twenty-three. A bad couch on 6th. The poster is folded in the guitar case under the coins, and the song on the corner is a new one.' });
    else if (t.gone) out.push({ name: 'Theo Marsh, 16', line: t.pushed >= 2 ? 'You told him to go home. He went somewhere else instead. The railing is bare.' : 'You found him at the river and then you did not. The poster is still up, re-taped.', bad: true });
    else if (t.agreed) out.push({ name: 'Theo Marsh, 16', line: 'He said he would come if it was just Cal. You never told Cal. He is still at the railing some mornings, drawing the bridge.', bad: true });
    else if (this.clueCount() >= 1) out.push({ name: 'Theo Marsh, 16', line: `You collected ${this.clueCount()} of the pieces. ${t.calAsked ? 'Cal knows he is alive. That is more than he had.' : 'You never told his brother what you heard.'}`, bad: !t.calAsked });
    else if (t.calAsked) out.push({ name: 'Cal', line: 'The busker. His brother has been missing since March. He plays a lullaby under the poster every day. You asked; you did not look.', bad: true });
    else if (t.posterRead) out.push({ name: 'The poster on 4th', line: 'MISSING. THEO MARSH, 16. You read it once.', bad: true });
    else out.push({ name: 'The poster on 4th', line: 'LOST, in red. You never read it.', bad: true });
    return out;
  }
};
