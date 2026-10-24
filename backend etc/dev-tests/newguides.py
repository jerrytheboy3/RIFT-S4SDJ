import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
OUT = sys.argv[2]
routes = []
for k in ["dl.learner", "dl.test", "voter.new", "voter.shift", "eduloan.apply"]:
    for s in ["bring", "go", "pay", "steps", "ticket"]:
        routes.append(k + "." + s)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for vw, tag in [((1440, 900), "d"), ((390, 844), "m")]:
        mob = vw[0] < 768
        ctx = b.new_context(viewport={"width":vw[0],"height":vw[1]}, is_mobile=mob, has_touch=mob, device_scale_factor=1 if not mob else 2)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        for r in ["#dl", "#voter", "#eduloan"] + ["#" + r for r in routes]:
            pg.goto(URL + "#about"); pg.wait_for_timeout(120); pg.goto(URL + r); pg.wait_for_timeout(450)
            h = pg.evaluate("(document.querySelector('#sec-h')||document.querySelector('#page-h')||{}).textContent||''")
            over = pg.evaluate("document.documentElement.scrollWidth - (window.visualViewport ? visualViewport.width : innerWidth)")
            bad = pg.evaluate("[...document.querySelectorAll('main *')].filter(e => /undefined|NaN|\\[object/.test(e.childNodes.length && [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''))).length")
            if over > 1 or bad or not h: print(tag, r, "| heading:", h[:30], "| overflow:", over, "| bad text:", bad)
        for r in ["#dl.test.go", "#voter.new.go", "#eduloan.apply.pay", "#eduloan.apply.steps", "#guides", "#home"]:
            pg.goto(URL + "#about"); pg.wait_for_timeout(120); pg.goto(URL + r); pg.wait_for_timeout(1200)
            pg.screenshot(path=f"{OUT}/{tag}_{r[1:].replace('.', '_')}.png", full_page=False)
        print(tag, "errors:", errs)
        ctx.close()
    b.close()
