'use strict';
/* ==================================================================
   DATA
   Guides, documents, fees, steps and offices now live in the database
   (Supabase). The site fetches them at start-up and fills TASKS,
   OFFICES and the values below: see p3b_db.js. What stays here is
   page wording, links for the About page, and the rush-hour model,
   which is an estimate and not data.
   ================================================================== */
/* Filled from the database: the earliest and latest verified dates. */
let FEES_CHECKED = '';
let NEW_CHECKED = '';
const ITR_DEADLINE = '2026-12-31';

const KN = {
  hero: 'ಏನು ತರಬೇಕು, ಯಾವಾಗ ಹೋಗಬೇಕು, ಎಷ್ಟು ಪಾವತಿಸಬೇಕು',
  which: 'ಯಾವ ಕೆಲಸ?',
  bring: 'ತನ್ನಿ', go: 'ಹೋಗಿ', pay: 'ಪಾವತಿಸಿ', steps: 'ಹಂತಗಳು', ticket: 'ಟಿಕೆಟ್',
  aadhaar: 'ಆಧಾರ್', pan: 'ಪ್ಯಾನ್', passport: 'ಪಾಸ್‌ಪೋರ್ಟ್', rent: 'ಬಾಡಿಗೆ ಒಪ್ಪಂದ', itr: 'ಆದಾಯ ತೆರಿಗೆ',
  best: 'ಉತ್ತಮ ಸಮಯ', fair: 'ನ್ಯಾಯ ಬೆಲೆ', tickets: 'ನನ್ನ ಟಿಕೆಟ್‌ಗಳು', docs: 'ನನ್ನ ದಾಖಲೆಗಳು'
};

const L = {
  uidai:     { href: 'https://uidai.gov.in', text: 'uidai.gov.in' },
  myaadhaar: { href: 'https://myaadhaar.uidai.gov.in', text: 'myaadhaar.uidai.gov.in' },
  incometax: { href: 'https://www.incometax.gov.in', text: 'incometax.gov.in' },
  passport:  { href: 'https://www.passportindia.gov.in', text: 'passportindia.gov.in' },
  shcil:     { href: 'https://www.shcilestamp.com', text: 'shcilestamp.com' },
  protean:   { href: 'https://www.protean-tinpan.com', text: 'Protean' },
  utiitsl:   { href: 'https://www.utiitsl.com', text: 'UTIITSL' },
  sarathi:   { href: 'https://sarathi.parivahan.gov.in', text: 'sarathi.parivahan.gov.in' },
  katransport: { href: 'https://transport.karnataka.gov.in', text: 'transport.karnataka.gov.in' },
  eci:       { href: 'https://voters.eci.gov.in', text: 'voters.eci.gov.in' },
  ceoka:     { href: 'https://ceo.karnataka.gov.in', text: 'ceo.karnataka.gov.in' },
  pmvl:      { href: 'https://pmvidyalaxmi.co.in', text: 'pmvidyalaxmi.co.in' },
  itindia:   { href: 'https://www.incometaxindia.gov.in', text: 'incometaxindia.gov.in' }
};

const SECTIONS = [
  { id: 'bring',  n: 1, en: 'Bring',  kn: KN.bring },
  { id: 'go',     n: 2, en: 'Go',     kn: KN.go },
  { id: 'pay',    n: 3, en: 'Pay',    kn: KN.pay },
  { id: 'steps',  n: 4, en: 'Steps',  kn: KN.steps },
  { id: 'ticket', n: 5, en: 'Ticket', kn: KN.ticket }
];
const SEC_IDS = SECTIONS.map(s => s.id);

/* What people can tick in My documents. Only which documents, never numbers. */
const DOCS = [
  { id: 'aadhaar', label: 'Aadhaar card' },
  { id: 'pan', label: 'PAN card' },
  { id: 'passport', label: 'Passport' },
  { id: 'voter', label: 'Voter ID' },
  { id: 'dl', label: 'Driving licence' },
  { id: 'bank', label: 'Bank passbook or statement' },
  { id: 'utility', label: 'Utility bill (last 3 months)' },
  { id: 'rentreg', label: 'Registered rent agreement' },
  { id: 'ration', label: 'Ration card' },
  { id: 'birth', label: 'Birth certificate' },
  { id: 'class10', label: 'Class 10 certificate' }
];

/* Offices, filled from the database. Opening hours in minutes after midnight, Bengaluru time. days: 0 = Sunday. */
let OFFICES = {};
let OFFICE_IDS = [];

/* Rush model inputs (section 5 of the brief). [from, to, base score] */
const RUSH = {
  ask: { base: [[570, 690, .80], [690, 780, .65], [780, 870, .50], [870, 960, .30], [960, 1020, .45]], day: { 1: .10, 6: .15, 0: .05 } },
  psk: { base: [[540, 660, .75], [660, 780, .60], [780, 840, .45], [840, 930, .35]], day: { 1: .10, 5: -.05 } }
};

/* Tax return income bands for the late fee, filled from the database. */
let ITR_INCOME = [];

/* Guides, filled from the database. Each one has cases (versions), and
   each case has its documents (items), fee(), band(), steps and watch-outs. */
let TASKS = {};
let TASK_IDS = [];

/* Search aliases per guide */
const ALIASES = {
  'aadhaar.address': ['uid', 'address change', 'aadhaar address', 'change address'],
  'aadhaar.name-dob': ['uid', 'name change', 'date of birth', 'birth date', 'dob'],
  'aadhaar.mobile': ['uid', 'mobile update', 'phone number', 'mobile number'],
  'aadhaar.biometric': ['uid', 'fingerprint', 'biometric', 'photo update'],
  'pan.instant': ['e-pan', 'pan card', 'instant pan', 'epan'],
  'pan.card': ['pan card', 'new pan', 'physical pan'],
  'pan.correction': ['pan card', 'pan correction', 'pan change'],
  'passport.first': ['psk', 'passport office', 'new passport', 'fresh passport'],
  'passport.renewal': ['renewal', 'psk', 'passport office', 'reissue', 'renew'],
  'passport.tatkal': ['tatkal', 'psk', 'passport office', 'urgent passport'],
  'rent.lease': ['lease', 'rent', 'rental', 'e-stamp', 'stamp paper', 'tenancy'],
  'itr.belated': ['itr', 'tax return', 'late filing', 'income tax', 'belated', 'tax'],
  'dl.learner': ['ll', 'llr', 'learner licence', 'learner license', 'learning licence', 'driving', 'rto', 'sarathi', 'bike licence', 'two wheeler'],
  'dl.test': ['dl', 'driving licence', 'driving license', 'driving test', 'rto', 'sarathi', 'permanent licence', 'car licence'],
  'voter.new': ['epic', 'voter card', 'voter id', 'form 6', 'election card', 'voter registration', 'register to vote', 'vote'],
  'voter.shift': ['epic', 'form 8', 'voter address change', 'shift voter', 'voter correction', 'voter id correction'],
  'eduloan.apply': ['education loan', 'student loan', 'vidyalaxmi', 'vidya lakshmi', 'loan', 'csis', '80e', 'interest subsidy', 'study loan']
};
const OFFICE_ALIASES = {
  ask: ['aadhaar centre', 'aadhaar seva kendra', 'aadhaar', 'uid', 'ask'],
  psk: ['psk', 'passport office', 'passport seva kendra', 'passport']
};
