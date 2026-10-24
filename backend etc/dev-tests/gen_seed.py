"""Turn test/extracted.json (read from the live site) into supabase/02_seed.sql and supabase/TO_VERIFY.md."""
import json, re, sys, pathlib
OUT = pathlib.Path(sys.argv[1])
d = json.load(open("test/extracted.json"))
ITINDIA = "https://www.incometaxindia.gov.in"

def q(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(int(v)) if float(v).is_integer() else str(v)
    return "'" + str(v).replace("'", "''") + "'"

def source_for(row, default):
    text = " ".join(str(row.get(k) or "") for k in ("label", "value", "notes", "group_label"))
    return ITINDIA if "80E" in text else default

RULE_COLS = ["type", "key", "group_label", "label", "value", "amount", "amount_max", "notes", "optional", "my_doc", "source_url", "verified_on", "sort_order"]
def rules_block(title, rows, where, task_level):
    lines = [f"-- {title} ({len(rows)} rows)",
             "insert into rules (task_id, case_id, " + ", ".join(RULE_COLS) + ")",
             ("select t.id, null, " if task_level else "select c.task_id, c.id, ") +
             "v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int",
             ("from tasks t, (values" if task_level else "from cases c join tasks t on t.id = c.task_id, (values")]
    lines.append(",\n".join("  (" + ", ".join(q(r.get(c, False) if c == "optional" else r.get(c)) for c in RULE_COLS) + ")" for r in rows))
    lines.append(") as v(" + ", ".join(RULE_COLS) + ")")
    lines.append(where + ";")
    return "\n".join(lines)

sql = []
sql.append("""-- =====================================================================
-- Bring Go Pay: starting data (step 3)
--
-- How to run: after 01_schema.sql, open SQL Editor -> New query ->
-- paste this whole file -> Run. Run it once, when you set things up.
--
-- WARNING: it first EMPTIES the six tables, then fills them with the
-- data that was in the website's code. Running it again later would
-- wipe any edits you made in the dashboard since.
--
-- Every fee, document and sentence here was copied by a script straight
-- out of the website's code. Nothing was changed, rounded or added.
-- Fees checked: """ + d["fees_checked"] + """ (Aadhaar, PAN, passport, rent, tax return)
--               """ + d["new_checked"] + """ (driving licence, voter ID, education loan)
-- What still needs checking is listed in TO_VERIFY.md.
--
-- About source_url: each row points to the official website the guide
-- cites for it. These are home pages, not the exact page, because the
-- project never guessed deep links. Offices have no source in the code,
-- so their source_url is empty.
-- =====================================================================
begin;

truncate translations, office_tasks, rules, cases, offices, tasks restart identity cascade;
""")

# Guides
cols = ["slug", "name", "short_description", "short_name", "mode", "price_summary", "ticket_prefix", "helpline_label", "helpline_number", "source_name", "fair_price_check", "no_check_reason", "sort_order"]
sql.append("-- ---------------------------------------------------------------------\n-- Guides (" + str(len(d["tasks"])) + ")\n-- ---------------------------------------------------------------------")
sql.append("insert into tasks (" + ", ".join(cols) + ") values\n" + ",\n".join("  (" + ", ".join(q(t[c]) for c in cols) + ")" for t in d["tasks"]) + ";\n")

# Cases
ccols = ["slug", "name", "label", "visit_mode", "ready_at_home", "no_docs_text", "note", "full_list_url", "full_list_text", "tool", "fair_margin", "high_margin", "sort_order"]
ncase = sum(len(t["cases"]) for t in d["tasks"])
sql.append("-- ---------------------------------------------------------------------\n-- Versions of each guide (" + str(ncase) + ")\n-- fair_margin and high_margin are the Fair price bands: team estimates.\n-- ---------------------------------------------------------------------")
sql.append("insert into cases (task_id, " + ", ".join(ccols) + ")\nselect t.id, " + ", ".join("v." + c + ("::int" if c in ("fair_margin", "high_margin", "sort_order") else "::boolean" if c == "ready_at_home" else "") for c in ccols) +
           "\nfrom tasks t, (values\n" + ",\n".join("  (" + q(t["slug"]) + ", " + ", ".join(q(c[k]) for k in ccols) + ")" for t in d["tasks"] for c in t["cases"]) +
           "\n) as v(task_slug, " + ", ".join(ccols) + ")\nwhere t.slug = v.task_slug;\n")

# Offices
ocols = ["slug", "name", "short_name", "office_type", "area", "address", "hours", "open_days", "opens_at", "closes_at", "how_to_visit", "notice", "notice_short", "sort_order"]
def oq(o, c):
    if c == "open_days": return "'{" + ",".join(str(x) for x in o[c]) + "}'"
    return q(o[c])
sql.append("-- ---------------------------------------------------------------------\n-- Offices (" + str(len(d["offices"])) + ")\n-- Days: 0 = Sunday ... 6 = Saturday. No source link or check date in the\n-- code for these, so source_url and verified_on stay empty (see TO_VERIFY.md).\n-- ---------------------------------------------------------------------")
sql.append("insert into offices (" + ", ".join(ocols) + ") values\n" + ",\n".join("  (" + ", ".join(oq(o, c) for c in ocols) + ")" for o in d["offices"]) + ";\n")
pairs = [(o, t["slug"]) for t in d["tasks"] for o in t["offices"]]
sql.append("-- Which office handles which guide\ninsert into office_tasks (office_id, task_id)\nselect o.id, t.id from (values\n" +
           ",\n".join("  (" + q(o) + ", " + q(t) + ")" for o, t in pairs) + "\n) as v(office_slug, task_slug)\njoin offices o on o.slug = v.office_slug\njoin tasks t on t.slug = v.task_slug;\n")

# Facts
price_tables = {pt["caption"]: pt for pt in d["price_list"]}
caption_for = {"aadhaar": "Aadhaar", "pan": "PAN", "passport": "Passport", "rent": "Rent agreement", "itr": "Late tax return, FY 2025-26"}
all_rules = []
for t in d["tasks"]:
    sql.append("-- =====================================================================\n-- " + t["name"] + "\n-- =====================================================================")
    first_src = t["cases"][0]["full_list_url"]
    trows, n = [], 0
    for l in t["links"]:
        n += 1; trows.append(dict(type="link", key="official", label=l["label"], value=l["value"], verified_on=t["verified_on"], sort_order=n))
    for term in t["terms"]:
        n += 1; trows.append(dict(type="term", label=term["label"], value=term["value"], source_url=source_for(term, t["links"][0]["value"]), verified_on=t["verified_on"], sort_order=n))
    cap = caption_for.get(t["slug"])
    if cap:
        for label, value in price_tables[cap]["rows"]:
            n += 1
            m = re.fullmatch(r"₹([\d,]+)(?:–₹([\d,]+))?", value)
            amt = int(m.group(1).replace(",", "")) if m else None
            amx = int(m.group(2).replace(",", "")) if m and m.group(2) else None
            src = first_src
            if t["slug"] == "pan": src = "https://www.incometax.gov.in" if "Instant" in label else "https://www.protean-tinpan.com"
            trows.append(dict(type="fee", key="price_list", group_label=cap, label=label, value=value, amount=amt, amount_max=amx, source_url=src, verified_on=t["verified_on"], sort_order=n))
    if trows:
        sql.append(rules_block("Whole guide: official links, glossary and the price list on Fair price", trows, "where t.slug = " + q(t["slug"]), True) + "\n")
        all_rules += [dict(r, task=t["slug"], case=None) for r in trows]
    for c in t["cases"]:
        rows = []
        for i, r in enumerate(c["rules"], 1):
            r = dict(r)
            r["source_url"] = None if r["type"] == "link" else source_for(r, c["full_list_url"])
            r["verified_on"] = t["verified_on"]; r["sort_order"] = i
            rows.append(r)
        sql.append(rules_block(t["name"] + " > " + c["label"], rows, "where t.slug = " + q(t["slug"]) + " and c.slug = " + q(c["slug"]), False) + "\n")
        all_rules += [dict(r, task=t["slug"], case=c["slug"]) for r in rows]

# Translations of every sentence above that the site already translates
texts = []
for t in d["tasks"]:
    texts += [t[k] for k in ("name", "short_description", "short_name", "mode", "price_summary", "helpline_label", "no_check_reason")]
    for c in t["cases"]: texts += [c[k] for k in ("name", "label", "no_docs_text", "note", "full_list_text")]
for o in d["offices"]: texts += [o[k] for k in ("name", "short_name", "area", "hours", "how_to_visit", "notice", "notice_short")]
for r in all_rules:
    if r["type"] == "link": texts.append(r["label"])
    else: texts += [r.get("label"), r.get("value"), r.get("notes"), r.get("group_label")]
# Translations come from the site's own translator (test/translate_texts.py), which also handles fill-in patterns.
uniq = []
for s in texts:
    if s and s not in uniq and re.search(r"[A-Za-z]", s) and not s.startswith("http"): uniq.append(s)
json.dump(uniq, open("test/texts.json", "w"), ensure_ascii=False, indent=0)
trs = json.load(open("test/texts_tr.json")) if pathlib.Path("test/texts_tr.json").exists() else {}
tr_rows, missing = [], []
for s in uniq:
    hi, kn = (trs.get(s) or {}).get("hi"), (trs.get(s) or {}).get("kn")
    if not (hi and kn): hi, kn = d["translations"]["hi"].get(s), d["translations"]["kn"].get(s)
    if hi and kn and (hi != s or kn != s): tr_rows.append((s, hi, kn))
    else: missing.append(s)
sql.append("-- ---------------------------------------------------------------------\n-- Hindi and Kannada (" + str(len(tr_rows)) + " sentences), copied from the site's translations\n-- ---------------------------------------------------------------------")
sql.append("insert into translations (en, hi, kn) values\n" + ",\n".join("  (" + q(a) + ", " + q(b) + ", " + q(c) + ")" for a, b, c in tr_rows) + ";\n")
sql.append("commit;\n")
(OUT / "02_seed.sql").write_text("\n".join(sql))

# Summary numbers for the test and the verify list
by_type = {}
for r in all_rules: by_type[r["type"]] = by_type.get(r["type"], 0) + 1
summary = dict(tasks=len(d["tasks"]), cases=ncase, offices=len(d["offices"]), office_tasks=len(pairs), rules=len(all_rules), by_type=by_type,
               translations=len(tr_rows), untranslated=missing)
json.dump(dict(summary=summary, rules=all_rules), open("test/seed_rules.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(summary, ensure_ascii=False)[:600])
