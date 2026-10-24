"""Every language at every screen size and text size: no sideways scroll, header icons inside the bar, tab bar labels inside their cells."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
SIZES = [(360, 740), (390, 844), (768, 1024), (900, 800), (1024, 768), (1100, 800), (1240, 800), (1440, 900)]
ROUTES = ["#home", "#guides", "#aadhaar.address.go", "#passport.first.pay", "#dl.test.go", "#eduloan.apply.pay", "#best-time.psk-lalbagh", "#fair-price", "#tickets", "#documents", "#about", "#settings"]
CHECK = """() => {
  const bad = [];
  const over = document.documentElement.scrollWidth - innerWidth;
  if (over > 1) bad.push('page wider by ' + over + 'px');
  const bar = document.querySelector('.topbar-in');
  if (bar && bar.offsetParent) {
    const r = bar.getBoundingClientRect();
    for (const el of bar.querySelectorAll('.iconbtn, .wordmark, .logo, .mainnav, .tb-field')) {
      if (!el.offsetParent) continue;
      const e = el.getBoundingClientRect();
      if (e.width && (e.right > r.right + 1 || e.left < r.left - 1)) bad.push('header item outside bar: ' + (el.id || el.className));
    }
    const nav = bar.querySelector('.mainnav'), tools = bar.querySelector('.tools');
    if (nav && tools && nav.offsetParent) {
      if (nav.getBoundingClientRect().right > tools.getBoundingClientRect().left + 1) bad.push('nav runs into the icons');
      const cur = nav.querySelector('a[aria-current="page"]'), nr = nav.getBoundingClientRect();
      if (cur) { const c = cur.getBoundingClientRect(); if (c.left < nr.left - 1 || c.right > nr.right + 1) bad.push('current nav link scrolled out of view'); }
    }
  }
  const tb = document.getElementById('tabbar');
  if (tb && tb.offsetParent) for (const a of tb.querySelectorAll('a')) {
    const lab = a.querySelector('span:last-child') || a;
    if (lab.scrollWidth > a.clientWidth + 1) bad.push('tab label clipped: ' + a.textContent.trim());
  }
  return bad;
}"""
fails = 0
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for lang in ["en", "hi", "kn"]:
        for w, h in SIZES:
            mob = w < 768
            ctx = b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob)
            pg = ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(URL + "#home"); pg.wait_for_timeout(400)
            pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(500)
            for text in ["normal", "larger", "large"]:
                pg.evaluate(f"setSetting('text', '{text}')"); pg.wait_for_timeout(150)
                probs = set()
                for r in ROUTES:
                    pg.goto(URL + "#about"); pg.wait_for_timeout(40); pg.goto(URL + r); pg.wait_for_timeout(450)
                    for x in pg.evaluate(CHECK): probs.add(r + ": " + x)
                if probs or errs:
                    fails += 1
                    print(f"{lang} {w}x{h} text={text}: FAIL", sorted(probs)[:8], errs[:3])
                else:
                    print(f"{lang} {w}x{h} text={text}: OK")
            ctx.close()
    b.close()
print("FAILS", fails)
