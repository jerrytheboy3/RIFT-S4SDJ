"""Step 4 checks: the database version of the site shows exactly what the old built-in version showed,
every fee and document has a source line, a fee changed in the database shows up live, and failures are handled.
Usage: db_site.py OLD.html NEW.html UNCONFIGURED.html"""
import sys, pathlib, json, subprocess, urllib.request
from playwright.sync_api import sync_playwright
OLD, NEW, BARE = (pathlib.Path(a).resolve().as_uri() for a in sys.argv[1:4])
Q = "?now=2026-10-22T10:05:00%2B05:30"
HERE = pathlib.Path(__file__).resolve().parent.parent
PSQL = str(HERE / "pgx/pgserver/pginstall/bin/psql")
MOCK = "http://127.0.0.1:54321"
res = []
def check(name, ok, info=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> " + str(info)[:900]))
def sql(q): subprocess.run([PSQL, "-h", "/tmp/claude-501/pgs", "-U", "postgres", "-X", "-q", "-d", "bgp", "-c", q], check=True, capture_output=True)
def mock(path): urllib.request.urlopen(urllib.request.Request(MOCK + path, method="POST")).read()
TEXT = "(() => { const m = document.getElementById('main').cloneNode(true); m.querySelectorAll('.src').forEach(e => e.remove()); return m.innerText.replace(/\\s+/g, ' ').trim(); })()"
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    ctx = br.new_context(viewport={"width": 1440, "height": 900})
    old, new = ctx.new_page(), ctx.new_page()
    errs = []
    new.on("pageerror", lambda e: errs.append(str(e)))
    calls = []
    new.on("request", lambda r: calls.append((r.url, r.headers.get("apikey"), r.headers.get("authorization"))) if "/rest/v1/" in r.url else None)
    new.goto(NEW + Q + "#home"); new.wait_for_timeout(900)
    check("site loads its data with 6 requests to the REST API", len(calls) == 6 and {c[0].split("/rest/v1/")[1].split("?")[0] for c in calls} == {"tasks", "cases", "rules", "offices", "office_tasks", "translations"}, calls)
    check("every request sends the publishable key in the apikey header only (no Bearer token)", all(c[1] == "sb_publishable_test" and c[2] is None for c in calls), calls[:1])
    old.goto(OLD + Q + "#home"); old.wait_for_timeout(500)
    keys = new.evaluate("TASK_IDS.flatMap(id => TASKS[id].cases.map(c => id + '.' + c.id))")
    routes = ["#home", "#guides", "#best-time", "#fair-price", "#tickets", "#about"] + ["#best-time." + o for o in new.evaluate("OFFICE_IDS")]
    for k in keys: routes += ["#" + k + "." + s for s in ["bring", "go", "pay", "steps", "ticket"]]
    diffs = []
    for r in routes:
        for pg in (old, new):
            pg.goto((OLD if pg is old else NEW) + Q + "#about"); pg.goto((OLD if pg is old else NEW) + Q + r); pg.wait_for_timeout(250)
        a, b = old.evaluate(TEXT), new.evaluate(TEXT)
        if a != b:
            i = next((n for n in range(min(len(a), len(b))) if a[n] != b[n]), min(len(a), len(b)))
            diffs.append((r, a[max(0, i - 60):i + 80], b[max(0, i - 60):i + 80]))
    check("all %d pages read exactly the same as before (ignoring the new source lines)" % len(routes), not diffs, diffs[:3])
    # Passport and tax choices give the same fees
    for t, sels in [("passport", [("#pp-pages", "60"), ("#pp-age", "senior"), ("#pp-age", "u8")]), ("itr", [("#pi-inc", "below"), ("#pi-inc", "above5")])]:
        case = "first" if t == "passport" else "belated"
        bad = []
        for sel, val in sels:
            vals = []
            for pg, base in ((old, OLD), (new, NEW)):
                pg.goto(base + Q + "#" + t + "." + case + ".pay"); pg.wait_for_timeout(250)
                pg.select_option(sel, val); pg.wait_for_timeout(250)
                vals.append(pg.evaluate(TEXT))
            if vals[0] != vals[1]: bad.append((sel, val))
        check("%s fee choices give the same amounts" % t, not bad, bad)
    # Source lines
    cov = new.evaluate("""(() => {
      const out = { docs: 0, docsWithSrc: 0, fees: 0, feesWithSrc: 0, bad: [] };
      return out; })()""")
    missing = []
    total_docs = total_fees = 0
    for k in keys:
        new.goto(NEW + Q + "#" + k + ".bring"); new.wait_for_timeout(200)
        r = new.evaluate("""(() => { const out = []; let n = 0;
          document.querySelectorAll('.checklist > .ck').forEach(el => { n++; if (!el.querySelector('.src')) out.push(el.innerText.slice(0, 40)); });
          document.querySelectorAll('.checklist > .grp').forEach(g => { g.querySelectorAll('.ck').forEach(el => { n++; if (!g.querySelector(':scope > .src') && !el.querySelector('.src')) out.push(el.innerText.slice(0, 40)); }); });
          return [n, out]; })()""")
        total_docs += r[0]; missing += [(k, x) for x in r[1]]
        new.goto(NEW + Q + "#" + k + ".pay"); new.wait_for_timeout(200)
        r = new.evaluate("[document.querySelectorAll('.fees .fee').length, [...document.querySelectorAll('.fees .fee')].filter(f => !f.querySelector('.src')).map(f => f.innerText.slice(0, 40))]")
        total_fees += r[0]; missing += [(k, x) for x in r[1]]
    check("all %d documents and %d fee lines show where they come from" % (total_docs, total_fees), not missing and total_docs > 90 and total_fees >= 17, missing[:5])
    new.goto(NEW + Q + "#aadhaar.address.pay"); new.wait_for_timeout(300)
    src = new.evaluate("[...document.querySelector('.fees .fee .src').querySelectorAll('a, .src-on')].map(e => [e.tagName, e.textContent, e.getAttribute('href'), e.getAttribute('target')])")
    check("fee source line: link to uidai.gov.in, 'Verified on 16 Oct 2026'", src[0][1].startswith("uidai.gov.in") and src[0][2] == "https://uidai.gov.in" and src[0][3] == "_blank" and src[1][1] == "Verified on 16 Oct 2026", src)
    new.goto(NEW + Q + "#fair-price"); new.wait_for_timeout(300)
    rows = new.evaluate("[document.querySelectorAll('.feetable tbody tr').length, document.querySelectorAll('.feetable tbody tr td:first-child .src').length]")
    check("Fair price table: every one of %d rows shows its source" % rows[0], rows[0] == rows[1] and rows[0] > 15, rows)
    new.goto(NEW + Q + "#dl.learner.pay"); new.wait_for_timeout(300)
    check("driving licence: 'check on Sarathi' notice and 'Verified on 20 Oct 2026'", "Sarathi" in new.inner_text("#main") and "Verified on 20 Oct 2026" in new.inner_text(".fees"))
    # Ticking a document still works and is still saved under the same name
    new.goto(NEW + Q + "#aadhaar.address.bring"); new.wait_for_timeout(300)
    new.click("label[for='ck-aadhaar-address-poa-utility']"); new.wait_for_timeout(200)
    st = json.loads(new.evaluate("localStorage.getItem('bgp.v1')"))
    check("ticks are saved under the same names as before (poa:utility)", st["ticks"].get("aadhaar.address", {}).get("poa:utility") is True, st["ticks"])
    # Change a fee in the database: no code change, no rebuild
    sql("update rules set amount = 80, value = '₹80' where type = 'fee' and label = 'Demographic update, address'")
    mock("/__reset")
    new.goto(NEW + Q + "#about"); new.reload(); new.goto(NEW + Q + "#aadhaar.address.pay")
    for _ in range(40):
        if "₹80" in new.inner_text("#pay-answer"): break
        new.wait_for_timeout(100)
    pay = new.inner_text("#pay-answer")
    new.goto(NEW + Q + "#home"); new.wait_for_timeout(600)
    tick = new.inner_text(".ticker .sr-only")
    check("a fee changed in the database shows on the site after a reload (₹75 → ₹80)", "₹80" in pay and "Aadhaar address update ₹80" in tick, (pay, tick[:80]))
    sql("update rules set amount = 75, value = '₹75' where type = 'fee' and label = 'Demographic update, address'"); mock("/__reset")
    # Translations come from the database too
    sql("update translations set hi = 'आधार अपडेट (डेटाबेस से)' where en = 'Aadhaar update'"); mock("/__reset")
    new.goto(NEW + Q + "#home"); new.wait_for_timeout(400); new.evaluate("setLang('hi')"); new.wait_for_timeout(400)
    new.goto(NEW + Q + "#aadhaar.address.pay"); new.reload()
    for _ in range(40):
        if "आधार अपडेट (डेटाबेस से)" in new.inner_text("#main"): break
        new.wait_for_timeout(100)
    new.wait_for_timeout(300)
    hi_text = new.inner_text("#main")
    check("Hindi text comes from the database's translations table", "आधार अपडेट (डेटाबेस से)" in hi_text, hi_text[:120])
    check("'Verified on' is translated too", "को जाँचा गया" in new.inner_text(".fees"), new.inner_text(".fees")[:200])
    check("no untranslated text on a Hindi guide page", not new.evaluate("[...I18n.misses]"), new.evaluate("[...I18n.misses]"))
    new.evaluate("setLang('en')"); sql("update translations set hi = 'आधार अपडेट' where en = 'Aadhaar update'"); mock("/__reset")
    # When the database can't be reached
    mock("/__fail/on")
    new.evaluate("localStorage.removeItem('bgp.data.v1')")   # no saved copy: this is the case that shows the error screen
    new.goto(NEW + Q + "#guides"); new.reload()
    try: new.wait_for_selector('[data-act="retry-data"]', timeout=6000)
    except Exception: pass
    check("database down: after 3 tries, a clear message and a Try again button", "Couldn’t load the guides" in new.inner_text("#main") and new.locator('[data-act="retry-data"]').count() == 1, new.inner_text("#main")[:120])
    mock("/__fail/off")
    new.click('[data-act="retry-data"]'); new.wait_for_timeout(900)
    check("Try again loads the page once the database is back", new.locator(".brow").count() == 8, new.inner_text("#main")[:100])
    # Not configured, or the wrong key
    bare = ctx.new_page(); bare.goto(BARE + Q + "#home"); bare.wait_for_timeout(500)
    check("a build without the Supabase settings says so", "Not connected to the database yet" in bare.inner_text("#main"), bare.inner_text("#main")[:120])
    check("no errors", not errs, errs)
    ctx.close(); br.close()
print(f"{sum(res)}/{len(res)} passed")
