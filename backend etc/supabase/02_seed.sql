-- =====================================================================
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
-- Fees checked: 16 Oct 2026 (Aadhaar, PAN, passport, rent, tax return)
--               20 Oct 2026 (driving licence, voter ID, education loan)
-- What still needs checking is listed in TO_VERIFY.md.
--
-- About source_url: each row points to the official website the guide
-- cites for it. These are home pages, not the exact page, because the
-- project never guessed deep links. Offices have no source in the code,
-- so their source_url is empty.
-- =====================================================================
begin;

truncate translations, office_tasks, rules, cases, offices, tasks restart identity cascade;

-- ---------------------------------------------------------------------
-- Guides (8)
-- ---------------------------------------------------------------------
insert into tasks (slug, name, short_description, short_name, mode, price_summary, ticket_prefix, helpline_label, helpline_number, source_name, fair_price_check, no_check_reason, sort_order) values
  ('aadhaar', 'Aadhaar update', 'Change your address, name, birth date, mobile or photo', 'Aadhaar', 'Online or visit', 'from ₹75', 'AAD', 'UIDAI helpline', '1947', 'uidai.gov.in', true, null, 1),
  ('pan', 'PAN card', 'Free e-PAN in about 10 min', 'PAN', 'Online', 'Free', 'PAN', null, null, 'incometax.gov.in, Protean and UTIITSL', true, null, 2),
  ('passport', 'Passport', 'First, renewal or Tatkal', 'Passport', 'Visit', 'from ₹2,500', 'PSP', 'Passport Seva helpline', '1800-258-1800', 'passportindia.gov.in', true, null, 3),
  ('rent', 'Rent agreement', '11-month lease, e-stamp', 'Rent', 'No office', '₹100–₹500', 'RNT', null, null, 'shcilestamp.com', false, 'Drafting help is a paid professional service whose prices vary, so there is no fair-price check for it.', 4),
  ('itr', 'Late tax return', 'FY 2025-26, by 31 Dec', 'ITR', 'Online', '₹0–₹5,000', 'ITR', null, null, 'incometax.gov.in', false, 'Filing help is a paid professional service whose prices vary, so there is no fair-price check for it.', 5),
  ('dl', 'Driving licence', 'Learner''s licence first, then the driving test', 'Licence', 'Online, then RTO', 'Fee on Sarathi', 'DRV', null, null, 'sarathi.parivahan.gov.in', false, 'Fees depend on your vehicle classes and Sarathi shows the exact amount before you pay, so there is no fair-price check for this guide.', 6),
  ('voter', 'Voter ID', 'Register to vote, move or correct your card', 'Voter ID', 'Online', 'Free', 'EPC', 'Voter helpline', '1800-11-1950', 'voters.eci.gov.in and ECI', false, 'Registering is free and you can do it yourself online, so there is no fair-price check. Anyone charging you is charging for help, not for the form.', 7),
  ('eduloan', 'Education loan', 'One application to many banks, plus interest subsidies', 'Loan', 'Online or bank', 'Rates vary', 'EDU', null, null, 'pmvidyalaxmi.co.in and the Ministry of Education', false, 'Interest rates and processing fees differ by bank, so there is no single fair price to check against. Compare offers before you choose.', 8);

-- ---------------------------------------------------------------------
-- Versions of each guide (17)
-- fair_margin and high_margin are the Fair price bands: team estimates.
-- ---------------------------------------------------------------------
insert into cases (task_id, slug, name, label, visit_mode, ready_at_home, no_docs_text, note, full_list_url, full_list_text, tool, fair_margin, high_margin, sort_order)
select t.id, v.slug, v.name, v.label, v.visit_mode, v.ready_at_home::boolean, v.no_docs_text, v.note, v.full_list_url, v.full_list_text, v.tool, v.fair_margin::int, v.high_margin::int, v.sort_order::int
from tasks t, (values
  ('aadhaar', 'address', 'Address', 'address change', 'both', false, null, null, 'https://uidai.gov.in', null, null, 75, 175, 1),
  ('aadhaar', 'name-dob', 'Name or DOB', 'name or birth date change', 'both', false, null, null, 'https://uidai.gov.in', null, null, 75, 175, 2),
  ('aadhaar', 'mobile', 'Mobile', 'mobile number update', 'office', false, 'No other documents needed.', null, 'https://uidai.gov.in', null, null, 75, 175, 3),
  ('aadhaar', 'biometric', 'Photo', 'photo or fingerprint update', 'office', false, 'No documents needed.', null, 'https://uidai.gov.in', null, null, 75, 175, 4),
  ('pan', 'instant', 'Instant e-PAN', 'instant e-PAN', 'online', true, null, null, 'https://www.incometax.gov.in', null, null, 100, 250, 1),
  ('pan', 'card', 'Card by post', 'PAN card by post', 'online', false, null, null, 'https://www.protean-tinpan.com', null, null, 143, 293, 2),
  ('pan', 'correction', 'Correction', 'PAN correction', 'online', false, null, null, 'https://www.protean-tinpan.com', null, null, 143, 293, 3),
  ('passport', 'first', 'First passport', 'first passport', 'office', false, null, null, 'https://www.passportindia.gov.in', null, null, 700, 1500, 1),
  ('passport', 'renewal', 'Renewal', 'passport renewal', 'office', false, null, null, 'https://www.passportindia.gov.in', null, null, 700, 1500, 2),
  ('passport', 'tatkal', 'Tatkal', 'Tatkal passport', 'office', false, null, null, 'https://www.passportindia.gov.in', null, null, 700, 1500, 3),
  ('rent', 'lease', '11-month lease', '11-month lease', 'online', false, null, null, 'https://www.shcilestamp.com', 'e-stamp paper on shcilestamp.com', null, null, null, 1),
  ('itr', 'belated', 'Belated return', 'belated return for FY 2025-26', 'online', true, null, null, 'https://www.incometax.gov.in', null, null, null, null, 1),
  ('dl', 'learner', 'Learner''s licence', 'learner''s licence', 'online', false, null, null, 'https://sarathi.parivahan.gov.in', 'Documents and forms on Sarathi', 'll', null, null, 1),
  ('dl', 'test', 'Driving licence', 'driving licence and test', 'online', false, null, null, 'https://sarathi.parivahan.gov.in', 'Driving licence services on Sarathi', 'll', null, null, 2),
  ('voter', 'new', 'New voter', 'new voter registration', 'online', false, null, 'Studying away from home, in a hostel or PG in Bengaluru? You can register at your home address or where you live now, but only in one place.', 'https://voters.eci.gov.in', 'Form 6 on voters.eci.gov.in', 'qual', null, null, 1),
  ('voter', 'shift', 'Shift or correct', 'shift or correction', 'online', false, null, null, 'https://voters.eci.gov.in', 'Form 8 on voters.eci.gov.in', null, null, null, 2),
  ('eduloan', 'apply', 'New loan', 'loan for your course', 'online', false, null, 'Admitted on merit to a designated institution? PM-Vidyalaxmi loans need no collateral and no guarantor. Management and NRI quota seats are not covered.', 'https://pmvidyalaxmi.co.in', 'Loan schemes on PM-Vidyalaxmi', 'emi', null, null, 1)
) as v(task_slug, slug, name, label, visit_mode, ready_at_home, no_docs_text, note, full_list_url, full_list_text, tool, fair_margin, high_margin, sort_order)
where t.slug = v.task_slug;

-- ---------------------------------------------------------------------
-- Offices (4)
-- Days: 0 = Sunday ... 6 = Saturday. No source link or check date in the
-- code for these, so source_url and verified_on stay empty (see TO_VERIFY.md).
-- ---------------------------------------------------------------------
insert into offices (slug, name, short_name, office_type, area, address, hours, open_days, opens_at, closes_at, how_to_visit, notice, notice_short, sort_order) values
  ('ask-southend', 'Aadhaar Seva Kendra, South End Circle', 'South End Circle', 'ask', 'Basavanagudi', '36 Pattalamma Temple Road, Basavanagudi, Bengaluru 560004', 'Typically 9:30 AM to 5:30 PM, every day.', '{0,1,2,3,4,5,6}', '09:30', '17:30', 'Walk in or book a slot online.', null, null, 1),
  ('ask-majestic', 'Aadhaar Seva Kendra, Majestic', 'Majestic', 'ask', 'Gandhi Nagar', 'Grand Majestic Mall, 2nd Cross, 6th Main, Gandhi Nagar, Bengaluru 560009', 'Typically 9:30 AM to 5:30 PM, every day.', '{0,1,2,3,4,5,6}', '09:30', '17:30', 'Walk in or book a slot online.', null, null, 2),
  ('psk-lalbagh', 'Passport Seva Kendra, Lalbagh', 'Lalbagh', 'psk', 'Lalbagh Road', 'Prestige Libra, 45 Lalbagh Road, Bengaluru 560027', 'Appointments roughly 9 AM to 4 PM, Monday to Friday.', '{1,2,3,4,5}', '09:00', '16:00', 'Appointment only. Book on passportindia.gov.in or the mPassport Seva app.', null, null, 3),
  ('psk-whitefield', 'Passport Seva Kendra, Whitefield', 'Whitefield', 'psk', 'EPIP Zone, Whitefield', 'GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro, Whitefield, Bengaluru', 'Appointments roughly 9 AM to 4 PM, Monday to Friday.', '{1,2,3,4,5}', '09:00', '16:00', 'Appointment only. Book on passportindia.gov.in or the mPassport Seva app.', 'PSK Whitefield moved on 5 Oct 2026. It is now at GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro. It used to be at Sai Arcade, Marathahalli, so don''t go to the old address.', 'New address since 5 Oct 2026', 4);

-- Which office handles which guide
insert into office_tasks (office_id, task_id)
select o.id, t.id from (values
  ('ask-southend', 'aadhaar'),
  ('ask-majestic', 'aadhaar'),
  ('psk-lalbagh', 'passport'),
  ('psk-whitefield', 'passport')
) as v(office_slug, task_slug)
join offices o on o.slug = v.office_slug
join tasks t on t.slug = v.task_slug;

-- =====================================================================
-- Aadhaar update
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (7 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'myaadhaar.uidai.gov.in', 'https://myaadhaar.uidai.gov.in', null, null, null, false, null, null, '2026-10-16', 1),
  ('link', 'official', null, 'uidai.gov.in', 'https://uidai.gov.in', null, null, null, false, null, null, '2026-10-16', 2),
  ('fee', 'price_list', 'Aadhaar', 'Address, name, birth date or mobile update', '₹75', 75, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 3),
  ('fee', 'price_list', 'Aadhaar', 'Photo or fingerprint update (also with other changes)', '₹125', 125, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 4),
  ('fee', 'price_list', 'Aadhaar', 'Colour printout', '₹40', 40, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 5),
  ('fee', 'price_list', 'Aadhaar', 'e-Aadhaar download', 'Free', null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 6),
  ('fee', 'price_list', 'Aadhaar', 'Documents-only update online, until 14 June 2027', 'Free', null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 7)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'aadhaar';

-- Aadhaar update > address change (24 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'card', null, 'Aadhaar card or number', null, null, null, null, false, 'aadhaar', 'https://uidai.gov.in', '2026-10-16', 1),
  ('document', 'poa:passport', 'Proof of address, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://uidai.gov.in', '2026-10-16', 2),
  ('document', 'poa:voter', 'Proof of address, pick one', 'Voter ID', null, null, null, null, false, 'voter', 'https://uidai.gov.in', '2026-10-16', 3),
  ('document', 'poa:bank', 'Proof of address, pick one', 'Bank passbook or statement', null, null, null, null, false, 'bank', 'https://uidai.gov.in', '2026-10-16', 4),
  ('document', 'poa:utility', 'Proof of address, pick one', 'Utility bill from the last 3 months', null, null, null, null, false, 'utility', 'https://uidai.gov.in', '2026-10-16', 5),
  ('document', 'poa:rentreg', 'Proof of address, pick one', 'Registered rent agreement', null, null, null, null, false, 'rentreg', 'https://uidai.gov.in', '2026-10-16', 6),
  ('document', 'poa:ration', 'Proof of address, pick one', 'Ration card', null, null, null, null, false, 'ration', 'https://uidai.gov.in', '2026-10-16', 7),
  ('document', 'otp', null, 'Phone linked to Aadhaar', null, null, null, 'For the OTP, if you update online', true, null, 'https://uidai.gov.in', '2026-10-16', 8),
  ('fee', null, null, 'Demographic update, address', '₹75', 75, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 9),
  ('fee_note', null, null, 'Colour printout of your Aadhaar, if you want one: ₹40.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 10),
  ('fee_note', null, null, 'Downloading e-Aadhaar is free.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 11),
  ('fee_note', null, null, 'Only updating your identity and address documents online, with no change to your details, is free until 14 June 2027.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 12),
  ('timing', 'online_text', null, 'Update your address on myaadhaar.uidai.gov.in. Sign in with the OTP sent to the phone linked to your Aadhaar, upload a clear scan of your proof and pay ₹75 online.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 13),
  ('timing', 'online_time', null, 'You can finish the form in one sitting at home. UIDAI processes the update afterwards.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 14),
  ('link', 'online', null, 'myaadhaar.uidai.gov.in', 'https://myaadhaar.uidai.gov.in', null, null, null, false, null, null, '2026-10-16', 15),
  ('step', null, null, 'Pick one proof of address that shows your name and your current address.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 16),
  ('step', null, null, 'Decide where: online on myaadhaar.uidai.gov.in, or at an Aadhaar Seva Kendra (walk in or book a slot online).', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 17),
  ('step', null, null, 'Online, sign in with the OTP sent to the phone linked to your Aadhaar. At a centre, ask for an address update at the counter.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 18),
  ('step', null, null, 'Enter the new address exactly as it appears on your proof.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 19),
  ('step', null, null, 'Upload a clear scan of the proof, or show the original at the counter.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 20),
  ('step', null, null, 'Pay ₹75 and keep the acknowledgement with its update request number. Use that number to track the update.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 21),
  ('tip', null, null, 'The name on your proof should match the name on your Aadhaar.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 22),
  ('tip', null, null, 'The fee is ₹75, online or at the counter. Anything more is a charge for help, not for the update.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 23),
  ('tip', null, null, 'Only refreshing your documents, with no change of address? That is free online until 14 June 2027.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 24)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'aadhaar' and c.slug = 'address';

-- Aadhaar update > name or birth date change (22 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'card', null, 'Aadhaar card', null, null, null, null, false, 'aadhaar', 'https://uidai.gov.in', '2026-10-16', 1),
  ('document', 'proof:passport', 'Proof of the new detail, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://uidai.gov.in', '2026-10-16', 2),
  ('document', 'proof:pan', 'Proof of the new detail, pick one', 'PAN card', null, null, null, null, false, 'pan', 'https://uidai.gov.in', '2026-10-16', 3),
  ('document', 'proof:voter', 'Proof of the new detail, pick one', 'Voter ID', null, null, null, null, false, 'voter', 'https://uidai.gov.in', '2026-10-16', 4),
  ('document', 'proof:dl', 'Proof of the new detail, pick one', 'Driving licence', null, null, null, null, false, 'dl', 'https://uidai.gov.in', '2026-10-16', 5),
  ('document', 'proof:marriage', 'Proof of the new detail, pick one', 'Marriage certificate or gazette notification', null, null, null, 'For a name change', false, null, 'https://uidai.gov.in', '2026-10-16', 6),
  ('document', 'proof:birth', 'Proof of the new detail, pick one', 'Birth certificate', null, null, null, 'For a birth date change', false, 'birth', 'https://uidai.gov.in', '2026-10-16', 7),
  ('document', 'proof:class10', 'Proof of the new detail, pick one', 'Class 10 certificate', null, null, null, 'For a birth date change', false, 'class10', 'https://uidai.gov.in', '2026-10-16', 8),
  ('fee', null, null, 'Demographic update, name or birth date', '₹75', 75, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 9),
  ('fee_note', null, null, 'Your name can be changed twice in a lifetime, your birth date once.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 10),
  ('fee_note', null, null, 'Colour printout, if you want one: ₹40.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 11),
  ('timing', 'online_text', null, 'Update your name or birth date on myaadhaar.uidai.gov.in. Sign in with the OTP sent to your linked phone, upload your proof and pay ₹75.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 12),
  ('timing', 'online_time', null, 'You can finish the form in one sitting at home. UIDAI processes the update afterwards.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 13),
  ('link', 'online', null, 'myaadhaar.uidai.gov.in', 'https://myaadhaar.uidai.gov.in', null, null, null, false, null, null, '2026-10-16', 14),
  ('step', null, null, 'Check your limit: a name can be changed twice in a lifetime, a birth date once.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 15),
  ('step', null, null, 'Pick one proof that shows the correct name or birth date.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 16),
  ('step', null, null, 'Update online on myaadhaar.uidai.gov.in, or visit an Aadhaar Seva Kendra.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 17),
  ('step', null, null, 'Enter the detail exactly as it is written on your proof.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 18),
  ('step', null, null, 'Pay ₹75 and keep the acknowledgement with its update request number.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 19),
  ('step', null, null, 'Track the update with that number until it shows.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 20),
  ('tip', null, null, 'Changes are limited, so check the spelling twice before you submit.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 21),
  ('tip', null, null, 'The fee is ₹75, online or at a centre.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 22)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'aadhaar' and c.slug = 'name-dob';

-- Aadhaar update > mobile number update (12 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'card', null, 'Aadhaar card', null, null, null, null, false, 'aadhaar', 'https://uidai.gov.in', '2026-10-16', 1),
  ('document', 'phone', null, 'Your new mobile phone, with you', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 2),
  ('fee', null, null, 'Demographic update, mobile number', '₹75', 75, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 3),
  ('fee_note', null, null, 'Colour printout, if you want one: ₹40.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 4),
  ('timing', 'visit_note', null, 'A mobile number update needs a centre visit, because you confirm it with your fingerprint. The new Aadhaar app is starting to offer face authentication instead.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 5),
  ('step', null, null, 'Go to an Aadhaar Seva Kendra with your Aadhaar card and the new phone. Walk in or book a slot online.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 6),
  ('step', null, null, 'Ask for a mobile number update at the counter.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 7),
  ('step', null, null, 'Give your fingerprint to confirm it is you.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 8),
  ('step', null, null, 'Pay ₹75 and keep the acknowledgement slip.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 9),
  ('step', null, null, 'Start using the new number for OTPs once the update shows.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 10),
  ('tip', null, null, 'The fee is ₹75 at the counter.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 11),
  ('tip', null, null, 'The fingerprint step happens at the centre, so no agent can do this one for you.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 12)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'aadhaar' and c.slug = 'mobile';

-- Aadhaar update > photo or fingerprint update (10 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'card', null, 'Aadhaar card', null, null, null, null, false, 'aadhaar', 'https://uidai.gov.in', '2026-10-16', 1),
  ('fee', null, null, 'Biometric update, photo or fingerprints', '₹125', 125, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 2),
  ('fee_note', null, null, 'Changing details like your address at the same visit? The total is still ₹125.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 3),
  ('timing', 'visit_note', null, 'Your new photo and fingerprints are taken at the centre, so this one needs a visit.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 4),
  ('step', null, null, 'Go to an Aadhaar Seva Kendra with your Aadhaar card. Walk in or book a slot online.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 5),
  ('step', null, null, 'Ask for a biometric update at the counter.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 6),
  ('step', null, null, 'Your new photo and fingerprints are taken there.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 7),
  ('step', null, null, 'Pay ₹125, even if you change other details at the same time.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 8),
  ('step', null, null, 'Keep the acknowledgement slip and track the update with it.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 9),
  ('tip', null, null, 'The fee is ₹125. It stays ₹125 if you also update your address or other details at the same visit.', null, null, null, null, false, null, 'https://uidai.gov.in', '2026-10-16', 10)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'aadhaar' and c.slug = 'biometric';

-- =====================================================================
-- PAN card
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (7 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'incometax.gov.in', 'https://www.incometax.gov.in', null, null, null, false, null, null, '2026-10-16', 1),
  ('link', 'official', null, 'Protean', 'https://www.protean-tinpan.com', null, null, null, false, null, null, '2026-10-16', 2),
  ('link', 'official', null, 'UTIITSL', 'https://www.utiitsl.com', null, null, null, false, null, null, '2026-10-16', 3),
  ('fee', 'price_list', 'PAN', 'Instant e-PAN with Aadhaar OTP', 'Free', null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 4),
  ('fee', 'price_list', 'PAN', 'PAN card by post, with e-PAN', '₹107', 107, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 5),
  ('fee', 'price_list', 'PAN', 'e-PAN only', '₹72', 72, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 6),
  ('fee', 'price_list', 'PAN', 'Correction (card with e-PAN)', '₹107', 107, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 7)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'pan';

-- PAN card > instant e-PAN (14 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'num', null, 'Aadhaar number', null, null, null, null, false, 'aadhaar', 'https://www.incometax.gov.in', '2026-10-16', 1),
  ('document', 'phone', null, 'Phone linked to Aadhaar', null, null, null, 'For the OTP', false, null, 'https://www.incometax.gov.in', '2026-10-16', 2),
  ('fee', null, null, 'Instant e-PAN with Aadhaar OTP', '₹0', 0, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 3),
  ('fee_note', null, null, 'Want a printed card later? A physical card with e-PAN is ₹107 on Protean or UTIITSL.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 4),
  ('timing', 'online_title', null, 'Skip the trip', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 5),
  ('timing', 'online_text', null, 'Get your e-PAN on incometax.gov.in with an OTP sent to the phone linked to your Aadhaar. There is no office visit.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 6),
  ('timing', 'online_time', null, 'About 10 minutes, and free.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 7),
  ('link', 'online', null, 'incometax.gov.in', 'https://www.incometax.gov.in', null, null, null, false, null, null, '2026-10-16', 8),
  ('step', null, null, 'Open incometax.gov.in and choose the instant e-PAN option.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 9),
  ('step', null, null, 'Enter your Aadhaar number and the OTP sent to your linked phone.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 10),
  ('step', null, null, 'Check the details taken from your Aadhaar and confirm.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 11),
  ('step', null, null, 'Download your e-PAN when it is ready, in about 10 minutes.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 12),
  ('tip', null, null, 'Already have a PAN? Don''t apply again. Holding two PANs can bring a ₹10,000 penalty.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 13),
  ('tip', null, null, 'The e-PAN is free. Anyone charging for it is charging for help.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 14)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'pan' and c.slug = 'instant';

-- PAN card > PAN card by post (15 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'kyc', null, 'Aadhaar, for e-KYC', null, null, null, null, false, 'aadhaar', 'https://www.protean-tinpan.com', '2026-10-16', 1),
  ('document', 'photo', null, 'Photo and signature', null, null, null, 'Only if you apply without e-KYC', true, null, 'https://www.protean-tinpan.com', '2026-10-16', 2),
  ('fee', null, null, 'PAN card by post, with e-PAN', '₹107', 107, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 3),
  ('fee_note', null, null, 'Only need the e-PAN? It is ₹72.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 4),
  ('timing', 'online_title', null, 'No office visit', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 5),
  ('timing', 'online_text', null, 'Apply on Protean or UTIITSL. The card comes to you by post, and you get an e-PAN too.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 6),
  ('timing', 'online_time', null, 'Apply in one sitting. The card arrives later by post.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 7),
  ('link', 'online', null, 'Protean', 'https://www.protean-tinpan.com', null, null, null, false, null, null, '2026-10-16', 8),
  ('link', 'online', null, 'UTIITSL', 'https://www.utiitsl.com', null, null, null, false, null, null, '2026-10-16', 9),
  ('step', null, null, 'Open Protean or UTIITSL and start a new PAN application.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 10),
  ('step', null, null, 'Choose Aadhaar e-KYC, or upload a photo and signature if you apply without it.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 11),
  ('step', null, null, 'Pay ₹107 for the card and e-PAN, or ₹72 for the e-PAN only.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 12),
  ('step', null, null, 'Keep the acknowledgement number to track your application.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 13),
  ('step', null, null, 'Wait for the card to arrive by post.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 14),
  ('tip', null, null, 'Holding two PANs can bring a ₹10,000 penalty. If you already have one, apply for a correction instead.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 15)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'pan' and c.slug = 'card';

-- PAN card > PAN correction (15 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'pan', null, 'Your current PAN', null, null, null, null, false, 'pan', 'https://www.protean-tinpan.com', '2026-10-16', 1),
  ('document', 'proof', null, 'Proof of the correct detail', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 2),
  ('fee', null, null, 'PAN correction, card with e-PAN', '₹107', 107, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 3),
  ('fee_note', null, null, 'e-PAN only: ₹72.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 4),
  ('timing', 'online_title', null, 'No office visit', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 5),
  ('timing', 'online_text', null, 'Apply for a correction on Protean or UTIITSL. You get the corrected card by post.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 6),
  ('timing', 'online_time', null, 'Apply in one sitting. The card arrives later by post.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 7),
  ('link', 'online', null, 'Protean', 'https://www.protean-tinpan.com', null, null, null, false, null, null, '2026-10-16', 8),
  ('link', 'online', null, 'UTIITSL', 'https://www.utiitsl.com', null, null, null, false, null, null, '2026-10-16', 9),
  ('step', null, null, 'Open Protean or UTIITSL and choose the change or correction form.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 10),
  ('step', null, null, 'Enter your current PAN and the correct detail.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 11),
  ('step', null, null, 'Upload proof of the correct detail.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 12),
  ('step', null, null, 'Pay ₹107, or ₹72 for the e-PAN only.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 13),
  ('step', null, null, 'Track the request with your acknowledgement number.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 14),
  ('tip', null, null, 'Correct your existing PAN. Applying for a new one gives you two PANs, which can bring a ₹10,000 penalty.', null, null, null, null, false, null, 'https://www.protean-tinpan.com', '2026-10-16', 15)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'pan' and c.slug = 'correction';

-- =====================================================================
-- Passport
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (6 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'passportindia.gov.in', 'https://www.passportindia.gov.in', null, null, null, false, null, null, '2026-10-16', 1),
  ('fee', 'price_list', 'Passport', '36 pages, normal / Tatkal', '₹2,500 / ₹5,000', null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 2),
  ('fee', 'price_list', 'Passport', '60 pages, normal / Tatkal', '₹3,500 / ₹6,000', null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 3),
  ('fee', 'price_list', 'Passport', 'Under 18, 36 pages, normal / Tatkal', '₹1,750 / ₹4,250', null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 4),
  ('fee', 'price_list', 'Passport', 'First passport, under 8 or 60 and over', '10% off normal fee', null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 5),
  ('fee', 'price_list', 'Passport', 'Police clearance certificate', '₹750', 750, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 6)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'passport';

-- Passport > first passport (29 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'poa:aadhaar', 'Proof of address, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://www.passportindia.gov.in', '2026-10-16', 1),
  ('document', 'poa:utility', 'Proof of address, pick one', 'Utility bill', null, null, null, null, false, 'utility', 'https://www.passportindia.gov.in', '2026-10-16', 2),
  ('document', 'poa:bank', 'Proof of address, pick one', 'Bank passbook with photo', null, null, null, null, false, 'bank', 'https://www.passportindia.gov.in', '2026-10-16', 3),
  ('document', 'poa:rentreg', 'Proof of address, pick one', 'Registered rent agreement', null, null, null, null, false, 'rentreg', 'https://www.passportindia.gov.in', '2026-10-16', 4),
  ('document', 'poa:voter', 'Proof of address, pick one', 'Voter ID', null, null, null, null, false, 'voter', 'https://www.passportindia.gov.in', '2026-10-16', 5),
  ('document', 'dob:birth', 'Proof of birth date, pick one', 'Birth certificate', null, null, null, null, false, 'birth', 'https://www.passportindia.gov.in', '2026-10-16', 6),
  ('document', 'dob:class10', 'Proof of birth date, pick one', 'Class 10 certificate', null, null, null, null, false, 'class10', 'https://www.passportindia.gov.in', '2026-10-16', 7),
  ('document', 'dob:pan', 'Proof of birth date, pick one', 'PAN card', null, null, null, null, false, 'pan', 'https://www.passportindia.gov.in', '2026-10-16', 8),
  ('document', 'dob:aadhaar', 'Proof of birth date, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://www.passportindia.gov.in', '2026-10-16', 9),
  ('document', 'appt', null, 'Appointment confirmation', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 10),
  ('document', 'copies', null, 'Originals plus one set of self-attested copies', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 11),
  ('fee', 'base_36', null, 'Normal fee, 36 pages', '₹2,500', 2500, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 12),
  ('fee', 'base_60', null, 'Normal fee, 60 pages', '₹3,500', 3500, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 13),
  ('fee', 'base_u18', null, 'Normal fee, under 18, 36 pages', '₹1,750', 1750, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 14),
  ('fee', 'discount_pct', null, 'First passport, under 8 or 60 and over', '10% off normal fee', 10, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 15),
  ('fee_note', 'minor_only', null, 'Applicants under 18 get 36 pages only.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 16),
  ('fee_note', null, null, 'Need a police clearance certificate instead? That is ₹750.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 17),
  ('fee_note', null, null, 'You pay online when you apply on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 18),
  ('timing', 'visit_note', null, 'Apply and book on passportindia.gov.in or the mPassport Seva app first, then book the calmest slot you can get. The Regional Passport Office in Koramangala does not take walk-in applications.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 19),
  ('step', null, null, 'Register on passportindia.gov.in or the mPassport Seva app.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 20),
  ('step', null, null, 'Fill in the application and pay the fee online.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 21),
  ('step', null, null, 'Book an appointment at a Passport Seva Kendra. Pick the calmest slot you can get.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 22),
  ('step', null, null, 'Go with your originals and one set of self-attested copies.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 23),
  ('step', null, null, 'At the PSK you go through counters A, B and C.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 24),
  ('step', null, null, 'Police verification follows after your visit.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 25),
  ('step', null, null, 'Track your application on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 26),
  ('tip', null, null, 'The Regional Passport Office in Koramangala does not take walk-in applications. Go to your PSK appointment.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 27),
  ('tip', null, null, 'PSK Whitefield moved to GM Tech Park, EPIP Zone on 5 Oct 2026.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 28),
  ('tip', null, null, 'You pay the fee online when you apply. Anything an agent charges on top is for their help.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 29)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'passport' and c.slug = 'first';

-- Passport > passport renewal (20 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'old', null, 'Old passport', null, null, null, null, false, 'passport', 'https://www.passportindia.gov.in', '2026-10-16', 1),
  ('document', 'copies', null, 'Self-attested copies of its first two and last two pages', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 2),
  ('document', 'appt', null, 'Appointment confirmation', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 3),
  ('document', 'newaddr', null, 'Proof of new address', null, null, null, 'Only if your address has changed', true, null, 'https://www.passportindia.gov.in', '2026-10-16', 4),
  ('fee', 'base_36', null, 'Normal fee, 36 pages', '₹2,500', 2500, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 5),
  ('fee', 'base_60', null, 'Normal fee, 60 pages', '₹3,500', 3500, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 6),
  ('fee', 'base_u18', null, 'Normal fee, under 18, 36 pages', '₹1,750', 1750, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 7),
  ('fee_note', 'minor_only', null, 'Applicants under 18 get 36 pages only.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 8),
  ('fee_note', null, null, 'Need a police clearance certificate instead? That is ₹750.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 9),
  ('fee_note', null, null, 'You pay online when you apply on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 10),
  ('timing', 'visit_note', null, 'Apply and book on passportindia.gov.in or the mPassport Seva app first, then book the calmest slot you can get. The Regional Passport Office in Koramangala does not take walk-in applications.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 11),
  ('step', null, null, 'Sign in on passportindia.gov.in or the mPassport Seva app.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 12),
  ('step', null, null, 'Fill in the renewal application and pay the fee online.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 13),
  ('step', null, null, 'Book an appointment at a Passport Seva Kendra. Pick the calmest slot you can get.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 14),
  ('step', null, null, 'Go with your old passport and the self-attested copies.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 15),
  ('step', null, null, 'At the PSK you go through counters A, B and C.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 16),
  ('step', null, null, 'Police verification follows if your application needs it.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 17),
  ('step', null, null, 'Track your application on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 18),
  ('tip', null, null, 'Bring the old passport itself, not just copies.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 19),
  ('tip', null, null, 'PSK Whitefield moved to GM Tech Park, EPIP Zone on 5 Oct 2026.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 20)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'passport' and c.slug = 'renewal';

-- Passport > Tatkal passport (28 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'poa:aadhaar', 'Proof of address, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://www.passportindia.gov.in', '2026-10-16', 1),
  ('document', 'poa:utility', 'Proof of address, pick one', 'Utility bill', null, null, null, null, false, 'utility', 'https://www.passportindia.gov.in', '2026-10-16', 2),
  ('document', 'poa:bank', 'Proof of address, pick one', 'Bank passbook with photo', null, null, null, null, false, 'bank', 'https://www.passportindia.gov.in', '2026-10-16', 3),
  ('document', 'poa:rentreg', 'Proof of address, pick one', 'Registered rent agreement', null, null, null, null, false, 'rentreg', 'https://www.passportindia.gov.in', '2026-10-16', 4),
  ('document', 'poa:voter', 'Proof of address, pick one', 'Voter ID', null, null, null, null, false, 'voter', 'https://www.passportindia.gov.in', '2026-10-16', 5),
  ('document', 'dob:birth', 'Proof of birth date, pick one', 'Birth certificate', null, null, null, null, false, 'birth', 'https://www.passportindia.gov.in', '2026-10-16', 6),
  ('document', 'dob:class10', 'Proof of birth date, pick one', 'Class 10 certificate', null, null, null, null, false, 'class10', 'https://www.passportindia.gov.in', '2026-10-16', 7),
  ('document', 'dob:pan', 'Proof of birth date, pick one', 'PAN card', null, null, null, null, false, 'pan', 'https://www.passportindia.gov.in', '2026-10-16', 8),
  ('document', 'dob:aadhaar', 'Proof of birth date, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://www.passportindia.gov.in', '2026-10-16', 9),
  ('document', 'appt', null, 'Appointment confirmation', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 10),
  ('document', 'copies', null, 'Originals plus one set of self-attested copies', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 11),
  ('document', 'old', null, 'Old passport, with copies of its first two and last two pages', null, null, null, 'Only if you are renewing on Tatkal', true, null, 'https://www.passportindia.gov.in', '2026-10-16', 12),
  ('fee', 'base_36', null, 'Tatkal fee, 36 pages', '₹5,000', 5000, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 13),
  ('fee', 'base_60', null, 'Tatkal fee, 60 pages', '₹6,000', 6000, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 14),
  ('fee', 'base_u18', null, 'Tatkal fee, under 18, 36 pages', '₹4,250', 4250, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 15),
  ('fee_note', 'minor_only', null, 'Applicants under 18 get 36 pages only.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 16),
  ('fee_note', null, null, 'Need a police clearance certificate instead? That is ₹750.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 17),
  ('fee_note', null, null, 'You pay online when you apply on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 18),
  ('timing', 'visit_note', null, 'Choose Tatkal when you apply on passportindia.gov.in or the mPassport Seva app, then book the calmest slot you can get.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 19),
  ('step', null, null, 'Register or sign in on passportindia.gov.in or the mPassport Seva app.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 20),
  ('step', null, null, 'Choose Tatkal, fill in the application and pay the Tatkal fee online.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 21),
  ('step', null, null, 'Book an appointment at a Passport Seva Kendra. Pick the calmest slot you can get.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 22),
  ('step', null, null, 'Go with your originals and one set of self-attested copies.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 23),
  ('step', null, null, 'At the PSK you go through counters A, B and C.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 24),
  ('step', null, null, 'Police verification follows.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 25),
  ('step', null, null, 'Track your application on passportindia.gov.in.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 26),
  ('tip', null, null, 'Tatkal costs more because it is faster. It does not skip the PSK visit.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 27),
  ('tip', null, null, 'PSK Whitefield moved to GM Tech Park, EPIP Zone on 5 Oct 2026.', null, null, null, null, false, null, 'https://www.passportindia.gov.in', '2026-10-16', 28)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'passport' and c.slug = 'tatkal';

-- =====================================================================
-- Rent agreement
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (3 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'shcilestamp.com', 'https://www.shcilestamp.com', null, null, null, false, null, null, '2026-10-16', 1),
  ('fee', 'price_list', 'Rent agreement', 'Stamp duty, 11-month lease, e-stamp paper', '₹100–₹500', 100, 500, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 2),
  ('fee', 'price_list', 'Rent agreement', 'Registration under 12 months', 'Not needed', null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 3)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'rent';

-- Rent agreement > 11-month lease (21 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'ids', null, 'Owner''s and tenant''s ID', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 1),
  ('document', 'amounts', null, 'Rent and deposit amounts', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 2),
  ('document', 'estamp', null, 'e-stamp paper', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 3),
  ('document', 'witness', null, 'Two witnesses with their ID', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 4),
  ('document', 'notary', null, 'Notary', null, null, null, 'Optional', true, null, 'https://www.shcilestamp.com', '2026-10-16', 5),
  ('fee', null, null, 'Stamp duty on e-stamp paper, 11-month lease', '₹100–₹500', 100, 500, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 6),
  ('fee', null, null, 'Registration, under 12 months', 'Not needed', null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 7),
  ('fee_note', null, null, 'Registration is mandatory for leases over 12 months.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 8),
  ('fee_note', null, null, 'A notary is optional.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 9),
  ('timing', 'online_title', null, 'No government office', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 10),
  ('timing', 'online_text', null, 'Karnataka uses e-stamp paper only. Buy it on SHCIL online or at an authorised centre, then sign the agreement at home with two witnesses.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 11),
  ('timing', 'online_time', null, 'Registration isn''t needed for leases under 12 months.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 12),
  ('link', 'online', null, 'shcilestamp.com', 'https://www.shcilestamp.com', null, null, null, false, null, null, '2026-10-16', 13),
  ('step', null, null, 'Agree the rent, the deposit and the 11-month term with the owner.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 14),
  ('step', null, null, 'Buy e-stamp paper on SHCIL online or at an authorised centre.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 15),
  ('step', null, null, 'Put the agreement on the e-stamp paper.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 16),
  ('step', null, null, 'Owner and tenant sign, with two witnesses who show their ID.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 17),
  ('step', null, null, 'Get it notarised if you want to. It is optional.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 18),
  ('step', null, null, 'Keep a signed copy each.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 19),
  ('tip', null, null, 'Staying longer than 12 months? Registration is then mandatory, and this 11-month guide doesn''t cover it.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 20),
  ('tip', null, null, 'Karnataka uses e-stamp paper only.', null, null, null, null, false, null, 'https://www.shcilestamp.com', '2026-10-16', 21)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'rent' and c.slug = 'lease';

-- =====================================================================
-- Late tax return
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (6 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'incometax.gov.in', 'https://www.incometax.gov.in', null, null, null, false, null, null, '2026-10-16', 1),
  ('fee', 'price_list', 'Late tax return, FY 2025-26', 'Filing on incometax.gov.in', 'Free', null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 2),
  ('fee', 'price_list', 'Late tax return, FY 2025-26', 'Late fee, income below the exemption limit', '₹0', 0, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 3),
  ('fee', 'price_list', 'Late tax return, FY 2025-26', 'Late fee, income up to ₹5 lakh', '₹1,000', 1000, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 4),
  ('fee', 'price_list', 'Late tax return, FY 2025-26', 'Late fee, income above ₹5 lakh', '₹5,000', 5000, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 5),
  ('fee', 'price_list', 'Late tax return, FY 2025-26', 'Interest on unpaid tax', '1% a month', null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 6)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'itr';

-- Late tax return > belated return for FY 2025-26 (21 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'panlink', null, 'PAN linked with Aadhaar', null, null, null, null, false, 'pan', 'https://www.incometax.gov.in', '2026-10-16', 1),
  ('document', 'form16', null, 'Form 16 or salary slips', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 2),
  ('document', 'ais', null, 'Interest and tax details', null, null, null, 'From the AIS on the portal', false, null, 'https://www.incometax.gov.in', '2026-10-16', 3),
  ('document', 'bank', null, 'A pre-validated bank account', null, null, null, 'For any refund', false, null, 'https://www.incometax.gov.in', '2026-10-16', 4),
  ('fee', 'filing', null, 'Filing on incometax.gov.in', '₹0', 0, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 5),
  ('fee', 'late_below', 'Below the exemption limit', 'Late fee under section 234F', '₹0', 0, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 6),
  ('fee', 'late_upto5', 'Up to ₹5 lakh', 'Late fee under section 234F', '₹1,000', 1000, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 7),
  ('fee', 'late_above5', 'Above ₹5 lakh', 'Late fee under section 234F', '₹5,000', 5000, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 8),
  ('fee_note', null, null, 'Plus interest of 1% a month on any tax you still owe.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 9),
  ('fee_note', null, null, 'E-verify within 30 days of filing.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 10),
  ('timing', 'online_title', null, 'Online only', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 11),
  ('timing', 'online_text', null, 'File your belated return for FY 2025-26 (AY 2026-27) on incometax.gov.in. Filing there is free.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 12),
  ('link', 'online', null, 'incometax.gov.in', 'https://www.incometax.gov.in', null, null, null, false, null, null, '2026-10-16', 13),
  ('step', null, null, 'Sign in on incometax.gov.in.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 14),
  ('step', null, null, 'Check your AIS for interest and tax details, and match it with your Form 16 or salary slips.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 15),
  ('step', null, null, 'Choose a belated return for AY 2026-27. Only the new tax regime applies.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 16),
  ('step', null, null, 'Pay the late fee under section 234F and any tax due, with 1% a month interest.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 17),
  ('step', null, null, 'File the return.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 18),
  ('step', null, null, 'E-verify it within 30 days.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 19),
  ('tip', null, null, 'A belated return can''t carry forward most losses. A house-property loss is the exception.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 20),
  ('tip', null, null, 'The deadline is 31 Dec 2026.', null, null, null, null, false, null, 'https://www.incometax.gov.in', '2026-10-16', 21)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'itr' and c.slug = 'belated';

-- =====================================================================
-- Driving licence
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (7 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'sarathi.parivahan.gov.in', 'https://sarathi.parivahan.gov.in', null, null, null, false, null, null, '2026-10-20', 1),
  ('link', 'official', null, 'transport.karnataka.gov.in', 'https://transport.karnataka.gov.in', null, null, null, false, null, null, '2026-10-20', 2),
  ('term', null, null, 'LL', 'Learner''s licence. It lets you practise on the road and is valid for 6 months.', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 3),
  ('term', null, null, 'DL', 'Driving licence, the permanent one. You apply for it after passing the driving test.', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 4),
  ('term', null, null, 'RTO', 'Regional Transport Office. Yours is the one that covers the address on your proof.', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 5),
  ('term', null, null, 'Vehicle class', 'What the licence lets you drive, such as a gearless two-wheeler, a geared motorcycle or a car (LMV). You can only test for the classes on your learner''s licence.', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 6),
  ('term', null, null, 'Form 1 and Form 1A', 'Form 1 is your own declaration that you are fit to drive. Form 1A is a medical certificate from a doctor, needed if you are 40 or over.', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 7)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'dl';

-- Driving licence > learner's licence (33 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'age:aadhaar', 'Proof of age, pick one', 'Aadhaar', null, null, null, 'Works for address too', false, 'aadhaar', 'https://sarathi.parivahan.gov.in', '2026-10-20', 1),
  ('document', 'age:class10', 'Proof of age, pick one', 'Class 10 certificate', null, null, null, null, false, 'class10', 'https://sarathi.parivahan.gov.in', '2026-10-20', 2),
  ('document', 'age:birth', 'Proof of age, pick one', 'Birth certificate', null, null, null, null, false, 'birth', 'https://sarathi.parivahan.gov.in', '2026-10-20', 3),
  ('document', 'age:passport', 'Proof of age, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://sarathi.parivahan.gov.in', '2026-10-20', 4),
  ('document', 'addr:aadhaar', 'Proof of address, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://sarathi.parivahan.gov.in', '2026-10-20', 5),
  ('document', 'addr:passport', 'Proof of address, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://sarathi.parivahan.gov.in', '2026-10-20', 6),
  ('document', 'addr:voter', 'Proof of address, pick one', 'Voter ID', null, null, null, null, false, 'voter', 'https://sarathi.parivahan.gov.in', '2026-10-20', 7),
  ('document', 'addr:utility', 'Proof of address, pick one', 'Utility bill', null, null, null, null, false, 'utility', 'https://sarathi.parivahan.gov.in', '2026-10-20', 8),
  ('document', 'photo', null, 'Recent photo and your signature', null, null, null, 'Uploaded on Sarathi', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 9),
  ('document', 'form1', null, 'Form 1, your declaration that you are fit to drive', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 10),
  ('document', 'form1a', null, 'Form 1A medical certificate', null, null, null, 'Only if you are 40 or over', true, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 11),
  ('fee', null, null, 'Learner''s licence fee', 'On Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 12),
  ('fee', null, null, 'Learner''s licence test fee', 'On Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 13),
  ('fee_note', null, null, 'The fee depends on how many vehicle classes you apply for. Sarathi shows the exact amount before you pay.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 14),
  ('fee_note', null, null, 'Pay only on Sarathi. Anything an agent charges on top is for their help.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 15),
  ('fee_note', 'total', null, 'See Sarathi', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 16),
  ('fee_note', 'short', null, 'On Sarathi', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 17),
  ('fee_note', 'headline', null, 'Check the fee', 'on Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 18),
  ('link', 'fee_check', null, 'sarathi.parivahan.gov.in', 'https://sarathi.parivahan.gov.in', null, null, null, false, null, null, '2026-10-20', 19),
  ('timing', 'summary', null, 'Online', 'Online test booking', null, null, 'sarathi.parivahan.gov.in', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 20),
  ('timing', 'online_title', null, 'Apply online', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 21),
  ('timing', 'online_text', null, 'Apply on sarathi.parivahan.gov.in and choose Karnataka. Upload your documents, pay the fee and book your learner''s licence test.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 22),
  ('timing', 'online_time', null, 'Your learner''s licence is valid for 6 months. You can apply for the driving licence from 30 days after you get it.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 23),
  ('link', 'online', null, 'sarathi.parivahan.gov.in', 'https://sarathi.parivahan.gov.in', null, null, null, false, null, null, '2026-10-20', 24),
  ('step', null, null, 'Check your age: 16 or over for a gearless two-wheeler up to 50cc, with a parent or guardian''s consent. 18 or over for other vehicles.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 25),
  ('step', null, null, 'Open sarathi.parivahan.gov.in, choose Karnataka and start a new learner''s licence application.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 26),
  ('step', null, null, 'Pick every vehicle class you plan to drive, such as a geared motorcycle or a car (LMV).', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 27),
  ('step', null, null, 'Upload your age and address proof, photo, signature and Form 1. Aadhaar works as both age and address proof. Add Form 1A if you are 40 or over.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 28),
  ('step', null, null, 'Pay the fee on Sarathi and book your learner''s licence test.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 29),
  ('step', null, null, 'Take the test on traffic rules and road signs. Once you pass, download your learner''s licence.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 30),
  ('tip', null, null, 'Your learner''s licence lasts 6 months. Apply for the driving licence before it runs out, or you start again.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 31),
  ('tip', null, null, 'Apply under the RTO that covers the address on your proof. The wrong RTO can send your application back.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 32),
  ('tip', null, null, 'Choose every vehicle class you want now. The driving test only covers the classes on your learner''s licence.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 33)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'dl' and c.slug = 'learner';

-- Driving licence > driving licence and test (28 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'll', null, 'Your valid learner''s licence', null, null, null, 'At least 30 days old', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 1),
  ('document', 'originals', null, 'Original proof of age and address', null, null, null, 'The ones you used for the learner''s licence', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 2),
  ('document', 'slot', null, 'Driving test slot booking', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 3),
  ('document', 'vehicle', null, 'A vehicle of the class you are testing for', null, null, null, 'With its registration, insurance and pollution certificate', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 4),
  ('document', 'form1a', null, 'Form 1A medical certificate', null, null, null, 'Only if you are 40 or over', true, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 5),
  ('fee', null, null, 'Driving test fee', 'On Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 6),
  ('fee', null, null, 'Driving licence card fee', 'On Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 7),
  ('fee_note', null, null, 'Sarathi shows the exact amount for your vehicle classes before you pay.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 8),
  ('fee_note', null, null, 'Pay only on Sarathi. Anything an agent charges on top is for their help.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 9),
  ('fee_note', 'total', null, 'See Sarathi', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 10),
  ('fee_note', 'short', null, 'On Sarathi', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 11),
  ('fee_note', 'headline', null, 'Check the fee', 'on Sarathi', null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 12),
  ('link', 'fee_check', null, 'sarathi.parivahan.gov.in', 'https://sarathi.parivahan.gov.in', null, null, null, false, null, null, '2026-10-20', 13),
  ('timing', 'summary', null, 'RTO test', 'Driving test at your RTO', null, null, 'Book on sarathi.parivahan.gov.in', false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 14),
  ('timing', 'online_title', null, 'Book online, test at your RTO', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 15),
  ('timing', 'online_text', null, 'Apply for the driving licence on sarathi.parivahan.gov.in under Karnataka, pay the fee and book a driving test slot at the RTO for your address. On the day, go with your vehicle and documents.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 16),
  ('timing', 'online_time', null, 'You can book from 30 days after your learner''s licence was issued, while it is still valid. After you pass, the licence card comes by post.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 17),
  ('link', 'online', null, 'sarathi.parivahan.gov.in', 'https://sarathi.parivahan.gov.in', null, null, null, false, null, null, '2026-10-20', 18),
  ('link', 'online', null, 'transport.karnataka.gov.in', 'https://transport.karnataka.gov.in', null, null, null, false, null, null, '2026-10-20', 19),
  ('step', null, null, 'Wait at least 30 days from the date on your learner''s licence, and apply before its 6 months run out.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 20),
  ('step', null, null, 'On Sarathi, choose Karnataka and apply for a driving licence with your learner''s licence number.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 21),
  ('step', null, null, 'Pay the fee and book a driving test slot at the RTO for your address.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 22),
  ('step', null, null, 'Practise on the same kind of vehicle you will test on.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 23),
  ('step', null, null, 'On test day, take the vehicle, your learner''s licence and your original documents to the RTO.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 24),
  ('step', null, null, 'Pass the test. Your driving licence card comes by post.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 25),
  ('tip', null, null, 'Don''t let your learner''s licence lapse while you wait for a slot. Book early.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 26),
  ('tip', null, null, 'Test on the class you applied for. A test on a gearless scooter does not give you a geared-motorcycle licence.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 27),
  ('tip', null, null, 'Missing papers on test day can cost you the slot. Carry every original, plus the vehicle''s registration, insurance and pollution certificate.', null, null, null, null, false, null, 'https://sarathi.parivahan.gov.in', '2026-10-20', 28)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'dl' and c.slug = 'test';

-- =====================================================================
-- Voter ID
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (7 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'voters.eci.gov.in', 'https://voters.eci.gov.in', null, null, null, false, null, null, '2026-10-20', 1),
  ('link', 'official', null, 'ceo.karnataka.gov.in', 'https://ceo.karnataka.gov.in', null, null, null, false, null, null, '2026-10-20', 2),
  ('term', null, null, 'EPIC', 'Elector''s Photo Identity Card, your voter ID. The e-EPIC is the digital version you can download.', null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 3),
  ('term', null, null, 'Form 6', 'The form to join the electoral roll as a new voter.', null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 4),
  ('term', null, null, 'Form 8', 'The form to shift your address, correct your details or get a replacement card.', null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 5),
  ('term', null, null, 'BLO', 'Booth Level Officer. They check the details in your application, usually with a visit to your address.', null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 6),
  ('term', null, null, 'Qualifying date', 'You join the roll for the first of these dates on which you are 18: 1 January, 1 April, 1 July or 1 October.', null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 7)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'voter';

-- Voter ID > new voter registration (30 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'photo', null, 'Recent passport-size colour photo', null, null, null, 'White background, 4.5 × 3.5 cm', false, null, 'https://voters.eci.gov.in', '2026-10-20', 1),
  ('document', 'age:aadhaar', 'Proof of age, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://voters.eci.gov.in', '2026-10-20', 2),
  ('document', 'age:birth', 'Proof of age, pick one', 'Birth certificate', null, null, null, null, false, 'birth', 'https://voters.eci.gov.in', '2026-10-20', 3),
  ('document', 'age:class10', 'Proof of age, pick one', 'Class 10 certificate', null, null, null, null, false, 'class10', 'https://voters.eci.gov.in', '2026-10-20', 4),
  ('document', 'age:pan', 'Proof of age, pick one', 'PAN card', null, null, null, null, false, 'pan', 'https://voters.eci.gov.in', '2026-10-20', 5),
  ('document', 'age:passport', 'Proof of age, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://voters.eci.gov.in', '2026-10-20', 6),
  ('document', 'age:dl', 'Proof of age, pick one', 'Driving licence', null, null, null, null, false, 'dl', 'https://voters.eci.gov.in', '2026-10-20', 7),
  ('document', 'addr:aadhaar', 'Proof of address, pick one', 'Aadhaar', null, null, null, null, false, 'aadhaar', 'https://voters.eci.gov.in', '2026-10-20', 8),
  ('document', 'addr:bank', 'Proof of address, pick one', 'Bank or post office passbook', null, null, null, null, false, 'bank', 'https://voters.eci.gov.in', '2026-10-20', 9),
  ('document', 'addr:utility', 'Proof of address, pick one', 'Utility bill', null, null, null, null, false, 'utility', 'https://voters.eci.gov.in', '2026-10-20', 10),
  ('document', 'addr:passport', 'Proof of address, pick one', 'Passport', null, null, null, null, false, 'passport', 'https://voters.eci.gov.in', '2026-10-20', 11),
  ('document', 'addr:rentreg', 'Proof of address, pick one', 'Registered rent agreement', null, null, null, null, false, 'rentreg', 'https://voters.eci.gov.in', '2026-10-20', 12),
  ('document', 'bonafide', null, 'Bonafide certificate from your college', null, null, null, 'Only if you register at your hostel address', true, null, 'https://voters.eci.gov.in', '2026-10-20', 13),
  ('fee', null, null, 'Form 6, new registration', '₹0', 0, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 14),
  ('fee', null, null, 'Voter ID card, posted to you', '₹0', 0, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 15),
  ('fee_note', null, null, 'Registering is free, and the card comes by speed post at no cost.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 16),
  ('timing', 'online_title', null, 'No office visit', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 17),
  ('timing', 'online_text', null, 'Fill in Form 6 on voters.eci.gov.in or in ECI''s app, ECINET. Upload your photo and proofs, then save the reference number.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 18),
  ('timing', 'online_time', null, 'A Booth Level Officer checks your details. Once you are approved, download your e-EPIC. The card is posted to you free.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 19),
  ('link', 'online', null, 'voters.eci.gov.in', 'https://voters.eci.gov.in', null, null, null, false, null, null, '2026-10-20', 20),
  ('step', null, null, 'Check you are eligible: an Indian citizen who is 18 on 1 January, 1 April, 1 July or 1 October. You can apply in advance from 17.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 21),
  ('step', null, null, 'Pick one address. Students away from home can choose their home address or their hostel or PG, but only one.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 22),
  ('step', null, null, 'Fill in Form 6 on voters.eci.gov.in or the ECINET app. Enter your name exactly as it is on your documents.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 23),
  ('step', null, null, 'Upload your photo, age proof and address proof, and submit.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 24),
  ('step', null, null, 'Save the reference number. You track the application with it.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 25),
  ('step', null, null, 'A Booth Level Officer (BLO) verifies your details. After approval, download your e-EPIC. The card comes by post.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 26),
  ('tip', null, null, 'Register in one place only. Already on a roll somewhere else? Shift it with Form 8 instead of filing a new Form 6.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 27),
  ('tip', null, null, 'Your name and birth date must match your documents. A mismatch can get the form sent back.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 28),
  ('tip', null, null, 'Keep the reference number. It is how you track the application.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 29),
  ('tip', null, null, 'A false statement in the form''s declaration is punishable under section 31 of the Representation of the People Act, 1950.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 30)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'voter' and c.slug = 'new';

-- Voter ID > shift or correction (17 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'epic', null, 'Your current EPIC number', null, null, null, null, false, 'voter', 'https://voters.eci.gov.in', '2026-10-20', 1),
  ('document', 'proof', null, 'Proof of the new address or the correct detail', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 2),
  ('document', 'photo', null, 'New photo', null, null, null, 'Only if you are changing your photo', true, null, 'https://voters.eci.gov.in', '2026-10-20', 3),
  ('fee', null, null, 'Form 8, shifting or correction', '₹0', 0, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 4),
  ('fee_note', null, null, 'Filing the form is free.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 5),
  ('timing', 'online_title', null, 'No office visit', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 6),
  ('timing', 'online_text', null, 'Fill in Form 8 on voters.eci.gov.in or the ECINET app. Choose shifting of residence, correction of entries or a replacement card.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 7),
  ('timing', 'online_time', null, 'A shift goes to the electoral officer for your new address. Once approved, you get a replacement card and return the old one.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 8),
  ('link', 'online', null, 'voters.eci.gov.in', 'https://voters.eci.gov.in', null, null, null, false, null, null, '2026-10-20', 9),
  ('step', null, null, 'Sign in on voters.eci.gov.in or the ECINET app and open Form 8.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 10),
  ('step', null, null, 'Pick one: shifting of residence, correction of entries, or a replacement card.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 11),
  ('step', null, null, 'To shift, enter the new address and upload proof of it. To correct, upload a document that shows the right detail.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 12),
  ('step', null, null, 'Submit and save the reference number.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 13),
  ('step', null, null, 'A BLO verifies the change. Once approved, download the updated e-EPIC.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 14),
  ('tip', null, null, 'Moved within Bengaluru or from another state? Shift with Form 8. A fresh Form 6 would put you on two rolls.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 15),
  ('tip', null, null, 'Correct only what is wrong, and attach a document that shows the right detail.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 16),
  ('tip', null, null, 'Keep the reference number to track the request.', null, null, null, null, false, null, 'https://voters.eci.gov.in', '2026-10-20', 17)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'voter' and c.slug = 'shift';

-- =====================================================================
-- Education loan
-- =====================================================================
-- Whole guide: official links, glossary and the price list on Fair price (8 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select t.id, null, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from tasks t, (values
  ('link', 'official', null, 'pmvidyalaxmi.co.in', 'https://pmvidyalaxmi.co.in', null, null, null, false, null, null, '2026-10-20', 1),
  ('link', 'official', null, 'incometaxindia.gov.in', 'https://www.incometaxindia.gov.in', null, null, null, false, null, null, '2026-10-20', 2),
  ('term', null, null, 'Co-applicant', 'A parent, guardian or spouse who signs the loan with you and shares the duty to repay it. Their income helps you qualify.', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 3),
  ('term', null, null, 'Collateral', 'Property or deposits pledged to the bank as security. PM-Vidyalaxmi loans at designated institutions need no collateral or guarantor. For other colleges, each bank sets the amount above which it asks for collateral.', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 4),
  ('term', null, null, 'Moratorium', 'The time before repayments start: the course period plus one year under PM-Vidyalaxmi. Interest still adds up during it unless a subsidy covers it.', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 5),
  ('term', null, null, 'Interest subsidy', 'Family income up to ₹4.5 lakh: full interest during the moratorium is covered on loans up to ₹10 lakh (PM-USP CSIS, technical and professional courses). Up to ₹8 lakh: 3% of the interest is covered (PM-Vidyalaxmi, designated institutions).', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 6),
  ('term', null, null, 'Section 80E', 'The interest you repay can be deducted from your taxable income, with no upper limit, for up to 8 years. It applies only under the old tax regime.', null, null, null, false, null, 'https://www.incometaxindia.gov.in', '2026-10-20', 7),
  ('term', null, null, 'Sanction letter', 'The bank''s approval, with the amount, the interest rate and the terms. Read it before you sign.', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 8)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'eduloan';

-- Education loan > loan for your course (34 rows)
insert into rules (task_id, case_id, type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
select c.task_id, c.id, v.type, v.key, v.group_label, v.label, v.value, v.amount::numeric, v.amount_max::numeric, v.notes, v.optional::boolean, v.my_doc, v.source_url, v.verified_on::date, v.sort_order::int
from cases c join tasks t on t.id = c.task_id, (values
  ('document', 'admit', null, 'Admission letter from the college', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 1),
  ('document', 'feestr', null, 'Fee structure from the college', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 2),
  ('document', 'marks', null, 'Class 10, Class 12 and entrance exam mark sheets', null, null, null, null, false, 'class10', 'https://pmvidyalaxmi.co.in', '2026-10-20', 3),
  ('document', 'kyc', null, 'KYC for you and your co-applicant', null, null, null, 'Such as Aadhaar and PAN', false, 'aadhaar', 'https://pmvidyalaxmi.co.in', '2026-10-20', 4),
  ('document', 'income', null, 'Co-applicant''s income proof', null, null, null, 'Salary slips, Form 16 or tax returns', false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 5),
  ('document', 'bank', null, 'Bank statements', null, null, null, null, false, 'bank', 'https://pmvidyalaxmi.co.in', '2026-10-20', 6),
  ('document', 'collateral', null, 'Collateral documents', null, null, null, 'Only for larger loans that need security', true, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 7),
  ('document', 'incomecert', null, 'Family income certificate', null, null, null, 'Only to claim an interest subsidy', true, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 8),
  ('fee', null, null, 'Interest rate', 'Set by each bank', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 9),
  ('fee', null, null, 'Processing fee', 'Varies by bank', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 10),
  ('fee_note', null, null, 'Under PM-Vidyalaxmi, the interest rate is capped at the bank''s external benchmark lending rate (EBLR) plus 0.5%.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 11),
  ('fee_note', null, null, 'Family income up to ₹4.5 lakh: full interest subsidy during the moratorium, on loans up to ₹10 lakh (PM-USP CSIS).', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 12),
  ('fee_note', null, null, 'Family income up to ₹8 lakh: 3% interest subsidy during the moratorium, on loans up to ₹10 lakh (PM-Vidyalaxmi).', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 13),
  ('fee_note', null, null, 'Repayment under PM-Vidyalaxmi runs up to 15 years after the moratorium.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 14),
  ('fee_note', null, null, 'Interest you repay can be deducted from taxable income under section 80E, for up to 8 years, under the old tax regime.', null, null, null, null, false, null, 'https://www.incometaxindia.gov.in', '2026-10-20', 15),
  ('fee_note', 'total', null, 'Varies by bank', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 16),
  ('fee_note', 'short', null, 'Varies', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 17),
  ('fee_note', 'headline', null, 'Compare banks', 'rates vary', null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 18),
  ('timing', 'summary', null, 'Online', 'Online or at a bank', null, null, 'pmvidyalaxmi.co.in', false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 19),
  ('timing', 'online_title', null, 'One application, many banks', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 20),
  ('timing', 'online_text', null, 'Fill in one common education loan application on the PM-Vidyalaxmi portal and send it to the banks you choose. You can also apply directly at a bank branch.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 21),
  ('timing', 'online_time', null, 'Banks review your application and send a sanction letter. The money usually goes straight to the college, each semester or year.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 22),
  ('link', 'online', null, 'pmvidyalaxmi.co.in', 'https://pmvidyalaxmi.co.in', null, null, null, false, null, null, '2026-10-20', 23),
  ('step', null, null, 'Check your eligibility: your admission, your course, and whether your college is on the PM-Vidyalaxmi list.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 24),
  ('step', null, null, 'Work out the amount from the college''s fee structure, plus other costs the bank allows.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 25),
  ('step', null, null, 'Compare banks on interest rate, processing fee, collateral rules and the moratorium.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 26),
  ('step', null, null, 'Apply with one common form on the PM-Vidyalaxmi portal, or directly at a bank.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 27),
  ('step', null, null, 'Claim any interest subsidy you qualify for, with your family income certificate.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 28),
  ('step', null, null, 'Read the sanction letter and sign once you agree with the terms.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 29),
  ('step', null, null, 'The bank pays the college directly, usually each semester or year.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 30),
  ('tip', null, null, 'Compare interest rates before you sign. A small difference adds up over years of repayment.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 31),
  ('tip', null, null, 'Family income up to ₹8 lakh? Check for an interest subsidy before you apply. It is easy to miss.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 32),
  ('tip', null, null, 'Know when the moratorium ends: the course period plus one year under PM-Vidyalaxmi. Repayments start after it.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 33),
  ('tip', null, null, 'Management and NRI quota admissions don''t get PM-Vidyalaxmi benefits.', null, null, null, null, false, null, 'https://pmvidyalaxmi.co.in', '2026-10-20', 34)
) as v(type, key, group_label, label, value, amount, amount_max, notes, optional, my_doc, source_url, verified_on, sort_order)
where t.slug = 'eduloan' and c.slug = 'apply';

-- ---------------------------------------------------------------------
-- Hindi and Kannada (461 sentences), copied from the site's translations
-- ---------------------------------------------------------------------
insert into translations (en, hi, kn) values
  ('Aadhaar update', 'आधार अपडेट', 'ಆಧಾರ್ ನವೀಕರಣ'),
  ('Change your address, name, birth date, mobile or photo', 'अपना पता, नाम, जन्मतिथि, मोबाइल या फ़ोटो बदलें', 'ನಿಮ್ಮ ವಿಳಾಸ, ಹೆಸರು, ಜನ್ಮ ದಿನಾಂಕ, ಮೊಬೈಲ್ ಅಥವಾ ಫೋಟೋ ಬದಲಿಸಿ'),
  ('Aadhaar', 'आधार', 'ಆಧಾರ್'),
  ('Online or visit', 'ऑनलाइन या जाकर', 'ಆನ್‌ಲೈನ್ ಅಥವಾ ಭೇಟಿ'),
  ('from ₹75', '₹75 से', '₹75ರಿಂದ'),
  ('UIDAI helpline', 'UIDAI हेल्पलाइन', 'UIDAI ಸಹಾಯವಾಣಿ'),
  ('Address', 'पता', 'ವಿಳಾಸ'),
  ('address change', 'पता बदलना', 'ವಿಳಾಸ ಬದಲಾವಣೆ'),
  ('Name or DOB', 'नाम या जन्मतिथि', 'ಹೆಸರು ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕ'),
  ('name or birth date change', 'नाम या जन्मतिथि बदलना', 'ಹೆಸರು ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕ ಬದಲಾವಣೆ'),
  ('Mobile', 'मोबाइल', 'ಮೊಬೈಲ್'),
  ('mobile number update', 'मोबाइल नंबर अपडेट', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನವೀಕರಣ'),
  ('No other documents needed.', 'कोई और दस्तावेज़ नहीं चाहिए।', 'ಬೇರೆ ಯಾವುದೇ ದಾಖಲೆ ಬೇಕಿಲ್ಲ.'),
  ('Photo', 'फ़ोटो', 'ಫೋಟೋ'),
  ('photo or fingerprint update', 'फ़ोटो या फ़िंगरप्रिंट अपडेट', 'ಫೋಟೋ ಅಥವಾ ಬೆರಳಚ್ಚು ನವೀಕರಣ'),
  ('No documents needed.', 'कोई दस्तावेज़ नहीं चाहिए।', 'ಯಾವುದೇ ದಾಖಲೆ ಬೇಕಿಲ್ಲ.'),
  ('PAN card', 'पैन कार्ड', 'ಪ್ಯಾನ್ ಕಾರ್ಡ್'),
  ('Free e-PAN in about 10 min', 'लगभग 10 मिनट में मुफ़्त ई-पैन', 'ಸುಮಾರು 10 ನಿಮಿಷದಲ್ಲಿ ಉಚಿತ ಇ-ಪ್ಯಾನ್'),
  ('PAN', 'पैन', 'ಪ್ಯಾನ್'),
  ('Online', 'ऑनलाइन', 'ಆನ್‌ಲೈನ್'),
  ('Free', 'मुफ़्त', 'ಉಚಿತ'),
  ('Instant e-PAN', 'तुरंत ई-पैन', 'ತಕ್ಷಣದ ಇ-ಪ್ಯಾನ್'),
  ('instant e-PAN', 'तुरंत ई-पैन', 'ತಕ್ಷಣದ ಇ-ಪ್ಯಾನ್'),
  ('Card by post', 'डाक से कार्ड', 'ಅಂಚೆಯಲ್ಲಿ ಕಾರ್ಡ್'),
  ('PAN card by post', 'डाक से पैन कार्ड', 'ಅಂಚೆಯಲ್ಲಿ ಪ್ಯಾನ್ ಕಾರ್ಡ್'),
  ('Correction', 'सुधार', 'ತಿದ್ದುಪಡಿ'),
  ('PAN correction', 'पैन सुधार', 'ಪ್ಯಾನ್ ತಿದ್ದುಪಡಿ'),
  ('Passport', 'पासपोर्ट', 'ಪಾಸ್‌ಪೋರ್ಟ್'),
  ('First, renewal or Tatkal', 'पहला, नवीनीकरण या तत्काल', 'ಮೊದಲ, ನವೀಕರಣ ಅಥವಾ ತತ್ಕಾಲ್'),
  ('Visit', 'जाकर', 'ಭೇಟಿ'),
  ('from ₹2,500', '₹2,500 से', '₹2,500ರಿಂದ'),
  ('Passport Seva helpline', 'पासपोर्ट सेवा हेल्पलाइन', 'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಸಹಾಯವಾಣಿ'),
  ('First passport', 'पहला पासपोर्ट', 'ಮೊದಲ ಪಾಸ್‌ಪೋರ್ಟ್'),
  ('first passport', 'पहला पासपोर्ट', 'ಮೊದಲ ಪಾಸ್‌ಪೋರ್ಟ್'),
  ('Renewal', 'नवीनीकरण', 'ನವೀಕರಣ'),
  ('passport renewal', 'पासपोर्ट नवीनीकरण', 'ಪಾಸ್‌ಪೋರ್ಟ್ ನವೀಕರಣ'),
  ('Tatkal', 'तत्काल', 'ತತ್ಕಾಲ್'),
  ('Tatkal passport', 'तत्काल पासपोर्ट', 'ತತ್ಕಾಲ್ ಪಾಸ್‌ಪೋರ್ಟ್'),
  ('Rent agreement', 'किराया अनुबंध', 'ಬಾಡಿಗೆ ಒಪ್ಪಂದ'),
  ('11-month lease, e-stamp', '11 महीने का अनुबंध, ई-स्टांप', '11 ತಿಂಗಳ ಗುತ್ತಿಗೆ, ಇ-ಸ್ಟ್ಯಾಂಪ್'),
  ('Rent', 'किराया', 'ಬಾಡಿಗೆ'),
  ('No office', 'कोई दफ़्तर नहीं', 'ಕಚೇರಿ ಬೇಕಿಲ್ಲ'),
  ('Drafting help is a paid professional service whose prices vary, so there is no fair-price check for it.', 'अनुबंध लिखवाने की मदद एक पेशेवर सेवा है जिसकी क़ीमतें अलग-अलग होती हैं, इसलिए इसके लिए सही दाम की जाँच नहीं है।', 'ಒಪ್ಪಂದ ಬರೆಸುವ ನೆರವು ಬೆಲೆ ಬದಲಾಗುವ ವೃತ್ತಿಪರ ಸೇವೆ, ಹಾಗಾಗಿ ಇದಕ್ಕೆ ನ್ಯಾಯ ಬೆಲೆ ಪರಿಶೀಲನೆ ಇಲ್ಲ.'),
  ('11-month lease', '11 महीने का किराया अनुबंध', '11 ತಿಂಗಳ ಗುತ್ತಿಗೆ'),
  ('e-stamp paper on shcilestamp.com', 'shcilestamp.com पर ई-स्टांप पेपर', 'shcilestamp.com ನಲ್ಲಿ ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ'),
  ('Late tax return', 'देरी से आयकर रिटर्न', 'ತಡವಾದ ತೆರಿಗೆ ರಿಟರ್ನ್'),
  ('FY 2025-26, by 31 Dec', 'वित्त वर्ष 2025-26, 31 दिसंबर तक', 'ಹಣಕಾಸು ವರ್ಷ 2025-26, 31 ಡಿಸೆಂಬರ್ ಒಳಗೆ'),
  ('Filing help is a paid professional service whose prices vary, so there is no fair-price check for it.', 'रिटर्न भरवाने की मदद एक पेशेवर सेवा है जिसकी क़ीमतें अलग-अलग होती हैं, इसलिए इसके लिए सही दाम की जाँच नहीं है।', 'ರಿಟರ್ನ್ ಸಲ್ಲಿಸುವ ನೆರವು ಬೆಲೆ ಬದಲಾಗುವ ವೃತ್ತಿಪರ ಸೇವೆ, ಹಾಗಾಗಿ ಇದಕ್ಕೆ ನ್ಯಾಯ ಬೆಲೆ ಪರಿಶೀಲನೆ ಇಲ್ಲ.'),
  ('Belated return', 'देरी से रिटर्न', 'ತಡವಾದ ರಿಟರ್ನ್'),
  ('belated return for FY 2025-26', 'वित्त वर्ष 2025-26 का देरी से रिटर्न', 'ಹಣಕಾಸು ವರ್ಷ 2025-26ರ ತಡವಾದ ರಿಟರ್ನ್'),
  ('Driving licence', 'ड्राइविंग लाइसेंस', 'ಚಾಲನಾ ಪರವಾನಗಿ'),
  ('Learner''s licence first, then the driving test', 'पहले लर्नर लाइसेंस, फिर ड्राइविंग टेस्ट', 'ಮೊದಲು ಕಲಿಕಾ ಪರವಾನಗಿ, ನಂತರ ಚಾಲನಾ ಪರೀಕ್ಷೆ'),
  ('Licence', 'लाइसेंस', 'ಪರವಾನಗಿ'),
  ('Online, then RTO', 'ऑनलाइन, फिर RTO', 'ಆನ್‌ಲೈನ್, ನಂತರ RTO'),
  ('Fee on Sarathi', 'शुल्क सारथी पर', 'ಶುಲ್ಕ ಸಾರಥಿಯಲ್ಲಿ'),
  ('Fees depend on your vehicle classes and Sarathi shows the exact amount before you pay, so there is no fair-price check for this guide.', 'शुल्क आपकी वाहन श्रेणियों पर निर्भर है और सारथी भुगतान से पहले सही रक़म दिखाता है, इसलिए इस गाइड में सही दाम की जाँच नहीं है।', 'ಶುಲ್ಕ ನಿಮ್ಮ ವಾಹನ ವರ್ಗಗಳನ್ನು ಅವಲಂಬಿಸಿದೆ ಮತ್ತು ಪಾವತಿಸುವ ಮೊದಲೇ ಸಾರಥಿ ನಿಖರ ಮೊತ್ತ ತೋರಿಸುತ್ತದೆ, ಹಾಗಾಗಿ ಈ ಮಾರ್ಗದರ್ಶಿಗೆ ನ್ಯಾಯ ಬೆಲೆ ಪರಿಶೀಲನೆ ಇಲ್ಲ.'),
  ('Learner''s licence', 'लर्नर लाइसेंस', 'ಕಲಿಕಾ ಪರವಾನಗಿ'),
  ('learner''s licence', 'लर्नर लाइसेंस', 'ಕಲಿಕಾ ಪರವಾನಗಿ'),
  ('Documents and forms on Sarathi', 'सारथी पर दस्तावेज़ और फ़ॉर्म', 'ಸಾರಥಿಯಲ್ಲಿ ದಾಖಲೆಗಳು ಮತ್ತು ಫಾರ್ಮ್‌ಗಳು'),
  ('driving licence and test', 'ड्राइविंग लाइसेंस और टेस्ट', 'ಚಾಲನಾ ಪರವಾನಗಿ ಮತ್ತು ಪರೀಕ್ಷೆ'),
  ('Driving licence services on Sarathi', 'सारथी पर ड्राइविंग लाइसेंस सेवाएँ', 'ಸಾರಥಿಯಲ್ಲಿ ಚಾಲನಾ ಪರವಾನಗಿ ಸೇವೆಗಳು'),
  ('Voter ID', 'वोटर आईडी', 'ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ'),
  ('Register to vote, move or correct your card', 'वोट के लिए पंजीकरण, पता बदलें या कार्ड सुधारें', 'ಮತದಾನಕ್ಕೆ ನೋಂದಣಿ, ವಿಳಾಸ ಬದಲಾವಣೆ ಅಥವಾ ಕಾರ್ಡ್ ತಿದ್ದುಪಡಿ'),
  ('Voter helpline', 'मतदाता हेल्पलाइन', 'ಮತದಾರರ ಸಹಾಯವಾಣಿ'),
  ('Registering is free and you can do it yourself online, so there is no fair-price check. Anyone charging you is charging for help, not for the form.', 'पंजीकरण मुफ़्त है और आप इसे ख़ुद ऑनलाइन कर सकते हैं, इसलिए सही दाम की जाँच नहीं है। जो पैसे माँगता है, वह मदद के माँग रहा है, फ़ॉर्म के नहीं।', 'ನೋಂದಣಿ ಉಚಿತ ಮತ್ತು ನೀವೇ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಮಾಡಬಹುದು, ಹಾಗಾಗಿ ನ್ಯಾಯ ಬೆಲೆ ಪರಿಶೀಲನೆ ಇಲ್ಲ. ಹಣ ಕೇಳುವವರು ನೆರವಿಗಾಗಿ ಕೇಳುತ್ತಿದ್ದಾರೆ, ಫಾರ್ಮ್‌ಗಾಗಿ ಅಲ್ಲ.'),
  ('New voter', 'नया मतदाता', 'ಹೊಸ ಮತದಾರ'),
  ('new voter registration', 'नए मतदाता का पंजीकरण', 'ಹೊಸ ಮತದಾರರ ನೋಂದಣಿ'),
  ('Studying away from home, in a hostel or PG in Bengaluru? You can register at your home address or where you live now, but only in one place.', 'घर से दूर, बेंगलुरु में हॉस्टल या PG में रहकर पढ़ रहे हैं? आप घर के पते पर या जहाँ अभी रहते हैं वहाँ पंजीकरण कर सकते हैं, पर सिर्फ़ एक जगह।', 'ಮನೆಯಿಂದ ದೂರ, ಬೆಂಗಳೂರಿನ ಹಾಸ್ಟೆಲ್ ಅಥವಾ PGಯಲ್ಲಿದ್ದು ಓದುತ್ತಿದ್ದೀರಾ? ಮನೆಯ ವಿಳಾಸದಲ್ಲಿ ಅಥವಾ ಈಗ ವಾಸಿಸುವಲ್ಲಿ ನೋಂದಾಯಿಸಬಹುದು, ಆದರೆ ಒಂದೇ ಕಡೆ.'),
  ('Form 6 on voters.eci.gov.in', 'voters.eci.gov.in पर फ़ॉर्म 6', 'voters.eci.gov.in ನಲ್ಲಿ ಫಾರ್ಮ್ 6'),
  ('Shift or correct', 'पता बदलें या सुधारें', 'ಸ್ಥಳಾಂತರ ಅಥವಾ ತಿದ್ದುಪಡಿ'),
  ('shift or correction', 'पता बदलना या सुधार', 'ಸ್ಥಳಾಂತರ ಅಥವಾ ತಿದ್ದುಪಡಿ'),
  ('Form 8 on voters.eci.gov.in', 'voters.eci.gov.in पर फ़ॉर्म 8', 'voters.eci.gov.in ನಲ್ಲಿ ಫಾರ್ಮ್ 8'),
  ('Education loan', 'शिक्षा ऋण', 'ಶಿಕ್ಷಣ ಸಾಲ'),
  ('One application to many banks, plus interest subsidies', 'एक आवेदन कई बैंकों तक, साथ में ब्याज सब्सिडी', 'ಹಲವು ಬ್ಯಾಂಕ್‌ಗಳಿಗೆ ಒಂದೇ ಅರ್ಜಿ, ಜೊತೆಗೆ ಬಡ್ಡಿ ಸಹಾಯಧನ'),
  ('Loan', 'ऋण', 'ಸಾಲ'),
  ('Online or bank', 'ऑनलाइन या बैंक', 'ಆನ್‌ಲೈನ್ ಅಥವಾ ಬ್ಯಾಂಕ್'),
  ('Rates vary', 'दरें अलग-अलग', 'ದರಗಳು ಬೇರೆ ಬೇರೆ'),
  ('Interest rates and processing fees differ by bank, so there is no single fair price to check against. Compare offers before you choose.', 'ब्याज दरें और प्रोसेसिंग शुल्क हर बैंक में अलग हैं, इसलिए जाँचने के लिए कोई एक सही दाम नहीं है। चुनने से पहले ऑफ़र की तुलना करें।', 'ಬಡ್ಡಿ ದರ ಮತ್ತು ಸಂಸ್ಕರಣಾ ಶುಲ್ಕ ಬ್ಯಾಂಕ್‌ನಿಂದ ಬ್ಯಾಂಕ್‌ಗೆ ಬೇರೆ, ಹಾಗಾಗಿ ಹೋಲಿಸಲು ಒಂದೇ ನ್ಯಾಯ ಬೆಲೆ ಇಲ್ಲ. ಆರಿಸುವ ಮೊದಲು ಆಫರ್‌ಗಳನ್ನು ಹೋಲಿಸಿ.'),
  ('New loan', 'नया ऋण', 'ಹೊಸ ಸಾಲ'),
  ('loan for your course', 'आपके कोर्स के लिए ऋण', 'ನಿಮ್ಮ ಕೋರ್ಸ್‌ಗೆ ಸಾಲ'),
  ('Admitted on merit to a designated institution? PM-Vidyalaxmi loans need no collateral and no guarantor. Management and NRI quota seats are not covered.', 'किसी चुने हुए संस्थान में मेरिट से दाख़िला मिला है? PM-विद्यालक्ष्मी ऋण के लिए न गिरवी चाहिए, न गारंटर। मैनेजमेंट और NRI कोटे की सीटें इसमें शामिल नहीं हैं।', 'ನಿಗದಿತ ಸಂಸ್ಥೆಗೆ ಅರ್ಹತೆಯ ಮೇಲೆ ಪ್ರವೇಶ ಸಿಕ್ಕಿದೆಯೇ? PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಸಾಲಕ್ಕೆ ಭದ್ರತೆಯಾಗಲಿ ಜಾಮೀನುದಾರರಾಗಲಿ ಬೇಕಿಲ್ಲ. ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಮತ್ತು NRI ಕೋಟಾ ಸೀಟುಗಳಿಗೆ ಇದು ಅನ್ವಯಿಸದು.'),
  ('Loan schemes on PM-Vidyalaxmi', 'PM-विद्यालक्ष्मी पर ऋण योजनाएँ', 'PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿಯಲ್ಲಿ ಸಾಲ ಯೋಜನೆಗಳು'),
  ('Aadhaar Seva Kendra, South End Circle', 'आधार सेवा केंद्र, साउथ एंड सर्कल', 'ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರ, ಸೌತ್ ಎಂಡ್ ಸರ್ಕಲ್'),
  ('South End Circle', 'साउथ एंड सर्कल', 'ಸೌತ್ ಎಂಡ್ ಸರ್ಕಲ್'),
  ('Basavanagudi', 'बसवनगुडी', 'ಬಸವನಗುಡಿ'),
  ('Typically 9:30 AM to 5:30 PM, every day.', 'आमतौर पर सुबह 9:30 से शाम 5:30 तक, हर दिन।', 'ಸಾಮಾನ್ಯವಾಗಿ ಬೆಳಿಗ್ಗೆ 9:30ರಿಂದ ಸಂಜೆ 5:30ರವರೆಗೆ, ಪ್ರತಿದಿನ.'),
  ('Walk in or book a slot online.', 'सीधे जाएँ या ऑनलाइन स्लॉट बुक करें।', 'ನೇರವಾಗಿ ಹೋಗಿ ಅಥವಾ ಆನ್‌ಲೈನ್ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'),
  ('Aadhaar Seva Kendra, Majestic', 'आधार सेवा केंद्र, मैजेस्टिक', 'ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರ, ಮೆಜೆಸ್ಟಿಕ್'),
  ('Majestic', 'मैजेस्टिक', 'ಮೆಜೆಸ್ಟಿಕ್'),
  ('Gandhi Nagar', 'गांधी नगर', 'ಗಾಂಧಿ ನಗರ'),
  ('Passport Seva Kendra, Lalbagh', 'पासपोर्ट सेवा केंद्र, लालबाग', 'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರ, ಲಾಲ್‌ಬಾಗ್'),
  ('Lalbagh', 'लालबाग', 'ಲಾಲ್‌ಬಾಗ್'),
  ('Lalbagh Road', 'लालबाग रोड', 'ಲಾಲ್‌ಬಾಗ್ ರಸ್ತೆ'),
  ('Appointments roughly 9 AM to 4 PM, Monday to Friday.', 'अपॉइंटमेंट लगभग सुबह 9 से शाम 4 बजे तक, सोमवार से शुक्रवार।', 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಸುಮಾರು ಬೆಳಿಗ್ಗೆ 9ರಿಂದ ಸಂಜೆ 4ರವರೆಗೆ, ಸೋಮವಾರದಿಂದ ಶುಕ್ರವಾರ.'),
  ('Appointment only. Book on passportindia.gov.in or the mPassport Seva app.', 'सिर्फ़ अपॉइंटमेंट से। passportindia.gov.in या mPassport Seva ऐप पर बुक करें।', 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮೂಲಕ ಮಾತ್ರ. passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ.'),
  ('Passport Seva Kendra, Whitefield', 'पासपोर्ट सेवा केंद्र, व्हाइटफ़ील्ड', 'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರ, ವೈಟ್‌ಫೀಲ್ಡ್'),
  ('Whitefield', 'व्हाइटफ़ील्ड', 'ವೈಟ್‌ಫೀಲ್ಡ್'),
  ('EPIP Zone, Whitefield', 'EPIP ज़ोन, व्हाइटफ़ील्ड', 'EPIP ವಲಯ, ವೈಟ್‌ಫೀಲ್ಡ್'),
  ('PSK Whitefield moved on 5 Oct 2026. It is now at GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro. It used to be at Sai Arcade, Marathahalli, so don''t go to the old address.', 'PSK व्हाइटफ़ील्ड 5 अक्टू॰ 2026 को शिफ़्ट हो गया। अब यह GM Tech Park, Road No. 3, EPIP ज़ोन, नल्लूरहल्ली मेट्रो के पास है। पहले यह साई आर्केड, मराठाहल्ली में था, इसलिए पुराने पते पर न जाएँ।', 'PSK ವೈಟ್‌ಫೀಲ್ಡ್ 5 ಅಕ್ಟೋ 2026ರಂದು ಸ್ಥಳಾಂತರಗೊಂಡಿದೆ. ಈಗ ಅದು GM Tech Park, Road No. 3, EPIP ವಲಯ, ನಲ್ಲೂರಹಳ್ಳಿ ಮೆಟ್ರೋ ಬಳಿ ಇದೆ. ಹಿಂದೆ ಸಾಯಿ ಆರ್ಕೇಡ್, ಮಾರತ್‌ಹಳ್ಳಿಯಲ್ಲಿತ್ತು, ಹಾಗಾಗಿ ಹಳೆಯ ವಿಳಾಸಕ್ಕೆ ಹೋಗಬೇಡಿ.'),
  ('New address since 5 Oct 2026', '5 अक्टू॰ 2026 से नया पता', '5 ಅಕ್ಟೋ 2026ರಿಂದ ಹೊಸ ವಿಳಾಸ'),
  ('Address, name, birth date or mobile update', 'पता, नाम, जन्मतिथि या मोबाइल अपडेट', 'ವಿಳಾಸ, ಹೆಸರು, ಜನ್ಮ ದಿನಾಂಕ ಅಥವಾ ಮೊಬೈಲ್ ನವೀಕರಣ'),
  ('Photo or fingerprint update (also with other changes)', 'फ़ोटो या फ़िंगरप्रिंट अपडेट (दूसरे बदलावों के साथ भी)', 'ಫೋಟೋ ಅಥವಾ ಬೆರಳಚ್ಚು ನವೀಕರಣ (ಇತರ ಬದಲಾವಣೆಗಳೊಂದಿಗೂ)'),
  ('Colour printout', 'रंगीन प्रिंट', 'ಬಣ್ಣದ ಮುದ್ರಣ'),
  ('e-Aadhaar download', 'ई-आधार डाउनलोड', 'ಇ-ಆಧಾರ್ ಡೌನ್‌ಲೋಡ್'),
  ('Documents-only update online, until 14 June 2027', 'सिर्फ़ दस्तावेज़ अपडेट ऑनलाइन, 14 जून 2027 तक', 'ದಾಖಲೆ ಮಾತ್ರ ನವೀಕರಣ ಆನ್‌ಲೈನ್, 14 ಜೂನ್ 2027ರವರೆಗೆ'),
  ('Aadhaar card or number', 'आधार कार्ड या नंबर', 'ಆಧಾರ್ ಕಾರ್ಡ್ ಅಥವಾ ಸಂಖ್ಯೆ'),
  ('Proof of address, pick one', 'पते का प्रमाण, कोई एक', 'ವಿಳಾಸದ ಪುರಾವೆ, ಯಾವುದಾದರೂ ಒಂದು'),
  ('Bank passbook or statement', 'बैंक पासबुक या स्टेटमेंट', 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಅಥವಾ ಸ್ಟೇಟ್‌ಮೆಂಟ್'),
  ('Utility bill from the last 3 months', 'पिछले 3 महीने का बिजली/पानी/गैस बिल', 'ಕಳೆದ 3 ತಿಂಗಳ ಉಪಯುಕ್ತತಾ ಬಿಲ್'),
  ('Registered rent agreement', 'पंजीकृत किराया अनुबंध', 'ನೋಂದಾಯಿತ ಬಾಡಿಗೆ ಒಪ್ಪಂದ'),
  ('Ration card', 'राशन कार्ड', 'ಪಡಿತರ ಚೀಟಿ'),
  ('Phone linked to Aadhaar', 'आधार से जुड़ा फ़ोन', 'ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆದ ಫೋನ್'),
  ('For the OTP, if you update online', 'OTP के लिए, अगर ऑनलाइन अपडेट करें', 'OTPಗಾಗಿ, ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನವೀಕರಿಸಿದರೆ'),
  ('Demographic update, address', 'जनसांख्यिकीय अपडेट, पता', 'ಜನಸಂಖ್ಯಾ ವಿವರ ನವೀಕರಣ, ವಿಳಾಸ'),
  ('Colour printout of your Aadhaar, if you want one: ₹40.', 'आधार का रंगीन प्रिंट चाहिए तो: ₹40।', 'ಆಧಾರ್‌ನ ಬಣ್ಣದ ಮುದ್ರಣ ಬೇಕಿದ್ದರೆ: ₹40.'),
  ('Downloading e-Aadhaar is free.', 'ई-आधार डाउनलोड करना मुफ़्त है।', 'ಇ-ಆಧಾರ್ ಡೌನ್‌ಲೋಡ್ ಉಚಿತ.'),
  ('Only updating your identity and address documents online, with no change to your details, is free until 14 June 2027.', 'जानकारी बदले बिना सिर्फ़ पहचान और पते के दस्तावेज़ ऑनलाइन अपडेट करना 14 जून 2027 तक मुफ़्त है।', 'ವಿವರಗಳನ್ನು ಬದಲಿಸದೆ ಗುರುತು ಮತ್ತು ವಿಳಾಸದ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನವೀಕರಿಸುವುದು 14 ಜೂನ್ 2027ರವರೆಗೆ ಉಚಿತ.'),
  ('Update your address on myaadhaar.uidai.gov.in. Sign in with the OTP sent to the phone linked to your Aadhaar, upload a clear scan of your proof and pay ₹75 online.', 'myaadhaar.uidai.gov.in पर अपना पता अपडेट करें। आधार से जुड़े फ़ोन पर आए OTP से साइन इन करें, प्रमाण का साफ़ स्कैन अपलोड करें और ₹75 ऑनलाइन चुकाएँ।', 'myaadhaar.uidai.gov.in ನಲ್ಲಿ ವಿಳಾಸ ನವೀಕರಿಸಿ. ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆದ ಫೋನ್‌ಗೆ ಬಂದ OTP ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ, ಪುರಾವೆಯ ಸ್ಪಷ್ಟ ಸ್ಕ್ಯಾನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ₹75 ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ.'),
  ('You can finish the form in one sitting at home. UIDAI processes the update afterwards.', 'आप घर बैठे एक ही बार में फ़ॉर्म पूरा कर सकते हैं। UIDAI बाद में अपडेट प्रोसेस करता है।', 'ಮನೆಯಲ್ಲೇ ಒಂದೇ ಬಾರಿಗೆ ಫಾರ್ಮ್ ಮುಗಿಸಬಹುದು. UIDAI ನಂತರ ನವೀಕರಣವನ್ನು ಸಂಸ್ಕರಿಸುತ್ತದೆ.'),
  ('Pick one proof of address that shows your name and your current address.', 'पते का ऐसा एक प्रमाण चुनें जिस पर आपका नाम और मौजूदा पता हो।', 'ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಈಗಿನ ವಿಳಾಸ ಇರುವ ಒಂದು ವಿಳಾಸ ಪುರಾವೆ ಆರಿಸಿ.'),
  ('Decide where: online on myaadhaar.uidai.gov.in, or at an Aadhaar Seva Kendra (walk in or book a slot online).', 'तय करें कहाँ: myaadhaar.uidai.gov.in पर ऑनलाइन, या आधार सेवा केंद्र में (सीधे जाएँ या ऑनलाइन स्लॉट बुक करें)।', 'ಎಲ್ಲಿ ಎಂದು ನಿರ್ಧರಿಸಿ: myaadhaar.uidai.gov.in ನಲ್ಲಿ ಆನ್‌ಲೈನ್, ಅಥವಾ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ (ನೇರ ಭೇಟಿ ಅಥವಾ ಆನ್‌ಲೈನ್ ಸ್ಲಾಟ್ ಬುಕ್).'),
  ('Online, sign in with the OTP sent to the phone linked to your Aadhaar. At a centre, ask for an address update at the counter.', 'ऑनलाइन, आधार से जुड़े फ़ोन पर आए OTP से साइन इन करें। केंद्र में, काउंटर पर पता अपडेट माँगें।', 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ, ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆಗಿರುವ ಫೋನ್‌ಗೆ ಬಂದ OTP ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ. ಕೇಂದ್ರದಲ್ಲಿ, ಕೌಂಟರ್‌ನಲ್ಲಿ ವಿಳಾಸ ನವೀಕರಣ ಕೇಳಿ.'),
  ('Enter the new address exactly as it appears on your proof.', 'नया पता ठीक वैसे ही भरें जैसा आपके प्रमाण पर है।', 'ಹೊಸ ವಿಳಾಸವನ್ನು ನಿಮ್ಮ ಪುರಾವೆಯಲ್ಲಿರುವಂತೆಯೇ ನಮೂದಿಸಿ.'),
  ('Upload a clear scan of the proof, or show the original at the counter.', 'प्रमाण का साफ़ स्कैन अपलोड करें, या काउंटर पर मूल दिखाएँ।', 'ಪುರಾವೆಯ ಸ್ಪಷ್ಟ ಸ್ಕ್ಯಾನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಅಥವಾ ಕೌಂಟರ್‌ನಲ್ಲಿ ಮೂಲ ತೋರಿಸಿ.'),
  ('Pay ₹75 and keep the acknowledgement with its update request number. Use that number to track the update.', '₹75 चुकाएँ और अपडेट अनुरोध नंबर वाली पावती रखें। उसी नंबर से अपडेट ट्रैक करें।', '₹75 ಪಾವತಿಸಿ, ನವೀಕರಣ ವಿನಂತಿ ಸಂಖ್ಯೆಯಿರುವ ಸ್ವೀಕೃತಿ ಇಟ್ಟುಕೊಳ್ಳಿ. ಅದೇ ಸಂಖ್ಯೆಯಿಂದ ನವೀಕರಣದ ಸ್ಥಿತಿ ನೋಡಿ.'),
  ('The name on your proof should match the name on your Aadhaar.', 'आपके प्रमाण पर लिखा नाम आधार पर लिखे नाम से मेल खाना चाहिए।', 'ನಿಮ್ಮ ಪುರಾವೆಯಲ್ಲಿನ ಹೆಸರು ಆಧಾರ್‌ನಲ್ಲಿನ ಹೆಸರಿಗೆ ಹೊಂದಬೇಕು.'),
  ('The fee is ₹75, online or at the counter. Anything more is a charge for help, not for the update.', 'शुल्क ₹75 है, ऑनलाइन या काउंटर पर। इससे ज़्यादा जो भी है, वह मदद का पैसा है, अपडेट का नहीं।', 'ಶುಲ್ಕ ₹75, ಆನ್‌ಲೈನ್ ಅಥವಾ ಕೌಂಟರ್‌ನಲ್ಲಿ. ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನದು ನೆರವಿನ ಶುಲ್ಕ, ನವೀಕರಣದ್ದಲ್ಲ.'),
  ('Only refreshing your documents, with no change of address? That is free online until 14 June 2027.', 'पता बदले बिना सिर्फ़ दस्तावेज़ ताज़ा कर रहे हैं? यह 14 जून 2027 तक ऑनलाइन मुफ़्त है।', 'ವಿಳಾಸ ಬದಲಿಸದೆ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ನವೀಕರಿಸುತ್ತಿದ್ದೀರಾ? ಅದು 14 ಜೂನ್ 2027ರವರೆಗೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಚಿತ.'),
  ('Aadhaar card', 'आधार कार्ड', 'ಆಧಾರ್ ಕಾರ್ಡ್'),
  ('Proof of the new detail, pick one', 'नई जानकारी का प्रमाण, कोई एक', 'ಹೊಸ ವಿವರದ ಪುರಾವೆ, ಯಾವುದಾದರೂ ಒಂದು'),
  ('Marriage certificate or gazette notification', 'विवाह प्रमाणपत्र या गज़ट अधिसूचना', 'ವಿವಾಹ ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಗೆಜೆಟ್ ಅಧಿಸೂಚನೆ'),
  ('For a name change', 'नाम बदलने के लिए', 'ಹೆಸರು ಬದಲಾವಣೆಗೆ'),
  ('Birth certificate', 'जन्म प्रमाणपत्र', 'ಜನನ ಪ್ರಮಾಣಪತ್ರ'),
  ('For a birth date change', 'जन्मतिथि बदलने के लिए', 'ಜನ್ಮ ದಿನಾಂಕ ಬದಲಾವಣೆಗೆ'),
  ('Class 10 certificate', 'कक्षा 10 का प्रमाणपत्र', '10ನೇ ತರಗತಿ ಪ್ರಮಾಣಪತ್ರ'),
  ('Demographic update, name or birth date', 'जनसांख्यिकीय अपडेट, नाम या जन्मतिथि', 'ಜನಸಂಖ್ಯಾ ವಿವರ ನವೀಕರಣ, ಹೆಸರು ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕ'),
  ('Your name can be changed twice in a lifetime, your birth date once.', 'नाम ज़िंदगी में दो बार बदल सकते हैं, जन्मतिथि एक बार।', 'ಹೆಸರನ್ನು ಜೀವನದಲ್ಲಿ ಎರಡು ಬಾರಿ, ಜನ್ಮ ದಿನಾಂಕವನ್ನು ಒಮ್ಮೆ ಬದಲಿಸಬಹುದು.'),
  ('Colour printout, if you want one: ₹40.', 'रंगीन प्रिंट चाहिए तो: ₹40।', 'ಬಣ್ಣದ ಮುದ್ರಣ ಬೇಕಿದ್ದರೆ: ₹40.'),
  ('Update your name or birth date on myaadhaar.uidai.gov.in. Sign in with the OTP sent to your linked phone, upload your proof and pay ₹75.', 'myaadhaar.uidai.gov.in पर अपना नाम या जन्मतिथि अपडेट करें। जुड़े फ़ोन पर आए OTP से साइन इन करें, प्रमाण अपलोड करें और ₹75 चुकाएँ।', 'myaadhaar.uidai.gov.in ನಲ್ಲಿ ಹೆಸರು ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕ ನವೀಕರಿಸಿ. ಲಿಂಕ್ ಆದ ಫೋನ್‌ಗೆ ಬಂದ OTP ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ, ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ₹75 ಪಾವತಿಸಿ.'),
  ('Check your limit: a name can be changed twice in a lifetime, a birth date once.', 'अपनी सीमा जाँचें: नाम ज़िंदगी में दो बार बदल सकता है, जन्मतिथि एक बार।', 'ನಿಮ್ಮ ಮಿತಿ ನೋಡಿ: ಹೆಸರನ್ನು ಜೀವನದಲ್ಲಿ ಎರಡು ಬಾರಿ, ಜನ್ಮ ದಿನಾಂಕವನ್ನು ಒಮ್ಮೆ ಬದಲಿಸಬಹುದು.'),
  ('Pick one proof that shows the correct name or birth date.', 'ऐसा एक प्रमाण चुनें जिस पर सही नाम या जन्मतिथि हो।', 'ಸರಿಯಾದ ಹೆಸರು ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕ ಇರುವ ಒಂದು ಪುರಾವೆ ಆರಿಸಿ.'),
  ('Update online on myaadhaar.uidai.gov.in, or visit an Aadhaar Seva Kendra.', 'myaadhaar.uidai.gov.in पर ऑनलाइन अपडेट करें, या आधार सेवा केंद्र जाएँ।', 'myaadhaar.uidai.gov.in ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ನವೀಕರಿಸಿ, ಅಥವಾ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.'),
  ('Enter the detail exactly as it is written on your proof.', 'जानकारी ठीक वैसे ही भरें जैसी आपके प्रमाण पर लिखी है।', 'ವಿವರವನ್ನು ನಿಮ್ಮ ಪುರಾವೆಯಲ್ಲಿ ಬರೆದಿರುವಂತೆಯೇ ನಮೂದಿಸಿ.'),
  ('Pay ₹75 and keep the acknowledgement with its update request number.', '₹75 चुकाएँ और अपडेट अनुरोध नंबर वाली पावती रखें।', '₹75 ಪಾವತಿಸಿ, ನವೀಕರಣ ವಿನಂತಿ ಸಂಖ್ಯೆಯಿರುವ ಸ್ವೀಕೃತಿ ಇಟ್ಟುಕೊಳ್ಳಿ.'),
  ('Track the update with that number until it shows.', 'अपडेट दिखने तक उसी नंबर से ट्रैक करते रहें।', 'ನವೀಕರಣ ಕಾಣಿಸುವವರೆಗೆ ಅದೇ ಸಂಖ್ಯೆಯಿಂದ ಸ್ಥಿತಿ ನೋಡುತ್ತಿರಿ.'),
  ('Changes are limited, so check the spelling twice before you submit.', 'बदलाव सीमित हैं, इसलिए जमा करने से पहले स्पेलिंग दो बार जाँच लें।', 'ಬದಲಾವಣೆಗಳಿಗೆ ಮಿತಿ ಇದೆ, ಹಾಗಾಗಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಕಾಗುಣಿತವನ್ನು ಎರಡು ಬಾರಿ ಪರಿಶೀಲಿಸಿ.'),
  ('The fee is ₹75, online or at a centre.', 'शुल्क ₹75 है, ऑनलाइन या केंद्र पर।', 'ಶುಲ್ಕ ₹75, ಆನ್‌ಲೈನ್ ಅಥವಾ ಕೇಂದ್ರದಲ್ಲಿ.'),
  ('Your new mobile phone, with you', 'आपका नया मोबाइल फ़ोन, साथ में', 'ನಿಮ್ಮ ಹೊಸ ಮೊಬೈಲ್ ಫೋನ್, ಜೊತೆಯಲ್ಲಿ'),
  ('Demographic update, mobile number', 'जनसांख्यिकीय अपडेट, मोबाइल नंबर', 'ಜನಸಂಖ್ಯಾ ವಿವರ ನವೀಕರಣ, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ'),
  ('A mobile number update needs a centre visit, because you confirm it with your fingerprint. The new Aadhaar app is starting to offer face authentication instead.', 'मोबाइल नंबर अपडेट के लिए केंद्र जाना पड़ता है, क्योंकि इसकी पुष्टि आपके फ़िंगरप्रिंट से होती है। नया आधार ऐप इसकी जगह चेहरे से पहचान की सुविधा देने लगा है।', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನವೀಕರಣಕ್ಕೆ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಬೇಕು, ಏಕೆಂದರೆ ನಿಮ್ಮ ಬೆರಳಚ್ಚಿನಿಂದ ಅದನ್ನು ದೃಢೀಕರಿಸಲಾಗುತ್ತದೆ. ಹೊಸ ಆಧಾರ್ ಆ್ಯಪ್ ಇದರ ಬದಲು ಮುಖ ದೃಢೀಕರಣ ನೀಡಲು ಆರಂಭಿಸಿದೆ.'),
  ('Go to an Aadhaar Seva Kendra with your Aadhaar card and the new phone. Walk in or book a slot online.', 'अपने आधार कार्ड और नए फ़ोन के साथ आधार सेवा केंद्र जाएँ। सीधे जाएँ या ऑनलाइन स्लॉट बुक करें।', 'ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಹೊಸ ಫೋನ್‌ನೊಂದಿಗೆ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ. ನೇರವಾಗಿ ಹೋಗಿ ಅಥವಾ ಆನ್‌ಲೈನ್ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'),
  ('Ask for a mobile number update at the counter.', 'काउंटर पर मोबाइल नंबर अपडेट माँगें।', 'ಕೌಂಟರ್‌ನಲ್ಲಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನವೀಕರಣ ಕೇಳಿ.'),
  ('Give your fingerprint to confirm it is you.', 'यह पुष्टि करने के लिए कि आप ही हैं, फ़िंगरप्रिंट दें।', 'ನೀವೇ ಎಂದು ದೃಢೀಕರಿಸಲು ಬೆರಳಚ್ಚು ನೀಡಿ.'),
  ('Pay ₹75 and keep the acknowledgement slip.', '₹75 चुकाएँ और पावती पर्ची रखें।', '₹75 ಪಾವತಿಸಿ, ಸ್ವೀಕೃತಿ ಚೀಟಿ ಇಟ್ಟುಕೊಳ್ಳಿ.'),
  ('Start using the new number for OTPs once the update shows.', 'अपडेट दिखने के बाद OTP के लिए नया नंबर इस्तेमाल करें।', 'ನವೀಕರಣ ಕಾಣಿಸಿಕೊಂಡ ಮೇಲೆ OTPಗಳಿಗೆ ಹೊಸ ಸಂಖ್ಯೆ ಬಳಸಿ.'),
  ('The fee is ₹75 at the counter.', 'काउंटर पर शुल्क ₹75 है।', 'ಕೌಂಟರ್‌ನಲ್ಲಿ ಶುಲ್ಕ ₹75.'),
  ('The fingerprint step happens at the centre, so no agent can do this one for you.', 'फ़िंगरप्रिंट केंद्र पर ही होता है, इसलिए कोई एजेंट यह काम आपकी जगह नहीं कर सकता।', 'ಬೆರಳಚ್ಚು ಹಂತ ಕೇಂದ್ರದಲ್ಲೇ ನಡೆಯುತ್ತದೆ, ಹಾಗಾಗಿ ಯಾವ ಏಜೆಂಟರೂ ಇದನ್ನು ನಿಮ್ಮ ಪರವಾಗಿ ಮಾಡಲಾಗದು.'),
  ('Biometric update, photo or fingerprints', 'बायोमेट्रिक अपडेट, फ़ोटो या फ़िंगरप्रिंट', 'ಬಯೋಮೆಟ್ರಿಕ್ ನವೀಕರಣ, ಫೋಟೋ ಅಥವಾ ಬೆರಳಚ್ಚು'),
  ('Changing details like your address at the same visit? The total is still ₹125.', 'उसी बार पता जैसी जानकारी भी बदल रहे हैं? कुल शुल्क फिर भी ₹125 ही है।', 'ಅದೇ ಭೇಟಿಯಲ್ಲಿ ವಿಳಾಸದಂತಹ ವಿವರಗಳನ್ನೂ ಬದಲಿಸುತ್ತಿದ್ದೀರಾ? ಒಟ್ಟು ಶುಲ್ಕ ಆಗಲೂ ₹125.'),
  ('Your new photo and fingerprints are taken at the centre, so this one needs a visit.', 'नई फ़ोटो और फ़िंगरप्रिंट केंद्र पर लिए जाते हैं, इसलिए इसके लिए जाना पड़ता है।', 'ಹೊಸ ಫೋಟೋ ಮತ್ತು ಬೆರಳಚ್ಚು ಕೇಂದ್ರದಲ್ಲೇ ತೆಗೆಯುತ್ತಾರೆ, ಹಾಗಾಗಿ ಇದಕ್ಕೆ ಭೇಟಿ ಬೇಕು.'),
  ('Go to an Aadhaar Seva Kendra with your Aadhaar card. Walk in or book a slot online.', 'अपने आधार कार्ड के साथ आधार सेवा केंद्र जाएँ। सीधे जाएँ या ऑनलाइन स्लॉट बुक करें।', 'ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್‌ನೊಂದಿಗೆ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ. ನೇರವಾಗಿ ಹೋಗಿ ಅಥವಾ ಆನ್‌ಲೈನ್ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'),
  ('Ask for a biometric update at the counter.', 'काउंटर पर बायोमेट्रिक अपडेट माँगें।', 'ಕೌಂಟರ್‌ನಲ್ಲಿ ಬಯೋಮೆಟ್ರಿಕ್ ನವೀಕರಣ ಕೇಳಿ.'),
  ('Your new photo and fingerprints are taken there.', 'नई फ़ोटो और फ़िंगरप्रिंट वहीं लिए जाते हैं।', 'ಹೊಸ ಫೋಟೋ ಮತ್ತು ಬೆರಳಚ್ಚು ಅಲ್ಲೇ ತೆಗೆಯುತ್ತಾರೆ.'),
  ('Pay ₹125, even if you change other details at the same time.', '₹125 चुकाएँ, भले ही उसी समय दूसरी जानकारी भी बदलें।', 'ಅದೇ ಸಮಯದಲ್ಲಿ ಬೇರೆ ವಿವರ ಬದಲಿಸಿದರೂ ₹125 ಪಾವತಿಸಿ.'),
  ('Keep the acknowledgement slip and track the update with it.', 'पावती पर्ची संभालकर रखें और उससे अपडेट ट्रैक करें।', 'ಸ್ವೀಕೃತಿ ಚೀಟಿ ಇಟ್ಟುಕೊಳ್ಳಿ, ಅದರ ಮೂಲಕ ನವೀಕರಣದ ಸ್ಥಿತಿ ನೋಡಿ.'),
  ('The fee is ₹125. It stays ₹125 if you also update your address or other details at the same visit.', 'शुल्क ₹125 है। उसी बार पता या दूसरी जानकारी भी अपडेट करें, तब भी ₹125 ही रहता है।', 'ಶುಲ್ಕ ₹125. ಅದೇ ಭೇಟಿಯಲ್ಲಿ ವಿಳಾಸ ಅಥವಾ ಇತರ ವಿವರಗಳನ್ನೂ ನವೀಕರಿಸಿದರೂ ₹125 ಮಾತ್ರ.'),
  ('Instant e-PAN with Aadhaar OTP', 'आधार OTP से तुरंत ई-पैन', 'ಆಧಾರ್ OTP ಮೂಲಕ ತಕ್ಷಣದ ಇ-ಪ್ಯಾನ್'),
  ('PAN card by post, with e-PAN', 'डाक से पैन कार्ड, ई-पैन के साथ', 'ಅಂಚೆಯಲ್ಲಿ ಪ್ಯಾನ್ ಕಾರ್ಡ್, ಇ-ಪ್ಯಾನ್ ಸಹಿತ'),
  ('e-PAN only', 'सिर्फ़ ई-पैन', 'ಇ-ಪ್ಯಾನ್ ಮಾತ್ರ'),
  ('Correction (card with e-PAN)', 'सुधार (ई-पैन के साथ कार्ड)', 'ತಿದ್ದುಪಡಿ (ಇ-ಪ್ಯಾನ್ ಸಹಿತ ಕಾರ್ಡ್)'),
  ('Aadhaar number', 'आधार नंबर', 'ಆಧಾರ್ ಸಂಖ್ಯೆ'),
  ('For the OTP', 'OTP के लिए', 'OTPಗಾಗಿ'),
  ('Want a printed card later? A physical card with e-PAN is ₹107 on Protean or UTIITSL.', 'बाद में छपा कार्ड चाहिए? Protean या UTIITSL पर ई-पैन के साथ कार्ड ₹107 का है।', 'ನಂತರ ಮುದ್ರಿತ ಕಾರ್ಡ್ ಬೇಕೇ? Protean ಅಥವಾ UTIITSLನಲ್ಲಿ ಇ-ಪ್ಯಾನ್ ಸಹಿತ ಕಾರ್ಡ್ ₹107.'),
  ('Skip the trip', 'चक्कर बचाएँ', 'ಭೇಟಿ ತಪ್ಪಿಸಿ'),
  ('Get your e-PAN on incometax.gov.in with an OTP sent to the phone linked to your Aadhaar. There is no office visit.', 'आधार से जुड़े फ़ोन पर आए OTP से incometax.gov.in पर अपना ई-पैन पाएँ। दफ़्तर जाने की ज़रूरत नहीं।', 'ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆದ ಫೋನ್‌ಗೆ ಬರುವ OTP ಮೂಲಕ incometax.gov.in ನಲ್ಲಿ ನಿಮ್ಮ ಇ-ಪ್ಯಾನ್ ಪಡೆಯಿರಿ. ಕಚೇರಿಗೆ ಹೋಗಬೇಕಿಲ್ಲ.'),
  ('About 10 minutes, and free.', 'लगभग 10 मिनट, और मुफ़्त।', 'ಸುಮಾರು 10 ನಿಮಿಷ, ಮತ್ತು ಉಚಿತ.'),
  ('Open incometax.gov.in and choose the instant e-PAN option.', 'incometax.gov.in खोलें और तुरंत ई-पैन का विकल्प चुनें।', 'incometax.gov.in ತೆರೆದು ತಕ್ಷಣದ ಇ-ಪ್ಯಾನ್ ಆಯ್ಕೆ ಆರಿಸಿ.'),
  ('Enter your Aadhaar number and the OTP sent to your linked phone.', 'अपना आधार नंबर और लिंक किए फ़ोन पर आया OTP डालें।', 'ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆ ಮತ್ತು ಲಿಂಕ್ ಆಗಿರುವ ಫೋನ್‌ಗೆ ಬಂದ OTP ನಮೂದಿಸಿ.'),
  ('Check the details taken from your Aadhaar and confirm.', 'आधार से ली गई जानकारी जाँचें और पुष्टि करें।', 'ಆಧಾರ್‌ನಿಂದ ತೆಗೆದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ.'),
  ('Download your e-PAN when it is ready, in about 10 minutes.', 'तैयार होने पर, लगभग 10 मिनट में, अपना ई-पैन डाउनलोड करें।', 'ಸಿದ್ಧವಾದಾಗ, ಸುಮಾರು 10 ನಿಮಿಷಗಳಲ್ಲಿ, ನಿಮ್ಮ ಇ-ಪ್ಯಾನ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Already have a PAN? Don''t apply again. Holding two PANs can bring a ₹10,000 penalty.', 'पहले से पैन है? दोबारा आवेदन न करें। दो पैन रखने पर ₹10,000 का जुर्माना लग सकता है।', 'ಈಗಾಗಲೇ ಪ್ಯಾನ್ ಇದೆಯೇ? ಮತ್ತೆ ಅರ್ಜಿ ಹಾಕಬೇಡಿ. ಎರಡು ಪ್ಯಾನ್ ಇದ್ದರೆ ₹10,000 ದಂಡ ಬೀಳಬಹುದು.'),
  ('The e-PAN is free. Anyone charging for it is charging for help.', 'ई-पैन मुफ़्त है। इसके लिए पैसे माँगने वाला मदद के पैसे माँग रहा है।', 'ಇ-ಪ್ಯಾನ್ ಉಚಿತ. ಅದಕ್ಕೆ ಹಣ ಕೇಳುವವರು ನೆರವಿಗಾಗಿ ಕೇಳುತ್ತಿದ್ದಾರೆ.'),
  ('Aadhaar, for e-KYC', 'ई-केवाईसी के लिए आधार', 'ಇ-ಕೆವೈಸಿಗಾಗಿ ಆಧಾರ್'),
  ('Photo and signature', 'फ़ोटो और दस्तख़त', 'ಫೋಟೋ ಮತ್ತು ಸಹಿ'),
  ('Only if you apply without e-KYC', 'सिर्फ़ अगर ई-केवाईसी के बिना आवेदन करें', 'ಇ-ಕೆವೈಸಿ ಇಲ್ಲದೆ ಅರ್ಜಿ ಹಾಕಿದರೆ ಮಾತ್ರ'),
  ('Only need the e-PAN? It is ₹72.', 'सिर्फ़ ई-पैन चाहिए? वह ₹72 है।', 'ಇ-ಪ್ಯಾನ್ ಮಾತ್ರ ಬೇಕೇ? ಅದು ₹72.'),
  ('No office visit', 'दफ़्तर जाने की ज़रूरत नहीं', 'ಕಚೇರಿ ಭೇಟಿ ಬೇಕಿಲ್ಲ'),
  ('Apply on Protean or UTIITSL. The card comes to you by post, and you get an e-PAN too.', 'Protean या UTIITSL पर आवेदन करें। कार्ड डाक से आता है, और ई-पैन भी मिलता है।', 'Protean ಅಥವಾ UTIITSLನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ. ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ, ಇ-ಪ್ಯಾನ್ ಕೂಡ ಸಿಗುತ್ತದೆ.'),
  ('Apply in one sitting. The card arrives later by post.', 'एक ही बार में आवेदन करें। कार्ड बाद में डाक से आता है।', 'ಒಂದೇ ಬಾರಿಗೆ ಅರ್ಜಿ ಹಾಕಿ. ಕಾರ್ಡ್ ನಂತರ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Open Protean or UTIITSL and start a new PAN application.', 'Protean या UTIITSL खोलें और नए पैन का आवेदन शुरू करें।', 'Protean ಅಥವಾ UTIITSL ತೆರೆದು ಹೊಸ ಪ್ಯಾನ್ ಅರ್ಜಿ ಆರಂಭಿಸಿ.'),
  ('Choose Aadhaar e-KYC, or upload a photo and signature if you apply without it.', 'आधार ई-केवाईसी चुनें, या उसके बिना आवेदन कर रहे हैं तो फ़ोटो और दस्तख़त अपलोड करें।', 'ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಆರಿಸಿ, ಅಥವಾ ಅದಿಲ್ಲದೆ ಅರ್ಜಿ ಹಾಕುತ್ತಿದ್ದರೆ ಫೋಟೋ ಮತ್ತು ಸಹಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Pay ₹107 for the card and e-PAN, or ₹72 for the e-PAN only.', 'कार्ड और ई-पैन के लिए ₹107 चुकाएँ, या सिर्फ़ ई-पैन के लिए ₹72।', 'ಕಾರ್ಡ್ ಮತ್ತು ಇ-ಪ್ಯಾನ್‌ಗೆ ₹107, ಅಥವಾ ಇ-ಪ್ಯಾನ್ ಮಾತ್ರಕ್ಕೆ ₹72 ಪಾವತಿಸಿ.'),
  ('Keep the acknowledgement number to track your application.', 'आवेदन ट्रैक करने के लिए पावती नंबर संभालकर रखें।', 'ಅರ್ಜಿಯ ಸ್ಥಿತಿ ತಿಳಿಯಲು ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ.'),
  ('Wait for the card to arrive by post.', 'कार्ड के डाक से आने का इंतज़ार करें।', 'ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುವವರೆಗೆ ಕಾಯಿರಿ.'),
  ('Holding two PANs can bring a ₹10,000 penalty. If you already have one, apply for a correction instead.', 'दो पैन रखने पर ₹10,000 का जुर्माना लग सकता है। अगर पहले से एक है, तो उसकी जगह सुधार के लिए आवेदन करें।', 'ಎರಡು ಪ್ಯಾನ್ ಇದ್ದರೆ ₹10,000 ದಂಡ ಬೀಳಬಹುದು. ಈಗಾಗಲೇ ಒಂದಿದ್ದರೆ, ಬದಲಿಗೆ ತಿದ್ದುಪಡಿಗೆ ಅರ್ಜಿ ಹಾಕಿ.'),
  ('Your current PAN', 'आपका मौजूदा पैन', 'ನಿಮ್ಮ ಈಗಿನ ಪ್ಯಾನ್'),
  ('Proof of the correct detail', 'सही जानकारी का प्रमाण', 'ಸರಿಯಾದ ವಿವರದ ಪುರಾವೆ'),
  ('PAN correction, card with e-PAN', 'पैन सुधार, ई-पैन के साथ कार्ड', 'ಪ್ಯಾನ್ ತಿದ್ದುಪಡಿ, ಇ-ಪ್ಯಾನ್ ಸಹಿತ ಕಾರ್ಡ್'),
  ('e-PAN only: ₹72.', 'सिर्फ़ ई-पैन: ₹72।', 'ಇ-ಪ್ಯಾನ್ ಮಾತ್ರ: ₹72.'),
  ('Apply for a correction on Protean or UTIITSL. You get the corrected card by post.', 'Protean या UTIITSL पर सुधार के लिए आवेदन करें। सुधरा हुआ कार्ड डाक से आता है।', 'Protean ಅಥವಾ UTIITSLನಲ್ಲಿ ತಿದ್ದುಪಡಿಗೆ ಅರ್ಜಿ ಹಾಕಿ. ತಿದ್ದಿದ ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Open Protean or UTIITSL and choose the change or correction form.', 'Protean या UTIITSL खोलें और बदलाव या सुधार का फ़ॉर्म चुनें।', 'Protean ಅಥವಾ UTIITSL ತೆರೆದು ಬದಲಾವಣೆ ಅಥವಾ ತಿದ್ದುಪಡಿ ಫಾರ್ಮ್ ಆರಿಸಿ.'),
  ('Enter your current PAN and the correct detail.', 'अपना मौजूदा पैन और सही जानकारी डालें।', 'ನಿಮ್ಮ ಈಗಿನ ಪ್ಯಾನ್ ಮತ್ತು ಸರಿಯಾದ ವಿವರ ನಮೂದಿಸಿ.'),
  ('Upload proof of the correct detail.', 'सही जानकारी का प्रमाण अपलोड करें।', 'ಸರಿಯಾದ ವಿವರದ ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Pay ₹107, or ₹72 for the e-PAN only.', '₹107 चुकाएँ, या सिर्फ़ ई-पैन के लिए ₹72।', '₹107 ಪಾವತಿಸಿ, ಅಥವಾ ಇ-ಪ್ಯಾನ್ ಮಾತ್ರಕ್ಕೆ ₹72.'),
  ('Track the request with your acknowledgement number.', 'पावती नंबर से अनुरोध ट्रैक करें।', 'ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆಯಿಂದ ಮನವಿಯ ಸ್ಥಿತಿ ನೋಡಿ.'),
  ('Correct your existing PAN. Applying for a new one gives you two PANs, which can bring a ₹10,000 penalty.', 'अपने मौजूदा पैन में सुधार करें। नए के लिए आवेदन करने से आपके पास दो पैन हो जाएँगे, जिस पर ₹10,000 जुर्माना लग सकता है।', 'ನಿಮ್ಮ ಈಗಿನ ಪ್ಯಾನ್ ಸರಿಪಡಿಸಿ. ಹೊಸದಕ್ಕೆ ಅರ್ಜಿ ಹಾಕಿದರೆ ಎರಡು ಪ್ಯಾನ್ ಆಗುತ್ತವೆ, ಅದಕ್ಕೆ ₹10,000 ದಂಡ ಬೀಳಬಹುದು.'),
  ('36 pages, normal / Tatkal', '36 पन्ने, सामान्य / तत्काल', '36 ಪುಟಗಳು, ಸಾಮಾನ್ಯ / ತತ್ಕಾಲ್'),
  ('60 pages, normal / Tatkal', '60 पन्ने, सामान्य / तत्काल', '60 ಪುಟಗಳು, ಸಾಮಾನ್ಯ / ತತ್ಕಾಲ್'),
  ('Under 18, 36 pages, normal / Tatkal', '18 से कम, 36 पन्ने, सामान्य / तत्काल', '18ರೊಳಗೆ, 36 ಪುಟಗಳು, ಸಾಮಾನ್ಯ / ತತ್ಕಾಲ್'),
  ('First passport, under 8 or 60 and over', 'पहला पासपोर्ट, 8 से कम या 60 और ज़्यादा उम्र', 'ಮೊದಲ ಪಾಸ್‌ಪೋರ್ಟ್, 8ರೊಳಗಿನವರು ಅಥವಾ 60 ಮತ್ತು ಮೇಲ್ಪಟ್ಟವರು'),
  ('10% off normal fee', 'सामान्य शुल्क पर 10% छूट', 'ಸಾಮಾನ್ಯ ಶುಲ್ಕದಲ್ಲಿ 10% ರಿಯಾಯಿತಿ'),
  ('Police clearance certificate', 'पुलिस क्लियरेंस सर्टिफ़िकेट', 'ಪೊಲೀಸ್ ಕ್ಲಿಯರೆನ್ಸ್ ಪ್ರಮಾಣಪತ್ರ'),
  ('Utility bill', 'बिजली/पानी/गैस बिल', 'ಉಪಯುಕ್ತತಾ ಬಿಲ್'),
  ('Bank passbook with photo', 'फ़ोटो वाली बैंक पासबुक', 'ಫೋಟೋ ಇರುವ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್'),
  ('Proof of birth date, pick one', 'जन्मतिथि का प्रमाण, कोई एक', 'ಜನ್ಮ ದಿನಾಂಕದ ಪುರಾವೆ, ಯಾವುದಾದರೂ ಒಂದು'),
  ('Appointment confirmation', 'अपॉइंटमेंट की पुष्टि', 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಣ'),
  ('Originals plus one set of self-attested copies', 'मूल दस्तावेज़ और ख़ुद से सत्यापित कॉपियों का एक सेट', 'ಮೂಲ ದಾಖಲೆಗಳು ಮತ್ತು ಸ್ವಯಂ ದೃಢೀಕರಿಸಿದ ಪ್ರತಿಗಳ ಒಂದು ಸೆಟ್'),
  ('Normal fee, 36 pages', 'सामान्य शुल्क, 36 पन्ने', 'ಸಾಮಾನ್ಯ ಶುಲ್ಕ, 36 ಪುಟಗಳು'),
  ('Normal fee, 60 pages', 'सामान्य शुल्क, 60 पन्ने', 'ಸಾಮಾನ್ಯ ಶುಲ್ಕ, 60 ಪುಟಗಳು'),
  ('Normal fee, under 18, 36 pages', 'सामान्य शुल्क, 18 से कम उम्र, 36 पन्ने', 'ಸಾಮಾನ್ಯ ಶುಲ್ಕ, 18ರೊಳಗಿನವರು, 36 ಪುಟಗಳು'),
  ('Applicants under 18 get 36 pages only.', '18 साल से कम उम्र के आवेदकों को सिर्फ़ 36 पन्नों वाला पासपोर्ट मिलता है।', '18 ವರ್ಷದೊಳಗಿನ ಅರ್ಜಿದಾರರಿಗೆ 36 ಪುಟಗಳು ಮಾತ್ರ.'),
  ('Need a police clearance certificate instead? That is ₹750.', 'इसकी जगह पुलिस क्लियरेंस सर्टिफ़िकेट चाहिए? वह ₹750 है।', 'ಬದಲಿಗೆ ಪೊಲೀಸ್ ಕ್ಲಿಯರೆನ್ಸ್ ಪ್ರಮಾಣಪತ್ರ ಬೇಕೇ? ಅದು ₹750.'),
  ('You pay online when you apply on passportindia.gov.in.', 'passportindia.gov.in पर आवेदन करते समय ऑनलाइन भुगतान होता है।', 'passportindia.gov.in ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕುವಾಗ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸುತ್ತೀರಿ.'),
  ('Apply and book on passportindia.gov.in or the mPassport Seva app first, then book the calmest slot you can get. The Regional Passport Office in Koramangala does not take walk-in applications.', 'पहले passportindia.gov.in या mPassport Seva ऐप पर आवेदन और बुकिंग करें, फिर सबसे शांत स्लॉट चुनें। कोरमंगला का क्षेत्रीय पासपोर्ट कार्यालय बिना अपॉइंटमेंट आवेदन नहीं लेता।', 'ಮೊದಲು passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ ಬುಕ್ ಮಾಡಿ, ನಂತರ ಸಿಗುವ ಅತಿ ಶಾಂತ ಸ್ಲಾಟ್ ಆರಿಸಿ. ಕೋರಮಂಗಲದ ಪ್ರಾದೇಶಿಕ ಪಾಸ್‌ಪೋರ್ಟ್ ಕಚೇರಿ ನೇರ ಭೇಟಿಯ ಅರ್ಜಿಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ.'),
  ('Register on passportindia.gov.in or the mPassport Seva app.', 'passportindia.gov.in या mPassport Seva ऐप पर पंजीकरण करें।', 'passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ.'),
  ('Fill in the application and pay the fee online.', 'आवेदन भरें और शुल्क ऑनलाइन चुकाएँ।', 'ಅರ್ಜಿ ತುಂಬಿ ಮತ್ತು ಶುಲ್ಕವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ.'),
  ('Book an appointment at a Passport Seva Kendra. Pick the calmest slot you can get.', 'किसी पासपोर्ट सेवा केंद्र में अपॉइंटमेंट बुक करें। जो सबसे शांत स्लॉट मिले, वही चुनें।', 'ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ. ಸಿಗುವ ಅತಿ ಶಾಂತ ಸ್ಲಾಟ್ ಆರಿಸಿ.'),
  ('Go with your originals and one set of self-attested copies.', 'अपने मूल दस्तावेज़ और ख़ुद से सत्यापित कॉपियों का एक सेट लेकर जाएँ।', 'ನಿಮ್ಮ ಮೂಲ ದಾಖಲೆಗಳು ಮತ್ತು ಸ್ವಯಂ ದೃಢೀಕರಿಸಿದ ಪ್ರತಿಗಳ ಒಂದು ಸೆಟ್‌ನೊಂದಿಗೆ ಹೋಗಿ.'),
  ('At the PSK you go through counters A, B and C.', 'PSK में आप काउंटर A, B और C से होकर गुज़रते हैं।', 'PSKಯಲ್ಲಿ ನೀವು A, B ಮತ್ತು C ಕೌಂಟರ್‌ಗಳ ಮೂಲಕ ಹೋಗುತ್ತೀರಿ.'),
  ('Police verification follows after your visit.', 'आपके जाने के बाद पुलिस सत्यापन होता है।', 'ನಿಮ್ಮ ಭೇಟಿಯ ನಂತರ ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತದೆ.'),
  ('Track your application on passportindia.gov.in.', 'passportindia.gov.in पर अपना आवेदन ट्रैक करें।', 'passportindia.gov.in ನಲ್ಲಿ ನಿಮ್ಮ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ನೋಡಿ.'),
  ('The Regional Passport Office in Koramangala does not take walk-in applications. Go to your PSK appointment.', 'कोरमंगला का क्षेत्रीय पासपोर्ट कार्यालय बिना अपॉइंटमेंट आवेदन नहीं लेता। अपने PSK अपॉइंटमेंट पर जाएँ।', 'ಕೋರಮಂಗಲದ ಪ್ರಾದೇಶಿಕ ಪಾಸ್‌ಪೋರ್ಟ್ ಕಚೇರಿ ನೇರ ಭೇಟಿಯ ಅರ್ಜಿಗಳನ್ನು ಸ್ವೀಕರಿಸದು. ನಿಮ್ಮ PSK ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ಹೋಗಿ.'),
  ('PSK Whitefield moved to GM Tech Park, EPIP Zone on 5 Oct 2026.', 'PSK व्हाइटफ़ील्ड 5 अक्टू॰ 2026 को GM Tech Park, EPIP ज़ोन में शिफ़्ट हो गया।', 'PSK ವೈಟ್‌ಫೀಲ್ಡ್ 5 ಅಕ್ಟೋ 2026ರಂದು GM Tech Park, EPIP ವಲಯಕ್ಕೆ ಸ್ಥಳಾಂತರಗೊಂಡಿದೆ.'),
  ('You pay the fee online when you apply. Anything an agent charges on top is for their help.', 'आवेदन के समय शुल्क ऑनलाइन चुकाते हैं। एजेंट जो ऊपर से लेता है, वह उसकी मदद का पैसा है।', 'ಅರ್ಜಿ ಹಾಕುವಾಗ ಶುಲ್ಕವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸುತ್ತೀರಿ. ಏಜೆಂಟರು ಹೆಚ್ಚುವರಿಯಾಗಿ ಕೇಳುವುದು ಅವರ ನೆರವಿನ ಶುಲ್ಕ.'),
  ('Old passport', 'पुराना पासपोर्ट', 'ಹಳೆಯ ಪಾಸ್‌ಪೋರ್ಟ್'),
  ('Self-attested copies of its first two and last two pages', 'उसके पहले दो और आख़िरी दो पन्नों की ख़ुद से सत्यापित कॉपियाँ', 'ಅದರ ಮೊದಲ ಎರಡು ಮತ್ತು ಕೊನೆಯ ಎರಡು ಪುಟಗಳ ಸ್ವಯಂ ದೃಢೀಕರಿಸಿದ ಪ್ರತಿಗಳು'),
  ('Proof of new address', 'नए पते का प्रमाण', 'ಹೊಸ ವಿಳಾಸದ ಪುರಾವೆ'),
  ('Only if your address has changed', 'सिर्फ़ अगर आपका पता बदला है', 'ನಿಮ್ಮ ವಿಳಾಸ ಬದಲಾಗಿದ್ದರೆ ಮಾತ್ರ'),
  ('Sign in on passportindia.gov.in or the mPassport Seva app.', 'passportindia.gov.in या mPassport Seva ऐप पर साइन इन करें।', 'passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿ.'),
  ('Fill in the renewal application and pay the fee online.', 'नवीनीकरण का आवेदन भरें और शुल्क ऑनलाइन चुकाएँ।', 'ನವೀಕರಣ ಅರ್ಜಿ ತುಂಬಿ ಮತ್ತು ಶುಲ್ಕವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ.'),
  ('Go with your old passport and the self-attested copies.', 'अपना पुराना पासपोर्ट और ख़ुद से सत्यापित कॉपियाँ लेकर जाएँ।', 'ನಿಮ್ಮ ಹಳೆಯ ಪಾಸ್‌ಪೋರ್ಟ್ ಮತ್ತು ಸ್ವಯಂ ದೃಢೀಕರಿಸಿದ ಪ್ರತಿಗಳೊಂದಿಗೆ ಹೋಗಿ.'),
  ('Police verification follows if your application needs it.', 'अगर आवेदन में ज़रूरत हो तो पुलिस सत्यापन होता है।', 'ಅರ್ಜಿಗೆ ಅಗತ್ಯವಿದ್ದರೆ ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತದೆ.'),
  ('Bring the old passport itself, not just copies.', 'पुराना पासपोर्ट ही लाएँ, सिर्फ़ उसकी कॉपियाँ नहीं।', 'ಹಳೆಯ ಪಾಸ್‌ಪೋರ್ಟನ್ನೇ ತನ್ನಿ, ಕೇವಲ ಪ್ರತಿಗಳನ್ನಲ್ಲ.'),
  ('Old passport, with copies of its first two and last two pages', 'पुराना पासपोर्ट, उसके पहले दो और आख़िरी दो पन्नों की कॉपी के साथ', 'ಹಳೆಯ ಪಾಸ್‌ಪೋರ್ಟ್, ಅದರ ಮೊದಲ ಎರಡು ಮತ್ತು ಕೊನೆಯ ಎರಡು ಪುಟಗಳ ಪ್ರತಿಗಳೊಂದಿಗೆ'),
  ('Only if you are renewing on Tatkal', 'सिर्फ़ अगर तत्काल में नवीनीकरण कर रहे हैं', 'ತತ್ಕಾಲ್‌ನಲ್ಲಿ ನವೀಕರಿಸುತ್ತಿದ್ದರೆ ಮಾತ್ರ'),
  ('Tatkal fee, 36 pages', 'तत्काल शुल्क, 36 पन्ने', 'ತತ್ಕಾಲ್ ಶುಲ್ಕ, 36 ಪುಟಗಳು'),
  ('Tatkal fee, 60 pages', 'तत्काल शुल्क, 60 पन्ने', 'ತತ್ಕಾಲ್ ಶುಲ್ಕ, 60 ಪುಟಗಳು'),
  ('Tatkal fee, under 18, 36 pages', 'तत्काल शुल्क, 18 से कम उम्र, 36 पन्ने', 'ತತ್ಕಾಲ್ ಶುಲ್ಕ, 18ರೊಳಗಿನವರು, 36 ಪುಟಗಳು'),
  ('Choose Tatkal when you apply on passportindia.gov.in or the mPassport Seva app, then book the calmest slot you can get.', 'passportindia.gov.in या mPassport Seva ऐप पर आवेदन करते समय तत्काल चुनें, फिर सबसे शांत स्लॉट बुक करें।', 'passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕುವಾಗ ತತ್ಕಾಲ್ ಆರಿಸಿ, ನಂತರ ಸಿಗುವ ಅತಿ ಶಾಂತ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'),
  ('Register or sign in on passportindia.gov.in or the mPassport Seva app.', 'passportindia.gov.in या mPassport Seva ऐप पर पंजीकरण या साइन इन करें।', 'passportindia.gov.in ಅಥವಾ mPassport Seva ಆ್ಯಪ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ ಅಥವಾ ಸೈನ್ ಇನ್ ಮಾಡಿ.'),
  ('Choose Tatkal, fill in the application and pay the Tatkal fee online.', 'तत्काल चुनें, आवेदन भरें और तत्काल शुल्क ऑनलाइन चुकाएँ।', 'ತತ್ಕಾಲ್ ಆರಿಸಿ, ಅರ್ಜಿ ತುಂಬಿ ಮತ್ತು ತತ್ಕಾಲ್ ಶುಲ್ಕವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ.'),
  ('Police verification follows.', 'इसके बाद पुलिस सत्यापन होता है।', 'ನಂತರ ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತದೆ.'),
  ('Tatkal costs more because it is faster. It does not skip the PSK visit.', 'तत्काल तेज़ है, इसलिए महँगा है। इसमें भी PSK जाना पड़ता है।', 'ತತ್ಕಾಲ್ ವೇಗವಾದ್ದರಿಂದ ಹೆಚ್ಚು ವೆಚ್ಚ. ಇದರಲ್ಲೂ PSK ಭೇಟಿ ತಪ್ಪದು.'),
  ('Stamp duty, 11-month lease, e-stamp paper', 'स्टांप ड्यूटी, 11 महीने का अनुबंध, ई-स्टांप पेपर', 'ಮುದ್ರಾಂಕ ಶುಲ್ಕ, 11 ತಿಂಗಳ ಗುತ್ತಿಗೆ, ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ'),
  ('Registration under 12 months', 'पंजीकरण, 12 महीने से कम', 'ನೋಂದಣಿ, 12 ತಿಂಗಳೊಳಗೆ'),
  ('Not needed', 'ज़रूरी नहीं', 'ಅಗತ್ಯವಿಲ್ಲ'),
  ('Owner''s and tenant''s ID', 'मालिक और किरायेदार की आईडी', 'ಮಾಲೀಕರ ಮತ್ತು ಬಾಡಿಗೆದಾರರ ಗುರುತಿನ ಚೀಟಿ'),
  ('Rent and deposit amounts', 'किराया और जमा राशि', 'ಬಾಡಿಗೆ ಮತ್ತು ಠೇವಣಿ ಮೊತ್ತ'),
  ('e-stamp paper', 'ई-स्टांप पेपर', 'ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ'),
  ('Two witnesses with their ID', 'अपनी आईडी के साथ दो गवाह', 'ಗುರುತಿನ ಚೀಟಿಯೊಂದಿಗೆ ಇಬ್ಬರು ಸಾಕ್ಷಿಗಳು'),
  ('Notary', 'नोटरी', 'ನೋಟರಿ'),
  ('Optional', 'वैकल्पिक', 'ಐಚ್ಛಿಕ'),
  ('Stamp duty on e-stamp paper, 11-month lease', 'ई-स्टांप पेपर पर स्टांप ड्यूटी, 11 महीने का अनुबंध', 'ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದದ ಮುದ್ರಾಂಕ ಶುಲ್ಕ, 11 ತಿಂಗಳ ಗುತ್ತಿಗೆ'),
  ('Registration, under 12 months', 'पंजीकरण, 12 महीने से कम', 'ನೋಂದಣಿ, 12 ತಿಂಗಳೊಳಗೆ'),
  ('Registration is mandatory for leases over 12 months.', '12 महीने से लंबे अनुबंध का पंजीकरण ज़रूरी है।', '12 ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚಿನ ಗುತ್ತಿಗೆಗೆ ನೋಂದಣಿ ಕಡ್ಡಾಯ.'),
  ('A notary is optional.', 'नोटरी ज़रूरी नहीं है।', 'ನೋಟರಿ ಐಚ್ಛಿಕ.'),
  ('No government office', 'कोई सरकारी दफ़्तर नहीं', 'ಸರ್ಕಾರಿ ಕಚೇರಿ ಬೇಕಿಲ್ಲ'),
  ('Karnataka uses e-stamp paper only. Buy it on SHCIL online or at an authorised centre, then sign the agreement at home with two witnesses.', 'कर्नाटक में सिर्फ़ ई-स्टांप पेपर चलता है। इसे SHCIL पर ऑनलाइन या किसी अधिकृत केंद्र से ख़रीदें, फिर घर पर दो गवाहों के साथ अनुबंध पर दस्तख़त करें।', 'ಕರ್ನಾಟಕದಲ್ಲಿ ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ ಮಾತ್ರ. SHCIL ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಥವಾ ಅಧಿಕೃತ ಕೇಂದ್ರದಲ್ಲಿ ಖರೀದಿಸಿ, ನಂತರ ಮನೆಯಲ್ಲೇ ಇಬ್ಬರು ಸಾಕ್ಷಿಗಳೊಂದಿಗೆ ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿ ಮಾಡಿ.'),
  ('Registration isn''t needed for leases under 12 months.', '12 महीने से कम के अनुबंध का पंजीकरण ज़रूरी नहीं।', '12 ತಿಂಗಳಿಗಿಂತ ಕಡಿಮೆ ಗುತ್ತಿಗೆಗೆ ನೋಂದಣಿ ಬೇಕಿಲ್ಲ.'),
  ('Agree the rent, the deposit and the 11-month term with the owner.', 'मालिक के साथ किराया, जमा राशि और 11 महीने की अवधि तय करें।', 'ಮಾಲೀಕರೊಂದಿಗೆ ಬಾಡಿಗೆ, ಠೇವಣಿ ಮತ್ತು 11 ತಿಂಗಳ ಅವಧಿಯನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ.'),
  ('Buy e-stamp paper on SHCIL online or at an authorised centre.', 'SHCIL पर ऑनलाइन या किसी अधिकृत केंद्र से ई-स्टांप पेपर ख़रीदें।', 'SHCIL ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಥವಾ ಅಧಿಕೃತ ಕೇಂದ್ರದಲ್ಲಿ ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ ಖರೀದಿಸಿ.'),
  ('Put the agreement on the e-stamp paper.', 'अनुबंध ई-स्टांप पेपर पर लिखवाएँ।', 'ಒಪ್ಪಂದವನ್ನು ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದದ ಮೇಲೆ ಬರೆಸಿ.'),
  ('Owner and tenant sign, with two witnesses who show their ID.', 'मालिक और किरायेदार दस्तख़त करें, साथ में दो गवाह अपनी आईडी दिखाएँ।', 'ಮಾಲೀಕರು ಮತ್ತು ಬಾಡಿಗೆದಾರರು ಸಹಿ ಮಾಡಿ, ಗುರುತು ತೋರಿಸುವ ಇಬ್ಬರು ಸಾಕ್ಷಿಗಳೊಂದಿಗೆ.'),
  ('Get it notarised if you want to. It is optional.', 'चाहें तो नोटरी करवा लें। यह ज़रूरी नहीं है।', 'ಬೇಕಿದ್ದರೆ ನೋಟರಿ ಮಾಡಿಸಿ. ಇದು ಐಚ್ಛಿಕ.'),
  ('Keep a signed copy each.', 'दोनों पक्ष एक-एक दस्तख़त वाली कॉपी रखें।', 'ಎರಡೂ ಕಡೆ ಸಹಿ ಮಾಡಿದ ಒಂದೊಂದು ಪ್ರತಿ ಇಟ್ಟುಕೊಳ್ಳಿ.'),
  ('Staying longer than 12 months? Registration is then mandatory, and this 11-month guide doesn''t cover it.', '12 महीने से ज़्यादा रहना है? तब पंजीकरण ज़रूरी है, और यह 11 महीने वाली गाइड उसे कवर नहीं करती।', '12 ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇರುತ್ತೀರಾ? ಆಗ ನೋಂದಣಿ ಕಡ್ಡಾಯ, ಈ 11 ತಿಂಗಳ ಮಾರ್ಗದರ್ಶಿ ಅದನ್ನು ಒಳಗೊಂಡಿಲ್ಲ.'),
  ('Karnataka uses e-stamp paper only.', 'कर्नाटक में सिर्फ़ ई-स्टांप पेपर चलता है।', 'ಕರ್ನಾಟಕದಲ್ಲಿ ಇ-ಸ್ಟ್ಯಾಂಪ್ ಕಾಗದ ಮಾತ್ರ ಬಳಕೆಯಲ್ಲಿದೆ.'),
  ('Filing on incometax.gov.in', 'incometax.gov.in पर फ़ाइल करना', 'incometax.gov.in ನಲ್ಲಿ ಸಲ್ಲಿಕೆ'),
  ('Late tax return, FY 2025-26', 'देरी से आयकर रिटर्न, वित्त वर्ष 2025-26', 'ತಡವಾದ ತೆರಿಗೆ ರಿಟರ್ನ್, ಹಣಕಾಸು ವರ್ಷ 2025-26'),
  ('Late fee, income below the exemption limit', 'लेट फ़ीस, आय छूट सीमा से कम', 'ತಡ ಶುಲ್ಕ, ಆದಾಯ ವಿನಾಯಿತಿ ಮಿತಿಗಿಂತ ಕಡಿಮೆ'),
  ('Late fee, income up to ₹5 lakh', 'लेट फ़ीस, आय ₹5 लाख तक', 'ತಡ ಶುಲ್ಕ, ಆದಾಯ ₹5 ಲಕ್ಷದವರೆಗೆ'),
  ('Late fee, income above ₹5 lakh', 'लेट फ़ीस, आय ₹5 लाख से ज़्यादा', 'ತಡ ಶುಲ್ಕ, ಆದಾಯ ₹5 ಲಕ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು'),
  ('Interest on unpaid tax', 'बाक़ी टैक्स पर ब्याज', 'ಬಾಕಿ ತೆರಿಗೆಯ ಮೇಲಿನ ಬಡ್ಡಿ'),
  ('1% a month', '1% प्रति माह', 'ತಿಂಗಳಿಗೆ 1%'),
  ('PAN linked with Aadhaar', 'आधार से जुड़ा पैन', 'ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆದ ಪ್ಯಾನ್'),
  ('Form 16 or salary slips', 'फ़ॉर्म 16 या सैलरी स्लिप', 'ಫಾರ್ಮ್ 16 ಅಥವಾ ಸಂಬಳದ ಚೀಟಿಗಳು'),
  ('Interest and tax details', 'ब्याज और टैक्स की जानकारी', 'ಬಡ್ಡಿ ಮತ್ತು ತೆರಿಗೆ ವಿವರಗಳು'),
  ('From the AIS on the portal', 'पोर्टल के AIS से', 'ಪೋರ್ಟಲ್‌ನ AISನಿಂದ'),
  ('A pre-validated bank account', 'पहले से सत्यापित बैंक खाता', 'ಮೊದಲೇ ಪರಿಶೀಲಿಸಿದ ಬ್ಯಾಂಕ್ ಖಾತೆ'),
  ('For any refund', 'किसी भी रिफ़ंड के लिए', 'ಯಾವುದೇ ಮರುಪಾವತಿಗೆ'),
  ('Late fee under section 234F', 'धारा 234F के तहत लेट फ़ीस', 'ಸೆಕ್ಷನ್ 234F ಅಡಿ ತಡ ಶುಲ್ಕ'),
  ('Below the exemption limit', 'छूट की सीमा से कम', 'ವಿನಾಯಿತಿ ಮಿತಿಗಿಂತ ಕಡಿಮೆ'),
  ('Up to ₹5 lakh', '₹5 लाख तक', '₹5 ಲಕ್ಷದವರೆಗೆ'),
  ('Above ₹5 lakh', '₹5 लाख से ज़्यादा', '₹5 ಲಕ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು'),
  ('Plus interest of 1% a month on any tax you still owe.', 'साथ में बाक़ी टैक्स पर 1% प्रति माह ब्याज।', 'ಜೊತೆಗೆ ಬಾಕಿ ತೆರಿಗೆಯ ಮೇಲೆ ತಿಂಗಳಿಗೆ 1% ಬಡ್ಡಿ.'),
  ('E-verify within 30 days of filing.', 'फ़ाइल करने के 30 दिनों के अंदर ई-वेरिफ़ाई करें।', 'ಸಲ್ಲಿಸಿದ 30 ದಿನಗಳೊಳಗೆ ಇ-ಪರಿಶೀಲನೆ ಮಾಡಿ.'),
  ('Online only', 'सिर्फ़ ऑनलाइन', 'ಆನ್‌ಲೈನ್ ಮಾತ್ರ'),
  ('File your belated return for FY 2025-26 (AY 2026-27) on incometax.gov.in. Filing there is free.', 'वित्त वर्ष 2025-26 (AY 2026-27) का देरी से रिटर्न incometax.gov.in पर भरें। वहाँ फ़ाइल करना मुफ़्त है।', 'ಹಣಕಾಸು ವರ್ಷ 2025-26 (AY 2026-27)ರ ತಡವಾದ ರಿಟರ್ನ್ ಅನ್ನು incometax.gov.in ನಲ್ಲಿ ಸಲ್ಲಿಸಿ. ಅಲ್ಲಿ ಸಲ್ಲಿಕೆ ಉಚಿತ.'),
  ('Sign in on incometax.gov.in.', 'incometax.gov.in पर साइन इन करें।', 'incometax.gov.in ನಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿ.'),
  ('Check your AIS for interest and tax details, and match it with your Form 16 or salary slips.', 'ब्याज और टैक्स की जानकारी के लिए अपना AIS देखें, और उसे फ़ॉर्म 16 या सैलरी स्लिप से मिलाएँ।', 'ಬಡ್ಡಿ ಮತ್ತು ತೆರಿಗೆ ವಿವರಗಳಿಗಾಗಿ ನಿಮ್ಮ AIS ನೋಡಿ, ಅದನ್ನು ಫಾರ್ಮ್ 16 ಅಥವಾ ಸಂಬಳದ ಚೀಟಿಗಳೊಂದಿಗೆ ಹೊಂದಿಸಿ.'),
  ('Choose a belated return for AY 2026-27. Only the new tax regime applies.', 'AY 2026-27 के लिए देरी से रिटर्न (बिलेटेड) चुनें। सिर्फ़ नई टैक्स व्यवस्था लागू होती है।', 'AY 2026-27ಕ್ಕೆ ತಡವಾದ ರಿಟರ್ನ್ ಆರಿಸಿ. ಹೊಸ ತೆರಿಗೆ ಪದ್ಧತಿ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ.'),
  ('Pay the late fee under section 234F and any tax due, with 1% a month interest.', 'धारा 234F के तहत लेट फ़ीस और बाक़ी टैक्स, 1% प्रति माह ब्याज के साथ, चुकाएँ।', 'ಸೆಕ್ಷನ್ 234F ಅಡಿ ತಡ ಶುಲ್ಕ ಮತ್ತು ಬಾಕಿ ತೆರಿಗೆಯನ್ನು ತಿಂಗಳಿಗೆ 1% ಬಡ್ಡಿಯೊಂದಿಗೆ ಪಾವತಿಸಿ.'),
  ('File the return.', 'रिटर्न फ़ाइल करें।', 'ರಿಟರ್ನ್ ಸಲ್ಲಿಸಿ.'),
  ('E-verify it within 30 days.', '30 दिनों के अंदर ई-वेरिफ़ाई करें।', '30 ದಿನಗಳೊಳಗೆ ಇ-ಪರಿಶೀಲನೆ ಮಾಡಿ.'),
  ('A belated return can''t carry forward most losses. A house-property loss is the exception.', 'देरी से भरे रिटर्न में ज़्यादातर घाटे आगे नहीं ले जाए जा सकते। मकान-संपत्ति का घाटा इसका अपवाद है।', 'ತಡವಾದ ರಿಟರ್ನ್‌ನಲ್ಲಿ ಹೆಚ್ಚಿನ ನಷ್ಟಗಳನ್ನು ಮುಂದಕ್ಕೆ ಒಯ್ಯಲಾಗದು. ಮನೆ-ಆಸ್ತಿ ನಷ್ಟ ಮಾತ್ರ ಇದಕ್ಕೆ ಅಪವಾದ.'),
  ('The deadline is 31 Dec 2026.', 'आख़िरी तारीख़ 31 दिसंबर 2026 है।', 'ಕೊನೆಯ ದಿನಾಂಕ 31 ಡಿಸೆಂಬರ್ 2026.'),
  ('Learner''s licence. It lets you practise on the road and is valid for 6 months.', 'लर्नर लाइसेंस। इससे आप सड़क पर अभ्यास कर सकते हैं और यह 6 महीने तक मान्य रहता है।', 'ಕಲಿಕಾ ಪರವಾನಗಿ. ಇದರಿಂದ ರಸ್ತೆಯಲ್ಲಿ ಅಭ್ಯಾಸ ಮಾಡಬಹುದು, ಇದು 6 ತಿಂಗಳು ಮಾನ್ಯ.'),
  ('Driving licence, the permanent one. You apply for it after passing the driving test.', 'ड्राइविंग लाइसेंस, यानी स्थायी लाइसेंस। ड्राइविंग टेस्ट पास करने के बाद इसके लिए आवेदन करते हैं।', 'ಚಾಲನಾ ಪರವಾನಗಿ, ಅಂದರೆ ಶಾಶ್ವತ ಪರವಾನಗಿ. ಚಾಲನಾ ಪರೀಕ್ಷೆ ಪಾಸಾದ ಮೇಲೆ ಇದಕ್ಕೆ ಅರ್ಜಿ ಹಾಕುತ್ತೀರಿ.'),
  ('Regional Transport Office. Yours is the one that covers the address on your proof.', 'क्षेत्रीय परिवहन कार्यालय। आपका वही है जो आपके प्रमाण वाले पते को कवर करता है।', 'ಪ್ರಾದೇಶಿಕ ಸಾರಿಗೆ ಕಚೇರಿ. ನಿಮ್ಮ ಪುರಾವೆಯಲ್ಲಿರುವ ವಿಳಾಸ ಬರುವ ಕಚೇರಿಯೇ ನಿಮ್ಮದು.'),
  ('Vehicle class', 'वाहन श्रेणी', 'ವಾಹನ ವರ್ಗ'),
  ('What the licence lets you drive, such as a gearless two-wheeler, a geared motorcycle or a car (LMV). You can only test for the classes on your learner''s licence.', 'लाइसेंस से आप क्या चला सकते हैं, जैसे बिना गियर वाला दोपहिया, गियर वाली मोटरसाइकिल या कार (LMV)। आप सिर्फ़ लर्नर लाइसेंस पर दर्ज श्रेणियों का ही टेस्ट दे सकते हैं।', 'ಪರವಾನಗಿಯಿಂದ ನೀವು ಏನನ್ನು ಚಲಾಯಿಸಬಹುದು, ಉದಾ. ಗೇರ್ ಇಲ್ಲದ ದ್ವಿಚಕ್ರ ವಾಹನ, ಗೇರ್ ಇರುವ ಮೋಟಾರ್‌ಸೈಕಲ್ ಅಥವಾ ಕಾರು (LMV). ಕಲಿಕಾ ಪರವಾನಗಿಯಲ್ಲಿರುವ ವರ್ಗಗಳಿಗೆ ಮಾತ್ರ ಪರೀಕ್ಷೆ ನೀಡಬಹುದು.'),
  ('Form 1 and Form 1A', 'फ़ॉर्म 1 और फ़ॉर्म 1A', 'ಫಾರ್ಮ್ 1 ಮತ್ತು ಫಾರ್ಮ್ 1A'),
  ('Form 1 is your own declaration that you are fit to drive. Form 1A is a medical certificate from a doctor, needed if you are 40 or over.', 'फ़ॉर्म 1 आपकी अपनी घोषणा है कि आप गाड़ी चलाने के लिए स्वस्थ हैं। फ़ॉर्म 1A डॉक्टर का मेडिकल प्रमाणपत्र है, जो 40 या उससे ज़्यादा उम्र पर चाहिए।', 'ಫಾರ್ಮ್ 1 ನೀವು ವಾಹನ ಚಲಾಯಿಸಲು ಸಮರ್ಥರೆಂಬ ನಿಮ್ಮದೇ ಘೋಷಣೆ. ಫಾರ್ಮ್ 1A ವೈದ್ಯರ ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರ, 40 ಅಥವಾ ಮೇಲ್ಪಟ್ಟವರಿಗೆ ಬೇಕು.'),
  ('Works for address too', 'पते के लिए भी चलेगा', 'ವಿಳಾಸಕ್ಕೂ ಸಾಕು'),
  ('Proof of age, pick one', 'उम्र का प्रमाण, कोई एक', 'ವಯಸ್ಸಿನ ಪುರಾವೆ, ಯಾವುದಾದರೂ ಒಂದು'),
  ('Recent photo and your signature', 'हाल की फ़ोटो और आपके दस्तख़त', 'ಇತ್ತೀಚಿನ ಫೋಟೋ ಮತ್ತು ನಿಮ್ಮ ಸಹಿ'),
  ('Uploaded on Sarathi', 'सारथी पर अपलोड', 'ಸಾರಥಿಯಲ್ಲಿ ಅಪ್‌ಲೋಡ್'),
  ('Form 1, your declaration that you are fit to drive', 'फ़ॉर्म 1, गाड़ी चलाने के लिए स्वस्थ होने की आपकी घोषणा', 'ಫಾರ್ಮ್ 1, ವಾಹನ ಚಲಾಯಿಸಲು ಸಮರ್ಥರೆಂಬ ನಿಮ್ಮ ಘೋಷಣೆ'),
  ('Form 1A medical certificate', 'फ़ॉर्म 1A मेडिकल प्रमाणपत्र', 'ಫಾರ್ಮ್ 1A ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರ'),
  ('Only if you are 40 or over', 'सिर्फ़ अगर आपकी उम्र 40 या ज़्यादा है', 'ನಿಮಗೆ 40 ಅಥವಾ ಹೆಚ್ಚು ವಯಸ್ಸಾಗಿದ್ದರೆ ಮಾತ್ರ'),
  ('Learner''s licence fee', 'लर्नर लाइसेंस शुल्क', 'ಕಲಿಕಾ ಪರವಾನಗಿ ಶುಲ್ಕ'),
  ('On Sarathi', 'सारथी पर', 'ಸಾರಥಿಯಲ್ಲಿ'),
  ('Learner''s licence test fee', 'लर्नर लाइसेंस टेस्ट शुल्क', 'ಕಲಿಕಾ ಪರವಾನಗಿ ಪರೀಕ್ಷಾ ಶುಲ್ಕ'),
  ('The fee depends on how many vehicle classes you apply for. Sarathi shows the exact amount before you pay.', 'शुल्क इस पर निर्भर है कि आप कितनी वाहन श्रेणियों के लिए आवेदन करते हैं। भुगतान से पहले सारथी सही रक़म दिखाता है।', 'ಎಷ್ಟು ವಾಹನ ವರ್ಗಗಳಿಗೆ ಅರ್ಜಿ ಹಾಕುತ್ತೀರಿ ಎಂಬುದರ ಮೇಲೆ ಶುಲ್ಕ ಅವಲಂಬಿಸಿದೆ. ಪಾವತಿಸುವ ಮೊದಲು ಸಾರಥಿ ನಿಖರ ಮೊತ್ತ ತೋರಿಸುತ್ತದೆ.'),
  ('Pay only on Sarathi. Anything an agent charges on top is for their help.', 'भुगतान सिर्फ़ सारथी पर करें। एजेंट जो ऊपर से लेता है, वह उसकी मदद का पैसा है।', 'ಸಾರಥಿಯಲ್ಲಿ ಮಾತ್ರ ಪಾವತಿಸಿ. ಏಜೆಂಟರು ಹೆಚ್ಚುವರಿಯಾಗಿ ಕೇಳುವುದು ಅವರ ನೆರವಿನ ಶುಲ್ಕ.'),
  ('See Sarathi', 'सारथी देखें', 'ಸಾರಥಿ ನೋಡಿ'),
  ('Check the fee', 'शुल्क देखें', 'ಶುಲ್ಕ ನೋಡಿ'),
  ('on Sarathi', 'सारथी पर', 'ಸಾರಥಿಯಲ್ಲಿ'),
  ('Online test booking', 'ऑनलाइन टेस्ट बुकिंग', 'ಆನ್‌ಲೈನ್ ಪರೀಕ್ಷಾ ಬುಕಿಂಗ್'),
  ('Apply online', 'ऑनलाइन आवेदन करें', 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ'),
  ('Apply on sarathi.parivahan.gov.in and choose Karnataka. Upload your documents, pay the fee and book your learner''s licence test.', 'sarathi.parivahan.gov.in पर आवेदन करें और कर्नाटक चुनें। दस्तावेज़ अपलोड करें, शुल्क चुकाएँ और लर्नर लाइसेंस टेस्ट बुक करें।', 'sarathi.parivahan.gov.in ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ ಕರ್ನಾಟಕ ಆರಿಸಿ. ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಶುಲ್ಕ ಪಾವತಿಸಿ, ಕಲಿಕಾ ಪರವಾನಗಿ ಪರೀಕ್ಷೆ ಬುಕ್ ಮಾಡಿ.'),
  ('Your learner''s licence is valid for 6 months. You can apply for the driving licence from 30 days after you get it.', 'आपका लर्नर लाइसेंस 6 महीने तक मान्य है। मिलने के 30 दिन बाद से आप ड्राइविंग लाइसेंस के लिए आवेदन कर सकते हैं।', 'ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿ 6 ತಿಂಗಳು ಮಾನ್ಯ. ಸಿಕ್ಕಿದ 30 ದಿನಗಳ ನಂತರದಿಂದ ಚಾಲನಾ ಪರವಾನಗಿಗೆ ಅರ್ಜಿ ಹಾಕಬಹುದು.'),
  ('Check your age: 16 or over for a gearless two-wheeler up to 50cc, with a parent or guardian''s consent. 18 or over for other vehicles.', 'अपनी उम्र जाँचें: 50cc तक के बिना गियर वाले दोपहिया के लिए 16 साल या ज़्यादा, माता-पिता या अभिभावक की सहमति के साथ। बाक़ी वाहनों के लिए 18 साल या ज़्यादा।', 'ನಿಮ್ಮ ವಯಸ್ಸು ನೋಡಿ: 50cc ವರೆಗಿನ ಗೇರ್ ಇಲ್ಲದ ದ್ವಿಚಕ್ರ ವಾಹನಕ್ಕೆ 16 ಅಥವಾ ಮೇಲ್ಪಟ್ಟು, ಪೋಷಕರ ಅಥವಾ ರಕ್ಷಕರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ. ಇತರ ವಾಹನಗಳಿಗೆ 18 ಅಥವಾ ಮೇಲ್ಪಟ್ಟು.'),
  ('Open sarathi.parivahan.gov.in, choose Karnataka and start a new learner''s licence application.', 'sarathi.parivahan.gov.in खोलें, कर्नाटक चुनें और नए लर्नर लाइसेंस का आवेदन शुरू करें।', 'sarathi.parivahan.gov.in ತೆರೆದು, ಕರ್ನಾಟಕ ಆರಿಸಿ ಹೊಸ ಕಲಿಕಾ ಪರವಾನಗಿ ಅರ್ಜಿ ಆರಂಭಿಸಿ.'),
  ('Pick every vehicle class you plan to drive, such as a geared motorcycle or a car (LMV).', 'हर वह वाहन श्रेणी चुनें जो आप चलाना चाहते हैं, जैसे गियर वाली मोटरसाइकिल या कार (LMV)।', 'ನೀವು ಚಲಾಯಿಸಲು ಬಯಸುವ ಎಲ್ಲಾ ವಾಹನ ವರ್ಗಗಳನ್ನು ಆರಿಸಿ, ಉದಾ. ಗೇರ್ ಇರುವ ಮೋಟಾರ್‌ಸೈಕಲ್ ಅಥವಾ ಕಾರು (LMV).'),
  ('Upload your age and address proof, photo, signature and Form 1. Aadhaar works as both age and address proof. Add Form 1A if you are 40 or over.', 'उम्र और पते का प्रमाण, फ़ोटो, दस्तख़त और फ़ॉर्म 1 अपलोड करें। आधार उम्र और पते, दोनों का प्रमाण है। 40 या ज़्यादा उम्र हो तो फ़ॉर्म 1A भी जोड़ें।', 'ವಯಸ್ಸು ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ, ಫೋಟೋ, ಸಹಿ ಮತ್ತು ಫಾರ್ಮ್ 1 ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಆಧಾರ್ ವಯಸ್ಸು ಮತ್ತು ವಿಳಾಸ ಎರಡಕ್ಕೂ ಪುರಾವೆ. 40 ಅಥವಾ ಮೇಲ್ಪಟ್ಟವರಾದರೆ ಫಾರ್ಮ್ 1A ಸೇರಿಸಿ.'),
  ('Pay the fee on Sarathi and book your learner''s licence test.', 'सारथी पर शुल्क चुकाएँ और लर्नर लाइसेंस टेस्ट बुक करें।', 'ಸಾರಥಿಯಲ್ಲಿ ಶುಲ್ಕ ಪಾವತಿಸಿ, ಕಲಿಕಾ ಪರವಾನಗಿ ಪರೀಕ್ಷೆ ಬುಕ್ ಮಾಡಿ.'),
  ('Take the test on traffic rules and road signs. Once you pass, download your learner''s licence.', 'ट्रैफ़िक नियमों और सड़क संकेतों का टेस्ट दें। पास होने पर अपना लर्नर लाइसेंस डाउनलोड करें।', 'ಸಂಚಾರ ನಿಯಮಗಳು ಮತ್ತು ರಸ್ತೆ ಸಂಕೇತಗಳ ಪರೀಕ್ಷೆ ಬರೆಯಿರಿ. ಪಾಸಾದ ಮೇಲೆ ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Your learner''s licence lasts 6 months. Apply for the driving licence before it runs out, or you start again.', 'लर्नर लाइसेंस 6 महीने चलता है। ख़त्म होने से पहले ड्राइविंग लाइसेंस के लिए आवेदन करें, वरना फिर से शुरू करना होगा।', 'ಕಲಿಕಾ ಪರವಾನಗಿ 6 ತಿಂಗಳು ಇರುತ್ತದೆ. ಅದು ಮುಗಿಯುವ ಮೊದಲು ಚಾಲನಾ ಪರವಾನಗಿಗೆ ಅರ್ಜಿ ಹಾಕಿ, ಇಲ್ಲದಿದ್ದರೆ ಮತ್ತೆ ಮೊದಲಿನಿಂದ ಶುರು ಮಾಡಬೇಕು.'),
  ('Apply under the RTO that covers the address on your proof. The wrong RTO can send your application back.', 'उसी RTO के तहत आवेदन करें जो आपके प्रमाण पर लिखे पते को कवर करता है। ग़लत RTO आपका आवेदन लौटा सकता है।', 'ನಿಮ್ಮ ಪುರಾವೆಯಲ್ಲಿರುವ ವಿಳಾಸ ಬರುವ RTO ಅಡಿಯಲ್ಲೇ ಅರ್ಜಿ ಹಾಕಿ. ತಪ್ಪು RTO ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಹಿಂದಿರುಗಿಸಬಹುದು.'),
  ('Choose every vehicle class you want now. The driving test only covers the classes on your learner''s licence.', 'जितनी वाहन श्रेणियाँ चाहिए, सब अभी चुनें। ड्राइविंग टेस्ट सिर्फ़ उन्हीं श्रेणियों का होता है जो आपके लर्नर लाइसेंस पर हैं।', 'ಬೇಕಾದ ಎಲ್ಲಾ ವಾಹನ ವರ್ಗಗಳನ್ನು ಈಗಲೇ ಆರಿಸಿ. ಚಾಲನಾ ಪರೀಕ್ಷೆ ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿಯಲ್ಲಿರುವ ವರ್ಗಗಳಿಗೆ ಮಾತ್ರ.'),
  ('Your valid learner''s licence', 'आपका मान्य लर्नर लाइसेंस', 'ನಿಮ್ಮ ಮಾನ್ಯ ಕಲಿಕಾ ಪರವಾನಗಿ'),
  ('At least 30 days old', 'कम से कम 30 दिन पुराना', 'ಕನಿಷ್ಠ 30 ದಿನ ಹಳೆಯದು'),
  ('Original proof of age and address', 'उम्र और पते का मूल प्रमाण', 'ವಯಸ್ಸು ಮತ್ತು ವಿಳಾಸದ ಮೂಲ ಪುರಾವೆ'),
  ('The ones you used for the learner''s licence', 'वही जो आपने लर्नर लाइसेंस के लिए लगाए थे', 'ಕಲಿಕಾ ಪರವಾನಗಿಗೆ ಬಳಸಿದವೇ'),
  ('Driving test slot booking', 'ड्राइविंग टेस्ट स्लॉट की बुकिंग', 'ಚಾಲನಾ ಪರೀಕ್ಷಾ ಸ್ಲಾಟ್ ಬುಕಿಂಗ್'),
  ('A vehicle of the class you are testing for', 'उसी श्रेणी का वाहन जिसका टेस्ट आप दे रहे हैं', 'ನೀವು ಪರೀಕ್ಷೆ ನೀಡುವ ವರ್ಗದ ವಾಹನ'),
  ('With its registration, insurance and pollution certificate', 'उसके रजिस्ट्रेशन, बीमा और प्रदूषण प्रमाणपत्र के साथ', 'ಅದರ ನೋಂದಣಿ, ವಿಮೆ ಮತ್ತು ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ'),
  ('Driving test fee', 'ड्राइविंग टेस्ट शुल्क', 'ಚಾಲನಾ ಪರೀಕ್ಷಾ ಶುಲ್ಕ'),
  ('Driving licence card fee', 'ड्राइविंग लाइसेंस कार्ड शुल्क', 'ಚಾಲನಾ ಪರವಾನಗಿ ಕಾರ್ಡ್ ಶುಲ್ಕ'),
  ('Sarathi shows the exact amount for your vehicle classes before you pay.', 'भुगतान से पहले सारथी आपकी वाहन श्रेणियों की सही रक़म दिखाता है।', 'ಪಾವತಿಸುವ ಮೊದಲು ನಿಮ್ಮ ವಾಹನ ವರ್ಗಗಳ ನಿಖರ ಮೊತ್ತವನ್ನು ಸಾರಥಿ ತೋರಿಸುತ್ತದೆ.'),
  ('RTO test', 'RTO टेस्ट', 'RTO ಪರೀಕ್ಷೆ'),
  ('Driving test at your RTO', 'ड्राइविंग टेस्ट आपके RTO में', 'ಚಾಲನಾ ಪರೀಕ್ಷೆ ನಿಮ್ಮ RTOದಲ್ಲಿ'),
  ('Book on sarathi.parivahan.gov.in', 'sarathi.parivahan.gov.in पर बुक करें', 'sarathi.parivahan.gov.in ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ'),
  ('Book online, test at your RTO', 'ऑनलाइन बुक करें, टेस्ट अपने RTO में', 'ಆನ್‌ಲೈನ್ ಬುಕ್ ಮಾಡಿ, ಪರೀಕ್ಷೆ ನಿಮ್ಮ RTOದಲ್ಲಿ'),
  ('Apply for the driving licence on sarathi.parivahan.gov.in under Karnataka, pay the fee and book a driving test slot at the RTO for your address. On the day, go with your vehicle and documents.', 'sarathi.parivahan.gov.in पर कर्नाटक चुनकर ड्राइविंग लाइसेंस के लिए आवेदन करें, शुल्क चुकाएँ और अपने पते वाले RTO में टेस्ट स्लॉट बुक करें। उस दिन अपने वाहन और दस्तावेज़ों के साथ जाएँ।', 'sarathi.parivahan.gov.in ನಲ್ಲಿ ಕರ್ನಾಟಕ ಆರಿಸಿ ಚಾಲನಾ ಪರವಾನಗಿಗೆ ಅರ್ಜಿ ಹಾಕಿ, ಶುಲ್ಕ ಪಾವತಿಸಿ, ನಿಮ್ಮ ವಿಳಾಸದ RTOದಲ್ಲಿ ಪರೀಕ್ಷಾ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ. ಆ ದಿನ ನಿಮ್ಮ ವಾಹನ ಮತ್ತು ದಾಖಲೆಗಳೊಂದಿಗೆ ಹೋಗಿ.'),
  ('You can book from 30 days after your learner''s licence was issued, while it is still valid. After you pass, the licence card comes by post.', 'लर्नर लाइसेंस जारी होने के 30 दिन बाद से, जब तक वह मान्य है, बुक कर सकते हैं। पास होने के बाद लाइसेंस कार्ड डाक से आता है।', 'ಕಲಿಕಾ ಪರವಾನಗಿ ನೀಡಿದ 30 ದಿನಗಳ ನಂತರದಿಂದ, ಅದು ಮಾನ್ಯವಿರುವವರೆಗೆ ಬುಕ್ ಮಾಡಬಹುದು. ಪಾಸಾದ ಮೇಲೆ ಪರವಾನಗಿ ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Wait at least 30 days from the date on your learner''s licence, and apply before its 6 months run out.', 'लर्नर लाइसेंस की तारीख़ से कम से कम 30 दिन रुकें, और उसके 6 महीने ख़त्म होने से पहले आवेदन करें।', 'ಕಲಿಕಾ ಪರವಾನಗಿಯ ದಿನಾಂಕದಿಂದ ಕನಿಷ್ಠ 30 ದಿನ ಕಾಯಿರಿ, ಅದರ 6 ತಿಂಗಳು ಮುಗಿಯುವ ಮೊದಲು ಅರ್ಜಿ ಹಾಕಿ.'),
  ('On Sarathi, choose Karnataka and apply for a driving licence with your learner''s licence number.', 'सारथी पर कर्नाटक चुनें और अपने लर्नर लाइसेंस नंबर से ड्राइविंग लाइसेंस के लिए आवेदन करें।', 'ಸಾರಥಿಯಲ್ಲಿ ಕರ್ನಾಟಕ ಆರಿಸಿ, ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಚಾಲನಾ ಪರವಾನಗಿಗೆ ಅರ್ಜಿ ಹಾಕಿ.'),
  ('Pay the fee and book a driving test slot at the RTO for your address.', 'शुल्क चुकाएँ और अपने पते वाले RTO में ड्राइविंग टेस्ट का स्लॉट बुक करें।', 'ಶುಲ್ಕ ಪಾವತಿಸಿ, ನಿಮ್ಮ ವಿಳಾಸದ RTOದಲ್ಲಿ ಚಾಲನಾ ಪರೀಕ್ಷಾ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'),
  ('Practise on the same kind of vehicle you will test on.', 'उसी तरह के वाहन पर अभ्यास करें जिस पर टेस्ट देंगे।', 'ಪರೀಕ್ಷೆ ನೀಡುವ ಅದೇ ರೀತಿಯ ವಾಹನದಲ್ಲಿ ಅಭ್ಯಾಸ ಮಾಡಿ.'),
  ('On test day, take the vehicle, your learner''s licence and your original documents to the RTO.', 'टेस्ट के दिन वाहन, अपना लर्नर लाइसेंस और मूल दस्तावेज़ RTO ले जाएँ।', 'ಪರೀಕ್ಷೆಯ ದಿನ ವಾಹನ, ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿ ಮತ್ತು ಮೂಲ ದಾಖಲೆಗಳನ್ನು RTOಗೆ ಒಯ್ಯಿರಿ.'),
  ('Pass the test. Your driving licence card comes by post.', 'टेस्ट पास करें। आपका ड्राइविंग लाइसेंस कार्ड डाक से आता है।', 'ಪರೀಕ್ಷೆ ಪಾಸ್ ಮಾಡಿ. ನಿಮ್ಮ ಚಾಲನಾ ಪರವಾನಗಿ ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Don''t let your learner''s licence lapse while you wait for a slot. Book early.', 'स्लॉट के इंतज़ार में अपना लर्नर लाइसेंस ख़त्म न होने दें। जल्दी बुक करें।', 'ಸ್ಲಾಟ್‌ಗಾಗಿ ಕಾಯುತ್ತಾ ನಿಮ್ಮ ಕಲಿಕಾ ಪರವಾನಗಿ ಮುಗಿಯಲು ಬಿಡಬೇಡಿ. ಬೇಗ ಬುಕ್ ಮಾಡಿ.'),
  ('Test on the class you applied for. A test on a gearless scooter does not give you a geared-motorcycle licence.', 'उसी श्रेणी का टेस्ट दें जिसका आवेदन किया है। बिना गियर वाले स्कूटर के टेस्ट से गियर वाली मोटरसाइकिल का लाइसेंस नहीं मिलता।', 'ಅರ್ಜಿ ಹಾಕಿದ ವರ್ಗದಲ್ಲೇ ಪರೀಕ್ಷೆ ನೀಡಿ. ಗೇರ್ ಇಲ್ಲದ ಸ್ಕೂಟರ್ ಪರೀಕ್ಷೆಯಿಂದ ಗೇರ್ ಇರುವ ಮೋಟಾರ್‌ಸೈಕಲ್ ಪರವಾನಗಿ ಸಿಗದು.'),
  ('Missing papers on test day can cost you the slot. Carry every original, plus the vehicle''s registration, insurance and pollution certificate.', 'टेस्ट के दिन काग़ज़ कम पड़े तो स्लॉट हाथ से जा सकता है। सारे मूल दस्तावेज़ और वाहन का रजिस्ट्रेशन, बीमा और प्रदूषण प्रमाणपत्र साथ रखें।', 'ಪರೀಕ್ಷೆಯ ದಿನ ದಾಖಲೆ ಕೊರತೆಯಾದರೆ ಸ್ಲಾಟ್ ಕಳೆದುಕೊಳ್ಳಬಹುದು. ಎಲ್ಲಾ ಮೂಲ ದಾಖಲೆಗಳು ಮತ್ತು ವಾಹನದ ನೋಂದಣಿ, ವಿಮೆ ಹಾಗೂ ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರ ಒಯ್ಯಿರಿ.'),
  ('Elector''s Photo Identity Card, your voter ID. The e-EPIC is the digital version you can download.', 'मतदाता फ़ोटो पहचान पत्र, यानी आपका वोटर आईडी। ई-EPIC इसका डिजिटल रूप है जिसे आप डाउनलोड कर सकते हैं।', 'ಮತದಾರರ ಭಾವಚಿತ್ರ ಗುರುತಿನ ಚೀಟಿ, ಅಂದರೆ ನಿಮ್ಮ ವೋಟರ್ ಐಡಿ. ಇ-EPIC ನೀವು ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದಾದ ಡಿಜಿಟಲ್ ರೂಪ.'),
  ('Form 6', 'फ़ॉर्म 6', 'ಫಾರ್ಮ್ 6'),
  ('The form to join the electoral roll as a new voter.', 'नए मतदाता के रूप में मतदाता सूची में नाम जुड़वाने का फ़ॉर्म।', 'ಹೊಸ ಮತದಾರರಾಗಿ ಮತದಾರರ ಪಟ್ಟಿಗೆ ಸೇರುವ ಫಾರ್ಮ್.'),
  ('Form 8', 'फ़ॉर्म 8', 'ಫಾರ್ಮ್ 8'),
  ('The form to shift your address, correct your details or get a replacement card.', 'पता बदलने, जानकारी सुधारने या नया कार्ड पाने का फ़ॉर्म।', 'ವಿಳಾಸ ಬದಲಿಸಲು, ವಿವರ ತಿದ್ದಲು ಅಥವಾ ಬದಲಿ ಕಾರ್ಡ್ ಪಡೆಯಲು ಫಾರ್ಮ್.'),
  ('Booth Level Officer. They check the details in your application, usually with a visit to your address.', 'बूथ लेवल अधिकारी। ये आपके आवेदन की जानकारी जाँचते हैं, आमतौर पर आपके पते पर आकर।', 'ಬೂತ್ ಮಟ್ಟದ ಅಧಿಕಾರಿ. ಇವರು ನಿಮ್ಮ ಅರ್ಜಿಯ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ, ಸಾಮಾನ್ಯವಾಗಿ ನಿಮ್ಮ ವಿಳಾಸಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.'),
  ('Qualifying date', 'योग्यता तिथि', 'ಅರ್ಹತಾ ದಿನಾಂಕ'),
  ('You join the roll for the first of these dates on which you are 18: 1 January, 1 April, 1 July or 1 October.', 'इनमें से जिस पहली तारीख़ को आप 18 के होंगे, उसी के लिए सूची में नाम जुड़ता है: 1 जनवरी, 1 अप्रैल, 1 जुलाई या 1 अक्टूबर।', 'ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ನಿಮಗೆ 18 ತುಂಬುವ ಮೊದಲ ದಿನಾಂಕಕ್ಕೆ ಪಟ್ಟಿಗೆ ಸೇರುತ್ತೀರಿ: 1 ಜನವರಿ, 1 ಏಪ್ರಿಲ್, 1 ಜುಲೈ ಅಥವಾ 1 ಅಕ್ಟೋಬರ್.'),
  ('Recent passport-size colour photo', 'हाल की पासपोर्ट साइज़ रंगीन फ़ोटो', 'ಇತ್ತೀಚಿನ ಪಾಸ್‌ಪೋರ್ಟ್ ಗಾತ್ರದ ಬಣ್ಣದ ಫೋಟೋ'),
  ('White background, 4.5 × 3.5 cm', 'सफ़ेद बैकग्राउंड, 4.5 × 3.5 सेमी', 'ಬಿಳಿ ಹಿನ್ನೆಲೆ, 4.5 × 3.5 ಸೆಂ.ಮೀ.'),
  ('Bank or post office passbook', 'बैंक या डाकघर की पासबुक', 'ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಕಚೇರಿ ಪಾಸ್‌ಬುಕ್'),
  ('Bonafide certificate from your college', 'आपके कॉलेज का बोनाफ़ाइड प्रमाणपत्र', 'ನಿಮ್ಮ ಕಾಲೇಜಿನ ಬೊನಾಫೈಡ್ ಪ್ರಮಾಣಪತ್ರ'),
  ('Only if you register at your hostel address', 'सिर्फ़ अगर हॉस्टल के पते पर पंजीकरण कर रहे हैं', 'ಹಾಸ್ಟೆಲ್ ವಿಳಾಸದಲ್ಲಿ ನೋಂದಾಯಿಸುತ್ತಿದ್ದರೆ ಮಾತ್ರ'),
  ('Form 6, new registration', 'फ़ॉर्म 6, नया पंजीकरण', 'ಫಾರ್ಮ್ 6, ಹೊಸ ನೋಂದಣಿ'),
  ('Voter ID card, posted to you', 'वोटर आईडी कार्ड, डाक से आपको', 'ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ, ಅಂಚೆಯಲ್ಲಿ ನಿಮಗೆ'),
  ('Registering is free, and the card comes by speed post at no cost.', 'पंजीकरण मुफ़्त है, और कार्ड बिना किसी ख़र्च के स्पीड पोस्ट से आता है।', 'ನೋಂದಣಿ ಉಚಿತ, ಕಾರ್ಡ್ ಯಾವುದೇ ವೆಚ್ಚವಿಲ್ಲದೆ ಸ್ಪೀಡ್ ಪೋಸ್ಟ್‌ನಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Fill in Form 6 on voters.eci.gov.in or in ECI''s app, ECINET. Upload your photo and proofs, then save the reference number.', 'voters.eci.gov.in या चुनाव आयोग के ऐप ECINET पर फ़ॉर्म 6 भरें। फ़ोटो और प्रमाण अपलोड करें, फिर रेफ़रेंस नंबर सेव करें।', 'voters.eci.gov.in ಅಥವಾ ಚುನಾವಣಾ ಆಯೋಗದ ECINET ಆ್ಯಪ್‌ನಲ್ಲಿ ಫಾರ್ಮ್ 6 ತುಂಬಿ. ಫೋಟೋ ಮತ್ತು ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ನಂತರ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಉಳಿಸಿ.'),
  ('A Booth Level Officer checks your details. Once you are approved, download your e-EPIC. The card is posted to you free.', 'बूथ लेवल अधिकारी आपकी जानकारी जाँचते हैं। मंज़ूरी मिलने पर अपना ई-EPIC डाउनलोड करें। कार्ड मुफ़्त में डाक से भेजा जाता है।', 'ಬೂತ್ ಮಟ್ಟದ ಅಧಿಕಾರಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಅನುಮೋದನೆಯಾದ ಮೇಲೆ ನಿಮ್ಮ ಇ-EPIC ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ. ಕಾರ್ಡ್ ಉಚಿತವಾಗಿ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Check you are eligible: an Indian citizen who is 18 on 1 January, 1 April, 1 July or 1 October. You can apply in advance from 17.', 'जाँचें कि आप योग्य हैं: भारतीय नागरिक जो 1 जनवरी, 1 अप्रैल, 1 जुलाई या 1 अक्टूबर को 18 साल का हो। 17 साल की उम्र से पहले ही आवेदन कर सकते हैं।', 'ನೀವು ಅರ್ಹರೇ ಎಂದು ನೋಡಿ: 1 ಜನವರಿ, 1 ಏಪ್ರಿಲ್, 1 ಜುಲೈ ಅಥವಾ 1 ಅಕ್ಟೋಬರ್‌ಗೆ 18 ವರ್ಷ ತುಂಬಿದ ಭಾರತೀಯ ನಾಗರಿಕರು. 17ನೇ ವಯಸ್ಸಿನಿಂದಲೇ ಮುಂಚಿತವಾಗಿ ಅರ್ಜಿ ಹಾಕಬಹುದು.'),
  ('Pick one address. Students away from home can choose their home address or their hostel or PG, but only one.', 'एक ही पता चुनें। घर से दूर रहने वाले छात्र अपने घर का पता या हॉस्टल/PG चुन सकते हैं, पर सिर्फ़ एक।', 'ಒಂದೇ ವಿಳಾಸ ಆರಿಸಿ. ಮನೆಯಿಂದ ದೂರವಿರುವ ವಿದ್ಯಾರ್ಥಿಗಳು ಮನೆಯ ವಿಳಾಸ ಅಥವಾ ಹಾಸ್ಟೆಲ್/PG ಆರಿಸಬಹುದು, ಆದರೆ ಒಂದನ್ನು ಮಾತ್ರ.'),
  ('Fill in Form 6 on voters.eci.gov.in or the ECINET app. Enter your name exactly as it is on your documents.', 'voters.eci.gov.in या ECINET ऐप पर फ़ॉर्म 6 भरें। अपना नाम ठीक वैसे ही लिखें जैसा दस्तावेज़ों में है।', 'voters.eci.gov.in ಅಥವಾ ECINET ಆ್ಯಪ್‌ನಲ್ಲಿ ಫಾರ್ಮ್ 6 ತುಂಬಿ. ನಿಮ್ಮ ಹೆಸರನ್ನು ದಾಖಲೆಗಳಲ್ಲಿರುವಂತೆಯೇ ನಮೂದಿಸಿ.'),
  ('Upload your photo, age proof and address proof, and submit.', 'अपनी फ़ोटो, उम्र और पते का प्रमाण अपलोड करें, और जमा करें।', 'ನಿಮ್ಮ ಫೋಟೋ, ವಯಸ್ಸಿನ ಪುರಾವೆ ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಸಲ್ಲಿಸಿ.'),
  ('Save the reference number. You track the application with it.', 'रेफ़रेंस नंबर सेव करें। इसी से आवेदन ट्रैक करते हैं।', 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಉಳಿಸಿ. ಅದರ ಮೂಲಕ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ನೋಡುತ್ತೀರಿ.'),
  ('A Booth Level Officer (BLO) verifies your details. After approval, download your e-EPIC. The card comes by post.', 'बूथ लेवल अधिकारी (BLO) आपकी जानकारी की जाँच करते हैं। मंज़ूरी के बाद अपना ई-EPIC डाउनलोड करें। कार्ड डाक से आता है।', 'ಬೂತ್ ಮಟ್ಟದ ಅಧಿಕಾರಿ (BLO) ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಅನುಮೋದನೆಯ ನಂತರ ನಿಮ್ಮ ಇ-EPIC ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ. ಕಾರ್ಡ್ ಅಂಚೆಯಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Register in one place only. Already on a roll somewhere else? Shift it with Form 8 instead of filing a new Form 6.', 'सिर्फ़ एक जगह पंजीकरण करें। पहले से कहीं और की सूची में नाम है? नया फ़ॉर्म 6 भरने के बजाय फ़ॉर्म 8 से उसे शिफ़्ट करें।', 'ಒಂದೇ ಕಡೆ ನೋಂದಾಯಿಸಿ. ಈಗಾಗಲೇ ಬೇರೆಡೆ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರಿದೆಯೇ? ಹೊಸ ಫಾರ್ಮ್ 6 ಬದಲು ಫಾರ್ಮ್ 8 ಮೂಲಕ ಅದನ್ನು ಸ್ಥಳಾಂತರಿಸಿ.'),
  ('Your name and birth date must match your documents. A mismatch can get the form sent back.', 'आपका नाम और जन्मतिथि दस्तावेज़ों से मेल खाने चाहिए। फ़र्क़ होने पर फ़ॉर्म लौटाया जा सकता है।', 'ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಜನ್ಮ ದಿನಾಂಕ ದಾಖಲೆಗಳಿಗೆ ಹೊಂದಬೇಕು. ಹೊಂದಾಣಿಕೆ ಇಲ್ಲದಿದ್ದರೆ ಫಾರ್ಮ್ ಹಿಂದಿರುಗಬಹುದು.'),
  ('Keep the reference number. It is how you track the application.', 'रेफ़रेंस नंबर संभालकर रखें। इसी से आवेदन ट्रैक होता है।', 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ. ಅದರ ಮೂಲಕವೇ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ತಿಳಿಯುತ್ತದೆ.'),
  ('A false statement in the form''s declaration is punishable under section 31 of the Representation of the People Act, 1950.', 'फ़ॉर्म की घोषणा में ग़लत जानकारी देना जनप्रतिनिधित्व अधिनियम, 1950 की धारा 31 के तहत दंडनीय है।', 'ಫಾರ್ಮ್‌ನ ಘೋಷಣೆಯಲ್ಲಿ ಸುಳ್ಳು ಹೇಳಿಕೆ ನೀಡುವುದು ಜನಪ್ರತಿನಿಧಿ ಕಾಯ್ದೆ, 1950ರ ಸೆಕ್ಷನ್ 31ರ ಅಡಿ ಶಿಕ್ಷಾರ್ಹ.'),
  ('Your current EPIC number', 'आपका मौजूदा EPIC नंबर', 'ನಿಮ್ಮ ಈಗಿನ EPIC ಸಂಖ್ಯೆ'),
  ('Proof of the new address or the correct detail', 'नए पते या सही जानकारी का प्रमाण', 'ಹೊಸ ವಿಳಾಸ ಅಥವಾ ಸರಿಯಾದ ವಿವರದ ಪುರಾವೆ'),
  ('New photo', 'नई फ़ोटो', 'ಹೊಸ ಫೋಟೋ'),
  ('Only if you are changing your photo', 'सिर्फ़ अगर फ़ोटो बदल रहे हैं', 'ಫೋಟೋ ಬದಲಿಸುತ್ತಿದ್ದರೆ ಮಾತ್ರ'),
  ('Form 8, shifting or correction', 'फ़ॉर्म 8, पता बदलना या सुधार', 'ಫಾರ್ಮ್ 8, ವಿಳಾಸ ಬದಲಾವಣೆ ಅಥವಾ ತಿದ್ದುಪಡಿ'),
  ('Filing the form is free.', 'फ़ॉर्म भरना मुफ़्त है।', 'ಫಾರ್ಮ್ ಸಲ್ಲಿಸುವುದು ಉಚಿತ.'),
  ('Fill in Form 8 on voters.eci.gov.in or the ECINET app. Choose shifting of residence, correction of entries or a replacement card.', 'voters.eci.gov.in या ECINET ऐप पर फ़ॉर्म 8 भरें। पता बदलना, जानकारी सुधारना या नया कार्ड चुनें।', 'voters.eci.gov.in ಅಥವಾ ECINET ಆ್ಯಪ್‌ನಲ್ಲಿ ಫಾರ್ಮ್ 8 ತುಂಬಿ. ವಾಸಸ್ಥಳ ಬದಲಾವಣೆ, ನಮೂದು ತಿದ್ದುಪಡಿ ಅಥವಾ ಬದಲಿ ಕಾರ್ಡ್ ಆರಿಸಿ.'),
  ('A shift goes to the electoral officer for your new address. Once approved, you get a replacement card and return the old one.', 'पता बदलने का आवेदन आपके नए पते वाले निर्वाचन अधिकारी के पास जाता है। मंज़ूरी के बाद आपको नया कार्ड मिलता है और पुराना लौटाना होता है।', 'ವಿಳಾಸ ಬದಲಾವಣೆಯ ಅರ್ಜಿ ನಿಮ್ಮ ಹೊಸ ವಿಳಾಸದ ಚುನಾವಣಾ ಅಧಿಕಾರಿಗೆ ಹೋಗುತ್ತದೆ. ಅನುಮೋದನೆಯಾದ ಮೇಲೆ ಬದಲಿ ಕಾರ್ಡ್ ಸಿಗುತ್ತದೆ, ಹಳೆಯದನ್ನು ಹಿಂದಿರುಗಿಸಬೇಕು.'),
  ('Sign in on voters.eci.gov.in or the ECINET app and open Form 8.', 'voters.eci.gov.in या ECINET ऐप पर साइन इन करें और फ़ॉर्म 8 खोलें।', 'voters.eci.gov.in ಅಥವಾ ECINET ಆ್ಯಪ್‌ನಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿ ಫಾರ್ಮ್ 8 ತೆರೆಯಿರಿ.'),
  ('Pick one: shifting of residence, correction of entries, or a replacement card.', 'एक चुनें: पता बदलना, जानकारी में सुधार, या नया कार्ड।', 'ಒಂದನ್ನು ಆರಿಸಿ: ವಾಸಸ್ಥಳ ಬದಲಾವಣೆ, ನಮೂದು ತಿದ್ದುಪಡಿ, ಅಥವಾ ಬದಲಿ ಕಾರ್ಡ್.'),
  ('To shift, enter the new address and upload proof of it. To correct, upload a document that shows the right detail.', 'पता बदलने के लिए नया पता भरें और उसका प्रमाण अपलोड करें। सुधार के लिए सही जानकारी वाला दस्तावेज़ अपलोड करें।', 'ಸ್ಥಳಾಂತರಕ್ಕೆ ಹೊಸ ವಿಳಾಸ ನಮೂದಿಸಿ ಅದರ ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ತಿದ್ದುಪಡಿಗೆ ಸರಿಯಾದ ವಿವರ ತೋರಿಸುವ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Submit and save the reference number.', 'जमा करें और रेफ़रेंस नंबर सेव करें।', 'ಸಲ್ಲಿಸಿ, ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಉಳಿಸಿ.'),
  ('A BLO verifies the change. Once approved, download the updated e-EPIC.', 'BLO बदलाव की जाँच करते हैं। मंज़ूरी के बाद अपडेट किया हुआ ई-EPIC डाउनलोड करें।', 'BLO ಬದಲಾವಣೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಅನುಮೋದನೆಯಾದ ಮೇಲೆ ನವೀಕರಿಸಿದ ಇ-EPIC ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.'),
  ('Moved within Bengaluru or from another state? Shift with Form 8. A fresh Form 6 would put you on two rolls.', 'बेंगलुरु के अंदर या दूसरे राज्य से आए हैं? फ़ॉर्म 8 से पता बदलें। नया फ़ॉर्म 6 भरने से आपका नाम दो सूचियों में हो जाएगा।', 'ಬೆಂಗಳೂರಿನೊಳಗೆ ಅಥವಾ ಬೇರೆ ರಾಜ್ಯದಿಂದ ಬಂದಿದ್ದೀರಾ? ಫಾರ್ಮ್ 8 ಮೂಲಕ ವಿಳಾಸ ಬದಲಿಸಿ. ಹೊಸ ಫಾರ್ಮ್ 6 ಹಾಕಿದರೆ ನಿಮ್ಮ ಹೆಸರು ಎರಡು ಪಟ್ಟಿಗಳಲ್ಲಿ ಬರುತ್ತದೆ.'),
  ('Correct only what is wrong, and attach a document that shows the right detail.', 'सिर्फ़ वही सुधारें जो ग़लत है, और सही जानकारी दिखाने वाला दस्तावेज़ लगाएँ।', 'ತಪ್ಪಿರುವುದನ್ನು ಮಾತ್ರ ಸರಿಪಡಿಸಿ, ಸರಿಯಾದ ವಿವರ ತೋರಿಸುವ ದಾಖಲೆ ಲಗತ್ತಿಸಿ.'),
  ('Keep the reference number to track the request.', 'अनुरोध ट्रैक करने के लिए रेफ़रेंस नंबर रखें।', 'ಮನವಿಯ ಸ್ಥಿತಿ ತಿಳಿಯಲು ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ.'),
  ('Co-applicant', 'सह-आवेदक', 'ಸಹ-ಅರ್ಜಿದಾರ'),
  ('A parent, guardian or spouse who signs the loan with you and shares the duty to repay it. Their income helps you qualify.', 'माता-पिता, अभिभावक या जीवनसाथी जो आपके साथ ऋण पर दस्तख़त करते हैं और चुकाने की ज़िम्मेदारी बाँटते हैं। उनकी आय से आपको ऋण मिलने में मदद मिलती है।', 'ನಿಮ್ಮೊಂದಿಗೆ ಸಾಲಕ್ಕೆ ಸಹಿ ಮಾಡಿ ಮರುಪಾವತಿಯ ಜವಾಬ್ದಾರಿ ಹಂಚಿಕೊಳ್ಳುವ ಪೋಷಕರು, ರಕ್ಷಕರು ಅಥವಾ ಸಂಗಾತಿ. ಅವರ ಆದಾಯ ನಿಮಗೆ ಸಾಲ ಸಿಗಲು ನೆರವಾಗುತ್ತದೆ.'),
  ('Collateral', 'गिरवी (कोलैटरल)', 'ಭದ್ರತೆ (ಕೊಲ್ಯಾಟರಲ್)'),
  ('Property or deposits pledged to the bank as security. PM-Vidyalaxmi loans at designated institutions need no collateral or guarantor. For other colleges, each bank sets the amount above which it asks for collateral.', 'ज़मानत के रूप में बैंक के पास रखी संपत्ति या जमा राशि। चुने हुए संस्थानों के लिए PM-विद्यालक्ष्मी ऋण में न गिरवी चाहिए, न गारंटर। दूसरे कॉलेजों के लिए हर बैंक तय करता है कि कितनी रक़म से ऊपर गिरवी माँगी जाएगी।', 'ಬ್ಯಾಂಕ್‌ಗೆ ಭದ್ರತೆಯಾಗಿ ಒತ್ತೆ ಇಡುವ ಆಸ್ತಿ ಅಥವಾ ಠೇವಣಿ. ನಿಗದಿತ ಸಂಸ್ಥೆಗಳ PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಸಾಲಕ್ಕೆ ಭದ್ರತೆಯಾಗಲಿ ಜಾಮೀನುದಾರರಾಗಲಿ ಬೇಕಿಲ್ಲ. ಇತರ ಕಾಲೇಜುಗಳಿಗೆ, ಯಾವ ಮೊತ್ತದ ಮೇಲೆ ಭದ್ರತೆ ಕೇಳಬೇಕು ಎಂದು ಪ್ರತಿ ಬ್ಯಾಂಕ್ ನಿರ್ಧರಿಸುತ್ತದೆ.'),
  ('Moratorium', 'मोरेटोरियम', 'ಮೊರಟೋರಿಯಂ'),
  ('The time before repayments start: the course period plus one year under PM-Vidyalaxmi. Interest still adds up during it unless a subsidy covers it.', 'किस्तें शुरू होने से पहले का समय: PM-विद्यालक्ष्मी में कोर्स की अवधि और एक साल। इस दौरान ब्याज जुड़ता रहता है, जब तक कोई सब्सिडी उसे कवर न करे।', 'ಮರುಪಾವತಿ ಆರಂಭವಾಗುವ ಮೊದಲಿನ ಅವಧಿ: PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿಯಲ್ಲಿ ಕೋರ್ಸ್ ಅವಧಿ ಜೊತೆಗೆ ಒಂದು ವರ್ಷ. ಸಹಾಯಧನ ಭರಿಸದಿದ್ದರೆ ಈ ಅವಧಿಯಲ್ಲೂ ಬಡ್ಡಿ ಸೇರುತ್ತಲೇ ಇರುತ್ತದೆ.'),
  ('Interest subsidy', 'ब्याज सब्सिडी', 'ಬಡ್ಡಿ ಸಹಾಯಧನ'),
  ('Family income up to ₹4.5 lakh: full interest during the moratorium is covered on loans up to ₹10 lakh (PM-USP CSIS, technical and professional courses). Up to ₹8 lakh: 3% of the interest is covered (PM-Vidyalaxmi, designated institutions).', 'परिवार की आय ₹4.5 लाख तक: ₹10 लाख तक के ऋण पर मोरेटोरियम के दौरान पूरा ब्याज कवर होता है (PM-USP CSIS, तकनीकी और पेशेवर कोर्स)। ₹8 लाख तक: ब्याज का 3% कवर होता है (PM-विद्यालक्ष्मी, चुने हुए संस्थान)।', 'ಕುಟುಂಬದ ಆದಾಯ ₹4.5 ಲಕ್ಷದವರೆಗೆ: ₹10 ಲಕ್ಷದವರೆಗಿನ ಸಾಲಕ್ಕೆ ಮೊರಟೋರಿಯಂ ಅವಧಿಯ ಪೂರ್ಣ ಬಡ್ಡಿ ಭರಿಸಲಾಗುತ್ತದೆ (PM-USP CSIS, ತಾಂತ್ರಿಕ ಮತ್ತು ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳು). ₹8 ಲಕ್ಷದವರೆಗೆ: ಬಡ್ಡಿಯ 3% ಭರಿಸಲಾಗುತ್ತದೆ (PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ, ನಿಗದಿತ ಸಂಸ್ಥೆಗಳು).'),
  ('Section 80E', 'धारा 80E', 'ಸೆಕ್ಷನ್ 80E'),
  ('The interest you repay can be deducted from your taxable income, with no upper limit, for up to 8 years. It applies only under the old tax regime.', 'आप जो ब्याज चुकाते हैं उसे बिना ऊपरी सीमा के, 8 साल तक, कर-योग्य आय से घटाया जा सकता है। यह सिर्फ़ पुरानी टैक्स व्यवस्था में लागू है।', 'ನೀವು ಮರುಪಾವತಿಸುವ ಬಡ್ಡಿಯನ್ನು ಗರಿಷ್ಠ ಮಿತಿಯಿಲ್ಲದೆ, 8 ವರ್ಷಗಳವರೆಗೆ ತೆರಿಗೆಗೊಳಪಡುವ ಆದಾಯದಿಂದ ಕಳೆಯಬಹುದು. ಇದು ಹಳೆಯ ತೆರಿಗೆ ಪದ್ಧತಿಯಲ್ಲಿ ಮಾತ್ರ.'),
  ('Sanction letter', 'स्वीकृति पत्र', 'ಮಂಜೂರಾತಿ ಪತ್ರ'),
  ('The bank''s approval, with the amount, the interest rate and the terms. Read it before you sign.', 'बैंक की मंज़ूरी, जिसमें रक़म, ब्याज दर और शर्तें होती हैं। दस्तख़त से पहले इसे पढ़ें।', 'ಮೊತ್ತ, ಬಡ್ಡಿ ದರ ಮತ್ತು ಷರತ್ತುಗಳಿರುವ ಬ್ಯಾಂಕ್‌ನ ಅನುಮೋದನೆ. ಸಹಿ ಮಾಡುವ ಮೊದಲು ಓದಿ.'),
  ('Admission letter from the college', 'कॉलेज का प्रवेश पत्र', 'ಕಾಲೇಜಿನ ಪ್ರವೇಶ ಪತ್ರ'),
  ('Fee structure from the college', 'कॉलेज का फ़ीस ढाँचा', 'ಕಾಲೇಜಿನ ಶುಲ್ಕ ವಿವರ'),
  ('Class 10, Class 12 and entrance exam mark sheets', 'कक्षा 10, कक्षा 12 और प्रवेश परीक्षा की मार्कशीट', '10ನೇ, 12ನೇ ತರಗತಿ ಮತ್ತು ಪ್ರವೇಶ ಪರೀಕ್ಷೆಯ ಅಂಕಪಟ್ಟಿಗಳು'),
  ('KYC for you and your co-applicant', 'आपकी और सह-आवेदक की KYC', 'ನಿಮ್ಮ ಮತ್ತು ಸಹ-ಅರ್ಜಿದಾರರ KYC'),
  ('Such as Aadhaar and PAN', 'जैसे आधार और पैन', 'ಉದಾ. ಆಧಾರ್ ಮತ್ತು ಪ್ಯಾನ್'),
  ('Co-applicant''s income proof', 'सह-आवेदक का आय प्रमाण', 'ಸಹ-ಅರ್ಜಿದಾರರ ಆದಾಯ ಪುರಾವೆ'),
  ('Salary slips, Form 16 or tax returns', 'सैलरी स्लिप, फ़ॉर्म 16 या टैक्स रिटर्न', 'ಸಂಬಳದ ಚೀಟಿಗಳು, ಫಾರ್ಮ್ 16 ಅಥವಾ ತೆರಿಗೆ ರಿಟರ್ನ್'),
  ('Bank statements', 'बैंक स्टेटमेंट', 'ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್‌ಗಳು'),
  ('Collateral documents', 'गिरवी के दस्तावेज़', 'ಭದ್ರತೆಯ ದಾಖಲೆಗಳು'),
  ('Only for larger loans that need security', 'सिर्फ़ उन बड़े ऋणों के लिए जिनमें ज़मानत चाहिए', 'ಭದ್ರತೆ ಬೇಕಾಗುವ ದೊಡ್ಡ ಸಾಲಗಳಿಗೆ ಮಾತ್ರ'),
  ('Family income certificate', 'परिवार का आय प्रमाणपत्र', 'ಕುಟುಂಬದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ'),
  ('Only to claim an interest subsidy', 'सिर्फ़ ब्याज सब्सिडी पाने के लिए', 'ಬಡ್ಡಿ ಸಹಾಯಧನ ಪಡೆಯಲು ಮಾತ್ರ'),
  ('Interest rate', 'ब्याज दर', 'ಬಡ್ಡಿ ದರ'),
  ('Set by each bank', 'हर बैंक तय करता है', 'ಪ್ರತಿ ಬ್ಯಾಂಕ್ ನಿಗದಿಪಡಿಸುತ್ತದೆ'),
  ('Processing fee', 'प्रोसेसिंग शुल्क', 'ಸಂಸ್ಕರಣಾ ಶುಲ್ಕ'),
  ('Varies by bank', 'बैंक के हिसाब से अलग', 'ಬ್ಯಾಂಕ್‌ನಿಂದ ಬ್ಯಾಂಕ್‌ಗೆ ಬೇರೆ'),
  ('Under PM-Vidyalaxmi, the interest rate is capped at the bank''s external benchmark lending rate (EBLR) plus 0.5%.', 'PM-विद्यालक्ष्मी में ब्याज दर बैंक की बाहरी बेंचमार्क ऋण दर (EBLR) और 0.5% तक सीमित है।', 'PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿಯಲ್ಲಿ ಬಡ್ಡಿ ದರ ಬ್ಯಾಂಕ್‌ನ ಬಾಹ್ಯ ಮಾನದಂಡ ಸಾಲ ದರ (EBLR) ಜೊತೆಗೆ 0.5%ಕ್ಕೆ ಸೀಮಿತ.'),
  ('Family income up to ₹4.5 lakh: full interest subsidy during the moratorium, on loans up to ₹10 lakh (PM-USP CSIS).', 'परिवार की आय ₹4.5 लाख तक: ₹10 लाख तक के ऋण पर मोरेटोरियम के दौरान पूरी ब्याज सब्सिडी (PM-USP CSIS)।', 'ಕುಟುಂಬದ ಆದಾಯ ₹4.5 ಲಕ್ಷದವರೆಗೆ: ₹10 ಲಕ್ಷದವರೆಗಿನ ಸಾಲಕ್ಕೆ ಮೊರಟೋರಿಯಂ ಅವಧಿಯಲ್ಲಿ ಪೂರ್ಣ ಬಡ್ಡಿ ಸಹಾಯಧನ (PM-USP CSIS).'),
  ('Family income up to ₹8 lakh: 3% interest subsidy during the moratorium, on loans up to ₹10 lakh (PM-Vidyalaxmi).', 'परिवार की आय ₹8 लाख तक: ₹10 लाख तक के ऋण पर मोरेटोरियम के दौरान 3% ब्याज सब्सिडी (PM-विद्यालक्ष्मी)।', 'ಕುಟುಂಬದ ಆದಾಯ ₹8 ಲಕ್ಷದವರೆಗೆ: ₹10 ಲಕ್ಷದವರೆಗಿನ ಸಾಲಕ್ಕೆ ಮೊರಟೋರಿಯಂ ಅವಧಿಯಲ್ಲಿ 3% ಬಡ್ಡಿ ಸಹಾಯಧನ (PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ).'),
  ('Repayment under PM-Vidyalaxmi runs up to 15 years after the moratorium.', 'PM-विद्यालक्ष्मी में मोरेटोरियम के बाद 15 साल तक चुकाने का समय मिलता है।', 'PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿಯಲ್ಲಿ ಮೊರಟೋರಿಯಂ ನಂತರ 15 ವರ್ಷಗಳವರೆಗೆ ಮರುಪಾವತಿ ಅವಧಿ.'),
  ('Interest you repay can be deducted from taxable income under section 80E, for up to 8 years, under the old tax regime.', 'आप जो ब्याज चुकाते हैं उसे पुरानी टैक्स व्यवस्था में धारा 80E के तहत 8 साल तक कर-योग्य आय से घटाया जा सकता है।', 'ನೀವು ಮರುಪಾವತಿಸುವ ಬಡ್ಡಿಯನ್ನು ಹಳೆಯ ತೆರಿಗೆ ಪದ್ಧತಿಯಲ್ಲಿ ಸೆಕ್ಷನ್ 80E ಅಡಿ 8 ವರ್ಷಗಳವರೆಗೆ ತೆರಿಗೆಗೊಳಪಡುವ ಆದಾಯದಿಂದ ಕಳೆಯಬಹುದು.'),
  ('Varies', 'अलग-अलग', 'ಬದಲಾಗುತ್ತದೆ'),
  ('Compare banks', 'बैंकों की तुलना करें', 'ಬ್ಯಾಂಕ್‌ಗಳನ್ನು ಹೋಲಿಸಿ'),
  ('rates vary', 'दरें अलग-अलग', 'ದರಗಳು ಬೇರೆ ಬೇರೆ'),
  ('Online or at a bank', 'ऑनलाइन या बैंक में', 'ಆನ್‌ಲೈನ್ ಅಥವಾ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ'),
  ('One application, many banks', 'एक आवेदन, कई बैंक', 'ಒಂದು ಅರ್ಜಿ, ಹಲವು ಬ್ಯಾಂಕ್‌ಗಳು'),
  ('Fill in one common education loan application on the PM-Vidyalaxmi portal and send it to the banks you choose. You can also apply directly at a bank branch.', 'PM-विद्यालक्ष्मी पोर्टल पर एक साझा शिक्षा ऋण आवेदन भरें और अपने चुने बैंकों को भेजें। आप सीधे किसी बैंक शाखा में भी आवेदन कर सकते हैं।', 'PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಒಂದೇ ಸಾಮಾನ್ಯ ಶಿಕ್ಷಣ ಸಾಲ ಅರ್ಜಿ ತುಂಬಿ, ನೀವು ಆರಿಸಿದ ಬ್ಯಾಂಕ್‌ಗಳಿಗೆ ಕಳುಹಿಸಿ. ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಶಾಖೆಯಲ್ಲೂ ಅರ್ಜಿ ಹಾಕಬಹುದು.'),
  ('Banks review your application and send a sanction letter. The money usually goes straight to the college, each semester or year.', 'बैंक आपका आवेदन देखकर स्वीकृति पत्र भेजते हैं। पैसा आमतौर पर हर सेमेस्टर या साल सीधे कॉलेज को जाता है।', 'ಬ್ಯಾಂಕ್‌ಗಳು ನಿಮ್ಮ ಅರ್ಜಿ ಪರಿಶೀಲಿಸಿ ಮಂಜೂರಾತಿ ಪತ್ರ ಕಳುಹಿಸುತ್ತವೆ. ಹಣ ಸಾಮಾನ್ಯವಾಗಿ ಪ್ರತಿ ಸೆಮಿಸ್ಟರ್ ಅಥವಾ ವರ್ಷ ನೇರವಾಗಿ ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತದೆ.'),
  ('Check your eligibility: your admission, your course, and whether your college is on the PM-Vidyalaxmi list.', 'अपनी योग्यता जाँचें: आपका दाख़िला, आपका कोर्स, और क्या आपका कॉलेज PM-विद्यालक्ष्मी की सूची में है।', 'ನಿಮ್ಮ ಅರ್ಹತೆ ನೋಡಿ: ನಿಮ್ಮ ಪ್ರವೇಶ, ನಿಮ್ಮ ಕೋರ್ಸ್, ಮತ್ತು ನಿಮ್ಮ ಕಾಲೇಜು PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಪಟ್ಟಿಯಲ್ಲಿದೆಯೇ.'),
  ('Work out the amount from the college''s fee structure, plus other costs the bank allows.', 'कॉलेज के फ़ीस ढाँचे से रक़म तय करें, साथ में वे दूसरे ख़र्च जो बैंक मानता है।', 'ಕಾಲೇಜಿನ ಶುಲ್ಕ ವಿವರ ಮತ್ತು ಬ್ಯಾಂಕ್ ಒಪ್ಪುವ ಇತರ ವೆಚ್ಚಗಳಿಂದ ಮೊತ್ತ ಲೆಕ್ಕ ಹಾಕಿ.'),
  ('Compare banks on interest rate, processing fee, collateral rules and the moratorium.', 'ब्याज दर, प्रोसेसिंग शुल्क, गिरवी के नियम और मोरेटोरियम के आधार पर बैंकों की तुलना करें।', 'ಬಡ್ಡಿ ದರ, ಸಂಸ್ಕರಣಾ ಶುಲ್ಕ, ಭದ್ರತೆಯ ನಿಯಮಗಳು ಮತ್ತು ಮೊರಟೋರಿಯಂ ಆಧರಿಸಿ ಬ್ಯಾಂಕ್‌ಗಳನ್ನು ಹೋಲಿಸಿ.'),
  ('Apply with one common form on the PM-Vidyalaxmi portal, or directly at a bank.', 'PM-विद्यालक्ष्मी पोर्टल पर एक साझा फ़ॉर्म से आवेदन करें, या सीधे किसी बैंक में।', 'PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಒಂದೇ ಸಾಮಾನ್ಯ ಫಾರ್ಮ್ ಮೂಲಕ, ಅಥವಾ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ.'),
  ('Claim any interest subsidy you qualify for, with your family income certificate.', 'जिस ब्याज सब्सिडी के आप हक़दार हैं, उसे अपने परिवार के आय प्रमाणपत्र के साथ माँगें।', 'ನಿಮಗೆ ಅರ್ಹವಿರುವ ಬಡ್ಡಿ ಸಹಾಯಧನವನ್ನು ಕುಟುಂಬದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಕ್ಲೈಮ್ ಮಾಡಿ.'),
  ('Read the sanction letter and sign once you agree with the terms.', 'स्वीकृति पत्र पढ़ें और शर्तों से सहमत होने पर ही दस्तख़त करें।', 'ಮಂಜೂರಾತಿ ಪತ್ರ ಓದಿ, ಷರತ್ತುಗಳಿಗೆ ಒಪ್ಪಿಗೆ ಇದ್ದಾಗ ಮಾತ್ರ ಸಹಿ ಮಾಡಿ.'),
  ('The bank pays the college directly, usually each semester or year.', 'बैंक सीधे कॉलेज को भुगतान करता है, आमतौर पर हर सेमेस्टर या साल।', 'ಬ್ಯಾಂಕ್ ನೇರವಾಗಿ ಕಾಲೇಜಿಗೆ ಪಾವತಿಸುತ್ತದೆ, ಸಾಮಾನ್ಯವಾಗಿ ಪ್ರತಿ ಸೆಮಿಸ್ಟರ್ ಅಥವಾ ವರ್ಷ.'),
  ('Compare interest rates before you sign. A small difference adds up over years of repayment.', 'दस्तख़त से पहले ब्याज दरों की तुलना करें। छोटा-सा फ़र्क़ भी सालों की किस्तों में बढ़ जाता है।', 'ಸಹಿ ಮಾಡುವ ಮೊದಲು ಬಡ್ಡಿ ದರಗಳನ್ನು ಹೋಲಿಸಿ. ಸಣ್ಣ ವ್ಯತ್ಯಾಸವೂ ವರ್ಷಗಳ ಮರುಪಾವತಿಯಲ್ಲಿ ದೊಡ್ಡದಾಗುತ್ತದೆ.'),
  ('Family income up to ₹8 lakh? Check for an interest subsidy before you apply. It is easy to miss.', 'परिवार की आय ₹8 लाख तक है? आवेदन से पहले ब्याज सब्सिडी ज़रूर देखें। यह आसानी से छूट जाती है।', 'ಕುಟುಂಬದ ಆದಾಯ ₹8 ಲಕ್ಷದವರೆಗೆ ಇದೆಯೇ? ಅರ್ಜಿ ಹಾಕುವ ಮೊದಲು ಬಡ್ಡಿ ಸಹಾಯಧನ ನೋಡಿ. ಇದು ಸುಲಭವಾಗಿ ತಪ್ಪಿಹೋಗುತ್ತದೆ.'),
  ('Know when the moratorium ends: the course period plus one year under PM-Vidyalaxmi. Repayments start after it.', 'जानें कि मोरेटोरियम कब ख़त्म होता है: PM-विद्यालक्ष्मी में कोर्स की अवधि और एक साल। उसके बाद किस्तें शुरू होती हैं।', 'ಮೊರಟೋರಿಯಂ ಯಾವಾಗ ಮುಗಿಯುತ್ತದೆ ಎಂದು ತಿಳಿಯಿರಿ: PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿಯಲ್ಲಿ ಕೋರ್ಸ್ ಅವಧಿ ಜೊತೆಗೆ ಒಂದು ವರ್ಷ. ನಂತರ ಮರುಪಾವತಿ ಶುರುವಾಗುತ್ತದೆ.'),
  ('Management and NRI quota admissions don''t get PM-Vidyalaxmi benefits.', 'मैनेजमेंट और NRI कोटे के दाख़िलों को PM-विद्यालक्ष्मी का लाभ नहीं मिलता।', 'ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಮತ್ತು NRI ಕೋಟಾ ಪ್ರವೇಶಗಳಿಗೆ PM-ವಿದ್ಯಾಲಕ್ಷ್ಮಿ ಸೌಲಭ್ಯ ಸಿಗದು.');

commit;
