import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
OUT = sys.argv[2] if len(sys.argv) > 2 else "shots13"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, color_scheme=sys.argv[3] if len(sys.argv) > 3 else "light")
    pg = ctx.new_page(); pg.goto(URL + "#home"); pg.wait_for_timeout(2500)
    H = pg.evaluate("document.documentElement.scrollHeight"); y = 0; i = 0
    while y < H:
        pg.evaluate(f"window.scrollTo(0, {y})"); pg.wait_for_timeout(1400)
        pg.screenshot(path=f"{OUT}/home_{i:02d}.png", scale="css"); i += 1; y += 820
    print("height", H, "shots", i)
    b.close()
