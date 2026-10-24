import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width":360,"height":740}, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.goto(URL + "#guides"); pg.wait_for_timeout(900)
    print(pg.evaluate("""() => { const W = document.documentElement.clientWidth, out = [];
      for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 0.5) out.push(el.tagName + '.' + el.className + '#' + el.id + ' right=' + r.right.toFixed(1)); }
      return [document.documentElement.scrollWidth, W, out.slice(0, 15)]; }"""))
    b.close()
