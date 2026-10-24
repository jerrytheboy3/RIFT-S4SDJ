import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.goto(URL + "#aadhaar.address.bring"); pg.wait_for_timeout(1200)
    print(pg.evaluate("""() => { const W = document.documentElement.clientWidth, out = [];
      for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 1) out.push(el.tagName + '.' + String(el.className).slice(0, 30) + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0)); }
      return [document.documentElement.scrollWidth, W, out.slice(0, 10)]; }"""))
    b.close()
