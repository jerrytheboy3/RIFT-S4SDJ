"""Read every guide, office and fee straight out of the running site and save it as JSON (test/extracted.json).
Nothing is retyped by hand, so the seed file copies the code exactly."""
import sys, pathlib, json
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri()
JS = r"""
(() => {
  const known = {
    task: 'checked id prefix kn name short line mode from offices helpline links source quote paysel noQuote terms cases',
    case: 'id name label items fullList fullListText go fee band steps watch noDocs note ready tool',
    item: 'id label doc note optional pick', go: 'mode online note summary', online: 'title text time links',
    office: 'id task type name short area address days open close hours how notice noticeShort'
  };
  const unknown = [];
  const check = (o, kind, where) => Object.keys(o).forEach(k => { if (!known[kind].split(' ').includes(k)) unknown.push(where + ': ' + k); });
  const dateOf = s => ({ '16 Oct 2026': '2026-10-16', '20 Oct 2026': '2026-10-20' })[s];
  const money = a => typeof a === 'number' ? { value: inr(a), amount: a, amount_max: null }
    : Array.isArray(a) ? { value: inr(a[0]) + '–' + inr(a[1]), amount: a[0], amount_max: a[1] }
    : { value: String(a), amount: null, amount_max: null };
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const out = { tasks: [], offices: [], fees_checked: FEES_CHECKED, new_checked: NEW_CHECKED, itr_deadline: ITR_DEADLINE, unknown };

  TASK_IDS.forEach((id, ti) => {
    const t = TASKS[id]; check(t, 'task', id);
    const T = { slug: id, name: t.name, short_description: t.line, short_name: t.short, mode: t.mode, price_summary: t.from, ticket_prefix: t.prefix,
      helpline_label: t.helpline ? t.helpline.label : null, helpline_number: t.helpline ? t.helpline.num : null, source_name: t.source,
      fair_price_check: !!t.quote, no_check_reason: t.noQuote || null, sort_order: ti + 1, verified_on: dateOf(t.checked),
      links: t.links.map(l => ({ label: l.text, value: l.href })), terms: (t.terms || []).map(([a, b]) => ({ label: a, value: b })),
      offices: t.offices.slice(), cases: [] };
    t.cases.forEach((c, ci) => {
      check(c, 'case', id + '.' + c.id); check(c.go, 'go', id + '.' + c.id + '.go'); if (c.go.online) check(c.go.online, 'online', id + '.' + c.id + '.online');
      const C = { slug: c.id, name: c.name, label: c.label, visit_mode: c.go.mode, ready_at_home: !!c.ready, no_docs_text: c.noDocs || null, note: c.note || null,
        full_list_url: c.fullList ? c.fullList.href : null, full_list_text: c.fullListText || null, tool: c.tool || null, sort_order: ci + 1,
        fair_margin: null, high_margin: null, rules: [] };
      if (c.band) { const b = c.band({}); C.fair_margin = b.f - b.o; C.high_margin = b.h - b.o; C.band_check = b; }
      const R = r => C.rules.push(Object.assign({ key: null, group_label: null, value: null, amount: null, amount_max: null, notes: null, optional: false, my_doc: null }, r));
      // Documents. A "pick one" group becomes one row per option, all sharing the group's label.
      c.items.forEach(it => {
        check(it, 'item', id + '.' + c.id + '.' + it.id);
        if (it.pick) it.pick.forEach(o => { check(o, 'item', id + '.' + c.id + '.' + it.id + '.' + o.id); R({ type: 'document', key: it.id + ':' + o.id, group_label: it.label, label: o.label, notes: o.note || null, my_doc: o.doc || null }); });
        else R({ type: 'document', key: it.id, label: it.label, notes: it.note || null, optional: !!it.optional, my_doc: it.doc || null });
      });
      // Fees. Passport and the tax return depend on choices people make, so every choice gets its own row.
      let fee;
      if (t.paysel === 'passport') {
        const caseId = c.id, tatkal = caseId === 'tatkal';
        [['base_36', { pages: '36', age: 'adult' }], ['base_60', { pages: '60', age: 'adult' }], ['base_u18', { age: 'u18' }]].forEach(([k, sel]) => {
          const l = passportFee(caseId, sel).lines[0]; R(Object.assign({ type: 'fee', key: k, label: l[0] }, money(l[1])));
        });
        if (caseId === 'first') R({ type: 'fee', key: 'discount_pct', label: 'First passport, under 8 or 60 and over', value: '10% off normal fee', amount: 10 });
        fee = passportFee(caseId, { age: 'u18' });   // the under-18 run includes every note
        fee.notes.forEach(n => R({ type: 'fee_note', key: n.startsWith('Applicants under 18') ? 'minor_only' : null, label: n }));
      } else if (t.paysel === 'itr') {
        const f0 = c.fee({ income: 'upto5' });
        R(Object.assign({ type: 'fee', key: 'filing', label: f0.lines[0][0] }, money(f0.lines[0][1])));
        ITR_INCOME.forEach(inc => { const l = c.fee({ income: inc.id }).lines[1]; R(Object.assign({ type: 'fee', key: 'late_' + inc.id, group_label: inc.label, label: l[0] }, money(l[1]))); });
        f0.notes.forEach(n => R({ type: 'fee_note', label: n }));
      } else {
        fee = c.fee({});
        fee.lines.forEach(([l, a]) => R(Object.assign({ type: 'fee', label: l }, money(a))));
        (fee.notes || []).forEach(n => R({ type: 'fee_note', label: n }));
        if (fee.total) R({ type: 'fee_note', key: 'total', label: fee.total });
        if (fee.short) R({ type: 'fee_note', key: 'short', label: fee.short });
        if (fee.headline) R({ type: 'fee_note', key: 'headline', label: fee.headline[0], value: fee.headline[1] });
        if (fee.check) R({ type: 'link', key: 'fee_check', label: fee.check.text, value: fee.check.href });
        const extra = Object.keys(fee).filter(k => !['lines', 'notes', 'total', 'short', 'headline', 'check'].includes(k)); if (extra.length) unknown.push(id + '.' + c.id + '.fee: ' + extra);
      }
      // When and how to go
      const g = c.go;
      if (g.summary) R({ type: 'timing', key: 'summary', label: g.summary.short, value: g.summary.lines[0], notes: g.summary.lines[1] || null });
      if (g.online) {
        if (g.online.title) R({ type: 'timing', key: 'online_title', label: g.online.title });
        R({ type: 'timing', key: 'online_text', label: g.online.text });
        if (g.online.time) R({ type: 'timing', key: 'online_time', label: g.online.time });
        g.online.links.forEach(l => R({ type: 'link', key: 'online', label: l.text, value: l.href }));
      }
      if (g.note) R({ type: 'timing', key: 'visit_note', label: g.note });
      c.steps.forEach(s => R({ type: 'step', label: s }));
      c.watch.forEach(w => R({ type: 'tip', label: w }));
      T.cases.push(C);
    });
    out.tasks.push(T);
  });
  OFFICE_IDS.forEach((id, i) => {
    const o = OFFICES[id]; check(o, 'office', id);
    out.offices.push({ slug: id, name: o.name, short_name: o.short, office_type: o.type, area: o.area, address: o.address, hours: o.hours,
      open_days: o.days.slice(), opens_at: hhmm(o.open), closes_at: hhmm(o.close), how_to_visit: o.how, notice: o.notice || null, notice_short: o.noticeShort || null,
      task: o.task, sort_order: i + 1 });
  });
  // The site's own fee totals for every choice, so the test can prove the database gives the same answers.
  out.totals = {};
  TASK_IDS.forEach(id => TASKS[id].cases.forEach(c => {
    const sels = TASKS[id].paysel === 'passport' ? [{ pages: '36', age: 'adult' }, { pages: '60', age: 'adult' }, { pages: '36', age: 'u18' }, { pages: '36', age: 'u8' }, { pages: '60', age: 'senior' }, { pages: '36', age: 'senior' }]
      : TASKS[id].paysel === 'itr' ? ITR_INCOME.map(x => ({ income: x.id })) : [{}];
    sels.forEach(s => { out.totals[id + '.' + c.id + JSON.stringify(s)] = feeTotal(c.fee(s)); });
  }));
  out.translations = { hi: I18N.hi.exact, kn: I18N.kn.exact };
  return out;
})()
"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "#home"); pg.wait_for_timeout(600)
    data = pg.evaluate(JS)
    # The "All official fees" table on Fair price, read from the page itself.
    pg.goto(URL + "#fair-price"); pg.wait_for_timeout(800)
    data["price_list"] = pg.evaluate("""[...document.querySelectorAll('.feetable')].map(t => ({ caption: t.querySelector('caption').textContent,
      rows: [...t.querySelectorAll('tbody tr')].map(r => [...r.children].map(td => td.textContent)) }))""")
    b.close()
if errs: print("page errors:", errs)
json.dump(data, open("test/extracted.json", "w"), ensure_ascii=False, indent=1)
n = sum(len(c["rules"]) for t in data["tasks"] for c in t["cases"])
print("tasks", len(data["tasks"]), "cases", sum(len(t["cases"]) for t in data["tasks"]), "case rules", n, "offices", len(data["offices"]),
      "price-list tables", len(data["price_list"]), "unknown fields:", data["unknown"] or "none")
