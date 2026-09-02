// ============================================================
// Cal's songs. Four of them, about thirty seconds each, in rotation. "Listen a while" plays the next one.
// Guitar and a bass string, scheduled on the audio clock; the lyrics come up a line at a time.
// ============================================================
S('note', ['..YY', '..YY', '..Y.', '..Y.', 'YYY.', 'YYY.'], { Y: '#f8e88a' });
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
// chords: [semitones above key, quality]; melody: bars of [semitone (null = rest), beats]
const SONGS = [
  {
    id: 'rain', title: 'Rain on Harlan', bpm: 88, bar: 3, key: 57, // A minor waltz
    chords: [[0, 'm'], [0, 'm'], [8, 'M'], [8, 'M'], [3, 'M'], [3, 'M'], [7, 'M'], [7, 'M'], [0, 'm'], [0, 'm'], [5, 'm'], [5, 'm'], [3, 'M'], [7, 'M'], [0, 'm'], [0, 'm']],
    melody: [[[12, 2], [15, 1]], [[14, 2], [12, 1]], [[12, 1], [15, 1], [19, 1]], [[17, 3]], [[15, 2], [12, 1]], [[14, 2], [10, 1]], [[11, 1], [14, 1], [12, 1]], [[12, 3]],
      [[19, 2], [17, 1]], [[15, 2], [12, 1]], [[14, 1], [15, 1], [17, 1]], [[15, 3]], [[12, 1], [14, 1], [15, 1]], [[11, 2], [14, 1]], [[12, 3]], [[null, 3]]],
    lyrics: [[0, 'Rain on Harlan, rain on the wire,'], [12, 'rain on the man who sleeps by the door.'], [24, 'Nobody asked and nobody told him'], [36, 'what all this water was for.']],
    outro: 'The last chord hangs in the wet air longer than it should. A woman with a stroller has stopped. She goes on.',
  },
  {
    id: 'the14', title: 'The 14', bpm: 104, bar: 4, key: 55, // G major, the bus that does not come
    chords: [[0, 'M'], [0, 'M'], [5, 'M'], [7, 'M'], [0, 'M'], [9, 'm'], [5, 'M'], [7, 'M'], [0, 'M'], [4, 'm'], [5, 'M'], [7, 'M'], [0, 'M'], [0, 'M']],
    melody: [[[7, 1], [7, 1], [9, 1], [11, 1]], [[12, 2], [11, 1], [9, 1]], [[7, 2], [5, 1], [7, 1]], [[9, 3], [null, 1]], [[7, 1], [7, 1], [9, 1], [11, 1]], [[12, 2], [14, 1], [12, 1]], [[11, 1], [9, 1], [7, 1], [5, 1]], [[7, 3], [null, 1]],
      [[12, 1], [12, 1], [14, 1], [16, 1]], [[14, 2], [12, 1], [11, 1]], [[9, 1], [11, 1], [12, 1], [9, 1]], [[11, 2], [7, 2]], [[7, 4]], [[null, 4]]],
    lyrics: [[0, 'Twelve minutes, she said, you could set a watch,'], [16, 'so she set it, and set it, and set it again.'], [32, 'The 14 got cut in the spring of the year'], [44, "and the old man's still waiting. Amen."]],
    outro: 'He looks over at the bench when he finishes. He always does, even now.',
  },
  {
    id: 'fourth', title: 'Fourth Floor', bpm: 108, bar: 4, key: 50, // D, a building with thin walls
    chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M'], [0, 'M'], [9, 'm'], [5, 'M'], [7, 'M'], [9, 'm'], [5, 'M'], [0, 'M'], [7, 'M'], [0, 'M'], [0, 'M']],
    melody: [[[0, 1], [4, 1], [7, 1], [4, 1]], [[9, 2], [7, 1], [4, 1]], [[5, 1], [7, 1], [9, 1], [7, 1]], [[7, 3], [null, 1]], [[0, 1], [4, 1], [7, 1], [9, 1]], [[12, 2], [9, 1], [7, 1]], [[5, 1], [4, 1], [2, 1], [4, 1]], [[0, 3], [null, 1]],
      [[12, 1], [12, 1], [11, 1], [9, 1]], [[9, 2], [7, 2]], [[4, 1], [7, 1], [9, 1], [7, 1]], [[11, 2], [7, 1], [4, 1]], [[0, 4]], [[null, 4]]],
    lyrics: [[0, 'Fourth floor, thin walls, a kettle at six,'], [16, 'a nurse and a cough and a lock that sticks.'], [32, "Two knocks means I'm here, two knocks means I know."], [44, 'Fourth floor. Thin walls. Nobody has to say so.']],
    outro: 'Somebody on a fire escape above the laundry claps twice. He does not look up, but he plays the last chord again for them.',
  },
  {
    id: '1962', title: 'Something From 1962', bpm: 104, bar: 4, key: 52, // E, an old request
    chords: [[0, 'M'], [4, 'm'], [9, 'm'], [7, 'M'], [0, 'M'], [4, 'm'], [5, 'M'], [7, 'M'], [9, 'm'], [4, 'm'], [5, 'M'], [7, 'M'], [0, 'M'], [0, 'M']],
    melody: [[[4, 1], [7, 1], [11, 2]], [[9, 1], [7, 1], [4, 2]], [[5, 1], [7, 1], [9, 1], [11, 1]], [[7, 3], [null, 1]], [[4, 1], [7, 1], [11, 2]], [[12, 1], [11, 1], [9, 2]], [[7, 1], [9, 1], [11, 1], [12, 1]], [[11, 3], [null, 1]],
      [[12, 1], [11, 1], [9, 1], [7, 1]], [[9, 2], [7, 1], [4, 1]], [[5, 1], [4, 1], [2, 1], [4, 1]], [[7, 2], [4, 2]], [[0, 4]], [[null, 4]]],
    lyrics: [[0, 'He asked for something from sixty-two;'], [16, 'I played it wrong and he said so, too.'], [32, "I've got it now, I've got it right,"], [44, 'and the bench is empty tonight.']],
    outro: "He did not use to play that one. He plays it every day now, the right way, for a bench.",
    when: () => G.chars.walter.dead,
    alt: { title: 'Something From 1962', lyrics: [[0, 'He asked for something from sixty-two;'], [16, 'I played it wrong and he said so, too.'], [32, "I'll get it right if it takes all year,"], [44, "and he'll be on that bench to hear."]], outro: 'The old man on the bench lifts his cane an inch. From Walter, that is a standing ovation.' },
  },
];
const Song = {
  active: false, spec: null, nodes: [], startAt: 0, dur: 0, lyricIdx: -1, shown: '',
  next() { const f = G.flags; const i = (f.songIdx || 0) % SONGS.length; f.songIdx = i + 1; return SONGS[i]; },
  play(spec) {
    const A = Audio; if (!A._unlocked) A.unlock();
    this.spec = spec; this.active = true; this.lyricIdx = -1; this.shown = ''; this.nodes = []; this.startedFrame = G.t; G.state = 'song'; G.walking = false; G.facing = STREET.spots.busker > G.px ? 1 : -1;
    const bps = spec.bpm / 60; const beat = 1 / bps; const totalBeats = spec.chords.length * spec.bar; this.dur = totalBeats * beat + 1.2;
    this.beatsTotal = totalBeats; this.beatLen = beat;
    if (!A._unlocked || A.muted) { this.startAt = 0; return; }
    const c = A.ctx; const t0 = c.currentTime + 0.15; this.startAt = t0; this.ctxStart = t0;
    const pluck = (m, t, len, vol, type) => { const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = type || 'triangle'; o.frequency.value = midiHz(m); fl.type = 'lowpass'; fl.frequency.value = 2200; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.15, len * 1.1)); o.connect(fl); fl.connect(g); g.connect(A.master); o.start(t); o.stop(t + len * 1.1 + 0.05); this.nodes.push(o, g); };
    // accompaniment: bass on the bar, arpeggio on the beats
    spec.chords.forEach((ch, bi) => {
      const root = spec.key + ch[0]; const third = ch[1] === 'm' ? 3 : 4; const tb = t0 + bi * spec.bar * beat;
      pluck(root - 12, tb, beat * spec.bar * 0.9, 0.05, 'sine');
      const arp = [root, root + 7, root + third + 12, root + 12, root + 7];
      for (let k = 0; k < spec.bar * 2; k++) pluck(arp[k % arp.length], tb + k * beat / 2, beat * 0.9, 0.022);
    });
    // melody
    let tm = t0;
    spec.melody.forEach(bar => { bar.forEach(([n, b]) => { if (n !== null) pluck(spec.key + 12 + n, tm, b * beat, 0.06); tm += b * beat; }); });
  },
  update() {
    if (!this.active) return;
    const elapsed = (G.t - this.startedFrame) / 60;
    const beatNow = elapsed / this.beatLen;
    const ly = this.lyrics(); let idx = -1; for (let i = 0; i < ly.length; i++) if (beatNow >= ly[i][0] - 0.2) idx = i; this.lyricIdx = idx;
    if (Input.hit('back') || Input.hit('menu')) { this.stop(true); return; }
    if (elapsed >= this.dur) this.stop(false);
  },
  lyrics() { const s = this.spec; return s.alt && s.when && !s.when() ? s.alt.lyrics : s.lyrics; },
  stop(early) {
    this.active = false; G.state = 'play';
    if (early) { const A = Audio; try { const now = A.ctx.currentTime; for (const n of this.nodes) { if (n.gain) n.gain.cancelScheduledValues(now), n.gain.setTargetAtTime(0.0001, now, 0.05); if (n.stop) { try { n.stop(now + 0.3); } catch (e) { } } } } catch (e) { } }
    this.nodes = [];
    const s = this.spec; const outro = s.alt && s.when && !s.when() ? s.alt.outro : s.outro;
    G.flags.songsHeard = (G.flags.songsHeard || 0) + (early ? 0 : 1); if (!early) remember('song_' + s.id);
    Dlg.run([narr(early ? 'You walk on before the end. He does not stop; the song was not for you, particularly. It was for the corner.' : outro)]);
  },
  draw(g, t) {
    buildEntities(); const b = G.entities.find(e => e.id === 'busker'); if (b) b.bubble = 'note';
    renderScene(g, t); UI.drawHud(g, t);
    const s = this.spec; const title = s.alt && s.when && !s.when() ? s.alt.title : s.title;
    UI.panel(g, W / 2 - 110, 30, 220, 14, 0.75); drawText(g, `"${title}"`, W / 2, 33, '#e8c84a', { align: 'center' });
    const ly = this.lyrics();
    if (this.lyricIdx >= 0) { const text = ly[this.lyricIdx][1]; const lines = wrapText(text, 300); const w = Math.max(...lines.map(l => textWidth(l))) + 16; UI.panel(g, Math.round(W / 2 - w / 2), 48, w, 8 + lines.length * 10, 0.7); lines.forEach((ln, i) => drawText(g, ln, W / 2, 52 + i * 10, '#f0ead8', { align: 'center' })); }
    // progress
    const p = clamp((G.t - this.startedFrame) / 60 / this.dur, 0, 1); px(g, W / 2 - 60, 26, 120, 1, 'rgba(255,255,255,0.15)'); px(g, W / 2 - 60, 26, Math.round(120 * p), 1, '#e8c84a');
    UI.drawHint(g, `${UI.keyName('back')} walk on`);
  }
};
