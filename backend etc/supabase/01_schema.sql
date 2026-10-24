-- =====================================================================
-- Bring Go Pay: database tables (step 2)
--
-- How to run: Supabase dashboard -> SQL Editor -> New query -> paste
-- this whole file -> Run. Then run 02_seed.sql to fill the tables.
-- Running it again is safe: it never deletes tables or data.
--
-- The tables, in plain words:
--   tasks         one row per guide (Aadhaar update, PAN card, ...)
--   cases         the versions of a guide (Aadhaar: address, mobile, ...)
--   rules         every fact: documents, fees, steps, timings, tips ...
--   offices       the offices people visit, with their opening hours
--   office_tasks  which office handles which guide
--   translations  the Hindi and Kannada for an English sentence
--
-- Security: anyone can READ these tables, because that is what the
-- website does. Nobody can add, change or delete rows through the
-- website. You edit the data in the Supabase dashboard, which is
-- allowed to bypass these rules.
-- =====================================================================


-- ---------------------------------------------------------------------
-- tasks: one row per guide
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id                bigint generated always as identity primary key,
  slug              text not null unique,  -- short name used in links: 'aadhaar' -> #aadhaar
  name              text not null,         -- 'Aadhaar update'
  short_description text,                  -- the line under the name on the guide card
  short_name        text,                  -- 'Aadhaar', for tabs and buttons
  mode              text,                  -- 'Online or visit'
  price_summary     text,                  -- 'from ₹75', shown on the guide card
  ticket_prefix     text,                  -- 'AAD', the start of the code on a trip slip
  helpline_label    text,                  -- 'UIDAI helpline'
  helpline_number   text,                  -- '1947'
  source_name       text,                  -- 'uidai.gov.in', named under the fees
  fair_price_check  boolean not null default false,  -- can Fair price check a quote for this guide?
  no_check_reason   text,                  -- why not, when it can't
  sort_order        int not null default 0
);


-- ---------------------------------------------------------------------
-- cases: the versions of a guide, each with its own documents and fees
-- (Aadhaar has four: address, name or birth date, mobile, photo)
-- ---------------------------------------------------------------------
create table if not exists cases (
  id             bigint generated always as identity primary key,
  task_id        bigint not null references tasks(id) on delete cascade,
  slug           text not null,           -- 'address' -> #aadhaar.address
  name           text not null,           -- 'Address', the tab label
  label          text not null,           -- 'address change', used inside sentences
  visit_mode     text not null default 'office'
                 check (visit_mode in ('online', 'office', 'both')),
  ready_at_home  boolean not null default false,  -- true: "things to have ready", false: "things to carry"
  no_docs_text   text,                    -- 'No other documents needed.'
  note           text,                    -- a highlighted note at the top of the guide
  full_list_url  text,                    -- official page with the complete list of documents
  full_list_text text,                    -- the words on that link
  tool           text check (tool in ('ll', 'qual', 'emi')),  -- built-in calculator, if any
  fair_margin    int,  -- Fair price: a quote up to (official fee + this) counts as fair. Team estimate.
  high_margin    int,  -- ... and from (official fee + this) it counts as too high. Team estimate.
  sort_order     int not null default 0,
  unique (task_id, slug),
  unique (id, task_id)                    -- lets rules check that a case belongs to its task
);


-- ---------------------------------------------------------------------
-- rules: every fact on the site, one row each
--
-- type says what kind of fact it is:
--   document  something to bring          fee       a line in the fee table
--   fee_note  a sentence under the fees   step      one step of the process
--   timing    when and how to go          tip       a watch-out
--   term      a glossary word             link      an official website
--
-- case_id is empty when a row is about the whole guide (glossary terms,
-- the guide's official links).
-- ---------------------------------------------------------------------
create table if not exists rules (
  id          bigint generated always as identity primary key,
  task_id     bigint not null references tasks(id) on delete cascade,
  case_id     bigint,
  type        text not null
              check (type in ('document', 'fee', 'fee_note', 'step', 'timing', 'tip', 'term', 'link')),
  key         text,           -- a fixed name the code uses, like 'poa' or 'normal_36'. Don't rename it.
  group_label text,           -- rows with the same group belong together: 'Proof of address, pick one'
  label       text not null,  -- what people read: 'Utility bill', 'Normal fee, 36 pages'
  value       text,           -- the answer as text: '₹75', 'Free', 'On Sarathi', or a link's address
  amount      numeric(10, 2), -- the fee as a number, when it is one: 75
  amount_max  numeric(10, 2), -- the top of a range: ₹100–₹500 is amount 100, amount_max 500
  notes       text,           -- small print shown under the label
  optional    boolean not null default false,
  my_doc      text,           -- which 'My documents' tick covers this document, e.g. 'aadhaar'
  source_url  text,           -- the official page this fact comes from
  verified_on date,           -- when we last checked it
  sort_order  int not null default 0,
  foreign key (case_id, task_id) references cases(id, task_id) on delete cascade
);
create index if not exists rules_task_idx on rules(task_id);
create index if not exists rules_case_idx on rules(case_id);


-- ---------------------------------------------------------------------
-- offices: the places people visit
-- ---------------------------------------------------------------------
create table if not exists offices (
  id                 bigint generated always as identity primary key,
  slug               text not null unique,  -- 'ask-southend' -> #best-time.ask-southend
  name               text not null,         -- 'Aadhaar Seva Kendra, South End Circle'
  short_name         text,                  -- 'South End Circle'
  office_type        text not null check (office_type in ('ask', 'psk')),
                                            -- Aadhaar or Passport Seva Kendra; picks the rush estimate
  area               text,                  -- 'Basavanagudi'
  address            text,
  hours              text,                  -- the sentence people read
  open_days          smallint[] not null default '{}'
                     check (open_days <@ '{0,1,2,3,4,5,6}'),  -- days it opens: 0 = Sunday ... 6 = Saturday
  opens_at           time,                  -- 09:30, used for the "Open now" badge
  closes_at          time,                  -- 17:30
  how_to_visit       text,                  -- 'Walk in or book a slot online.'
  notice             text,                  -- something important, like the office moving
  notice_short       text,                  -- the same notice in a few words
  best_time_to_visit text,                  -- left empty for now: the site estimates calm times
                                            -- itself and labels them "Estimate, not live data"
  source_url         text,
  verified_on        date,
  sort_order         int not null default 0
);


-- ---------------------------------------------------------------------
-- office_tasks: which office handles which guide
-- ---------------------------------------------------------------------
create table if not exists office_tasks (
  office_id bigint not null references offices(id) on delete cascade,
  task_id   bigint not null references tasks(id) on delete cascade,
  primary key (office_id, task_id)
);


-- ---------------------------------------------------------------------
-- translations: Hindi and Kannada, matched to the exact English text.
-- If you change an English sentence in another table, its old
-- translation no longer matches, so the site shows the new English
-- instead of an out-of-date translation. Add a row for the new text.
-- ---------------------------------------------------------------------
create table if not exists translations (
  en text primary key,  -- the English, exactly as it appears in the other tables
  hi text,              -- Hindi
  kn text               -- Kannada
);


-- =====================================================================
-- Security: Row Level Security (RLS)
-- With RLS on, a table refuses every request unless a policy allows it.
-- We add one policy per table that allows reading. There is no policy
-- for adding, changing or deleting, so the website can't do those.
-- 'anon' is a visitor to the website; 'authenticated' is a signed-in
-- user (the site has none, but this keeps them read-only too).
-- =====================================================================
alter table tasks        enable row level security;
alter table cases        enable row level security;
alter table rules        enable row level security;
alter table offices      enable row level security;
alter table office_tasks enable row level security;
alter table translations enable row level security;

drop policy if exists "Anyone can read" on tasks;
create policy "Anyone can read" on tasks        for select to anon, authenticated using (true);
drop policy if exists "Anyone can read" on cases;
create policy "Anyone can read" on cases        for select to anon, authenticated using (true);
drop policy if exists "Anyone can read" on rules;
create policy "Anyone can read" on rules        for select to anon, authenticated using (true);
drop policy if exists "Anyone can read" on offices;
create policy "Anyone can read" on offices      for select to anon, authenticated using (true);
drop policy if exists "Anyone can read" on office_tasks;
create policy "Anyone can read" on office_tasks for select to anon, authenticated using (true);
drop policy if exists "Anyone can read" on translations;
create policy "Anyone can read" on translations for select to anon, authenticated using (true);

-- A second lock on the same door: the website's roles may only read.
grant select on tasks, cases, rules, offices, office_tasks, translations to anon, authenticated;
revoke insert, update, delete, truncate on tasks, cases, rules, offices, office_tasks, translations from anon, authenticated;
