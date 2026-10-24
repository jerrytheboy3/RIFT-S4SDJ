"""A small stand-in for Supabase's REST API, for testing only.
It answers GET /rest/v1/<table>?select=*&order=...&limit=&offset= like Supabase does, reading the real
Postgres tables as the 'anon' role (so Row Level Security applies), and refuses requests without the right key.
Test-only controls: POST /__reset (forget cached answers), POST /__fail/on and /__fail/off (pretend to be down)."""
import json, re, subprocess, sys, pathlib, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
HERE = pathlib.Path(__file__).resolve().parent.parent
PSQL = str(HERE / "pgx/pgserver/pginstall/bin/psql"); SOCK = "/tmp/claude-501/pgs"
PORT, KEY = int(sys.argv[1]), sys.argv[2]
TABLES = {"tasks", "cases", "rules", "offices", "office_tasks", "translations"}
state = {"cache": {}, "fail": False, "hits": 0, "delay": 0.0}

def order_sql(o):
    parts = []
    for p in (o or "").split(","):
        if not p: continue
        bits = p.split(".")
        if not re.fullmatch(r"[a-z_]+", bits[0]): raise ValueError("bad column")
        sql = bits[0] + (" desc" if "desc" in bits[1:] else " asc")
        if "nullsfirst" in bits[1:]: sql += " nulls first"
        if "nullslast" in bits[1:]: sql += " nulls last"
        parts.append(sql)
    return (" order by " + ", ".join(parts)) if parts else ""

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "apikey, authorization, content-type, range")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    def reply(self, code, body):
        b = body.encode()
        self.send_response(code); self.cors(); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        if self.path == "/__reset": state["cache"].clear(); return self.reply(200, "{}")
        if self.path == "/__fail/on": state["fail"] = True; return self.reply(200, "{}")
        if self.path == "/__fail/off": state["fail"] = False; return self.reply(200, "{}")
        if self.path == "/__hits": return self.reply(200, json.dumps({"hits": state["hits"]}))
        if self.path.startswith("/__delay/"): state["delay"] = int(self.path.split("/")[-1]) / 1000; return self.reply(200, "{}")
        self.reply(405, '{"message":"read only"}')
    def do_GET(self):
        u = urlparse(self.path)
        m = re.fullmatch(r"/rest/v1/([a-z_]+)", u.path)
        if not m or m.group(1) not in TABLES: return self.reply(404, '{"message":"not found"}')
        if self.headers.get("apikey") != KEY: return self.reply(401, '{"message":"Invalid API key"}')
        auth = self.headers.get("Authorization") or ""
        if auth.startswith("Bearer sb_"): return self.reply(401, '{"message":"Invalid JWT"}')   # like Supabase: a publishable key is not a JWT
        if state["delay"]: time.sleep(state["delay"])
        if state["fail"]: return self.reply(503, '{"message":"down for testing"}')
        state["hits"] += 1
        if self.path in state["cache"]: return self.reply(200, state["cache"][self.path])
        q = parse_qs(u.query)
        try:
            limit = int(q.get("limit", ["1000"])[0]); offset = int(q.get("offset", ["0"])[0])
            sql = "select * from " + m.group(1) + order_sql(q.get("order", [""])[0]) + " limit " + str(min(limit, 1000)) + " offset " + str(offset)
        except ValueError: return self.reply(400, '{"message":"bad request"}')
        r = subprocess.run([PSQL, "-h", SOCK, "-U", "postgres", "-X", "-q", "-tA", "-d", "bgp", "-c",
                            "begin; set local role anon; select coalesce(json_agg(t), '[]'::json) from (" + sql + ") t; commit;"], capture_output=True, text=True)
        if r.returncode: return self.reply(500, json.dumps({"message": r.stderr[-300:]}))
        body = json.dumps(json.loads(r.stdout.strip()), ensure_ascii=False, separators=(",", ":"))
        state["cache"][self.path] = body
        self.reply(200, body)

class Server(ThreadingHTTPServer):
    request_queue_size = 128   # the default of 5 drops connections when a page sends 6 requests at once
    daemon_threads = True
Server(("127.0.0.1", PORT), H).serve_forever()
