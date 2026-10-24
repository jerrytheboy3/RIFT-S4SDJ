"""Merge every i18n/t*.py dictionary (and p*.py pattern lists) into the Hindi and Kannada parts of the build."""
import glob, importlib.util, json, os
here = os.path.dirname(os.path.abspath(__file__))
exact = {}; patterns = []
for f in sorted(glob.glob(os.path.join(here, "t*.py"))) + sorted(glob.glob(os.path.join(here, "p*.py"))):
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    exact.update(getattr(m, "T", {}))
    patterns += getattr(m, "P", [])
# Task and case labels used together: "Passport, first passport" and "Passport: First passport"
combos = json.load(open(os.path.join(here, "combos.json")))
for t, n, l in combos:
    if t in exact and l in exact: exact.setdefault(t + ", " + l, tuple(exact[t][i] + ", " + exact[l][i] for i in range(2)))
    if t in exact and n in exact: exact.setdefault(t + ": " + n, tuple(exact[t][i] + ": " + exact[n][i] for i in range(2)))
missing = sorted({x for c in combos for x in c if x not in exact})
if missing: print("combo parts missing:", missing)
for i, lang in enumerate(["hi", "kn"]):
    ex = {k: v[i] for k, v in exact.items()}
    pa = [([k[1:], v[i], 1] if k.startswith("~") else [k, v[i]]) for k, v in patterns]
    out = "\n/* " + ("Hindi" if lang == "hi" else "Kannada") + " dictionary, generated from i18n/*.py */\n"
    out += "Object.assign(I18N." + lang + ".exact, " + json.dumps(ex, ensure_ascii=False, indent=0) + ");\n"
    out += "I18N." + lang + ".patterns.push(..." + json.dumps(pa, ensure_ascii=False, indent=0) + ");\n"
    open(os.path.join(here, "..", "src", "p2d_hi.js" if lang == "hi" else "p2e_kn.js"), "w").write(out)
print(len(exact), "strings,", len(patterns), "patterns")
