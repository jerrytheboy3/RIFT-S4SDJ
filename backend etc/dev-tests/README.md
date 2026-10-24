# Development tests (optional)

These scripts were used to check the site while it was built. The website doesn't need them.

They use Python with [Playwright](https://playwright.dev/python/) to drive Chrome. The database tests also
need a local Postgres, plus `mock_supabase.py`, a small stand-in for Supabase's REST API. Most take the
path to a built `index.html` as their first argument. For example:

```bash
python3 dev-tests/smoke.py "$PWD/public/index.html"
```

The main suites:

| File | What it checks |
|---|---|
| `full.py`, `allguides.py` | Pages, guides, ticking, layout |
| `db_site.py` | The database version shows exactly what the built-in version showed |
| `cache.py` | The saved copy, slow networks, server down |
| `edge.py` | Every language at every screen size and text size |
| `schema_test.sql`, `seed_test.py` | The SQL files: security rules, and that the seed matches the site |
