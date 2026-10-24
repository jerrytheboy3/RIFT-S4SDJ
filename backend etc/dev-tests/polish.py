"""The polish layer: edge light, nav preview, ripples, theme reveal, reading ring, sounds, and that all of it stands down under reduced motion and on touch."""
import sys, pathlib
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri() + "?now=2026-10-22T10:05:00%2B05:30"
res = []
def check(name, ok, info=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> " + str(info)))
def center(pg, sel):
    b = pg.locator(sel).first.bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    ctx = br.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL + "#guides"); pg.wait_for_timeout(1200)
    # edge light
    x, y = center(pg, ".brow >> nth=0"); pg.mouse.move(x - 40, y); pg.mouse.move(x, y, steps=4); pg.wait_for_timeout(300)
    lit = pg.evaluate("(() => { const b = document.querySelector('.brow'); return [b.classList.contains('lit'), !!b.querySelector(':scope > .hl'), b.style.getPropertyValue('--hx')]; })()")
    check("hovered card lights its edge", lit[0] and lit[1] and lit[2].endswith("px"), lit)
    pg.mouse.move(5, 880); pg.wait_for_timeout(200)
    check("light leaves with the pointer", not pg.evaluate("document.querySelector('.brow').classList.contains('lit')"))
    check("only one edge light per card", pg.evaluate("document.querySelector('.brow').querySelectorAll(':scope > .hl').length") == 1)
    # nav preview
    x, y = center(pg, '.mainnav a[data-nav="about"]'); pg.mouse.move(x, y, steps=4); pg.wait_for_timeout(700)
    ind = pg.evaluate("(() => { const i = document.querySelector('.nav-ind'), a = document.querySelector('.mainnav a[data-nav=about]'); return [i.style.transform, 'translateX(' + a.offsetLeft + 'px)', i.style.opacity]; })()")
    check("nav pill slides to the pointed link", ind[0] == ind[1] and ind[2] == "1", ind)
    pg.mouse.move(700, 500, steps=4); pg.wait_for_timeout(700)
    back = pg.evaluate("(() => { const i = document.querySelector('.nav-ind'), a = document.querySelector('.mainnav a[aria-current=page]'); return [i.style.transform, 'translateX(' + a.offsetLeft + 'px)']; })()")
    check("nav pill returns to the current page", back[0] == back[1], back)
    # ripple
    x, y = center(pg, "#gf-id"); pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(60)
    check("pressing a chip starts a ripple", pg.evaluate("document.querySelectorAll('#gf-id .rip').length") == 1)
    pg.mouse.up(); pg.wait_for_timeout(1000)
    check("ripple cleans itself up", pg.evaluate("document.querySelectorAll('.rip').length") == 0)
    check("ripple adds no text", pg.inner_text("#gf-id").strip() == "ID and cards", pg.inner_text("#gf-id"))
    # sounds exist and run
    sfx = pg.evaluate("""(() => { const c = Sound.ensure(); const out = [];
      for (const n of ['glass', 'nav', 'theme', 'hover']) { try { SFX[n](c, Sound.master, c.currentTime + 0.01, { dark: true }); out.push(n); } catch (e) { out.push(n + ':' + e.message); } }
      return out; })()""")
    check("new sounds play without errors", sfx == ["glass", "nav", "theme", "hover"], sfx)
    # theme reveal
    x, y = center(pg, "#tb-theme"); pg.mouse.click(x, y); pg.wait_for_timeout(120)
    mid = pg.evaluate("[document.documentElement.classList.contains('vt-theme'), getComputedStyle(document.documentElement).getPropertyValue('--vx')]")
    check("theme change spreads from the switch", mid[0] and abs(float(mid[1].strip().replace('px', '')) - x) < 2, mid)
    pg.wait_for_timeout(1100)
    check("theme reveal tidies up", not pg.evaluate("document.documentElement.classList.contains('vt-theme')") and pg.evaluate("document.documentElement.dataset.theme") == "dark")
    # reading ring + scrolled header
    pg.goto(URL + "#about"); pg.wait_for_timeout(800)
    pg.evaluate("window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)"); pg.wait_for_timeout(400)
    pv = float(pg.evaluate("getComputedStyle(document.getElementById('totop')).getPropertyValue('--p')") or 0)
    check("back-to-top ring shows how far you have read", 0.4 < pv < 0.6, pv)
    check("header deepens once scrolled", pg.evaluate("document.documentElement.classList.contains('scrolled')"))
    # links: underline glides in, nav links never underline
    x, y = center(pg, '.mainnav a[data-nav="guides"]'); pg.mouse.move(x, y); pg.wait_for_timeout(400)
    check("nav links stay free of underlines", pg.evaluate("getComputedStyle(document.querySelector('.mainnav a[data-nav=guides]')).textDecorationLine") == "none")
    check("no errors", not errs, errs)
    ctx.close()

    # reduced motion: nothing moves
    ctx = br.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page(); pg.goto(URL + "#guides"); pg.wait_for_timeout(800)
    x, y = center(pg, ".brow >> nth=0"); pg.mouse.move(x, y, steps=4); pg.wait_for_timeout(200)
    check("reduced motion: no edge light", not pg.evaluate("!!document.querySelector('.brow .hl')"))
    x, y = center(pg, "#gf-id"); pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(60); pg.mouse.up()
    check("reduced motion: no ripple", pg.evaluate("document.querySelectorAll('.rip').length") == 0)
    x, y = center(pg, "#tb-theme"); pg.mouse.click(x, y); pg.wait_for_timeout(60)
    check("reduced motion: theme switches instantly", not pg.evaluate("document.documentElement.classList.contains('vt-theme')") and pg.evaluate("document.documentElement.dataset.theme") == "dark")
    ctx.close()

    # touch phone: taps ripple, nothing lights on hover
    ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL + "#guides"); pg.wait_for_timeout(900)
    pg.tap('.tabbar a[data-nav="fair-price"]'); pg.wait_for_timeout(700)
    check("phone: tab bar works with ripples", pg.evaluate("location.hash") == "#fair-price" and pg.evaluate("document.querySelector('.tabbar a[data-nav=fair-price]').getAttribute('aria-current')") == "page")
    anim = pg.evaluate("getComputedStyle(document.querySelector('.tabbar a[aria-current=page] .ic')).animationName")
    check("phone: current tab icon springs", anim == "tab-pop", anim)
    check("phone: no edge light from taps", not pg.evaluate("!!document.querySelector('.lit')"))
    check("phone: no errors", not errs, errs)
    ctx.close()
    br.close()
print(f"{sum(res)}/{len(res)} passed")
