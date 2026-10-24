"""The goals section on About: full captures in each theme, language and width, plus untranslated strings."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    for tag, theme, lang, w in [("en_d", "light", "en", 1440), ("en_dark", "dark", "en", 1440), ("en_m", "light", "en", 390), ("hi_d", "light", "hi", 1440), ("kn_m", "light", "kn", 390), ("en_t", "light", "en", 900)]:
        mob = w < 768
        ctx = br.new_context(viewport={"width": w, "height": 900}, color_scheme=theme, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + "#home"); pg.wait_for_timeout(400)
        if lang != "en": pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(500)
        pg.goto(URL + "#about"); pg.wait_for_timeout(1000)
        top = pg.evaluate("document.querySelector('.sdgs').getBoundingClientRect().top + scrollY")
        H = pg.evaluate("document.querySelector('.sdgs').offsetHeight")
        y = top
        while y < top + H:   # walk through so every reveal fires
            pg.evaluate(f"window.scrollTo(0, {y})"); pg.wait_for_timeout(700); y += 500
        k = 0
        for sel in [".sdg-sub", ".sdg-impact", ".sdg-line"]:
            pg.evaluate(f"document.querySelector('{sel}').scrollIntoView({{block:'start'}}); window.scrollBy(0, -90)"); pg.wait_for_timeout(1500)
            pg.screenshot(path=f"shots15/{tag}_{k}.png"); k += 1
        miss = pg.evaluate("[...I18n.misses]") if lang != "en" else []
        over = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
        print(tag, "height", H, "overflow", over, "errors", errs, "misses", miss)
        ctx.close()
    br.close()
