"""Visit every page, state, dialog and tool result in a non-English language and record every English string the translator was asked for."""
import sys, pathlib, json, os
from playwright.sync_api import sync_playwright
FILE = pathlib.Path(sys.argv[1]).as_uri()
LANG = sys.argv[2] if len(sys.argv) > 2 else "hi"
OUT = sys.argv[3] if len(sys.argv) > 3 else "test/misses.json"
FX = pathlib.Path("test/fixtures").resolve()
seen = set()
def harvest(pg):
    try: seen.update(pg.evaluate("[...I18n.misses]"))
    except Exception as e: print("harvest err", e)
def go(pg, base, h, wait=380):
    pg.goto(base + "#about"); pg.wait_for_timeout(60); pg.goto(base + h); pg.wait_for_timeout(wait); harvest(pg)
def tryclick(pg, sel, wait=250):
    try:
        if pg.locator(sel).count(): pg.locator(sel).first.click(timeout=2500); pg.wait_for_timeout(wait); harvest(pg); return True
    except Exception as e: pass
    return False
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    NOWS = ["2026-10-22T10:05:00%2B05:30", "2026-10-25T20:30:00%2B05:30", "2026-10-24T08:00:00%2B05:30", "2026-12-31T12:00:00%2B05:30", "2027-01-05T12:00:00%2B05:30"]
    for now in (NOWS[:1] if os.environ.get("FAST") else NOWS):
        base = FILE + "?now=" + now
        for vw in ([(1440, 900)] if os.environ.get("FAST") else [(1440, 900), (390, 844)]):
            mob = vw[0] < 768
            ctx = b.new_context(viewport={"width": vw[0], "height": vw[1]}, is_mobile=mob, has_touch=mob)
            ctx.grant_permissions(["clipboard-read", "clipboard-write"])
            pg = ctx.new_page()
            pg.goto(base + "#home"); pg.wait_for_timeout(500)
            pg.evaluate(f"setLang('{LANG}')"); pg.wait_for_timeout(600); harvest(pg)
            full = now.startswith("2026-10-22")
            routes = ["#home", "#guides", "#best-time", "#fair-price", "#tickets", "#documents", "#about", "#nope"]
            routes += ["#best-time." + o for o in pg.evaluate("OFFICE_IDS")]
            keys = pg.evaluate("TASK_IDS.flatMap(id => TASKS[id].cases.map(c => id + '.' + c.id))")
            if full or True:
                for k in keys:
                    routes.append("#" + k)
                    for s in ["bring", "go", "pay", "steps", "ticket"]: routes.append("#" + k + "." + s)
            for r in routes: go(pg, base, r)
            if not full: ctx.close(); continue
            # guides filters, best-time filters
            go(pg, base, "#guides")
            for f in ["id", "money", "online", "all"]: tryclick(pg, "#gf-" + f)
            go(pg, base, "#best-time")
            for f in ["open", "aadhaar", "passport", "all"]: tryclick(pg, "#bf-" + f)
            # offices: open folds, choose days and alternatives
            for o in pg.evaluate("OFFICE_IDS"):
                go(pg, base, "#best-time." + o)
                for sel in [".fold summary", ".daypick button >> nth=3", ".alts .chip-inline >> nth=0"]: tryclick(pg, sel, 500)
            # guide interactions
            go(pg, base, "#aadhaar.address.bring")
            for i in range(10):
                if not tryclick(pg, ".checklist .ck:not(:has(input:checked)) >> nth=0", 400): break
            tryclick(pg, "#copylist-btn"); tryclick(pg, "#fill-btn", 500); tryclick(pg, "#clear-btn", 500)
            go(pg, base, "#aadhaar.address.go")
            for sel in ["#off-ask-majestic", ".daypick button >> nth=2", ".alts .chip-inline >> nth=0", ".fold summary"]: tryclick(pg, sel, 500)
            go(pg, base, "#passport.first.go"); tryclick(pg, ".daypick button >> nth=1", 500)
            for k in keys:
                go(pg, base, "#" + k + ".ticket", 900)
                tryclick(pg, "#save-d" if not mob else "#save-m", 600); tryclick(pg, "#share-t", 400)
            go(pg, base, "#tickets", 600)
            tryclick(pg, "[data-act=tshare]"); tryclick(pg, "[data-act=tremove]", 500)
            # sponsored services: book a partner on each guide, toggle ads in settings
            for k in keys[::3]:
                go(pg, base, "#" + k + ".steps", 500); tryclick(pg, ".pcard-btn", 500)
            # pay selects and quotes
            go(pg, base, "#passport.first.pay")
            for v in ["60", "36"]:
                try: pg.select_option("#pp-pages", v); pg.wait_for_timeout(300); harvest(pg)
                except Exception: pass
            for v in ["u18", "u8", "senior", "adult"]:
                try: pg.select_option("#pp-age", v); pg.wait_for_timeout(300); harvest(pg)
                except Exception: pass
            go(pg, base, "#itr.belated.pay")
            for v in ["below", "upto5", "above5"]:
                try: pg.select_option("#pi-inc", v); pg.wait_for_timeout(300); harvest(pg)
                except Exception: pass
            for t in ["aadhaar", "pan", "passport"]:
                go(pg, base, "#fair-price")
                tryclick(pg, "#ft-" + t, 500)
                for c in pg.evaluate(f"TASKS['{t}'].cases.map(c => c.id)"):
                    tryclick(pg, "#fc-" + c, 500)
                    for i in range(4): tryclick(pg, ".qpicks .chip-inline >> nth=%d" % i, 500)
                    try:
                        pg.fill("#fq-amt", "1"); tryclick(pg, '[data-act="qcheck"]', 500)
                        pg.fill("#fq-amt", ""); tryclick(pg, '[data-act="qcheck"]', 500)
                    except Exception: pass
            go(pg, base, "#aadhaar.address.pay"); tryclick(pg, ".fold summary", 500)
            for i in range(4): tryclick(pg, "#pq-out ~ * .chip-inline, .qpicks .chip-inline >> nth=%d" % i, 400)
            # tools
            go(pg, base, "#dl.test.go")
            for d in ["2026-10-01", "2026-08-01", "2026-01-10", "2027-01-01"]:
                try: pg.fill("#ll-date", d); pg.wait_for_timeout(200); harvest(pg)
                except Exception: pass
            go(pg, base, "#voter.new.go")
            for d in ["2009-02-15", "2010-12-31", "2000-01-01", "2030-01-01", "1850-01-01"]:
                try: pg.fill("#qual-date", d); pg.wait_for_timeout(200); harvest(pg)
                except Exception: pass
            go(pg, base, "#eduloan.apply.pay")
            for a, r_, y in [("500000", "10", "10"), ("", "", ""), ("100", "90", "50"), ("200000", "0", "5")]:
                try: pg.fill("#emi-amt", a); pg.fill("#emi-rate", r_); pg.fill("#emi-yrs", y); pg.wait_for_timeout(200); harvest(pg)
                except Exception: pass
            # vault
            go(pg, base, "#documents", 1200)
            tryclick(pg, '.vadd[data-type="aadhaar"]', 500)
            try:
                pg.fill("#ve-num", "12"); pg.wait_for_timeout(150); harvest(pg)
                pg.fill("#ve-num", "1234 5678 9012"); pg.set_input_files("#ve-file", [str(FX / "aadhaar-front.png"), str(FX / "scan.pdf")]); pg.wait_for_timeout(300); harvest(pg)
                pg.click('.vedit-form button[type="submit"]'); pg.wait_for_timeout(1200); harvest(pg)
            except Exception as e: print("vault err", e)
            for sel in ['[data-vact="reveal"]', '[data-vact="copy"]', '.vfile >> nth=0']: tryclick(pg, sel, 600)
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            for ty in ["pan", "passport", "voter", "dl", "bank", "birth", "class10"]:
                if tryclick(pg, '.vadd[data-type="%s"]' % ty, 400):
                    try: pg.fill("#ve-num", "x"); pg.wait_for_timeout(120); harvest(pg)
                    except Exception: pass
                    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            tryclick(pg, '.vault-head [data-type="other"]', 400); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            tryclick(pg, '.vcard.has [data-vact="edit"]', 500); tryclick(pg, '[data-vact="delete"]', 500); tryclick(pg, "#vc-no", 600)
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            tryclick(pg, '[data-vact="setpass"]', 500)
            try:
                pg.fill("#vp-1", "12"); pg.fill("#vp-2", "12"); pg.click('[data-vform="setpass"] button[type="submit"]'); pg.wait_for_timeout(200); harvest(pg)
                pg.fill("#vp-1", "2468"); pg.fill("#vp-2", "1357"); pg.click('[data-vform="setpass"] button[type="submit"]'); pg.wait_for_timeout(200); harvest(pg)
                pg.fill("#vp-2", "2468"); pg.click('[data-vform="setpass"] button[type="submit"]'); pg.wait_for_timeout(2500); harvest(pg)
            except Exception as e: print("pass err", e)
            tryclick(pg, '[data-vact="lock"]', 800)
            try:
                pg.fill("#v-pass", "0000"); pg.click(".vault-unlock button"); pg.wait_for_timeout(1500); harvest(pg)
            except Exception: pass
            tryclick(pg, '[data-vact="forgot"]', 500); tryclick(pg, "#vc-no", 400)
            try: pg.fill("#v-pass", "2468"); pg.click(".vault-unlock button"); pg.wait_for_timeout(1500); harvest(pg)
            except Exception: pass
            tryclick(pg, '[data-vact="nopass"]', 500); tryclick(pg, "#vc-yes", 2000)
            # settings, clear, search, shortcuts, language menu
            go(pg, base, "#settings", 900)
            tryclick(pg, "[data-act=docs-all]", 400)
            tryclick(pg, "#clear-all", 500); tryclick(pg, "#cc-cancel", 600); tryclick(pg, "#clear-all", 400); tryclick(pg, "#cc-yes", 1200)
            for s_ in ["#set-ads-off", "#set-ads-on", "#set-sound-off", "#set-sound-on", "#set-motion-reduced", "#set-motion-full", "#set-theme-dark", "#set-theme-device"]: tryclick(pg, s_, 400)
            go(pg, base, "#home", 700)
            try:
                pg.keyboard.press("/"); pg.wait_for_timeout(400); harvest(pg)
                for q in ["aadhaar", "passport office", "zzzzqq", "rto", "majestic"]:
                    pg.fill("#ov-q", q); pg.wait_for_timeout(350); harvest(pg)
                pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
                pg.keyboard.press("?"); pg.wait_for_timeout(500); harvest(pg); pg.keyboard.press("Escape")
            except Exception as e: print("search err", e)
            tryclick(pg, "#tb-lang", 400); pg.keyboard.press("Escape")
            tryclick(pg, '[data-act="sound"]', 300); tryclick(pg, '[data-act="sound"]', 300)
            # home interactions
            go(pg, base, "#home", 900)
            for sel in ["#ex-passport", "#ex-pan", "#ex-aadhaar", ".story-step >> nth=1", ".story-step >> nth=2"]: tryclick(pg, sel, 1500)
            pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(800); harvest(pg)
            ctx.close()
        print(now, "strings so far:", len(seen))
    b.close()
json.dump(sorted(seen), open(OUT, "w"), ensure_ascii=False, indent=0)
print("total", len(seen))
