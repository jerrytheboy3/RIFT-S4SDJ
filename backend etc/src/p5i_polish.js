
/* ==================================================================
   POLISH
   The finishing layer on every page: a thin edge light that follows
   the pointer around cards, a nav pill that slides to the link you
   point at, soft press ripples, a circular theme change, a reading
   ring on Back to top, a lit footer wordmark and a few quiet sounds.
   Hover effects need a mouse; all of it stops under reduced motion.
   ================================================================== */
const LIGHT_SEL = '.sdg-box, .stat-grid li, .card-hover, .brow, .ocard, .vcard, .pcard, .sdg-card, .ad-slot, .trip-card, .gcard, .tool.card, .fees-card, .formcard, .sp-tip, .empty.card';
const HUM_SEL = '.brow, .ocard, .sdg-card, .vcard, .trip-card';
const RIPPLE_SEL = '.btn, .iconbtn, .chip-inline, .trychip, .cases button, .seg button, .tabbar a, .tb-field, .lang-menu button';
const NAV_SOUND_SEL = '.mainnav a, .tabbar a, .wordmark, .crumbs a, .backlink, .foot-cols a, .brow, .ocard, .docs-teaser, .srow';
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const Polish = {
  lit: null, mag: null, fun: null, navOver: null, quietUntil: 0, px: 0, py: 0, pt: 0,
  /* Hover sounds stay rare: never more than one every 90 ms. */
  hum(name) { const t = performance.now(); if (t < this.quietUntil) return; this.quietUntil = t + 90; Sound.play(name); },
  move(e) {
    if (e.pointerType !== 'mouse' || !finePointer.matches || reduced() || !e.target.closest) return;
    const t = e.target;
    const el = t.closest(LIGHT_SEL);
    if (el !== this.lit) {
      if (this.lit) this.lit.classList.remove('lit');
      this.lit = el;
      if (el) {
        if (!el.querySelector(':scope > .hl')) {
          if (getComputedStyle(el).position === 'static') el.classList.add('hl-host');
          el.insertAdjacentHTML('beforeend', '<i class="hl" aria-hidden="true"></i>');
        }
        el.classList.add('lit');
        if (el.matches(HUM_SEL)) this.hum('glass');
      }
    }
    if (el) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--hx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--hy', (e.clientY - r.top).toFixed(0) + 'px');
    }
    const mag = t.closest('.magnetic');
    if (mag !== this.mag) { this.mag = mag; if (mag) this.hum('hover'); }
    const fun = t.closest('[data-hum]');
    if (fun !== this.fun) { this.fun = fun; if (fun && !fun.matches(HUM_SEL)) this.hum('glass'); }
    const navA = t.closest('.mainnav a');
    if (navA) this.navTo(navA);
    const ft = t.closest('.footer');
    if (ft) {
      const g = $('.foot-giant', ft);
      if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--fx', (e.clientX - r.left).toFixed(0) + 'px'); g.style.setProperty('--fy', (e.clientY - r.top).toFixed(0) + 'px'); }
    }
  },
  out(e) {
    if (e.relatedTarget) return;
    if (this.lit) { this.lit.classList.remove('lit'); this.lit = null; }
    this.mag = null;
  },
  /* The nav pill follows the pointer, then settles back on the page you are on. */
  navTo(a) {
    if (a === this.navOver) return;
    this.navOver = a;
    const ind = $('.mainnav .nav-ind');
    if (!ind || !a.offsetWidth) return;
    $('.mainnav').classList.add('previewing');
    if (ind.style.opacity !== '1') {
      ind.style.transition = 'none';
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      void ind.offsetWidth;
      ind.style.transition = '';
    } else {
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    }
    ind.style.opacity = '1';
    this.hum('hover');
  },
  navBack() {
    if (!this.navOver) return;
    this.navOver = null;
    $('.mainnav').classList.remove('previewing');
    placeNavInd();
  },
  /* A soft ripple spreads from the point you pressed. */
  ripple(e) {
    this.px = e.clientX; this.py = e.clientY; this.pt = performance.now();
    if (reduced() || e.button > 0 || !e.target.closest) return;
    const b = e.target.closest(RIPPLE_SEL);
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.4;
    let w = b.querySelector(':scope > .rip-wrap');
    if (!w) { w = document.createElement('i'); w.className = 'rip-wrap'; w.setAttribute('aria-hidden', 'true'); b.appendChild(w); }
    const d = document.createElement('i');
    d.className = 'rip';
    d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2).toFixed(0) + 'px;top:' + (e.clientY - r.top - s / 2).toFixed(0) + 'px';
    w.appendChild(d);
    setTimeout(() => d.remove(), 800);
  },
  /* A gentle tick when a link takes you somewhere new. */
  click(e) {
    const a = e.target.closest && e.target.closest(NAV_SOUND_SEL);
    if (!a || a.hasAttribute('data-act')) return;
    const href = a.getAttribute('href');
    if (href && href[0] === '#' && href !== location.hash) Sound.play('nav');
  },
  scrolled: false,
  scroll() {
    const on = window.scrollY > 8;
    if (on !== this.scrolled) { this.scrolled = on; document.documentElement.classList.toggle('scrolled', on); }
    const b = document.getElementById('totop');
    if (b) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      b.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(3) : '0');
    }
  }
};
/* The new theme spreads out in a circle from wherever you clicked. */
function themeReveal(fn, from) {
  const d = document.documentElement;
  if (reduced() || typeof document.startViewTransition !== 'function') { fn(); return; }
  let x = window.innerWidth / 2, y = 0;
  if (performance.now() - Polish.pt < 1500) { x = Polish.px; y = Polish.py; }
  else if (from && from.offsetParent) { const r = from.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  d.style.setProperty('--vx', x.toFixed(0) + 'px');
  d.style.setProperty('--vy', y.toFixed(0) + 'px');
  d.style.setProperty('--vr', Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 'px');
  d.classList.add('vt-theme');
  try {
    const vt = quietVT(document.startViewTransition(fn));
    vt.finished.finally(() => d.classList.remove('vt-theme'));
  } catch (e) { d.classList.remove('vt-theme'); fn(); }
}
document.addEventListener('pointermove', e => Polish.move(e), { passive: true });
document.addEventListener('pointerout', e => Polish.out(e), { passive: true });
document.addEventListener('pointerdown', e => Polish.ripple(e), { passive: true });
document.addEventListener('click', e => Polish.click(e));
window.addEventListener('scroll', () => Polish.scroll(), { passive: true });
$('.mainnav').addEventListener('pointerleave', () => Polish.navBack());
