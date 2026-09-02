// ============================================================
// The phone on the apartment wall: Jo (a sister), the clinic desk, people who have the number, wrong numbers
// Answering never counts as "talking" for the office shifts; it cannot make you late.
// ============================================================
SPECS.jo = { skin: '#dcae88', hair: '#3a2a22', hairStyle: 'long', shirt: '#7a4a4a', pants: '#3a3a44', shoes: '#2a2420', coat: '#5a5a6a' };
SPEAKERS.jo = { name: 'Jo', color: '#d8a8a0', spec: 'jo' };
SPEAKERS.desk = { name: 'Front desk', color: '#a8b8c8', sprite: 'phone' };
SPEAKERS.voice = { name: 'Voice', color: '#8a92a4', sprite: 'phone' };
SPEAKERS.phone = { name: 'Phone', color: '#8a92a4', sprite: 'phone' };
S('phone', [
  'BBBBBBB.b',
  'BbbbbbB.b',
  'BbkkkbB.b',
  'BbbbbbBbb',
  'BbrrbbB.b',
  'BbbbbbB.b',
  'BbrrbbB.b',
  'BbbbbbB.b',
  'BbrrbbB.b',
  'BbbbbbB.b',
  'BBBBBBBbb',
  '.....bkkb',
  '.....bbbb'], { B: '#d0c8b8', b: '#b8b0a0', k: '#3a3a40', r: '#6a6a72' });
S('ring', ['..Y..', '.YYY.', '.YYY.', 'YYYYY', '..Y..'], { Y: '#f8e88a' });

const PHONE_X = 242, PHONE_Y = 170;   // on the wall between the window and the calendar

const WRONG_NUMBERS = [
  [say('voice', "Raymond? Raymond Kessel? This is Beacon Recovery regarding an outstanding..."), choice({ t: "Wrong number.", do: () => [say('voice', "Sir, if you are Mr. Kessel, hanging up does not..."), narr('You hang up. Somewhere, Raymond Kessel is still not answering.')] }, { t: "He moved.", do: () => [say('voice', "Do you have a forwarding..."), you("No."), narr('A pause in which you can hear the office behind him. A hundred phones, a hundred Raymonds.')] })],
  [say('voice', "...is your refrigerator running?"), narr('Giggling. Two kids, maybe three. Somebody says "hang UP, hang UP."'), you("Yeah. It's running."), say('voice', "Then you better go CATCH it!"), narr('They hang up shrieking. You laugh. It hurts, in the chest, and you do it anyway.')],
  [narr('Breathing. Nothing else. Rain on their end too, from the sound.'), say('voice', "Sorry. Sorry, wrong number."), you("It's okay."), say('voice', "...You sound. Are you alright?"), you("Fine."), narr('Click. You stand with the receiver a while, listening to the dial tone, which is at least a sound.')],
  [say('voice', "Hi there, this is a courtesy call regarding your account. Please stay on the line for..."), narr('A recording, cheerful as a hospital. You put the receiver down on the counter and let it talk to the room. It goes on for two full minutes.')],
  [say('voice', "Is Sunny there?"), you("No Sunny here."), say('voice', "She said this number."), you("She gave you the wrong one."), say('voice', "...Yeah. Yeah, she does that."), narr('He hangs up gently, like it was the phone\'s fault.')],
  [say('voice', "Good evening! On a scale of one to ten, how satisfied are you with your current..."), you("Ten."), say('voice', "That's wonderful! And how likely are you to..."), you("Ten."), narr('You hang up. Ten. Why not. Nobody is checking.')],
  [say('voice', "Mrs. Ortega? It's the pharmacy, your..."), you("Fourth floor. She's in 408."), say('voice', "This says 412."), you("It's wrong."), narr('You go knock on 408 later and tell her. She feeds you a tamale for it, which was not the point, and was.'), { fn: () => { addHunger(20); G.flags.grannyPhone = true; } }],
];

const Jo = {
  init() { return { stage: 0, calls: 0, missed: 0, missedRow: 0, hungUp: 0, nextDay: 3, stopped: false, stoppedDay: 0, lastCall: false, coming: false, visitDay: 0, visited: false, money: false, declined: 0, kids: false, calledBack: 0, callDay: 0, ringDays: [] }; },
  J() { const P = Phone.P(); if (!P.jo) P.jo = this.init(); return P.jo; },
  // the call itself; callback = you dialed her
  call(callback) {
    const j = this.J(); const L = []; j.calls++; j.missedRow = 0; j.callDay = G.day; if (callback) j.calledBack++;
    const hang = { t: "Hang up.", do: () => { j.hungUp++; if (j.stage === 0) j.stage = 1; j.nextDay = G.day + irnd(4, 6); if (j.hungUp >= 2) j.lastCall = true; remember('jo_hungup'); return [narr('You put the receiver back. The room is exactly as quiet as it was.'), { fn: () => { Dlg.steps.length = Dlg.i; } }]; } };
    if (j.stopped) {
      j.stopped = false; j.hungUp = 0; j.lastCall = false; j.nextDay = G.day + 5; remember('jo_calledback');
      L.push(say('jo', "..."), say('jo', "I said I'd stop. I didn't say I'd stop answering."), you("I know."), say('jo', "Okay. Okay. Tell me something. Anything. Tell me what you ate today."), narr('You tell her. It takes a while, because she keeps asking what else.'), { fn: () => { j.stage = Math.max(j.stage, 2); } });
      Dlg.run(L); return;
    }
    if (j.lastCall) {
      j.lastCall = false; j.stopped = true; j.stoppedDay = G.day; remember('jo_stopped');
      L.push(say('jo', "I'm going to stop calling. Not because I want to."), say('jo', "You know the number. It's the same number. It's been the same number for eleven years."), narr('She waits. You could say something. The dial tone comes before you decide.'));
      Dlg.run(L); return;
    }
    if (callback) L.push(say('jo', j.calls === 1 ? "Hello?" : "You called. You never call. Hang on, let me sit down."));
    if (j.stage === 0) {
      L.push(callback ? narr('A long pause when you say who it is.') : say('jo', "...It's Jo."), narr('Six years. Her voice is the same and it is not the same; there is a kid somewhere behind it, and a television.'),
        say('jo', "The clinic called me. I'm still your emergency contact. Nobody changed it."),
        choice({ t: "It's true.", do: () => [say('jo', "Ninety-nine days. They said a number. I made them say it twice."), say('jo', "I'm not going to... I don't know what I'm going to do. I'm going to call again. You can not pick up. I'm going to call.")] },
          { t: "You shouldn't have that number.", do: () => [say('jo', "I didn't ask for it. I'm not calling to fight. I've had six years to call to fight and I didn't."), say('jo', "I'm going to call again. That's all. That's all this is.")] },
          hang),
        { fn: () => { j.stage = 1; j.nextDay = G.day + irnd(5, 7); remember('jo_call'); } });
    }
    else if (j.stage === 1) {
      L.push(say('jo', "I've been thinking about what to say and it's all about the house, so I'm just going to say the house."), say('jo', "I sold it before you got there. I know. Dad wasn't cold and I had the realtor in the kitchen. You said that. You were right to say it."),
        choice({ t: "You were right to sell.", do: () => [say('jo', "...I was drowning. Micah was two. I was drowning and the house was the only thing that floated."), say('jo', "You could have said that six years ago."), you("So could you.")] },
          { t: "You sold it before he was cold.", do: () => [say('jo', "Yes."), say('jo', "Yes. I did. And I'd do it again and I'd hate it again. That's the whole truth; I don't have a better one.")] },
          { t: "It doesn't matter now.", do: () => [say('jo', "It matters. It's the only thing that's mattered for six years. Don't take it away from me just because you're... just because.")] },
          hang),
        say('jo', "Can I come? One day. I won't stay. I'll take the train and walk from the station and I'll leave before dark."),
        choice({ t: "Don't.", do: () => { j.declined++; return [say('jo', "Okay. Okay. I'll ask again. I'm going to keep asking; you should know that about me by now.")]; } },
          { t: "...Okay.", do: () => { j.coming = true; j.visitDay = G.day + irnd(4, 6); return [say('jo', "Okay. The 10:40. Don't clean anything. I mean that."), narr('She hangs up before you can change your mind. So do you.')]; } }),
        { fn: () => { j.stage = 2; j.nextDay = G.day + irnd(5, 7); } });
    }
    else if (j.stage === 2 && !j.coming && !j.visited) {
      L.push(say('jo', j.declined >= 2 ? "I'm not going to ask. I'm going to tell you about Micah instead, and you're going to listen, and that's a kind of visit." : "Same question. Can I come?"),
        j.declined >= 2 ? [say('jo', "He's eight. He asked what you look like. I said 'like Grandpa, but taller and worse at cards.' He said that's not possible. He's met you, is the thing; he was two."), { fn: () => { j.kids = true; } }] : choice({ t: "Don't.", do: () => { j.declined++; return [say('jo', "Alright. I've got the number. It doesn't wear out.")]; } },
          { t: "Come.", do: () => { j.coming = true; j.visitDay = G.day + irnd(4, 6); return [say('jo', "The 10:40. I'll walk. Don't come to the station; you'll try and I'll be angry."), { fn: () => remember('jo_coming') }]; } }, hang),
        { fn: () => { j.nextDay = G.day + irnd(5, 7); } });
    }
    else if (j.coming && !j.visited) {
      L.push(say('jo', G.day < j.visitDay ? `${j.visitDay - G.day === 1 ? 'Tomorrow' : 'Soon'}. The 10:40. I bought the ticket; you can't un-buy a ticket, I checked.` : "I'm on my way. I'm at the station. I'm calling from the station."), { fn: () => { j.nextDay = G.day + 5; } });
    }
    else {
      const pool = [
        [say('jo', "Micah lost a tooth. He wanted to mail it to you. I said uncles don't get teeth. He said that's not a rule."), { fn: () => { j.kids = true; } }],
        [say('jo', "I found Dad's cards. The deck with the ship on it. Every ace is bent; I don't know if that was him cheating or you."), you("Him."), say('jo', "That's what I said.")],
        [say('jo', "I'm not going to ask how you are. I'm going to ask what you ate."), narr('You tell her. She makes you say it twice, the way the clinic did with the number.')],
        [say('jo', "Do you remember the lake? Dad's cousin's place, the summer the dock fell in?"), you("I was on the dock."), say('jo', "You were on the dock. I have never laughed like that since. I've tried.")],
        [say('jo', "It's late there. I know. I couldn't sleep and the phone was right there and you were right there, sort of."), say('jo', "Go to bed. I'm going to stay on till you hang up. Go on.")],
        [say('jo', "Nothing. I've got nothing to say. I just wanted the line open a minute."), narr('The television behind her. A kid asking for something. Rain on your window. Nobody says anything, and it is the best call yet.')],
      ];
      L.push(j.calls % 2 ? pool[(j.calls >> 1) % pool.length] : say('jo', fresh('jo', [])), { fn: () => { j.nextDay = G.day + irnd(5, 7); } });
    }
    Dlg.run(L);
  },
  // she comes on the 10:40 (a wake event)
  visit() {
    const j = this.J(); j.visited = true; j.coming = false; j.stage = 4; j.nextDay = G.day + 5; remember('jo_visit'); clearPortrait('jo');
    const a = G.chars.amos; const L = [narr('A knock at ten past eleven. Not Amos; Amos knocks twice. This is one knock, and a long wait.'),
      say('jo', "Hi."), narr('She is grayer than six years should have made her. So, she is clearly thinking, are you.'),
      say('jo', "It's small."), you("It's enough."), say('jo', "It's not, but okay."),
      narr('She sits in the one chair. You sit on the bed. For a while it is the house and the funeral and the realtor in the kitchen, and then it is not, and neither of you can say exactly when that happened.')];
    if (a.met) L.push(say('jo', "The man on the stoop asked if I was your sister. I said yes. It's the first time I've said it out loud in six years."));
    if (G.chars.nora && G.chars.nora.met) L.push(say('jo', "Your neighbor. The nurse. She stopped me in the hall and asked if I was the sister. Everybody knows there's a sister. You told people there's a sister."));
    L.push(say('jo', "I brought this. Don't."), narr('An envelope, soft with handling.'), say('jo', "Half of Dad's coffee can. You never took your half. I've been carrying it six years; it's heavy; take it."),
      choice({ t: "Take it.", do: () => { j.money = true; addMoney(80); remember('jo_money'); return [narr('Eighty dollars in old twenties. You put it on the table by the pills. She watches you do it and does not say anything about the pills.')]; } },
        { t: "Keep it.", do: () => [say('jo', "I'll leave it under the... fine. Fine. I'll keep it. I'll keep it and I'll be back and I'll bring it again.")] }),
      say('jo', "The 4:10. I'll call Sunday. I'll call every Sunday; you'll get sick of it."), narr('She hugs you at the door, hard, once, the way their father did, and goes down the stairs without looking back because she cannot.'));
    Dlg.run(L);
  },
  endingLine() {
    const j = this.J(); const P = Phone.P();
    if (j.visited) return { name: 'Joanne', line: `Your sister. Six years of not calling, then a phone that would not stop. She took the 10:40 and sat in the one chair${j.money ? ' and left half of a coffee can on the table' : ''}. She called every Sunday after.` };
    if (j.stopped) return { name: 'Joanne', line: `Your sister called on day ${j.ringDays[0] || '?'}, and again, and again. On day ${j.stoppedDay} she said she was going to stop, and she did.`, bad: true };
    if (j.stage >= 2) return { name: 'Joanne', line: `You talked, ${j.calls} times, about the house and then about her kids and then about nothing. Nothing was the good part.` };
    if (j.stage === 1) return { name: 'Joanne', line: 'She called once and you let her talk. She is still your emergency contact. Nobody changed it.' };
    if (j.missed > 0) return { name: 'A sister', line: `The phone rang ${j.missed} time${j.missed > 1 ? 's' : ''}. You let it.`, bad: true };
    return null;
  }
};

const Phone = {
  init() { return { nextRing: 4, callToday: null, doneToday: false, attempts: 0, ringing: false, ringT: 0, delay: 0, wrongSeen: [], friends: {}, pillsCall: false, calledToday: 0, jo: Jo.init(), log: [] }; },
  P() { if (!G.phone) G.phone = this.init(); return G.phone; },
  // who has the number and something to say (each once)
  friendCall() {
    const f = G.flags, c = G.chars, P = this.P(); const opts = [];
    if (c.nadia.saved && c.nadia.savedStory && !P.friends.nadia) opts.push('nadia');
    if (c.nora && !c.nora.cold && (c.nora.person || c.nora.stage >= 2) && !P.friends.nora) opts.push('nora');
    if (c.mei.applied && !c.mei.accepted && !c.mei.cold && !P.friends.mei) opts.push('mei');
    if ((c.amos.job || c.amos.room) && !c.amos.dead && !P.friends.amos) opts.push('amos');
    if (c.emmett && c.emmett.mailed && !c.emmett.wrote && !P.friends.emmett) opts.push('emmett');
    if (c.sol && c.sol.met && c.sol.stage >= 2 && !c.sol.cold && !P.friends.sol) opts.push('sol');
    if (c.walter && c.walter.dead && c.walter.sat >= 3 && !P.friends.busker && f.buskerTips >= 2) opts.push('busker');
    return opts.length ? pick(opts) : null;
  },
  // decide at wake whether the phone will ring today, and who it is
  daily() {
    const P = this.P(); const j = Jo.J();
    if (P.callToday && !P.doneToday) this.missed(P.callToday);
    P.callToday = null; P.doneToday = false; P.attempts = 0; P.ringing = false; P.ringT = 0; P.calledToday = 0;
    if (G.pills > 10) P.pillsCall = false;
    let who = null;
    if (G.day >= 5 && G.pills <= 4 && !P.pillsCall) { who = 'clinic_pills'; P.pillsCall = true; }
    else if (G.day === 44) who = 'clinic_checkup';
    else if (j.coming && !j.visited && G.day === j.visitDay - 1) who = 'jo';
    else if (!j.stopped && G.day >= j.nextDay && !(j.coming && G.day >= j.visitDay)) who = 'jo';
    else if (G.day >= P.nextRing) { who = this.friendCall() || 'wrong'; P.nextRing = G.day + irnd(4, 6); }
    if (who === 'jo') { P.nextRing = Math.max(P.nextRing, G.day + 2); j.ringDays.push(G.day); }
    if (who) { P.callToday = who; P.delay = 100 + irnd(0, 140); }
  },
  update() {
    const P = G.phone; if (!P) return;
    if (P.ringing) {
      if (G.scene !== homeScene()) { this.giveUp(); return; }
      P.ringT++; if (P.ringT === 1 || P.ringT % 100 === 0) { Audio.tone(1040, 0.12, 'square', 0.025); setTimeout(() => Audio.tone(1040, 0.12, 'square', 0.025), 200); }
      if (P.ringT > 780) this.giveUp();
      return;
    }
    if (G.scene !== homeScene() || !P.callToday || P.doneToday || P.attempts >= 2) return;
    P.delay--; if (P.delay <= 0) { P.ringing = true; P.ringT = 0; }
  },
  giveUp() { const P = this.P(); P.ringing = false; P.attempts++; P.delay = 200 + irnd(0, 200); if (P.attempts >= 2) { this.missed(P.callToday); P.doneToday = true; } },
  missed(who) {
    const P = this.P(); const j = Jo.J(); P.log.push({ day: G.day, who, missed: true });
    if (who === 'jo') { j.missed++; j.missedRow++; j.nextDay = G.day + 3; if (j.stage >= 1 && (j.missedRow >= 2 || j.hungUp >= 2)) j.lastCall = true; if (j.stage === 0 && j.missedRow >= 3) { j.stopped = true; j.stoppedDay = G.day; } }
    else if (who === 'clinic_pills') P.pillsCall = false;
  },
  answer() {
    const P = this.P(); const who = P.callToday; P.ringing = false; P.doneToday = true; P.log.push({ day: G.day, who }); useEnergy(2); Audio.sel();
    if (who === 'jo') { Jo.call(false); return; }
    if (who === 'clinic_pills') { Dlg.run([say('desk', "Dr. Okafor's office. The doctor asked me to call: you're low on the suppressant, by our count. A refill is twenty dollars, walk-ins are fine."), say('desk', "She said to say: the cough gets worse and does not get better. That's a quote. I'm reading it off the chart.")]); return; }
    if (who === 'clinic_checkup') { Dlg.run([say('desk', "Dr. Okafor's office. She wants to see you tomorrow. It's the forty-five day check; it's on the chart."), say('desk', "Bring the bottle. She'll count.")]); return; }
    if (who === 'wrong') { const left = WRONG_NUMBERS.map((x, i) => i).filter(i => !P.wrongSeen.includes(i)); const i = left.length ? pick(left) : irnd(0, WRONG_NUMBERS.length - 1); P.wrongSeen.push(i); Dlg.run(WRONG_NUMBERS[i === 6 && G.day < 6 ? 4 : i]); return; }
    P.friends[who] = true; const c = G.chars;
    const lines = {
      nadia: [say('nadia', "It's Nadia. Sam's homework. Fractions. He says you know fractions. I said you were sick. He said sick people know fractions too."), say('nadia', "Come by. I'll feed you and he'll feed you fractions. That's the deal; I didn't make it, he did.")],
      nora: [say('nora', "It's Nora. I'm on the ward, I've got ninety seconds. Did you take the pills? Don't lie, I can hear it in the phone."), you("...Yes."), say('nora', "Liar. Take them. I'm coming home at seven and I'm going to listen at the wall for the cough. Eighty seconds. Bye.")],
      mei: [say('mei', "It's Mei. From the market. I got your number from Mrs. Ortega; don't ask how she has it."), say('mei', "The envelope came. From the program. I haven't opened it. I'm going to open it when you're at the counter, because if it's no I want somebody there, and if it's yes I want somebody there."), say('mei', "So. Come by. Whenever. Today.")],
      amos: [say('amos', c.amos.room ? "It's me. Amos. There's a phone in the boiler room; nobody told me, I found it. It works. I'm calling everybody I know, which is you." : "It's Amos. Foreman lets us use the office phone. I don't got anybody else to call. So I'm calling. That's all."), say('amos', "...That's all. I'll see you. I just wanted to hear it ring somewhere I know.")],
      emmett: [say('emmett', "Marina payphone. I've got four minutes of quarters. Did it go?"), you("It went. Blue box."), say('emmett', "..."), say('emmett', "Okay. Okay. That's all I wanted. Three minutes left; I'm going to stand here and not use them.")],
      sol: [say('sol', "Sol. Pawn and Loan. Your name's in the book, so you get a call."), say('sol', "Every January I call the names in the ledger. Forty-one years. Nobody's ever picked up. You picked up."), say('sol', "That's it. That's the call. Come in sometime; I'll show you the page.")],
      busker: [say('busker', "It's Cal. The busker. Nadia gave me the number; she gives everybody the number."), say('busker', "I wrote the old man a song. Walter. The one with the cane. I didn't know his name till you said it. I'm playing it Friday under the shelter. You should come. It's got a bus in it.")],
    };
    Dlg.run(lines[who] || [narr('A dial tone. Whoever it was is gone.')]);
  },
  // the phone when it is not ringing
  menu() {
    const P = this.P(); const j = Jo.J(); const items = [];
    if (j.stage >= 1 || j.stopped) items.push({ t: 'Call Jo', r: '-2 energy', disabled: () => P.calledToday >= 1 || G.energy < 2, do: () => { P.calledToday++; useEnergy(2); Audio.sel(); if (j.coming && j.visitDay === G.day) { Dlg.run([narr("It rings out. She is on the 10:40; there is nobody home to answer.")]); return; } Jo.call(true); } });
    items.push({ t: "Call the clinic", r: '-2 energy', disabled: () => G.energy < 2, do: () => { useEnergy(2); Audio.sel(); Dlg.run([say('desk', G.pills <= 0 ? "Dr. Okafor's office. You're out. Twenty for a refill; walk in, don't wait for a call." : G.pills <= 6 ? `Dr. Okafor's office. ${G.pills} left by our count. Twenty for a refill. Walk in.` : G.day >= 44 && G.day <= 46 ? "Dr. Okafor's office. She wants you in for the forty-five day check. Bring the bottle." : "Dr. Okafor's office. Nothing on the chart. Take the pills. Call if the cough changes.")]); } });
    items.push({ t: 'Hang it back up', do: () => { } });
    Menu.open('The phone', items, { sub: j.stopped ? 'She said she would stop. She did not say the number changed.' : j.stage >= 1 ? "Jo's number is on the wall in pencil. It always was." : P.log.length ? 'Beige. Older than the building. It works.' : 'Beige. Older than the building. It has not rung.' });
  },
  endingLines() { const out = []; const jl = Jo.endingLine(); if (jl) out.push(jl); return out; }
};
