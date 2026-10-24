-- Tests for supabase/01_schema.sql, run after it on a throwaway database.
-- Each check prints PASS or FAIL.
\set QUIET on
\pset tuples_only on
\pset format unaligned

-- A small helper: run a statement and report whether it failed with the error we expect.
create or replace function expect_error(stmt text, want text, who text default null) returns text language plpgsql as $$
begin
  if who is not null then execute 'set local role ' || who; end if;
  execute stmt;
  return 'FAIL (no error): ' || stmt;
exception when others then
  if sqlerrm ilike '%' || want || '%' then return 'PASS ' || want || ': ' || left(stmt, 60);
  else return 'FAIL (other error: ' || sqlerrm || '): ' || stmt; end if;
end $$;

-- Sample rows, added by the owner (like you in the Supabase dashboard)
insert into tasks (slug, name, short_description, fair_price_check) values
  ('aadhaar', 'Aadhaar update', 'Change your address', true),
  ('pan', 'PAN card', 'Free e-PAN in about 10 min', true);
insert into cases (task_id, slug, name, label, visit_mode)
  select id, 'address', 'Address', 'address change', 'both' from tasks where slug = 'aadhaar';
insert into cases (task_id, slug, name, label, visit_mode)
  select id, 'instant', 'Instant e-PAN', 'instant e-PAN', 'online' from tasks where slug = 'pan';
insert into rules (task_id, case_id, type, key, group_label, label, my_doc, source_url, verified_on)
  select t.id, c.id, 'document', 'utility', 'Proof of address, pick one', 'Utility bill from the last 3 months', 'utility', 'https://uidai.gov.in', '2026-10-16'
  from tasks t join cases c on c.task_id = t.id where t.slug = 'aadhaar';
insert into rules (task_id, case_id, type, key, label, value, amount, source_url, verified_on)
  select t.id, c.id, 'fee', 'update', 'Demographic update, address', '₹75', 75, 'https://uidai.gov.in', '2026-10-16'
  from tasks t join cases c on c.task_id = t.id where t.slug = 'aadhaar';
insert into rules (task_id, type, label, value) select id, 'link', 'uidai.gov.in', 'https://uidai.gov.in' from tasks where slug = 'aadhaar';
insert into offices (slug, name, office_type, open_days, opens_at, closes_at)
  values ('ask-southend', 'Aadhaar Seva Kendra, South End Circle', 'ask', '{0,1,2,3,4,5,6}', '09:30', '17:30');
insert into office_tasks select o.id, t.id from offices o, tasks t where o.slug = 'ask-southend' and t.slug = 'aadhaar';
insert into translations values ('Aadhaar update', 'आधार अपडेट', 'ಆಧಾರ್ ನವೀಕರಣ');

\echo '--- A website visitor (anon) can read every table'
begin; set local role anon;
select case when (select count(*) from tasks) = 2 and (select count(*) from cases) = 2 and (select count(*) from rules) = 3
  and (select count(*) from offices) = 1 and (select count(*) from office_tasks) = 1 and (select count(*) from translations) = 1
  then 'PASS visitor reads all six tables' else 'FAIL visitor could not read everything' end;
rollback;

\echo '--- A visitor cannot add, change or delete anything'
begin; select expect_error($$insert into tasks (slug, name) values ('hack', 'Hacked')$$, 'permission denied', 'anon'); rollback;
begin; select expect_error($$update rules set value = '₹1' where type = 'fee'$$, 'permission denied', 'anon'); rollback;
begin; select expect_error($$delete from offices$$, 'permission denied', 'anon'); rollback;
begin; select expect_error($$insert into translations values ('x', 'y', 'z')$$, 'permission denied', 'authenticated'); rollback;

\echo '--- Even if someone grants write access by mistake, Row Level Security still says no'
begin;
grant insert, update on tasks to anon;
select expect_error($$insert into tasks (slug, name) values ('hack', 'Hacked')$$, 'row-level security', 'anon');
rollback;
begin;
grant update on rules to anon;
set local role anon;
update rules set value = '₹1' where type = 'fee';
reset role;
select case when (select value from rules where type = 'fee') = '₹75' then 'PASS RLS: a visitor''s update changes 0 rows, the fee is still ₹75' else 'FAIL the fee changed' end;
rollback;

\echo '--- Bad data is refused'
select expect_error($$insert into rules (task_id, case_id, type, label)
  select (select id from tasks where slug = 'pan'), (select id from cases where slug = 'address'), 'document', 'Wrong guide'$$, 'foreign key');
select expect_error($$insert into rules (task_id, type, label) select id, 'banana', 'x' from tasks limit 1$$, 'check constraint');
select expect_error($$insert into offices (slug, name, office_type, open_days) values ('x', 'X', 'ask', '{7}')$$, 'check constraint');
select expect_error($$insert into offices (slug, name, office_type) values ('y', 'Y', 'post')$$, 'check constraint');
select expect_error($$insert into cases (task_id, slug, name, label, visit_mode) select id, 'z', 'Z', 'z', 'teleport' from tasks limit 1$$, 'check constraint');
select expect_error($$insert into tasks (slug, name) values ('aadhaar', 'Duplicate')$$, 'duplicate key');
select expect_error($$insert into cases (task_id, slug, name, label) select id, 'address', 'Again', 'again' from tasks where slug = 'aadhaar'$$, 'duplicate key');
select expect_error($$insert into rules (task_id, type) select id, 'tip' from tasks limit 1$$, 'null value');

\echo '--- Deleting a guide removes its cases, rules and office links too'
begin;
delete from tasks where slug = 'aadhaar';
select case when (select count(*) from cases where slug = 'address') = 0 and (select count(*) from rules) = 0 and (select count(*) from office_tasks) = 0
  then 'PASS delete cascades' else 'FAIL leftovers after delete' end;
rollback;
