
/* ==================================================================
   VIEWS
   Each view returns the HTML for <main>. Phone and desktop get
   different layouts, chosen at render time.
   ================================================================== */
const mqPhone = window.matchMedia('(max-width: 767.98px)');
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
function isPhone() { return mqPhone.matches; }
function reduced() { return S.settings.motion === 'reduced' || mqReduce.matches; }
ICONS.globe = '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5z"/>';
const rv = d => ' data-reveal' + (d ? ' style="--d:' + d + 's"' : '');

/* ---------- Home ---------- */
function statusLine(now) {
  const ask = OFFICES['ask-southend'], psk = OFFICES['psk-lalbagh'];
  const head = WD_LONG[now.wd] + ', ' + fmtTime(now.mins) + ' in Bengaluru.';
  const aO = isOpenAt(ask, now), pO = isOpenAt(psk, now);
  let tail;
  if (aO && pO) tail = 'Aadhaar centres and Passport Seva Kendras are open.';
  else if (aO) tail = 'Aadhaar centres are open until ' + fmtTime(ask.close) + '.';
  else if (pO) tail = 'Passport Seva Kendras are open; Aadhaar centres open at ' + fmtTime(ask.open) + '.';
  else if (now.mins < ask.open) {
    tail = isOpenDay(psk, now.date) && now.mins < psk.open
      ? 'Passport Seva Kendras open at ' + fmtTime(psk.open) + ', Aadhaar centres at ' + fmtTime(ask.open) + '.'
      : 'Aadhaar centres open today at ' + fmtTime(ask.open) + '.';
  } else tail = 'Aadhaar centres open tomorrow at ' + fmtTime(ask.open) + '.';
  return head + ' ' + tail;
}
function anyOpen(now) { return Object.values(OFFICES).some(o => isOpenAt(o, now)); }
function itrDaysText(now) {
  const d = itrDaysLeft(now);
  if (d < 0) return 'Deadline passed';
  if (d === 0) return 'Last day today';
  return plural(d, 'day') + ' left';
}
function taskCard(t, now, wide, i, live) {
  let fee = esc(t.from);
  if (t.id === 'itr') fee += '<span class="days">' + esc(itrDaysText(now)) + '</span>';
  const cases = t.cases.length > 1 ? '<span class="brow-cases">' + t.cases.map(c => '<span>' + esc(c.name) + '</span>').join('') + '</span>' : '';
  return '<li class="' + (wide ? 'wide' : '') + '"' + (live ? '' : rv(i * 0.06)) + '><a class="brow card card-hover" href="#' + t.id + '">' + taskTile(t, 'lg') +
    '<span class="brow-go" aria-hidden="true">' + icon('chev') + '</span><span class="brow-name">' + (t.kn ? '<span class="kn" lang="kn">' + t.kn + '</span>' : '') + '<span class="brow-en">' + esc(t.name) + '</span></span>' +
    '<span class="brow-desc">' + esc(t.line) + '</span>' + cases + '<span class="brow-foot"><span class="brow-mode">' + esc(t.mode) + '</span><span class="brow-fee">' + fee + '</span></span></a></li>';
}
/* live: the home page moves these cards with the scroll instead of a one-off reveal */
function bento(now, live, ids) {
  ids = ids || TASK_IDS;
  return '<ul class="bento' + (live ? ' live' : '') + '" data-n="' + ids.length + '">' + ids.map((id, i) => taskCard(TASKS[id], now, i === 0 && ids.length > 2, i, live)).join('') + '</ul>';
}
const NUM_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function numWord(n) { return NUM_WORDS[n] || String(n); }
/* Guides page filters */
const TASK_GROUP = { aadhaar: 'id', pan: 'id', passport: 'id', voter: 'id', dl: 'id', rent: 'money', itr: 'money', eduloan: 'money' };
const GUIDE_FILTERS = [['all', 'All'], ['id', 'ID and cards'], ['money', 'Money and home'], ['online', 'No office visit']];
function noVisit(t) { return t.id !== 'dl' && t.cases.every(c => c.go.mode === 'online'); }
function guidesFor(f) { return TASK_IDS.filter(id => f === 'all' || (f === 'online' ? noVisit(TASKS[id]) : TASK_GROUP[id] === f)); }
function nextStepText(task, cs, next) {
  return {
    bring: 'Next: pack your documents.',
    go: cs.go.mode === 'online' ? 'Next: see how to do it online.' : 'Next: pick a time.',
    pay: 'Next: check the fee.', steps: 'Next: read the steps.', ticket: 'Next: save your ticket.'
  }[next];
}
function continueCard() {
  const k = S.lastGuide, x = k && caseByKey(k);
  if (!x || !hasStarted(k)) return '';
  const { task, cs } = x, st = bringStats(task, cs), next = firstUnfinished(task, cs);
  const nDone = SEC_IDS.filter(s => sectionDone(task, cs, s)).length;
  const all = nDone === 5;
  return '<section class="continue card" aria-labelledby="cont-h"' + rv() + '>' + ring('cont', nDone, 5) + '<div class="continue-text"><span class="muted" id="cont-h">Continue where you left off</span>' +
    '<strong>' + esc(task.short + ', ' + cs.label) + '.</strong><span>' + st.done + ' of ' + st.req + ' packed. ' + esc(all ? 'Ticket saved. Ready when you are.' : nextStepText(task, cs, next)) + '</span></div>' +
    '<a class="btn btn-primary" href="#' + k + '.' + next + '">' + (all ? 'Open ticket' : 'Continue') + '</a></section>';
}
/* The hero "product shot": the real slip, a Bring card, a Go card and the fee. */
function compHTML(tid, now, animate) {
  const t = TASKS[tid], cs = t.cases[0];
  const req = cs.items.filter(i => !i.optional).slice(0, 3);
  const left = '<div class="comp-l" data-par="0.07" aria-hidden="true"><div class="float"><div class="mini card"><div class="mini-h">' + tile('doc', 't-bring', 'sm') +
    '<div><b>Bring</b><span>' + plural(req.length, 'thing') + ' to ' + (cs.ready ? 'have ready' : 'carry') + '</span></div></div>' +
    req.map((it, i) => '<div class="mini-row"><i class="' + (i === 0 ? 'on' : '') + '"></i>' + esc(it.pick ? it.label.replace(/, pick one$/, '') : it.label) + '</div>').join('') + '</div></div></div>';
  let goCard;
  if (t.offices.length) {
    const o = OFFICES[t.offices[0]], c = calmestWeek(o, now) || { date: now.date, t: o.open, s: .3 };
    goCard = led(ledDate(c.date), fmtTime(c.t), 'Calmest this week', { mini: true }) + '<p class="mini-cap">' + esc(o.short) + ', usually ' + level(c.s).toLowerCase() + '</p>';
  } else {
    goCard = led('ONLINE', tid === 'pan' ? '10 MIN' : 'ANYTIME', 'Online', { mini: true }) + '<p class="mini-cap">No queue. Done on ' + esc(cs.go.online.links[0].text) + '</p>';
  }
  const right = '<div class="comp-r" data-par="0.14" aria-hidden="true"><div class="float"><div class="mini card"><div class="mini-h">' + tile('clock', 't-go', 'sm') +
    '<div><b>Go</b><span>' + (t.offices.length ? 'Calmest this week' : 'Skip the trip') + '</span></div></div>' + goCard + '</div></div></div>';
  const total = feeTotal(feeFor(t, cs));
  const pill = '<div class="comp-pill" data-par="0.22" aria-hidden="true"><div class="float"><span class="fee-pill">' + tile('rupee', 't-pay', '') +
    '<span><b>' + (total === 0 ? 'Free' : inr(total)) + '</b><span>Official fee</span></span></span></div></div>';
  const center = '<div class="comp-c"><div class="comp-slot" aria-hidden="true"></div><div class="slip-holder" id="machine-out">' +
    slipHTML(t, cs, now, { specimen: true, anim: animate ? 'feed-slow' : '', stampAnim: animate ? 'pending' : '' }) + '</div></div>';
  return '<div class="comp-stage" id="comp-stage">' + left + center + '<div class="glare" aria-hidden="true"></div>' + right + pill + '</div>';
}
function calmTool(now) {
  const o = OFFICES['ask-southend'], c = calmestWeek(o, now);
  if (!c) return '';
  return '<section class="tool tool-dark" aria-labelledby="calm-h"' + rv() + '><h2 id="calm-h">Calmest Aadhaar slot this week.</h2><p class="tool-sub">Estimate, not live data. Times are in Bengaluru.</p>' +
    '<a class="calm-link" href="#best-time.ask-southend" data-act="calm" data-date="' + c.date + '" data-t="' + c.t + '">' +
    led(ledDate(c.date), fmtTime(c.t), 'Calmest slot: ' + fmtDayLong(c.date) + ', ' + fmtTime(c.t)) +
    '<span class="calm-where">' + esc(o.name) + ', usually ' + level(c.s).toLowerCase() + '.</span><span class="calm-go">Plan this visit' + icon('chev') + '</span></a></section>';
}
function quoteTool() {
  return '<section class="tool card" aria-labelledby="hq-h"' + rv(0.08) + '><h2 id="hq-h">Got a quote? Check it.</h2><p class="tool-sub">See if an agent’s price is fair before you pay.</p>' +
    '<form class="hq" data-form="hq" novalidate><div class="field"><label class="lbl" for="hq-task">Task</label><select class="select" id="hq-task">' +
    TASK_IDS.filter(id => TASKS[id].quote).map(id => '<option value="' + id + '">' + esc(TASKS[id].name) + '</option>').join('') + '</select></div>' +
    digitField('hq-amt', 'Amount quoted', '') + '<button type="submit" class="btn btn-primary" style="min-height:3.5rem;padding:0 30px">Check</button></form></section>';
}
/* The headline is built per language, so each one keeps its own word order and highlighted words. */
const HERO_LINES = {
  en: [['What', 'to', ['bring', 'grad-bring', ',']], ['when', 'to', ['go', 'grad-go', ',']], ['what', 'to', ['pay', 'grad-pay', '.']]],
  hi: [['क्या', ['लाएँ', 'grad-bring', ',']], ['कब', ['जाएँ', 'grad-go', ',']], ['कितना', ['चुकाएँ', 'grad-pay', '।']]],
  kn: [['ಏನು', ['ತರಬೇಕು', 'grad-bring', ',']], ['ಯಾವಾಗ', ['ಹೋಗಬೇಕು', 'grad-go', ',']], ['ಎಷ್ಟು', ['ಪಾವತಿಸಬೇಕು', 'grad-pay', '.']]]
};
const HERO_LABEL = { en: 'What to bring, when to go, what to pay.', hi: 'क्या लाएँ, कब जाएँ, कितना चुकाएँ।', kn: 'ಏನು ತರಬೇಕು, ಯಾವಾಗ ಹೋಗಬೇಕು, ಎಷ್ಟು ಪಾವತಿಸಬೇಕು.' };
/* Hand-drawn marker strokes under the three coloured words: a wave for bring, an arrow for go, a receipt's double rule for pay. */
const SCRIB = {
  'grad-bring': ['M2 7.5C12 2.5 20 11 31 6.5S52 2 64 7s24 4.5 34-2.5'],
  'grad-go': ['M2 8.5C28 5 60 3.5 90 5.5', 'M82 1.5l10 4-9 5'],
  'grad-pay': ['M3 4.2l94-.8', 'M7 9.6l86-.7']
};
function scrib(cls) {
  return '<svg class="scrib" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    SCRIB[cls].map((d, k) => '<path d="' + d + '" pathLength="1" style="--k:' + k + '"/>').join('') + '</svg>';
}
function heroWords() {
  const lines = HERO_LINES[I18n.lang] || HERO_LINES.en;
  let i = 0;
  return lines.map(l => l.map(w => {
    const k = i++;
    if (Array.isArray(w)) return '<span class="w"><span style="--i:' + k + '"><span class="' + w[1] + '" data-hum>' + w[0] + scrib(w[1]) + '</span>' + w[2] + '</span></span>';
    return '<span class="w"><span style="--i:' + k + '">' + w + '</span></span>';
  }).join(' ')).join('<br>');
}
/* Little drawings for the four stat cards. Purely decorative. */
const STAT_ART = {
  guides: '<g class="c c1"><rect x="20" y="12" width="24" height="34" rx="5" fill="#FF8A3D"/><path d="M25 20h14M25 25h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>' +
    '<g class="c c2"><rect x="20" y="12" width="24" height="34" rx="5" fill="#20C48C"/><path d="M25 20h14M25 25h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>' +
    '<g class="c c3"><rect x="20" y="12" width="24" height="34" rx="5" fill="#2E7BFF"/><path d="M25 20h14M25 25h9M25 30h11" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>',
  offices: '<ellipse cx="32" cy="54" rx="13" ry="3.6" class="gnd"/><ellipse class="rip" cx="32" cy="54" rx="13" ry="3.6" fill="none" stroke="#FF4880" stroke-width="1.6"/>' +
    '<g class="pin"><path d="M32 52c-7.5-8.6-12-15.4-12-21.4a12 12 0 0 1 24 0c0 6-4.5 12.8-12 21.4z" fill="#FF4880"/><circle cx="32" cy="30.5" r="4.6" fill="#fff"/></g>',
  free: '<ellipse cx="32" cy="57" rx="12" ry="2.6" class="gnd"/><g class="coin"><circle cx="32" cy="32" r="20" fill="#F2B233"/><circle cx="32" cy="32" r="15.5" fill="none" stroke="#FFE7A3" stroke-width="2"/>' +
    '<g transform="translate(20 20)" fill="none" stroke="#8A4B00" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + ICONS.rupee + '</g></g>',
  days: '<rect x="12" y="14" width="40" height="38" rx="7" class="pg"/><path d="M12 21a7 7 0 0 1 7-7h26a7 7 0 0 1 7 7v5H12z" fill="#7C5CF6"/>' +
    '<path d="M19 34h26M19 41h18" class="ln"/><g class="leaf"><rect x="13" y="26" width="38" height="25" rx="2" class="pg2"/><path d="M19 34h26M19 41h12" class="ln"/></g>' +
    '<rect x="21" y="9" width="3.6" height="9" rx="1.8" fill="#4B3BB5"/><rect x="39.4" y="9" width="3.6" height="9" rx="1.8" fill="#4B3BB5"/>'
};
function statArt(k) { return '<svg class="stat-art sa-' + k + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + STAT_ART[k] + '</svg>'; }
function viewHome() {
  const now = nowIST();
  const ex = memo.exampleTask || 'aadhaar';
  const animate = !S.flags.printDemo && !reduced();
  memo.homePrint = !S.flags.printDemo;
  const days = itrDaysLeft(now);
  let h = '<section class="hero" aria-labelledby="page-h"><canvas class="needles" id="needles" aria-hidden="true"></canvas><div class="wrap hero-copy">' +
    '<span class="kn" lang="kn"' + rv() + '>' + KN.hero + '</span>' +
    '<h1 class="h-hero" id="page-h" tabindex="-1" translate="no" aria-label="' + HERO_LABEL[I18n.lang] + '"' + rv() + '>' + heroWords() + '</h1>' +
    '<p class="lead hero-sub"' + rv(0.35) + '>Plain guides for Bengaluru paperwork, so your first trip is the only one.</p>' +
    '<div class="hsearch"' + rv(0.45) + '><label class="sr-only" for="home-q">Search guides</label>' + searchFieldHTML('home-q', 'Search guides, e.g. “aadhaar address”') +
    '<div class="sr-pop" id="home-q-pop" role="listbox" aria-label="Results" hidden></div></div>' +
    '<div class="hs-try"' + rv(0.52) + '><span class="muted">Try</span>' + [['#aadhaar.address', 'Aadhaar address'], ['#dl.learner', 'Learner\'s licence'], ['#voter.new', 'Voter ID'], ['#passport.tatkal', 'Tatkal passport'], ['#eduloan.apply', 'Education loan']].map(([hh, t]) =>
      '<a class="trychip" href="' + hh + '">' + t + '</a>').join('') + '</div>' +
    '<p class="status"' + rv(0.58) + '><span class="dot' + (anyOpen(now) ? ' on' : '') + '" aria-hidden="true"></span><span id="status-line">' + esc(statusLine(now)) + '</span></p></div>' +
    '<div class="wrap"><figure class="comp machine" id="comp" aria-label="Example trip slip"' + rv(0.62) + '>' + compHTML(ex, now, animate) + '</figure>' +
    '<div class="ex-switch"><span class="muted">Print another example</span>' +
    seg('ex', 'Print another example', ['aadhaar', 'passport', 'pan'].map(id => ({ id: 'ex-' + id, label: TASKS[id].short, pressed: id === ex, attrs: 'data-act="example" data-task="' + id + '"' }))) + '</div></div></section>';
  h += tickerHTML(now);
  h += manifestoHTML();
  h += '<section class="band band-alt" aria-labelledby="board-h"><div class="wrap">' + continueCard() +
    '<header class="sec-head center"' + rv() + '><span class="kn" lang="kn">' + KN.which + '</span><h2 class="h2" id="board-h">Which task?</h2>' +
    '<p class="lead">' + cap(numWord(TASK_IDS.length)) + ' guides for Bengaluru. Each one answers all three questions.</p></header>' + bento(now, !reduced()) + adSlot(SPOTLIGHT) + '</div></section>';
  h += kineticHTML();
  h += storyHTML(now);
  h += '<section class="band" aria-label="Tools"><div class="wrap"><div class="tools-grid">' + calmTool(now) + quoteTool() + '</div></div></section>';
  h += '<section class="band band-alt stats" aria-label="At a glance"><div class="wrap"><ul class="stat-grid">' +
    '<li data-hum' + rv() + '>' + statArt('guides') + '<b class="grad-bring" data-countto="' + TASK_IDS.length + '">0</b><span>guides for Bengaluru paperwork</span></li>' +
    '<li data-hum' + rv(0.08) + '>' + statArt('offices') + '<b class="grad-go" data-countto="4">0</b><span>offices with calm-time estimates</span></li>' +
    '<li data-hum' + rv(0.16) + '>' + statArt('free') + '<b class="grad-pay">₹0</b><span>to use. No sign-up, nothing uploaded</span></li>' +
    '<li data-hum' + rv(0.24) + '>' + statArt('days') + '<b class="grad-bring" data-countto="' + Math.max(0, days) + '">0</b><span>' + (days >= 0 ? 'days left to file a late tax return' : 'days left: the deadline has passed') + '</span></li></ul></div></section>';
  h += '<section class="cta" aria-labelledby="cta-h">' + orbitsHTML() + planeHTML() + '<div class="wrap"><h2 class="cta-h" id="cta-h"' + rv() + '>Make the first trip<br>the only trip.</h2>' +
    '<p class="lead"' + rv(0.1) + '>Pick your task and we’ll tell you exactly what to bring, when to go and what to pay.</p>' +
    '<div' + rv(0.16) + '>' + dockHTML() + '</div>' +
    '<div class="btn-row cta-row"' + rv(0.22) + '><a class="btn btn-primary btn-lg magnetic" href="#guides">See all guides' + icon('chev') + '</a>' +
    '<button type="button" class="btn btn-lg magnetic" data-act="search">' + icon('search') + 'Search</button></div></div></section>';
  return h;
}

/* ---------- Guides list ---------- */
function viewGuides() {
  const now = nowIST();
  const f = GUIDE_FILTERS.some(x => x[0] === S.guidesFilter) ? S.guidesFilter : 'all', ids = guidesFor(f);
  return '<div class="wrap page">' + floatersHTML('guides') + ptitle(KN.which, 'Which task?', cap(numWord(TASK_IDS.length)) + ' guides for Bengaluru paperwork. Pick one to see what to bring, when to go and what to pay.') +
    '<div class="gfilter"><div class="filter" role="group" aria-label="Show guides">' + GUIDE_FILTERS.map(([v, l]) =>
      '<button type="button" class="chip-inline" id="gf-' + v + '" data-act="gfilter" data-f="' + v + '" aria-pressed="' + (f === v) + '">' + l + '</button>').join('') + '</div>' +
    '<p class="gcount muted" aria-live="polite">' + (f === 'all' ? plural(ids.length, 'guide') : 'Showing ' + ids.length + ' of ' + TASK_IDS.length + ' guides') + '</p></div>' +
    bento(now, !reduced(), ids) + '<p class="est" style="margin-top:24px">Fees checked ' + FEES_CHECKED + '.</p></div>';
}

/* ---------- Guide ---------- */
function sectionValue(task, cs, sec, now) {
  const st = bringStats(task, cs);
  switch (sec) {
    case 'bring': return st.done + ' of ' + st.req + ' packed';
    case 'go': return goSummary(task, cs, now).short;
    case 'pay': return feeShort(feeFor(task, cs));
    case 'steps': return plural(cs.steps.length, 'step');
    case 'ticket': return st.all ? 'Ready' : 'Not ready';
  }
  return '';
}
function guideOverview(task, cs, sec, now, phone) {
  const key = keyOf(task, cs);
  const done = SEC_IDS.map(s => sectionDone(task, cs, s));
  const nDone = done.filter(Boolean).length;
  const prev = memo.prevDone[key];
  let h = phone ? '<a class="backlink" href="#guides">' + icon('back') + 'Guides</a>'
    : '<nav class="crumbs" aria-label="Breadcrumb"><a href="#guides">Guides</a>' + icon('chev') + '<span>' + esc(task.name) + '</span></nav>';
  h += '<div class="gcard card"><div class="ghead">' + taskTile(task, 'xl') + '<h1 class="g-title" id="page-h" tabindex="-1">' + (task.kn ? '<span class="kn" lang="kn">' + task.kn + '</span>' : '') + esc(task.name) + '</h1></div>';
  if (task.cases.length > 1) {
    h += '<div class="cases" data-n="' + task.cases.length + '" role="group" aria-label="Which ' + (task.id === 'aadhaar' ? 'change' : 'case') + '?">' + task.cases.map(c =>
      '<button type="button" id="case-' + c.id + '" data-act="case" data-task="' + task.id + '" data-case="' + c.id + '" aria-pressed="' + (c.id === cs.id) + '">' + esc(c.name) + '</button>').join('') + '</div>';
  } else {
    h += '<p class="g-case1">' + esc(cap(cs.label)) + '</p>';
  }
  h += '<div class="trip">' + ring('trip-' + key, nDone, 5) + '<div><strong>' + nDone + ' of 5 done</strong><span>Your trip, ' + esc(cs.label) + '</span></div></div>';
  h += '<p class="g-verified">' + icon('check') + 'Last verified ' + esc(monthYear(task.checked)) + '</p>';
  h += '<nav aria-label="Guide sections"><ol class="srows">' + SECTIONS.map((s, i) => {
    const isDone = done[i];
    const draw = isDone && prev && !prev[i] && !reduced();
    const m = SEC_META[s.id];
    return '<li><a class="srow" href="#' + key + '.' + s.id + '"' + (sec === s.id ? ' aria-current="step"' : '') + '>' + tile(m.icon, m.cls, 'sm') +
      '<span class="srow-name">' + s.en + '</span><span class="srow-val">' + esc(sectionValue(task, cs, s.id, now)) + '</span>' +
      (isDone ? '<svg class="ic srow-ck' + (draw ? ' draw' : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS.check + '</svg><span class="sr-only">, done</span>' : icon('chev', 'srow-chev')) +
      '</a></li>';
  }).join('') + '</ol></nav></div>';
  memo.prevDone[key] = done;
  return h;
}
function refreshOverview(task, cs) {
  const side = document.getElementById('g-side');
  if (!side || route.name !== 'guide') return;
  side.innerHTML = guideOverview(task, cs, route.sec, nowIST(), isPhone());
  I18n.apply(side);
  animateRings(side);
}
function nextLabel(sec) { const i = SEC_IDS.indexOf(sec); return i < SEC_IDS.length - 1 ? 'Next: ' + SECTIONS[i + 1].en : null; }
function navTargets(task, cs, sec) {
  const key = keyOf(task, cs), i = SEC_IDS.indexOf(sec);
  return { prev: i > 0 ? '#' + key + '.' + SEC_IDS[i - 1] : null, next: i < SEC_IDS.length - 1 ? '#' + key + '.' + SEC_IDS[i + 1] : null };
}
function nextIsSecondary(cs, sec) { return sec === 'go' && cs.go.mode !== 'online'; }
function secNav(task, cs, sec) {
  const n = navTargets(task, cs, sec);
  return '<div class="sec-nav">' + (n.prev ? '<a class="btn-text" href="' + n.prev + '">' + icon('back') + 'Previous</a>' : '<span></span>') +
    (n.next ? '<a class="btn btn-lg' + (nextIsSecondary(cs, sec) ? '' : ' btn-primary') + ' magnetic" href="' + n.next + '" data-act="next" data-from="' + sec + '" id="next-d">' + nextLabel(sec) + icon('chev') + '</a>' : '') + '</div>';
}
function bottomBar(task, cs, sec) {
  const key = keyOf(task, cs);
  if (!sec) {
    return '<div class="bottombar"><a class="btn btn-primary btn-block" href="#' + key + '.' + firstUnfinished(task, cs) + '" id="start-btn">' + (hasStarted(key) ? 'Continue' : 'Start') + '</a></div>';
  }
  if (sec === 'ticket') return '<div class="bottombar"><button type="button" class="btn btn-primary btn-block" data-act="save" data-key="' + key + '" id="save-m">Save ticket</button></div>';
  const n = navTargets(task, cs, sec);
  return '<div class="bottombar"><a class="btn btn-block' + (nextIsSecondary(cs, sec) ? '' : ' btn-primary') + '" href="' + n.next + '" data-act="next" data-from="' + sec + '" id="next-m">' + nextLabel(sec) + '</a></div>';
}
function packedBadge(anim) { return stamp('All packed', { icon: 'check', size: 'stamp-lg', anim: anim || '' }); }
function secBring(task, cs) {
  const key = keyOf(task, cs), st = bringStats(task, cs);
  let h = plate('bring');
  h += '<div class="answer" id="bring-head"><p class="answer-line">' + plural(st.req, 'thing') + ' ' + (cs.ready ? 'to have ready' : 'to carry') +
    (st.opt ? '<span class="sub">plus ' + st.opt + ' if needed</span>' : '') + '</p>' +
    '<p class="answer-meta">' + boxes(st.req, st.done, 'boxes-lg') + '<span id="bring-count" aria-live="polite">' + st.done + ' of ' + st.req + ' packed</span>' +
    '<span class="stamp-slot" id="packed-slot">' + (st.all ? packedBadge() : '') + '</span></p></div>';
  if (cs.noDocs) h += '<p class="muted" style="margin:-10px 0 12px">' + esc(cs.noDocs) + '</p>';
  if (cs.note) h += '<p class="notice notice-info" style="margin:0 0 16px"><span>' + esc(cs.note) + '</span></p>';
  h += '<div class="checklist" data-key="' + key + '">' + checklist(task, cs) + '</div>';
  h += '<div class="btn-row"><button type="button" class="btn" data-act="fill" data-key="' + key + '" id="fill-btn">' + icon('doc') + 'Fill from my documents</button>' +
    '<button type="button" class="btn-text" data-act="copylist" data-key="' + key + '" id="copylist-btn">' + icon('copy') + 'Copy list</button>' +
    '<button type="button" class="btn-text" data-act="clear" data-key="' + key + '" id="clear-btn">Clear ticks</button></div>';
  h += '<p style="margin-top:22px">' + extLink(cs.fullList, cs.fullListText || 'Full list of accepted documents') + '</p>';
  return h;
}
function secGo(task, cs, now) {
  const go = cs.go;
  let h = plate('go');
  if (go.mode !== 'office') {
    const on = go.online;
    let time = on.time;
    if (task.id === 'itr') {
      const d = itrDaysLeft(now);
      time = d < 0 ? 'The late-filing deadline has passed. Check incometax.gov.in for your options.'
        : d === 0 ? 'Today, 31 Dec 2026, is the last day.' : plural(d, 'day') + ' left until the 31 Dec 2026 deadline.';
    }
    h += '<div class="skiptrip"><div class="st-h">' + tile('globe', 't-bring', '') + '<h3>' + esc(on.title || 'Skip the trip') + '</h3></div><p>' + esc(on.text) + '</p>' +
      (time ? '<p class="muted">' + esc(time) + '</p>' : '') + '<div class="btn-row">' + on.links.map((l, i) => extButton(l, null, i === 0 && go.mode === 'online')).join('') + '</div></div>';
  }
  if (cs.tool === 'll') h += llTool();
  if (cs.tool === 'qual') h += qualTool();
  if (go.mode === 'both') h += '<h3 class="sec-h3">Prefer a centre?</h3>';
  if (go.mode !== 'online') h += goTools({ task, cs, scope: 'guide', note: go.note });
  return h;
}
function passportSelects(idp) {
  const sel = paySel('passport'), age = sel.age || 'adult', minor = age === 'u18' || age === 'u8', pages = minor ? '36' : (sel.pages || '36');
  return '<div class="paysel"><div class="field"><label class="lbl" for="' + idp + '-pages">Pages</label><select class="select" id="' + idp + '-pages" data-pay="pages" data-task="passport">' +
    '<option value="36"' + (pages === '36' ? ' selected' : '') + '>36 pages</option><option value="60"' + (pages === '60' ? ' selected' : '') + (minor ? ' disabled' : '') + '>60 pages' + (minor ? ' (18 and over)' : '') + '</option></select></div>' +
    '<div class="field"><label class="lbl" for="' + idp + '-age">Applicant</label><select class="select" id="' + idp + '-age" data-pay="age" data-task="passport">' +
    [['adult', '18 to 59'], ['u18', 'Under 18'], ['u8', 'Under 8'], ['senior', '60 or over']].map(([v, l]) => '<option value="' + v + '"' + (age === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div></div>';
}
function itrSelect(idp) {
  const inc = paySel('itr').income || 'upto5';
  return '<div class="paysel"><div class="field"><label class="lbl" for="' + idp + '-inc">Your total income</label><select class="select" id="' + idp + '-inc" data-pay="income" data-task="itr">' +
    ITR_INCOME.map(x => '<option value="' + x.id + '"' + (inc === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></div></div>';
}
function feeTable(fee) {
  const nm = fee.noteMeta || [], shared = sameMeta(nm);
  return '<div class="fees">' + fee.lines.map(l => '<div class="fee' + (typeof l[1] === 'number' && l[1] < 0 ? ' neg' : '') + '"><span>' + esc(l[0]) + srcLine(l[2]) + '</span><span class="lead" aria-hidden="true"></span><span class="amt">' + esc(amountText(l[1])) + '</span></div>').join('') +
    (fee.total ? '' : '<div class="fee-total"><span>Official total</span><span class="amt">' + esc(feeTotalText(fee)) + '</span></div>') + '</div>' +
    (fee.notes && fee.notes.length ? '<ul class="notes">' + fee.notes.map((n, i) => '<li>' + esc(n) + (shared ? '' : srcLine(nm[i])) + '</li>').join('') + '</ul>' +
      (shared ? srcLine(nm[0], 'p') : '') : '');
}
function payAnswer(task, fee) {
  if (fee.headline) return esc(fee.headline[0]) + '<span class="sub">' + esc(fee.headline[1]) + '</span>';
  const r = feeRange(fee), t = feeTotal(fee);
  if (r) return inr(r[0]) + '–' + inr(r[1]) + '<span class="sub">stamp duty</span>';
  if (task.id === 'itr') return (t === 0 ? '₹0' : inr(t)) + '<span class="sub">late fee</span>';
  if (t === 0) return 'Free<span class="sub">₹0 official fee</span>';
  return inr(t) + '<span class="sub">official fee</span>';
}
function qState(qid) { return memo.q[qid] || { amount: '', checked: false }; }
function secPay(task, cs) {
  const fee = feeFor(task, cs);
  let h = plate('pay') + '<div class="answer"><p class="answer-line" id="pay-answer">' + payAnswer(task, fee) + '</p></div>';
  if (fee.check) h += '<p class="notice notice-info" style="margin:-6px 0 20px"><span>We could not confirm the current amount, so check the fee on ' + extLink(fee.check) + ' before you pay.</span></p>';
  if (task.paysel === 'passport') h += passportSelects('pp');
  if (task.paysel === 'itr') h += itrSelect('pi');
  h += feeTable(fee);
  if (task.quote && cs.band) {
    const q = qState('pq');
    h += '<div style="margin-top:26px">' + fold('fold-quote', 'Got a quote? Check it', quoteBox('pq', task, cs, { amount: q.amount, verdictFor: q.checked && q.amount ? parseInt(q.amount, 10) : null }), false) + '</div>';
  } else if (task.noQuote) h += '<p class="notice" style="margin-top:24px"><span>' + esc(task.noQuote) + '</span></p>';
  if (cs.tool === 'emi') h += emiTool();
  h += '<p class="est" style="margin-top:20px">' + (task.checked === FEES_CHECKED ? 'Fees checked ' : 'Last verified ') + esc(task.checked) + ' on ' + esc(task.source) + '.</p>';
  return h;
}
function secSteps(task, cs) {
  let h = plate('steps') + '<div class="answer"><p class="answer-line">' + plural(cs.steps.length, 'step') + '</p></div>';
  h += '<ol class="steps-ol" data-route="li" data-pad="26">' + cs.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  h += '<div class="watch" data-rise="soft">' + tile('warn', 't-go', '') + '<div><h3>Watch out for</h3><ul>' + cs.watch.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul></div></div>';
  h += '<div class="help" data-rise="soft">' + (task.helpline ? '<p>' + esc(task.helpline.label) + ': <a href="tel:' + task.helpline.num.replace(/-/g, '') + '">' + esc(task.helpline.num) + '</a></p>' : '') +
    '<p>Official: ' + task.links.map(l => extLink(l)).join(', ') + '</p></div>';
  if (task.terms) h += '<div class="terms-wrap" data-rise="soft">' + fold('fold-terms-' + task.id, 'Words to know', '<dl class="terms">' + task.terms.map(([t, d]) => '<div><dt>' + esc(t) + '</dt><dd>' + esc(d) + '</dd></div>').join('') + '</dl>', false) + '</div>';
  h += servicesSection(task);
  return h;
}
function secTicket(task, cs, now, phone) {
  const key = keyOf(task, cs), d = slipData(task, cs, now), sig = slipSig(task, cs, now);
  const changed = S.seen[key] !== sig;
  const anim = changed && !reduced();
  let h = plate('ticket') + '<div class="answer"><p class="answer-line">' + (d.st.all ? 'Ready to go' : plural(d.st.left, 'item') + ' left to pack') +
    '<span class="sub">Token ' + esc(d.token) + '</span></p></div>';
  h += '<div class="slip-stage" data-tilt="2.2"><div class="slip-slot" aria-hidden="true"></div><div class="slip-clip">' +
    slipHTML(task, cs, now, { print: true, id: 'the-slip', anim: anim ? 'feed' : '', stampAnim: anim ? 'pending' : '' }) + '</div></div>';
  const tr = tripOf(key);
  h += '<div class="btn-row ticket-actions">' + (phone ? '' : '<button type="button" class="btn btn-primary btn-lg magnetic" data-act="save" data-key="' + key + '" id="save-d">Save ticket</button>') +
    '<button type="button" class="btn" data-act="share" data-key="' + key + '" id="share-t">' + icon('share') + '<span class="lbl-t">Share</span></button>' +
    '<button type="button" class="btn" data-act="print" id="print-t">' + icon('print') + 'Print</button></div>';
  h += '<p class="muted" id="saved-note" style="margin-top:16px">' + (tr ? 'Saved to My tickets on ' + esc(fmtDate(tr.savedDay || now.date)) + '. Ticks you make later update it. <a href="#tickets">Open My tickets</a>'
    : 'Save it to find it again in My tickets. Ticks you make later update it.') + '</p>';
  memo.pendingSeen = { key, sig, anim };
  h += sponsoredTip(task);
  return h;
}
function sectionBody(task, cs, sec, now, phone) {
  switch (sec) {
    case 'bring': return secBring(task, cs);
    case 'go': return secGo(task, cs, now);
    case 'pay': return secPay(task, cs);
    case 'steps': return secSteps(task, cs);
    case 'ticket': return secTicket(task, cs, now, phone);
  }
  return '';
}
function viewGuide(r) {
  const task = TASKS[r.task], cs = caseOf(task, r.case), key = keyOf(task, cs);
  const phone = isPhone(), now = nowIST();
  if (phone && !r.sec) {
    return '<div class="wrap guide-start">' + guideOverview(task, cs, null, now, true) + '</div>' + bottomBar(task, cs, null);
  }
  const s = SECTIONS.find(x => x.id === r.sec);
  if (phone) {
    const doneMap = SEC_IDS.map(x => sectionDone(task, cs, x));
    return '<div class="wrap guide"><div class="sechead"><a class="backlink" href="#' + key + '" data-act="back-start">' + icon('back') + 'Back</a><span class="count">Step ' + s.n + ' of 5</span>' +
      '<span class="segbar" aria-hidden="true">' + SECTIONS.map((x, i) => '<i class="' + (x.id === r.sec ? 'cur' : doneMap[i] ? 'done' : '') + '"></i>').join('') + '</span></div>' +
      '<h1 class="sr-only" id="page-h" tabindex="-1">' + esc(task.name + ', ' + cs.label) + '</h1>' +
      '<section class="sec" id="sec" aria-labelledby="sec-h">' + sectionBody(task, cs, r.sec, now, true) + '</section></div>' + bottomBar(task, cs, r.sec);
  }
  return '<div class="wrap guide"><aside class="g-side" id="g-side" aria-label="Guide overview">' + guideOverview(task, cs, r.sec, now, false) + '</aside>' +
    '<div class="g-main"><section class="sec card" id="sec" aria-labelledby="sec-h">' + sectionBody(task, cs, r.sec, now, false) + secNav(task, cs, r.sec) + '</section></div></div>';
}

/* ---------- Best time ---------- */
function calmLabel(o, now) {
  const b = bestFor(o, now.date, now);
  if (b) return { label: 'Calmest today', time: fmtTime(b.best.t), sub: 'Usually ' + level(b.best.s).toLowerCase() };
  const n = nextCalm(o, now);
  if (!n) return { label: 'No slots this week', time: '', sub: '' };
  const d = daysBetween(now.date, n.date);
  return { label: 'Calmest ' + (d === 1 ? 'tomorrow' : WD[wdOf(n.date)]), time: fmtTime(n.t), sub: 'Usually ' + level(n.s).toLowerCase() };
}
function viewBest() {
  const now = nowIST(), f = S.bestFilter || 'all';
  let best = null;
  for (const o of Object.values(OFFICES)) { const b = bestFor(o, now.date, now); if (b && (!best || b.best.s < best.s)) best = { o, t: b.best.t, s: b.best.s }; }
  let pick = best ? Object.assign({ date: now.date }, best) : null, head = 'Calmest today';
  if (!pick) {
    for (const o of Object.values(OFFICES)) { const n = nextCalm(o, now); if (n && (!pick || n.date < pick.date || (n.date === pick.date && n.s < pick.s))) pick = Object.assign({ o }, n); }
    head = 'Closed for today';
  }
  const hero = pick ? '<section class="best-hero" data-tilt="1.8"' + rv() + '>' + led(best ? 'TODAY' : ledDate(pick.date), fmtTime(pick.t), (best ? 'Calmest today: ' : 'Calmest next: ') + fmtDayLong(pick.date) + ', ' + fmtTime(pick.t)) +
    '<div><strong>' + esc(head) + '</strong><p>' + (best ? '' : 'Next calm slot: ' + esc(fmtDay(pick.date)) + '. ') + '<b>' + esc(pick.o.name) + '</b>, usually ' + level(pick.s).toLowerCase() + '.</p>' +
    '<p class="est" style="margin-top:10px">Estimate, not live data. Times are in Bengaluru.</p></div></section>' : '';
  const list = OFFICE_IDS.map(id => OFFICES[id]).filter(o => f === 'all' || (f === 'open' && isOpenAt(o, now)) || (f === 'aadhaar' && o.type === 'ask') || (f === 'passport' && o.type === 'psk'));
  let h = '<div class="wrap page">' + floatersHTML('best') + ptitle(KN.best, 'Best time', 'The calmest time to visit each office, from a model of how they usually fill up.') + hero +
    '<div class="filter" role="group" aria-label="Show offices" style="margin-bottom:22px">' + [['all', 'All'], ['open', 'Open now'], ['aadhaar', 'Aadhaar'], ['passport', 'Passport']].map(([v, l]) =>
      '<button type="button" class="chip-inline" id="bf-' + v + '" data-act="bfilter" data-f="' + v + '" aria-pressed="' + (f === v) + '">' + l + '</button>').join('') + '</div>';
  if (!list.length) {
    h += '<div class="empty card">' + tile('clock', 't-go', 'lg') + '<p>Nothing is open right now. Aadhaar centres open at ' + fmtTime(OFFICES['ask-southend'].open) + ' and Passport Seva Kendras at ' + fmtTime(OFFICES['psk-lalbagh'].open) + ' on weekdays.</p>' +
      '<p style="margin-top:14px"><button type="button" class="btn" data-act="bfilter" data-f="all">Show all offices</button></p></div>';
  } else {
    h += '<ul class="ocards">' + list.map((o, i) => {
      const st = officeStatus(o, now), c = calmLabel(o, now);
      return '<li' + (reduced() ? rv(i * 0.06) : ' data-rise') + '><a class="ocard card card-hover" href="#best-time.' + o.id + '"><span class="ocard-top">' + tile('building', o.type === 'psk' ? 't-passport' : 't-aadhaar', '') +
        '<span class="pill"><span class="dot' + (st.open ? ' on' : '') + '"></span>' + (st.open ? 'Open now' : 'Closed') + '</span></span>' +
        '<span><span class="ocard-name">' + esc(o.name) + '</span><span class="ocard-meta">' + esc(o.area) + '. ' + esc(st.text) + '</span>' +
        (o.noticeShort ? '<span class="tag" style="margin-top:10px;background:var(--amber-soft);color:var(--amber)">' + esc(o.noticeShort) + '</span>' : '') + '</span>' +
        '<span class="ocard-calm"><span>' + esc(c.label) + '<br>' + esc(c.sub) + '</span><b>' + esc(c.time) + '</b></span></a></li>';
    }).join('') + '</ul>';
  }
  return h + '</div>';
}
function viewOffice(id) {
  const o = OFFICES[id], task = TASKS[o.task];
  return '<div class="wrap page narrow office-page">' + floatersHTML('office') + '<nav class="crumbs" aria-label="Breadcrumb"><a href="#best-time">Best time</a>' + icon('chev') + '<span>' + esc(o.short) + '</span></nav>' +
    '<div class="ghead" style="margin:10px 0 28px">' + tile('building', o.type === 'psk' ? 't-passport' : 't-aadhaar', 'xl') + '<div><h1 class="g-title" id="page-h" tabindex="-1">' + esc(o.name) + '</h1><p class="muted" style="margin-top:4px">' + esc(o.area) + '</p></div></div>' +
    '<section class="sec card">' + goTools({ task, scope: 'office', officeId: id, note: o.type === 'psk' ? 'Passport Seva Kendras work by appointment. Book the calmest slot you can get on passportindia.gov.in or the mPassport Seva app.' : null }) +
    '<p style="margin-top:24px"><a class="btn-text" href="#' + task.id + '">Open the ' + esc(task.name) + ' guide' + icon('chev') + '</a></p></section></div>';
}

/* ---------- Fair price ---------- */
function allFeesTable() {
  const groups = [];
  TASK_IDS.forEach(id => TASKS[id].priceList.forEach(r => {
    let g = groups[groups.length - 1];
    if (!g || g.caption !== r.group_label) { g = { caption: r.group_label, rows: [] }; groups.push(g); }
    g.rows.push(r);
  }));
  return groups.map(g => '<table class="feetable"><caption>' + esc(g.caption) + '</caption><thead><tr><th scope="col">What</th><th scope="col">Official fee</th></tr></thead><tbody>' +
    g.rows.map(r => '<tr><td>' + esc(r.label) + srcLine(metaOf(r)) + '</td><td>' + esc(r.value) + '</td></tr>').join('') + '</tbody></table>').join('') +
    '<p class="est" style="margin-top:14px">Fees checked ' + FEES_CHECKED + '. Passport fees revised 1 July 2026.</p>';
}
function viewFair() {
  const pre = memo.fair || {};
  const tid = pre.task && TASKS[pre.task] && TASKS[pre.task].quote ? pre.task : 'aadhaar';
  const task = TASKS[tid];
  const cs = caseOf(task, pre.case) || currentCase(task);
  memo.fair = Object.assign({}, pre, { task: tid, case: cs.id });
  const b = bandFor(task, cs), q = qState('fq');
  const bandRow = (color, name, txt, k) => '<li data-k="' + k + '" style="--kc:' + color + '"><span class="sw" style="background:' + color + '" aria-hidden="true"></span><span><b>' + name + '</b>' + txt + '</span></li>';
  let h = '<div class="wrap page">' + floatersHTML('fair') + ptitle(KN.fair, 'Fair price', 'Check an agent’s quote against the official fee before you pay.') +
    '<div class="answer"' + rv() + '><p class="answer-line">' + (b.o === 0 ? 'Free' : inr(b.o)) + '<span class="sub">official fee, ' + esc(task.name + ', ' + cs.label) + '</span></p>' +
    '<p class="answer-meta" style="font-weight:500">Fair with help: up to ' + inr(b.f) + '. <span class="est">Pilot estimate.</span></p></div>';
  h += '<div class="two"><section class="formcard card" aria-labelledby="fq-h"' + rv(0.05) + '><h2 id="fq-h">Check a quote</h2>';
  h += seg('ft', 'Task', TASK_IDS.filter(id => TASKS[id].quote).map(id => ({ id: 'ft-' + id, label: TASKS[id].short, pressed: id === tid, attrs: 'data-act="ftask" data-task="' + id + '"' })), 'seg-block');
  if (task.cases.length > 1) h += '<div class="cases" data-n="' + task.cases.length + '" role="group" aria-label="Which case?" style="display:flex;flex-wrap:wrap">' + task.cases.map(c =>
    '<button type="button" id="fc-' + c.id + '" data-act="fcase" data-task="' + tid + '" data-case="' + c.id + '" aria-pressed="' + (c.id === cs.id) + '">' + esc(c.name) + '</button>').join('') + '</div>';
  if (task.paysel === 'passport') h += passportSelects('fp');
  h += quoteBox('fq', task, cs, { primary: true, amount: q.amount, verdictFor: q.checked && q.amount ? parseInt(q.amount, 10) : null });
  h += '</section><div><section class="bands card" aria-labelledby="bands-h"' + rv(0.1) + '><h2 id="bands-h">How the check works</h2><ul>' +
    (b.o > 0 ? bandRow('var(--surface-3)', 'Below official', 'Under ' + inr(b.o) + '. Ask what is included, and keep the receipt.', 'below') : '') +
    bandRow('#34C759', 'Exactly right', b.o === 0 ? '₹0. It is free on the official site.' : inr(b.o) + '. The official fee, nothing added.', 'exact') +
    bandRow('#34C759', 'Fair', inr(b.o + 1) + ' to ' + inr(b.f) + '. The official fee plus a reasonable charge for help.', 'fair') +
    bandRow('#FF9F0A', 'On the high side', inr(b.f + 1) + ' to ' + inr(b.h) + '. Ask for a breakdown before you agree.', 'high') +
    bandRow('#FF3B30', 'Overcharged', 'Above ' + inr(b.h) + '. Doing it yourself saves the difference.', 'over') +
    '</ul><p class="est">Fair and high limits are pilot estimates, not official figures.</p></section>' +
    '<section class="fees-card card"' + rv(0.14) + '>' + fold('fold-fees', 'Every official fee', allFeesTable(), false) +
    '<p class="est" style="padding:14px 0 18px">Rent agreements and tax returns have no quote check: drafting and filing help are paid professional services whose prices vary.</p></section></div></div></div>';
  return h;
}

/* ---------- My tickets ---------- */
function viewTickets() {
  const now = nowIST();
  const trips = S.trips.slice().sort((a, b) => b.savedAt - a.savedAt);
  let h = '<div class="wrap page">' + floatersHTML('tickets') + ptitle(KN.tickets, 'My tickets', 'Your saved trips. Packing stays live, so ticks you make later show up here.') +
    '<div class="answer"><p class="answer-line">' + (trips.length ? plural(trips.length, 'saved trip') : 'No saved trips yet') + '</p></div>';
  if (!trips.length) h += '<div class="empty card">' + tile('ticket', 't-ticket', 'lg') + '<p>No saved trips yet. Finish a guide and tap Save ticket.</p><p style="margin-top:18px"><a class="btn btn-primary magnetic" href="#guides">Pick a guide</a></p></div>';
  else h += '<ul class="trips">' + trips.map((tr, i) => {
    const x = caseByKey(tr.key);
    return '<li class="trip-card" data-tilt="2"' + (reduced() ? rv(i * 0.06) : ' data-rise') + '>' + slipHTML(x.task, x.cs, now, { mini: true, flat: true }) +
      '<div class="trip-acts"><a class="chip-inline" href="#' + tr.key + '.ticket">Open</a>' +
      '<button type="button" class="chip-inline" data-act="tshare" data-key="' + tr.key + '" id="ts-' + tr.id + '"><span class="lbl-t">Share</span></button>' +
      '<button type="button" class="chip-inline" data-act="tremove" data-id="' + tr.id + '" id="tr-' + tr.id + '">Remove<span class="sr-only"> ' + esc(x.task.name + ', ' + x.cs.label) + '</span></button></div></li>';
  }).join('') + '</ul>';
  h += '<a class="docs-teaser card card-hover" href="#documents"' + rv() + '>' + tile('folder', 't-voter', 'lg') + '<span class="dt-body"><span class="dt-h">My documents</span>' +
    '<span class="muted">Keep your Aadhaar, PAN and other numbers and copies on this device, ready for any form.</span></span><span class="brow-go" aria-hidden="true">' + icon('chev') + '</span></a></div>';
  return h;
}

/* ---------- About ---------- */
function viewAbout() {
  const q = (id, title, txt) => { const m = SEC_META[id]; return '<div>' + tile(m.icon, m.cls, '') + '<p><strong>' + title + '.</strong> ' + txt + '</p></div>'; };
  return '<article class="wrap page about">' + floatersHTML('about') + '<header class="phead"><span class="kn" lang="kn">' + KN.hero + '</span><h1 class="h1" id="page-h" tabindex="-1" style="margin-top:10px">About Bring Go Pay</h1>' +
    '<p class="lead" style="margin-top:18px">Every government errand raises three questions: what to bring, when to go, and what to pay. Bring Go Pay answers all three in one guide per task, so the first trip is the only trip.</p></header>' +
    '<h2' + rv() + '>The three questions</h2><div class="q3">' +
    q('bring', 'Bring', 'People find out a document is missing at the counter, after queuing, and have to come back. Each guide lists what to carry, and you tick things off as you pack.') +
    q('go', 'Go', 'Offices are packed at some hours and empty at others, and nobody says which. Each guide suggests the calmest slot for the day you pick.') +
    q('pay', 'Pay', 'Agents outside offices quote any price. Without the official fee you can\'t tell a fair service charge from a markup. Each guide shows the official fee and checks a quote against it.') + '</div>' +
    '<h2' + rv() + '>Why it exists</h2><p>Bring Go Pay is a student hackathon project for the UN Sustainable Development Goals. It is built around Goal 16: peace, justice and strong institutions.</p></article>' +
    sdgSection() +
    '<article class="wrap page about about-2">' +
    '<h2' + rv() + '>How it works</h2><p>The pilot covers Bengaluru: ' + numWord(TASK_IDS.length) + ' tasks and four offices. Fees come from the official portals and were checked on ' + FEES_CHECKED + ', and the driving licence, voter ID and education loan guides on ' + NEW_CHECKED + '. Where we could not confirm a current fee, the guide sends you to the official site instead of guessing. Rush levels come from a simple model of how these offices usually fill up across the day and week. They are estimates, not live data, and every screen that shows one says so. Times are always Bengaluru time.</p>' +
    '<p>Your ticks, documents and saved tickets stay in this browser. There is no account to make.</p>' +
    '<h2' + rv() + '>Roadmap</h2><dl data-route="dt" data-pad="13"><dt>Now</dt><dd>' + TASK_IDS.length + ' guides and 4 offices. Fees verified, rush levels estimated.</dd>' +
    '<dt>Next</dt><dd>One-tap “How long did you wait?” reports replace the estimates. Guides in Kannada and Hindi.</dd>' +
    '<dt>Later</dt><dd>Bangalore One centres and Sub-Registrar offices, a WhatsApp checklist, then more cities.</dd></dl>' +
    '<h2' + rv() + '>How it is paid for</h2><p>It is free for citizens. The costs are meant to be covered by:</p><ul class="plain" style="margin-top:10px">' +
    '<li>Licences for colleges, employers and housing societies, who send students, new staff and tenants through the same paperwork every year.</li>' +
    '<li>Listing fees for vetted agents who agree to publish fair prices.</li><li>Paid document pre-checks, for people who want their papers looked over before they go.</li></ul>' +
    '<h2' + rv() + '>Privacy</h2><p>No sign-up. Nothing is uploaded. Your ticks stay on this device, and so do any numbers and copies you keep in My documents. You can clear everything in Settings.</p>' +
    '<h2' + rv() + '>Sources</h2><ul class="plain">' +
    '<li>Aadhaar fees, documents and centres: ' + extLink(L.uidai) + ' and ' + extLink(L.myaadhaar) + ', checked ' + TASKS.aadhaar.checked + '.</li>' +
    '<li>PAN: ' + extLink(L.incometax) + ', ' + extLink(L.protean) + ' and ' + extLink(L.utiitsl) + ', checked ' + TASKS.pan.checked + '.</li>' +
    '<li>Passport fees (revised 1 July 2026) and Passport Seva Kendras: ' + extLink(L.passport) + ', checked ' + TASKS.passport.checked + '. PSK Whitefield moved on 5 Oct 2026.</li>' +
    '<li>Rent agreements, Karnataka e-stamp paper: ' + extLink(L.shcil) + ', checked ' + TASKS.rent.checked + '.</li>' +
    '<li>Late tax return for FY 2025-26: ' + extLink(L.incometax) + ', checked ' + TASKS.itr.checked + '.</li>' +
    '<li>Driving licence: ' + extLink(L.sarathi) + ' and ' + extLink(L.katransport) + ', checked ' + TASKS.dl.checked + '.</li>' +
    '<li>Voter ID: ' + extLink(L.eci) + ', the Election Commission\'s Form 6 and Form 8 guidelines, and ' + extLink(L.ceoka) + ', checked ' + TASKS.voter.checked + '.</li>' +
    '<li>Education loan: ' + extLink(L.pmvl) + ', the Ministry of Education\'s PM-Vidyalaxmi note, and ' + extLink(L.itindia) + ' for section 80E, checked ' + TASKS.eduloan.checked + '.</li>' +
    '<li>Fair-price bands: pilot estimates by the project team, not official figures.</li></ul>' +
    '<p class="est" style="margin-top:28px">An independent civic-tech pilot, not a government website.</p></article>';
}
/* ---------- About: the Sustainable Development Goals we work towards ---------- */
ICONS.people = '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.6" cy="9.4" r="2.6"/><path d="M15.6 14.1c2.6 0 4.3 1.7 4.9 4.9"/>';
ICONS.trend = '<path d="M4 4.5v15h15.5"/><path d="M7.5 8.5l4 4 3-3 4.5 4.5"/><path d="M19 10.5v3.5h-3.5"/>';
const SDG_MAIN = {
  n: 16, color: '#00689D', title: 'Peace, justice and strong institutions',
  text: 'We make government paperwork transparent and fair, so public services are harder to abuse and easier to use.',
  targets: [
    ['16.5', 'Fair fees, no overcharging', 'We show the official fee for every task, so nobody can be overcharged and agents and touts lose their grip. Fair price checks any quote against it.', ['aadhaar', 'pan', 'passport']],
    ['16.6', 'Open, transparent services', 'Office timings, steps and the documents you need are public, in one plain place, with the date we last checked them. That makes government services transparent.', ['passport', 'dl', 'rent']],
    ['16.9', 'ID for everyone', 'We help people get their basic ID documents, like Aadhaar, PAN and passport, without the confusion.', ['aadhaar', 'pan', 'passport']]
  ]
};
const SDG_MORE = [
  { n: 10, color: '#DD1367', title: 'Reduced inequalities', tgt: ['10.2', 'Inclusion of all'],
    pts: ['Everyone gets the same clear guidance, not just people who know someone or can pay a middleman.', 'It helps first-timers, students, migrants and people with less formal education the most.'], g: ['voter', 'dl', 'eduloan'] },
  { n: 1, color: '#E5243B', title: 'No poverty', tgt: ['1.4', 'Equal access to basic services'],
    pts: ['Overcharging and repeat trips hurt the poor the most. A daily-wage worker loses a day\'s income for every wasted visit.', 'We cut those hidden costs by telling people exactly what to bring and when to go.'], g: ['aadhaar', 'pan', 'rent'] },
  { n: 9, color: '#FD6925', title: 'Industry, innovation and infrastructure', tgt: [null, 'Technology for public services'],
    pts: ['Bring Go Pay is a digital tool that makes public services easier to reach: free, with no sign-up, on any phone, in three languages.'], g: [], feats: ['Free', 'No sign-up', '3 languages'] }
];
const SDG_WHO = ['First-timers', 'Low-income families', 'Daily-wage workers', 'Students', 'People new to the city'];
const SDG_MEASURE = [['pin', 'Fewer repeat trips per task'], ['clock', 'Less time spent per task'], ['rupee', 'Fewer people paying more than the official fee']];
const SDG_LINE = 'We mainly tackle Goal 16 by making government paperwork transparent and fair. We support Goals 10, 1 and 9 by giving everyone equal access, saving money for people on low incomes, and using technology to do it.';
function sdgGuides(ids) {
  if (!ids.length) return '';
  return '<span class="sdg-guides">' + ids.map(id => '<a href="#' + id + '" class="sdg-g" aria-label="' + esc(TASKS[id].name) + '">' + taskTile(TASKS[id], 'sm') + '<span>' + esc(TASKS[id].short) + '</span></a>').join('') + '</span>';
}
function sdgSection() {
  const m = SDG_MAIN, live = !reduced(), all = [m].concat(SDG_MORE);
  const rise = (i, soft) => live ? ' data-rise' + (soft ? '="soft"' : '') : rv(i * 0.06);
  return '<section class="sdgs" aria-labelledby="sdg-h"><div class="wrap">' +
    '<header class="sdg-head"' + rv() + '><p class="sdg-eyebrow"><span class="sdg-dots" aria-hidden="true">' + all.map(x => '<i style="--c:' + x.color + '"></i>').join('') + '</span>UN Sustainable Development Goals</p>' +
    '<h2 class="sdg-h" id="sdg-h">The goals we work towards</h2><p class="lead">Bring Go Pay is built around Goal 16. The same work moves three more goals forward.</p></header>' +
    '<article class="sdg-main" style="--c:' + m.color + '"' + rise(0, true) + ' aria-labelledby="sdg16-h"><div class="sdg-main-top"><div class="sdg-num"><span>Goal</span><b>' + m.n + '</b></div>' +
    '<div><p class="sdg-kicker">Main goal</p><h3 id="sdg16-h">' + esc(m.title) + '</h3><p>' + esc(m.text) + '</p></div></div>' +
    '<ol class="sdg-targets" data-route="li" data-pad="22">' + m.targets.map(t => '<li><b class="sdg-t">' + t[0] + '</b><div><strong>' + esc(t[1]) + '</strong><p>' + esc(t[2]) + '</p>' + sdgGuides(t[3]) + '</div></li>').join('') + '</ol></article>' +
    '<h3 class="sdg-sub"' + rv() + '>Supporting goals</h3>' +
    '<ul class="sdg-grid">' + SDG_MORE.map((x, i) => '<li' + rise(i) + '><article class="sdg-card" data-tilt="1.2" style="--c:' + x.color + '" aria-labelledby="sdg' + x.n + '-h">' +
      '<div class="sdg-num"><span>Goal</span><b>' + x.n + '</b></div><h3 id="sdg' + x.n + '-h">' + esc(x.title) + '</h3>' +
      '<p class="sdg-tgt">' + (x.tgt[0] ? '<b>' + x.tgt[0] + '</b>' : '<b class="sdg-tgt-ic" aria-hidden="true">' + icon('spark') + '</b>') + esc(x.tgt[1]) + '</p>' +
      '<ul class="sdg-pts">' + x.pts.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      (x.feats ? '<span class="sdg-feats">' + x.feats.map(f => '<span>' + esc(f) + '</span>').join('') + '</span>' : '') + sdgGuides(x.g) + '</article></li>').join('') + '</ul>' +
    '<div class="sdg-impact">' +
      '<section class="sdg-box sdg-who"' + rise(0) + ' aria-labelledby="sdg-who-h">' + tile('people', 't-voter', '') + '<h3 id="sdg-who-h">Who benefits</h3>' +
        '<p>Everyday citizens doing government paperwork in Bengaluru, especially first-timers and people on low incomes.</p>' +
        '<ul class="sdg-people">' + SDG_WHO.map((w, i) => '<li style="--i:' + i + '">' + esc(w) + '</li>').join('') + '</ul></section>' +
      '<section class="sdg-box sdg-measure"' + rise(1) + ' aria-labelledby="sdg-m-h">' + tile('trend', 't-pay', '') + '<h3 id="sdg-m-h">How we would measure it</h3>' +
        '<ul class="sdg-metrics">' + SDG_MEASURE.map(([ic, t], i) => '<li style="--i:' + i + '"><span class="sdg-m-ic" aria-hidden="true">' + icon(ic) + '</span><span class="sdg-m-t">' + esc(t) + '</span>' +
          '<span class="sdg-down" aria-hidden="true">' + icon('up') + '</span></li>').join('') + '</ul>' +
        '<p class="est">Planned measures for the pilot. There are no results yet.</p></section></div>' +
    '<figure class="sdg-line"' + rv() + '><span class="sdg-line-goals" aria-hidden="true">' + all.map((x, i) => '<i style="--c:' + x.color + ';--i:' + i + '">' + x.n + '</i>').join('') + '</span>' +
      '<blockquote><p>' + esc(SDG_LINE) + '</p></blockquote><figcaption>Bring Go Pay, in one line</figcaption></figure>' +
    '<p class="est sdg-note">Goal and target numbers are from the United Nations 2030 Agenda. The links between them and this project are our own.</p></div></section>';
}
function viewNotFound() {
  return '<div class="wrap page">' + floatersHTML('none') + '<div class="empty card">' + tile('search', 't-office', 'lg') + '<h1 class="h3" id="page-h" tabindex="-1">Page not found</h1>' +
    '<p style="margin-top:10px">There is no page at this address.</p><div class="btn-row" style="justify-content:center;margin-top:20px"><a class="btn btn-primary magnetic" href="#guides">See all guides</a><a class="btn magnetic" href="#home">Go home</a></div></div></div>';
}

/* ---------- Settings (side sheet on desktop, bottom sheet on phone) ---------- */
function settingsHTML() {
  const st = S.settings;
  const sg = (name, label, opts) => seg('set-' + name, label, opts.map(([v, l]) => ({ id: 'set-' + name + '-' + v, label: l, pressed: st[name] === v, attrs: 'data-act="set" data-k="' + name + '" data-v="' + v + '"' })));
  return '<div class="sheet-head"><h2 id="set-h">Settings</h2><button type="button" class="sheet-close" data-act="close-settings" id="set-close" aria-label="Close settings"><span>' + icon('close') + '</span></button></div><div class="sheet-body">' +
    '<section class="set-sec"><h3>Language</h3>' + seg('set-lang', 'Language', LANGS.map(l => ({ id: 'set-lang-' + l, label: LANG_NAMES[l], pressed: (st.lang || 'en') === l,
      attrs: 'data-act="set" data-k="lang" data-v="' + l + '" lang="' + l + '" translate="no"' }))) +
    '<p class="est" style="margin-top:10px">Changes every page, guide and message.</p></section>' +
    '<section class="set-sec"><h3>Appearance</h3>' + sg('theme', 'Theme', [['device', 'Device'], ['light', 'Light'], ['dark', 'Dark']]) + '</section>' +
    '<section class="set-sec"><h3>Text size</h3>' + sg('text', 'Text size', [['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger']]) + '</section>' +
    '<section class="set-sec"><h3>Sound effects</h3>' + sg('sound', 'Sound effects', [['on', 'On'], ['off', 'Off']]) + '</section>' +
    '<section class="set-sec"><h3>Sponsored services</h3>' + sg('ads', 'Sponsored services', [['on', 'Show'], ['off', 'Hide']]) +
    '<p class="est" style="margin-top:10px">Partner listings only appear after a guide\'s steps and on the home page, never in checklists, timings or fees. Hiding them is what an ad-free plan would do.</p></section>' +
    '<section class="set-sec"><h3>Motion</h3>' + sg('motion', 'Motion', [['full', 'Full'], ['reduced', 'Reduced']]) +
    (mqReduce.matches ? '<p class="est" style="margin-top:10px">Your device asks for reduced motion, so animations stay off either way.</p>' : '') + '</section>' +
    '<section class="set-sec">' + docsCard('set-docs-h', 'h3', 'st') + '<p style="margin-top:12px"><a class="btn-text" href="#documents">Open My documents' + icon('chev') + '</a></p></section>' +
    '<section class="set-sec"><h3>Keyboard shortcuts</h3>' + shortcutsList() + '</section>' +
    '<section class="set-sec"><h3>Your data</h3><p class="muted">' + (storageOK ? 'Everything is saved on this device only. No sign-up, and nothing is uploaded.'
      : 'This browser is not letting the page save, so your ticks last until you close the tab. Nothing is uploaded.') + '</p>' +
    '<div class="btn-row" style="margin-top:14px"><button type="button" class="btn btn-danger" data-act="clear-all" id="clear-all">Clear all data</button></div></section></div>';
}
