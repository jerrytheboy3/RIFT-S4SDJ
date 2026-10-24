import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for lang in ["hi", "kn"]:
        for vw in [(1440, 900), (390, 844)]:
            mob = vw[0] < 768
            ctx = b.new_context(viewport={"width":vw[0],"height":vw[1]}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
            pg = ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(URL + "#home"); pg.wait_for_timeout(500)
            pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(2500)
            tag = lang + ("m" if mob else "d")
            pg.screenshot(path=f"shots10/{tag}_home.png")
            for r in ["#guides", "#passport.first.bring", "#aadhaar.address.go", "#documents", "#fair-price"]:
                pg.goto(URL + "#about"); pg.wait_for_timeout(80); pg.goto(URL + r); pg.wait_for_timeout(1600)
                pg.screenshot(path=f"shots10/{tag}_{r[1:].replace('.', '_')}.png")
            over = pg.evaluate("document.documentElement.scrollWidth - visualViewport.width")
            print(tag, "overflow", over, "errors", errs, "misses", len(pg.evaluate("[...I18n.misses]")))
            ctx.close()
    b.close()
