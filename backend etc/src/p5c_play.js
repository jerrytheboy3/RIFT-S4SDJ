
/* ==================================================================
   HOME INTERACTIONS
   Needle field (hero), dock magnification, orbit lines. All of it is play: nothing here navigates on its own.
   ================================================================== */
const TAU = Math.PI * 2;
function angLerp(a, b, t) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; }
/* Colour wheel for lit needles: blue, violet, pink, orange, green, back to blue. */
const NEEDLE_PAL = (() => {
  const st = [[46, 139, 255], [124, 92, 246], [255, 72, 128], [255, 138, 61], [32, 196, 140], [46, 139, 255]], out = [];
  for (let i = 0; i < 72; i++) {
    const f = i / 72 * (st.length - 1), k = Math.floor(f), u = f - k, a = st[k], b = st[k + 1];
    out.push([0, 1, 2].map(j => Math.round(a[j] + (b[j] - a[j]) * u)).join(','));
  }
  return out;
})();

/* ---------- Magnetic needle field ---------- */
const Needles = {
  cvs: null, c: null, w: 0, h: 0, dpr: 1, pts: [], raf: 0, px: -1e4, py: -1e4, last: -1e9, ripples: [], visible: true, io: null, t0: 0,
  mount(cvs) {
    this.unmount();
    if (!cvs || !cvs.getContext) return;
    this.cvs = cvs; this.c = cvs.getContext('2d'); this.t0 = performance.now(); this.visible = true;
    this.resize();
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.wake(); });
      this.io.observe(cvs);
    }
    this.frame(performance.now() + 4000);
    this.wake();
  },
  unmount() { cancelAnimationFrame(this.raf); this.raf = 0; if (this.io) this.io.disconnect(); this.io = null; this.cvs = null; this.ripples = []; },
  resize() {
    const cvs = this.cvs;
    if (!cvs) return;
    const host = cvs.parentElement;
    const w = host.clientWidth, h = Math.min(host.clientHeight, Math.max(680, window.innerHeight + 80));
    this.w = w; this.h = h; this.dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(w * this.dpr); cvs.height = Math.round(h * this.dpr);
    cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
    const sp = w < 768 ? 25 : 29;
    this.pts = [];
    for (let row = 0, y = sp / 2; y < h; y += sp * 0.88, row++) {
      for (let x = sp / 2 + (row % 2 ? sp / 2 : 0); x < w; x += sp) this.pts.push({ x, y, a: Math.sin(x * 0.0065) * 1.3 + Math.cos(y * 0.009) * 1.1 });
    }
    if (reduced()) this.frame(performance.now());
  },
  /* Lit needles stay soft around the words themselves (each line of the headline, the subtitle, the
     search and the chips), fading out over a short distance so there is never a hard-edged box. */
  measureQuiet() {
    if (!this.cvs) return;
    const r = this.cvs.getBoundingClientRect(), hero = this.cvs.parentElement, out = [];
    const add = q => { if (q.width > 1 && q.height > 1) out.push([q.left - r.left - 6, q.top - r.top - 4, q.right - r.left + 6, q.bottom - r.top + 4]); };
    $$('#page-h, .hero-sub, .kn', hero).forEach(el => { const rg = document.createRange(); rg.selectNodeContents(el); [...rg.getClientRects()].forEach(add); });
    $$('.hsearch-field, .trychip, .hs-try .muted, .status', hero).forEach(el => add(el.getBoundingClientRect()));
    this.quiet = out;
    this.quietAt = performance.now();
  },
  point(cx, cy) {
    if (!this.cvs) return;
    if (!this.quietAt || performance.now() - this.quietAt > 700) this.measureQuiet();
    const r = this.cvs.getBoundingClientRect();
    this.px = cx - r.left; this.py = cy - r.top; this.last = performance.now();
    this.wake();
  },
  ripple(cx, cy) {
    if (!this.cvs || reduced()) return;
    const r = this.cvs.getBoundingClientRect();
    this.ripples.push({ x: cx - r.left, y: cy - r.top, t0: performance.now() });
    if (this.ripples.length > 4) this.ripples.shift();
    this.wake();
  },
  wake() {
    if (this.raf || !this.cvs || reduced()) return;
    const loop = t => { this.raf = 0; if (!this.cvs || !this.visible || document.hidden) return; this.frame(t); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  frame(t) {
    const c = this.c, s = (t - this.t0) / 1000, now = performance.now();
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const act = Math.max(0, 1 - (now - this.last) / 2400);
    const sv = typeof ScrollFX !== 'undefined' ? Math.min(1, Math.abs(ScrollFX.v) / 26) : 0;
    this.ripples = this.ripples.filter(r => now - r.t0 < 1700);
    const hot = [];
    c.lineCap = 'round';
    c.lineWidth = 1.5;
    c.beginPath();
    for (const p of this.pts) {
      let target = Math.sin(p.x * 0.0065 + s * 0.42) * 1.3 + Math.cos(p.y * 0.009 - s * 0.3) * 1.1 + s * 0.04;
      let heat = 0;
      if (act > 0.01) {
        const dx = this.px - p.x, dy = this.py - p.y, d = Math.sqrt(dx * dx + dy * dy);
        heat = act * Math.exp(-d / 330);
        if (heat > 0.01) target = angLerp(target, Math.atan2(dy, dx), Math.min(1, heat * 1.9));
      }
      if (sv > 0.02) target = angLerp(target, Math.PI / 2, Math.min(0.95, sv));
      for (const r of this.ripples) {
        const age = (now - r.t0) / 1000, R = age * 780, dd = Math.hypot(p.x - r.x, p.y - r.y);
        const band = Math.exp(-((dd - R) * (dd - R)) / 4200) * Math.max(0, 1 - age / 1.7);
        if (band > heat) { heat = band; target = angLerp(target, Math.atan2(p.y - r.y, p.x - r.x), Math.min(1, band * 1.5)); }
      }
      p.a = angLerp(p.a, target, 0.16);
      const L = 6 + 15 * heat + 16 * sv;
      const ca = Math.cos(p.a) * L / 2, sa = Math.sin(p.a) * L / 2;
      if (heat < 0.07) { c.moveTo(p.x - ca, p.y - sa); c.lineTo(p.x + ca, p.y + sa); }
      else hot.push(p.x, p.y, ca, sa, heat, p.a);
    }
    c.strokeStyle = effectiveDark() ? 'rgba(255,255,255,.17)' : 'rgba(29,29,31,.15)';
    c.stroke();
    c.lineWidth = 2.1;
    for (let i = 0; i < hot.length; i += 6) {
      const x = hot[i], y = hot[i + 1], ca = hot[i + 2], sa = hot[i + 3], heat = hot[i + 4], a = hot[i + 5];
      const idx = Math.floor((((a % TAU) + TAU) % TAU) / TAU * NEEDLE_PAL.length) % NEEDLE_PAL.length;
      let alpha = Math.min(1, 0.25 + heat), k = 1;
      const Q = this.quiet || [];
      let d2 = 1e9;
      for (let qi = 0; qi < Q.length && d2; qi++) {
        const q = Q[qi], dx = Math.max(q[0] - x, 0, x - q[2]), dy = Math.max(q[1] - y, 0, y - q[3]);
        d2 = Math.min(d2, dx * dx + dy * dy);
      }
      if (d2 < 3600) { const f = Math.sqrt(d2) / 60, sm = f * f * (3 - 2 * f); alpha *= 0.3 + 0.7 * sm; k = 0.7 + 0.3 * sm; }
      c.strokeStyle = 'rgba(' + NEEDLE_PAL[idx] + ',' + alpha.toFixed(2) + ')';
      c.beginPath(); c.moveTo(x - ca * k, y - sa * k); c.lineTo(x + ca * k, y + sa * k); c.stroke();
    }
  }
};

/* ---------- Dock: icons swell under the pointer, like the macOS Dock ---------- */
let dockFocus = -1;
function dockMove(e) {
  const dock = document.getElementById('dock');
  if (!dock || reduced() || isPhone()) return;
  const r = dock.getBoundingClientRect();
  const near = e.clientY > r.top - 90 && e.clientY < r.bottom + 30 && e.clientX > r.left - 60 && e.clientX < r.right + 60;
  let best = -1, bestS = 1;
  $$('.dock-i', dock).forEach((it, i) => {
    let s = 1;
    if (near) {
      const ir = it.getBoundingClientRect(), d = Math.abs(e.clientX - (ir.left + ir.width / 2));
      s = 1 + 0.72 * Math.pow(Math.max(0, 1 - d / 200), 2);
    }
    if (s > bestS) { bestS = s; best = i; }
    it.style.setProperty('--s', s.toFixed(3));
  });
  if (best !== dockFocus) { dockFocus = best; if (best >= 0 && bestS > 1.4) Sound.play('hover'); }
}

/* ---------- Orbit lines behind the closing section ---------- */
const Orbits = {
  svg: null, dots: [], raf: 0, io: null, visible: false, t0: 0, rx: 0, ry: 0, tx: 0, ty: 0,
  mount(svg) {
    this.unmount();
    if (!svg) return;
    this.svg = svg; this.t0 = performance.now();
    this.dots = $$('[data-orb]', svg).map(el => { const [rx, ry, w, ph] = el.dataset.orb.split(',').map(Number); return { el, rx, ry, w, ph }; });
    this.frame(performance.now());
    if (reduced()) return;
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.wake(); });
      this.io.observe(svg);
    }
  },
  unmount() { cancelAnimationFrame(this.raf); this.raf = 0; if (this.io) this.io.disconnect(); this.io = null; this.svg = null; },
  point(e) {
    if (!this.svg) return;
    const r = this.svg.getBoundingClientRect();
    this.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    this.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
  },
  wake() {
    if (this.raf || !this.svg || reduced()) return;
    const loop = t => { this.raf = 0; if (!this.svg || !this.visible || document.hidden) return; this.frame(t); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  frame(t) {
    const s = (t - this.t0) / 1000;
    for (const d of this.dots) {
      const a = d.ph + s * d.w;
      d.el.setAttribute('cx', (d.rx * Math.cos(a)).toFixed(1));
      d.el.setAttribute('cy', (d.ry * Math.sin(a)).toFixed(1));
    }
    this.rx += (this.tx - this.rx) * 0.06; this.ry += (this.ty - this.ry) * 0.06;
    const sc = this.scroll || 0;
    this.svg.style.transform = 'perspective(1200px) rotateX(' + (62 - sc * 16 + this.ry * 12).toFixed(2) + 'deg) rotateZ(' + (this.rx * 10 + sc * 70).toFixed(2) + 'deg)';
  }
};
function orbitsHTML() {
  const rings = [[560, 560], [430, 430], [300, 300], [175, 175]];
  const dots = [[560, 560, 0.16, 0.4, 9, '#2E8BFF'], [430, 430, -0.23, 2.1, 8, '#FF8A3D'], [300, 300, 0.31, 4.0, 7, '#20C48C'], [175, 175, -0.42, 1.2, 6, '#FF4880'],
    [560, 560, 0.16, 3.6, 4, 'var(--ink-3)'], [430, 430, -0.23, 5.2, 3.5, 'var(--ink-3)'], [300, 300, 0.31, 0.9, 3, 'var(--ink-3)']];
  return '<svg class="orbits" id="orbits" viewBox="-620 -620 1240 1240" aria-hidden="true">' +
    rings.map(([rx, ry], i) => '<circle r="' + rx + '" class="orb' + (i % 2 ? ' dash' : '') + '"/>').join('') +
    '<g class="ticks">' + Array.from({ length: 60 }, (_, i) => { const a = i / 60 * TAU, r1 = 560, r2 = i % 5 ? 572 : 586; return '<line x1="' + (r1 * Math.cos(a)).toFixed(1) + '" y1="' + (r1 * Math.sin(a)).toFixed(1) + '" x2="' + (r2 * Math.cos(a)).toFixed(1) + '" y2="' + (r2 * Math.sin(a)).toFixed(1) + '"/>'; }).join('') + '</g>' +
    dots.map(([rx, ry, w, ph, r, col]) => '<circle data-orb="' + rx + ',' + ry + ',' + w + ',' + ph + '" r="' + r + '" fill="' + col + '"/>').join('') + '</svg>';
}
function dockHTML() {
  const item = (href, label, tileHTML, extra) => '<a class="dock-i' + (extra ? ' ' + extra : '') + '" href="' + href + '"><span class="dock-l">' + esc(label) + '</span>' + tileHTML + '</a>';
  return '<nav class="dock-wrap" aria-label="Jump to a guide"><div class="dock" id="dock">' +
    TASK_IDS.map(id => item('#' + id, TASKS[id].name, taskTile(TASKS[id], ''))).join('') +
    '<span class="dock-sep" aria-hidden="true"></span>' +
    item('#best-time', 'Best time', tile('clock', 't-go', ''), 'dock-x') + item('#fair-price', 'Fair price', tile('rupeec', 't-pay', ''), 'dock-x') +
    item('#tickets', 'My tickets', tile('ticket', 't-ticket', ''), 'dock-x') + '</div></nav>';
}
/* ---------- Paper plane: loops in over the closing headline and lands beside it ---------- */
const PLANE_SVG = '<svg viewBox="0 0 48 48" focusable="false"><path d="M46 24L3 5l10 19z" fill="#8CC8FF"/><path d="M46 24H13L3 43z" fill="#2E8BFF"/><path d="M46 24H13l5 9z" fill="#0A5BD3"/></svg>';
function planeHTML() {
  if (reduced()) return '';
  return '<svg class="plane-trail" aria-hidden="true" focusable="false"><mask id="pt-mask" maskUnits="userSpaceOnUse"><path class="pt-rev"/></mask><path class="pt-path" mask="url(#pt-mask)"/></svg>' +
    '<span class="plane" aria-hidden="true">' + PLANE_SVG + '</span>';
}
const Plane = {
  sec: null, io: null, raf: 0, state: 'idle', last: 0, timer: 0, rt: 0, end: null,
  mount(main) {
    this.unmount();
    const sec = $('.cta', main);
    if (!sec || !$('.plane', sec) || reduced() || !('IntersectionObserver' in window)) return;
    this.sec = sec; this.state = 'idle';
    this.io = new IntersectionObserver(() => this.check(), { threshold: [0, 0.25, 0.45, 0.7, 1] });
    this.io.observe(sec);
    $('.cta-h', sec).addEventListener('pointerenter', this.replay);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, { passive: true });
  },
  /* How much of the closing section is on screen, against the most of it that could be. */
  seen() {
    const r = this.sec.getBoundingClientRect(), vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    return vis / Math.max(1, Math.min(r.height, window.innerHeight));
  },
  check() {
    if (this.state !== 'idle' || !this.sec || !this.sec.isConnected) return;
    if (this.seen() >= 0.45) { this.state = 'waiting'; this.timer = setTimeout(() => this.fly(), 1100); }
  },
  onScroll: () => Plane.check(),
  unmount() {
    cancelAnimationFrame(this.raf); clearTimeout(this.timer); clearTimeout(this.rt);
    if (this.io) this.io.disconnect();
    if (this.sec) { const h = $('.cta-h', this.sec); if (h) h.removeEventListener('pointerenter', this.replay); }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    this.io = null; this.sec = null; this.state = 'idle';
  },
  /* Pointing at the headline sends the plane round again, at most every few seconds. */
  replay: () => { if (Plane.state === 'landed' && performance.now() - Plane.last > 2500) Plane.fly(); },
  onResize: () => { clearTimeout(Plane.rt); Plane.rt = setTimeout(() => { if (Plane.state === 'landed') Plane.park(); else Plane.check(); }, 160); },
  /* The route: in from the left, one loop beside the headline where there is room, then a landing just past its first line. */
  geom() {
    const s = this.sec, sr = s.getBoundingClientRect(), w = sr.width, h = sr.height;
    const hd = $('.cta-h', s), rg = document.createRange();
    rg.selectNodeContents(hd);
    const r = [...rg.getClientRects()].find(x => x.width > 4) || hd.getBoundingClientRect();
    const left = r.left - sr.left, top = r.top - sr.top;
    let ex = r.right - sr.left + 30, ey = top + r.height * 0.2;
    if (ex > w - 30) { ex = w - 30; ey = top - 28; }
    const sx = -40, sy = h * 0.74, rr = Math.min(62, w * 0.07);
    const lx = Math.min(w * 0.22, left - rr - 34), ly = top + r.height * 0.9;
    const f = n => n.toFixed(1);
    let d = 'M' + sx + ' ' + f(sy);
    if (lx - rr > 20) {
      d += ' C' + f(sx + w * 0.12) + ' ' + f(sy + 10) + ' ' + f(lx - rr * 1.6) + ' ' + f(ly + rr) + ' ' + f(lx) + ' ' + f(ly + rr);
      d += ' A' + rr + ' ' + rr + ' 0 0 0 ' + f(lx + rr) + ' ' + f(ly) + ' A' + rr + ' ' + rr + ' 0 0 0 ' + f(lx) + ' ' + f(ly - rr) +
        ' A' + rr + ' ' + rr + ' 0 0 0 ' + f(lx - rr) + ' ' + f(ly) + ' A' + rr + ' ' + rr + ' 0 0 0 ' + f(lx) + ' ' + f(ly + rr);
      d += ' C' + f(lx + rr * 1.8) + ' ' + f(ly + rr) + ' ' + f(ex - (ex - lx) * 0.35) + ' ' + f(ey + h * 0.2) + ' ' + f(ex) + ' ' + f(ey);
    } else {
      d += ' C' + f(w * 0.3) + ' ' + f(sy + h * 0.08) + ' ' + f(ex - w * 0.4) + ' ' + f(ey + h * 0.25) + ' ' + f(ex) + ' ' + f(ey);
    }
    return { w, h, d };
  },
  parts() { const s = this.sec; return { svg: $('.plane-trail', s), p: $('.pt-path', s), m: $('.pt-rev', s), pl: $('.plane', s) }; },
  place(pl, x, y, deg) { pl.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + deg.toFixed(1) + 'deg)'; },
  fly() {
    if (!this.sec || this.state === 'flying') return;
    if (this.seen() < 0.2) { this.state = 'idle'; return; }
    const g = this.geom(), { svg, p, m, pl } = this.parts();
    svg.setAttribute('viewBox', '0 0 ' + g.w.toFixed(0) + ' ' + g.h.toFixed(0));
    p.setAttribute('d', g.d); m.setAttribute('d', g.d);
    const len = p.getTotalLength();
    m.style.strokeDasharray = len + ' ' + len; m.style.strokeDashoffset = len;
    svg.classList.remove('fade'); pl.classList.remove('landed'); pl.classList.add('on');
    this.state = 'flying';
    const t0 = performance.now(), dur = 2400 + Math.min(1600, len * 0.9);
    const step = now => {
      if (!this.sec) return;
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const at = len * e, a = p.getPointAtLength(at), b = at + 2 <= len ? p.getPointAtLength(at + 2) : null, c = b ? a : p.getPointAtLength(Math.max(0, at - 2));
      const ang = b ? Math.atan2(b.y - a.y, b.x - a.x) : Math.atan2(a.y - c.y, a.x - c.x);
      this.place(pl, a.x, a.y, ang * 180 / Math.PI);
      m.style.strokeDashoffset = (len - at).toFixed(1);
      if (k < 1) { this.raf = requestAnimationFrame(step); return; }
      this.end = { x: a.x, y: a.y, deg: ang * 180 / Math.PI };
      this.state = 'landed'; this.last = performance.now();
      pl.classList.add('landed'); svg.classList.add('fade');
    };
    this.raf = requestAnimationFrame(step);
  },
  /* After a resize, set the parked plane down at its new landing spot. */
  park() {
    if (!this.sec) return;
    const g = this.geom(), { p, pl } = this.parts();
    p.setAttribute('d', g.d);
    const len = p.getTotalLength(), a = p.getPointAtLength(len), c = p.getPointAtLength(Math.max(0, len - 2));
    this.place(pl, a.x, a.y, Math.atan2(a.y - c.y, a.x - c.x) * 180 / Math.PI);
  }
};

/* ---------- Pointer routing for everything on the home page ---------- */
function homePointer(e) {
  if (route.name !== 'home' || reduced()) return;
  if (e.pointerType === 'touch') { Needles.point(e.clientX, e.clientY); return; }
  if (e.pointerType !== 'mouse') return;
  Needles.point(e.clientX, e.clientY);
  Orbits.point(e);
  dockMove(e);
}
function homePointerOut(e) {
  const dock = e.target.closest && e.target.closest('.dock-wrap');
  if (dock && !(e.relatedTarget && dock.contains(e.relatedTarget))) { $$('.dock-i', dock).forEach(it => it.style.setProperty('--s', '1')); dockFocus = -1; }
}
document.addEventListener('pointermove', homePointer, { passive: true });
document.addEventListener('pointerout', homePointerOut, { passive: true });
/* Tap the empty hero background: a shockwave ripples through the needles. */
document.addEventListener('pointerdown', e => {
  if (route.name !== 'home' || reduced() || !e.target.closest) return;
  if (!e.target.closest('.hero') || e.target.closest('a,button,input,select,label,.comp,.hsearch,.ex-switch,.status')) return;
  Needles.ripple(e.clientX, e.clientY);
  Sound.play('ripple');
}, { passive: true });

function mountHome(main) {
  Needles.mount($('#needles', main));
  Story.mount($('#story', main));
  Orbits.mount($('#orbits', main));
  Plane.mount(main);
  setupCounts(main);
}
function unmountHome() { Needles.unmount(); Story.unmount(); Orbits.unmount(); Plane.unmount(); ScrollFX.unmount(); }
