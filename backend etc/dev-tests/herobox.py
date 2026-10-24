import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30#home"
OUT = sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for scheme in ["dark", "light"]:
        pg = b.new_page(viewport={"width":1440,"height":900}, color_scheme=scheme)
        pg.goto(URL); pg.wait_for_timeout(2200)
        pg.mouse.move(300, 300); pg.mouse.move(720, 330, steps=20); pg.wait_for_timeout(500)
        pg.screenshot(path=f"{OUT}/hero_{scheme}.png")
        pg.close()
    b.close()
