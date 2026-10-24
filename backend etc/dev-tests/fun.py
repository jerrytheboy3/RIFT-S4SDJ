"""Home fun: marker strokes, icon actions, stat drawings, paper plane; reduced motion, Hindi and leaving mid-flight."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
res = []
def check(name, ok, info=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> " + str(info)))
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    ctx = br.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL + "#home"); pg.wait_for_timeout(3200)
    sc = pg.evaluate("[...document.querySelectorAll('.h-hero .scrib path')].map(p => parseFloat(getComputedStyle(p).strokeDashoffset))")
    check("three words get marker strokes (5 strokes)", len(sc) == 5, sc)
    check("strokes draw themselves in", all(abs(v) < 0.01 for v in sc), sc)
    check("hero still reads as one heading", pg.evaluate("document.getElementById('page-h').getAttribute('aria-label')").startswith("What to bring"))
    # icon actions
    pg.evaluate("document.querySelector('.bento').scrollIntoView({block:'center'})"); pg.wait_for_timeout(2200)
    acts = {}
    for t, want in [("dl", "ic-drive"), ("itr", "ic-print"), ("eduloan", "ic-toss"), ("pan", "ic-flip"), ("aadhaar", "ic-wiggle")]:
        card = pg.locator(f'.bento .brow[href="#{t}"]')
        card.scroll_into_view_if_needed(); pg.wait_for_timeout(250)
        b = card.bounding_box(); pg.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, steps=3); pg.wait_for_timeout(120)
        acts[t] = pg.evaluate(f"getComputedStyle(document.querySelector('.bento .brow[href=\"#{t}\"] .tile .ic')).animationName")
        pg.mouse.move(5, 5); pg.wait_for_timeout(100)
    check("task icons act out their task on hover", acts == {"dl": "ic-drive", "itr": "ic-print", "eduloan": "ic-toss", "pan": "ic-flip", "aadhaar": "ic-wiggle"}, acts)
    # stat drawings
    pg.evaluate("document.querySelector('.stat-grid').scrollIntoView({block:'center'})"); pg.wait_for_timeout(2600)
    check("four stat drawings", pg.evaluate("document.querySelectorAll('.stat-grid .stat-art').length") == 4)
    fan = pg.evaluate("getComputedStyle(document.querySelector('.sa-guides .c1')).transform")
    check("guide cards fan out once shown", fan not in ("none", ""), fan)
    pin = pg.evaluate("getComputedStyle(document.querySelector('.sa-offices .pin')).opacity")
    check("map pin has dropped in", pin == "1", pin)
    CLEAR = """() => [...document.querySelectorAll('.stat-grid li')].map(li => { const r = document.createRange(); r.selectNodeContents(li.querySelector('b'));
      const n = r.getBoundingClientRect(), a = li.querySelector('.stat-art').getBoundingClientRect(); return n.right <= a.left + 2 || n.bottom <= a.top + 2; })"""
    bad = []
    for w, txt in [(1440, "normal"), (1440, "large"), (1024, "larger"), (900, "large"), (390, "large"), (360, "larger")]:
        pg.set_viewport_size({"width": w, "height": 900}); pg.evaluate(f"setSetting('text', '{txt}')"); pg.wait_for_timeout(500)
        pg.evaluate("document.querySelectorAll('[data-countto]').forEach(b => b.textContent = b.dataset.countto)")
        r = pg.evaluate(CLEAR)
        if not all(r): bad.append((w, txt, r))
    pg.set_viewport_size({"width": 1440, "height": 900}); pg.evaluate("setSetting('text', 'normal')"); pg.wait_for_timeout(300)
    check("drawings sit clear of the numbers at every size", not bad, bad)
    # plane
    pg.evaluate("document.querySelector('.cta').scrollIntoView({block:'start'})"); pg.wait_for_timeout(1700)
    check("plane takes off when the closing section shows", pg.evaluate("Plane.state") == "flying", pg.evaluate("Plane.state"))
    pg.wait_for_timeout(4200)
    st = pg.evaluate("Plane.state")
    check("plane lands", st == "landed", st)
    pos = pg.evaluate("""(() => { const s = document.querySelector('.cta').getBoundingClientRect(), p = document.querySelector('.plane').getBoundingClientRect(), h = document.querySelector('.cta-h').getBoundingClientRect();
      return { inside: p.left >= s.left && p.right <= s.right && p.top >= s.top, nearHead: p.bottom >= h.top - 60 && p.top <= h.top + h.height / 2 }; })()""")
    check("plane parks beside the headline, inside the section", pos["inside"] and pos["nearHead"], pos)
    check("trail fades after landing", pg.evaluate("document.querySelector('.plane-trail').classList.contains('fade')"))
    pg.wait_for_timeout(2000)
    h = pg.locator(".cta-h").bounding_box(); pg.mouse.move(h["x"] + 40, h["y"] + 40, steps=3); pg.wait_for_timeout(150)
    check("pointing at the headline sends it round again", pg.evaluate("Plane.state") == "flying")
    pg.goto(URL + "#guides"); pg.wait_for_timeout(600)
    check("leaving mid-flight tidies up", pg.evaluate("Plane.sec === null && Plane.state === 'idle'"))
    pg.set_viewport_size({"width": 1100, "height": 800}); pg.wait_for_timeout(300)
    check("no errors", not errs, errs)
    ctx.close()

    ctx = br.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "#home"); pg.wait_for_timeout(800)
    check("reduced motion: no plane", pg.evaluate("!document.querySelector('.plane')"))
    sc = pg.evaluate("[...document.querySelectorAll('.h-hero .scrib path')].map(p => parseFloat(getComputedStyle(p).strokeDashoffset))")
    check("reduced motion: strokes simply shown", all(abs(v) < 0.01 for v in sc), sc)
    check("reduced motion: no errors", not errs, errs)
    ctx.close()

    ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "#home"); pg.wait_for_timeout(500)
    pg.evaluate("setLang('hi')"); pg.wait_for_timeout(2600)
    check("Hindi: strokes under लाएँ, जाएँ, चुकाएँ", pg.evaluate("document.querySelectorAll('.h-hero .scrib').length") == 3)
    pg.evaluate("document.querySelector('.cta').scrollIntoView({block:'start'})"); pg.wait_for_timeout(6500)
    check("phone + Hindi: plane lands", pg.evaluate("Plane.state") == "landed", pg.evaluate("Plane.state"))
    over = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("phone: nothing pokes out sideways", over <= 0, over)
    check("phone: no errors", not errs, errs)
    ctx.close()
    br.close()
print(f"{sum(res)}/{len(res)} passed")
