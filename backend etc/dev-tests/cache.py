"""Step 5 checks: the saved copy in localStorage, the loading state, slow and missing networks."""
import sys, pathlib, json, subprocess, urllib.request, time
from playwright.sync_api import sync_playwright
NEW = pathlib.Path(sys.argv[1]).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
HERE = pathlib.Path(__file__).resolve().parent.parent
PSQL = str(HERE / "pgx/pgserver/pginstall/bin/psql")
res = []
def check(name, ok, info=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> " + str(info)[:600]))
def mock(path): urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:54321" + path, method="POST")).read()
def sql(q): subprocess.run([PSQL, "-h", "/tmp/claude-501/pgs", "-U", "postgres", "-X", "-q", "-d", "bgp", "-c", q], check=True, capture_output=True)
def wait_text(pg, sel, text, ms=6000):
    end = time.time() + ms / 1000
    while time.time() < end:
        try:
            if text in pg.inner_text(sel, timeout=200): return True
        except Exception: pass
        pg.wait_for_timeout(100)
    return False
FEE = "update rules set amount = {0}, value = '₹{0}' where type = 'fee' and label = 'Demographic update, address'"
mock("/__fail/off"); mock("/__delay/0"); mock("/__reset")
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    errs = []
    def page(ctx):
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); return pg
    # A. First visit
    ctx = br.new_context(viewport={"width": 1440, "height": 900}); pg = page(ctx)
    calls = []; pg.on("request", lambda r: calls.append(r.url) if "/rest/v1/" in r.url else None)
    pg.goto(NEW + "#aadhaar.address.pay"); pg.wait_for_selector(".fees", timeout=6000)
    raw = pg.evaluate("localStorage.getItem('bgp.data.v1')") or ""
    c = json.loads(raw) if raw else {}
    check("first visit saves a copy of all 6 tables in localStorage (%d KB)" % (len(raw.encode()) // 1024),
          set(c.get("db", {})) == {"tasks", "cases", "rules", "offices", "office_tasks", "translations"} and c.get("url") == "http://127.0.0.1:54321" and bool(c.get("savedAt")), list(c)[:5])
    # B. Server down, with a saved copy
    mock("/__fail/on"); calls.clear()
    pg.reload(); pg.wait_for_timeout(300)
    shown = pg.locator(".fees").count() == 1 and pg.locator(".ds-spin").count() == 0
    check("server down: the saved copy shows at once, no spinner", shown, pg.inner_text("#main")[:100])
    ok = wait_text(pg, "#data-note", "Can’t reach the server. Showing the guides saved on")
    note = pg.inner_text("#data-note") if ok else ""
    check("server down: a bar says it's the saved copy and when it was saved", ok and " at " in note and "Try again" in note, note)
    mock("/__fail/off")
    pg.click('#data-note [data-act="retry-data"]')
    end = time.time() + 5
    while time.time() < end and pg.evaluate("!document.getElementById('data-note').hidden"): pg.wait_for_timeout(100)
    check("Try again in the bar: it disappears once the server answers", pg.evaluate("document.getElementById('data-note').hidden"))
    check("nothing changed, so no 'Updated' message", "Updated with the latest" not in (pg.inner_text("#toasts") or ""))
    # C. Slow network, with a saved copy
    mock("/__delay/3000")
    t0 = time.time(); pg.reload(); pg.wait_for_selector(".fees", timeout=6000); first = time.time() - t0
    check("slow network (3 s): the page shows from the saved copy in %.1f s, without waiting" % first, first < 1.5 and pg.locator(".ds-spin").count() == 0, first)
    pg.wait_for_timeout(3500); mock("/__delay/0")
    # D. Slow network, first visit: spinner, then the page; a hint if it's very slow
    ctx2 = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True); pg2 = page(ctx2)
    mock("/__delay/3000")
    pg2.goto(NEW + "#guides"); pg2.wait_for_timeout(700)
    spin = pg2.locator(".data-state .ds-spin").count() == 1 and "Loading the guides" in pg2.inner_text("#main")
    check("first visit on a slow network: a spinner and 'Loading the guides…'", spin, pg2.inner_text("#main")[:80])
    check("the 'slow connection' hint stays hidden at first", pg2.evaluate("document.querySelector('.ds-slow').hidden"))
    pg2.wait_for_selector(".brow", timeout=8000)
    check("then the page appears", pg2.locator(".brow").count() == 8)
    ctx2.close()
    ctx3 = br.new_context(viewport={"width": 390, "height": 844}); pg3 = page(ctx3)
    mock("/__delay/9000")
    pg3.goto(NEW + "#guides"); pg3.wait_for_timeout(8600)
    check("after 8 s still loading: 'This is taking longer than usual…'", "This is taking longer than usual" in pg3.inner_text("#main"), pg3.inner_text("#main")[:120])
    mock("/__delay/0"); pg3.wait_for_selector(".brow", timeout=8000)
    ctx3.close()
    # E. A fee changed since the copy was saved
    sql(FEE.format(80)); mock("/__reset")
    pg.reload(); pg.wait_for_selector(".fees", timeout=6000)
    early = pg.inner_text("#pay-answer")
    ok = wait_text(pg, "#pay-answer", "₹80")
    toast = pg.inner_text("#toasts") if ok else ""
    check("a changed fee: the saved ₹75 shows first, then the page updates to ₹80", "₹75" in early and ok, (early, pg.inner_text("#pay-answer")))
    check("... with a short 'Updated with the latest fees and documents.' message", "Updated with the latest fees and documents." in toast, toast)
    check("... and the saved copy now has ₹80", "₹80" in pg.evaluate("localStorage.getItem('bgp.data.v1')"))
    sql(FEE.format(75)); mock("/__reset")
    pg.reload(); wait_text(pg, "#pay-answer", "₹75")
    # F. A damaged copy is ignored
    pg.evaluate("localStorage.setItem('bgp.data.v1', '{not json')"); pg.reload()
    pg.wait_for_selector(".fees", timeout=6000)
    check("a damaged saved copy is ignored and replaced", json.loads(pg.evaluate("localStorage.getItem('bgp.data.v1')")).get("db") is not None)
    # G. A copy saved from a different database is never shown
    fake = json.loads(pg.evaluate("localStorage.getItem('bgp.data.v1')")); fake["url"] = "https://some-other-project.supabase.co"
    for r in fake["db"]["rules"]:
        if r["label"] == "Demographic update, address": r["amount"] = 999; r["value"] = "₹999"
    pg.evaluate("c => localStorage.setItem('bgp.data.v1', c)", json.dumps(fake))
    seen = []
    pg.reload()
    for _ in range(15): seen.append(pg.inner_text("#main") if pg.locator("#main").count() else ""); pg.wait_for_timeout(100)
    check("a copy from a different database is never shown", not any("₹999" in s for s in seen) and "₹75" in pg.inner_text("#pay-answer"))
    # I. The bar in Hindi
    pg.evaluate("setLang('hi')"); pg.wait_for_timeout(300); mock("/__fail/on")
    pg.reload(); ok = wait_text(pg, "#data-note", "सर्वर तक नहीं पहुँच पा रहे")
    check("the bar is in Hindi too", ok, pg.inner_text("#data-note"))
    check("no untranslated text", not pg.evaluate("[...I18n.misses]"), pg.evaluate("[...I18n.misses]"))
    mock("/__fail/off"); pg.evaluate("setLang('en')")
    ctx.close()
    # H. A phone where localStorage is blocked
    ctx4 = br.new_context(); ctx4.add_init_script("Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); };")
    pg4 = page(ctx4); pg4.goto(NEW + "#aadhaar.address.pay")
    try: pg4.wait_for_selector(".fees", timeout=6000); ok = True
    except Exception: ok = False
    check("storage blocked: the site still loads straight from the database", ok)
    ctx4.close()
    check("no errors", not errs, errs)
    br.close()
mock("/__fail/off"); mock("/__delay/0")
print(f"{sum(res)}/{len(res)} passed")
