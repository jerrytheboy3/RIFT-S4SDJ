import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
ok = fail = 0
def check(name, cond, extra=""):
    global ok, fail
    if cond: ok += 1
    else: fail += 1; print("FAIL", name, extra)
AD = ".services, .sp-tip, .ad-slot, .ad-label"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for vw in [(1440, 900), (390, 844)]:
        mob = vw[0] < 768
        ctx = b.new_context(viewport={"width": vw[0], "height": vw[1]}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        def go(h, w=500):
            pg.goto(URL + "#about"); pg.wait_for_timeout(60); pg.goto(URL + h); pg.wait_for_timeout(w)
        tag = "m" if mob else "d"
        keys = pg.evaluate("TASK_IDS.flatMap(id => TASKS[id].cases.map(c => id + '.' + c.id))") if False else None
        go("#home", 800)
        keys = pg.evaluate("TASK_IDS.flatMap(id => TASKS[id].cases.map(c => id + '.' + c.id))")
        for k in keys:
            for s in ["bring", "go", "pay"]:
                go("#" + k + "." + s, 250)
                check(f"{tag} {k}.{s} ad-free", pg.locator("main " + AD).count() == 0)
            go("#" + k + ".steps", 300)
            n = pg.locator(".services .pcard").count()
            check(f"{tag} {k} services", 2 <= n <= 4 and pg.locator(".services .ad-label").count() == n + 1, str(n))
            check(f"{tag} {k} after core", pg.evaluate("(() => { const s = document.querySelector('.services'); const w = document.querySelector('.watch'); return !!s && !!w && (w.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; })()"))
            go("#" + k + ".ticket", 900)
            tid = k.split(".")[0]
            check(f"{tag} {k} tip", pg.locator(".sp-tip").count() == (0 if tid == "itr" else 1))
        # contextual: passport services change with office
        go("#passport.first.steps", 400)
        lal = pg.evaluate("[...document.querySelectorAll('.pcard h4')].map(h => h.textContent)")
        pg.evaluate("S.office.passport = 'psk-whitefield'; save()"); go("#passport.first.steps", 400)
        wf = pg.evaluate("[...document.querySelectorAll('.pcard h4')].map(h => h.textContent)")
        check(f"{tag} contextual office", lal != wf and "Chitra Photo Corner" in lal and "EPIP Snap Studio" in wf, str((lal, wf)))
        pg.evaluate("S.office.passport = 'psk-lalbagh'; save()"); go("#passport.first.steps", 500)
        pg.locator(".services").scroll_into_view_if_needed(); pg.wait_for_timeout(900)
        pg.screenshot(path=f"shots9/ad_{tag}_services.png")
        pg.click(".pcard-btn >> nth=0"); pg.wait_for_timeout(400)
        check(f"{tag} book confirm", "Request sent" in pg.inner_text(".pcard-btn >> nth=0") and "Demo only" in pg.inner_text("#toasts"))
        pg.screenshot(path=f"shots9/ad_{tag}_booked.png")
        go("#passport.first.ticket", 1500); pg.locator(".sp-tip").scroll_into_view_if_needed(); pg.wait_for_timeout(500)
        pg.screenshot(path=f"shots9/ad_{tag}_tip.png")
        go("#home", 900)
        check(f"{tag} home slot", pg.locator(".ad-slot .ad-label").inner_text().strip().lower() == "ad")
        pg.evaluate("document.querySelector('.ad-slot').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"shots9/ad_{tag}_home.png")
        # toggle off
        pg.evaluate("S.settings.ads = 'off'; save()")
        go("#home", 600); check(f"{tag} off home", pg.locator(AD).count() == 0)
        go("#passport.first.steps", 400); check(f"{tag} off steps", pg.locator(AD).count() == 0)
        go("#passport.first.ticket", 600); check(f"{tag} off ticket", pg.locator(AD).count() == 0)
        pg.evaluate("S.settings.ads = 'on'; save()")
        over = pg.evaluate("document.documentElement.scrollWidth - visualViewport.width")
        check(f"{tag} no overflow", over <= 1, str(over))
        print(tag, "errors:", errs)
        ctx.close()
    print(f"{ok}/{ok+fail} passed")
    b.close()
