import sys, pathlib, json
from playwright.sync_api import sync_playwright
URL = pathlib.Path(sys.argv[1]).as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True); pg = b.new_page(); pg.goto(URL + "#about"); pg.wait_for_timeout(500)
    print(json.dumps(pg.evaluate("""(() => { let c=0,items=0,picks=0,steps=0,watch=0,fees=0,notes=0,terms=0,bands=0,goTexts=0; const per=[];
      for (const t of Object.values(TASKS)) { terms += (t.terms||[]).length; for (const k of t.cases) { c++; items += k.items.length; let pk=0; for (const i of k.items) if (i.pick) pk += i.pick.length; picks += pk; steps += k.steps.length; watch += k.watch.length; if (k.band) bands++;
        const f = k.fee({}); fees += f.lines.length; notes += (f.notes||[]).length; goTexts += (k.go.online ? 1 : 0) + (k.go.note ? 1 : 0) + (k.note ? 1 : 0);
        per.push(t.id + '.' + k.id + ': ' + k.items.length + ' items (+' + pk + ' pick-one options), ' + f.lines.length + ' fee lines, ' + (f.notes||[]).length + ' fee notes, ' + k.steps.length + ' steps, ' + k.watch.length + ' watch-outs'); } }
      return { tasks: TASK_IDS.length, cases: c, checklistItems: items, pickOneOptions: picks, feeLines: fees, feeNotes: notes, steps, watchOuts: watch, goTexts, glossaryTerms: terms, fairPriceBands: bands,
        offices: OFFICE_IDS.length, officialLinks: Object.keys(L).length, myDocs: DOCS.length, searchAliasGroups: Object.keys(ALIASES).length, partners: PARTNERS.length, sponsoredTips: Object.keys(SPONSORED_TIPS).length, per }; })()"""), indent=1, ensure_ascii=False))
    b.close()
