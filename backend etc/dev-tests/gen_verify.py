"""Write supabase/TO_VERIFY.md from the extracted data, so every number in it is exact."""
import json, re, sys, pathlib
OUT = pathlib.Path(sys.argv[1])
d = json.load(open("test/extracted.json"))
s = json.load(open("test/seed_rules.json"))
rules, summ = s["rules"], s["summary"]
inr = lambda n: "₹" + format(int(n), ",")
L = []
L.append("""# Things to verify

`02_seed.sql` copies the website's code exactly: no fee or rule was changed or invented.
Some of that data still needs a human check, because it has no source link, is a team
estimate, or will go out of date. Check each item on the official website, then fix it in
Supabase: **Table Editor**, pick the table, click the cell, and set `verified_on` to the day you checked.

Fees were last checked on """ + d["fees_checked"] + " (Aadhaar, PAN, passport, rent, tax return) and " + d["new_checked"] + """
(driving licence, voter ID, education loan).
""")

L.append("## 1. Offices have no source link and no check date\n")
L.append("Table `offices`: `source_url` and `verified_on` are empty for all " + str(len(d["offices"])) + ". Check the address, days and hours of each.\n")
L.append("| Office | Address | Hours in the data |\n|---|---|---|")
for o in d["offices"]:
    L.append("| " + o["name"] + " | " + o["address"] + " | " + o["hours"] + " (" + o["opens_at"] + "–" + o["closes_at"] + ") |")
L.append("\nWhere to check: Aadhaar centres on uidai.gov.in, Passport Seva Kendras on passportindia.gov.in.")
for o in d["offices"]:
    if o["notice"]: L.append("Also check the notice on " + o["short_name"] + ": \"" + o["notice"] + "\"")
L.append("")

L.append("## 2. Fair-price bands are team estimates, not official\n")
L.append("Table `cases`, columns `fair_margin` and `high_margin`. A quote up to official fee + `fair_margin` is called fair; from official fee + `high_margin` it is called too high. The site already labels these as pilot estimates.\n")
L.append("| Guide | Case | Fair up to | Too high from |\n|---|---|---|---|")
for t in d["tasks"]:
    for c in t["cases"]:
        if c["fair_margin"] is None: continue
        b = c.get("band_check")
        if t["slug"] == "passport": L.append("| " + t["name"] + " | " + c["name"] + " | official fee + " + inr(c["fair_margin"]) + " | official fee + " + inr(c["high_margin"]) + " |")
        else: L.append("| " + t["name"] + " | " + c["name"] + " | " + inr(b["f"]) + " | " + inr(b["h"]) + " |")
L.append("")

L.append("## 3. Helpline numbers have no source link\n")
L.append("Table `tasks`, columns `helpline_label` and `helpline_number`. There is no `source_url` for these.\n")
for t in d["tasks"]:
    if t["helpline_number"]: L.append("- " + t["helpline_label"] + ": " + t["helpline_number"] + " (" + t["name"] + ")")
L.append("")

L.append("## 4. Driving licence fees are not in the data\n")
L.append("We could not confirm them, so the guide says \"check on Sarathi\" instead of guessing. If you confirm the amounts on sarathi.parivahan.gov.in, add `fee` rows with `amount`, `source_url` and `verified_on`.\n")

home = [r for r in rules if r.get("source_url")]
L.append("## 5. Every source link is a home page, not the exact page\n")
L.append(str(len(home)) + " rows have a `source_url`, and every one is a website's home page (like https://uidai.gov.in). The project never guessed deep links. When you check a fact, replace its `source_url` with the exact page you checked.\n")
alt = [r for r in rules if r.get("source_url") == "https://www.incometaxindia.gov.in"]
L.append("Two choices I made that you should confirm:")
L.append("- " + str(len(alt)) + " rows about section 80E (education loan) point to incometaxindia.gov.in instead of pmvidyalaxmi.co.in, because the About page cites incometaxindia.gov.in for section 80E.")
L.append("- On the PAN price list, \"Instant e-PAN\" points to incometax.gov.in and the other PAN rows to Protean. Those rows are sold on UTIITSL too.\n")

L.append("## 6. Dates that will go out of date\n")
dated = []
for r in rules:
    for k in ("label", "value", "notes", "group_label"):
        v = r.get(k) or ""
        if re.search(r"\b(20\d\d|FY \d{4}|AY \d{4})\b", v) and not v.startswith("http"):
            dated.append((r["task"], v)); break
for o in d["offices"]:
    if o["notice"] and re.search(r"20\d\d", o["notice"]): dated.append(("office", o["notice"]))
seen = set()
for t, v in dated:
    if v in seen: continue
    seen.add(v); L.append("- (" + t + ") " + v)
L.append("- (passport) Passport fees were revised on 1 July 2026 (the note under the Fair price fee table).")
L.append("\nThe tax return guide is for FY 2025-26 with a deadline of " + d["itr_deadline"] + ". After that date the whole guide needs updating for the next year.\n")

L.append("## 7. Kept in the code on purpose (not in the database)\n")
L.append("""- **Rush-hour estimates.** They come from a formula, not from data about the offices. The site labels them "Estimate, not live data". `offices.best_time_to_visit` stays empty until you have real data.
- **Calculator rules.** The learner's licence tool (apply from 30 days, valid 6 months) and the voter tool (qualifying dates 1 Jan, 1 Apr, 1 Jul, 1 Oct; apply from 17) do maths with these rules. The same facts appear as sentences in the `rules` table. If a rule changes, update both.
- **The 12 sponsored partners.** They are fictional demo data.
- **Page text.** The About page, the SDG section, button labels, search keywords and the "My documents" types.
- **The home-page fee ticker and the Fair price fee table** were copies of the fees. In step 4 they will be built from the database, so they can't drift apart again.
""")

L.append("## 8. Translations\n")
L.append(str(summ["translations"]) + " sentences have Hindi and Kannada in the `translations` table. " + str(len(summ["untranslated"])) +
         " names stay the same in every language (" + ", ".join(summ["untranslated"][:8]) + ", …). When you change an English sentence anywhere, add a `translations` row for the new text. Until you do, that sentence shows in English.\n")
L.append("These translations were machine-written and should be checked by native Hindi and Kannada speakers.\n")
(OUT / "TO_VERIFY.md").write_text("\n".join(L))
print("written", sum(1 for _ in L), "blocks;", len(home), "rows with home-page sources;", len(seen), "dated items")
