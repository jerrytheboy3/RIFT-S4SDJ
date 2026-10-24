"""Section 11 checks for Bring Go Pay. Usage: full.py <index.html>"""
import sys, pathlib, json, re
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

URL = pathlib.Path(sys.argv[1]).as_uri()
NOW = "?now=2026-10-22T10:05:00%2B05:30"   # Thursday, 10:05 AM IST
results = []

def check(name, cond, detail=""):
    results.append((bool(cond), name, detail))

ROUTES = ["#home", "#guides", "#aadhaar", "#aadhaar.address", "#aadhaar.name-dob.go", "#aadhaar.mobile.bring",
          "#aadhaar.biometric.pay", "#aadhaar.address.steps", "#aadhaar.address.ticket", "#pan", "#pan.instant.go",
          "#pan.card.pay", "#pan.correction.steps", "#passport", "#passport.first.bring", "#passport.renewal.go",
          "#passport.tatkal.pay", "#rent", "#rent.lease.go", "#rent.lease.pay", "#itr", "#itr.belated.go", "#itr.belated.pay",
          "#best-time", "#best-time.ask-southend", "#best-time.ask-majestic", "#best-time.psk-lalbagh", "#best-time.psk-whitefield",
          "#fair-price", "#tickets", "#about", "#settings", "#nope"]

def new_page(b, w, h, scheme, extra=None):
    phone = w < 768
    ctx = b.new_context(viewport={"width": w, "height": h}, color_scheme=scheme, is_mobile=phone, has_touch=phone,
                        permissions=["clipboard-read", "clipboard-write"], **(extra or {}))
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    return ctx, pg, errs

def go(pg, route, wait=350):
    pg.goto(URL + NOW + route)
    pg.wait_for_timeout(wait)

def hscroll(pg):
    return pg.evaluate("Math.max(document.documentElement.scrollWidth, innerWidth) - visualViewport.width")

def heading(pg):
    return pg.evaluate("(document.getElementById('sec-h')||document.getElementById('page-h')||document.getElementById('board-h')||{}).textContent||''")

def tick(pg, tid, key="aadhaar.address"):
    cid = "ck-" + re.sub(r"[^a-z0-9]", "-", key, flags=re.I) + "-" + re.sub(r"[^a-z0-9]", "-", tid, flags=re.I)
    pg.click(f"label[for='{cid}']")
    pg.wait_for_timeout(120)

def count(pg):
    return pg.inner_text("#bring-count")

def toast(pg):
    el = pg.query_selector(".toast-msg")
    return el.inner_text() if el else ""

def click_toast_action(pg):
    pg.click(".toast-act"); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)

    # ---------- Routes, deep links, h-scroll, console: 4 combos + 360 ----------
    for (w, h) in [(1440, 900), (390, 844), (360, 740)]:
        for scheme in (["light", "dark"] if w != 360 else ["light"]):
            ctx, pg, errs = new_page(b, w, h, scheme)
            bad = []
            for r in ROUTES:
                go(pg, r, 250)
                hs = hscroll(pg)
                if hs > 0: bad.append(f"{r}:{hs}px")
                if not heading(pg).strip(): bad.append(f"{r}:no heading")
            check(f"[{w} {scheme}] all {len(ROUTES)} routes render with a heading, no horizontal scroll", not bad, ", ".join(bad))
            check(f"[{w} {scheme}] no console errors across routes", not errs, "; ".join(errs[:4]))
            # dark mode really dark / light really light
            bg = pg.evaluate("getComputedStyle(document.body).color")
            check(f"[{w} {scheme}] text colour follows theme", (bg == "rgb(245, 245, 247)") == (scheme == "dark"), bg)
            ctx.close()

    # ---------- Desktop redirect + phone start screen ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#aadhaar")
    check("desktop #aadhaar redirects to first unfinished section", pg.evaluate("location.hash") == "#aadhaar.address.bring", pg.evaluate("location.hash"))
    go(pg, "#passport.renewal.go")
    check("deep link straight into a section", "Go" in heading(pg) and pg.evaluate("location.hash") == "#passport.renewal.go")
    ctx.close()
    ctx, pg, errs = new_page(b, 390, 844, "light")
    go(pg, "#aadhaar")
    check("phone #aadhaar shows start screen at #aadhaar.address", pg.evaluate("location.hash") == "#aadhaar.address" and pg.inner_text("#start-btn") == "Start", pg.evaluate("location.hash"))
    check("phone tab bar hidden inside a guide", not pg.is_visible("#tabbar"))
    go(pg, "#guides")
    check("phone tab bar visible outside a guide", pg.is_visible("#tabbar"))
    ctx.close()

    # ---------- Back button and scroll restore ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#home", 800)
    card = pg.query_selector("a.brow[href='#passport']"); card.scroll_into_view_if_needed(); pg.wait_for_timeout(1400)
    y0 = pg.evaluate("scrollY")
    pg.click("a.brow[href='#passport']"); pg.wait_for_timeout(500)
    check("click task row opens guide", pg.evaluate("location.hash").startswith("#passport.first."))
    pg.click("a.srow[href='#passport.first.pay']"); pg.wait_for_timeout(300)
    pg.go_back(); pg.wait_for_timeout(400)
    check("Back returns to previous section", pg.evaluate("location.hash") == "#passport.first.bring", pg.evaluate("location.hash"))
    pg.go_back(); pg.wait_for_timeout(500)
    y1 = pg.evaluate("scrollY")
    check("Back to home restores scroll position", pg.evaluate("location.hash") == "#home" and abs(y1 - y0) < 5, f"before {y0}, after {y1}")
    # arrow keys
    go(pg, "#aadhaar.address.bring")
    pg.click("body", position={"x": 5, "y": 400})
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    check("→ moves to next section", pg.evaluate("location.hash") == "#aadhaar.address.go", pg.evaluate("location.hash"))
    check("focus moves to the section heading", pg.evaluate("document.activeElement.id") == "sec-h")
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(300)
    check("← moves to previous section", pg.evaluate("location.hash") == "#aadhaar.address.bring")
    # arrow keys ignored in a field
    go(pg, "#fair-price"); pg.click("#fq-amt"); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(150)
    check("arrow keys ignored inside a field", pg.evaluate("location.hash") == "#fair-price")
    # shortcuts
    go(pg, "#about"); pg.keyboard.press("?"); pg.wait_for_timeout(150)
    check("? opens keyboard shortcuts", pg.is_visible("#sc-h"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(450)
    check("Esc closes shortcuts", not pg.query_selector("#sc-h"))
    ctx.close()

    # ---------- Ticking, pick-one groups, clearing, Undo ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#aadhaar.address.bring")
    check("Bring answer line", pg.inner_text(".answer-line").startswith("2 things to carry"), pg.inner_text(".answer-line"))
    tick(pg, "card")
    check("tick one item: 1 of 2 packed", count(pg) == "1 of 2 packed", count(pg))
    tick(pg, "otp")
    check("optional item doesn't count", count(pg) == "1 of 2 packed", count(pg))
    tick(pg, "poa:voter")
    pg.wait_for_timeout(400)
    check("pick-one group: one option completes it", count(pg) == "2 of 2 packed", count(pg))
    check("PACKED stamp lands", pg.query_selector("#packed-slot .stamp") is not None)
    check("first pack slams the stamp", pg.query_selector("#packed-slot .stamp.slam") is not None)
    check("toast says All packed with See ticket", toast(pg) == "All packed" and pg.inner_text(".toast-act") == "See ticket", toast(pg))
    check("group shows Packed", "Packed" in pg.inner_text("[data-gstate='poa']"))
    tick(pg, "poa:passport")
    check("second option in group keeps 2 of 2", count(pg) == "2 of 2 packed")
    check("side panel row updates live", "2 of 2 packed" in pg.inner_text("#g-side"))
    pg.click("#clear-btn"); pg.wait_for_timeout(200)
    check("Clear ticks empties the list", count(pg) == "0 of 2 packed" and toast(pg) == "Ticks cleared", toast(pg))
    click_toast_action(pg)
    check("Undo restores ticks", count(pg) == "2 of 2 packed" and pg.is_checked("#ck-aadhaar-address-poa-voter"))
    tick(pg, "card"); tick(pg, "card"); pg.wait_for_timeout(300)
    check("repeat completion: stamp without slam", pg.query_selector("#packed-slot .stamp") is not None and pg.query_selector("#packed-slot .stamp.slam") is None)
    # survive reload
    pg.reload(); pg.wait_for_timeout(400)
    check("ticks survive a reload", count(pg) == "2 of 2 packed")
    ctx.close()

    # ---------- My documents + Fill, Undo ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#aadhaar.name-dob.bring")
    pg.click("#fill-btn"); pg.wait_for_timeout(150)
    check("Fill with no documents asks to add them", "My documents first" in toast(pg), toast(pg))
    go(pg, "#documents"); pg.wait_for_timeout(400)
    pg.click("label[for='pg-doc-aadhaar']"); pg.click("label[for='pg-doc-voter']"); pg.wait_for_timeout(100)
    check("My documents counts ticks", "2 of 11 ticked" in pg.inner_text("[data-docs-count]"))
    check("My documents shows 7 then Show all", len(pg.query_selector_all("[data-doc]")) == 7 and pg.is_visible("#pg-docs-all"))
    pg.click("#pg-docs-all"); pg.wait_for_timeout(100)
    check("Show all reveals 11 documents", len(pg.query_selector_all("[data-doc]")) == 11)
    go(pg, "#aadhaar.name-dob.bring")
    check("matching items show You have it", pg.inner_text(".checklist").count("You have it") == 2, pg.inner_text(".checklist").count("You have it"))
    pg.click("#fill-btn"); pg.wait_for_timeout(300)
    check("Fill from my documents ticks 2", toast(pg) == "Ticked 2 from My documents" and count(pg) == "2 of 2 packed", toast(pg) + " / " + count(pg))
    click_toast_action(pg)
    check("Undo removes the filled ticks", count(pg) == "0 of 2 packed", count(pg))
    stored = pg.evaluate("localStorage.getItem('bgp.v1')")
    check("only document ids are stored, no numbers", '"docs":{"aadhaar":true,"voter":true}' in stored)
    ctx.close()

    # ---------- Day picker + calendar link (IST), device in New York ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light", {"timezone_id": "America/New_York"})
    pg.goto(URL + "?now=2026-10-22T08:00:00%2B05:30#home"); pg.wait_for_timeout(300)
    st = pg.inner_text("#status-line")
    check("status line uses IST even when device is in New York", st.startswith("Thursday, 8:00 AM in Bengaluru."), st)
    pg.goto(URL + NOW + "#aadhaar.address.go"); pg.wait_for_timeout(300)
    chips = pg.query_selector_all(".chips .chip")
    check("7 day chips", len(chips) == 7)
    pg.click("#day-2026-10-24"); pg.wait_for_timeout(450)
    led1 = pg.inner_text(".led-l1"); led2 = pg.inner_text(".led-l2")
    check("LED shows the chosen date", led1 == "SAT 24 OCT", led1)
    href = pg.get_attribute("#cal-guide", "href")
    q = parse_qs(urlparse(href).query)
    t = led2.strip()
    hh, mm_ap = t.split(":"); mm, ap = mm_ap.split(" ")
    h24 = (int(hh) % 12) + (12 if ap == "PM" else 0)
    exp_start = f"20261024T{h24:02d}{mm}00"
    exp_end = f"20261024T{h24+1:02d}{mm}00"
    check("calendar link has the IST date and time", q["dates"][0] == f"{exp_start}/{exp_end}" and q["ctz"][0] == "Asia/Kolkata", q["dates"][0] + " vs " + exp_start)
    check("calendar details carry bring list, fee and estimate note", "Bring:" in q["details"][0] and "₹75" in q["details"][0] and "estimate" in q["details"][0])
    check("calendar location is the office address", "Pattalamma" in q["location"][0])
    alt = pg.query_selector(".alts button")
    alt_txt = alt.inner_text().split(",")[0]
    alt.click(); pg.wait_for_timeout(450)
    check("alternative slot becomes the LED time", pg.inner_text(".led-l2") == alt_txt, pg.inner_text(".led-l2") + " vs " + alt_txt)
    pg.click("#off-ask-majestic"); pg.wait_for_timeout(400)
    check("office switch updates status line", "Majestic" in pg.inner_text(".office-status"))
    check("Go row in side panel shows Sat", "Sat" in pg.inner_text("#g-side"), pg.inner_text("#g-side"))
    check("Go marked done after picking", pg.query_selector(".srow[href='#aadhaar.address.go'] .srow-ck") is not None)
    pg.click("summary:has-text('Whole week')"); pg.wait_for_timeout(100)
    cells = pg.query_selector_all(".heat-c")
    lab = cells[20].get_attribute("aria-label") if len(cells) > 20 else ""
    check("heatmap cells have accessible labels", len(cells) == 7 * 15 and re.search(r", (quiet|moderate|busy|packed|closed)", lab or ""), lab)
    check("heatmap marks one best slot", len(pg.query_selector_all(".heat-c.best")) == 1)
    pg.click("button[data-copy]"); pg.wait_for_timeout(250)
    check("Copy address confirms in place", "Copied" in pg.inner_text("button[data-copy]"), pg.inner_text("button[data-copy]"))
    # PSK closed on weekends
    pg.goto(URL + NOW + "#passport.first.go"); pg.wait_for_timeout(300)
    sat = pg.query_selector("#day-2026-10-24")
    check("PSK weekend chips disabled and labelled Closed", sat.is_disabled() and "Closed" in sat.inner_text())
    # late in the day: today closed
    pg.goto(URL + "?now=2026-10-22T17:10:00%2B05:30#best-time.ask-southend"); pg.wait_for_timeout(300)
    today = pg.query_selector(".chips .chip")
    check("after last slot, today is 'Closed for today'", today.is_disabled() and "Closed for today" in today.inner_text(), today.inner_text())
    ctx.close()

    # ---------- Quote verdicts ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#fair-price")
    for amt, want in [("50", "below"), ("75", "exact"), ("120", "fair"), ("150", "fair"), ("200", "high"), ("250", "high"), ("400", "over")]:
        pg.fill("#fq-amt", amt); pg.click("[data-act='qcheck'][data-q='fq']"); pg.wait_for_timeout(120)
        v = pg.get_attribute("#fq-out .verdict", "data-verdict")
        check(f"quote ₹{amt} on Aadhaar address -> {want}", v == want, v)
    pg.wait_for_timeout(1000)
    check("keep ₹X shows the difference", "₹325" in pg.inner_text(".keep"), pg.inner_text(".keep"))
    check("line to say", "The official fee is ₹75. I'm happy to pay up to ₹150" in pg.inner_text(".say"))
    pg.fill("#fq-amt", "12a3"); pg.wait_for_timeout(50)
    check("amount field keeps digits only", pg.input_value("#fq-amt") == "123", pg.input_value("#fq-amt"))
    check("amount field is numeric input with a label", pg.get_attribute("#fq-amt", "inputmode") == "numeric" and pg.query_selector("label[for='fq-amt']") is not None)
    pg.click("#ft-pan"); pg.wait_for_timeout(150)
    pg.fill("#fq-amt", "0"); pg.keyboard.press("Enter"); pg.wait_for_timeout(120)
    check("e-PAN ₹0 is exact", pg.get_attribute("#fq-out .verdict", "data-verdict") == "exact")
    pg.click("#ft-passport"); pg.wait_for_timeout(150)
    pg.select_option("#fp-age", "senior"); pg.wait_for_timeout(150)
    check("passport 60+ first: ₹2,250", "₹2,250" in pg.inner_text(".answer-line"), pg.inner_text(".answer-line"))
    pg.select_option("#fp-age", "u18"); pg.wait_for_timeout(150)
    check("passport under 18 forces 36 pages, ₹1,750", "₹1,750" in pg.inner_text(".answer-line") and pg.is_disabled("#fp-pages option[value='60']"))
    pg.click("[data-act='qpick'][data-amt='3250']"); pg.wait_for_timeout(150)
    check("quick pick high limit (official + 1,500)", pg.get_attribute("#fq-out .verdict", "data-verdict") == "high")
    # home quote checker passes values in memory
    go(pg, "#home")
    pg.select_option("#hq-task", "aadhaar"); pg.fill("#hq-amt", "500"); pg.click("form[data-form='hq'] button"); pg.wait_for_timeout(400)
    check("home quote opens Fair price prefilled, not via URL", pg.evaluate("location.hash") == "#fair-price" and pg.get_attribute("#fq-out .verdict", "data-verdict") == "over")
    ctx.close()

    # ---------- Save, share, remove + Undo, stamp flips ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#aadhaar.address.ticket", 900)
    check("ticket stamp says items left", "2 ITEMS LEFT" in pg.inner_text("#the-slip .stamp"))
    check("token format AAD-dddd", re.search(r"AAD-\d{4}", pg.inner_text(".slip-token")))
    pg.click("#save-d"); pg.wait_for_timeout(200)
    check("Save ticket toast", toast(pg) == "Saved to My tickets", toast(pg))
    check("ticket row marked done", pg.query_selector(".srow[href='#aadhaar.address.ticket'] .srow-ck") is not None)
    pg.click("#share-t"); pg.wait_for_timeout(300)
    check("Share falls back to clipboard on desktop and confirms in place", "Copied" in pg.inner_text("#share-t"), pg.inner_text("#share-t"))
    clip = pg.evaluate("navigator.clipboard.readText()")
    check("shared text has token, bring, go, pay", "Token AAD-" in clip and "BRING:" in clip and "PAY: Official total ₹75" in clip, clip[:80])
    go(pg, "#tickets")
    check("My tickets lists the trip with live stamp", "2 ITEMS LEFT" in pg.inner_text(".trip-card .stamp"))
    go(pg, "#aadhaar.address.bring")
    tick(pg, "card"); tick(pg, "poa:ration")
    go(pg, "#tickets")
    check("late tick flips stamp to READY TO GO", "READY TO GO" in pg.inner_text(".trip-card .stamp"), pg.inner_text(".trip-card .stamp"))
    go(pg, "#aadhaar.address.ticket", 200)
    check("changed ticket feeds out of the slot", pg.query_selector("#the-slip.feed") is not None)
    go(pg, "#tickets", 100); go(pg, "#aadhaar.address.ticket", 200)
    check("unchanged ticket does not animate", pg.query_selector("#the-slip.feed") is None)
    go(pg, "#tickets")
    pg.click("[data-act='tremove']"); pg.wait_for_timeout(150)
    check("Remove empties list with Undo toast", "No saved trips yet" in pg.inner_text(".answer-line") and toast(pg) == "Removed from My tickets")
    click_toast_action(pg)
    check("Undo brings the trip back", len(pg.query_selector_all(".trip-card")) == 1)
    # print only the slip
    go(pg, "#aadhaar.address.ticket", 900)
    pg.emulate_media(media="print"); pg.wait_for_timeout(100)
    vis = pg.evaluate("""() => ({slip: getComputedStyle(document.querySelector('#the-slip')).display,
        side: getComputedStyle(document.querySelector('#g-side')).display,
        top: getComputedStyle(document.querySelector('#topbar')).display,
        plate: getComputedStyle(document.querySelector('#sec-h')).display,
        btns: getComputedStyle(document.querySelector('.ticket-actions')).display})""")
    check("print shows only the slip", vis["slip"] != "none" and vis["side"] == "none" and vis["top"] == "none" and vis["plate"] == "none" and vis["btns"] == "none", json.dumps(vis))
    pg.emulate_media(media="screen")
    ctx.close()

    # ---------- Phone: swipe, bottom bar, share ----------
    ctx, pg, errs = new_page(b, 390, 844, "light")
    go(pg, "#aadhaar.address.bring", 500)
    check("swipe hint shows once", pg.query_selector("#swipe-hint") is not None)
    def swipe(dx, start_sel="#sec-h"):
        el0 = pg.query_selector(start_sel); el0.scroll_into_view_if_needed(); pg.wait_for_timeout(60)
        box = el0.bounding_box()
        x0, y0 = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        pg.evaluate("""([x0,y0,dx]) => {
          const el = document.elementFromPoint(x0,y0);
          const mk = (x,y) => new Touch({identifier:1,target:el,clientX:x,clientY:y});
          el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[mk(x0,y0)],changedTouches:[mk(x0,y0)]}));
          el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[mk(x0+dx,y0+4)]}));
        }""", [x0, y0, dx])
        pg.wait_for_timeout(300)
    swipe(-120)
    check("swipe left goes to next section", pg.evaluate("location.hash") == "#aadhaar.address.go", pg.evaluate("location.hash"))
    swipe(-40)
    check("short swipe ignored", pg.evaluate("location.hash") == "#aadhaar.address.go")
    swipe(-120, ".chips .chip")
    check("swipe starting on a chip ignored", pg.evaluate("location.hash") == "#aadhaar.address.go")
    swipe(120)
    check("swipe right goes back a section", pg.evaluate("location.hash") == "#aadhaar.address.bring")
    go(pg, "#aadhaar.address.bring", 300)
    check("swipe hint not shown again", pg.query_selector("#swipe-hint") is None)
    check("bottom bar Next: Go", pg.inner_text("#next-m") == "Next: Go")
    go(pg, "#aadhaar.address.ticket", 300)
    check("last section bottom bar reads Save ticket", pg.inner_text("#save-m") == "Save ticket")
    go(pg, "#aadhaar.address", 300)
    check("start button says Continue after starting", pg.inner_text("#start-btn") == "Continue")
    tgt = [pg.evaluate("el => el.getBoundingClientRect().height", e) for e in pg.query_selector_all(".srow, .seg button, #start-btn")]
    check("tap targets ≥ 44px on start screen", min(tgt) >= 44, str(min(tgt)))
    fs = pg.evaluate("Math.min(...[...document.querySelectorAll('input,select')].map(e=>parseFloat(getComputedStyle(e).fontSize)))") if pg.query_selector("input,select") else 16
    go(pg, "#fair-price"); fs = pg.evaluate("Math.min(...[...document.querySelectorAll('input,select')].map(e=>parseFloat(getComputedStyle(e).fontSize)))")
    check("inputs use ≥16px text (no iOS zoom)", fs >= 16, str(fs))
    ctx.close()

    # ---------- Search ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#about")
    pg.keyboard.press("/"); pg.wait_for_timeout(150)
    check("/ opens search overlay", pg.is_visible("#ov-q"))
    def search(q):
        pg.fill("#ov-q", q); pg.wait_for_timeout(80)
        return [e.inner_text() for e in pg.query_selector_all("#ov-q-pop .sr-title")], pg.inner_text("#ov-q-pop")
    for q, must in [("aadhar", "Aadhaar update"), ("adhar", "Aadhaar update"), ("itr", "Late tax return"), ("tatkal", "Passport: Tatkal"), ("psk", "Passport Seva Kendra"), ("pasport", "Passport"), ("ಆಧಾರ್", "Aadhaar update"), ("aadhaar address", "Aadhaar update: Address")]:
        titles, txt = search(q)
        check(f"search '{q}' finds {must}", any(must in t for t in titles) and len(titles) <= 6, "; ".join(titles))
    titles, txt = search("psk")
    check("search groups Guides and Offices", "Guides" in txt and "Offices" in txt)
    titles, txt = search("xyz")
    check("no-match message", 'No guide for “xyz” yet. Try Aadhaar, PAN, passport, rent or tax.' in txt, txt)
    titles, txt = search("tatkal")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    check("Enter opens the top result", pg.evaluate("location.hash").startswith("#passport.tatkal"), pg.evaluate("location.hash"))
    pg.go_back(); pg.wait_for_timeout(300)
    check("Back after search returns to the page you searched from", pg.evaluate("location.hash") == "#about", pg.evaluate("location.hash"))
    pg.keyboard.press("Control+k"); pg.wait_for_timeout(150)
    check("Ctrl+K opens search", pg.is_visible("#ov-q"))
    titles, txt = search("")
    check("empty search shows recent guides", "Recent guides" in txt and "Passport: Tatkal" in txt, txt[:80])
    pg.keyboard.press("ArrowDown"); pg.keyboard.press("Escape"); pg.wait_for_timeout(450)
    check("Esc closes search", not pg.query_selector("#ov-q"))
    pg.keyboard.press("/"); pg.wait_for_timeout(200); pg.go_back(); pg.wait_for_timeout(500)
    check("browser Back closes search and stays on page", not pg.query_selector("#ov-q") and pg.evaluate("location.hash") == "#about")
    go(pg, "#home")
    pg.click("#home-q"); pg.keyboard.type("adhar"); pg.wait_for_timeout(100)
    check("home search shows inline results", pg.is_visible("#home-q-pop") and "Aadhaar update" in pg.inner_text("#home-q-pop"))
    ctx.close()

    # ---------- Settings: theme, text size, reduced motion, clear all + Undo ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#aadhaar.address.bring")
    tick(pg, "card")
    pg.click("#tb-settings"); pg.wait_for_timeout(200)
    check("settings opens as a side panel over the page", pg.is_visible("#set-h") and pg.evaluate("location.hash") == "#settings" and pg.query_selector(".checklist") is not None)
    pg.click("#set-theme-dark"); pg.wait_for_timeout(100)
    check("theme Dark sets data-theme", pg.evaluate("document.documentElement.dataset.theme") == "dark")
    pg.wait_for_timeout(600)
    check("dark theme repaints", pg.evaluate("getComputedStyle(document.body).color") == "rgb(245, 245, 247)")
    pg.click("#set-theme-device"); pg.wait_for_timeout(100)
    check("theme Device removes override", pg.evaluate("document.documentElement.dataset.theme") is None)
    pg.click("#set-text-larger"); pg.wait_for_timeout(100)
    check("text size Larger scales root font", pg.evaluate("getComputedStyle(document.documentElement).fontSize") == "20px")
    pg.click("#set-text-normal"); pg.click("#set-motion-reduced"); pg.wait_for_timeout(100)
    check("motion Reduced adds class", pg.evaluate("document.documentElement.classList.contains('rm')"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(600)
    check("Esc closes settings and returns to the guide", pg.evaluate("location.hash") == "#aadhaar.address.bring" and not pg.query_selector("#set-h"))
    # reduced: complete the pack, nothing animates
    tick(pg, "poa:ration")
    anims = pg.evaluate("document.getAnimations().filter(a => a.effect && a.effect.getTiming().duration > 0).length")
    check("reduced motion: no running animations after pack", anims == 0, str(anims))
    go(pg, "#aadhaar.address.go")
    pg.click("#day-2026-10-26"); pg.wait_for_timeout(30)
    check("reduced motion: LED settles instantly", pg.inner_text(".led-l1") == "MON 26 OCT", pg.inner_text(".led-l1"))
    go(pg, "#aadhaar.address.ticket", 100)
    check("reduced motion: slip does not feed", pg.query_selector("#the-slip.feed") is None)
    # clear all + undo
    go(pg, "#settings")
    pg.click("#clear-all"); pg.wait_for_timeout(250)
    check("Clear all data asks first", pg.is_visible("#cc-yes") and json.loads(pg.evaluate("localStorage.getItem('bgp.v1')"))["ticks"] != {})
    pg.click("#cc-yes"); pg.wait_for_timeout(250)
    stored = json.loads(pg.evaluate("localStorage.getItem('bgp.v1')"))
    check("Clear all data wipes state", stored["ticks"] == {} and stored["settings"]["motion"] == "full" and toast(pg) == "All data cleared")
    click_toast_action(pg)
    stored = json.loads(pg.evaluate("localStorage.getItem('bgp.v1')"))
    check("Undo restores all data", stored["ticks"].get("aadhaar.address", {}).get("card") and stored["settings"]["motion"] == "reduced")
    pg.reload(); pg.wait_for_timeout(300)
    check("settings survive reload", pg.evaluate("document.documentElement.classList.contains('rm')"))
    ctx.close()

    # ---------- Full motion runs ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    go(pg, "#home", 200)
    check("first desktop visit prints the specimen slip", pg.query_selector(".machine .slip-wrap.feed-slow") is not None)
    go(pg, "#about", 100); go(pg, "#home", 200)
    check("specimen print plays only once", pg.query_selector(".machine .slip-wrap.feed-slow") is None)
    pg.click("#ex-passport"); pg.wait_for_timeout(100)
    check("example button reprints a passport slip", "PSP-" in pg.inner_text("#machine-out") and pg.query_selector(".machine .slip-wrap.feed-slow") is not None)
    ctx.close()

    # ---------- localStorage throws ----------
    ctx, pg, errs = new_page(b, 1440, 900, "light")
    pg.add_init_script("Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError')}});")
    go(pg, "#aadhaar.address.bring")
    tick(pg, "card"); tick(pg, "poa:voter")
    check("works without storage: ticking", count(pg) == "2 of 2 packed")
    pg.click("a.srow[href='#aadhaar.address.ticket']"); pg.wait_for_timeout(200)
    pg.click("#save-d"); pg.wait_for_timeout(100)
    go_ok = pg.evaluate("location.hash") == "#aadhaar.address.ticket"
    pg.click("a[data-nav='tickets']"); pg.wait_for_timeout(200)
    check("works without storage: save and list a ticket", go_ok and len(pg.query_selector_all(".trip-card")) == 1)
    pg.click("#tb-settings"); pg.wait_for_timeout(150)
    check("settings explain storage is off", "not letting the page save" in pg.inner_text(".sheet-body"))
    check("no errors when storage throws", not errs, "; ".join(errs[:3]))
    ctx.close()

    b.close()

ok = sum(1 for r in results if r[0])
for passed, name, detail in results:
    print(("PASS " if passed else "FAIL ") + name + ("" if passed or not detail else "  -> " + str(detail)))
print(f"\n{ok}/{len(results)} passed")
