
/* ==================================================================
   MOTION
   Page transitions, scroll reveals, springs and parallax. Reduced
   motion (device or in-app) turns all of it into instant changes.
   ================================================================== */
memo.segPos = {};
memo.ringP = {};
function buzz(pattern) {
  if (reduced() || !isPhone() || !('vibrate' in navigator)) return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  try { navigator.vibrate(pattern); } catch (e) { /* not supported */ }
}
function restartAnim(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function scrambleLED(root) {
  if (reduced()) return;
  const CH = '0123456789ABCDEFHJKLMNPRSTUWXYZ';
  $$('[data-led]', root).forEach(el => {
    const final = el.textContent, start = performance.now(), dur = 340;
    const frame = t => {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - start) / dur), settled = Math.floor(k * final.length);
      let s = '';
      for (let i = 0; i < final.length; i++) { const c = final[i]; s += (i < settled || c === ' ' || c === ':') ? c : CH[(Math.random() * CH.length) | 0]; }
      el.textContent = k < 1 ? s : final;
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  $$('.led', root).forEach(l => restartAnim(l, 'pulse'));
}
function countUp(el, to, ms) {
  if (!el) return;
  if (reduced()) { el.textContent = inr(to); return; }
  const start = performance.now();
  const f = t => { const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = inr(Math.round(to * e)); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function animateVerdict(out) {
  const needle = $('.needle', out);
  if (needle) requestAnimationFrame(() => requestAnimationFrame(() => { needle.style.left = needle.dataset.to + '%'; }));
  const amt = $('[data-count]', out);
  if (amt) countUp(amt, +amt.dataset.count, 700);
}
/* First full pack of a case: badge springs in, card nudges, bars fill in a wave, phone buzzes. */
function celebratePack(boxesEl, slot, sec) {
  if (boxesEl) {
    const bx = $$('.bx', boxesEl);
    bx.forEach(b => b.classList.remove('on'));
    void boxesEl.offsetWidth;
    boxesEl.classList.add('stagger');
    bx.forEach(b => b.classList.add('on'));
    setTimeout(() => boxesEl.classList.remove('stagger'), 60 * bx.length + 600);
  }
  if (slot) slot.innerHTML = packedBadge('slam');
  if (sec) { restartAnim(sec, 'nudge'); setTimeout(() => sec.classList.remove('nudge'), 400); }
  Sound.play('pack');
  buzz([10, 30, 14]);
}
function landStampLater(root, ms, shake) {
  const st = $('.slip .stamp', root), wrap = $('.slip-wrap', root);
  if (!st) return;
  setTimeout(() => {
    if (!st.isConnected) return;
    st.classList.remove('pending');
    restartAnim(st, shake ? 'land' : 'slam');
    Sound.play('stamp');
    if (shake && wrap) setTimeout(() => restartAnim(wrap, 'thunk'), 200);
  }, ms);
}
function playComp(tid) {
  const comp = document.getElementById('comp');
  if (!comp) return;
  const anim = !reduced();
  comp.innerHTML = compHTML(tid, nowIST(), anim);
  if (anim) Sound.play('print', { dur: 1.35 });
  if (anim) {
    $$('.comp-l .mini, .comp-r .mini, .comp-pill .fee-pill', comp).forEach(el => restartAnim(el, 'swap'));
    landStampLater(comp, 1400, false);
  }
  ScrollFX.rebindComp();
}
/* Scroll reveal: content glides up as it enters the viewport. */
let revealIO = null;
function setupReveals(root, instant) {
  const els = $$('[data-reveal]:not(.in)', root);
  if (!els.length) return;
  if (instant || reduced() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  if (!revealIO) revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  els.forEach(e => revealIO.observe(e));
}
/* Segmented controls: the thumb slides from where it was to the pressed button. */
function placeThumbs(root, animate) {
  if (I18n.lang !== 'en') I18n.apply(!root || root === document ? document.body : root);
  $$('.seg[data-seg]', root || document).forEach(sg => {
    const th = $('.seg-thumb', sg), on = $('button[aria-pressed="true"]', sg);
    if (!th) return;
    if (!on) { th.style.opacity = '0'; return; }
    const id = sg.dataset.seg, pos = { l: on.offsetLeft, w: on.offsetWidth };
    const prev = memo.segPos[id];
    if (animate && prev && !reduced() && (prev.l !== pos.l || prev.w !== pos.w)) {
      th.style.transition = 'none';
      th.style.left = prev.l + 'px'; th.style.width = prev.w + 'px';
      void th.offsetWidth;
      th.style.transition = '';
    } else if (!animate) {
      th.style.transition = 'none';
      requestAnimationFrame(() => { th.style.transition = ''; });
    }
    th.style.left = pos.l + 'px'; th.style.width = pos.w + 'px'; th.style.opacity = '1';
    memo.segPos[id] = pos;
  });
}
function pressSeg(btn) {
  Sound.play('tap');
  const sg = btn.closest('.seg');
  if (!sg) return;
  $$('button', sg).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  placeThumbs(sg.parentElement, true);
}
/* Progress rings sweep from their last value to the new one. */
function animateRings(root) {
  $$('.ring[data-ring]', root || document).forEach(r => {
    const id = r.dataset.ring, p = +r.dataset.p, c = $('.r-val', r), L = 138.2;
    const from = memo.ringP[id] != null ? memo.ringP[id] : 0;
    if (reduced()) { c.style.strokeDashoffset = (L * (1 - p)).toFixed(1); memo.ringP[id] = p; return; }
    c.style.transition = 'none';
    c.style.strokeDashoffset = (L * (1 - from)).toFixed(1);
    void c.getBoundingClientRect();
    c.style.transition = '';
    requestAnimationFrame(() => { c.style.strokeDashoffset = (L * (1 - p)).toFixed(1); });
    memo.ringP[id] = p;
  });
}
/* Hero product shot: a little 3D tilt under the pointer. Scroll motion lives in ScrollFX. */
function tiltHero(e) {
  if (route.name !== 'home' || reduced() || isPhone()) return;
  const stage = document.getElementById('comp-stage');
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
  stage.style.transform = 'rotateY(' + Math.max(-6, Math.min(6, x * 7)).toFixed(2) + 'deg) rotateX(' + Math.max(-5, Math.min(5, -y * 5)).toFixed(2) + 'deg)';
  stage.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
  stage.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
  stage.style.setProperty('--go', Math.min(0.9, 0.35 + Math.hypot(x, y)).toFixed(2));
}
function untiltHero() { const s = document.getElementById('comp-stage'); if (s) { s.style.transform = ''; s.style.setProperty('--go', '0'); } }
function showSwipeHint() {
  if (S.flags.swipeHint || !isPhone()) return;
  S.flags.swipeHint = true; save();
  const bar = $('.bottombar');
  if (!bar) return;
  const el = document.createElement('div');
  el.className = 'swipe-hint'; el.id = 'swipe-hint'; el.setAttribute('role', 'note');
  el.textContent = 'Swipe to move between steps';
  bar.insertBefore(el, bar.firstChild);
  setTimeout(hideSwipeHint, 4000);
}
function hideSwipeHint() {
  const el = document.getElementById('swipe-hint');
  if (!el) return;
  el.classList.add('gone');
  setTimeout(() => el.remove(), reduced() ? 0 : 420);
}

/* ==================================================================
   ROUTER
   Hash routes. Every screen is deep-linkable; Back restores scroll.
   ================================================================== */
let route = { name: 'home' };
let navIdx = 1;
const ALT_BG = ['guides', 'guide', 'best', 'office', 'fair-price', 'tickets', 'documents', 'notfound'];

function safeReplaceState(state, url) {
  try { if (url) history.replaceState(state, '', url); else history.replaceState(state, ''); } catch (e) { /* rate limited */ }
}
function replaceHash(h) { safeReplaceState(history.state, h); memo.hash = h; }
function parseRoute(h) {
  h = (h || '').replace(/^#/, '');
  try { h = decodeURIComponent(h); } catch (e) { /* keep raw */ }
  if (!h || h === 'home') return { name: 'home' };
  const p = h.split('.');
  if (p[0] === 'best-time') {
    if (p.length === 1) return { name: 'best' };
    if (p.length === 2 && OFFICES[p[1]]) return { name: 'office', id: p[1] };
    return { name: 'notfound' };
  }
  if (p.length === 1 && ['guides', 'fair-price', 'tickets', 'documents', 'about', 'settings'].includes(p[0])) return { name: p[0] };
  if (TASKS[p[0]] && p.length <= 3) {
    const t = TASKS[p[0]];
    if (p[1] && !caseOf(t, p[1])) return { name: 'notfound' };
    if (p[2] && !SEC_IDS.includes(p[2])) return { name: 'notfound' };
    return { name: 'guide', task: p[0], case: p[1] || null, sec: p[2] || null };
  }
  return { name: 'notfound' };
}
function navKey(r) {
  return { guides: 'guides', guide: 'guides', best: 'best-time', office: 'best-time', 'fair-price': 'fair-price', tickets: 'tickets', documents: 'documents', about: 'about' }[r.name] || '';
}
function setNav(key) {
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  placeNavInd(false);
}
/* The highlight behind the current nav link slides from link to link. */
function placeNavInd(instant) {
  const ind = $('.mainnav .nav-ind');
  if (!ind) return;
  const a = $('.mainnav a[aria-current="page"]');
  if (!a || !a.offsetWidth) { ind.style.opacity = '0'; return; }
  const jump = instant || reduced() || ind.style.opacity !== '1';
  if (jump) ind.style.transition = 'none';
  ind.style.width = a.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  ind.style.opacity = '1';
  if (jump) { void ind.offsetWidth; ind.style.transition = ''; }
  const nav = a.parentNode;
  if (nav.scrollWidth > nav.clientWidth + 1 && (a.offsetLeft < nav.scrollLeft || a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth))
    nav.scrollLeft = Math.max(0, a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2);
  navFade();
}
/* When the nav scrolls inside the bar, fade whichever edge hides more links. */
function navFade() {
  const n = $('.mainnav');
  if (!n) return;
  const over = n.scrollWidth > n.clientWidth + 1;
  n.classList.toggle('clip', over);
  n.style.setProperty('--fl', over && n.scrollLeft > 2 ? '28px' : '0px');
  n.style.setProperty('--fr', over && n.scrollLeft + n.clientWidth < n.scrollWidth - 2 ? '28px' : '0px');
}
/* Back-to-top button shows once you are well down a page. */
function updateToTop() {
  const b = document.getElementById('totop');
  if (!b) return;
  const on = window.scrollY > window.innerHeight * 1.2;
  if (on === b.classList.contains('on')) return;
  b.classList.toggle('on', on);
  b.setAttribute('aria-hidden', String(!on));
  b.tabIndex = on ? 0 : -1;
}
function titleFor(r) {
  switch (r.name) {
    case 'home': return 'Bring Go Pay: what to bring, when to go, what to pay';
    case 'guides': return 'Guides';
    case 'guide': { const t = TASKS[r.task], c = caseOf(t, r.case); const s = r.sec ? SECTIONS.find(x => x.id === r.sec).en + ': ' : ''; return s + t.name + ', ' + c.label; }
    case 'best': return 'Best time';
    case 'office': return OFFICES[r.id].name;
    case 'fair-price': return 'Fair price';
    case 'tickets': return 'My tickets';
    case 'about': return 'About';
    case 'documents': return 'My documents';
    default: return 'Page not found';
  }
}

function onHashChange() {
  const st = history.state;
  const isNew = !st || typeof st.idx !== 'number';
  if (isNew) { navIdx += 1; safeReplaceState({ idx: navIdx, y: 0 }); }
  else navIdx = st.idx;
  if (Overlay.cur && Overlay.name() !== 'settings') Overlay.close(true);
  handleRoute({ restoreY: isNew ? 0 : (st.y || 0), focus: true, vt: true });
}
function onPopState() {
  const st = history.state;
  if (Overlay.cur && Overlay.name() !== 'settings' && !(st && st.ov === Overlay.name())) Overlay.close(true);
}
function handleRoute(opt) {
  opt = opt || {};
  if (!DATA.ready) return;   // the first page waits for the database (startData)
  const r = parseRoute(location.hash);
  memo.prevHash = memo.hash;
  memo.hash = location.hash;
  if (r.name === 'settings') {
    if (!memo.bgRoute) { memo.bgRoute = { name: 'home' }; renderRoute(memo.bgRoute, { restoreY: 0, nav: true }); }
    openSettings();
    setNav('');
    document.title = 'Settings | Bring Go Pay';
    return;
  }
  if (Overlay.name() === 'settings') Overlay.close(true);
  if (r.name === 'guide') {
    const task = TASKS[r.task];
    const cs = caseOf(task, r.case) || currentCase(task);
    if (!r.case) { r.case = cs.id; if (isPhone()) replaceHash('#' + keyOf(task, cs)); }
    if (!isPhone() && !r.sec) { r.sec = firstUnfinished(task, cs); r.auto = true; replaceHash('#' + keyOf(task, cs) + '.' + r.sec); }
  }
  memo.bgRoute = r;
  renderRoute(r, Object.assign({ nav: true }, opt));
}
/* A transition can be skipped (another navigation, a resize). That is fine, so swallow its promises. */
function quietVT(t) { if (t) [t.ready, t.finished, t.updateCallbackDone].forEach(p => p && p.catch(() => {})); return t; }
function renderRoute(r, opt) {
  opt = opt || {};
  const go = () => doRender(r, opt);
  if (opt.vt && !memo.firstRender && !reduced() && typeof document.startViewTransition === 'function') {
    try { quietVT(document.startViewTransition(go)); return; } catch (e) { /* fall back to a plain render */ }
  }
  go();
  if (opt.vt && !reduced() && typeof document.startViewTransition !== 'function') restartAnim(document.getElementById('main'), 'enter');
}
function doRender(r, opt) {
  unmountHome();
  PageFX.unmount();
  route = r;
  const main = document.getElementById('main');
  const phone = isPhone();
  document.body.classList.toggle('in-guide', r.name === 'guide' && phone);
  document.body.classList.toggle('in-section', r.name === 'guide' && !!r.sec && phone);
  document.body.classList.toggle('alt', ALT_BG.includes(r.name));
  document.documentElement.classList.toggle('has-slip', r.name === 'guide' && r.sec === 'ticket');
  memo.pendingSeen = null;
  if (r.name === 'guide' && r.sec) {
    const task = TASKS[r.task], cs = caseOf(task, r.case);
    if (!(r.auto && r.sec === 'bring')) markVisited(task, cs, r.sec);
    else { S.lastCase[task.id] = cs.id; S.recent = [keyOf(task, cs)].concat(S.recent.filter(k => k !== keyOf(task, cs))).slice(0, 6); }
    save();
  } else if (r.name === 'guide') {
    S.lastCase[r.task] = r.case; save();
  }
  let html;
  switch (r.name) {
    case 'home': html = viewHome(); break;
    case 'guides': html = viewGuides(); break;
    case 'guide': html = viewGuide(r); break;
    case 'best': html = viewBest(); break;
    case 'office': html = viewOffice(r.id); break;
    case 'fair-price': html = viewFair(); break;
    case 'tickets': html = viewTickets(); break;
    case 'about': html = viewAbout(); break;
    case 'documents': html = viewDocuments(); break;
    default: html = viewNotFound();
  }
  main.innerHTML = html;
  I18n.apply(main);
  document.title = r.name === 'home' ? tr(titleFor(r)) : tr(titleFor(r)) + ' | Bring Go Pay';
  setNav(navKey(r));
  afterRender(r, opt);
  memo.firstRender = false;
}
function afterRender(r, opt) {
  const main = document.getElementById('main');
  setupReveals(main, !opt.nav);
  fitDigits(main);
  placeThumbs(main, !opt.nav);
  animateRings(main);
  if (r.name === 'home') {
    const input = $('#home-q'), pop = $('#home-q-pop');
    if (input) mountSearch(input, pop, pick => { input.blur(); location.hash = pick.href; }, true);
    if (memo.homePrint) {
      S.flags.printDemo = true; save(); memo.homePrint = false;
      if (!reduced()) landStampLater(main, 1500, false);
    }
    mountHome(main);
  }
  if (r.name === 'guide' && r.sec === 'ticket' && memo.pendingSeen) {
    const p = memo.pendingSeen;
    S.seen[p.key] = p.sig; save();
    if (p.anim) { Sound.play('print', { dur: 0.85 }); landStampLater(main, 900, true); }
  }
  if (r.name === 'guide' && r.sec && isPhone()) showSwipeHint();
  if (r.name === 'documents') vaultHydrate(main);
  if (r.name === 'fair-price' && memo.fair && memo.fair.autoCheck) { memo.fair.autoCheck = false; runCheck('fq', true); }
  if (memo.ledAnim) { memo.ledAnim = false; scrambleLED(main); }
  if (opt.restoreY != null) {
    const y = opt.restoreY;
    window.scrollTo(0, y);
    if (y) requestAnimationFrame(() => window.scrollTo(0, y));
  }
  if (opt.focus) {
    const target = (r.name === 'guide' && r.sec && document.getElementById('sec-h')) || document.getElementById('page-h') || document.getElementById('board-h');
    if (target) { try { target.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }
  if (opt.focusId) { const el = document.getElementById(opt.focusId); if (el) el.focus({ preventScroll: true }); }
  if (r.name !== 'home') PageFX.mount(main, r, opt);
  ScrollFX.mount(main);
}
/* Re-render the current screen in place, keeping scroll and focus. */
function refresh(fallbackFocus) {
  const id = document.activeElement && document.activeElement.id;
  const y = window.scrollY;
  doRender(route, {});
  window.scrollTo(0, y);
  const el = (id && document.getElementById(id)) || (fallbackFocus && $(fallbackFocus));
  if (el && !(Overlay.cur && !Overlay.cur.el.contains(el))) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}
function saveScroll() {
  const st = history.state;
  if (!st || st.ov || Overlay.name() === 'settings') return;
  if (st.y === Math.round(window.scrollY)) return;
  safeReplaceState(Object.assign({}, st, { y: Math.round(window.scrollY) }));
}
function stepSection(dir) {
  if (route.name !== 'guide' || !route.sec) return;
  const i = SEC_IDS.indexOf(route.sec), j = i + dir;
  if (j < 0 || j >= SEC_IDS.length) return;
  if (route.sec === 'go' && dir > 0) markPicked();
  saveScroll();
  location.hash = '#' + route.task + '.' + route.case + '.' + SEC_IDS[j];
}

/* ==================================================================
   ACTIONS
   ================================================================== */
function routeKey() { return route.name === 'guide' ? route.task + '.' + route.case : null; }
function markPicked() { const k = routeKey(); if (k && !S.picked[k]) { S.picked[k] = true; save(); } }

function onTick(input) {
  const list = input.closest('[data-key]');
  if (!list) return;
  const key = list.dataset.key, x = caseByKey(key);
  const before = bringStats(x.task, x.cs).all;
  const ticks = S.ticks[key] || (S.ticks[key] = {});
  if (input.checked) ticks[input.dataset.tick] = true; else delete ticks[input.dataset.tick];
  S.lastGuide = key;
  save();
  if (input.checked) { buzz(8); burstFrom(input.nextElementSibling, 9); }
  const willPack = bringStats(x.task, x.cs).all && !before && !S.packedOnce[key];
  if (!willPack) Sound.play(input.checked ? 'tick' : 'untick');
  updateBring(x.task, x.cs, before);
}
function syncChecks(key) {
  const ticks = ticksOf(key);
  $$('.checklist[data-key="' + key + '"] [data-tick]').forEach(i => { i.checked = !!ticks[i.dataset.tick]; });
}
function updateBring(task, cs, wasAll, opt) {
  opt = opt || {};
  const key = keyOf(task, cs), st = bringStats(task, cs), ticks = ticksOf(key);
  const head = document.getElementById('bring-head');
  if (head) {
    const bxs = $('.boxes', head);
    const slot = document.getElementById('packed-slot');
    const celebrate = st.all && !wasAll && !S.packedOnce[key];
    if (celebrate && !reduced()) celebratePack(bxs, slot, document.getElementById('sec'));
    else {
      $$('.bx', head).forEach((b, i) => b.classList.toggle('on', i < st.done));
      if (slot && st.all && !wasAll) { slot.innerHTML = packedBadge(); Sound.play('ok'); }
    }
    if (slot && !st.all) slot.innerHTML = '';
    const cnt = $('#bring-count'); if (cnt) cnt.textContent = st.done + ' of ' + st.req + ' packed';
    cs.items.filter(i => i.pick).forEach(it => {
      const g = $('[data-gstate="' + it.id + '"]');
      if (g) { const d = itemDone(it, ticks); g.classList.toggle('on', d); g.innerHTML = groupState(d); }
    });
    if (celebrate) { S.packedOnce[key] = true; save(); }
  }
  if (st.all && !wasAll && !opt.noToast) {
    const show = () => Toast.show('All packed', { action: 'See ticket', onAction: () => { location.hash = '#' + key + '.ticket'; } });
    if (reduced()) show(); else setTimeout(show, 320);
  }
  refreshOverview(task, cs);
}

function fillFromDocs(key) {
  const x = caseByKey(key);
  if (!x) return;
  const { task, cs } = x;
  if (!docsCount()) {
    Toast.show('Tick what you have in My documents first.', { action: 'My documents', onAction: () => { location.hash = '#settings'; } });
    return;
  }
  const snap = JSON.stringify(S.ticks[key] || {});
  const before = bringStats(task, cs).all;
  const ticks = S.ticks[key] || (S.ticks[key] = {});
  let n = 0;
  for (const it of cs.items) {
    if (it.pick) {
      if (itemDone(it, ticks)) continue;
      const o = it.pick.find(o => o.doc && S.docs[o.doc]);
      if (o) { ticks[it.id + ':' + o.id] = true; n++; }
    } else if (it.doc && S.docs[it.doc] && !ticks[it.id]) { ticks[it.id] = true; n++; }
  }
  if (!n) { Toast.show('Nothing new to tick from My documents.'); return; }
  S.lastGuide = key;
  save();
  syncChecks(key);
  Sound.play('tick');
  updateBring(task, cs, before, { noToast: true });
  Toast.show('Ticked ' + n + ' from My documents', { action: 'Undo', onAction: () => {
    const b2 = bringStats(task, cs).all;
    S.ticks[key] = JSON.parse(snap); save();
    syncChecks(key); updateBring(task, cs, b2, { noToast: true }); announce('Ticks restored');
  } });
}
function clearTicks(key) {
  const x = caseByKey(key);
  if (!x) return;
  const snap = S.ticks[key];
  if (!snap || !Object.values(snap).some(Boolean)) { Toast.show('Nothing to clear yet.'); return; }
  const before = bringStats(x.task, x.cs).all;
  delete S.ticks[key]; save();
  Sound.play('untick');
  syncChecks(key); updateBring(x.task, x.cs, before);
  Toast.show('Ticks cleared', { action: 'Undo', onAction: () => {
    const b2 = bringStats(x.task, x.cs).all;
    S.ticks[key] = snap; save();
    syncChecks(key); updateBring(x.task, x.cs, b2, { noToast: true }); announce('Ticks restored');
  } });
}
function switchCase(tid, cid) {
  Sound.play('tap');
  S.lastCase[tid] = cid; save();
  const h = '#' + tid + '.' + cid + (route.sec ? '.' + route.sec : '');
  replaceHash(h);
  const y = window.scrollY;
  handleRoute({});
  window.scrollTo(0, y);
  if (!reduced()) restartAnim(document.getElementById('sec'), 'swap');
  const b = document.getElementById('case-' + cid);
  if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}
function chooseGo(el, kind) {
  const scope = el.dataset.scope, tid = el.dataset.task, oid = el.dataset.office;
  if (kind === 'office') { S.office[tid] = oid; delete S.slot[tid]; }
  else if (kind === 'day') {
    if (scope === 'guide') { S.day[tid] = el.dataset.date; delete S.slot[tid]; }
    else { S.officeDay[oid] = el.dataset.date; delete S.slot[oid]; }
  } else if (kind === 'alt') {
    const v = { date: el.dataset.date, t: +el.dataset.t };
    if (scope === 'guide') S.slot[tid] = v; else S.slot[oid] = v;
  }
  if (scope === 'guide') markPicked();
  save();
  Sound.play('blip');
  memo.ledAnim = true;
  refresh(kind === 'alt' ? '.alts button' : null);
}
function saveTicket(key) {
  const x = caseByKey(key), now = nowIST();
  const ex = tripOf(key);
  if (ex) ex.savedAt = Date.now();
  else S.trips.unshift({ id: 't' + Date.now().toString(36) + (hash(key + Math.random()) % 1296).toString(36), key, savedAt: Date.now(), date: tripDate(x.task, x.cs, now), savedDay: now.date });
  save();
  refresh();
  burstFrom(document.getElementById(isPhone() ? 'save-m' : 'save-d'), 14);
  Sound.play('ok');
  Toast.show('Saved to My tickets', { action: 'Open', onAction: () => { location.hash = '#tickets'; } });
}
function shareText(key) {
  const x = caseByKey(key), now = nowIST(), d = slipData(x.task, x.cs, now);
  const url = location.href.split('#')[0] + '#' + key;
  return 'Bring Go Pay: ' + tr(x.task.name) + ', ' + tr(x.cs.label) + '\n' + tr('Token') + ' ' + d.token +
    '\n' + tr('BRING') + ': ' + d.bring.map(b => (b.done ? '[x] ' : '[ ] ') + tr(b.lbl)).join('; ') +
    '\n' + tr('GO') + ': ' + d.go.lines.map(tr).join(', ') + '\n' + tr('PAY') + ': ' + tr(d.pay) + '\n' + tr('Rush times are estimates.') + '\n' + url;
}
async function shareTrip(key, btn) {
  const text = shareText(key);
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse && typeof navigator.share === 'function') {
    try { await navigator.share({ title: 'Bring Go Pay trip', text }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  if (await copyText(text)) confirmInPlace(btn, 'Copied');
  else copyDialog(text);
}
function removeTrip(id) {
  const i = S.trips.findIndex(t => t.id === id);
  if (i < 0) return;
  const tr = S.trips.splice(i, 1)[0];
  save();
  Sound.play('close');
  refresh('#page-h');
  Toast.show('Removed from My tickets', { action: 'Undo', onAction: () => {
    S.trips.splice(Math.min(i, S.trips.length), 0, tr); save();
    if (route.name === 'tickets' || (route.name === 'guide' && route.sec === 'ticket')) refresh();
  } });
}
function onDoc(input) {
  const id = input.dataset.doc;
  if (input.checked) S.docs[id] = true; else delete S.docs[id];
  save();
  Sound.play(input.checked ? 'tick' : 'untick');
  if (input.checked) { buzz(8); burstFrom(input.nextElementSibling, 7); }
  $$('[data-doc="' + id + '"]').forEach(x => { if (x !== input) x.checked = input.checked; });
  $$('[data-docs-count]').forEach(el => { el.textContent = docsCount() + ' of ' + DOCS.length + ' ticked'; });
  if (!Overlay.cur && route.name === 'guide' && route.sec === 'bring') refresh();
}
function onPaySel(sel) {
  const tid = sel.dataset.task, p = paySel(tid);
  p[sel.dataset.pay] = sel.value;
  if (tid === 'passport' && (p.age === 'u18' || p.age === 'u8')) p.pages = '36';
  save();
  refresh();
}
function runCheck(qid, anim) {
  const box = $('[data-quote="' + qid + '"]');
  if (!box) return;
  const task = TASKS[box.dataset.task], cs = caseOf(task, box.dataset.case);
  const inp = document.getElementById(qid + '-amt'), out = document.getElementById(qid + '-out');
  const raw = inp.value.trim();
  if (!raw) {
    memo.q[qid] = { amount: '', checked: false };
    out.innerHTML = '<p class="verdict" style="font-weight:600">Type the amount you were quoted, in rupees, then tap Check.</p>';
    inp.focus();
    return;
  }
  const a = parseInt(raw, 10), b = bandFor(task, cs);
  memo.q[qid] = { amount: raw, checked: true };
  const motion = anim && !reduced();
  out.innerHTML = verdictHTML(a, b, motion);
  if (motion) animateVerdict(out);
  const vk = verdictOf(a, b).k;
  liveBand();
  Sound.play(vk === 'over' ? 'over' : vk === 'high' ? 'warn' : vk === 'below' ? 'tap' : 'ok');
}

/* ---------- Settings ---------- */
function applySettings() {
  const d = document.documentElement, st = S.settings;
  if (st.theme === 'light' || st.theme === 'dark') d.setAttribute('data-theme', st.theme); else d.removeAttribute('data-theme');
  if (st.text === 'large' || st.text === 'larger') d.setAttribute('data-text', st.text); else d.removeAttribute('data-text');
  d.classList.toggle('rm', st.motion === 'reduced');
  const b = document.getElementById('tb-theme');
  if (b) b.setAttribute('aria-label', effectiveDark() ? 'Switch to light theme' : 'Switch to dark theme');
  const sb = document.getElementById('tb-sound');
  if (sb) { const on = st.sound !== 'off'; sb.innerHTML = icon(on ? 'sound' : 'mute'); sb.setAttribute('aria-pressed', String(on)); sb.setAttribute('aria-label', on ? 'Turn sound effects off' : 'Turn sound effects on'); }
  const meta = $$('meta[name="theme-color"]');
  if (st.theme !== 'device') meta.forEach(m => { m.setAttribute('content', st.theme === 'dark' ? '#000000' : '#FFFFFF'); });
  else { meta[0] && meta[0].setAttribute('content', '#FFFFFF'); meta[1] && meta[1].setAttribute('content', '#000000'); }
}
function effectiveDark() { const t = S.settings.theme; return t === 'dark' || (t === 'device' && mqDark.matches); }
function withThemeFade(fn) {
  if (reduced() || typeof document.startViewTransition !== 'function') { fn(); return; }
  try { quietVT(document.startViewTransition(fn)); } catch (e) { fn(); }
}
function toggleTheme() {
  const dark = !effectiveDark();
  Sound.play('theme', { dark });
  themeReveal(() => { S.settings.theme = dark ? 'dark' : 'light'; save(); applySettings(); refreshSettings(); }, document.getElementById('tb-theme'));
}
function toggleSound() {
  S.settings.sound = S.settings.sound === 'off' ? 'on' : 'off'; save(); applySettings(); refreshSettings();
  if (S.settings.sound === 'on') { Sound.unlock(); Sound.play('pop'); }
  announce(S.settings.sound === 'on' ? 'Sound effects on' : 'Sound effects off');
}
/* ---------- Language ---------- */
function updateLangUI() {
  const l = I18n.lang, b = document.getElementById('lang-badge');
  if (b) b.textContent = LANG_SHORT[l];
  $$('#lang-menu [data-v]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.v === l)));
}
function openLangMenu() {
  const m = document.getElementById('lang-menu'), b = document.getElementById('tb-lang');
  if (!m) return;
  if (!m.hidden) { closeLangMenu(true); return; }
  Sound.play('open');
  m.hidden = false; b.setAttribute('aria-expanded', 'true');
  if (!reduced()) restartAnim(m, 'pop');
  const cur = $('[aria-checked="true"]', m) || $('button', m); if (cur) cur.focus();
}
function closeLangMenu(focusBack) {
  const m = document.getElementById('lang-menu'), b = document.getElementById('tb-lang');
  if (!m || m.hidden) return;
  m.hidden = true; b.setAttribute('aria-expanded', 'false');
  if (focusBack) b.focus();
}
function setLang(l) {
  closeLangMenu(false);
  if (!LANGS.includes(l) || l === (S.settings.lang || 'en')) return;
  Sound.play('whoosh');
  withThemeFade(() => {
    S.settings.lang = l; save();
    I18n.setLang(l);
    SEARCH_INDEX = null;
    I18n.apply(document.body);
    applySettings(); updateLangUI();
    refresh(); refreshSettings();
    placeNavInd(true);
  });
  announce(LANG_NAMES[l]);
}
function setSetting(k, v) {
  if (k === 'lang') { setLang(v); return; }
  if (k === 'ads') { Sound.play('tap'); S.settings.ads = v; save(); refreshSettings(); refresh(); return; }
  if (k === 'sound') { S.settings.sound = v === 'off' ? 'on' : 'off'; toggleSound(); return; }
  const apply = () => { S.settings[k] = v; save(); applySettings(); refreshSettings(); };
  if (k === 'theme') { Sound.play('theme', { dark: v === 'dark' || (v === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches) }); themeReveal(apply); }
  else { Sound.play('tap'); apply(); }
  if (k === 'text') requestAnimationFrame(() => { fitDigits(); placeThumbs(document, false); });
}
function openSettings() {
  if (Overlay.name() === 'settings') { refreshSettings(); return; }
  Sound.play('open');
  const el = Overlay.open('settings', 'sheet', settingsHTML(), { labelledby: 'set-h', push: false, onOpen: el => { const b = $('#set-close', el); if (b) b.focus(); } });
  placeThumbs(el, false);
}
function refreshSettings() {
  if (Overlay.name() !== 'settings') return;
  const el = Overlay.cur.el, id = document.activeElement && document.activeElement.id;
  const body = $('.sheet-body', el), sc = body ? body.scrollTop : 0;
  $('.ov-panel', el).innerHTML = settingsHTML();
  I18n.apply($('.ov-panel', el));
  const nb = $('.sheet-body', el); if (nb) nb.scrollTop = sc;
  placeThumbs(el, true);
  const n = id && document.getElementById(id);
  if (n) n.focus({ preventScroll: true });
}
function closeSettings() {
  const st = history.state;
  if (st && typeof st.idx === 'number' && st.idx > 1 && memo.prevHash && memo.prevHash !== '#settings') history.back();
  else location.replace('#home');
}
/* Clearing everything asks first, in a dialog with a clear Cancel. */
function confirmClearAll() {
  Sound.play('warn');
  Overlay.open('confirm-clear', 'dialog', '<div class="confirm-ic" aria-hidden="true">' + icon('warn') + '</div>' +
    '<h2 id="cc-h" class="h3">Clear all data?</h2>' +
    '<p class="muted" style="margin-top:8px">This removes your ticks, saved tickets, documents you marked, everything in your document vault, and your theme and sound settings from this device.</p>' +
    '<p class="small" style="margin-top:10px;font-weight:600">You can undo it for a few seconds. Vault files cannot be brought back.</p>' +
    '<div class="btn-row confirm-row"><button type="button" class="btn" data-act="ov-close" id="cc-cancel">Cancel</button>' +
    '<button type="button" class="btn btn-danger" data-act="clear-yes" id="cc-yes">Clear everything</button></div>',
    { labelledby: 'cc-h', push: false, onOpen: el => { const b = $('#cc-cancel', el); if (b) b.focus(); },
      onClose: () => { if (location.hash === '#settings') setTimeout(() => { openSettings(); const b = document.getElementById('clear-all'); if (b) b.focus(); }, 0); } });
}
function clearAll() {
  const snap = JSON.stringify(S), keepLang = S.settings.lang;
  S = freshState(); S.settings.lang = keepLang; save();
  memo.prevDone = {}; memo.q = {}; memo.fair = null;
  applySettings(); refreshSettings(); refresh();
  Toast.show('All data cleared', { action: 'Undo', onAction: () => {
    S = JSON.parse(snap); save(); applySettings(); refreshSettings(); refresh(); announce('Your data is back');
  } });
}

/* ==================================================================
   EVENTS (delegated)
   ================================================================== */
/* Accordions open and close with a smooth height animation. */
document.addEventListener('click', e => {
  const sum = e.target.closest('details.fold > summary');
  if (!sum) return;
  const d = sum.parentElement, body = $('.fold-body', d);
  if (reduced() || !body || typeof body.animate !== 'function') return;
  e.preventDefault();
  if (d.dataset.busy) return;
  if (d.open) {
    d.dataset.busy = '1';
    const h = body.offsetHeight;
    const a = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' });
    a.onfinish = () => { d.open = false; delete d.dataset.busy; };
  } else {
    d.open = true;
    const h = body.offsetHeight;
    body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
}, true);
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a) saveScroll();
  if (!e.target.closest('.lang-wrap')) closeLangMenu(false);
  const el = e.target.closest('[data-act]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'retry-data': startData(0); break;
    case 'totop': {
      Sound.play('whoosh');
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      const t = document.getElementById('sec-h') || document.getElementById('page-h');
      if (t) { try { t.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
      break;
    }
    case 'skip': { const t = document.getElementById('sec-h') || document.getElementById('page-h') || document.getElementById('main'); t.focus(); break; }
    case 'search': Sound.play('open'); openSearch(); break;
    case 'theme': toggleTheme(); break;
    case 'sound': toggleSound(); break;
    case 'story': Sound.play('tap'); Story.go(+el.dataset.step); break;
    case 'ov-close': Sound.play('close'); if (Overlay.name() === 'settings') closeSettings(); else Overlay.close(); break;
    case 'close-settings': Sound.play('close'); closeSettings(); break;
    case 'case': switchCase(el.dataset.task, el.dataset.case); break;
    case 'fill': fillFromDocs(el.dataset.key); break;
    case 'clear': clearTicks(el.dataset.key); break;
    case 'office': chooseGo(el, 'office'); break;
    case 'day': chooseGo(el, 'day'); break;
    case 'alt': chooseGo(el, 'alt'); break;
    case 'cal':
      if (el.dataset.scope === 'guide') { markPicked(); setTimeout(() => { const x = caseByKey(routeKey()); if (x) refreshOverview(x.task, x.cs); }, 0); }
      break;
    case 'copy':
      Sound.play('tap');
      copyText(el.dataset.copy).then(ok => { if (ok) confirmInPlace(el, el.dataset.done || 'Copied'); else copyDialog(el.dataset.copy); });
      break;
    case 'next': if (el.dataset.from === 'go') markPicked(); break;
    case 'back-start':
      if (memo.prevHash === el.getAttribute('href') && history.state && history.state.idx > 1) { e.preventDefault(); history.back(); }
      break;
    case 'save': saveTicket(el.dataset.key); break;
    case 'share': case 'tshare': shareTrip(el.dataset.key, el); break;
    case 'print': document.documentElement.classList.add('has-slip'); window.print(); break;
    case 'tremove': removeTrip(el.dataset.id); break;
    case 'docs-all': {
      memo.docsAll = true;
      const px = el.dataset.px;
      if (Overlay.name() === 'settings') refreshSettings(); else refresh();
      const f = document.getElementById(px + '-doc-' + DOCS[7].id); if (f) f.focus();
      break;
    }
    case 'set': setSetting(el.dataset.k, el.dataset.v); break;
    case 'clear-all': confirmClearAll(); break;
    case 'clear-yes': Overlay.close(true); Vault.wipe(); clearAll(); break;
    case 'langmenu': openLangMenu(); break;
    case 'ad-book': bookPartner(el); break;
    case 'lang': setLang(el.dataset.v); break;
    case 'example': memo.exampleTask = el.dataset.task; pressSeg(el); playComp(el.dataset.task); break;
    case 'bfilter': Sound.play('tap'); S.bestFilter = el.dataset.f; save(); refresh('#bf-' + el.dataset.f); break;
    case 'gfilter': Sound.play('tap'); S.guidesFilter = el.dataset.f; save(); refresh('#gf-' + el.dataset.f); break;
    case 'copylist': {
      const text = checklistText(el.dataset.key);
      Sound.play('tap');
      copyText(text).then(ok => { if (ok) confirmInPlace(el, 'Copied'); else copyDialog(text); });
      break;
    }
    case 'calm': S.officeDay['ask-southend'] = el.dataset.date; S.slot['ask-southend'] = { date: el.dataset.date, t: +el.dataset.t }; save(); break;
    case 'qpick': {
      const inp = document.getElementById(el.dataset.q + '-amt');
      if (inp) { inp.value = el.dataset.amt; runCheck(el.dataset.q, true); }
      break;
    }
    case 'qcheck': runCheck(el.dataset.q, true); break;
    case 'ftask': Sound.play('tap'); memo.fair = { task: el.dataset.task }; refresh(); break;
    case 'fcase': Sound.play('tap'); memo.fair = { task: el.dataset.task, case: el.dataset.case }; refresh(); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-tick]')) onTick(t);
  else if (t.matches('[data-doc]')) onDoc(t);
  else if (t.matches('[data-pay]')) onPaySel(t);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.tool) { onTool(t); return; }
  if (!t.classList || !t.classList.contains('digits-input')) return;
  const pos = t.selectionStart == null ? t.value.length : t.selectionStart, before = t.value;
  const clean = before.replace(/\D+/g, '').slice(0, 6);
  if (clean !== before) {
    const removed = before.slice(0, pos).replace(/\d/g, '').length;
    t.value = clean;
    const np = Math.max(0, Math.min(clean.length, pos - removed));
    try { t.setSelectionRange(np, np); } catch (err) { /* ignore */ }
  }
  const q = t.closest('[data-quote]');
  if (q) { memo.q[q.dataset.quote] = { amount: t.value, checked: false }; liveBand(); }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.dataset.form !== 'hq') return;
  e.preventDefault();
  const tid = $('#hq-task').value, amt = $('#hq-amt').value.trim();
  memo.fair = { task: tid, case: S.lastCase[tid] || null, autoCheck: !!amt };
  memo.q.fq = { amount: amt, checked: false };
  location.hash = '#fair-price';
});
document.addEventListener('toggle', e => {
  const d = e.target;
  if (d.matches && d.matches('details[data-fold]')) memo.openFolds[d.dataset.fold] = d.open;
}, true);
document.addEventListener('keydown', e => {
  trapFocus(e);
  const k = e.key, t = e.target;
  const inField = t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName));
  if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); if (Overlay.name() !== 'search') Sound.play('open'); openSearch(); return; }
  const lm = document.getElementById('lang-menu');
  if (lm && !lm.hidden) {
    if (k === 'Escape') { e.preventDefault(); closeLangMenu(true); return; }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      const items = $$('button', lm), i = items.indexOf(document.activeElement);
      items[(i + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      return;
    }
    if (k === 'Tab') closeLangMenu(false);
  }
  if (k === 'Escape') {
    if (Overlay.name() === 'settings') { e.preventDefault(); Sound.play('close'); closeSettings(); return; }
    if (Overlay.cur) { e.preventDefault(); Sound.play('close'); Overlay.close(); return; }
  }
  if (k === 'Enter' && t && t.classList && t.classList.contains('digits-input')) {
    const q = t.closest('[data-quote]');
    if (q) { e.preventDefault(); runCheck(q.dataset.quote, true); return; }
  }
  if (inField || e.metaKey || e.ctrlKey || e.altKey || Overlay.cur) return;
  if (k === '/') { e.preventDefault(); Sound.play('open'); openSearch(); }
  else if (k === '?') { e.preventDefault(); Sound.play('open'); openShortcuts(); }
  else if ((k === 'ArrowRight' || k === 'ArrowLeft') && route.name === 'guide' && route.sec) { e.preventDefault(); stepSection(k === 'ArrowRight' ? 1 : -1); }
});

/* Swipe between guide sections on phones */
let swipe = null;
document.addEventListener('touchstart', e => {
  swipe = null;
  if (!(route.name === 'guide' && route.sec && isPhone()) || Overlay.cur || e.touches.length !== 1) return;
  if (e.target.closest && e.target.closest('input,select,textarea,.chip,.chips,.heat,.seg,.cases,.digits-field,.qpicks,.bottombar')) return;
  const p = e.touches[0];
  swipe = { x: p.clientX, y: p.clientY };
}, { passive: true });
document.addEventListener('touchend', e => {
  if (!swipe) return;
  const p = e.changedTouches[0], dx = p.clientX - swipe.x, dy = p.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { hideSwipeHint(); Sound.play('whoosh'); stepSection(dx < 0 ? 1 : -1); }
}, { passive: true });

let scrollTimer = 0;
let storyRAF = 0;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimer); scrollTimer = setTimeout(saveScroll, 160); updateToTop();
  if (Story.el && !storyRAF) storyRAF = requestAnimationFrame(() => { storyRAF = 0; Story.update(); });
}, { passive: true });
/* Browsers only allow audio after a gesture: wake the synth on the first one. */
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => Sound.unlock(), { capture: true, passive: true }));
window.addEventListener('pagehide', saveScroll);
window.addEventListener('afterprint', () => { if (!(route.name === 'guide' && route.sec === 'ticket')) document.documentElement.classList.remove('has-slip'); });
document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('.hero')) tiltHero(e); }, { passive: true });
document.addEventListener('pointerout', e => { if (e.target.closest && e.target.closest('.hero') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.hero'))) untiltHero(); }, { passive: true });

function onLayoutChange() {
  const y = window.scrollY;
  handleRoute({ nav: false });
  window.scrollTo(0, y);
}
mqPhone.addEventListener('change', onLayoutChange);
mqDark.addEventListener('change', applySettings);
mqReduce.addEventListener('change', () => refreshSettings());

/* Keep the IST clock line fresh on the home screen. */
setInterval(() => {
  if (route.name !== 'home') return;
  const el = document.getElementById('status-line');
  if (el) el.textContent = statusLine(nowIST());
}, 30000);

/* ==================================================================
   INIT
   ================================================================== */
/* ---------- Data: the first page waits for the database ---------- */
const DATA = { ready: false, loading: false, savedAt: 0 };
function dataStateHTML(kind) {
  if (kind === 'loading') return '<div class="wrap page data-state" aria-busy="true"><span class="ds-spin" aria-hidden="true"></span><p class="lead" id="page-h" tabindex="-1">Loading the guides…</p>' +
    '<p class="muted ds-slow" hidden>This is taking longer than usual. The connection may be slow.</p></div>';
  const setup = kind === 'setup';
  return '<div class="wrap page data-state"><div class="empty card">' + tile(setup ? 'info' : 'warn', 't-office', 'lg') +
    '<h1 class="h3" id="page-h" tabindex="-1">' + (setup ? 'Not connected to the database yet' : 'Couldn’t load the guides') + '</h1>' +
    '<p style="margin-top:10px">' + (setup ? 'This copy of the site has no Supabase address or key. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, then build it again.' : 'Check your internet connection and try again.') + '</p>' +
    (setup ? '' : '<div class="btn-row" style="justify-content:center;margin-top:20px"><button type="button" class="btn btn-primary" data-act="retry-data">Try again</button></div>') + '</div></div>';
}
function showDataState(kind) { const m = document.getElementById('main'); m.innerHTML = dataStateHTML(kind); I18n.apply(m); }
/* The footer's guide list and check dates come from the database too. */
function fillFooterGuides() {
  const fg = document.getElementById('footer-guides');
  if (fg) { fg.innerHTML = TASK_IDS.map(id => '<li><a href="#' + id + '">' + esc(TASKS[id].name) + '</a></li>').join(''); I18n.apply(fg); }
  const fn = document.getElementById('footer-note');
  if (fn) { fn.textContent = 'An independent civic-tech pilot, not a government website. Fees checked ' + FEES_CHECKED + ', new guides ' + NEW_CHECKED + '. Rush levels are estimates. Confirm on the official portal before you pay.'; I18n.apply(fn); }
}
/* A thin bar under the header while the site is showing its saved copy. */
function showDataNote(on) {
  const n = document.getElementById('data-note');
  if (!n) return;
  if (!on) { n.hidden = true; n.innerHTML = ''; return; }
  const [day, time] = savedWhen(DATA.savedAt);
  n.innerHTML = '<p><span><span class="dot dot-warn" aria-hidden="true"></span>Can’t reach the server. Showing the guides saved on ' + esc(day) + ' at ' + esc(time) + '.</span>' +
    '<button type="button" class="btn-text" data-act="retry-data">Try again</button></p>';
  n.hidden = false;
  I18n.apply(n);
}
/* Start-up: show the saved copy at once if there is one, then fetch the latest from Supabase.
   No saved copy: a spinner (only if loading takes a moment), then the page, or a clear error. */
async function startData(restoreY) {
  if (!dbConfigured()) { showDataState('setup'); return; }
  if (DATA.loading) return;
  DATA.loading = true;
  const cached = readDataCache();
  if (cached && !DATA.ready) {
    try { applyData(cached.db); DATA.ready = true; DATA.savedAt = cached.savedAt; fillFooterGuides(); handleRoute({ restoreY: restoreY || 0 }); }
    catch (e) { DATA.ready = false; }   // a damaged copy: ignore it and load fresh
  }
  const slow = DATA.ready ? 0 : setTimeout(() => showDataState('loading'), 250);
  const slower = DATA.ready ? 0 : setTimeout(() => { const h = document.querySelector('.data-state .ds-slow'); if (h) h.hidden = false; }, 8000);
  let fresh = null;
  try { fresh = await loadData(); } catch (e) { fresh = null; }
  clearTimeout(slow); clearTimeout(slower);
  DATA.loading = false;
  if (!fresh) {
    if (DATA.ready) showDataNote(true);   // keep using the saved copy, and say how old it is
    else showDataState('error');
    return;
  }
  showDataNote(false);
  const changed = !cached || JSON.stringify(fresh) !== JSON.stringify(cached.db);
  writeDataCache(fresh);
  DATA.savedAt = Date.now();
  if (!DATA.ready) { applyData(fresh); DATA.ready = true; fillFooterGuides(); handleRoute({ restoreY: restoreY || 0 }); return; }
  if (changed) { applyData(fresh); fillFooterGuides(); refresh(); Toast.show('Updated with the latest fees and documents.'); }
}
function init() {
  S = loadState();
  I18n.setLang(S.settings.lang);
  applySettings();
  memo.firstRender = true;
  const tbf = document.getElementById('tbf-ic'); if (tbf) tbf.outerHTML = icon('search', 'ic-s');
  const kbd = document.getElementById('tbf-kbd'); if (kbd) kbd.textContent = isMac() ? '⌘K' : 'Ctrl K';
  document.getElementById('tb-search').innerHTML = icon('search');
  document.getElementById('tb-theme').innerHTML = icon('theme');
  document.getElementById('tb-settings').innerHTML = icon('settings');
  $$('[data-logo]').forEach(l => { l.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.logo + '</svg>'; });
  $$('[data-ic]').forEach(s => { s.outerHTML = icon(s.dataset.ic); });
  document.getElementById('footer-links').innerHTML = [L.uidai, L.myaadhaar, L.incometax, L.passport, L.shcil, L.sarathi, L.eci, L.pmvl].map(l => '<li>' + extLink(l) + '</li>').join('');
  I18n.apply(document.body);
  updateLangUI();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const st = history.state;
  if (st && typeof st.idx === 'number') navIdx = st.idx;
  else safeReplaceState({ idx: 1, y: 0 });
  if (!location.hash) replaceHash('#home');
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', onPopState);
  startData((history.state && history.state.y) || 0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitDigits(); placeThumbs(document, false); placeNavInd(true); }).catch(() => {});
  window.addEventListener('resize', () => { clearTimeout(init._r); init._r = setTimeout(() => { fitDigits(); placeThumbs(document, false); placeNavInd(true); Story.update(); Needles.resize(); }, 120); });
  $('.mainnav').addEventListener('scroll', navFade, { passive: true });
}
init();
</script>
</body>
</html>
