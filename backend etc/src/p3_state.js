
/* ==================================================================
   STATE
   One localStorage key, versioned JSON. Every read and write is
   wrapped so the app keeps working in memory when storage throws.
   ================================================================== */
const STORE_KEY = 'bgp.v1';
let storageOK = true;

function freshState() {
  return {
    v: 1,
    ticks: {},        // { 'aadhaar.address': { card: true, 'poa:voter': true } }
    lastCase: {},     // { aadhaar: 'address' }
    office: {},       // { aadhaar: 'ask-southend' }  per task
    day: {},          // { aadhaar: '2026-10-22' }    per task
    slot: {},         // { aadhaar: { date, t } }     an alternative the user picked
    officeDay: {},    // day picked on an office page
    picked: {},       // { 'aadhaar.address': true }  Go confirmed
    visited: {},      // { 'aadhaar.address': { go: 1, pay: 1 } }
    packedOnce: {},   // first full pack per case (for the big stamp)
    seen: {},         // last ticket signature per case (for the print animation)
    trips: [],        // saved tickets
    docs: {},         // My documents: which ones only
    pay: {},          // { passport: { pages, age }, itr: { income } }
    recent: [],       // recent guide keys for search
    lastGuide: null,
    bestFilter: 'all',
    guidesFilter: 'all',
    settings: { theme: 'device', text: 'normal', motion: 'full', sound: 'on', lang: 'en', ads: 'on' },
    flags: {}         // printDemo, swipeHint
  };
}

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

function loadState() {
  const base = freshState();
  let raw = null;
  try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { storageOK = false; }
  if (!raw) return base;
  let data;
  try { data = JSON.parse(raw); } catch (e) { return base; }
  if (!isObj(data) || data.v !== 1) return base;
  for (const k of Object.keys(base)) {
    if (!(k in data)) continue;
    const want = base[k], got = data[k];
    if (Array.isArray(want) ? Array.isArray(got) : isObj(want) ? isObj(got) : typeof got === typeof want || (want === null && typeof got === 'string')) {
      base[k] = got;
    }
  }
  base.settings = Object.assign(freshState().settings, isObj(data.settings) ? data.settings : {});
  base.trips = base.trips.filter(t => isObj(t) && typeof t.key === 'string' && caseByKey(t.key));
  return base;
}

let S = freshState();

function save() {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(S)); storageOK = true; }
  catch (e) { storageOK = false; }
}

/* In-memory only: values passed between screens, open folds, etc. */
const memo = {
  tool: {},             // date and loan helpers: kept in memory only, never saved
  fair: null,          // { task, case, amount, autoCheck }
  openFolds: {},
  prevDone: {},
  ledAnim: false,
  verdictAnim: false,
  hash: '',
  prevHash: '',
  bgRoute: null,
  docsAll: false,
  q: {},               // quote boxes: { pq: { amount, checked } }
  pendingSeen: null,
  homePrint: false,
  exampleTask: null
};

/* ==================================================================
   UTILITIES
   ================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* FNV-1a, 32-bit unsigned. Used for stable rush noise and token numbers. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function taskOf(id) { return TASKS[id] || null; }
function caseOf(task, cid) { return task ? task.cases.find(c => c.id === cid) || null : null; }
function caseByKey(key) {
  const [t, c] = String(key).split('.');
  const task = taskOf(t);
  const cs = caseOf(task, c);
  return task && cs ? { task, cs } : null;
}
function keyOf(task, cs) { return task.id + '.' + cs.id; }
function currentCase(task) { return caseOf(task, S.lastCase[task.id]) || task.cases[0]; }
function paySel(taskId) { return S.pay[taskId] || (S.pay[taskId] = {}); }

/* Fee lines: amount is a number, a [min, max] range, or a word. */
function feeTotal(fee) {
  return fee.lines.reduce((sum, l) => sum + (typeof l[1] === 'number' ? l[1] : Array.isArray(l[1]) ? l[1][0] : 0), 0);
}
function feeRange(fee) {
  let lo = 0, hi = 0, range = false;
  for (const l of fee.lines) {
    if (typeof l[1] === 'number') { lo += l[1]; hi += l[1]; }
    else if (Array.isArray(l[1])) { lo += l[1][0]; hi += l[1][1]; range = true; }
  }
  return range ? [lo, hi] : null;
}
function amountText(a) {
  if (typeof a === 'number') return a === 0 ? 'Free' : (a < 0 ? '−' + inr(-a) : inr(a));
  if (Array.isArray(a)) return inr(a[0]) + '–' + inr(a[1]);
  return a;
}
function feeTotalText(fee) {
  if (fee.total) return fee.total;
  const r = feeRange(fee);
  if (r) return inr(r[0]) + '–' + inr(r[1]);
  return inr(feeTotal(fee));
}
function feeShort(fee) {
  if (fee.total) return fee.short || fee.total;
  const r = feeRange(fee);
  if (r) return inr(r[0]) + '–' + inr(r[1]);
  const t = feeTotal(fee);
  return t === 0 ? 'Free' : inr(t);
}
function feeFor(task, cs) { return cs.fee(paySel(task.id)); }
function bandFor(task, cs) { return cs.band ? cs.band(paySel(task.id)) : null; }

/* ==================================================================
   TIME, always Bengaluru (Asia/Kolkata), never the device zone
   ================================================================== */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const IST = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });

/* For testing only: ?now=2026-10-17T08:32:00%2B05:30 pins the clock. */
const NOW_PIN = (() => {
  try { const p = new URLSearchParams(location.search).get('now'); const d = p ? new Date(p) : null; return d && !isNaN(d) ? d.getTime() : null; }
  catch (e) { return null; }
})();
const NOW_START = Date.now();

function nowIST() {
  const d = new Date(NOW_PIN ? NOW_PIN + (Date.now() - NOW_START) : Date.now());
  const p = {};
  for (const part of IST.formatToParts(d)) p[part.type] = part.value;
  let h = +p.hour; if (h === 24) h = 0;
  const date = ymd(+p.year, +p.month, +p.day);
  return { date, h, min: +p.minute, mins: h * 60 + (+p.minute), wd: wdOf(date) };
}
function ymd(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; }
function addDays(s, n) {
  const { y, m, d } = parseYmd(s);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function wdOf(s) { const { y, m, d } = parseYmd(s); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function daysBetween(a, b) {
  const A = parseYmd(a), B = parseYmd(b);
  return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5);
}
function fmtTime(mins) {
  let h = Math.floor(mins / 60); const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
}
function hhmm(mins) { return String(Math.floor(mins / 60)).padStart(2, '0') + String(mins % 60).padStart(2, '0'); }
function slotKey(mins) { return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); }
function fmtDay(s) { const { m, d } = parseYmd(s); return WD[wdOf(s)] + ' ' + d + ' ' + MON[m - 1]; }
function fmtDayLong(s) { const { y, m, d } = parseYmd(s); return WD_LONG[wdOf(s)] + ' ' + d + ' ' + MON_LONG[m - 1] + ' ' + y; }
/* Calendar maths for the date helpers: add whole months, clamping to the month's last day. */
function addMonths(s, n) {
  const { y, m, d } = parseYmd(s), t = (m - 1) + n, yy = y + Math.floor(t / 12), mm = ((t % 12) + 12) % 12 + 1;
  const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  return ymd(yy, mm, Math.min(d, last));
}
function addYears(s, n) { return addMonths(s, n * 12); }
/* "16 Oct 2026" -> "Oct 2026", for the Last verified line */
function monthYear(checked) { const p = String(checked).split(' '); return p.length === 3 ? p[1] + ' ' + p[2] : checked; }
function fmtDate(s) { const { y, m, d } = parseYmd(s); return d + ' ' + MON[m - 1] + ' ' + y; }
function relDay(s, today) {
  const n = daysBetween(today, s);
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days';
}
/* "Thu 22 Oct, 3:30 PM, in 5 days" */
function fmtSlot(date, t, today) { return fmtDay(date) + ', ' + fmtTime(t) + ', ' + relDay(date, today); }
function itrDaysLeft(now) { return daysBetween(now.date, ITR_DEADLINE); }

/* ==================================================================
   RUSH MODEL (deterministic estimate, labelled as such everywhere)
   ================================================================== */
function isOpenDay(o, date) { return o.days.includes(wdOf(date)); }
function isOpenAt(o, now) { return isOpenDay(o, now.date) && now.mins >= o.open && now.mins < o.close; }
function allSlots(o) { const out = []; for (let t = o.open; t <= o.close - 60; t += 30) out.push(t); return out; }
function score(o, date, t) {
  const m = RUSH[o.type];
  const wd = wdOf(date);
  const seg = m.base.find(b => t >= b[0] && t < b[1]);
  const base = seg ? seg[2] : .5;
  const adj = m.day[wd] || 0;
  const noise = ((hash(o.id + wd + slotKey(t)) % 17) - 8) / 100;
  return Math.round(Math.min(1, Math.max(0, base + adj + noise)) * 100) / 100;
}
function level(s) { return s < .35 ? 'Quiet' : s < .55 ? 'Moderate' : s < .75 ? 'Busy' : 'Packed'; }
function daySlots(o, date, now) {
  if (!isOpenDay(o, date)) return [];
  let slots = allSlots(o);
  if (date === now.date) slots = slots.filter(t => t > now.mins);
  return slots.map(t => ({ t, s: score(o, date, t) }));
}
/* Best slot = lowest score (ties go earlier). Alternatives = next two lowest, 60+ minutes apart. */
function bestFor(o, date, now) {
  const sl = daySlots(o, date, now);
  if (!sl.length) return null;
  const sorted = sl.slice().sort((a, b) => a.s - b.s || a.t - b.t);
  const best = sorted[0];
  const alts = [];
  for (const x of sorted.slice(1)) {
    if ([best].concat(alts).every(y => Math.abs(y.t - x.t) >= 60)) alts.push(x);
    if (alts.length === 2) break;
  }
  return { best, alts };
}
function dayOptions(o, now) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(now.date, i);
    const openDay = isOpenDay(o, date);
    const slots = openDay ? daySlots(o, date, now) : [];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WD[wdOf(date)] + ' ' + parseYmd(date).d;
    let closed = null;
    if (!openDay) closed = 'Closed';
    else if (!slots.length) closed = 'Closed for today';
    out.push({ date, label, closed });
  }
  return out;
}
function officeStatus(o, now) {
  if (isOpenAt(o, now)) return { open: true, text: 'Open now, closes ' + fmtTime(o.close) };
  if (isOpenDay(o, now.date) && now.mins < o.open) return { open: false, text: 'Closed, opens today at ' + fmtTime(o.open) };
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now.date, i);
    if (isOpenDay(o, d)) return { open: false, text: 'Closed, opens ' + (i === 1 ? 'tomorrow at ' : WD[wdOf(d)] + ' ') + fmtTime(o.open) };
  }
  return { open: false, text: 'Closed' };
}
/* Calmest slot across the coming week */
function calmestWeek(o, now) {
  let best = null;
  for (let i = 0; i < 7; i++) {
    const date = addDays(now.date, i);
    for (const x of daySlots(o, date, now)) {
      if (!best || x.s < best.s) best = { date, t: x.t, s: x.s };
    }
  }
  return best;
}
/* First open day with a slot left, and its calmest slot */
function nextCalm(o, now) {
  for (const d of dayOptions(o, now)) {
    if (d.closed) continue;
    const b = bestFor(o, d.date, now);
    if (b) return { date: d.date, t: b.best.t, s: b.best.s };
  }
  return null;
}

/* Office, day and slot chosen for a task (with safe fallbacks). */
function goChoice(task, now, officeOverride) {
  const officeId = officeOverride || (task.offices.includes(S.office[task.id]) ? S.office[task.id] : task.offices[0]);
  const o = OFFICES[officeId];
  const days = dayOptions(o, now);
  const stored = officeOverride ? S.officeDay[officeId] : S.day[task.id];
  let day = days.find(d => d.date === stored && !d.closed) || days.find(d => !d.closed);
  const b = day ? bestFor(o, day.date, now) : null;
  let sel = b ? b.best : null;
  const st = S.slot[officeOverride ? officeId : task.id];
  if (b && st && st.date === day.date) {
    const pick = [b.best].concat(b.alts).find(x => x.t === st.t) || daySlots(o, day.date, now).find(x => x.t === st.t);
    if (pick) sel = pick;
  }
  return { o, days, day, b, sel };
}

/* ==================================================================
   GUIDE PROGRESS
   ================================================================== */
function ticksOf(key) { return S.ticks[key] || {}; }
function itemDone(item, ticks) {
  if (item.pick) return item.pick.some(o => ticks[item.id + ':' + o.id]);
  return !!ticks[item.id];
}
function pickedOption(item, ticks) { return item.pick ? item.pick.find(o => ticks[item.id + ':' + o.id]) : null; }
function bringStats(task, cs) {
  const ticks = ticksOf(keyOf(task, cs));
  const req = cs.items.filter(i => !i.optional);
  const done = req.filter(i => itemDone(i, ticks)).length;
  return { req: req.length, done, left: req.length - done, all: done === req.length, opt: cs.items.length - req.length };
}
function visitedOf(key) { return S.visited[key] || {}; }
function tripOf(key) { return S.trips.find(t => t.key === key) || null; }
function sectionDone(task, cs, sec) {
  const key = keyOf(task, cs), v = visitedOf(key);
  switch (sec) {
    case 'bring': return bringStats(task, cs).all;
    case 'go': return cs.go.mode === 'online' ? !!v.go : !!(v.go && S.picked[key]);
    case 'pay': return !!v.pay;
    case 'steps': return !!v.steps;
    case 'ticket': return !!tripOf(key);
  }
  return false;
}
function firstUnfinished(task, cs) {
  return SEC_IDS.find(s => !sectionDone(task, cs, s)) || 'ticket';
}
function hasStarted(key) {
  const v = S.visited[key]; const t = S.ticks[key];
  return !!((v && Object.keys(v).length) || (t && Object.values(t).some(Boolean)));
}
function markVisited(task, cs, sec) {
  const key = keyOf(task, cs);
  const v = S.visited[key] || (S.visited[key] = {});
  v[sec] = 1;
  S.lastGuide = key;
  S.lastCase[task.id] = cs.id;
  S.recent = [key].concat(S.recent.filter(k => k !== key)).slice(0, 6);
}

/* Token number: task prefix + 4 digits from a hash of case and date. */
function tripDate(task, cs, now) {
  if (task.offices.length) { const g = goChoice(task, now); if (g.day) return g.day.date; }
  const tr = tripOf(keyOf(task, cs));
  return tr && tr.date ? tr.date : now.date;
}
function tokenFor(task, cs, date) { return task.prefix + '-' + (hash(keyOf(task, cs) + '|' + date) % 9000 + 1000); }
