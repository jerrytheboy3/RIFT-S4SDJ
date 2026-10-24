import sys, pathlib
from playwright.sync_api import sync_playwright
OLD, NEW = (pathlib.Path(a).resolve().as_uri() + "?now=2026-10-22T10:05:00%2B05:30#home" for a in sys.argv[1:3])
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True); out = []
    for u in (OLD, NEW):
        for lang in ("en", "hi", "kn"):
            pg = b.new_page(); pg.goto(u); pg.wait_for_timeout(700)
            if lang != "en": pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(500)
            out.append((lang, pg.inner_text(".footer").replace("\n", " ")[:4000], pg.evaluate("[...I18n.misses]")))
            pg.evaluate("setLang('en')"); pg.close()
    b.close()
for i, lang in enumerate(("en", "hi", "kn")):
    o, n = out[i], out[i + 3]
    print(lang, "footer identical to before:", o[1] == n[1], "| untranslated:", n[2])
