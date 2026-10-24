
/* ==================================================================
   HELPER TOOLS
   Small calculators inside guides. Dates and amounts typed here stay
   in memory for this visit only and are never saved.
   ================================================================== */
function toolCard(id, iconName, cls, title, sub, body) {
  return '<section class="tool-card" aria-labelledby="' + id + '-h"><div class="tool-head">' + tile(iconName, cls, 'sm') +
    '<div><h3 id="' + id + '-h">' + esc(title) + '</h3><p class="muted">' + esc(sub) + '</p></div></div>' + body + '</section>';
}
function toolStatus(color, text) { return '<p class="tool-status ts-' + color + '"><span class="dot" aria-hidden="true"></span><span>' + esc(text) + '</span></p>'; }
function toolFacts(rows) { return '<dl class="tool-dl">' + rows.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl>'; }
function validYmd(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }

/* ---------- Driving licence: when can I book the test? ---------- */
function llTool() {
  const v = memo.tool.ll || '';
  return toolCard('ll', 'calendar', 't-dl', 'When can I book the driving test?', 'Enter the date your learner\'s licence was issued. It is not saved.',
    '<div class="tool-row"><div class="field"><label class="lbl" for="ll-date">Learner\'s licence issued on</label>' +
    '<input type="date" class="input" id="ll-date" data-tool="ll" value="' + esc(v) + '" max="' + nowIST().date + '"></div></div>' +
    '<div class="tool-out" id="ll-out" aria-live="polite">' + llOut(v) + '</div>');
}
function llOut(v) {
  if (!validYmd(v)) return '';
  const now = nowIST();
  if (v > now.date) return toolStatus('amber', 'That date is in the future. Enter the issue date printed on your learner\'s licence.');
  const from = addDays(v, 30), until = addMonths(v, 6), toFrom = daysBetween(now.date, from), toEnd = daysBetween(now.date, until);
  let st;
  if (toEnd < 0) st = toolStatus('red', 'Your learner\'s licence has run out. You need to apply for a new one.');
  else if (toFrom > 0) st = toolStatus('amber', 'You can book the driving test from ' + fmtDayLong(from) + ', in ' + plural(toFrom, 'day') + '.');
  else st = toolStatus('green', 'You can book the driving test now. Your learner\'s licence runs out in ' + plural(toEnd, 'day') + '.');
  const remind = toFrom > 0 ? from : (toEnd > 14 ? addDays(until, -14) : null);
  return st + toolFacts([['Earliest test', fmtDate(from)], ['Learner\'s licence ends', fmtDate(until)]]) +
    '<p class="est">Check the dates printed on your learner\'s licence too.</p>' +
    (remind ? '<div class="btn-row"><a class="btn" href="' + esc(calUrl(toFrom > 0 ? 'Book your driving test' : 'Learner\'s licence ends in 2 weeks', remind, 600, 'sarathi.parivahan.gov.in',
      'Book a driving test slot on sarathi.parivahan.gov.in (Karnataka). Reminder from Bring Go Pay.')) + '" target="_blank" rel="noopener" data-act="cal">' + icon('calendar') + 'Add a reminder</a></div>' : '');
}

/* ---------- Voter ID: which qualifying date am I on? ---------- */
function qualTool() {
  const v = memo.tool.qual || '';
  return toolCard('qual', 'calendar', 't-voter', 'When can I register?', 'Enter your date of birth. It is not saved.',
    '<div class="tool-row"><div class="field"><label class="lbl" for="qual-date">Date of birth</label>' +
    '<input type="date" class="input" id="qual-date" data-tool="qual" value="' + esc(v) + '" max="' + nowIST().date + '"></div></div>' +
    '<div class="tool-out" id="qual-out" aria-live="polite">' + qualOut(v) + '</div>');
}
/* You join the roll on the first qualifying date (1 Jan, 1 Apr, 1 Jul, 1 Oct) on which you are 18. */
function qualifyingDate(b18) {
  const y = parseYmd(b18).y;
  return [ymd(y, 1, 1), ymd(y, 4, 1), ymd(y, 7, 1), ymd(y, 10, 1), ymd(y + 1, 1, 1)].find(q => q >= b18);
}
function qualOut(v) {
  if (!validYmd(v)) return '';
  const now = nowIST();
  if (v > now.date || parseYmd(v).y < now.date.slice(0, 4) - 120) return toolStatus('amber', 'Check the date of birth you entered.');
  const b17 = addYears(v, 17), b18 = addYears(v, 18), q = qualifyingDate(b18);
  let st;
  if (b18 <= now.date) st = toolStatus('green', 'You are 18 or over. You can register now with Form 6.');
  else if (b17 <= now.date) st = toolStatus('green', 'You can apply in advance now. You join the roll for ' + fmtDate(q) + '.');
  else st = toolStatus('amber', 'You can apply in advance from ' + fmtDayLong(b17) + ', when you turn 17.');
  return st + toolFacts(b18 <= now.date ? [['You turned 18', fmtDate(b18)]] : [['Apply in advance from', fmtDate(b17)], ['You turn 18', fmtDate(b18)], ['You join the roll for', fmtDate(q)]]);
}

/* ---------- Education loan: monthly repayment ---------- */
function emiTool() {
  const v = memo.tool.emi || {};
  const field = (id, label, val, attrs) => '<div class="field"><label class="lbl" for="emi-' + id + '">' + label + '</label><input class="input" id="emi-' + id + '" data-tool="emi" inputmode="decimal" autocomplete="off" value="' + esc(val || '') + '" ' + attrs + '></div>';
  return toolCard('emi', 'rupeec', 't-eduloan', 'What will I repay each month?', 'Use the rate from the bank\'s offer. Nothing you type is saved.',
    '<div class="tool-row tool-3">' + field('amt', 'Loan amount (₹)', v.amt, 'placeholder="e.g. 500000"') + field('rate', 'Interest rate (% a year)', v.rate, 'placeholder="From the offer"') +
    field('yrs', 'Repay over (years)', v.yrs || '10', 'placeholder="10"') + '</div>' +
    '<div class="tool-out" id="emi-out" aria-live="polite">' + emiOut(v) + '</div>');
}
function emiOut(v) {
  const P = parseFloat(String(v.amt || '').replace(/[^\d.]/g, '')), R = parseFloat(v.rate), N = parseFloat(v.yrs);
  if (!(P > 0) || !(R >= 0) || !(N > 0)) return '<p class="est">Enter the amount, the rate and the years to see an estimate.</p>';
  if (P > 1e9 || R > 40 || N > 30) return toolStatus('amber', 'Check the numbers: the rate should be under 40% and the term under 30 years.');
  const n = Math.round(N * 12), r = R / 1200;
  const emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  return '<p class="tool-big">' + inr(emi) + '<span> a month</span></p>' +
    toolFacts([['Months', String(n)], ['Total you repay', inr(total)], ['Of which interest', inr(total - P)]]) +
    '<p class="est">An estimate on the amount alone. Interest during the course and the moratorium is extra unless a subsidy covers it. Your sanction letter has the exact figures.</p>';
}
/* Live updates while typing, without re-rendering the page */
function onTool(input) {
  const kind = input.dataset.tool;
  if (kind === 'll') { memo.tool.ll = input.value; const o = document.getElementById('ll-out'); if (o) o.innerHTML = llOut(input.value); }
  if (kind === 'qual') { memo.tool.qual = input.value; const o = document.getElementById('qual-out'); if (o) o.innerHTML = qualOut(input.value); }
  if (kind === 'emi') {
    const g = id => (document.getElementById('emi-' + id) || {}).value || '';
    memo.tool.emi = { amt: g('amt'), rate: g('rate'), yrs: g('yrs') };
    const o = document.getElementById('emi-out'); if (o) o.innerHTML = emiOut(memo.tool.emi);
  }
}

/* ---------- Copy a checklist as plain text, for WhatsApp or notes ---------- */
function checklistText(key) {
  const x = caseByKey(key);
  if (!x) return '';
  const ticks = ticksOf(key);
  const lines = x.cs.items.map(it => {
    const p = pickedOption(it, ticks), done = itemDone(it, ticks);
    const lbl = it.pick ? it.label.replace(/, pick one$/, '') + (p ? ': ' + p.label : ' (any one: ' + it.pick.map(o => o.label).join(', ') + ')') : it.label;
    return (done ? '[x] ' : '[ ] ') + lbl + (it.optional ? ' (if needed)' : '');
  });
  return I18n.text('Bring Go Pay: ' + x.task.name + ', ' + x.cs.label + '\nWhat to bring:\n' + lines.join('\n')) + '\n' + location.href.split('#')[0] + '#' + key + '.bring';
}
