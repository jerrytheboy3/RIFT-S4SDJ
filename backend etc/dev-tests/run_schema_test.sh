#!/bin/bash
# Runs supabase/01_schema.sql twice on a throwaway Postgres set up like Supabase, then the tests.
HERE="$(cd "$(dirname "$0")/.." && pwd)"
B="$HERE/pgx/pgserver/pginstall/bin"; S="/tmp/claude-501/pgs"
SQL="$1"
psqlx() { "$B/psql" -h "$S" -U postgres -X -q "$@"; }
psqlx -c "drop database if exists bgp;" -c "create database bgp;"
psqlx -d bgp -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;" \
  -c "do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;" \
  -c "grant usage on schema public to anon, authenticated;" \
  -c "alter default privileges in schema public grant all on tables to anon, authenticated;"
echo "== run 1"; psqlx -d bgp -v ON_ERROR_STOP=1 -f "$SQL" 2>&1 | grep -v NOTICE; echo "exit ${PIPESTATUS[0]}"
echo "== run 2 (running it again must be safe)"; psqlx -d bgp -v ON_ERROR_STOP=1 -f "$SQL" 2>&1 | grep -v "NOTICE"; echo "exit ${PIPESTATUS[0]}"
echo "== tables and row level security"; psqlx -d bgp -tA -c "select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;"
echo "== tests"; psqlx -d bgp -f "$HERE/test/schema_test.sql" 2>&1
