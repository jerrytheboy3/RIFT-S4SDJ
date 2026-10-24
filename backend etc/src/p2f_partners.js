
/* ==================================================================
   PARTNERS AND ADS (demo data)
   Every business here is fictional, for the hackathon demo. To add a
   real partner, add an entry to PARTNERS (or a tip to SPONSORED_TIPS,
   or fill SPOTLIGHT); the interface picks them up without code changes.
   Ads never appear in a guide's checklist, timings or fees.
   ================================================================== */
const ADS_CONFIG = {
  showAds: true,        // false turns every sponsored placement off (the ad-free plan)
  demo: true            // shows the "demo listings" note under partner sections
};
/* Categories: label and icon for each kind of partner */
const PARTNER_CATS = {
  photo:   { label: 'Photo studio', icon: 'camera', cls: 't-passport', act: 'Book' },
  notary:  { label: 'Notary', icon: 'stamp', cls: 't-rent', act: 'Book' },
  estamp:  { label: 'e-Stamp vendor', icon: 'receipt', cls: 't-pay', act: 'Book' },
  print:   { label: 'Xerox and print shop', icon: 'print', cls: 't-pan', act: 'Contact' },
  courier: { label: 'Courier', icon: 'parcel', cls: 't-go', act: 'Contact' },
  assist:  { label: 'Document assistant', icon: 'chat', cls: 't-voter', act: 'Book' }
};
/* near: walking distance from each office it sits close to. where: shown for guides with no office. */
const PARTNERS = [
  { id: 'chitra-photo', name: 'Chitra Photo Corner', cat: 'photo', desc: 'Passport and ID photos on a white background, printed while you wait.',
    price: '₹60 for 8 photos', rating: 4.7, fair: true, tasks: ['passport', 'dl', 'voter'], near: { 'psk-lalbagh': '2 min walk' }, where: 'Lalbagh Road, near PSK Lalbagh' },
  { id: 'epip-snap', name: 'EPIP Snap Studio', cat: 'photo', desc: 'Quick passport photos, sized to the passport and visa rules.',
    price: '₹70 for 8 photos', rating: 4.5, fair: true, tasks: ['passport'], near: { 'psk-whitefield': '3 min walk' }, where: 'EPIP Zone, Whitefield' },
  { id: 'lalbagh-xerox', name: 'Lalbagh Road Xerox', cat: 'print', desc: 'Copies of every page you need, ready for self-attesting.',
    price: '₹2 a page', rating: 4.4, fair: true, tasks: ['passport'], near: { 'psk-lalbagh': '1 min walk' }, where: 'Lalbagh Road' },
  { id: 'techpark-print', name: 'Tech Park Print & Copy', cat: 'print', desc: 'Photocopies, colour prints and lamination.',
    price: '₹3 a page', rating: 4.3, fair: true, tasks: ['passport'], near: { 'psk-whitefield': '2 min walk' }, where: 'EPIP Zone, Whitefield' },
  { id: 'kagaz-copy', name: 'Kagaz Copy Point', cat: 'print', desc: 'Copies of your proof documents and colour prints of e-Aadhaar or e-PAN.',
    price: '₹2 a page, ₹10 colour', rating: 4.6, fair: true, tasks: ['aadhaar', 'pan', 'rent', 'itr', 'eduloan'], near: { 'ask-southend': '1 min walk' }, where: 'Basavanagudi, next to South End Circle' },
  { id: 'majestic-print', name: 'Majestic Print Hub', cat: 'print', desc: 'Copies and colour prints, open from 8 AM.',
    price: '₹2 a page', rating: 4.2, fair: true, tasks: ['aadhaar'], near: { 'ask-majestic': '2 min walk' }, where: 'Gandhi Nagar' },
  { id: 'sahayak-desk', name: 'Sahayak Document Desk', cat: 'assist', desc: 'Sit with an assistant who fills in the online form with you. You pay the official fee yourself.',
    price: '₹50 for form help', rating: 4.8, fair: true, tasks: ['aadhaar', 'pan', 'passport', 'dl', 'voter'], near: { 'ask-southend': '4 min walk', 'ask-majestic': '5 min walk', 'psk-lalbagh': '6 min walk' }, where: 'Basavanagudi and Gandhi Nagar' },
  { id: 'kaveri-estamp', name: 'Kaveri e-Stamp Point', cat: 'estamp', desc: 'Authorised e-stamp paper, printed with your rent agreement.',
    price: '₹50 on top of stamp duty', rating: 4.6, fair: true, tasks: ['rent'], where: 'Jayanagar 4th Block' },
  { id: 'basavanagudi-notary', name: 'Basavanagudi Notary Desk', cat: 'notary', desc: 'Notarise your rent agreement with both parties present.',
    price: '₹150 per agreement', rating: 4.5, fair: true, tasks: ['rent'], where: 'Basavanagudi' },
  { id: 'rto-copy', name: 'RTO Road Copy Centre', cat: 'print', desc: 'Copies of your proofs and Form 1A printouts for test day.',
    price: '₹2 a page', rating: 4.3, fair: true, tasks: ['dl'], where: 'Next to Jayanagar RTO' },
  { id: 'ledger-lane', name: 'Ledger Lane Filing Desk', cat: 'assist', desc: 'Help gathering your Form 16 and AIS before you file on the portal yourself.',
    price: '₹299 for a review', rating: 4.4, fair: true, tasks: ['itr'], where: 'Koramangala, and on video call' },
  { id: 'dakiya-courier', name: 'Dakiya Courier Co.', cat: 'courier', desc: 'Send attested copies to your bank or college, with tracking.',
    price: '₹80 within Bengaluru', rating: 4.5, fair: true, tasks: ['eduloan', 'rent'], where: 'Pickup across Bengaluru' }
];
/* One small tip per guide, where it helps. Each names its partner by id. */
const SPONSORED_TIPS = {
  aadhaar: { partner: 'kagaz-copy', text: 'Need a copy of your proof? Kagaz Copy Point is 1 min from Aadhaar Seva Kendra, South End Circle. ₹2 a page.' },
  pan: { partner: 'kagaz-copy', text: 'Want your e-PAN on paper? Kagaz Copy Point prints it in colour for ₹10.' },
  passport: { partner: 'chitra-photo', text: 'Get passport-size photos at Chitra Photo Corner, 2 min from PSK Lalbagh. ₹60 for 8.' },
  rent: { partner: 'kaveri-estamp', text: 'Kaveri e-Stamp Point issues e-stamp paper and prints your agreement on it, for ₹50 on top of stamp duty.' },
  dl: { partner: 'chitra-photo', text: 'Photos for your learner\'s licence at Chitra Photo Corner, ₹60 for 8.' },
  voter: { partner: 'chitra-photo', text: 'Need a white-background photo for Form 6? Chitra Photo Corner, ₹60 for 8.' },
  eduloan: { partner: 'dakiya-courier', text: 'Send attested copies to your bank with Dakiya Courier Co., ₹80 within Bengaluru.' }
};
/* Home page spotlight for a bank or fintech partner. null shows the placeholder.
   A real one looks like: { title, description, image, link, cta } */
const SPOTLIGHT = null;
