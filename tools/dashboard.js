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
  const files = fs.readdirSync(SRC).filter(f => /^(08|09|10)/.test(f) && f.endsWith('.js')).sort();
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
  return { files, items, gates, needs, names: NAMES };
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
function editGate(body) { return replaceRange(body.file, body.start, body.end, String(body.was), String(Math.max(1, Math.min(99, +body.day)))); }
function build() {
  try { const out = cp.execSync('node build.js', { cwd: ROOT }).toString(); fs.copyFileSync(path.join(ROOT, 'dist', '99days.html'), path.join(ROOT, 'index.html')); return { ok: true, out: out.trim() + '\nindex.html updated.' }; }
  catch (e) { return { ok: false, error: (e.stdout || '').toString() + (e.stderr || '').toString() + e.message }; }
}

// ---------------- server ----------------
const HTML = () => fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');
http.createServer((req, res) => {
  const send = (code, obj, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8' }); res.end(type ? obj : JSON.stringify(obj)); };
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) return send(200, HTML(), 'text/html; charset=utf-8');
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
        if (req.url === '/api/build') return send(200, build());
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
