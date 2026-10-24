
/* ==================================================================
   SCROLL FX
   Smooth, scroll-linked motion for every page. Nothing hijacks the
   scroll: each value is read from the real layout and eased toward its
   target every frame, so motion glides instead of stepping with the wheel.
   ================================================================== */
const ScrollFX = {
  raf: 0, on: false, lastY: 0, v: 0, t: 0, els: null, st: {}, moving: false, tickerVisible: false,
  tick: { x: 0, dir: 1, w: 0, hover: false, speed: 1 },
  mount(main) {
    this.unmount();
    const q = s => $(s, main);
    this.els = {
      copy: q('.hero-copy'), needles: q('#needles'), comp: q('#comp'), l: q('.comp-l'), r: q('.comp-r'), pill: q('.comp-pill'),
      ticker: q('.ticker'), track: q('.ticker-track'), mani: q('#manifesto'), words: $$('.mw', main), cards: $$('.bento.live > li, [data-rise]', main),
      kin: q('.kinetic'), rows: $$('.k-row', main), cta: q('.cta'), story: q('#story'), head: q('.phead'),
      routes: $$('[data-route]', main).map(el => ({ el, nodes: $$(el.dataset.route, el).filter(n => n.parentElement === el), pad: +(el.dataset.pad || 26) })).filter(R => R.nodes.length > 1)
    };
    if (reduced()) {
      this.els.words.forEach(w => { w.style.opacity = '1'; w.classList.add('lit'); });
      this.els.routes.forEach(R => { this.routeLayout(R); R.el.style.setProperty('--fill', '1'); R.nodes.forEach(n => n.classList.add('on')); });
      this.els = null; return;
    }
    const E = this.els;
    if (E.track) {
      this.tick.w = E.track.scrollWidth / 2; this.tick.x = -this.tick.w * 0.15; this.tick.speed = 1;
      E.ticker.addEventListener('pointerenter', () => { this.tick.hover = true; });
      E.ticker.addEventListener('pointerleave', () => { this.tick.hover = false; this.kick(); });
    }
    this.st = {}; E.routes.forEach((R, i) => { this.st['route' + i] = 0; });
    this.lastY = window.scrollY; this.v = 0; this.on = true; this.t = performance.now();
    this.frame(0, window.scrollY, true);
    this.kick();
  },
  /* The example slip re-renders its side cards: pick up the new nodes. */
  rebindComp() {
    if (!this.els) return;
    const c = this.els.comp; if (!c) return;
    this.els.l = $('.comp-l', c); this.els.r = $('.comp-r', c); this.els.pill = $('.comp-pill', c);
    this.frame(0, window.scrollY, false); this.kick();
  },
  /* Where a route line starts and how long it runs: from the first marker to the last. */
  routeLayout(R) {
    const offs = R.nodes.map(n => n.offsetTop - (n.offsetParent === R.el ? 0 : R.el.offsetTop) + R.pad);
    const first = offs[0], len = Math.max(0, offs[offs.length - 1] - first);
    R.el.style.setProperty('--top', first.toFixed(1) + 'px'); R.el.style.setProperty('--len', len.toFixed(1) + 'px');
    return { offs, first, len };
  },
  unmount() { this.on = false; cancelAnimationFrame(this.raf); this.raf = 0; this.els = null; this.v = 0; },
  kick() {
    if (!this.on || this.raf) return;
    const step = now => {
      this.raf = 0;
      if (!this.on || !this.els) return;
      const dt = Math.min(0.05, Math.max(0, (now - this.t) / 1000)); this.t = now;
      this.moving = false;
      const y = window.scrollY, dy = y - this.lastY; this.lastY = y;
      this.v += (dy - this.v) * 0.2;
      if (Math.abs(this.v) > 0.04) this.moving = true; else this.v = 0;
      this.frame(dt, y, false);
      if (this.moving || this.tickerVisible) this.raf = requestAnimationFrame(step);
    };
    this.t = performance.now();
    this.raf = requestAnimationFrame(step);
  },
  /* Ease a stored value toward its target; snap when close. */
  ease(key, target, k, snap) {
    const cur = this.st[key];
    if (cur === undefined || snap) { this.st[key] = target; return target; }
    let n = cur + (target - cur) * k;
    if (Math.abs(n - target) < 0.0004 * Math.max(1, Math.abs(target))) n = target; else this.moving = true;
    this.st[key] = n;
    return n;
  },
  frame(dt, y, snap) {
    const E = this.els;
    if (!E) return;
    const vh = window.innerHeight, cl = x => Math.max(0, Math.min(1, x)), px = n => n.toFixed(1) + 'px';
    const rect = el => el ? el.getBoundingClientRect() : null;
    /* Read every layout value first, then write, so a frame never forces a second layout. */
    const phone = isPhone();
    const copyH = E.copy ? E.copy.offsetHeight : 0;
    const rComp = phone ? null : rect(E.comp), rTick = rect(E.ticker), rMani = rect(E.mani), rKin = rect(E.kin), rStory = rect(E.story), rCta = rect(E.cta);
    /* Card positions come from layout offsets, so the transforms written below never feed back into them. */
    const parents = new Map(), cardTops = E.cards.map(li => {
      const par = li.parentElement;
      if (!parents.has(par)) parents.set(par, par.getBoundingClientRect());
      const pr = parents.get(par), own = li.offsetParent === par;
      return { top: pr.top + li.offsetTop - (own ? 0 : par.offsetTop), lx: (li.offsetLeft - (own ? 0 : par.offsetLeft)) / Math.max(1, pr.width), soft: li.dataset.rise === 'soft' };
    });
    const routeGeo = E.routes.map(R => Object.assign(this.routeLayout(R), { top: R.el.getBoundingClientRect().top }));
    const atEnd = document.documentElement.scrollHeight - vh - y < 6;

    /* Hero copy recedes as you leave it */
    if (E.copy) {
      const p = this.ease('hero', cl(y / Math.max(300, copyH * 0.95)), 0.13, snap);
      E.copy.style.transform = p ? 'translate3d(0,' + px(p * -80) + ',0) scale(' + (1 - p * 0.08).toFixed(4) + ')' : '';
      E.copy.style.opacity = p ? cl(1 - p * 1.1).toFixed(3) : '';
      if (E.needles) E.needles.style.opacity = p ? (1 - p * 0.75).toFixed(3) : '';
    }
    /* Slip composition: side cards glide in from the edges, then keep a little depth parallax */
    if (rComp) {
      const en = this.ease('comp', cl((vh - rComp.top) / (vh * 0.7)), 0.085, snap);
      const off = this.ease('compOff', vh / 2 - (rComp.top + rComp.height / 2), 0.12, snap);
      const u = 1 - en, op = (0.1 + 0.9 * en).toFixed(3);
      if (E.l) { E.l.style.transform = 'translate3d(' + px(-u * 190) + ',' + px(off * 0.07 + u * 40) + ',40px) rotate(' + (-u * 11).toFixed(2) + 'deg)'; E.l.style.opacity = op; }
      if (E.r) { E.r.style.transform = 'translate3d(' + px(u * 190) + ',' + px(off * 0.14 + u * 40) + ',40px) rotate(' + (u * 11).toFixed(2) + 'deg)'; E.r.style.opacity = op; }
      if (E.pill) { E.pill.style.transform = 'translate3d(' + px(u * 90) + ',' + px(off * 0.22 + u * 110) + ',60px) scale(' + (0.85 + 0.15 * en).toFixed(3) + ')'; E.pill.style.opacity = op; }
    }
    /* LED fee board: drifts on its own, speeds up and follows the scroll direction, eases to a stop on hover */
    if (E.track && rTick) {
      this.tickerVisible = rTick.bottom > 0 && rTick.top < vh;
      if (this.tickerVisible && dt) {
        if (Math.abs(this.v) > 0.8) this.tick.dir = this.v > 0 ? 1 : -1;
        this.tick.speed += ((this.tick.hover ? 0 : 1) - this.tick.speed) * 0.07;
        const sp = (52 + Math.min(1100, Math.abs(this.v) * 42)) * this.tick.speed, w = this.tick.w || 1;
        let x = this.tick.x - sp * dt * this.tick.dir;
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        this.tick.x = x;
        if (this.tick.hover && this.tick.speed < 0.01) this.tickerVisible = false;
      }
      E.track.style.transform = 'translate3d(' + px(this.tick.x) + ',0,0)';
    }
    /* Statement: words light up one by one as you read down */
    if (rMani && E.words.length) {
      const p = this.ease('mani', cl((vh * 0.85 - rMani.top) / (rMani.height + vh * 0.2)), 0.09, snap), n = E.words.length;
      for (let i = 0; i < n; i++) {
        const k = cl(p * (n + 6) - i), w = E.words[i], lit = k > 0.55;
        w.style.opacity = (0.14 + 0.86 * k).toFixed(3);
        if (lit !== w.classList.contains('lit')) w.classList.toggle('lit', lit);
      }
    }
    /* Page title drifts up and softens as the page scrolls under it */
    if (E.head) {
      const p = this.ease('head', cl(y / 360), 0.13, snap);
      E.head.style.transform = p ? 'translate3d(0,' + px(p * -46) + ',0) scale(' + (1 - p * 0.03).toFixed(4) + ')' : '';
      E.head.style.opacity = p ? (1 - p * 0.6).toFixed(3) : '';
    }
    /* Cards rise and tip into place, left to right. Soft ones only glide up. */
    for (let i = 0; i < cardTops.length; i++) {
      const c = cardTops[i], li = E.cards[i];
      if (c.soft) {
        const p = this.ease('card' + i, cl((vh * 1.0 - c.top) / (vh * 0.3)), 0.1, snap), u = 1 - p;
        li.style.transform = u ? 'translate3d(0,' + px(u * 64) + ',0)' : '';
        li.style.opacity = u ? (0.1 + 0.9 * p).toFixed(3) : '';
        continue;
      }
      const p = this.ease('card' + i, cl((vh * 1.02 - c.top - (phone ? 0 : c.lx * 120)) / (vh * 0.36)), 0.1, snap), u = 1 - p;
      li.style.transform = u ? 'perspective(1400px) translate3d(0,' + px(u * 110) + ',0) rotateX(' + (u * 20).toFixed(2) + 'deg) scale(' + (0.92 + 0.08 * p).toFixed(4) + ')' : '';
      li.style.opacity = u ? (0.05 + 0.95 * p).toFixed(3) : '';
    }
    /* Route lines draw down through numbered steps as you read, lighting each marker they reach */
    E.routes.forEach((R, i) => {
      const g = routeGeo[i];
      if (!g.len) return;
      const target = atEnd ? 1 : cl((vh * 0.7 - (g.top + g.first)) / g.len);
      const f = this.ease('route' + i, target, 0.08, false);
      R.el.style.setProperty('--fill', f.toFixed(4));
      const reach = g.first + f * g.len + 3;
      R.nodes.forEach((n, j) => { const on = g.offs[j] <= reach; if (on !== n.classList.contains('on')) n.classList.toggle('on', on); });
    });
    /* Kinetic type: rows slide past each other, the shapes between words roll */
    if (rKin && E.rows.length) {
      const rel = this.ease('kin', vh - rKin.top, 0.1, snap);
      E.rows.forEach((row, i) => { row.style.transform = 'translate3d(' + px(i % 2 ? rel * 0.5 - 1400 : -rel * 0.5 - 120) + ',0,0)'; });
      E.kin.style.setProperty('--kr', (rel * 0.3).toFixed(1) + 'deg');
    }
    /* Story: the dark stage opens out to full width as it arrives, and tucks back in as it leaves */
    if (rStory) {
      const pin = cl((vh - rStory.top) / (vh * 0.7)), pout = cl(rStory.bottom / (vh * 0.7));
      const u = this.ease('story', 1 - Math.min(pin, pout), 0.12, snap);
      E.story.style.clipPath = u > 0.002 ? 'inset(0 ' + (u * 5).toFixed(2) + 'vw round ' + px(u * 52) + ')' : '';
    }
    /* Closing orbits turn as you approach */
    if (rCta && typeof Orbits !== 'undefined') Orbits.scroll = this.ease('cta', cl((vh - rCta.top) / (vh + rCta.height)), 0.08, snap);
  }
};
window.addEventListener('scroll', () => ScrollFX.kick(), { passive: true });
window.addEventListener('resize', () => { if (ScrollFX.els && ScrollFX.els.track) ScrollFX.tick.w = ScrollFX.els.track.scrollWidth / 2; ScrollFX.kick(); });

/* A statement whose words light up as you scroll. Key words take the Bring, Go and Pay colours. */
const MANI_TEXT = {
  en: 'A trip to a government office can go wrong at the counter. A [b:paper] is [b:missing], the [o:hour] is [o:packed], or an agent quotes [g:any] [g:price]. ' +
    'Bring Go Pay answers all three before you leave home, so your first trip is the only trip.',
  hi: 'सरकारी दफ़्तर का एक चक्कर काउंटर पर ही बिगड़ सकता है। कोई [b:काग़ज़] [b:छूट] जाता है, उस [o:समय] [o:भीड़] होती है, या कोई एजेंट [g:मनमाना] [g:दाम] माँगता है। ' +
    'Bring Go Pay घर से निकलने से पहले ही तीनों का जवाब देता है, ताकि आपका पहला चक्कर ही आख़िरी हो।',
  kn: 'ಸರ್ಕಾರಿ ಕಚೇರಿಯ ಭೇಟಿ ಕೌಂಟರ್‌ನಲ್ಲೇ ಕೆಡಬಹುದು. ಒಂದು [b:ದಾಖಲೆ] [b:ಮರೆತಿರುತ್ತದೆ], ಆ [o:ಸಮಯದಲ್ಲಿ] [o:ಜನಸಂದಣಿ] ಇರುತ್ತದೆ, ಅಥವಾ ಏಜೆಂಟರು [g:ಮನಬಂದ] [g:ಬೆಲೆ] ಕೇಳುತ್ತಾರೆ. ' +
    'Bring Go Pay ನೀವು ಮನೆಯಿಂದ ಹೊರಡುವ ಮುನ್ನವೇ ಈ ಮೂರಕ್ಕೂ ಉತ್ತರ ಕೊಡುತ್ತದೆ, ಹೀಗಾಗಿ ನಿಮ್ಮ ಮೊದಲ ಭೇಟಿಯೇ ಕೊನೆಯ ಭೇಟಿ.'
};
function manifestoHTML() {
  const text = MANI_TEXT[I18n.lang] || MANI_TEXT.en;
  const words = text.split(' ').map(w => {
    const m = w.match(/^\[(b|o|g):([^\]]+)\](.*)$/);
    return m ? '<span class="mw"><span class="mk c-' + m[1] + '">' + esc(m[2]) + '</span>' + esc(m[3]) + '</span>' : '<span class="mw">' + esc(w) + '</span>';
  });
  return '<section class="manifesto" id="manifesto" aria-label="Why Bring Go Pay"><div class="wrap"><p class="mani" translate="no">' + words.join(' ') + '</p></div></section>';
}
/* Two rows of giant words that slide past each other as you scroll. Decorative. */
function kineticHTML() {
  const row = (words, cls) => {
    const one = words.map((w, i) => '<span>' + esc(tr(w)) + '</span><i class="k' + (i % 4) + '"></i>').join('');
    return '<div class="k-row' + (cls ? ' ' + cls : '') + '">' + one + one + one + '</div>';
  };
  return '<section class="kinetic" aria-hidden="true">' +
    row(['Aadhaar', 'PAN', 'Passport', 'Driving licence', 'Voter ID', 'Rent agreement', 'Tax return', 'Education loan']) +
    row(['Bring', 'Go', 'Pay', 'Bengaluru', 'Best time', 'Fair price'], 'k-out') + '</section>';
}
