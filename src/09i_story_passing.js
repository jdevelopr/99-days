// ============================================================
// Walking past people you know. Amos (street) and Nora (hall) notice.
// Four days of passing without a word and they stop you. The stop never counts as "talking" for the office shifts.
// ============================================================
const Passing = {
  init() { return { amos: { count: 0, day: 0, pending: false, talkedDay: 0, brushed: false, brushedDay: 0, stops: 0, lastSide: 0, scene: null }, nora: { count: 0, day: 0, pending: false, talkedDay: 0, brushed: false, brushedDay: 0, stops: 0, lastSide: 0, scene: null } }; },
  S() { if (!G.pass) G.pass = this.init(); return G.pass; },
  isBrushed(id) { const p = this.S()[id]; return !!(p && p.brushed); },
  talked(id) { const p = this.S()[id]; if (!p) return; p.talkedDay = G.day; p.count = 0; p.pending = false; },
  // crossing detection, every play frame
  update() {
    if (G.state !== 'play') return;
    const S = this.S();
    for (const id of ['amos', 'nora']) {
      const p = S[id]; const c = G.chars[id]; if (!c || !c.met || p.brushed) { p.lastSide = 0; continue; }
      const w = id === 'amos' ? Amos.where() : Nora.where();
      const home = id === 'amos' ? 'street' : 'hall';
      if (!w || w.scene !== G.scene || G.scene !== home) { p.lastSide = 0; p.scene = null; continue; }
      if (p.scene !== G.scene) { p.scene = G.scene; p.lastSide = 0; }
      const side = G.px > w.x + 6 ? 1 : G.px < w.x - 6 ? -1 : 0;
      if (side !== 0 && p.lastSide !== 0 && side !== p.lastSide) {
        // walked past
        if (p.talkedDay !== G.day && p.day !== G.day) {
          p.day = G.day; p.pending = true;
          if (p.count >= 3) { p.pending = false; p.talkedDay = G.day; this.stop(id, w); }
        }
      }
      if (side !== 0) p.lastSide = side;
    }
  },
  // leaving a scene (or the day ending) with a pass still pending makes it count
  leave() { const S = this.S(); for (const id of ['amos', 'nora']) { const p = S[id]; if (p.pending) { p.pending = false; if (p.talkedDay !== G.day) p.count++; } p.lastSide = 0; p.scene = null; } },
  daily() { this.leave(); },
  stop(id, w) {
    const p = this.S()[id]; p.stops++; G.walking = false; G.facing = w.x > G.px ? 1 : -1;
    const f = G.flags; const busy = f.vp ? 'The suit.' : f.manager ? 'The office.' : 'The days.';
    const brush = (lines) => ({ t: "I can't talk right now. I'm gonna be late for work.", do: () => { p.brushed = true; p.brushedDay = G.day; remember(id + '_brushed'); return lines; } });
    if (id === 'amos') {
      Dlg.run([narr('Amos is up off the cardboard before you can get past. He does not do that.'),
        say('amos', "Hey. Hey. Four days. You've gone past four days and I've counted, because I've got nothing else to count."),
        say('amos', `What is it? ${busy} You're the one who used to stop.`),
        choice({ t: "You're right. What's going on with you?", do: () => { trust('amos', 1); remember('amos_stopped'); return [say('amos', "Nothing's going on with me. That's the thing about me: nothing's going on. I just noticed you going past."), you("The days go fast now."), say('amos', "They go fast for everybody. Faster for you, I know that. I'm not asking for the day. I'm asking for the minute."), narr('You give him the minute. It costs what a minute costs, which today is nothing you can measure.')]; } },
          brush([say('amos', "...Sure. Sure. Go on."), narr('He sits back down. He does not look up when you pass the next time, or the time after that.')]))]);
    } else {
      Dlg.run([narr('Nora steps out of 411 as you pass, keys in her teeth, and takes them out.'),
        say('nora', "Four mornings. I counted; I count things, it's the job. You used to knock."),
        say('nora', `Is it me? Did I do the nurse thing? I do the nurse thing. Or is it ${busy.toLowerCase()}`),
        choice({ t: "It's not you. I don't know what it is.", do: () => { trust('nora', 1); remember('nora_stopped'); return [say('nora', "That's an answer. That's the first honest one I've had all week, and I work in a hospital."), say('nora', "Knock. Bang on the wall. Anything. I'm not asking for a visit; I'm asking for a noise."), narr('She goes back in. You stand in the hall a moment longer than you need to.')]; } },
          brush([say('nora', "...Okay. Go. Go, you'll be late."), narr('The door of 411 closes with the care of somebody who does not want it to sound like anything.')]))]);
    }
  },
  // the thaw: the next real conversation after a brush-off begins here
  thawStep(id) {
    const p = this.S()[id]; if (!p.brushed) return null;
    const un = () => { p.brushed = false; p.count = 0; remember(id + '_thawed'); };
    if (id === 'amos') return [say('amos', "Oh. You've got a minute now."), choice({ t: "I've got all of them. I'm sorry.", do: () => { un(); return [say('amos', "...Okay. Okay. Sit, then. Or stand. I don't run a chair."), narr('Something in his shoulders comes down an inch. It is not forgiveness; it is closer to relief, which is rarer.')]; } }, { t: "A minute.", do: () => [say('amos', "Then use it.")] })];
    return [say('nora', "Oh. Hi. You've got time today?"), choice({ t: "I've got time. I was wrong to walk past.", do: () => { un(); return [say('nora', "You were. Okay. Come in, I've got tea and I've got opinions.")]; } }, { t: "A little.", do: () => [say('nora', "A little. Okay. Talk fast, I'm on at seven.")] })];
  }
};
// hooks: what counts as talking, and colder behaviour while brushed off
{
  for (const m of ['talk', 'gaveFood', 'gaveMoney', 'clinic', 'tellDiner', 'buyCoat', 'getId']) { const o = Amos[m]; if (o) Amos[m] = function (...a) { Passing.talked('amos'); return o.apply(this, a); }; }
  for (const m of ['talk', 'boxes', 'checkAmos', 'cameoTalk']) { const o = Nora[m]; if (o) Nora[m] = function (...a) { Passing.talked('nora'); return o.apply(this, a); }; }
  const amosTalk = Amos.talk; Amos.talk = function () { const th = Passing.thawStep('amos'); if (th && talkEnergy()) { Dlg.run(th, () => { G.energy += TALK_COST; useEnergy(0); amosTalk.call(Amos); }); return; } return amosTalk.call(Amos); };
  const noraTalk = Nora.talk; Nora.talk = function () { const th = Passing.thawStep('nora'); if (th && talkEnergy()) { Dlg.run(th, () => { G.energy += TALK_COST; useEnergy(0); noraTalk.call(Nora); }); return; } return noraTalk.call(Nora); };
  // Nora shows up in the hall about half as often after a brush-off; the wall goes quiet
  const noraWhere = Nora.where; Nora.where = function () { const w = noraWhere.call(this); if (w && w.scene === 'hall' && G.day > 9 && Passing.isBrushed('nora') && G.day % 2 === 1) return null; return w; };
  const wall = Nora.wallListen; Nora.wallListen = function () { if (Passing.isBrushed('nora')) return pick(['Through the wall: the TV, turned up a little when you put your ear to it. Or that is your imagination.', 'Through the wall: nothing you are meant to hear.']); return wall.call(this); };
}
