import sys, pathlib, time, urllib.request
from playwright.sync_api import sync_playwright
NEW = pathlib.Path(sys.argv[1]).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
bad, slow = [], []
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True); pg = b.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(NEW + "#home"); pg.wait_for_timeout(500)
    for i in range(30):
        if i == 15: pg.evaluate("setLang('hi')"); pg.wait_for_timeout(300)
        urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:54321/__reset", method="POST")).read()
        pg.goto(NEW + "#aadhaar.address.pay"); t0 = time.time(); pg.reload()
        try: pg.wait_for_selector(".fees", timeout=6000); slow.append(round(time.time() - t0, 2))
        except Exception: bad.append((i, pg.inner_text("#main")[:100]))
    pg.evaluate("setLang('en')"); b.close()
print("failed loads:", bad, "| slowest load (s):", max(slow) if slow else None, "| errors:", errs[:3])
