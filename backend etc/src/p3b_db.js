
/* ==================================================================
   DATABASE
   Guides, fees, documents and offices live in Supabase (Postgres).
   At start-up the site reads six tables with plain fetch() calls to
   Supabase's REST API, then turns the rows back into the TASKS and
   OFFICES objects the rest of the code already uses. No library.
   build.sh fills in the URL and the publishable key from environment
   variables. That key is meant to be public: the tables are read-only.
   ================================================================== */
const DB_CONFIG = { url: '%%SUPABASE_URL%%', key: '%%SUPABASE_KEY%%' };
/* Each table and the order its rows should come in. */
const DB_TABLES = {
  tasks: 'sort_order.asc',
  cases: 'task_id.asc,sort_order.asc',
  rules: 'task_id.asc,case_id.asc.nullsfirst,sort_order.asc',
  offices: 'sort_order.asc',
  office_tasks: 'office_id.asc,task_id.asc',
  translations: 'en.asc'
};
const DB_PAGE = 1000;   // Supabase sends at most 1000 rows per request, so bigger tables come in pages
function dbConfigured() { return /^https?:\/\//.test(DB_CONFIG.url) && !!DB_CONFIG.key && DB_CONFIG.key.indexOf('%%') < 0; }
/* Mobile networks drop requests now and then. Try again twice, after 0.3 s and 0.9 s, before giving up.
   A wrong key or a missing table (a 4xx answer) won't fix itself, so those fail straight away. */
async function fetchRetry(url, headers, table) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return await res.json();
      if (res.status < 500 || attempt >= 2) throw Object.assign(new Error(table + ': HTTP ' + res.status), { final: true });
    } catch (e) {
      if (e.final || attempt >= 2) throw e;
    }
    await new Promise(r => setTimeout(r, 300 * Math.pow(3, attempt)));
  }
}
async function dbGet(table, order) {
  const base = DB_CONFIG.url.replace(/\/+$/, '') + '/rest/v1/' + table + '?select=*&order=' + order;
  const headers = { apikey: DB_CONFIG.key };   // publishable keys go in this header only, never as a Bearer token
  let rows = [];
  for (let offset = 0; ; offset += DB_PAGE) {
    const page = await fetchRetry(base + '&limit=' + DB_PAGE + '&offset=' + offset, headers, table);
    rows = rows.concat(page);
    if (page.length < DB_PAGE) return rows;
  }
}
async function loadData() {
  const names = Object.keys(DB_TABLES);
  const lists = await Promise.all(names.map(n => dbGet(n, DB_TABLES[n])));
  const db = {};
  names.forEach((n, i) => { db[n] = lists[i]; });
  return db;
}

/* ---------- A saved copy, for slow or missing networks ----------
   After every good load the rows are saved in localStorage. The next
   visit shows that copy straight away, then asks Supabase for anything
   newer. The copy is public guide data, never anything personal. */
const DATA_CACHE_KEY = 'bgp.data.v1';
function readDataCache() {
  try {
    const c = JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || 'null');
    return c && c.db && c.savedAt && c.url === DB_CONFIG.url ? c : null;   // only a copy from this same database
  } catch (e) { return null; }
}
function writeDataCache(db) {
  try { localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({ url: DB_CONFIG.url, savedAt: Date.now(), db })); return true; }
  catch (e) { return false; }   // private browsing or a full storage: the site still works, just without a copy
}
/* When a copy was saved, as "Sun 25 Oct" and "10:05 AM" in Bengaluru time. */
function savedWhen(ms) {
  const p = {};
  for (const part of IST.formatToParts(new Date(ms))) p[part.type] = part.value;
  let h = +p.hour; if (h === 24) h = 0;
  return [fmtDay(ymd(+p.year, +p.month, +p.day)), fmtTime(h * 60 + (+p.minute))];
}

/* ---------- Rows back into the shapes the pages use ---------- */
function fmtYmd(ymd) { if (!ymd) return ''; const p = parseYmd(String(ymd).slice(0, 10)); return p.d + ' ' + MON[p.m - 1] + ' ' + p.y; }
function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
function minsOf(t) { if (!t) return 0; const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }
const num = v => v === null || v === undefined ? null : Number(v);
const bySort = (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id;
/* Where a fact comes from and when it was checked, for the line under it. */
const metaOf = r => ({ src: r.source_url || null, on: r.verified_on || null });

function applyData(db) {
  /* Translations from the database win over the ones built into the site. */
  db.translations.forEach(t => { if (t.hi) I18N.hi.exact[t.en] = t.hi; if (t.kn) I18N.kn.exact[t.en] = t.kn; });
  I18n.cache.clear();

  const caseRules = {}, taskRules = {};
  db.rules.slice().sort(bySort).forEach(r => {
    const bucket = r.case_id ? caseRules : taskRules, k = r.case_id || r.task_id;
    (bucket[k] = bucket[k] || []).push(r);
  });

  OFFICES = {};
  const officeSlug = {};
  db.offices.slice().sort(bySort).forEach(o => {
    officeSlug[o.id] = o.slug;
    OFFICES[o.slug] = { id: o.slug, task: null, type: o.office_type, name: o.name, short: o.short_name, area: o.area, address: o.address,
      days: (o.open_days || []).map(Number), open: minsOf(o.opens_at), close: minsOf(o.closes_at), hours: o.hours, how: o.how_to_visit,
      notice: o.notice || undefined, noticeShort: o.notice_short || undefined, meta: metaOf(o) };
  });
  OFFICE_IDS = Object.keys(OFFICES);

  const taskSlug = {}, officesOf = {};
  db.tasks.forEach(t => { taskSlug[t.id] = t.slug; });
  db.office_tasks.forEach(x => {
    const o = officeSlug[x.office_id], t = taskSlug[x.task_id];
    if (!o || !t) return;
    (officesOf[t] = officesOf[t] || []).push(o);
    if (!OFFICES[o].task) OFFICES[o].task = t;
  });

  TASKS = {};
  db.tasks.slice().sort(bySort).forEach(t => {
    const rows = taskRules[t.id] || [];
    const T = {
      id: t.slug, prefix: t.ticket_prefix, kn: KN[t.slug] || '', name: t.name, short: t.short_name, line: t.short_description,
      mode: t.mode, from: t.price_summary, source: t.source_name, quote: !!t.fair_price_check, noQuote: t.no_check_reason || undefined,
      offices: (officesOf[t.slug] || []).sort((a, b) => OFFICE_IDS.indexOf(a) - OFFICE_IDS.indexOf(b)),
      helpline: t.helpline_number ? { label: t.helpline_label, num: t.helpline_number } : null,
      links: rows.filter(r => r.type === 'link').map(r => ({ href: r.value, text: r.label })),
      priceList: rows.filter(r => r.type === 'fee'),
      paysel: t.slug === 'passport' || t.slug === 'itr' ? t.slug : undefined
    };
    const terms = rows.filter(r => r.type === 'term').map(r => [r.label, r.value]);
    if (terms.length) T.terms = terms;
    T.cases = db.cases.filter(c => c.task_id === t.id).sort(bySort).map(c => caseFrom(T, c, caseRules[c.id] || []));
    const dates = db.rules.filter(r => r.task_id === t.id && r.verified_on).map(r => String(r.verified_on)).sort();
    T.checked = fmtYmd(dates[dates.length - 1]);
    TASKS[t.slug] = T;
  });
  TASK_IDS = Object.keys(TASKS);

  const all = db.rules.filter(r => r.verified_on).map(r => String(r.verified_on)).sort();
  FEES_CHECKED = fmtYmd(all[0]);
  NEW_CHECKED = fmtYmd(all[all.length - 1]);
  const itrCase = TASKS.itr && TASKS.itr.cases[0];
  ITR_INCOME = itrCase ? itrCase.feeRows.filter(r => /^late_/.test(r.key || '')).map(r => ({ id: r.key.slice(5), label: r.group_label, fee: num(r.amount) })) : [];
  SEARCH_INDEX = null;
}

function caseFrom(T, c, rows) {
  const of = type => rows.filter(r => r.type === type);
  /* Documents. Keys like "poa:utility" are options inside a "pick one" group called "poa". */
  const items = [];
  of('document').forEach(r => {
    const meta = metaOf(r);
    if ((r.key || '').indexOf(':') > 0) {
      const [gid, oid] = r.key.split(':');
      let g = items[items.length - 1];
      if (!g || g.id !== gid || !g.pick) { g = { id: gid, label: r.group_label, pick: [] }; items.push(g); }
      g.pick.push({ id: oid, label: r.label, doc: r.my_doc || undefined, note: r.notes || undefined, meta });
    } else items.push({ id: r.key, label: r.label, doc: r.my_doc || undefined, note: r.notes || undefined, optional: !!r.optional, meta });
  });
  /* When and how to go */
  const timing = k => rows.find(r => r.type === 'timing' && r.key === k);
  const go = { mode: c.visit_mode }, text = timing('online_text');
  if (text) go.online = { title: (timing('online_title') || {}).label, text: text.label, time: (timing('online_time') || {}).label || null,
    links: rows.filter(r => r.type === 'link' && r.key === 'online').map(r => ({ href: r.value, text: r.label })) };
  const visit = timing('visit_note'); if (visit) go.note = visit.label;
  const sum = timing('summary'); if (sum) go.summary = { short: sum.label, lines: [sum.value, sum.notes].filter(Boolean) };
  /* Fees. Each fee line is [label, amount or [low, high] or text, where it comes from]. */
  const feeRows = of('fee'), notes = of('fee_note');
  const key = k => feeRows.find(r => r.key === k);
  const line = r => [r.label, r.amount_max !== null && r.amount_max !== undefined ? [num(r.amount), num(r.amount_max)] : r.amount !== null && r.amount !== undefined ? num(r.amount) : r.value, metaOf(r)];
  const noteList = list => ({ notes: list.map(n => n.label), noteMeta: list.map(metaOf) });
  const plain = notes.filter(n => !n.key);
  let fee;
  if (T.paysel === 'passport') {
    fee = sel => {
      const age = sel.age || 'adult', minor = age === 'u18' || age === 'u8', pages = minor ? '36' : (sel.pages || '36');
      const base = key(minor ? 'base_u18' : pages === '60' ? 'base_60' : 'base_36'), off = key('discount_pct');
      const lines = [line(base)];
      if (off && (age === 'u8' || age === 'senior')) {
        lines.push([num(off.amount) + '% off for ' + (age === 'u8' ? 'under 8' : '60 or over') + ', first passport', -Math.round(num(base.amount) * num(off.amount) / 100), metaOf(off)]);
      }
      return Object.assign({ lines }, noteList(notes.filter(n => n.key !== 'minor_only' || minor)));
    };
  } else if (T.paysel === 'itr') {
    fee = sel => {
      const late = key('late_' + (sel.income || 'upto5')) || key('late_upto5');
      return Object.assign({ lines: [line(key('filing')), [late.label, num(late.amount), metaOf(late)]] }, noteList(plain));
    };
  } else {
    fee = () => {
      const f = Object.assign({ lines: feeRows.map(line) }, noteList(plain));
      const note = k => notes.find(n => n.key === k), check = rows.find(r => r.type === 'link' && r.key === 'fee_check');
      if (note('total')) f.total = note('total').label;
      if (note('short')) f.short = note('short').label;
      if (note('headline')) f.headline = [note('headline').label, note('headline').value];
      if (check) f.check = { href: check.value, text: check.label };
      return f;
    };
  }
  /* Fair price bands: official fee plus the team's estimated margins. */
  const band = c.fair_margin === null || c.fair_margin === undefined ? null
    : sel => { const o = feeTotal(fee(sel)); return { o, f: o + num(c.fair_margin), h: o + num(c.high_margin) }; };
  return {
    id: c.slug, name: c.name, label: c.label, items, go, fee, band, feeRows,
    steps: of('step').map(r => r.label), watch: of('tip').map(r => r.label),
    noDocs: c.no_docs_text || undefined, note: c.note || undefined, ready: !!c.ready_at_home, tool: c.tool || undefined,
    fullList: c.full_list_url ? { href: c.full_list_url, text: hostOf(c.full_list_url) } : null, fullListText: c.full_list_text || undefined
  };
}

/* "uidai.gov.in · Verified on 16 Oct 2026", shown under fees and documents. */
function srcLine(m, tag) {
  if (!m || (!m.src && !m.on)) return '';
  const t = tag || 'span';
  return '<' + t + ' class="src">' + (m.src ? '<a href="' + esc(m.src) + '" target="_blank" rel="noopener noreferrer">' + esc(hostOf(m.src)) +
    '<span class="sr-only"> (opens in a new tab)</span></a>' : '') + (m.on ? '<span class="src-on">Verified on ' + esc(fmtYmd(m.on)) + '</span>' : '') + '</' + t + '>';
}
const sameMeta = list => list.length > 0 && list.every(m => m && list[0] && m.src === list[0].src && m.on === list[0].on);
