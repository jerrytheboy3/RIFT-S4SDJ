import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
FIND = """() => { const W = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > W + 0.5) out.push(el.tagName + '.' + String(el.className).slice(0,40) + '#' + el.id + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0) + ' "' + (el.textContent||'').trim().slice(0,40) + '"'); }
  return [document.documentElement.scrollWidth, W, out.slice(0, 12)]; }"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for lang, w, h, text, route in [("hi", 768, 1024, "larger", "#aadhaar.address.go"), ("kn", 360, 740, "larger", "#eduloan.apply.pay")]:
        mob = w < 768
        ctx = b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page(); pg.goto(URL + "#home"); pg.wait_for_timeout(400)
        pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(400); pg.evaluate(f"setSetting('text','{text}')")
        pg.goto(URL + route); pg.wait_for_timeout(900)
        print(lang, w, text, route, pg.evaluate(FIND))
        ctx.close()
    b.close()
