import sys, pathlib, urllib.request
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
mock = lambda p: urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:54321" + p, method="POST")).read()
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for tag, vw, scheme in [("d", (1440, 700), "light"), ("m", (390, 700), "light"), ("dark", (1440, 700), "dark")]:
        mob = vw[0] < 768
        ctx = b.new_context(viewport={"width": vw[0], "height": vw[1]}, color_scheme=scheme, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1); pg = ctx.new_page()
        pg.goto(URL + "#guides"); pg.wait_for_selector(".brow", timeout=6000)
        mock("/__fail/on"); pg.reload(); pg.wait_for_selector("#data-note:not([hidden])", timeout=8000); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"shots16/note_{tag}.png"); mock("/__fail/off"); ctx.close()
    ctx = b.new_context(viewport={"width": 1440, "height": 700}); pg = ctx.new_page(); mock("/__delay/9000")
    pg.goto(URL + "#guides"); pg.wait_for_timeout(8600); pg.screenshot(path="shots16/loading_slow.png"); mock("/__delay/0"); ctx.close()
    b.close()
