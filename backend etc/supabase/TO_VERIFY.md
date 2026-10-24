# Things to verify

`02_seed.sql` copies the website's code exactly: no fee or rule was changed or invented.
Some of that data still needs a human check, because it has no source link, is a team
estimate, or will go out of date. Check each item on the official website, then fix it in
Supabase: **Table Editor**, pick the table, click the cell, and set `verified_on` to the day you checked.

Fees were last checked on 16 Oct 2026 (Aadhaar, PAN, passport, rent, tax return) and 20 Oct 2026
(driving licence, voter ID, education loan).

## 1. Offices have no source link and no check date

Table `offices`: `source_url` and `verified_on` are empty for all 4. Check the address, days and hours of each.

| Office | Address | Hours in the data |
|---|---|---|
| Aadhaar Seva Kendra, South End Circle | 36 Pattalamma Temple Road, Basavanagudi, Bengaluru 560004 | Typically 9:30 AM to 5:30 PM, every day. (09:30–17:30) |
| Aadhaar Seva Kendra, Majestic | Grand Majestic Mall, 2nd Cross, 6th Main, Gandhi Nagar, Bengaluru 560009 | Typically 9:30 AM to 5:30 PM, every day. (09:30–17:30) |
| Passport Seva Kendra, Lalbagh | Prestige Libra, 45 Lalbagh Road, Bengaluru 560027 | Appointments roughly 9 AM to 4 PM, Monday to Friday. (09:00–16:00) |
| Passport Seva Kendra, Whitefield | GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro, Whitefield, Bengaluru | Appointments roughly 9 AM to 4 PM, Monday to Friday. (09:00–16:00) |

Where to check: Aadhaar centres on uidai.gov.in, Passport Seva Kendras on passportindia.gov.in.
Also check the notice on Whitefield: "PSK Whitefield moved on 5 Oct 2026. It is now at GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro. It used to be at Sai Arcade, Marathahalli, so don't go to the old address."

## 2. Fair-price bands are team estimates, not official

Table `cases`, columns `fair_margin` and `high_margin`. A quote up to official fee + `fair_margin` is called fair; from official fee + `high_margin` it is called too high. The site already labels these as pilot estimates.

| Guide | Case | Fair up to | Too high from |
|---|---|---|---|
| Aadhaar update | Address | ₹150 | ₹250 |
| Aadhaar update | Name or DOB | ₹150 | ₹250 |
| Aadhaar update | Mobile | ₹150 | ₹250 |
| Aadhaar update | Photo | ₹200 | ₹300 |
| PAN card | Instant e-PAN | ₹100 | ₹250 |
| PAN card | Card by post | ₹250 | ₹400 |
| PAN card | Correction | ₹250 | ₹400 |
| Passport | First passport | official fee + ₹700 | official fee + ₹1,500 |
| Passport | Renewal | official fee + ₹700 | official fee + ₹1,500 |
| Passport | Tatkal | official fee + ₹700 | official fee + ₹1,500 |

## 3. Helpline numbers have no source link

Table `tasks`, columns `helpline_label` and `helpline_number`. There is no `source_url` for these.

- UIDAI helpline: 1947 (Aadhaar update)
- Passport Seva helpline: 1800-258-1800 (Passport)
- Voter helpline: 1800-11-1950 (Voter ID)

## 4. Driving licence fees are not in the data

We could not confirm them, so the guide says "check on Sarathi" instead of guessing. If you confirm the amounts on sarathi.parivahan.gov.in, add `fee` rows with `amount`, `source_url` and `verified_on`.

## 5. Every source link is a home page, not the exact page

393 rows have a `source_url`, and every one is a website's home page (like https://uidai.gov.in). The project never guessed deep links. When you check a fact, replace its `source_url` with the exact page you checked.

Two choices I made that you should confirm:
- 2 rows about section 80E (education loan) point to incometaxindia.gov.in instead of pmvidyalaxmi.co.in, because the About page cites incometaxindia.gov.in for section 80E.
- On the PAN price list, "Instant e-PAN" points to incometax.gov.in and the other PAN rows to Protean. Those rows are sold on UTIITSL too.

## 6. Dates that will go out of date

- (aadhaar) Documents-only update online, until 14 June 2027
- (aadhaar) Only updating your identity and address documents online, with no change to your details, is free until 14 June 2027.
- (aadhaar) Only refreshing your documents, with no change of address? That is free online until 14 June 2027.
- (passport) PSK Whitefield moved to GM Tech Park, EPIP Zone on 5 Oct 2026.
- (itr) Late tax return, FY 2025-26
- (itr) File your belated return for FY 2025-26 (AY 2026-27) on incometax.gov.in. Filing there is free.
- (itr) Choose a belated return for AY 2026-27. Only the new tax regime applies.
- (itr) The deadline is 31 Dec 2026.
- (office) PSK Whitefield moved on 5 Oct 2026. It is now at GM Tech Park, Road No. 3, EPIP Zone, near Nallurhalli Metro. It used to be at Sai Arcade, Marathahalli, so don't go to the old address.
- (passport) Passport fees were revised on 1 July 2026 (the note under the Fair price fee table).

The tax return guide is for FY 2025-26 with a deadline of 2026-12-31. After that date the whole guide needs updating for the next year.

## 7. Kept in the code on purpose (not in the database)

- **Rush-hour estimates.** They come from a formula, not from data about the offices. The site labels them "Estimate, not live data". `offices.best_time_to_visit` stays empty until you have real data.
- **Calculator rules.** The learner's licence tool (apply from 30 days, valid 6 months) and the voter tool (qualifying dates 1 Jan, 1 Apr, 1 Jul, 1 Oct; apply from 17) do maths with these rules. The same facts appear as sentences in the `rules` table. If a rule changes, update both.
- **The 12 sponsored partners.** They are fictional demo data.
- **Page text.** The About page, the SDG section, button labels, search keywords and the "My documents" types.
- **The home-page fee ticker and the Fair price fee table** were copies of the fees. In step 4 they will be built from the database, so they can't drift apart again.

## 8. Translations

461 sentences have Hindi and Kannada in the `translations` table. 19 names stay the same in every language (ITR, myaadhaar.uidai.gov.in, uidai.gov.in, incometax.gov.in, Protean, UTIITSL, passportindia.gov.in, shcilestamp.com, …). When you change an English sentence anywhere, add a `translations` row for the new text. Until you do, that sentence shows in English.

These translations were machine-written and should be checked by native Hindi and Kannada speakers.
