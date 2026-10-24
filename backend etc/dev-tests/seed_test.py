"""Load 01_schema.sql + 02_seed.sql into a throwaway Postgres (set up like Supabase) and prove the database holds exactly what the site has."""
import json, subprocess, sys, pathlib, time
HERE = pathlib.Path(__file__).resolve().parent.parent
B = HERE / "pgx/pgserver/pginstall/bin"; S = "/tmp/claude-501/pgs"; DATA = HERE / "pgdata"
SUP = pathlib.Path(sys.argv[1])
def psql(*args, db="bgp", check=True):
    r = subprocess.run([str(B / "psql"), "-h", S, "-U", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", db, *args], capture_output=True, text=True)
    if check and r.returncode: raise SystemExit("psql failed: " + r.stderr[-800:])
    return r.stdout.strip()
def js(sql): return json.loads(psql("-tA", "-c", sql) or "null")
subprocess.run([str(B / "pg_ctl"), "-D", str(DATA), "-o", f"-k {S} -c listen_addresses=''", "-l", str(HERE / "pg.log"), "start"], capture_output=True)
time.sleep(2)
psql("-c", "drop database if exists bgp;", "-c", "create database bgp;", db="postgres")
psql("-c", "do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;", "-c", "do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;",
     "-c", "grant usage on schema public to anon, authenticated;", "-c", "alter default privileges in schema public grant all on tables to anon, authenticated;")
psql("-f", str(SUP / "01_schema.sql")); psql("-f", str(SUP / "02_seed.sql"))
res = []
def check(name, ok, info=""):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> " + str(info)[:600]))
d = json.load(open(HERE / "test/extracted.json")); s = json.load(open(HERE / "test/seed_rules.json"))
counts = js("select json_build_object('tasks',(select count(*) from tasks),'cases',(select count(*) from cases),'rules',(select count(*) from rules),'offices',(select count(*) from offices),'office_tasks',(select count(*) from office_tasks),'translations',(select count(*) from translations))")
want = dict(tasks=s["summary"]["tasks"], cases=s["summary"]["cases"], rules=s["summary"]["rules"], offices=s["summary"]["offices"], office_tasks=s["summary"]["office_tasks"], translations=s["summary"]["translations"])
check("row counts: " + ", ".join(f"{k} {v}" for k, v in counts.items()), counts == want, (counts, want))
# Every rule, field by field, in order
db_rules = js("""select json_agg(x order by x.task_order, x.case_order nulls first, x.sort_order) from (
  select t.slug task, c.slug "case", r.type, r.key, r.group_label, r.label, r.value, r.amount::float amount, r.amount_max::float amount_max, r.notes, r.optional, r.my_doc, r.source_url, r.verified_on::text verified_on, r.sort_order,
    t.sort_order task_order, c.sort_order case_order from rules r join tasks t on t.id = r.task_id left join cases c on c.id = r.case_id) x""")
F = ["task", "case", "type", "key", "group_label", "label", "value", "amount", "amount_max", "notes", "optional", "my_doc", "source_url", "verified_on", "sort_order"]
norm = lambda r: tuple((float(r.get(f)) if f in ("amount", "amount_max") and r.get(f) is not None else (r.get(f) if r.get(f) is not None else (False if f == "optional" else None))) for f in F)
mine = [norm(r) for r in s["rules"]]; theirs = [norm(r) for r in db_rules]
diff = [(a, b) for a, b in zip(mine, theirs) if a != b]
check("all %d facts match the site exactly, in order (documents, fees, steps, tips...)" % len(mine), len(mine) == len(theirs) and not diff, diff[:2])
# Guides, cases, offices
tk = ["slug", "name", "short_description", "short_name", "mode", "price_summary", "ticket_prefix", "helpline_label", "helpline_number", "source_name", "fair_price_check", "no_check_reason", "sort_order"]
db_t = js("select json_agg(t order by sort_order) from tasks t")
check("guides match", [[x[k] for k in tk] for x in db_t] == [[x[k] for k in tk] for x in d["tasks"]])
ck = ["slug", "name", "label", "visit_mode", "ready_at_home", "no_docs_text", "note", "full_list_url", "full_list_text", "tool", "fair_margin", "high_margin", "sort_order"]
db_c = js("select json_agg(c order by t.sort_order, c.sort_order) from cases c join tasks t on t.id = c.task_id")
check("cases match", [[x[k] for k in ck] for x in db_c] == [[c[k] for k in ck] for t in d["tasks"] for c in t["cases"]])
ok = ["slug", "name", "short_name", "office_type", "area", "address", "hours", "open_days", "opens_at", "closes_at", "how_to_visit", "notice", "notice_short", "sort_order"]
db_o = js("select json_agg(json_build_object('slug',slug,'name',name,'short_name',short_name,'office_type',office_type,'area',area,'address',address,'hours',hours,'open_days',open_days,'opens_at',to_char(opens_at,'HH24:MI'),'closes_at',to_char(closes_at,'HH24:MI'),'how_to_visit',how_to_visit,'notice',notice,'notice_short',notice_short,'sort_order',sort_order) order by sort_order) from offices")
check("offices match, including days and hours", [[x[k] for k in ok] for x in db_o] == [[o[k] for k in ok] for o in d["offices"]])
pairs = js("select json_agg(o.slug || '>' || t.slug order by o.sort_order) from office_tasks ot join offices o on o.id = ot.office_id join tasks t on t.id = ot.task_id")
check("office to guide links match", pairs == [o["slug"] + ">" + o["task"] for o in d["offices"]], pairs)
# The fee totals the site computes, rebuilt from the database for every choice a person can make
fees = {}
for r in db_rules:
    if r["type"] == "fee" and r["case"]: fees.setdefault(r["task"] + "." + r["case"], []).append(r)
bad = []
for k, site_total in d["totals"].items():
    tc, sel = k.split("{", 1)[0], json.loads("{" + k.split("{", 1)[1])
    rows = fees[tc]; by = {r["key"]: r for r in rows}
    if tc.startswith("passport."):
        age, pages = sel.get("age", "adult"), sel.get("pages", "36")
        base = by["base_u18"] if age in ("u18", "u8") else by["base_60"] if pages == "60" else by["base_36"]
        tot = base["amount"]
        if "discount_pct" in by and age in ("u8", "senior"): tot -= round(base["amount"] * by["discount_pct"]["amount"] / 100)
    elif tc.startswith("itr."): tot = by["filing"]["amount"] + by["late_" + sel["income"]]["amount"]
    else: tot = sum(r["amount"] or 0 for r in rows if r["key"] != "price_list")
    if tot != site_total: bad.append((k, tot, site_total))
check("fee totals from the database equal the site's for all %d choices (passport ages and pages, tax income bands...)" % len(d["totals"]), not bad, bad)
bands_bad = [(t["slug"], c["slug"]) for t in d["tasks"] for c in t["cases"] if c.get("band_check") and (c["band_check"]["o"] + c["fair_margin"] != c["band_check"]["f"] or c["band_check"]["o"] + c["high_margin"] != c["band_check"]["h"])]
check("fair-price bands rebuild exactly", not bands_bad, bands_bad)
tr = js("select json_object_agg(en, json_build_array(hi, kn)) from translations")
trs = json.load(open(HERE / "test/texts_tr.json"))
check("translations match the site's own translator", all(tr[e] == [trs[e]["hi"], trs[e]["kn"]] for e in tr), [e for e in tr if tr[e] != [trs[e]["hi"], trs[e]["kn"]]][:3])
nosrc = js("select json_agg(type || ': ' || label) from rules where source_url is null and type <> 'link'")
check("every fact except links has a source_url", not nosrc, nosrc)
check("offices have no source_url or verified_on (as the code has none)", js("select to_json(bool_and(source_url is null and verified_on is null)) from offices"))
# Visitors can read it, and running the seed twice gives the same result
anon = psql("-tA", "-c", "begin; set local role anon; select count(*) from rules; rollback;")
check("a website visitor can read the facts", anon.strip().splitlines()[-1] == str(want["rules"]), anon)
psql("-f", str(SUP / "02_seed.sql"))
check("running the seed again gives the same counts", js("select json_build_object('tasks',(select count(*) from tasks),'cases',(select count(*) from cases),'rules',(select count(*) from rules),'offices',(select count(*) from offices),'office_tasks',(select count(*) from office_tasks),'translations',(select count(*) from translations))") == want)
check("ids start from 1 again after re-running", js("select min(id) from tasks") == 1)
subprocess.run([str(B / "pg_ctl"), "-D", str(DATA), "stop"], capture_output=True)
print(f"{sum(res)}/{len(res)} passed")
