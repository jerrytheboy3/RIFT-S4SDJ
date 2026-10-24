
/* ==================================================================
   PAGE FX
   Every page gets the home page's feel: shapes in the page header that
   scatter from the cursor and drift as you scroll, cards and slips that
   tilt toward the pointer, a rush chart that swells under it, a route
   line that draws itself through the steps, and a burst of shapes on
   every tick. Nothing here navigates on its own.
   ================================================================== */
const FL_COLORS = { b: '#0071E3', o: '#FF8A3D', g: '#20C48C', v: '#7C5CF6', p: '#FF4880', i: 'var(--ink-3)' };
const FL_SETS = {
  guides: 'bogbovp', docs: 'bvpbogv', best: 'ooobpov', office: 'oobopv', fair: 'gggbgov', tickets: 'pppvpbo', about: 'bogvpbo', none: 'bogpvo'
};
const FL_SHAPES = ['ring', 'disc', 'sq', 'tri', 'plus', 'dot', 'sq', 'ring', 'tri', 'dot', 'plus', 'disc', 'dot', 'sq'];
const FL_SIZES = [76, 54, 42, 40, 26, 14, 24, 34, 28, 11, 18, 30, 9, 16];
function floatersHTML(kind) { return '<div class="floaters" data-kind="' + kind + '" aria-hidden="true"></div>'; }
/* Small seeded random, so each page keeps the same arrangement. */
/* Where the words of an element actually sit, so shapes can stay clear of them. */
function textBounds(els) {
  let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
  for (const el of els) {
    const rg = document.createRange(); rg.selectNodeContents(el);
    for (const q of rg.getClientRects()) { if (q.width < 1) continue; l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); }
  }
  return l > r ? null : { l, r, t, b };
}
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const Floaters = {
  el: null, items: [], raf: 0, visible: true, io: null, px: -1e4, py: -1e4, sy: 0, t0: 0, lt: 0, w: 0, h: 0,
  mount(layer) {
    this.unmount();
    if (!layer) return;
    this.el = layer; this.t0 = performance.now(); this.lt = 0; this.sy = window.scrollY; this.visible = true;
    this.build();
    if (reduced()) { this.items.forEach(it => { it.sc = 1; it.x = it.hx; it.y = it.hy; }); this.draw(); return; }
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.wake(); });
      this.io.observe(layer);
    }
    this.wake();
  },
  unmount() { cancelAnimationFrame(this.raf); this.raf = 0; if (this.io) this.io.disconnect(); this.io = null; this.el = null; this.items = []; },
  /* Lay the shapes out in the empty side of the header, never on top of each other. */
  build() {
    const el = this.el, phone = isPhone(), kind = el.dataset.kind || 'none';
    document.documentElement.style.setProperty('--sbw', Math.max(0, window.innerWidth - document.documentElement.clientWidth) + 'px');
    this.w = el.clientWidth; this.h = el.clientHeight;
    const rnd = seeded(kind + (phone ? 'p' : 'd')), pal = FL_SETS[kind] || FL_SETS.none, k = phone ? 0.6 : 1;
    /* Shapes live beside the header's words: to the right of them, and on both sides for centred pages. */
    const lr = el.getBoundingClientRect(), page = el.parentElement;
    const head = $('.phead', page) || $('.ghead', page) || $('.empty', page);
    let zones = [[0.62 * this.w, 0.97 * this.w]], yz = [0.1 * this.h, 0.8 * this.h];
    if (head) {
      const parts = phone ? $$('.kn, h1', head) : [head];
      const tb = textBounds(parts.length ? parts : [head]);
      if (tb) {
        const L = tb.l - lr.left, Rt = tb.r - lr.left, minW = phone ? 96 : 150;
        zones = [[Math.min(Rt + (phone ? 18 : 44), this.w * 0.97 - minW), this.w * 0.97]];
        if ((kind === 'about' || kind === 'none') && L - 44 > minW) zones.unshift([this.w * 0.03, L - 44]);
        yz = [Math.max(8, tb.t - lr.top - (phone ? 12 : 24)), tb.b - lr.top + (phone ? -10 : 30)];
      }
    }
    const area = zones.reduce((a, z) => a + (z[1] - z[0]), 0) * (yz[1] - yz[0]);
    const n = Math.max(phone ? 4 : 5, Math.min(phone ? 7 : FL_SHAPES.length, Math.round(area / (phone ? 4200 : 8000))));
    const placed = [];
    let html = '';
    for (let i = 0; i < n; i++) {
      const s = Math.round(FL_SIZES[i] * k), shape = FL_SHAPES[i], col = pal[i % pal.length];
      let best = null;
      for (let tries = 0; tries < 40; tries++) {
        const z = zones[i % zones.length];
        const x = z[0] + s / 2 + rnd() * Math.max(0, z[1] - z[0] - s), y = yz[0] + s / 2 + rnd() * Math.max(0, yz[1] - yz[0] - s);
        const gap = placed.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.y - y) - (p.s + s) / 2), 1e9);
        if (!best || gap > best.gap) best = { x, y, gap };
        if (gap > 18) break;
      }
      placed.push({ x: best.x, y: best.y, s });
      html += '<i class="fl fl-' + shape + '" style="--s:' + s + 'px;--c:' + FL_COLORS[col] + '"></i>';
    }
    el.innerHTML = html;
    this.items = $$('.fl', el).map((node, i) => {
      const p = placed[i];
      return { node, s: p.s, hx: p.x, hy: p.y, x: p.x + (rnd() - 0.5) * 160, y: p.y + 140 + rnd() * 80, vx: 0, vy: 0,
        a: rnd() * 360, va: (rnd() - 0.5) * 60, spin: (rnd() - 0.5) * 16, ph: rnd() * TAU, z: 0.06 + p.s / 76 * 0.32, sc: 0, delay: 0.05 + i * 0.045, dir: i % 2 ? 1 : -1 };
    });
  },
  resize() { if (this.el) { this.build(); if (reduced()) { this.items.forEach(it => { it.sc = 1; it.x = it.hx; it.y = it.hy; }); this.draw(); } } },
  point(cx, cy) { if (!this.el) return; this.px = cx; this.py = cy; this.wake(); },
  /* A tap on the empty header pushes every nearby shape outward. */
  kickAt(cx, cy) {
    if (!this.el || reduced()) return;
    const r = this.el.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
    for (const it of this.items) {
      const dx = it.x - x, dy = it.y - y, d = Math.hypot(dx, dy) || 1, f = Math.max(0, 1 - d / 420);
      it.vx += dx / d * f * 1100; it.vy += dy / d * f * 1100; it.va += (dx > 0 ? 1 : -1) * f * 520;
    }
    this.wake();
  },
  wake() {
    if (this.raf || !this.el || reduced()) return;
    const loop = t => { this.raf = 0; if (!this.el || !this.visible || document.hidden) return; this.frame(t); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  frame(t) {
    const dt = this.lt ? Math.min(0.033, (t - this.lt) / 1000) : 0.016; this.lt = t;
    const s = (t - this.t0) / 1000;
    this.sy += (window.scrollY - this.sy) * 0.12;
    const r = this.el.getBoundingClientRect(), px = this.px - r.left, py = this.py - r.top, R = 170;
    const sv = typeof ScrollFX !== 'undefined' ? ScrollFX.v : 0;
    for (const it of this.items) {
      const tx = it.hx + Math.sin(s * 0.55 + it.ph) * 9, ty = it.hy + Math.cos(s * 0.45 + it.ph * 1.3) * 9 - (this.sy) * it.z;
      let ax = (tx - it.x) * 55 - it.vx * 8.5, ay = (ty - it.y) * 55 - it.vy * 8.5;
      const dx = it.x - px, dy = it.y - py, d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1, f = 1 - d / R;
        ax += dx / d * f * f * 16000; ay += dy / d * f * f * 16000;
        it.va += (dx > 0 ? 1 : -1) * f * 900 * dt;
      }
      it.vx += ax * dt; it.vy += ay * dt; it.x += it.vx * dt; it.y += it.vy * dt;
      it.va += sv * 1.6 * it.dir * dt * 60;
      it.va *= Math.pow(0.12, dt); it.a += (it.va + it.spin) * dt;
      if (s > it.delay) it.sc += (1 - it.sc) * Math.min(1, 7 * dt);
    }
    this.draw();
  },
  draw() {
    for (const it of this.items) {
      it.node.style.transform = 'translate3d(' + (it.x - it.s / 2).toFixed(1) + 'px,' + (it.y - it.s / 2).toFixed(1) + 'px,0) rotate(' + it.a.toFixed(1) + 'deg) scale(' + it.sc.toFixed(3) + ')';
    }
  }
};

/* ---------- Rush chart: cells swell under the pointer, with a readout ---------- */
const Heat = {
  el: null, cells: null, raf: 0, ev: null,
  enter(heat) {
    this.el = heat;
    const kids = [...heat.children].filter(c => !c.classList.contains('heat-tip'));
    const cols = (heat.style.gridTemplateColumns.match(/repeat\((\d+)/) || [])[1] | 0;
    const per = cols + 1;
    this.cells = kids.map((c, i) => ({ c, row: Math.floor(i / per), col: i % per })).filter(x => x.c.classList.contains('heat-c'))
      .map(x => { const r = x.c.getBoundingClientRect(); return Object.assign(x, { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width }); });
    this.heads = kids.filter((c, i) => i < per);
    this.days = kids.filter((c, i) => i % per === 0 && i >= per);
    this.oy = window.scrollY;
    if (!this.tip) { this.tip = document.createElement('span'); this.tip.className = 'heat-tip'; this.tip.setAttribute('aria-hidden', 'true'); }
    heat.appendChild(this.tip);
  },
  move(heat, e) {
    if (this.el !== heat || Math.abs(window.scrollY - this.oy) > 1) this.enter(heat);
    this.ev = { x: e.clientX, y: e.clientY };
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  },
  draw() {
    if (!this.el || !this.ev) return;
    const { x, y } = this.ev;
    let near = null, nd = 1e9;
    for (const k of this.cells) {
      const d = Math.hypot((k.cx - x) * 0.9, (k.cy - y) * 1.15);
      const z = 1 + 0.55 * Math.pow(Math.max(0, 1 - d / 78), 2);
      k.c.style.setProperty('--z', z.toFixed(3));
      k.c.classList.toggle('big', z > 1.04);
      if (d < nd) { nd = d; near = k; }
    }
    this.heads.forEach((h, i) => h.classList.toggle('hl', !!near && i === near.col));
    this.days.forEach((h, i) => h.classList.toggle('hl', !!near && i === near.row - 1));
    if (near && nd < 40) {
      const hr = this.el.getBoundingClientRect(), cr = near.c.getBoundingClientRect();
      this.tip.textContent = near.c.getAttribute('aria-label');
      this.tip.style.transform = 'translate3d(' + (cr.left - hr.left + cr.width / 2).toFixed(1) + 'px,' + (cr.top - hr.top - 10).toFixed(1) + 'px,0) translate(-50%,-100%)';
      this.tip.classList.add('on');
    } else this.tip.classList.remove('on');
  },
  leave() {
    if (!this.el) return;
    this.cells.forEach(k => { k.c.style.setProperty('--z', '1'); k.c.classList.remove('big'); });
    this.heads.concat(this.days).forEach(h => h.classList.remove('hl'));
    if (this.tip) this.tip.classList.remove('on');
    this.el = null;
  }
};

/* ---------- A burst of little shapes from a point (ticks, saved items) ---------- */
function burst(x, y, n) {
  if (reduced()) return;
  const cols = ['#0071E3', '#FF8A3D', '#20C48C', '#7C5CF6', '#FF4880'], off = Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'bst bst-' + (i % 3);
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.background = cols[(i + off) % cols.length];
    document.body.appendChild(s);
    const a = i / n * TAU + Math.random() * 0.6, d = 30 + Math.random() * 30, rot = (Math.random() - 0.5) * 540;
    const an = s.animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
      { transform: 'translate(calc(-50% + ' + (Math.cos(a) * d * 0.8).toFixed(1) + 'px),calc(-50% + ' + (Math.sin(a) * d * 0.8).toFixed(1) + 'px)) scale(1.15) rotate(' + (rot * 0.6).toFixed(0) + 'deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(calc(-50% + ' + (Math.cos(a) * d).toFixed(1) + 'px),calc(-50% + ' + (Math.sin(a) * d + 10).toFixed(1) + 'px)) scale(.6) rotate(' + rot.toFixed(0) + 'deg)', opacity: 0 }
    ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)' });
    an.onfinish = () => s.remove();
  }
}
function burstFrom(el, n) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, n || 9);
}

/* ---------- Fair price: the band you are typing into lights up ---------- */
function liveBand() {
  if (route.name !== 'fair-price' || !memo.fair) return;
  const task = TASKS[memo.fair.task], cs = task && caseOf(task, memo.fair.case);
  if (!cs || !cs.band) return;
  const amt = parseInt((memo.q.fq || {}).amount, 10);
  const k = isNaN(amt) ? null : verdictOf(amt, bandFor(task, cs)).k;
  $$('.bands li[data-k]').forEach(li => li.classList.toggle('hot', li.dataset.k === k));
}

/* ---------- Pointer routing for every page ---------- */
let tiltEl = null;
function untilt(el) { if (el) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('tilting'); } }
function fxPointer(e) {
  if (reduced()) return;
  if (route.name !== 'home') Floaters.point(e.clientX, e.clientY);
  if (e.pointerType !== 'mouse') return;
  const t = e.target.closest ? e.target : null;
  if (!t) return;
  const el = t.closest('.brow, .ocard, [data-tilt]');
  if (el !== tiltEl) { untilt(tiltEl); tiltEl = el; }
  if (el) {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, k = +(el.dataset.tilt || 1);
    el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    el.style.setProperty('--rx', ((0.5 - y) * 5 * k).toFixed(2) + 'deg'); el.style.setProperty('--ry', ((x - 0.5) * 6 * k).toFixed(2) + 'deg');
    el.classList.add('tilting');
  }
  const mag = t.closest('.magnetic');
  if (mag) {
    const r = mag.getBoundingClientRect();
    mag.style.translate = ((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1) + 'px ' + ((e.clientY - (r.top + r.height / 2)) * 0.32).toFixed(1) + 'px';
  }
  const heat = t.closest('.heat');
  if (heat) Heat.move(heat, e); else if (Heat.el) Heat.leave();
}
function fxPointerOut(e) {
  const rel = e.relatedTarget;
  if (tiltEl && !(rel && tiltEl.contains(rel))) { untilt(tiltEl); tiltEl = null; }
  const mag = e.target.closest && e.target.closest('.magnetic');
  if (mag && !(rel && mag.contains(rel))) mag.style.translate = '';
  if (Heat.el && !(rel && Heat.el.contains(rel))) Heat.leave();
}
document.addEventListener('pointermove', fxPointer, { passive: true });
document.addEventListener('pointerout', fxPointerOut, { passive: true });
/* Tap the empty part of a page header: the shapes scatter. */
document.addEventListener('pointerdown', e => {
  if (!Floaters.el || reduced() || route.name === 'home') return;
  if (e.target.closest && e.target.closest('a, button, input, select, label, summary, [data-act], .card')) return;
  const r = Floaters.el.getBoundingClientRect();
  if (e.clientY < r.top || e.clientY > r.bottom) return;
  Floaters.kickAt(e.clientX, e.clientY);
  Sound.play('ripple');
}, { passive: true });

/* ---------- Mount per page ---------- */
const PageFX = {
  freshTimer: 0,
  mount(main, r, opt) {
    Floaters.mount($('.floaters', main));
    /* Entrance choreography only on a real navigation, never on an in-place refresh. */
    clearTimeout(this.freshTimer);
    main.classList.remove('fresh');
    if (opt.nav && !reduced()) {
      $$('.checklist .ck', main).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 14)));
      $$('.fees .fee, .steps-ol li, .q3 > div, .feetable tr', main).forEach(el => el.style.setProperty('--i', [...el.parentElement.children].indexOf(el)));
      void main.offsetWidth;
      main.classList.add('fresh');
      this.freshTimer = setTimeout(() => main.classList.remove('fresh'), 2200);
    }
    if (r.name === 'fair-price') liveBand();
  },
  unmount() { Floaters.unmount(); if (Heat.el) Heat.leave(); tiltEl = null; }
};
window.addEventListener('resize', () => { clearTimeout(PageFX._r); PageFX._r = setTimeout(() => Floaters.resize(), 140); });
