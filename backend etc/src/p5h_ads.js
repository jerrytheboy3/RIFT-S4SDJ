
/* ==================================================================
   SPONSORED PLACEMENTS
   Three quiet placements, each labelled: services near the office at
   the end of a guide's Steps, one tip at the end of its Ticket, and a
   partner spotlight on the home page. Bring, Go and Pay stay ad-free.
   ================================================================== */
function adsOn() { return ADS_CONFIG.showAds !== false && S.settings.ads !== 'off'; }
function adLabel(text) { return '<span class="ad-label">' + esc(text || 'Sponsored') + '</span>'; }
function partnerCard(p, dist) {
  const c = PARTNER_CATS[p.cat] || PARTNER_CATS.assist;
  return '<li><article class="pcard card" aria-labelledby="pc-' + p.id + '"><div class="pcard-top">' + tile(c.icon, c.cls, '') +
    '<div class="pcard-name"><h4 id="pc-' + p.id + '" translate="no">' + esc(p.name) + '</h4><p class="muted">' + esc(c.label) + ' · ' + esc(dist) + '</p></div>' + adLabel() + '</div>' +
    '<p class="pcard-desc">' + esc(p.desc) + '</p>' +
    '<div class="pcard-meta"><span class="pcard-price">' + esc(p.price) + '</span><span class="pcard-rate" aria-label="' + esc('Rated ' + p.rating + ' out of 5') + '">' + icon('star') + p.rating.toFixed(1) + '</span></div>' +
    '<div class="pcard-foot">' + (p.fair ? '<span class="fair-badge">' + icon('check') + 'Verified Fair Price</span>' : '<span></span>') +
    '<button type="button" class="btn pcard-btn" data-act="ad-book" data-id="' + p.id + '"><span class="lbl-t">' + esc(c.act) + '</span></button></div></article></li>';
}
/* The partners shown depend on the guide, and on the office picked in its Go step. */
function servicesSection(task) {
  if (!adsOn()) return '';
  let title, sub, list;
  if (task.offices.length) {
    const o = goChoice(task, nowIST()).o;
    list = PARTNERS.filter(p => p.tasks.includes(task.id) && p.near && p.near[o.id]).map(p => [p, p.near[o.id]]);
    title = 'Services near this office'; sub = 'Near ' + o.name;
    if (!list.length) { list = PARTNERS.filter(p => p.tasks.includes(task.id)).map(p => [p, p.where]); sub = 'Around Bengaluru'; }
  } else {
    list = PARTNERS.filter(p => p.tasks.includes(task.id)).map(p => [p, p.where]);
    title = task.id === 'dl' ? 'Services near the RTO' : 'Services for this guide';
    sub = task.id === 'dl' ? 'Near Jayanagar RTO, as an example' : 'Around Bengaluru';
  }
  if (!list.length) return '';
  return '<section class="services" aria-labelledby="svc-h" data-rise="soft"><div class="svc-head"><div><h3 id="svc-h">' + esc(title) + '</h3><p class="muted">' + esc(sub) + '</p></div>' + adLabel() + '</div>' +
    '<ul class="pcards">' + list.slice(0, 4).map(([p, d]) => partnerCard(p, d)).join('') + '</ul>' +
    (ADS_CONFIG.demo ? '<p class="est svc-note">Demo listings: these businesses are fictional. Verified Fair Price means a partner publishes fixed prices and agrees to our price check. Turn sponsored services off in Settings.</p>' : '') + '</section>';
}
function sponsoredTip(task) {
  if (!adsOn()) return '';
  const tip = SPONSORED_TIPS[task.id], p = tip && PARTNERS.find(x => x.id === tip.partner);
  if (!tip || !p) return '';
  const c = PARTNER_CATS[p.cat] || PARTNER_CATS.assist;
  return '<aside class="sp-tip" aria-label="Sponsored tip">' + tile(c.icon, c.cls, 'sm') + '<p><b>Tip:</b> ' + esc(tip.text) + '</p>' + adLabel() + '</aside>';
}
/* Reusable ad slot. Pass { title, description, image, link, cta } for a real partner, or nothing for the placeholder. */
function adSlot(spot) {
  if (!adsOn()) return '';
  if (!spot) {
    return '<aside class="ad-slot ad-ph" aria-label="Advertisement"' + rv() + '>' + tile('bank', 't-office', '') +
      '<div class="ad-body"><p class="ad-title">Partner spotlight</p><p class="muted">Your bank or fintech offer could appear here, like a student bank account or a tax filing tool.</p></div>' +
      '<a class="btn-text ad-cta" href="#about">How partners work' + icon('chev') + '</a>' + adLabel('Ad') + '</aside>';
  }
  return '<aside class="ad-slot" aria-label="Advertisement"' + rv() + '>' + (spot.image ? '<img class="ad-img" src="' + esc(spot.image) + '" alt="">' : tile('bank', 't-office', '')) +
    '<div class="ad-body"><p class="ad-title">' + esc(spot.title) + '</p><p class="muted">' + esc(spot.description) + '</p></div>' +
    (spot.link ? '<a class="btn ad-cta" href="' + esc(spot.link) + '" target="_blank" rel="sponsored noopener">' + esc(spot.cta || 'Learn more') + '</a>' : '') + adLabel('Ad') + '</aside>';
}
/* Book or Contact: a demo confirmation in place, nothing is sent anywhere. */
function bookPartner(btn) {
  const p = PARTNERS.find(x => x.id === btn.dataset.id);
  if (!p || btn.classList.contains('sent')) return;
  const c = PARTNER_CATS[p.cat] || PARTNER_CATS.assist;
  btn.classList.add('sent');
  const lbl = $('.lbl-t', btn);
  if (lbl) lbl.textContent = 'Request sent';
  btn.insertAdjacentHTML('afterbegin', icon('check'));
  Sound.play('ok');
  burstFrom(btn, 8);
  Toast.show((c.act === 'Book' ? 'Booking request sent to ' : 'Contact request sent to ') + p.name + '. Demo only, nothing was sent.');
}
