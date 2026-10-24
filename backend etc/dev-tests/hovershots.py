"""Hover, press and theme-change states, captured mid-effect for a visual check."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
OUT = pathlib.Path("shots12"); OUT.mkdir(exist_ok=True)
def clip(pg, sel, pad=24):
    b = pg.locator(sel).first.bounding_box()
    return {"x": max(0, b["x"] - pad), "y": max(0, b["y"] - pad), "width": b["width"] + pad * 2, "height": b["height"] + pad * 2}
def hover_at(pg, sel, fx, fy):
    b = pg.locator(sel).first.bounding_box()
    pg.mouse.move(b["x"] + b["width"] * fx - 30, b["y"] + b["height"] * fy - 20)
    pg.mouse.move(b["x"] + b["width"] * fx, b["y"] + b["height"] * fy, steps=6)
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    for theme in ["light", "dark"]:
        ctx = br.new_context(viewport={"width": 1440, "height": 900}, color_scheme=theme)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + "#guides"); pg.wait_for_timeout(1500)
        hover_at(pg, ".brow >> nth=1", 0.8, 0.25); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f"{theme}_brow.png"), clip=clip(pg, ".brow >> nth=1"))
        hover_at(pg, ".mainnav a >> nth=2", 0.5, 0.5); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f"{theme}_nav.png"), clip={"x": 160, "y": 0, "width": 1120, "height": 70})
        pg.goto(URL + "#best-time"); pg.wait_for_timeout(1500)
        hover_at(pg, ".ocard >> nth=0", 0.15, 0.85); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f"{theme}_ocard.png"), clip=clip(pg, ".ocard >> nth=0"))
        pg.goto(URL + "#about"); pg.wait_for_timeout(1200)
        pg.locator(".sdg-card >> nth=1").scroll_into_view_if_needed(); pg.wait_for_timeout(900)
        hover_at(pg, ".sdg-card >> nth=1", 0.9, 0.1); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f"{theme}_sdg.png"), clip=clip(pg, ".sdg-card >> nth=1"))
        pg.goto(URL + "#documents"); pg.wait_for_timeout(1500)
        hover_at(pg, ".vcard >> nth=0", 0.3, 0.3); pg.wait_for_timeout(500)
        pg.screenshot(path=str(OUT / f"{theme}_vcard.png"), clip=clip(pg, ".vcard >> nth=0"))
        pg.goto(URL + "#aadhaar.address.steps"); pg.wait_for_timeout(1500)
        btn = "#next-d"
        pg.locator(btn).scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        hover_at(pg, btn, 0.3, 0.5); pg.wait_for_timeout(420)
        pg.screenshot(path=str(OUT / f"{theme}_sheen.png"), clip=clip(pg, btn, 40))
        pg.goto(URL + "#home"); pg.wait_for_timeout(1200)
        pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(1500)
        hover_at(pg, ".foot-giant", 0.32, 0.5); pg.wait_for_timeout(1000)
        pg.screenshot(path=str(OUT / f"{theme}_footer.png"))
        print(theme, "errors", errs)
        ctx.close()
    # ripple + theme reveal mid-way
    ctx = br.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
    pg = ctx.new_page()
    pg.goto(URL + "#fair-price"); pg.wait_for_timeout(1500)
    b = pg.locator('[data-act="qcheck"]').first.bounding_box()
    pg.mouse.move(b["x"] + 20, b["y"] + 15); pg.mouse.down(); pg.wait_for_timeout(180)
    pg.screenshot(path=str(OUT / "ripple.png"), clip=clip(pg, '[data-act="qcheck"]', 30)); pg.mouse.up()
    pg.goto(URL + "#guides"); pg.wait_for_timeout(1200)
    t = pg.locator("#tb-theme").bounding_box()
    pg.mouse.click(t["x"] + 22, t["y"] + 22); pg.wait_for_timeout(330)
    pg.screenshot(path=str(OUT / "theme_mid.png"))
    pg.wait_for_timeout(900)
    print("theme now", pg.evaluate("document.documentElement.dataset.theme"), "vt class left", pg.evaluate("document.documentElement.classList.contains('vt-theme')"))
    pg.goto(URL + "#about"); pg.wait_for_timeout(800)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.45)"); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / "totop.png"), clip={"x": 1340, "y": 800, "width": 100, "height": 100})
    ctx.close()
    br.close()
