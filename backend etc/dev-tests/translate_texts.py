"""Translate every seeded sentence with the site's own translator (exact matches and fill-in patterns)."""
import sys, pathlib, json
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri()
texts = json.load(open("test/texts.json"))
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True); pg = b.new_page(); pg.goto(URL + "#about"); pg.wait_for_timeout(500)
    out = pg.evaluate("""texts => { const r = {}; for (const l of ['hi', 'kn']) { I18n.setLang(l); I18n.misses.clear();
        texts.forEach(s => { const t = I18n.tr(s); (r[s] = r[s] || {})[l] = (t !== s || I18n.keep(s)) ? t : null; }); }
      I18n.setLang('en'); return r; }""", texts)
    b.close()
json.dump(out, open("test/texts_tr.json", "w"), ensure_ascii=False, indent=0)
none = [s for s, v in out.items() if not (v.get("hi") and v.get("kn"))]
print("translated", len(out) - len(none), "of", len(out), "| no translation:", none)
