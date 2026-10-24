#!/bin/bash
# Start the throwaway Postgres and load 01_schema.sql and 02_seed.sql into a fresh 'bgp' database, set up like Supabase.
HERE="$(cd "$(dirname "$0")/.." && pwd)"; B="$HERE/pgx/pgserver/pginstall/bin"; S="/tmp/claude-501/pgs"; SUP="$1"
mkdir -p "$S"
"$B/pg_ctl" -D "$HERE/pgdata" status >/dev/null 2>&1 || "$B/pg_ctl" -D "$HERE/pgdata" -o "-k $S -c listen_addresses=''" -l "$HERE/pg.log" start >/dev/null
sleep 1
p() { "$B/psql" -h "$S" -U postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
p -d postgres -c "drop database if exists bgp;" -c "create database bgp;" 2>&1 | grep -v NOTICE
p -d bgp -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;" -c "do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;" \
  -c "grant usage on schema public to anon, authenticated;" -c "alter default privileges in schema public grant all on tables to anon, authenticated;"
p -d bgp -f "$SUP/01_schema.sql" && p -d bgp -f "$SUP/02_seed.sql" && p -d bgp -tA -c "select 'database ready: ' || (select count(*) from rules) || ' facts'"
