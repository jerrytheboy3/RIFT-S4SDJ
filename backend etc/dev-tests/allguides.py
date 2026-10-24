import sys, pathlib, json
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
ok = fail = 0
def check(name, cond, extra=""):
    global ok, fail
    if cond: ok += 1
    else: fail += 1; print("FAIL", name, extra)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for vw in [(1440, 900), (390, 844)]:
        mob = vw[0] < 768
        ctx = b.new_context(viewport={"width":vw[0],"height":vw[1]}, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL + "#home"); pg.wait_for_timeout(600)
        keys = pg.evaluate("TASK_IDS.flatMap(id => TASKS[id].cases.map(c => id + '.' + c.id))")
        check("8 guides", pg.evaluate("TASK_IDS.length") == 8)
        for k in keys:
            for s in ["bring", "go", "pay", "steps", "ticket"]:
                pg.goto(URL + "#about"); pg.wait_for_timeout(60); pg.goto(URL + "#" + k + "." + s); pg.wait_for_timeout(260)
                h = pg.evaluate("(document.getElementById('sec-h')||{}).textContent||''")
                over = pg.evaluate("document.documentElement.scrollWidth - (window.visualViewport ? visualViewport.width : innerWidth)")
                bad = pg.evaluate("/undefined|NaN|\\[object Object\\]/.test(document.getElementById('main').innerText)")
                check(f"{vw[0]} {k}.{s}", h.strip().lower() == s and over <= 1 and not bad, f"h={h!r} over={over} bad={bad}")
        # home and guides list show all 8
        pg.goto(URL + "#about"); pg.wait_for_timeout(60); pg.goto(URL + "#guides"); pg.wait_for_timeout(400)
        check(f"{vw[0]} guides list 8", pg.evaluate("document.querySelectorAll('.bento > li').length") == 8)
        pg.click("#gf-money"); pg.wait_for_timeout(300)
        check(f"{vw[0]} filter money", pg.evaluate("[...document.querySelectorAll('.bento a')].map(a => a.getAttribute('href'))") == ["#rent", "#itr", "#eduloan"])
        pg.click("#gf-online"); pg.wait_for_timeout(300)
        online = pg.evaluate("[...document.querySelectorAll('.bento a')].map(a => a.getAttribute('href'))")
        check(f"{vw[0]} filter online", "#dl" not in online and "#voter" in online and "#pan" in online, str(online))
        pg.click("#gf-all"); pg.wait_for_timeout(300)
        pg.goto(URL + "#about"); pg.wait_for_timeout(60); pg.goto(URL + "#home"); pg.wait_for_timeout(500)
        check(f"{vw[0]} home bento 8", pg.evaluate("document.querySelectorAll('.bento > li').length") == 8)
        check(f"{vw[0]} footer guides 8", pg.evaluate("document.querySelectorAll('#footer-guides li').length") == 8)
        check(f"{vw[0]} dock 8 guides", pg.evaluate("document.querySelectorAll('#dock .dock-i:not(.dock-x)').length") == 8)
        print(vw[0], "errors:", errs)
        ctx.close()
    # tools, search, copy list (desktop)
    ctx = b.new_context(viewport={"width":1440,"height":900}); ctx.grant_permissions(["clipboard-read", "clipboard-write"])
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "#dl.test.go"); pg.wait_for_timeout(500)
    pg.fill("#ll-date", "2026-10-01"); pg.wait_for_timeout(150)
    t = pg.inner_text("#ll-out")
    check("LL from 31 Oct", "31 Oct 2026" in t and "1 Apr 2027" in t and "from" in t, t)
    pg.fill("#ll-date", "2026-08-01"); pg.wait_for_timeout(150)
    check("LL book now", "book the driving test now" in pg.inner_text("#ll-out"))
    pg.fill("#ll-date", "2026-01-10"); pg.wait_for_timeout(150)
    check("LL expired", "run out" in pg.inner_text("#ll-out"))
    pg.goto(URL + "#voter.new.go"); pg.wait_for_timeout(500)
    pg.fill("#qual-date", "2009-02-15"); pg.wait_for_timeout(150)
    t = pg.inner_text("#qual-out")
    check("voter 17 advance", "apply in advance now" in t and "1 Apr 2027" in t, t)
    pg.fill("#qual-date", "2010-12-31"); pg.wait_for_timeout(150)
    t = pg.inner_text("#qual-out")
    check("voter not yet 17", "31 Dec 2027" in t and "1 Jan 2029" in t, t)
    pg.fill("#qual-date", "2000-01-01"); pg.wait_for_timeout(150)
    check("voter adult", "18 or over" in pg.inner_text("#qual-out"))
    check("dob not saved", "2000-01-01" not in pg.evaluate("localStorage.getItem('bgp.v1') || ''"))
    pg.goto(URL + "#eduloan.apply.pay"); pg.wait_for_timeout(500)
    pg.fill("#emi-amt", "500000"); pg.fill("#emi-rate", "10"); pg.fill("#emi-yrs", "10"); pg.wait_for_timeout(150)
    t = pg.inner_text("#emi-out")
    check("EMI 6,608", "₹6,608" in t and "120" in t, t)
    pg.goto(URL + "#dl.learner.bring"); pg.wait_for_timeout(500)
    pg.click("#copylist-btn"); pg.wait_for_timeout(300)
    clip = pg.evaluate("navigator.clipboard.readText()")
    check("copy list", "Driving licence" in clip and "[ ] Proof of age" in clip, clip[:120])
    for q, want in [("voter", "voter."), ("llr", "dl.learner"), ("driving licence", "dl."), ("education loan", "eduloan."), ("80e", "eduloan."), ("form 6", "voter.new"), ("aadhaar address", "aadhaar.address")]:
        res = pg.evaluate("q => searchAll(q).map(r => r.key || '')", q)
        check("search " + q, any(r.startswith(want) for r in (res or [])[:3]), str(res[:3] if res else res))
    pg.goto(URL + "#pan.instant.pay"); pg.wait_for_timeout(400)
    check("original pay intact", pg.inner_text("#pay-answer").startswith("Free") and "Fees checked 16 Oct 2026" in pg.inner_text("main"))
    pg.goto(URL + "#passport.first.pay"); pg.wait_for_timeout(400)
    check("passport total", "₹2,500" in pg.inner_text(".fee-total"))
    print("tools errors:", errs)
    print(f"\n{ok}/{ok+fail} passed")
    b.close()
