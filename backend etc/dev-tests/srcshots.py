import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for tag, vw, theme in [("d", (1440, 900), "light"), ("m", (390, 844), "light"), ("dark", (1440, 900), "dark")]:
        mob = vw[0] < 768
        ctx = b.new_context(viewport={"width": vw[0], "height": vw[1]}, color_scheme=theme, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
        pg = ctx.new_page()
        pg.goto(URL + "#aadhaar.address.bring"); pg.wait_for_timeout(1400)
        el = pg.locator(".checklist"); el.scroll_into_view_if_needed(); pg.wait_for_timeout(600)
        bb = el.bounding_box(); pg.screenshot(path=f"shots16/{tag}_bring.png", clip={"x": max(0, bb["x"] - 10), "y": bb["y"] - 10, "width": min(bb["width"] + 20, vw[0]), "height": min(bb["height"] + 20, 900)})
        pg.goto(URL + "#about"); pg.goto(URL + "#passport.first.pay"); pg.wait_for_timeout(1400)
        el = pg.locator(".fees"); el.scroll_into_view_if_needed(); pg.wait_for_timeout(600)
        bb = el.bounding_box(); pg.screenshot(path=f"shots16/{tag}_pay.png", clip={"x": max(0, bb["x"] - 10), "y": bb["y"] - 10, "width": min(bb["width"] + 20, vw[0]), "height": bb["height"] + 190})
        if tag == "d":
            pg.goto(URL + "#fair-price"); pg.wait_for_timeout(1200)
            el = pg.locator(".feetable").nth(1); el.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
            bb = el.bounding_box(); pg.screenshot(path="shots16/d_table.png", clip={"x": bb["x"] - 10, "y": bb["y"] - 10, "width": bb["width"] + 20, "height": bb["height"] + 20})
            pg.evaluate("setLang('hi')"); pg.wait_for_timeout(400); pg.goto(URL + "#about"); pg.goto(URL + "#aadhaar.address.pay"); pg.wait_for_timeout(1400)
            el = pg.locator(".fees"); el.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
            bb = el.bounding_box(); pg.screenshot(path="shots16/hi_pay.png", clip={"x": bb["x"] - 10, "y": bb["y"] - 10, "width": bb["width"] + 20, "height": bb["height"] + 160})
            pg.evaluate("setLang('en')")
        ctx.close()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.goto(pathlib.Path(sys.argv[2]).resolve().as_uri() + "#home"); pg.wait_for_timeout(800); pg.screenshot(path="shots16/unconfigured.png")
    b.close()
