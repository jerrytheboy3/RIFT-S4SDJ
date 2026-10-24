import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
OUT = sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True); errs = []
    for scheme in ["light", "dark"]:
        pg = b.new_page(viewport={"width":1440,"height":900}, color_scheme=scheme)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + "#home"); pg.wait_for_timeout(2200)
        pg.screenshot(path=f"{OUT}/o_{scheme}_home.png")
        board = pg.evaluate("document.getElementById('board-h').getBoundingClientRect().top + scrollY")
        for i in range(10): pg.mouse.wheel(0, (board - 120) / 10); pg.wait_for_timeout(40)
        pg.wait_for_timeout(1500); pg.screenshot(path=f"{OUT}/o_{scheme}_bento.png")
        pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{OUT}/o_{scheme}_footer.png")
        pg.goto(URL + "#guides"); pg.wait_for_timeout(300); pg.goto(URL + "#fair-price"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{OUT}/o_{scheme}_fair.png")
        pg.close()
    print("errors:", errs); b.close()
