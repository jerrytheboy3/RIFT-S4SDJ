"""Home fun: hero strokes, task icons mid-action, stat drawings, the paper plane in flight and landed."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
OUT = pathlib.Path("shots14"); OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    for theme, vw in [("light", (1440, 900)), ("dark", (1440, 900)), ("light", (390, 844))]:
        mob = vw[0] < 768
        tag = theme + ("_m" if mob else "")
        ctx = br.new_context(viewport={"width": vw[0], "height": vw[1]}, color_scheme=theme, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + "#home"); pg.wait_for_timeout(3200)
        pg.screenshot(path=str(OUT / f"{tag}_hero.png"), clip={"x": 0, "y": 120, "width": vw[0], "height": 420 if not mob else 360})
        if not mob:
            pg.evaluate("document.querySelector('.bento').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1200)
            for i, nm in [(5, "dl"), (4, "itr"), (7, "edu")]:
                b = pg.locator(".bento .brow").nth(i).bounding_box()
                pg.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, steps=3); pg.wait_for_timeout(330)
                t = pg.locator(".bento .brow").nth(i).locator(".tile").bounding_box()
                pg.screenshot(path=str(OUT / f"{tag}_icon_{nm}.png"), clip={"x": t["x"] - 20, "y": t["y"] - 20, "width": t["width"] + 40, "height": t["height"] + 40})
            pg.mouse.move(5, 5)
        pg.evaluate("document.querySelector('.stat-grid').scrollIntoView({block:'center'})"); pg.wait_for_timeout(2600)
        g = pg.locator(".stat-grid").bounding_box()
        pg.screenshot(path=str(OUT / f"{tag}_stats.png"), clip={"x": 0, "y": g["y"] - 20, "width": vw[0], "height": g["height"] + 40})
        pg.evaluate("document.querySelector('.cta').scrollIntoView({block:'start'})"); pg.wait_for_timeout(2600)
        pg.screenshot(path=str(OUT / f"{tag}_plane_mid.png"))
        pg.wait_for_timeout(3600)
        pg.screenshot(path=str(OUT / f"{tag}_plane_end.png"))
        print(tag, "state", pg.evaluate("Plane.state"), "errors", errs)
        ctx.close()
    br.close()
