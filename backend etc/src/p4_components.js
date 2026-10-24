
/* ==================================================================
   COMPONENTS
   Small functions that return HTML strings. Behaviour is wired up by
   delegated listeners in the ROUTER part.
   ================================================================== */
const ICONS = {
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.6 15.6l4.9 4.9"/>',
  settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.2l1.7 2.5 2.9-.9.4 3 2.8 1.2-1.4 2.7 1.4 2.7-2.8 1.2-.4 3-2.9-.9L12 20.8l-1.7-2.5-2.9.9-.4-3-2.8-1.2 1.4-2.7-1.4-2.7 2.8-1.2.4-3 2.9.9z"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11.1a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.2"/><path d="M15.5 8.5V6.2A2.2 2.2 0 0 0 13.3 4H6.2A2.2 2.2 0 0 0 4 6.2v7.1a2.2 2.2 0 0 0 2.2 2.2h2.3"/>',
  share: '<path d="M12 3.5v11.5M7.8 7.7L12 3.5l4.2 4.2"/><path d="M5 11.5v7A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2v-7"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7 13.5h10v7H7z"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chev: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  check: '<path pathLength="1" d="M5 12.6l4.3 4.3L19.2 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  ext: '<path d="M14 4.5h5.5V10M19.5 4.5L11.2 12.8"/><path d="M17.5 13.5v4.9a1.6 1.6 0 0 1-1.6 1.6H6.1a1.6 1.6 0 0 1-1.6-1.6V8.6A1.6 1.6 0 0 1 6.1 7h4.9"/>',
  doc: '<path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  rupee: '<path d="M7.5 5h9M7.5 9h9M10 5c3.6 0 5 1.4 5 3.6S13.3 12.3 10 12.3H8l6.7 6.7"/>',
  rupeec: '<circle cx="12" cy="12" r="8.5"/><path d="M9 8h6M9 10.6h6M10.6 8c2 0 2.8.9 2.8 2.1s-1 2.3-2.8 2.3H9.6l4.1 4"/>',
  list: '<path d="M9.5 6.5H19M9.5 12H19M9.5 17.5H19"/><circle cx="5.2" cy="6.5" r=".9" fill="currentColor"/><circle cx="5.2" cy="12" r=".9" fill="currentColor"/><circle cx="5.2" cy="17.5" r=".9" fill="currentColor"/>',
  ticket: '<path d="M4 8A1.8 1.8 0 0 1 5.8 6.2h12.4A1.8 1.8 0 0 1 20 8v2.3a1.9 1.9 0 0 0 0 3.4V16a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 16v-2.3a1.9 1.9 0 0 0 0-3.4z"/><path d="M14.5 6.5v11" stroke-dasharray="1.6 2"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  warn: '<path d="M12 4.2l8.8 15.3H3.2z"/><path d="M12 10v4.2M12 16.9v.1"/>',
  building: '<path d="M4 20.5h16M6 20.5V8.2l6-4 6 4v12.3"/><path d="M9.5 11h1M13.5 11h1M9.5 14.5h1M13.5 14.5h1M10.5 20.5v-3h3v3"/>',
  idcard: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.6 16c.6-1.5 1.6-2.3 2.9-2.3s2.3.8 2.9 2.3M14 10h4.5M14 13.5h3"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M6.5 14.5h4"/>',
  passport: '<rect x="5.5" y="3" width="13" height="18" rx="2.2"/><circle cx="12" cy="10.5" r="3"/><path d="M9 10.5h6M12 7.5c-.9.8-1.3 1.8-1.3 3s.4 2.2 1.3 3c.9-.8 1.3-1.8 1.3-3s-.4-2.2-1.3-3M9.5 17h5"/>',
  house: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5v10h12v-10"/><path d="M10 19.5v-5h4v5"/>',
  receipt: '<path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  car: '<path d="M4.5 16.5v-4.2l1.9-4.6a2 2 0 0 1 1.8-1.2h7.6a2 2 0 0 1 1.8 1.2l1.9 4.6v4.2z"/><path d="M4.5 12.3h15M6.5 16.5v2.3M17.5 16.5v2.3"/><circle cx="8" cy="14.4" r=".9" fill="currentColor"/><circle cx="16" cy="14.4" r=".9" fill="currentColor"/>',
  vote: '<rect x="3.5" y="12" width="17" height="8.5" rx="2"/><path d="M8.5 12V4.5h7V12"/><path d="M10.2 8.3l1.4 1.4 2.4-2.6M7 16.2h10"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.6v4.1c1.4 1.3 3.4 2 5.5 2s4.1-.7 5.5-2v-4.1M21.5 9.5v5.2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8v.1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.4"/>',
  shield: '<path d="M12 3.5l7 2.8v5.3c0 4.4-3 7.6-7 8.9-4-1.3-7-4.5-7-8.9V6.3z"/><path d="M9 12l2.2 2.2L15.3 10"/>',
  eye: '<path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff: '<path d="M4 4l16 16M9.9 6.1A9.6 9.6 0 0 1 12 5.8c6 0 9.2 6.2 9.2 6.2a16 16 0 0 1-2.6 3.4M14.1 17.9a9.6 9.6 0 0 1-2.1.3c-6 0-9.2-6.2-9.2-6.2a16 16 0 0 1 2.6-3.4M10 10a2.8 2.8 0 0 0 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.2"/>',
  stamp: '<path d="M9.5 3.5h5v4.2c0 1.6 2.5 2.6 2.5 5.3H7c0-2.7 2.5-3.7 2.5-5.3z"/><path d="M5 13h14v3.5H5zM7 20h10"/>',
  parcel: '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9M7.8 5.5l8.4 4"/>',
  chat: '<path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5z"/><path d="M8 10.5h.1M12 10.5h.1M16 10.5h.1"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" fill="currentColor" stroke="none"/>',
  bank: '<path d="M3.5 9.5L12 4.5l8.5 5"/><path d="M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7M3.5 19.5h17"/>',
  pencil: '<path d="M14.5 5.5l4 4L8.5 19.5H4.5v-4z"/><path d="M12.8 7.2l4 4"/>',
  folder: '<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.4l2 2H19a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M3.5 11h17"/>',
  up: '<path d="M12 19V5.5M6 11.5l6-6 6 6"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  logo: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.6a2 2 0 0 0 0 3.8v2.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2.6a2 2 0 0 0 0-3.8z" fill="#fff" stroke="none"/>'
};
function icon(name, cls) { return '<svg class="ic i-' + name + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>'; }
function tile(name, color, size) { return '<span class="tile ' + color + (size ? ' ' + size : '') + '" aria-hidden="true">' + icon(name) + '</span>'; }
const SEC_META = { bring: { icon: 'doc', cls: 't-bring' }, go: { icon: 'clock', cls: 't-go' }, pay: { icon: 'rupee', cls: 't-pay' }, steps: { icon: 'list', cls: 't-steps' }, ticket: { icon: 'ticket', cls: 't-ticket' } };
const TASK_ICON = { aadhaar: 'idcard', pan: 'card', passport: 'passport', rent: 'house', itr: 'receipt', dl: 'car', voter: 'vote', eduloan: 'cap' };
function taskTile(task, size) { return tile(TASK_ICON[task.id], 't-' + task.id, size); }
const TICK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path pathLength="1" d="M6.2 12.6l3.8 3.8L17.8 8.4"/></svg>';

function extLink(link, text, cls) {
  return '<a class="ext' + (cls ? ' ' + cls : '') + '" href="' + link.href + '" target="_blank" rel="noopener noreferrer">' + esc(text || link.text) + icon('ext') + '<span class="sr-only"> (opens in a new tab)</span></a>';
}
function extButton(link, text, primary) {
  return '<a class="btn' + (primary ? ' btn-primary' : '') + '" href="' + link.href + '" target="_blank" rel="noopener noreferrer">' + esc(text || ('Open ' + link.text)) + icon('ext', 'ic-s') + '<span class="sr-only"> (opens in a new tab)</span></a>';
}
function ptitle(kn, en, lead) {
  return '<header class="phead">' + (kn ? '<span class="kn" lang="kn">' + kn + '</span>' : '') + '<h1 class="h1" id="page-h" tabindex="-1">' + esc(en) + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + '</header>';
}
function plate(secId) {
  const s = SECTIONS.find(x => x.id === secId), m = SEC_META[secId];
  return '<div class="sec-top">' + tile(m.icon, m.cls, 'lg') + '<div><span class="kn" lang="kn">' + s.kn + '</span>' +
    '<h2 id="sec-h" tabindex="-1" aria-label="Step ' + s.n + ' of 5: ' + s.en + '">' + s.en + '</h2></div>' +
    '<div class="sec-of" aria-hidden="true">Step ' + s.n + ' of 5' + boxes(5, s.n) + '</div></div>';
}
function boxes(n, on, cls) {
  let h = '';
  for (let i = 0; i < n; i++) h += '<span class="bx' + (i < on ? ' on' : '') + '" style="--i:' + i + '"></span>';
  return '<span class="boxes' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + h + '</span>';
}
function ring(id, done, total) {
  return '<span class="ring" data-ring="' + id + '" data-p="' + (done / total) + '" aria-hidden="true"><svg viewBox="0 0 52 52"><circle class="r-track" cx="26" cy="26" r="22"/>' +
    '<circle class="r-val" cx="26" cy="26" r="22" style="stroke-dashoffset:138.2"/></svg><b>' + done + '/' + total + '</b></span>';
}
function stamp(text, opt) {
  opt = opt || {};
  return '<span class="stamp' + (opt.color ? ' ' + opt.color : '') + (opt.size ? ' ' + opt.size : '') + (opt.anim ? ' ' + opt.anim : '') + '"' +
    (opt.rot ? ' style="--rot:' + opt.rot + 'deg"' : '') + ' aria-hidden="true">' + (opt.icon ? icon(opt.icon) : '') + esc(text) + '</span>';
}
function led(l1, l2, aria, opt) {
  opt = opt || {};
  return '<div class="led' + (opt.mini ? ' led-mini' : '') + '" role="img" aria-label="' + esc(aria) + '">' +
    '<span class="led-l1" data-led translate="no">' + esc(tr(l1)) + '</span><span class="led-l2" data-led translate="no">' + esc(tr(l2)) + '</span>' +
    (opt.l3 ? '<span class="led-l3">' + esc(opt.l3) + '</span>' : '') + '</div>';
}
function ledDate(date) { const { m, d } = parseYmd(date); return WD[wdOf(date)].toUpperCase() + ' ' + d + ' ' + MON[m - 1].toUpperCase(); }
/* Segmented control. items: [{id, label, sub, pressed, attrs}] */
function seg(segId, label, items, cls) {
  return '<div class="seg' + (cls ? ' ' + cls : '') + '" role="group" aria-label="' + esc(label) + '" data-seg="' + segId + '"><span class="seg-thumb" aria-hidden="true"></span>' +
    items.map(it => '<button type="button" id="' + it.id + '" ' + it.attrs + ' aria-pressed="' + !!it.pressed + '">' + esc(it.label) + (it.sub ? '<span class="sub">' + esc(it.sub) + '</span>' : '') + '</button>').join('') + '</div>';
}

/* ---------- Checklist ---------- */
function ckId(key, tid) { return 'ck-' + key.replace(/[^a-z0-9]/gi, '-') + '-' + tid.replace(/[^a-z0-9]/gi, '-'); }
function checkRow(key, tid, label, o) {
  o = o || {};
  const ticks = ticksOf(key);
  const id = ckId(key, tid);
  const have = o.doc && S.docs[o.doc];
  return '<label class="ck" for="' + id + '"><input type="checkbox" class="ck-in" id="' + id + '" data-tick="' + esc(tid) + '"' + (ticks[tid] ? ' checked' : '') + '>' +
    '<span class="ck-box">' + TICK_SVG + '</span><span class="ck-text"><span>' + esc(label) + '</span>' +
    (o.optional ? '<span class="tag">If needed</span>' : '') +
    (have ? '<span class="tag tag-have">' + icon('check') + 'You have it</span>' : '') +
    (o.note ? '<span class="note">' + esc(o.note) + '</span>' : '') + (o.meta ? srcLine(o.meta) : '') + '</span></label>';
}
function groupState(done) { return done ? icon('check') + 'Packed' : 'Any one'; }
function checklist(task, cs) {
  const key = keyOf(task, cs), ticks = ticksOf(key);
  return cs.items.map(it => {
    if (it.pick) {
      const done = itemDone(it, ticks);
      /* Options that share one source and check date show it once, under the group's title. */
      const shared = sameMeta(it.pick.map(o => o.meta));
      return '<fieldset class="grp" data-grp="' + it.id + '"><legend><span>' + esc(it.label) + '</span><span class="gstate' + (done ? ' on' : '') + '" data-gstate="' + it.id + '">' + groupState(done) + '</span></legend>' +
        (shared ? srcLine(it.pick[0].meta, 'p') : '') +
        '<div class="opts">' + it.pick.map(o => checkRow(key, it.id + ':' + o.id, o.label, { note: o.note, doc: o.doc, meta: shared ? null : o.meta })).join('') + '</div></fieldset>';
    }
    return checkRow(key, it.id, it.label, it);
  }).join('');
}

/* ---------- Paper slip ---------- */
function barcode(seed) {
  let h = hash(seed) || 1, x = 0;
  const stops = [];
  const next = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; };
  while (x < 99) {
    const w = 0.55 + (next() % 4) * 0.5, g = 0.45 + (next() % 3) * 0.55;
    const a = x.toFixed(2), b = Math.min(100, x + w).toFixed(2), c = Math.min(100, x + w + g).toFixed(2);
    stops.push('#2A2A2E ' + a + '% ' + b + '%', 'transparent ' + b + '% ' + c + '%');
    x += w + g;
  }
  return 'linear-gradient(90deg,' + stops.join(',') + ')';
}
function goSummary(task, cs, now) {
  if (task.offices.length) {
    const g = goChoice(task, now);
    if (!g.day || !g.sel) return { lines: ['Pick a day'], short: 'Pick a day' };
    const lines = [fmtDay(g.day.date) + ', ' + fmtTime(g.sel.t), g.o.name];
    if (cs.go.mode === 'both') lines.push('Or online: ' + cs.go.online.links[0].text);
    return { lines, short: WD[wdOf(g.day.date)] + ' ' + fmtTime(g.sel.t), g };
  }
  if (cs.go.summary) return { lines: cs.go.summary.lines.slice(), short: cs.go.summary.short };
  const links = cs.go.online.links.map(l => l.text).join(' or ');
  return { lines: ['Online', links], short: 'Online' };
}
function slipData(task, cs, now) {
  const key = keyOf(task, cs), ticks = ticksOf(key), st = bringStats(task, cs);
  const date = tripDate(task, cs, now);
  const fee = feeFor(task, cs);
  const go = goSummary(task, cs, now);
  const bring = cs.items.filter(i => !i.optional).map(it => {
    const p = pickedOption(it, ticks);
    const lbl = it.pick ? it.label.replace(/, pick one$/, '') + (p ? ': ' + p.label : ' (any one)') : it.label;
    return { done: itemDone(it, ticks), lbl };
  });
  const r = feeRange(fee);
  const pay = fee.total ? 'Fee: ' + fee.total.toLowerCase() : r ? 'Stamp duty ' + inr(r[0]) + '–' + inr(r[1]) : 'Official total ' + inr(feeTotal(fee)) + (feeTotal(fee) === 0 ? ' (free)' : '');
  return { key, st, token: tokenFor(task, cs, date), date, bring, go, pay, stampText: st.all ? 'READY TO GO' : st.left + (st.left === 1 ? ' ITEM' : ' ITEMS') + ' LEFT' };
}
function slipSig(task, cs, now) {
  const d = slipData(task, cs, now);
  return JSON.stringify([d.token, d.bring.map(b => b.done ? 1 : 0), d.go.lines, d.pay]);
}
function slipHTML(task, cs, now, opt) {
  opt = opt || {};
  const d = opt.specimen ? specimenData(task, cs, now) : slipData(task, cs, now);
  const cls = ['slip-wrap'];
  if (opt.mini) cls.push('slip-mini');
  if (opt.flat) cls.push('slip-flat');
  if (opt.print) cls.push('slip-print');
  if (opt.anim) cls.push(opt.anim);
  const bring = d.bring.map(b => '<li><span>[' + (b.done ? 'x' : '&nbsp;') + ']</span><span>' + esc(b.lbl) + '</span></li>').join('');
  return '<div class="' + cls.join(' ') + '"' + (opt.id ? ' id="' + opt.id + '"' : '') + '><div class="slip">' +
    '<div class="slip-head"><div class="slip-brand">BRING GO PAY</div><div>' + (opt.specimen ? 'Specimen slip, Bengaluru' : 'Trip slip, Bengaluru') + '</div><div>' +
    (opt.specimen ? 'Not a real token' : 'Printed ' + fmtDate(now.date)) + '</div></div>' +
    '<div class="slip-token"><span class="sr-only">Token </span>' + esc(d.token) + '</div>' +
    '<div class="slip-case">' + esc(task.name + ', ' + cs.label) + '</div>' +
    '<div class="slip-row"><div class="slip-k">BRING</div><ul aria-label="Bring">' + bring + '</ul></div>' +
    '<div class="slip-row"><div class="slip-k">GO</div><div>' + d.go.lines.map(esc).join('<br>') + '</div></div>' +
    '<div class="slip-row"><div class="slip-k">PAY</div><div>' + esc(d.pay) + '</div></div>' +
    '<div class="slip-bar" aria-hidden="true" style="background-image:' + barcode(d.token) + '"></div>' +
    '<div class="slip-foot">Rush times are estimates</div>' +
    stamp(d.stampText, { anim: opt.stampAnim || '', rot: opt.specimen ? -8 : -6 }) +
    '<span class="sr-only">' + (opt.specimen ? 'Specimen.' : (d.st.all ? 'Ready to go.' : esc(cap(d.stampText.toLowerCase())) + '.')) + '</span>' +
    '</div></div>';
}
function specimenData(task, cs, now) {
  const fee = feeFor(task, cs);
  let go;
  if (task.offices.length) {
    const o = OFFICES[task.offices[0]];
    const c = calmestWeek(o, now) || { date: now.date, t: o.open };
    go = { lines: [fmtDay(c.date) + ', ' + fmtTime(c.t), o.name] };
  } else go = { lines: ['Online', cs.go.online.links.map(l => l.text).join(' or ')] };
  const token = task.id === 'aadhaar' ? 'AAD-2773' : tokenFor(task, cs, 'specimen');
  return {
    token, go, st: null,
    bring: cs.items.filter(i => !i.optional).map(it => ({ done: false, lbl: it.pick ? it.label.replace(/, pick one$/, '') + ' (any one)' : it.label })),
    pay: 'Official total ' + inr(feeTotal(fee)) + (feeTotal(fee) === 0 ? ' (free)' : ''),
    stampText: 'SPECIMEN'
  };
}

/* ---------- Rupee amount: one real input drawn as six cells ---------- */
function digitField(id, label, value) {
  return '<div class="digits"><label class="lbl" for="' + id + '">' + esc(label) + '</label><div class="digits-row"><span class="rupee" aria-hidden="true">₹</span>' +
    '<div class="digits-field"><span class="digits-cells" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
    '<input class="digits-input" id="' + id + '" name="' + id + '" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" enterkeyhint="done" spellcheck="false" value="' + esc(value || '') + '" aria-describedby="' + id + '-hint"></div></div>' +
    '<span class="sr-only" id="' + id + '-hint">Whole rupees, up to 6 digits.</span></div>';
}
/* Line the real digits up with the drawn cells: letter-spacing = cell pitch - digit width. */
function fitDigits(root) {
  $$('.digits-field', root || document).forEach(f => {
    const inp = $('input', f), cells = $$('.digits-cells i', f);
    if (!inp || cells.length < 2) return;
    const r0 = cells[0].getBoundingClientRect(), r1 = cells[1].getBoundingClientRect();
    const cw = r0.width, pitch = r1.left - r0.left;
    if (!cw || !pitch) return;
    const cs = getComputedStyle(inp);
    const probe = document.createElement('span');
    probe.textContent = '0123456789';
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;letter-spacing:0;font-variant-numeric:tabular-nums;font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight;
    document.body.appendChild(probe);
    const adv = probe.getBoundingClientRect().width / 10;
    probe.remove();
    const ls = Math.max(0, pitch - adv), pad = Math.max(0, (cw - adv) / 2);
    inp.style.setProperty('--ls', ls.toFixed(2) + 'px');
    inp.style.setProperty('--pad', pad.toFixed(2) + 'px');
    inp.style.width = (pitch * 6 + pad + 3).toFixed(2) + 'px';
  });
}

/* ---------- Quote verdict ---------- */
function verdictOf(a, b) {
  const { o, f, h } = b;
  if (a < o) return { k: 'below', title: 'Below official', stamp: 'Below fee', color: 'amber', icon: 'warn', text: 'That\'s less than the official fee. Ask what\'s included and keep the receipt.' };
  if (a === o) return { k: 'exact', title: 'Exactly right', stamp: 'Exact fee', color: 'green', icon: 'check', text: o === 0 ? 'It is free, and that is what you were quoted. Nothing extra to pay.' : 'That\'s the official fee, with nothing added. Keep the receipt.' };
  if (a <= f) return { k: 'fair', title: 'Fair', stamp: 'Fair', color: 'green', icon: 'check', text: (o === 0 ? 'The official fee is ₹0' : inr(o) + ' is the official fee') + '; ' + inr(a - o) + ' for help is reasonable.' };
  if (a <= h) return { k: 'high', title: 'On the high side', stamp: 'High', color: 'amber', icon: 'warn', text: 'That\'s ' + inr(a - o) + ' on top of the official ' + inr(o) + '. Fair help costs up to ' + inr(f) + ' in total.' };
  return { k: 'over', title: 'Overcharged', stamp: 'Overcharged', color: 'red', icon: 'warn', text: 'That\'s ' + inr(a - o) + ' more than the official fee of ' + inr(o) + ', and above the ' + inr(h) + ' high limit.' };
}
function scaleMax(b) { return Math.max(Math.round(b.h * 1.45), b.h + 250); }
function scalePos(a, b) {
  const max = scaleMax(b);
  const pts = [[0, 0], [b.o, b.o === 0 ? 0 : 16], [b.f, 50], [b.h, 76], [max, 100]];
  a = Math.max(0, Math.min(max, a));
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (a <= x1) return x1 === x0 ? y1 : y0 + (a - x0) / (x1 - x0) * (y1 - y0);
  }
  return 100;
}
function roundOver(h) { const step = h < 1000 ? 500 : 1000; return (Math.floor(h / step) + 1) * step; }
function quickPicks(b) { return [[b.o, 'official'], [b.f, 'fair limit'], [b.h, 'high limit'], [roundOver(b.h), '']]; }
function verdictHTML(a, b, anim) {
  const v = verdictOf(a, b);
  const pos = scalePos(a, b);
  const p0 = scalePos(b.o, b), pf = 50, ph = 76;
  const say = (v.k === 'high' || v.k === 'over' || v.k === 'fair')
    ? '<p class="say">Say this: “' + (b.o === 0 ? 'This is free on the official site.' : 'The official fee is ' + inr(b.o) + '.') + ' I\'m happy to pay up to ' + inr(b.f) + ' with your service charge.”</p>' : '';
  const keep = a > b.o ? '<p class="keep t-' + v.color + '">Do it yourself and keep <span class="amt" data-count="' + (a - b.o) + '">' + inr(anim ? 0 : a - b.o) + '</span></p>' : '';
  return '<div class="verdict" data-verdict="' + v.k + '">' +
    '<div class="verdict-top"><p class="verdict-title t-' + v.color + '">' + esc(v.title) + '<span class="sr-only">: you were quoted ' + inr(a) + '.</span></p>' +
    stamp(v.stamp, { color: v.color === 'green' ? '' : v.color, icon: v.icon, anim: anim ? 'land' : '' }) + '</div>' +
    '<p>' + esc(v.text) + '</p>' +
    '<div class="scale" aria-hidden="true"><div class="needle" style="left:' + (anim ? p0 : pos).toFixed(1) + '%" data-to="' + pos.toFixed(1) + '"></div>' +
    '<div class="scale-bar">' + (p0 > 0 ? '<span class="z-below" style="width:' + p0 + '%"></span>' : '') + '<span class="z-fair" style="width:' + (pf - p0) + '%"></span><span class="z-high" style="width:' + (ph - pf) + '%"></span><span class="z-over" style="width:' + (100 - ph) + '%"></span></div>' +
    '<div class="scale-ticks"><span style="left:' + p0 + '%">' + inr(b.o) + '</span><span style="left:' + pf + '%">' + inr(b.f) + '</span><span style="left:' + ph + '%">' + inr(b.h) + '</span></div></div>' +
    '<p class="small muted">Official fee ' + inr(b.o) + '. Fair with help up to ' + inr(b.f) + ', high up to ' + inr(b.h) + '. Pilot estimate.</p>' +
    say + keep + '</div>';
}
function quoteBox(qid, task, cs, opt) {
  opt = opt || {};
  const b = bandFor(task, cs);
  const amt = opt.amount != null ? String(opt.amount) : '';
  return '<div class="quote" data-quote="' + qid + '" data-task="' + task.id + '" data-case="' + cs.id + '">' +
    '<div class="quote-row">' + digitField(qid + '-amt', 'Amount you were quoted', amt) +
    '<button type="button" class="btn magnetic' + (opt.primary ? ' btn-primary' : '') + '" data-act="qcheck" data-q="' + qid + '">Check</button></div>' +
    '<div><p class="small muted" id="' + qid + '-qp" style="margin-bottom:8px">Quick picks</p><div class="qpicks" role="group" aria-labelledby="' + qid + '-qp">' +
    quickPicks(b).map(([v, l]) => '<button type="button" class="chip-inline" data-act="qpick" data-q="' + qid + '" data-amt="' + v + '">' + inr(v) + (l ? ', ' + l : '') + '</button>').join('') + '</div></div>' +
    '<div class="verdict-slot" id="' + qid + '-out" aria-live="polite">' + (opt.verdictFor != null ? verdictHTML(opt.verdictFor, b, false) : '') + '</div></div>';
}

/* ---------- Heatmap ---------- */
function heatmap(o, now, sel) {
  const slots = allSlots(o);
  let h = '<div class="heat" role="group" aria-label="Rush estimate for ' + esc(o.short) + ', next 7 days, every 30 minutes" style="grid-template-columns:4.2rem repeat(' + slots.length + ',minmax(0,1fr))">';
  h += '<span aria-hidden="true"></span>';
  for (const t of slots) h += '<span class="heat-h" aria-hidden="true">' + (t % 60 === 0 ? ((Math.floor(t / 60) % 12) || 12) : '') + '</span>';
  for (let i = 0; i < 7; i++) {
    const date = addDays(now.date, i);
    const dl = i === 0 ? 'Today' : WD[wdOf(date)] + ' ' + parseYmd(date).d;
    h += '<span class="heat-d" aria-hidden="true">' + dl + '</span>';
    const open = isOpenDay(o, date);
    for (const t of slots) {
      const name = WD[wdOf(date)] + ' ' + parseYmd(date).d + ' ' + MON[parseYmd(date).m - 1] + ', ' + fmtTime(t);
      if (!open) { h += '<span class="heat-c off" style="--r:' + i + ';--c:' + slots.indexOf(t) + '" role="img" aria-label="' + name + ', closed"></span>'; continue; }
      const s = score(o, date, t);
      const past = i === 0 && t <= now.mins;
      const best = sel && sel.date === date && sel.t === t;
      const p = Math.round(6 + s * 86);
      h += '<span class="heat-c' + (best ? ' best' : '') + (past ? ' past' : '') + '" style="--p:' + p + '%;--r:' + i + ';--c:' + slots.indexOf(t) + '" role="img" aria-label="' + name + ', ' + level(s).toLowerCase() + (past ? ', already passed' : '') + (best ? ', your slot' : '') + '"></span>';
    }
  }
  h += '</div>';
  const sw = s => 'style="background:color-mix(in srgb,var(--accent) ' + Math.round(6 + s * 86) + '%,var(--surface-2))"';
  h += '<p class="heat-legend"><span><i ' + sw(.2) + '></i>Quiet</span><span><i ' + sw(.45) + '></i>Moderate</span><span><i ' + sw(.65) + '></i>Busy</span><span><i ' + sw(.9) + '></i>Packed</span>' +
    '<span><i style="background:var(--g-orange)"></i>Your slot</span><span><i class="sw-off"></i>Closed</span></p>' +
    '<p class="est" style="margin-top:8px">Hours run left to right from opening time. Estimate, not live data.</p>';
  return h;
}

/* ---------- Go tools: office, LED, day picker, alternatives, actions ---------- */
function calUrl(title, date, t, address, details) {
  const d = date.replace(/-/g, '');
  const enc = encodeURIComponent;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + enc(title) +
    '&dates=' + d + 'T' + hhmm(t) + '00/' + d + 'T' + hhmm(t + 60) + '00&ctz=Asia/Kolkata&location=' + enc(address) + '&details=' + enc(details);
}
function mapsUrl(o) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.name + ', ' + o.address); }
function foldOpen(id, def) { return (id in memo.openFolds ? memo.openFolds[id] : def) ? ' open' : ''; }
function fold(id, title, body, def) {
  return '<details class="fold" data-fold="' + id + '"' + foldOpen(id, def) + '><summary>' + esc(title) + '</summary><div class="fold-body">' + body + '</div></details>';
}

function goTools(ctx) {
  // ctx: { task, cs (optional), scope: 'guide'|'office', officeId (office scope), note }
  const now = nowIST();
  const task = ctx.task;
  const g = goChoice(task, now, ctx.scope === 'office' ? ctx.officeId : null);
  const o = g.o, st = officeStatus(o, now);
  const data = 'data-scope="' + ctx.scope + '" data-task="' + task.id + '"';
  let h = '';
  if (ctx.scope === 'guide' && task.offices.length > 1) {
    h += seg('off-' + task.id, 'Which office?', task.offices.map(id => {
      const xs = officeStatus(OFFICES[id], now);
      return { id: 'off-' + id, label: OFFICES[id].short, sub: xs.open ? 'Open now' : 'Closed', pressed: id === o.id, attrs: 'data-act="office" ' + data + ' data-office="' + id + '"' };
    }), 'seg-block seg-lg office-seg');
  }
  h += '<p class="office-status"><span class="dot' + (st.open ? ' on' : '') + '" aria-hidden="true"></span><span><strong>' + esc(o.short) + '</strong>: ' + esc(st.text) + '</span></p>';
  if (o.noticeShort) h += '<p class="notice" style="margin:-4px 0 18px"><span><strong>' + esc(o.noticeShort) + '.</strong> Go to GM Tech Park, EPIP Zone, not the old Marathahalli address.</span></p>';
  if (!g.day || !g.sel) {
    h += '<p>No open slots in the next 7 days. Check the hours below.</p>';
  } else {
    const date = g.day.date, t = g.sel.t;
    h += led(ledDate(date), fmtTime(t), 'Suggested time: ' + fmtDayLong(date) + ', ' + fmtTime(t) + ' in Bengaluru');
    h += '<p class="led-cap">' + esc(cap(relDay(date, now.date))) + ', usually ' + level(g.sel.s).toLowerCase() + '. <span class="est">Estimate, not live data. Times are in Bengaluru.</span></p>';
  }
  h += '<h3 class="q" id="dayq-' + ctx.scope + '">Which day suits you?</h3><div class="chips" role="group" aria-labelledby="dayq-' + ctx.scope + '">' + g.days.map((d, i) => {
    const on = g.day && d.date === g.day.date;
    const top = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WD[wdOf(d.date)];
    return '<button type="button" class="chip" id="day-' + d.date + '" data-act="day" data-date="' + d.date + '" ' + data + ' data-office="' + o.id + '"' + (d.closed ? ' disabled' : '') + ' aria-pressed="' + on + '"' +
      ' aria-label="' + esc(top + ', ' + fmtDayLong(d.date) + (d.closed ? ', ' + d.closed.toLowerCase() : '')) + '">' +
      '<span class="c-top">' + esc(top) + '</span><span class="c-num">' + parseYmd(d.date).d + '</span><span class="c-sub">' + esc(d.closed || MON[parseYmd(d.date).m - 1]) + '</span></button>';
  }).join('') + '</div>';
  if (g.b && g.sel) {
    const others = [g.b.best].concat(g.b.alts).filter(x => x.t !== g.sel.t).slice(0, 2);
    if (others.length) {
      h += '<div class="alts"><span>Or try</span>' + others.map(x => '<button type="button" class="chip-inline" id="alt-' + x.t + '" data-act="alt" data-t="' + x.t + '" data-date="' + g.day.date + '" ' + data + ' data-office="' + o.id + '">' +
        fmtTime(x.t) + ', ' + level(x.s).toLowerCase() + (x === g.b.best ? ' (calmest)' : '') + '</button>').join('') + '</div>';
    }
    let title, details;
    if (ctx.scope === 'guide' && ctx.cs) {
      const sd = slipData(task, ctx.cs, now);
      title = task.name + ': ' + ctx.cs.label + ', ' + o.short;
      details = 'Bring: ' + sd.bring.map(b => b.lbl).join('; ') + '\nOfficial fee: ' + feeTotalText(feeFor(task, ctx.cs)) + '\nRush time is an estimate, not live data.\nFrom Bring Go Pay';
    } else {
      title = 'Visit ' + o.name;
      details = o.how + '\nRush time is an estimate, not live data.\nFrom Bring Go Pay';
    }
    h += '<div class="btn-row go-actions">' +
      '<a class="btn btn-primary" href="' + calUrl(title, g.day.date, g.sel.t, o.name + ', ' + o.address, details) + '" target="_blank" rel="noopener noreferrer" data-act="cal" ' + data + ' id="cal-' + ctx.scope + '">' + icon('calendar') + 'Add to calendar<span class="sr-only"> (opens Google Calendar in a new tab)</span></a>' +
      '<a class="btn" href="' + mapsUrl(o) + '" target="_blank" rel="noopener noreferrer">' + icon('pin') + 'Directions<span class="sr-only"> (opens Google Maps in a new tab)</span></a>' +
      '<button type="button" class="btn" data-act="copy" data-copy="' + esc(o.name + ', ' + o.address) + '" data-done="Copied">' + icon('copy') + '<span class="lbl-t">Copy address</span></button></div>';
  }
  if (ctx.note) h += '<p class="notice" style="margin:0 0 20px"><span>' + esc(ctx.note) + '</span></p>';
  h += fold('fold-heat-' + ctx.scope, 'Whole week, hour by hour', heatmap(o, now, g.sel && g.day ? { date: g.day.date, t: g.sel.t } : null), false);
  h += fold('fold-addr-' + ctx.scope, 'Address and hours', '<p><strong>' + esc(o.name) + '</strong><br><span translate="no">' + esc(o.address) + '</span></p><p style="margin-top:10px">' + esc(o.hours) + ' ' + esc(o.how) + '</p>' +
    (o.notice ? '<p class="notice" style="margin-top:14px"><span><strong>Notice:</strong> ' + esc(o.notice) + '</span></p>' : ''), false);
  return h;
}

/* ---------- My documents ---------- */
function docsCount() { return DOCS.filter(d => S.docs[d.id]).length; }
function docsList(px) {
  const list = memo.docsAll ? DOCS : DOCS.slice(0, 7);
  return '<div class="docs-list" role="group" aria-label="Documents you have at home">' + list.map(d =>
    '<label class="ck" for="' + px + '-doc-' + d.id + '"><input type="checkbox" class="ck-in" id="' + px + '-doc-' + d.id + '" data-doc="' + d.id + '"' + (S.docs[d.id] ? ' checked' : '') + '>' +
    '<span class="ck-box">' + TICK_SVG + '</span><span class="ck-text"><span>' + esc(d.label) + '</span></span></label>').join('') + '</div>' +
    (memo.docsAll ? '' : '<button type="button" class="btn-text" data-act="docs-all" data-px="' + px + '" id="' + px + '-docs-all">Show all ' + DOCS.length + ' documents' + icon('chev') + '</button>');
}
function docsCard(hid, level, px) {
  const tag = level || 'h2';
  return '<section class="docs-card card" aria-labelledby="' + hid + '"><span class="kn" lang="kn">' + KN.docs + '</span><' + tag + ' id="' + hid + '">My documents</' + tag + '>' +
    '<p class="muted" style="margin:6px 0 4px">Tick what you have at home. Guides then show “You have it” and can tick those for you. This list keeps only which documents you have; numbers and copies live in your vault.</p>' +
    '<p class="small" style="font-weight:600" data-docs-count>' + docsCount() + ' of ' + DOCS.length + ' ticked</p>' + docsList(px || 'pg') + '</section>';
}

/* ---------- Search ---------- */
function normalize(s) {
  return String(s).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\p{M}]+/gu, '').replace(/(.)\1+/gu, '$1');
}
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
let SEARCH_INDEX = null;
function searchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const out = [];
  for (const t of Object.values(TASKS)) for (const c of t.cases) {
    const key = keyOf(t, c);
    const terms = [t.name, t.short, t.kn, c.name, c.label, t.short + ' ' + c.name, t.short + ' ' + c.label, t.name + ' ' + c.name].concat(ALIASES[key] || []);
    if (I18n.lang !== 'en') terms.push(tr(t.name), tr(t.short), tr(c.name), tr(c.label), tr(t.line), tr(t.name) + ' ' + tr(c.name));
    out.push({ kind: 'guide', key, task: t, cs: c, title: t.name + ': ' + c.name, href: '#' + key, terms: terms.map(normalize).filter(Boolean), order: out.length });
  }
  for (const o of Object.values(OFFICES)) {
    const terms = [o.name, o.short, o.area].concat(OFFICE_ALIASES[o.type]);
    if (I18n.lang !== 'en') terms.push(tr(o.name), tr(o.short), tr(o.area));
    out.push({ kind: 'office', office: o, title: o.name, href: '#best-time.' + o.id, terms: terms.map(normalize).filter(Boolean), order: out.length });
  }
  return (SEARCH_INDEX = out);
}
function termScore(q, term) {
  if (!q || !term) return 0;
  if (term === q) return 100;
  if (term.startsWith(q)) return 80;
  if (term.includes(q)) return 60;
  if (q.length >= 4) {
    if (lev(q, term.slice(0, q.length), 2) <= 2) return 30;
    if (lev(q, term, 2) <= 2) return 30;
  }
  return 0;
}
function searchAll(raw) {
  const q = normalize(raw);
  if (!q) return [];
  const words = raw.toLowerCase().split(/\s+/).map(normalize).filter(Boolean);
  const scored = searchIndex().map(e => {
    let s = Math.max.apply(null, e.terms.map(t => termScore(q, t)));
    if (words.length > 1) {
      let sum = 0, ok = true;
      for (const w of words) { const ws = Math.max.apply(null, e.terms.map(t => termScore(w, t))); if (!ws) { ok = false; break; } sum += ws; }
      if (ok) s = Math.max(s, sum / words.length + 5);
    }
    return { e, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.e.order - b.e.order).slice(0, 6);
  return scored.filter(x => x.e.kind === 'guide').concat(scored.filter(x => x.e.kind === 'office')).map(x => x.e);
}
function entrySub(e) {
  if (e.kind === 'guide') return e.task.mode + ', ' + feeShort(feeFor(e.task, e.cs));
  const st = officeStatus(e.office, nowIST());
  return e.office.area + '. ' + st.text;
}
function recentEntries() {
  const idx = searchIndex();
  const keys = S.recent.filter(k => caseByKey(k));
  if (keys.length) return { label: 'Recent guides', items: keys.map(k => idx.find(e => e.key === k)).slice(0, 6) };
  return { label: 'Guides', items: TASK_IDS.map(id => idx.find(e => e.key === id + '.' + TASKS[id].cases[0].id)) };
}
function mountSearch(input, pop, onPick, inline) {
  let items = [], active = -1;
  const optId = i => pop.id + '-o' + i;
  function setActive(i) {
    active = i;
    $$('.sr-item', pop).forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
    if (i >= 0 && items[i]) { input.setAttribute('aria-activedescendant', optId(i)); const el = document.getElementById(optId(i)); if (el) el.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function group(label, list, start) {
    return '<div role="group" aria-label="' + esc(label) + '"><div class="sr-gh" aria-hidden="true">' + esc(label) + '</div>' + list.map((e, i) =>
      '<div class="sr-item" role="option" id="' + optId(start + i) + '" data-i="' + (start + i) + '" aria-selected="false">' +
      (e.kind === 'guide' ? taskTile(e.task, 'sm') : tile('building', 't-office', 'sm')) +
      '<span><span class="sr-title">' + esc(e.title) + '</span><span class="sr-sub">' + esc(entrySub(e)) + '</span></span>' + icon('chev', 'chev') + '</div>').join('') + '</div>';
  }
  function draw() {
    const q = input.value.trim();
    let html = '';
    if (!q) {
      const r = recentEntries(); items = r.items; html = group(r.label, items, 0);
    } else {
      items = searchAll(q);
      if (!items.length) html = '<p class="sr-empty" role="status">No guide for “' + esc(q) + '” yet. Try Aadhaar, PAN, passport, rent or tax.</p>';
      else {
        const gd = items.filter(e => e.kind === 'guide'), of = items.filter(e => e.kind === 'office');
        html = (gd.length ? group('Guides', gd, 0) : '') + (of.length ? group('Offices', of, gd.length) : '');
      }
    }
    const wasHidden = pop.hidden;
    pop.innerHTML = html;
    if (inline) { pop.hidden = false; input.setAttribute('aria-expanded', 'true'); if (!wasHidden) pop.style.animation = 'none'; else pop.style.animation = ''; }
    setActive(items.length && q ? 0 : -1);
  }
  function close() { if (inline) { pop.hidden = true; input.setAttribute('aria-expanded', 'false'); setActive(-1); } }
  input.addEventListener('input', draw);
  input.addEventListener('focus', () => { if (inline) draw(); });
  input.addEventListener('blur', () => { if (inline) setTimeout(close, 120); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) draw(); if (items.length) setActive((active + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setActive(active <= 0 ? items.length - 1 : active - 1); }
    else if (e.key === 'Enter') { const pick = items[active >= 0 ? active : 0]; if (pick && (active >= 0 || input.value.trim())) { e.preventDefault(); onPick(pick); } }
    else if (e.key === 'Escape' && inline && !pop.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
  });
  pop.addEventListener('mousedown', e => e.preventDefault());
  pop.addEventListener('click', e => { const it = e.target.closest('.sr-item'); if (it) onPick(items[+it.dataset.i]); });
  pop.addEventListener('mousemove', e => { const it = e.target.closest('.sr-item'); if (it && +it.dataset.i !== active) setActive(+it.dataset.i); });
  return { draw, close };
}
function searchFieldHTML(id, placeholder) {
  return '<div class="hsearch-field">' + icon('search') + '<input id="' + id + '" type="search" placeholder="' + esc(placeholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-pop"></div>';
}

/* ---------- Live announcements, toasts ---------- */
function announce(msg) {
  let el = document.getElementById('sr-live');
  if (!el) { el = document.createElement('div'); el.id = 'sr-live'; el.className = 'sr-only'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 30);
}
const Toast = {
  timer: null,
  show(msg, opt) {
    opt = opt || {};
    const reg = document.getElementById('toasts');
    clearTimeout(this.timer);
    reg.innerHTML = '<div class="toast"><span class="toast-msg">' + esc(msg) + '</span>' +
      (opt.action ? '<button type="button" class="toast-act">' + esc(opt.action) + '</button>' : '') +
      '<button type="button" class="toast-x" aria-label="Dismiss">×</button></div>';
    const act = $('.toast-act', reg);
    if (act) act.addEventListener('click', () => { this.hide(); opt.onAction && opt.onAction(); });
    $('.toast-x', reg).addEventListener('click', () => this.hide());
    this.timer = setTimeout(() => this.hide(), opt.ms || 6000);
  },
  hide() {
    clearTimeout(this.timer);
    const reg = document.getElementById('toasts');
    const t = reg && $('.toast', reg);
    if (!t) return;
    if (reduced()) { t.remove(); return; }
    t.classList.add('out');
    setTimeout(() => { if (t.isConnected) t.remove(); }, 260);
  }
};

/* ---------- Overlays: search, shortcuts, copy dialog, settings sheet ---------- */
const BG_IDS = ['topbar', 'main', 'footer', 'tabbar'];
const Overlay = {
  cur: null,
  open(name, kind, html, opt) {
    opt = opt || {};
    this.close(true, true);
    const el = document.createElement('div');
    el.className = 'ov ov-' + kind;
    el.dataset.ov = name;
    el.innerHTML = '<div class="ov-scrim" data-act="ov-close"></div><div class="ov-panel" role="dialog" aria-modal="true"' + (opt.labelledby ? ' aria-labelledby="' + opt.labelledby + '"' : '') + (opt.label ? ' aria-label="' + esc(opt.label) + '"' : '') + '>' + html + '</div>';
    document.getElementById('ov-root').appendChild(el);
    I18n.apply(el);
    const prevFocus = document.activeElement;
    BG_IDS.forEach(id => { const n = document.getElementById(id); if (n) n.inert = true; });
    $('.skip').inert = true;
    document.documentElement.classList.add('ov-open');
    let pushed = false;
    if (opt.push !== false) { try { history.pushState(Object.assign({}, history.state, { ov: name }), ''); pushed = true; } catch (e) { /* ignore */ } }
    this.cur = { name, el, prevFocus, pushed, onClose: opt.onClose };
    if (opt.onOpen) opt.onOpen(el);
    return el;
  },
  /* silent: don't touch history or focus. instant: remove without the closing animation. */
  close(silent, instant) {
    const c = this.cur;
    if (!c) return false;
    this.cur = null;
    if (instant || reduced()) c.el.remove();
    else { c.el.classList.add('closing'); setTimeout(() => c.el.remove(), 300); }
    BG_IDS.forEach(id => { const n = document.getElementById(id); if (n) n.inert = false; });
    $('.skip').inert = false;
    document.documentElement.classList.remove('ov-open');
    if (c.onClose) c.onClose();
    if (c.prevFocus && document.contains(c.prevFocus) && !silent) { try { c.prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    if (c.pushed && !silent && history.state && history.state.ov === c.name) history.back();
    return true;
  },
  name() { return this.cur ? this.cur.name : null; }
};
function trapFocus(e) {
  if (!Overlay.cur || e.key !== 'Tab') return;
  const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', Overlay.cur.el).filter(x => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || !Overlay.cur.el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !Overlay.cur.el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
}
function isMac() { return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent); }
function shortcutsList() {
  const mod = isMac() ? '⌘' : 'Ctrl';
  return '<dl class="shortcuts"><dt><kbd>/</kbd> or <kbd>' + mod + '</kbd> <kbd>K</kbd></dt><dd>Open search</dd>' +
    '<dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Previous or next section in a guide</dd>' +
    '<dt><kbd>?</kbd></dt><dd>Show these shortcuts</dd><dt><kbd>Esc</kbd></dt><dd>Close search, dialogs and settings</dd></dl>';
}
function openShortcuts() {
  Overlay.open('shortcuts', 'dialog', '<h2 id="sc-h" class="h3" style="margin-bottom:18px">Keyboard shortcuts</h2>' + shortcutsList() +
    '<div class="btn-row" style="margin-top:26px"><button type="button" class="btn btn-primary btn-block" data-act="ov-close">Done</button></div>',
    { labelledby: 'sc-h', onOpen: el => $('button', el).focus() });
}
function openSearch(prefill) {
  if (Overlay.name() === 'search') { const i = $('#ov-q'); if (i) i.focus(); return; }
  const el = Overlay.open('search', 'search', searchFieldHTML('ov-q', 'Search guides and offices') +
    '<div class="sr-pop" id="ov-q-pop" role="listbox" aria-label="Results"></div>' +
    '<div class="ov-foot"><span>Arrow keys to move, Enter to open</span><button type="button" class="btn-text" data-act="ov-close">Close</button></div>', { label: 'Search' });
  const input = $('#ov-q', el), pop = $('#ov-q-pop', el);
  input.setAttribute('aria-expanded', 'true');
  const s = mountSearch(input, pop, pick => goFromOverlay(pick.href), false);
  if (prefill) input.value = prefill;
  s.draw();
  input.focus();
}
function goFromOverlay(href) {
  const c = Overlay.cur;
  if (location.hash === href) { Overlay.close(); return; }
  Overlay.close(true);
  if (c && c.pushed) location.replace(href); else location.hash = href;
}
function copyDialog(text) {
  Overlay.open('copy', 'dialog', '<h2 id="cp-h" class="h3">Copy this trip</h2><p class="muted" style="margin-top:8px">Your browser did not let us copy. Select the text below and copy it.</p>' +
    '<textarea class="copybox" readonly aria-labelledby="cp-h">' + esc(text) + '</textarea><div class="btn-row"><button type="button" class="btn btn-primary btn-block" data-act="ov-close">Done</button></div>',
    { labelledby: 'cp-h', onOpen: el => { const ta = $('textarea', el); ta.focus(); ta.select(); } });
}
async function copyText(text) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (e) { return false; }
}
function confirmInPlace(btn, text) {
  const lbl = $('.lbl-t', btn) || btn;
  if (!btn.dataset.orig) btn.dataset.orig = lbl.textContent;
  lbl.textContent = text;
  announce(text);
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { lbl.textContent = btn.dataset.orig; }, 2200);
}
