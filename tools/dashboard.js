#!/usr/bin/env node
// 99 Days story dashboard. Run from the project folder:  node tools/dashboard.js
// Reads src/*.js live, shows every character's lines and branches and the day 1-99 timeline,
// and writes edits straight back into the source files, then rebuilds index.html.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const SRC = path.join(ROOT, 'src'); const PORT = +(process.env.PORT || 7799);

// ---------------- who is who ----------------
const NAMES = { amos: 'Amos', mei: 'Mei', walter: 'Walter', nadia: 'Nadia', nora: 'Nora', sol: 'Sol', theo: 'Theo', busker: 'Cal (busker)', emmett: 'Emmett', signe: 'Signe', birdie: 'Birdie', morrow: 'Morrow', jo: 'Jo', doctor: 'Dr. Okafor', granny: 'Mrs. Ortega', kid: 'Sam', worker: 'Foreman / dock', owner: 'The Owner', pryor: 'Pryor', lena: 'Lena', marsh: 'Theo\'s father', mrsLin: 'Mrs. Lin', dutch: 'Dutch', lou: 'Lou', widow: 'The Widow', samDad: 'Sam\'s father', desk: 'Clinic desk', voice: 'Phone voices', caller: 'Radio callers', towerman: 'The tower man', inspector: 'Inspector', dog: 'The dog', meiMom: 'Mrs. Lin', danny: 'Danny', micah: 'Micah', sam: 'Sam (pool)', you: 'You (on air)', woman: 'A woman', player: 'You (unattributed)', system: 'Game text' };
const OBJ2CHAR = { Amos: 'amos', Mei: 'mei', Walter: 'walter', Nadia: 'nadia', Nora: 'nora', Pawn: 'sol', Theo: 'theo', Emmett: 'emmett', Cello: 'signe', Radio: 'birdie', Morrow: 'morrow', Jo: 'jo', Doctor: 'doctor', VP: 'owner', Ladder: 'worker', Lobby: 'morrow', Passing: 'system', House: 'walter', Garden: 'granny', Season: 'system', Rent: 'morrow', Casino: 'dutch', Bus: 'system', Fishing: 'emmett', Home: 'system', Beats: null, Phone: 'voice', Minor: null, Gifts: null };
const FILE2CHAR = { '09b_story_nora.js': 'nora', '09e_story_theo.js': 'theo', '09g_story_lake.js': 'emmett', '09h_story_phone.js': 'jo', '09l_story_house.js': 'walter', '09n_story_garden.js': 'granny', '09q_story_amos_end.js': 'amos', '09s_story_casino.js': 'dutch', '09t_story_cello.js': 'signe', '09u_story_radio.js': 'birdie', '09z_story_lobby.js': 'morrow', '09x_story_calendar.js': 'system', '09p_story_rent.js': 'morrow', '09k_story_nano.js': 'doctor', '09d_story_vp.js': 'owner', '09c_story_ladder.js': 'worker', '10_game.js': 'system', '09f_story_pawn.js': 'sol', '09v_story_pawn2.js': 'sol', '09i_story_passing.js': 'system', '09zy_story_pace.js': 'system', '09zz_story_show.js': 'system', '09o_story_beats.js': 'system', '09m_story_songs.js': 'busker', '09r_story_names.js': 'system', '09y_story_journal.js': 'system', '09xb_story_snow.js': 'system' };
const SECTION2CHAR = { amosCall: 'amos', amosRoof: 'amos', mrsLin: 'mei', meiNight: 'mei', walterGrave: 'walter', samDad: 'nadia', samCheckers: 'kid', formTalk: 'nora', formNora: 'nora', formItem: 'nora', storm: 'emmett', cabin: 'emmett', solRedeem: 'sol', trumpetTake: 'sol', trumpetGive: 'busker', micah: 'jo', theoDad: 'theo', stoneDay: 'granny', hectorBench: 'granny', scan: 'doctor', pryorDad: 'pryor', lenaKids: 'lena', foremanName: 'worker', busker: 'busker', granny: 'granny', kid: 'kid', dog: 'dog', thursday: 'nadia', fixWalkIn: 'nadia', louTalk: 'lou', louGive: 'lou', widowTalk: 'widow', dutchTalk: 'dutch', dutchMenu: 'dutch', samDadTonight: 'samDad', wake: null, update: null };

// ---------------- scanning ----------------
// Walk a file, find every string literal, and record the call it belongs to, its nesting inside choice(), and the enclosing function.
function scan(file) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8'); const toks = []; const n = src.length;
  let i = 0; const stack = []; // frames: {ch:'('|'['|'{', kind, start}
  const lineOf = pos => src.slice(0, pos).split('\n').length;
  const before = (pos, k) => src.slice(Math.max(0, pos - k), pos);
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j < 0 ? n : j; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i); i = j < 0 ? n : j + 2; continue; }
    if (c === '/' && /[=(,;:!&|?{}\[\n]\s*$/.test(before(i, 3))) { // regex literal
      let j = i + 1, cls = false; while (j < n) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; j++; }
      i = j + 1; while (/[a-z]/.test(src[i] || '')) i++; continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; let j = i + 1; const parts = []; let tdepth = 0;
      while (j < n) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (q === '`' && d === '$' && src[j + 1] === '{') { let k = j + 2, dep = 1; while (k < n && dep) { if (src[k] === '{') dep++; else if (src[k] === '}') dep--; else if (src[k] === '`') { const e = src.indexOf('`', k + 1); k = e; } k++; } parts.push(src.slice(j, k)); j = k; continue; } if (d === q) break; j++; }
      const raw = src.slice(i, j + 1);
      const pre = before(i, 60); const frames = stack.slice();
      toks.push({ start: i, end: j + 1, raw, quote: q, line: lineOf(i), pre, frames, tpl: parts });
      i = j + 1; continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      let kind = null; const pre = before(i, 12);
      if (c === '(') { if (/choice\s*$/.test(pre)) kind = 'choice'; else if (/\bsay\s*$/.test(pre)) kind = 'say'; else if (/\bnarr\s*$/.test(pre)) kind = 'narr'; else if (/\byou\s*$/.test(pre)) kind = 'you'; else if (/\bL_\s*$/.test(pre)) kind = 'L_'; else if (/\bfresh\s*$/.test(pre)) kind = 'fresh'; else if (/\bpick\s*$/.test(pre)) kind = 'pick'; else if (/Menu\.open\s*$/.test(pre)) kind = 'menu'; else if (/\bMenu\.open\s*$/.test(pre)) kind = 'menu'; }
      if (c === '{' && /(do|then|else)\s*:\s*\(\)\s*=>\s*$/.test(before(i, 24))) kind = 'optionBody';
      if (c === '[' && /return\s*$/.test(pre)) kind = 'optionReturn';
      stack.push({ ch: c, kind, start: i, line: lineOf(i) }); i++; continue;
    }
    if (c === ')' || c === ']' || c === '}') { const f = stack.pop(); if (f && f.kind === 'L_') f.end = i; if (f) f.endPos = i; i++; continue; }
    i++;
  }
  // enclosing functions: find method/function definitions by line
  const lines = src.split('\n'); const defs = [];
  let curObj = null;
  lines.forEach((ln, idx) => {
    const mo = ln.match(/^const\s+([A-Z]\w*)\s*=\s*\{/); if (mo) curObj = mo[1];
    if (/^\};?\s*$/.test(ln) || /^\}$/.test(ln)) { if (!/^\s/.test(ln)) curObj = curObj; }
    const mm = ln.match(/^\s{2}([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/) || ln.match(/^\s{2}(?:async\s+)?([a-zA-Z_]\w*)\s*\(/); if (mm && curObj) defs.push({ line: idx + 1, name: mm[1], obj: curObj });
    const mf = ln.match(/^function\s+(\w+)\s*\(/); if (mf) { defs.push({ line: idx + 1, name: mf[1], obj: null }); curObj = null; }
    const mw = ln.match(/^\s{2}const\s+\w+\s*=\s*([A-Z]\w*)\.(\w+);\s*\1\.\2\s*=\s*function/); if (mw) defs.push({ line: idx + 1, name: mw[2] + ' (hook)', obj: mw[1] });
    const mc = ln.match(/^\s{2}([A-Z]\w*)\.(\w+)\s*=\s*function/); if (mc) defs.push({ line: idx + 1, name: mc[2], obj: mc[1] });
    const mp = ln.match(/^\s{2}([a-z]\w*):\s*\[\s*$/); if (mp && curObj === 'FRESH') defs.push({ line: idx + 1, name: 'pool', obj: 'FRESH', pool: mp[1] });
  });
  const defAt = line => { let best = null; for (const d of defs) { if (d.line <= line) best = d; else break; } return best; };
  return { src, toks, defs, defAt, lines };
}
function decode(raw) {
  const q = raw[0]; const body = raw.slice(1, -1);
  return body.replace(/\\(.)/g, (m, c) => c === 'n' ? '\n' : c === 't' ? '\t' : c);
}
function encode(text, q) {
  let s = text.replace(/\\/g, '\\\\');
  if (q === "'") s = s.replace(/'/g, "\\'"); else if (q === '"') s = s.replace(/"/g, '\\"'); else s = s.replace(/`/g, '\\`');
  s = s.replace(/\n/g, '\\n');
  return q + s + q;
}
// classify a token
function classify(file, S, t) {
  const pre = t.pre; const frames = t.frames; const top = frames[frames.length - 1];
  let kind = null, who = null;
  if (/\bsay\(\s*'(\w+)'\s*,\s*$/.test(pre)) { kind = 'say'; who = pre.match(/\bsay\(\s*'(\w+)'\s*,\s*$/)[1]; }
  else if (/\bsay\(\s*'?$/.test(pre) && top && top.kind === 'say') { return null; } // the speaker id itself
  else if (/\bnarr\(\s*$/.test(pre)) kind = 'narr';
  else if (/\byou\(\s*$/.test(pre)) kind = 'you';
  else if (/\bL_\(\s*$/.test(pre)) kind = 'pool';
  else if (/\bt:\s*$/.test(pre)) kind = 'label';
  else if (top && (top.kind === 'fresh' || (top.ch === '[' && frames.length >= 2 && frames[frames.length - 2].kind === 'fresh'))) { if (/fresh\(\s*'?$/.test(pre)) return null; kind = 'poolInline'; }
  else if (top && top.ch === '[' && frames.length >= 2 && frames[frames.length - 2].kind === 'pick' && frames.length >= 3 && frames[frames.length - 3].kind === 'say') kind = 'sayPick';
  else if (top && top.ch === '[' && frames.length >= 2 && frames[frames.length - 2].kind === 'pick' && frames.length >= 3 && frames[frames.length - 3].kind === 'narr') kind = 'narrPick';
  else if (top && top.ch === '(' && top.kind === 'say' && !/say\(\s*$/.test(pre)) kind = 'sayExpr';
  else if (top && top.ch === '(' && top.kind === 'narr') kind = 'narrExpr';
  if (!kind) return null;
  // choice nesting: number of choice( frames, and whether we are inside an option body
  const choiceDepth = frames.filter(f => f.kind === 'choice').length;
  const inOption = frames.some(f => f.kind === 'optionBody' || f.kind === 'optionReturn');
  const depth = kind === 'label' ? Math.max(0, choiceDepth - 1) : choiceDepth;
  // who owns the line: say has it; others take the context
  const def = S.defAt(t.line);
  if (kind === 'say' || kind === 'sayPick' || kind === 'sayExpr') { /* who set */ }
  else if (kind === 'pool') { who = def && def.pool ? def.pool : (pre.match(/FRESH\.(\w+)\.push/) ? RegExp.$1 : null); if (!who) { const m = S.src.slice(Math.max(0, t.start - 400), t.start).match(/FRESH\.(\w+)\s*=\s*FRESH\.\1[^\n]*push\(/g); if (m) who = m[m.length - 1].match(/FRESH\.(\w+)/)[1]; } }
  else if (kind === 'poolInline') { const m = S.src.slice(Math.max(0, t.start - 300), t.start).match(/fresh\(\s*'(\w+)'/g); if (m) who = m[m.length - 1].match(/'(\w+)'/)[1]; }
  if (!who) {
    // nearest say() before this token in the same statement
    const back = S.src.slice(Math.max(0, t.start - 900), t.start); const ms = back.match(/say\('(\w+)'/g); const fwd = S.src.slice(t.end, t.end + 300).match(/say\('(\w+)'/);
    if (def && SECTION2CHAR[def.name]) who = SECTION2CHAR[def.name];
    else if (def && def.obj && OBJ2CHAR[def.obj]) who = OBJ2CHAR[def.obj];
    else if (ms) who = ms[ms.length - 1].match(/'(\w+)'/)[1];
    else if (fwd) who = fwd[1];
    else who = FILE2CHAR[file] || 'system';
    if (who === 'system' && ms) who = ms[ms.length - 1].match(/'(\w+)'/)[1];
  }
  if (!NAMES[who]) who = NAMES[who] === undefined ? (who in NAMES ? who : who) : who;
  // pool details
  let pool = null;
  if (kind === 'pool') { const fr = top; const argText = fr && fr.endPos ? S.src.slice(t.end, fr.endPos) : ''; const m = argText.match(/^\s*,\s*([\s\S]*?)(?:,\s*(\d+))?(?:,\s*(\d+))?\s*$/); pool = { need: m ? m[1].trim() : '', d0: m && m[2] ? +m[2] : 1, d1: m && m[3] ? +m[3] : 99, callStart: fr.start - 3, callEnd: fr.endPos + 1 }; if (pool.need === 'null') pool.need = ''; }
  return { id: file + ':' + t.start, file, start: t.start, end: t.end, line: t.line, kind, who, text: decode(t.raw), raw: t.raw, quote: t.quote, tpl: t.tpl, depth, inOption, section: def ? (def.obj ? def.obj + '.' + def.name : def.name) : '(top level)', sectionLine: def ? def.line : 0, pool };
}
function collect() {
  const files = fs.readdirSync(SRC).filter(f => /^(08|09|10)/.test(f) && f.endsWith('.js') && !/^09l_/.test(f)).sort();
  const items = []; const gates = [];
  for (const file of files) {
    const S = scan(file);
    for (const t of S.toks) { const c = classify(file, S, t); if (c && c.text.trim()) items.push(c); }
    // day gates: numbers compared against the day
    const re = /\b(G\.day|\bd|day|G\.day\s*-\s*\w+)\s*(>=|<=|===|==|>|<)\s*(\d+)\b/g; let m;
    while ((m = re.exec(S.src))) { const line = S.src.slice(0, m.index).split('\n').length; const def = S.defAt(line); const who = (def && (SECTION2CHAR[def.name] || (def.obj && OBJ2CHAR[def.obj]))) || FILE2CHAR[file] || 'system'; const numStart = m.index + m[0].lastIndexOf(m[3]); gates.push({ id: file + ':' + numStart, file, line, start: numStart, end: numStart + m[3].length, op: m[2], day: +m[3], who, section: def ? (def.obj ? def.obj + '.' + def.name : def.name) : '(top level)', ctx: S.lines[line - 1].trim().slice(0, 140) }); }
    const re2 = /\b(CELLO_DAY|LEASE_DAY|NORA_DAY)\s*=\s*(\d+)/g; while ((m = re2.exec(S.src))) { const numStart = m.index + m[0].lastIndexOf(m[2]); gates.push({ id: file + ':' + numStart, file, line: S.src.slice(0, m.index).split('\n').length, start: numStart, end: numStart + m[2].length, op: 'const', day: +m[2], who: m[1] === 'CELLO_DAY' ? 'signe' : m[1] === 'LEASE_DAY' ? 'birdie' : 'nora', section: m[1], ctx: m[0] }); }
    if (file === '09x_story_calendar.js') { const re3 = /(\d+):\s*("[^"]*"|'[^']*')/g; const blk = S.src.match(/EVENTS:\s*\{[^}]*\}/); if (blk) { const off = S.src.indexOf(blk[0]); while ((m = re3.exec(blk[0]))) { gates.push({ id: file + ':' + (off + m.index), file, line: S.src.slice(0, off + m.index).split('\n').length, start: off + m.index, end: off + m.index + m[1].length, op: 'event', day: +m[1], who: 'system', section: 'CAL.EVENTS', ctx: m[2].slice(1, -1) }); } } const blk2 = S.src.match(/HOLIDAYS:\s*\{[^}]*\}/); if (blk2) { const off = S.src.indexOf(blk2[0]); const re4 = /(\d+):\s*("[^"]*"|'[^']*')/g; while ((m = re4.exec(blk2[0]))) { gates.push({ id: file + ':' + (off + m.index), file, line: S.src.slice(0, off + m.index).split('\n').length, start: off + m.index, end: off + m.index + m[1].length, op: 'holiday', day: +m[1], who: 'system', section: 'CAL.HOLIDAYS', ctx: m[2].slice(1, -1) + ' (dock closed)' }); } } }
  }
  // needs catalog for new pool lines
  const needs = [...new Set(items.filter(i => i.pool && i.pool.need).map(i => i.pool.need))].sort();
  return { files, items, gates, needs, names: NAMES, money: collectMoney(), arcs: readArcs(), songs: readSongs() };
}

// ---------------- arcs ----------------
// Story summaries and beats per character, kept in tools/arcs.json so they travel with the repo and can be edited from the dashboard.
const ARCS_PATH = path.join(__dirname, 'arcs.json');
function readArcs() { try { return JSON.parse(fs.readFileSync(ARCS_PATH, 'utf8')); } catch (e) { return {}; } }
function editArc(body) {
  const id = String(body.id || ''); if (!/^[a-zA-Z]\w*$/.test(id)) return { ok: false, error: 'bad id' };
  const arcs = readArcs(); const beats = String(body.beats || '').replace(/\r/g, '').split('\n').map(l => l.replace(/^\s*(\d+[.)]|[-*])\s*/, '').trim()).filter(Boolean);
  arcs[id] = { arc: String(body.arc || '').trim(), beats }; fs.writeFileSync(ARCS_PATH, JSON.stringify(arcs, null, 2) + '\n'); return { ok: true };
}

// ---------------- songs ----------------
// The songs are pure JSON between /*SONGS*/ and /*END*/ in src/09l_songs_data.js. The editor rewrites that block.
const SONGS_PATH = path.join(SRC, '09l_songs_data.js');
function readSongs() {
  try { const src = fs.readFileSync(SONGS_PATH, 'utf8'); const a = src.indexOf('/*SONGS*/') + 9, b = src.indexOf('/*END*/'); const songs = JSON.parse(src.slice(a, b));
    // ids the code refers to by name cannot be deleted or renamed from here
    const code = fs.readdirSync(SRC).filter(f => f.endsWith('.js') && !/^09l_/.test(f)).map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
    const referenced = songs.map(s => s.id).filter(id => new RegExp("id === '" + id + "'").test(code) || (id === 'sol1994'));
    return { list: songs, referenced }; } catch (e) { return { list: [], referenced: [], error: e.message }; }
}
function fmtSong(d) {
  const J = x => JSON.stringify(x);
  const parts = [`    "id": ${J(d.id)}, "title": ${J(d.title)}, "who": ${J(d.who || 'cal')}, "bpm": ${+d.bpm}, "bar": ${+d.bar}, "key": ${+d.key}, "unlock": ${J(d.unlock || 'always')}${d.solo ? ', "solo": true' : ''}${d.band ? ', "band": true' : ''}${d.hint ? ', "hint": ' + J(d.hint) : ''},`,
    `    "chords": ${J(d.chords)},`,
    `    "melody": [\n${d.melody.map(b => '      ' + J(b)).join(',\n')}\n    ],`,
    `    "lyrics": [\n${(d.lyrics || []).map(l => '      ' + J(l)).join(',\n')}\n    ],`,
    `    "outro": ${J(d.outro || '')}${d.early ? ',\n    "early": ' + J(d.early) : ''}${d.alt ? ',\n    "alt": ' + J(d.alt) : ''},`,
    `    "inst": ${J(d.inst || {})}`];
  return '  {\n' + parts.join('\n') + '\n  }';
}
function writeSongs(body) {
  const list = body.songs; if (!Array.isArray(list) || !list.length) return { ok: false, error: 'no songs' };
  const ids = new Set();
  for (const d of list) {
    if (!d.id || !/^[a-z0-9_]+$/i.test(d.id)) return { ok: false, error: 'Song ids are letters and numbers only: ' + d.id };
    if (ids.has(d.id)) return { ok: false, error: 'Two songs share the id ' + d.id }; ids.add(d.id);
    if (!(d.bpm > 20 && d.bpm < 300)) return { ok: false, error: d.title + ': tempo out of range' };
    if (!(d.bar === 3 || d.bar === 4 || d.bar === 2 || d.bar === 6)) return { ok: false, error: d.title + ': beats per bar must be 2, 3, 4 or 6' };
    if (!Array.isArray(d.chords) || !d.chords.length || !Array.isArray(d.melody) || d.melody.length !== d.chords.length) return { ok: false, error: d.title + ': melody and chords must have the same number of bars' };
    for (let i = 0; i < d.melody.length; i++) { const sum = d.melody[i].reduce((a, n) => a + n[1], 0); if (Math.abs(sum - d.bar) > 0.001) return { ok: false, error: `${d.title}: bar ${i + 1} adds up to ${sum} beats, not ${d.bar}` }; }
  }
  const cur = readSongs(); for (const id of cur.referenced) if (!ids.has(id)) return { ok: false, error: `The code refers to the song '${id}' by name; it can be edited but not removed.` };
  const src = fs.readFileSync(SONGS_PATH, 'utf8'); const a = src.indexOf('/*SONGS*/') + 9, b = src.indexOf('/*END*/');
  const next = src.slice(0, a) + '[\n' + list.map(fmtSong).join(',\n') + '\n]' + src.slice(b);
  try { new Function(next); JSON.parse(next.slice(a, next.indexOf('/*END*/'))); } catch (e) { return { ok: false, error: 'That would break the file: ' + e.message }; }
  fs.writeFileSync(SONGS_PATH, next); return { ok: true };
}

// ---------------- money ----------------
// Every price, fee, wage and payout that is a number in the code. One price is often written in three places on a line
// (the menu label '$35', the check G.money < 35, and spend(35)); those are grouped so one edit changes all of them.
const MONEY_CONST = { RENT: 'Rent, every Monday', CURE_COST: "Halvorsen's cure (the ladder)", NANO_COST: 'The nano treatment', HOUSE_COST: "Walter's house", LEASE_FEE: "KHRL's lease (the radio station)" };
const GAME_NAMES = { DishGame: 'Dish shift at the diner', CrateGame: 'Crates at the loading dock', DeliveryGame: 'Delivery run', DataGame: 'Data entry (the ladder)', CutsGame: 'The cuts (VP office)', RouletteGame: 'Roulette', BlackjackGame: 'Blackjack', HoldemGame: 'Poker' };
function collectMoney() {
  const files = fs.readdirSync(SRC).filter(f => /^(07|08|09|10)/.test(f) && f.endsWith('.js')).sort(); const out = []; const groups = {};
  for (const file of files) {
    const S = scan(file); const src = S.src; const inStr = pos => S.toks.some(t => pos > t.start && pos < t.end);
    const lineOf = pos => src.slice(0, pos).split('\n').length; const ctxOf = line => S.lines[line - 1].trim().slice(0, 150);
    const spot = (pos, len, kind) => ({ file, start: pos, end: pos + len, was: src.slice(pos, pos + len), line: lineOf(pos), kind, ctx: ctxOf(lineOf(pos)) });
    // class names, for the pay formulas
    const classes = []; { const re = /^class (\w+)/gm; let m; while ((m = re.exec(src))) classes.push({ pos: m.index, name: m[1] }); }
    const classAt = pos => { let b = null; for (const c of classes) if (c.pos <= pos) b = c; return b ? b.name : null; };
    const who = pos => { const def = S.defAt(lineOf(pos)); return (def && (SECTION2CHAR[def.name] || (def.obj && OBJ2CHAR[def.obj]))) || FILE2CHAR[file] || 'system'; };
    const sect = pos => { const def = S.defAt(lineOf(pos)); return def ? (def.obj ? def.obj + '.' + def.name : def.name) : classAt(pos) || '(top level)'; };
    const objOf = pos => { const def = S.defAt(lineOf(pos)); return (def && def.obj) || classAt(pos) || file; };
    const labelOnLine = pos => { const ln = S.lines[lineOf(pos) - 1]; const col = pos - (src.lastIndexOf('\n', pos - 1) + 1); const before = ln.slice(0, col); const m = before.match(/\bt:\s*(['"`])((?:\\.|(?!\1).)*)\1(?![^{]*\bt:)/g); if (!m) return null; const last = m[m.length - 1]; const mm = last.match(/\bt:\s*(['"`])((?:\\.|(?!\1).)*)\1/); return mm ? mm[2].replace(/\$\{[^}]*\}/g, '…') : null; };
    const push = (e) => out.push(Object.assign({ file, who: who(e.spots[0].start), section: sect(e.spots[0].start) }, e));
    let m;
    // constants
    { const re = /\b([A-Z][A-Z_]*(?:COST|FEE|RENT|PRICE|WAGE))\s*=\s*(\d+)/g; while ((m = re.exec(src))) { if (/TALK/.test(m[1])) continue; const pos = m.index + m[0].lastIndexOf(m[2]); push({ id: file + ':' + pos, cat: 'Rent, goals & fees', label: MONEY_CONST[m[1]] || m[1], name: m[1], value: +m[2], kind: 'const', spots: [spot(pos, m[2].length, 'const')] }); } }
    // lists of amounts: roulette wagers, poker buy-ins
    { const re = /\b(RAMTS|ins)\s*=\s*\[([^\]]*)\]/g; while ((m = re.exec(src))) { const re2 = /\d+/g; let k; const base = m.index + m[0].indexOf(m[2]); const spots = []; while ((k = re2.exec(m[2]))) spots.push(spot(base + k.index, k[0].length, 'list')); if (spots.length < 2) continue; push({ id: file + ':' + m.index, cat: 'Casino', label: m[1] === 'RAMTS' ? 'Roulette wager sizes' : 'Poker buy-ins', value: spots.map(x => x.was).join(', '), kind: 'list', spots }); } }
    // the coffee: what each cup pays by grade
    { const re = /\{ perfect: (\d+), good: (\d+), ok: (\d+), poor: (\d+), over: (\d+) \}/g; while ((m = re.exec(src))) { const spots = []; let off = m.index; for (let i = 1; i <= 5; i++) { const at = src.indexOf(m[i], off + 1); spots.push(spot(at, m[i].length, 'per cup')); off = at + m[i].length; } push({ id: file + ':' + m.index, cat: 'Work & pay', label: 'The coffee · per cup: perfect, good, ok, poor, spilled', value: spots.map(x => x.was).join(' / '), kind: 'list', spots }); } }
    // Mei's application fee
    { const re = /feeNeeded\(\)\s*\{\s*return[^}]*?(\d+)\s*:\s*(\d+)/g; while ((m = re.exec(src))) { const p1 = m.index + m[0].lastIndexOf(m[1] + ' :'), p2 = m.index + m[0].length - m[2].length; push({ id: file + ':' + p1, cat: 'Spending', label: "Mei's application fee, if she trusts you", value: +m[1], kind: 'fee', spots: [spot(p1, m[1].length, 'fee')] }); push({ id: file + ':' + p2, cat: 'Spending', label: "Mei's application fee, if she doesn't", value: +m[2], kind: 'fee', spots: [spot(p2, m[2].length, 'fee')] }); } }
    // shop prices: price: N with a name on the same line
    { const re = /\bprice:\s*(\d+)/g; while ((m = re.exec(src))) { const pos = m.index + m[0].length - m[1].length; const ln = S.lines[lineOf(pos) - 1]; const col = pos - (src.lastIndexOf('\n', pos - 1) + 1); const nms = ln.slice(0, col).match(/\bname:\s*(['"])((?:\\.|(?!\1).)*)\1/g); const nm = nms ? nms[nms.length - 1].match(/\bname:\s*(['"])((?:\\.|(?!\1).)*)\1/) : null; const keys = ln.slice(0, col).match(/\b(\w+):\s*\{/g); const key = keys ? keys[keys.length - 1].match(/(\w+)/) : ln.match(/\b(\w+)\s*=\s*\{/); const isFood = /FOOD/.test(ln) || /^\s*\w+:\s*\{\s*name/.test(ln) && file === '08_story_a.js'; push({ id: file + ':' + pos, cat: isFood ? "Lin's Market" : "Sol's pawn shop", label: nm ? nm[2].replace(/\\'/g, "'") : (key ? key[1] : 'item'), name: key ? key[1] : null, value: +m[1], kind: 'price', spots: [spot(pos, m[1].length, 'price')] }); } }
    // food defined inline as FOOD.x = { name, price }
    // casino wagers and fields
    { const re = /\b(wage|cost|buyin|bb|down|pot|stack|blind|ante)\s*:\s*(\d+)/g; while ((m = re.exec(src))) { if (/^(07|09d|09s)/.test(file) === false || +m[2] === 0) continue; const pos = m.index + m[0].length - m[2].length; const ln = S.lines[lineOf(pos) - 1]; const nm = ln.match(/\bname:\s*(['"`])((?:\\.|(?!\1).)*)\1/) || ln.match(/\bt:\s*(['"`])((?:\\.|(?!\1).)*)\1/); push({ id: file + ':' + pos, cat: file.startsWith('09s') ? 'Casino' : 'Work & pay', label: (nm ? nm[2].replace(/\$\{[^}]*\}/g, '…') + ' · ' : '') + m[1], value: +m[2], kind: 'field', spots: [spot(pos, m[2].length, 'field')] }); } }
    // pay formulas: this.pay = ... ; and this.base = N
    { const re = /this\.(pay|base)\s*=\s*([^;]+);/g; while ((m = re.exec(src))) { if (/this\.wager|pay - this|this\.pay = -/.test(m[0])) continue; const expr = m[2]; const re2 = /(?<![\w.])\d+(?:\.\d+)?(?![\w])/g; let k; const base = m.index + m[0].indexOf(expr); const spots = []; while ((k = re2.exec(expr))) spots.push(spot(base + k.index, k[0].length, 'formula')); if (!spots.length || /^\s*\d+\s*$/.test(expr) && m[1] === 'pay') continue; const cls = classAt(m.index); const fkey = file + '|' + cls + '|' + expr; const prev = out.find(e => e.fkey === fkey); if (prev) { prev.spots.push(...spots); continue; } push({ id: file + ':' + m.index, fkey, cat: 'Work & pay', label: (GAME_NAMES[cls] || cls || sect(m.index)) + (m[1] === 'base' ? ' · base pay' : ' · payout'), value: expr.replace(/this\./g, '').replace(/Math\./g, ''), kind: 'formula', spots }); } }
    // spend / earn / threshold / '$N' labels, grouped by object + amount
    { const res = [[/\bspend\((\d+)\)/g, 'spend'], [/\baddMoney\((-?\d+)\)/g, 'earn'], [/G\.money\s*(?:<|>=|<=|>)\s*(\d+)/g, 'check'], [/\$(\d+)(?![\d{])/g, 'label']];
      for (const [re, kind] of res) { re.lastIndex = 0; while ((m = re.exec(src))) { const numTxt = m[1].replace('-', ''); const pos = m.index + m[0].lastIndexOf(numTxt); if (kind === 'label' && !inStr(pos)) continue; if (kind !== 'label' && inStr(pos)) continue; const v = +numTxt; if (kind === 'earn' && m[1].startsWith('-')) { /* paying out of pocket: still a cost */ } let key = file + '|' + objOf(pos) + '|' + v; if (kind === 'label') { const g0 = groups[key]; if (!(g0 && g0.spots.some(x => sect(x.start) === sect(pos)))) key += '|' + sect(pos); } const sp = spot(pos, numTxt.length, kind === 'earn' && m[1].startsWith('-') ? 'pay out' : kind); if (kind === 'label') { const tk = S.toks.find(t => pos > t.start && pos < t.end); if (tk) sp.str = decode(tk.raw).slice(0, 60); } if (!groups[key]) { groups[key] = { id: file + ':' + pos, file, cat: null, label: null, value: v, kind: 'amount', spots: [], who: who(pos), section: sect(pos), earn: false }; out.push(groups[key]); } const g = groups[key]; g.spots.push(sp); if (kind === 'earn' && !m[1].startsWith('-')) g.earn = true; const lb = labelOnLine(pos); if (lb && !g.label) g.label = lb; } }
    }
  }
  for (let i = out.length - 1; i >= 0; i--) { const e = out[i]; if (e.kind === 'amount' && e.spots.every(x => x.kind === 'label' && /^\$\d+$/.test(x.str || ''))) out.splice(i, 1); }
  for (const e of out) { if (e.kind === 'amount') { e.cat = e.earn ? 'Work & pay' : /09s/.test(e.file) ? 'Casino' : 'Spending'; const kinds = new Set(e.spots.map(x => x.kind)); if (kinds.size === 1 && kinds.has('label')) e.label = 'mentioned in: ' + (e.spots[0].str || e.label || e.section); else if (!e.label) { if (false) { } else if (kinds.size === 1 && kinds.has('check')) e.label = 'needs at least · ' + e.section; else e.label = (e.earn ? 'earn · ' : 'pay · ') + e.section; } e.spots.sort((a, b) => a.start - b.start); } }
  const order = ['Rent, goals & fees', "Lin's Market", "Sol's pawn shop", 'Spending', 'Work & pay', 'Casino'];
  out.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || a.file.localeCompare(b.file) || a.spots[0].start - b.spots[0].start);
  return out;
}

// ---------------- writing ----------------
function replaceRange(file, start, end, expectRaw, newRaw) {
  const p = path.join(SRC, file); const src = fs.readFileSync(p, 'utf8');
  if (src.slice(start, end) !== expectRaw) return { ok: false, error: 'The file changed since it was loaded. Reload the dashboard.' };
  fs.writeFileSync(p, src.slice(0, start) + newRaw + src.slice(end)); return { ok: true };
}
function editLine(body) {
  const { file, start, end, raw, quote, text, tpl } = body;
  if (quote === '`') { for (const seg of tpl || []) if (!text.includes(seg)) return { ok: false, error: 'Keep the ' + seg + ' part; the game fills it in.' }; }
  return replaceRange(file, start, end, raw, encode(text, quote));
}
function removePool(body) {
  const p = path.join(SRC, body.file); let src = fs.readFileSync(p, 'utf8');
  let a = body.callStart, b = body.callEnd; if (src.slice(a, a + 3) !== 'L_(') { a = src.lastIndexOf('L_(', a + 3); }
  if (src.slice(a, a + 3) !== 'L_(') return { ok: false, error: 'Could not find that line in the file any more.' };
  // eat the trailing comma and whitespace, or a leading comma if it was last
  let e = b; while (/\s/.test(src[e])) e++; if (src[e] === ',') { e++; while (src[e] === ' ') e++; if (src[e] === '\n') e++; }
  else { let s2 = a; while (/\s/.test(src[s2 - 1])) s2--; if (src[s2 - 1] === ',') a = s2 - 1; }
  src = src.slice(0, a) + src.slice(e); src = src.replace(/\nFRESH\.(\w+) = FRESH\.\1 \|\| \[\]; FRESH\.\1\.push\(\);\n/g, '\n');
  fs.writeFileSync(p, src); return { ok: true };
}
function addPool(body) {
  const { who, text, need, d0, d1 } = body; if (!who || !text) return { ok: false, error: 'Who and what.' };
  const file = '09j_story_lines.js'; const p = path.join(SRC, file); let src = fs.readFileSync(p, 'utf8');
  const args = [encode(text, '"'), need && need.trim() ? need.trim() : 'null', String(d0 || 1), String(d1 || 99)];
  const stmt = `\nFRESH.${who} = FRESH.${who} || []; FRESH.${who}.push(L_(${args.join(', ')}));`;
  src = src.replace(/\s*$/, '') + stmt + '\n'; fs.writeFileSync(p, src); return { ok: true };
}
function editMoney(body) {
  const v = String(body.value).trim(); if (!/^\d+(\.\d+)?$/.test(v)) return { ok: false, error: 'Numbers only.' };
  const byFile = {}; for (const sp of body.spots || []) (byFile[sp.file] = byFile[sp.file] || []).push(sp);
  for (const f of Object.keys(byFile)) { const p = path.join(SRC, f); let src = fs.readFileSync(p, 'utf8'); const sps = byFile[f].sort((a, b) => b.start - a.start);
    for (const sp of sps) { if (src.slice(sp.start, sp.end) !== sp.was) return { ok: false, error: 'The file changed since it was loaded. Reload the dashboard.' }; src = src.slice(0, sp.start) + v + src.slice(sp.end); }
    fs.writeFileSync(p, src); }
  return { ok: true };
}
function editSource(body) {
  // replace a handful of lines shown in the source viewer, if they are still what the viewer showed
  const p = path.join(SRC, path.basename(body.file)); const lines = fs.readFileSync(p, 'utf8').split('\n'); const from = body.from - 1, n = (body.was || []).length;
  if (lines.slice(from, from + n).join('\n') !== (body.was || []).join('\n')) return { ok: false, error: 'The file changed since it was loaded. Reload the dashboard.' };
  const next = lines.slice(0, from).concat(String(body.text).replace(/\r/g, '').split('\n'), lines.slice(from + n)).join('\n');
  try { new Function(next); } catch (e) { return { ok: false, error: 'That would break the file: ' + e.message }; }
  fs.writeFileSync(p, next); return { ok: true };
}
function editGate(body) { return replaceRange(body.file, body.start, body.end, String(body.was), String(Math.max(1, Math.min(99, +body.day)))); }
function build() {
  try { const out = cp.execSync('node build.js', { cwd: ROOT }).toString(); fs.copyFileSync(path.join(ROOT, 'dist', '99days.html'), path.join(ROOT, 'index.html')); return { ok: true, out: out.trim() + '\nindex.html updated.' }; }
  catch (e) { return { ok: false, error: (e.stdout || '').toString() + (e.stderr || '').toString() + e.message }; }
}

// ---------------- git sync ----------------
// Two people, one repo: commit what changed here, pull what the other person pushed, rebuild, push.
function git(args, opts) { return cp.execFileSync('git', args, Object.assign({ cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }, opts || {})).trim(); }
function gitTry(args, opts) { try { return { ok: true, out: git(args, opts) }; } catch (e) { return { ok: false, out: ((e.stdout || '') + (e.stderr || '') || e.message).toString().trim() }; } }
function gitStatus(fetch) {
  if (!gitTry(['rev-parse', '--is-inside-work-tree']).ok) return { repo: false, error: 'This folder is not a git repository yet. Run: git init, then add a remote and push once.' };
  const branch = gitTry(['rev-parse', '--abbrev-ref', 'HEAD']).out || '?';
  const remote = gitTry(['remote']).out.split('\n').filter(Boolean)[0] || null;
  const dirty = gitTry(['status', '--porcelain']).out.split('\n').filter(Boolean).map(l => l.replace(/^[ MADRCU?!]{1,2}\s+/, '').replace(/^.* -> /, ''));
  let ahead = 0, behind = 0, fetched = false, fetchError = null, upstream = null;
  if (remote) {
    const up = gitTry(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']); if (up.ok) upstream = up.out;
    if (fetch) { const f = gitTry(['fetch', '--quiet', remote], { timeout: 12000 }); fetched = f.ok; if (!f.ok) fetchError = f.out.split('\n')[0]; }
    if (upstream) { const ab = gitTry(['rev-list', '--left-right', '--count', 'HEAD...@{u}']); if (ab.ok) { const m = ab.out.split(/\s+/); ahead = +m[0] || 0; behind = +m[1] || 0; } }
  }
  const last = gitTry(['log', '-1', '--format=%h %an, %ar: %s']).out;
  const theirs = behind ? gitTry(['log', '--format=%an: %s', 'HEAD..@{u}']).out.split('\n').filter(Boolean).slice(0, 8) : [];
  return { repo: true, branch, remote, upstream, dirty, ahead, behind, fetched, fetchError, last, theirs };
}
function conflictHunks() {
  const files = gitTry(['diff', '--name-only', '--diff-filter=U']).out.split('\n').filter(Boolean); const hunks = [];
  for (const f of files) { const txt = fs.readFileSync(path.join(ROOT, f), 'utf8'); const re = /^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm; let m, i = 0; while ((m = re.exec(txt))) hunks.push({ file: f, idx: i++, theirs: m[1], mine: m[2] }); }
  return hunks;
}
function applyChoices(choices) {
  const byFile = {}; for (const c of choices) (byFile[c.file] = byFile[c.file] || {})[c.idx] = c.pick;
  for (const f of Object.keys(byFile)) { const p = path.join(ROOT, f); let i = 0; const txt = fs.readFileSync(p, 'utf8').replace(/^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm, (m, theirs, mine) => (byFile[f][i++] === 'theirs' ? theirs : mine)); fs.writeFileSync(p, txt); gitTry(['add', '--', f]); }
}
function finishSync(st, msg, committed, log) {
  // rebuild so index.html matches the merged source, commit the build if it changed, push
  const b = build(); if (!b.ok) return { ok: false, log, error: 'build failed after merge: ' + b.error };
  log.push('rebuilt index.html');
  if (gitTry(['status', '--porcelain']).out.trim()) { gitTry(['add', '-A']); const c = gitTry(['commit', '-q', '-m', committed ? msg + ' (build)' : 'build index.html']); if (c.ok) log.push('committed the build'); }
  const push = gitTry(st.upstream ? ['push', '--quiet'] : ['push', '--quiet', '-u', st.remote, st.branch], { timeout: 30000 });
  if (!push.ok) return { ok: false, log, error: 'push failed: ' + push.out.split('\n').filter(Boolean).slice(-2).join(' ') };
  log.push('pushed to ' + st.remote + '/' + st.branch);
  return { ok: true, log, status: gitStatus(false) };
}
function gitSync(body) {
  const st = gitStatus(false); if (!st.repo) return { ok: false, error: st.error };
  if (!st.remote) return { ok: false, error: 'No remote yet. Push this folder to GitHub once (git remote add origin ..., git push -u origin main), then sync from here.' };
  if (fs.existsSync(path.join(git(['rev-parse', '--git-dir']), 'rebase-merge')) || fs.existsSync(path.join(git(['rev-parse', '--git-dir']), 'rebase-apply'))) return { ok: false, error: 'A merge is half done in this folder. Run: git rebase --abort in the terminal, then sync again.' };
  const log = []; const msg = (body.message || '').trim() || 'dialogue edits';
  const who = gitTry(['config', 'user.name']); if (!who.ok || !who.out) return { ok: false, error: 'git needs a name for commits. Run once: git config --global user.name "Your Name" and git config --global user.email "you@example.com"' };
  // 1. commit what changed here
  let committed = false;
  if (st.dirty.length) { const a = gitTry(['add', '-A']); if (!a.ok) return { ok: false, error: a.out, log }; const c = gitTry(['commit', '-q', '-m', msg]); if (!c.ok) return { ok: false, error: c.out, log }; committed = true; log.push(`committed ${st.dirty.length} file${st.dirty.length === 1 ? '' : 's'}: "${msg}"`); }
  else log.push('nothing new to commit here');
  // 2. pull what they pushed (rebase, so the history stays a straight line)
  const pull = gitTry(['-c', 'merge.conflictStyle=merge', 'pull', '--rebase', '--quiet', st.remote], { timeout: 30000 });
  if (!pull.ok) {
    const hunks = conflictHunks();
    if (hunks.length) { gitTry(['rebase', '--abort']); log.push(`you both changed the same ${hunks.length === 1 ? 'line' : hunks.length + ' lines'}; pick which to keep`); return { ok: false, log, conflict: { hunks, message: msg }, error: 'conflict' }; }
    if (!st.upstream && /no tracking information|There is no tracking/i.test(pull.out)) { log.push('no upstream branch yet; setting it on push'); }
    else { gitTry(['rebase', '--abort']); return { ok: false, log, error: 'pull failed: ' + pull.out.split('\n').slice(-3).join(' ') }; }
  } else { const got = st.behind; log.push(got ? `pulled ${got} commit${got === 1 ? '' : 's'} from ${st.remote}` : 'nothing new from ' + st.remote); }
  return finishSync(st, msg, committed, log);
}
function gitResolve(body) {
  // the user picked mine/theirs for every conflicting hunk: redo the pull, apply the picks, continue, push
  const st = gitStatus(false); if (!st.repo || !st.remote) return { ok: false, error: 'not a repo with a remote' };
  const log = []; const msg = (body.message || '').trim() || 'dialogue edits'; const choices = body.choices || [];
  const pull = gitTry(['-c', 'merge.conflictStyle=merge', 'pull', '--rebase', '--quiet', st.remote], { timeout: 30000 });
  if (pull.ok) { log.push('pulled cleanly this time'); return finishSync(st, msg, true, log); }
  const hunks = conflictHunks(); if (!hunks.length) { gitTry(['rebase', '--abort']); return { ok: false, log, error: 'pull failed: ' + pull.out.split('\n').slice(-3).join(' ') }; }
  if (hunks.length !== choices.length) { gitTry(['rebase', '--abort']); return { ok: false, log, error: 'The conflict changed since it was shown (your friend pushed again?). Sync again.' }; }
  applyChoices(choices);
  let cont = gitTry(['-c', 'core.editor=true', 'rebase', '--continue']);
  if (!cont.ok && /no changes|nothing to commit/i.test(cont.out)) cont = gitTry(['rebase', '--skip']);
  if (!cont.ok) { gitTry(['rebase', '--abort']); return { ok: false, log, error: 'could not finish the merge: ' + cont.out.split('\n').slice(-2).join(' ') }; }
  const mine = choices.filter(c => c.pick !== 'theirs').length; log.push(`merged: kept ${mine} of yours, ${choices.length - mine} of theirs`);
  return finishSync(st, msg, true, log);
}

// ---------------- server ----------------
const HTML = () => fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');
http.createServer((req, res) => {
  const send = (code, obj, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8' }); res.end(type ? obj : JSON.stringify(obj)); };
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) return send(200, HTML(), 'text/html; charset=utf-8');
  if (req.method === 'GET' && req.url.startsWith('/api/git/status')) { try { return send(200, gitStatus(/fetch=1/.test(req.url))); } catch (e) { return send(500, { repo: false, error: e.message }); } }
  if (req.method === 'GET' && req.url === '/src/09l_synth.js') { try { return send(200, fs.readFileSync(path.join(SRC, '09l_synth.js'), 'utf8'), 'text/javascript; charset=utf-8'); } catch (e) { return send(404, { error: 'no synth' }); } }
  if (req.method === 'GET' && req.url === '/api/data') { try { return send(200, collect()); } catch (e) { return send(500, { error: e.stack }); } }
  if (req.method === 'GET' && req.url.startsWith('/api/source')) { const u = new URL(req.url, 'http://x'); const f = u.searchParams.get('f'); const line = +u.searchParams.get('line'); try { const lines = fs.readFileSync(path.join(SRC, path.basename(f)), 'utf8').split('\n'); const a = Math.max(0, line - 4), b = Math.min(lines.length, line + 3); return send(200, { from: a + 1, lines: lines.slice(a, b) }); } catch (e) { return send(404, { error: 'no file' }); } }
  if (req.method === 'POST') {
    let data = ''; req.on('data', d => data += d); req.on('end', () => {
      let body; try { body = JSON.parse(data || '{}'); } catch (e) { return send(400, { ok: false, error: 'bad json' }); }
      try {
        if (req.url === '/api/edit') return send(200, editLine(body));
        if (req.url === '/api/pool/remove') return send(200, removePool(body));
        if (req.url === '/api/pool/add') return send(200, addPool(body));
        if (req.url === '/api/gate') return send(200, editGate(body));
        if (req.url === '/api/money') return send(200, editMoney(body));
        if (req.url === '/api/arc') return send(200, editArc(body));
        if (req.url === '/api/songs') return send(200, writeSongs(body));
        if (req.url === '/api/source/edit') return send(200, editSource(body));
        if (req.url === '/api/build') return send(200, build());
        if (req.url === '/api/git/sync') return send(200, gitSync(body));
        if (req.url === '/api/git/resolve') return send(200, gitResolve(body));
      } catch (e) { return send(500, { ok: false, error: e.stack }); }
      send(404, { ok: false, error: 'no such route' });
    }); return;
  }
  send(404, { error: 'not found' });
}).listen(PORT, () => {
  console.log(`99 Days dashboard: http://localhost:${PORT}`);
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try { cp.exec(`${open} http://localhost:${PORT}`); } catch (e) { }
});
