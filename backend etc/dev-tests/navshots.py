import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for lang, w, h, route, name in [("en", 900, 700, "#documents", "en900"), ("kn", 1440, 700, "#about", "kn1440"), ("hi", 768, 1024, "#aadhaar.address.go", "hi768")]:
        ctx = b.new_context(viewport={"width": w, "height": h}); pg = ctx.new_page()
        pg.goto(URL + "#home"); pg.wait_for_timeout(400); pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(400)
        pg.goto(URL + route); pg.wait_for_timeout(1800)
        if name == "hi768": pg.evaluate("document.querySelector('.led').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"shots11/{name}.png", clip={"x":0,"y":0,"width":w,"height":90} if name != "hi768" else None)
        ctx.close()
    b.close()
