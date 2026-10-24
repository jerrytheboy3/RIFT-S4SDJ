import sys, pathlib
from playwright.sync_api import sync_playwright
url = pathlib.Path(sys.argv[1]).as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width":1440,"height":900}); errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error","warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(url + "#home"); pg.wait_for_timeout(1200)
    for r in ["#guides","#aadhaar","#aadhaar.address.go","#aadhaar.address.pay","#aadhaar.address.steps","#aadhaar.address.ticket","#best-time","#best-time.psk-lalbagh","#fair-price","#tickets","#documents","#about","#settings","#passport.tatkal.pay","#itr.belated.go","#rent.lease.pay","#pan.instant.bring","#dl.test.go","#voter.new.steps","#eduloan.apply.pay","#nope"]:
        pg.goto(url + r); pg.wait_for_timeout(250)
    print("ERRORS:", errs)
    b.close()
