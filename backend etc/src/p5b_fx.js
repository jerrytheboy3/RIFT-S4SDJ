
/* ==================================================================
   SOUND
   A tiny synthesiser on the Web Audio API: no audio files. Sounds only
   ever play in answer to something the user did, and Settings (or the
   speaker button) turns them off.
   ================================================================== */
ICONS.sound = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>';
ICONS.mute = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>';
ICONS.spark = '<path d="M12 3.5l1.9 5.2 5.6.3-4.4 3.5 1.5 5.4L12 14.8 7.4 17.9l1.5-5.4L4.5 9l5.6-.3z"/>';

const Sound = {
  ctx: null, master: null, noiseBuf: null,
  on() { return S.settings.sound !== 'off'; },
  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.34;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
    return this.ctx;
  },
  /* Called from a click or key handler, so browsers allow audio to start. */
  unlock() { if (!this.on()) return; const c = this.ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
  play(name, opt) {
    if (!this.on()) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      const ua = navigator.userActivation;
      if (ua && !ua.hasBeenActive) return;          // never queue sounds before the first interaction
      ctx.resume().catch(() => {});
    }
    try { const fn = SFX[name]; if (fn) fn(ctx, this.master, ctx.currentTime + 0.01, opt || {}); } catch (e) { /* never break the UI for a sound */ }
  }
};
function sfxTone(ctx, out, t, o) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  const at = t + (o.delay || 0), dur = o.dur || 0.15;
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.freq, at);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(o.gain || 0.3, at + (o.attack || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g);
  let node = g;
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); node = f; }
  node.connect(out);
  osc.start(at); osc.stop(at + dur + 0.05);
}
function sfxNoise(ctx, out, t, o) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  const at = t + (o.delay || 0), dur = o.dur || 0.1;
  src.buffer = Sound.noiseBuf;
  f.type = o.ftype || 'bandpass'; f.frequency.setValueAtTime(o.freq || 2000, at); f.Q.value = o.q || 1;
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(o.gain || 0.2, at + (o.attack || 0.004));
  if (o.hold) g.gain.setValueAtTime(o.gain || 0.2, at + o.hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f); f.connect(g);
  if (o.am) {
    const lfo = ctx.createOscillator(), depth = ctx.createGain(), amp = ctx.createGain();
    lfo.type = 'square'; lfo.frequency.value = o.am; depth.gain.value = 0.5; amp.gain.value = 0.5;
    lfo.connect(depth); depth.connect(amp.gain); g.connect(amp); amp.connect(out);
    lfo.start(at); lfo.stop(at + dur + 0.05);
  } else g.connect(out);
  src.start(at, Math.random()); src.stop(at + dur + 0.05);
}
const SFX = {
  tick: (c, o, t) => { sfxNoise(c, o, t, { freq: 4200, q: 2, dur: 0.035, gain: 0.22 }); sfxTone(c, o, t, { freq: 1900, to: 1250, type: 'triangle', dur: 0.07, gain: 0.12 }); },
  untick: (c, o, t) => { sfxTone(c, o, t, { freq: 900, to: 620, type: 'triangle', dur: 0.07, gain: 0.08 }); },
  tap: (c, o, t) => { sfxTone(c, o, t, { freq: 760, to: 640, dur: 0.05, gain: 0.07 }); sfxNoise(c, o, t, { freq: 3000, q: 1.5, dur: 0.02, gain: 0.06 }); },
  pop: (c, o, t) => { sfxTone(c, o, t, { freq: 540, to: 900, dur: 0.1, gain: 0.12 }); },
  open: (c, o, t) => { sfxTone(c, o, t, { freq: 420, to: 700, dur: 0.16, gain: 0.07 }); sfxNoise(c, o, t, { ftype: 'bandpass', freq: 600, sweep: 2600, q: 0.8, dur: 0.2, gain: 0.04 }); },
  close: (c, o, t) => { sfxTone(c, o, t, { freq: 700, to: 420, dur: 0.14, gain: 0.06 }); sfxNoise(c, o, t, { ftype: 'bandpass', freq: 2400, sweep: 600, q: 0.8, dur: 0.16, gain: 0.03 }); },
  pack: (c, o, t) => {
    [[1046.5, 0], [1318.5, 0.08], [1568, 0.16], [2093, 0.26]].forEach(([f, d], i) => sfxTone(c, o, t, { freq: f, delay: d, dur: 0.55 - i * 0.05, gain: 0.13, type: i % 2 ? 'triangle' : 'sine' }));
    sfxTone(c, o, t, { freq: 3136, delay: 0.3, dur: 0.6, gain: 0.03 });
  },
  ok: (c, o, t) => { sfxTone(c, o, t, { freq: 880, dur: 0.22, gain: 0.13 }); sfxTone(c, o, t, { freq: 1318.5, delay: 0.09, dur: 0.32, gain: 0.13 }); },
  warn: (c, o, t) => { sfxTone(c, o, t, { freq: 440, to: 392, type: 'triangle', dur: 0.2, gain: 0.12 }); sfxTone(c, o, t, { freq: 349, delay: 0.13, type: 'triangle', dur: 0.28, gain: 0.11 }); },
  over: (c, o, t) => { sfxTone(c, o, t, { freq: 320, to: 180, type: 'sawtooth', lp: 1100, dur: 0.38, gain: 0.12 }); sfxTone(c, o, t, { freq: 240, to: 140, type: 'sawtooth', lp: 800, delay: 0.16, dur: 0.4, gain: 0.1 }); },
  stamp: (c, o, t) => { sfxTone(c, o, t, { freq: 150, to: 55, dur: 0.2, gain: 0.55 }); sfxNoise(c, o, t, { ftype: 'lowpass', freq: 520, dur: 0.09, gain: 0.32 }); sfxNoise(c, o, t, { freq: 2600, q: 3, delay: 0.01, dur: 0.04, gain: 0.08 }); },
  print: (c, o, t, opt) => {
    const dur = opt.dur || 0.9;
    sfxNoise(c, o, t, { freq: 2600, q: 2.4, dur, hold: dur - 0.08, gain: 0.11, am: 34 });
    sfxTone(c, o, t, { freq: 118, type: 'square', lp: 320, dur, gain: 0.045, attack: 0.03 });
    sfxNoise(c, o, t, { freq: 5200, q: 4, delay: dur - 0.02, dur: 0.05, gain: 0.08 });
  },
  blip: (c, o, t) => { [1180, 1560, 1980].forEach((f, i) => sfxTone(c, o, t, { freq: f, type: 'square', lp: 3200, delay: i * 0.045, dur: 0.035, gain: 0.035 })); },
  whoosh: (c, o, t) => { sfxNoise(c, o, t, { ftype: 'bandpass', freq: 400, sweep: 2200, q: 0.7, dur: 0.32, gain: 0.05, attack: 0.08 }); },
  clink: (c, o, t, opt) => {
    const v = opt.v || 0.5, f = 760 + (64 - (opt.r || 40)) * 26;
    sfxTone(c, o, t, { freq: f, to: f * 0.9, dur: 0.08, gain: 0.025 + v * 0.1 });
    sfxTone(c, o, t, { freq: f * 2.37, type: 'triangle', dur: 0.04, gain: 0.012 + v * 0.035 });
  },
  hover: (c, o, t) => { sfxTone(c, o, t, { freq: 1480, to: 1760, dur: 0.035, gain: 0.022 }); },
  glass: (c, o, t) => { sfxTone(c, o, t, { freq: 2350, to: 2520, dur: 0.06, gain: 0.014 }); sfxTone(c, o, t, { freq: 3520, type: 'triangle', delay: 0.012, dur: 0.05, gain: 0.006 }); },
  nav: (c, o, t) => { sfxTone(c, o, t, { freq: 540, to: 820, dur: 0.07, gain: 0.05 }); sfxNoise(c, o, t, { freq: 2600, q: 1.4, dur: 0.025, gain: 0.028 }); },
  theme: (c, o, t, opt) => {
    const up = !opt.dark;
    sfxTone(c, o, t, { freq: up ? 392 : 784, to: up ? 784 : 392, dur: 0.36, gain: 0.05 });
    sfxTone(c, o, t, { freq: up ? 1175 : 587, delay: 0.1, dur: 0.32, gain: 0.022 });
    sfxNoise(c, o, t, { ftype: 'bandpass', freq: up ? 500 : 2600, sweep: up ? 2600 : 500, q: 0.7, dur: 0.44, gain: 0.02, attack: 0.1 });
  },
  ripple: (c, o, t) => { sfxTone(c, o, t, { freq: 180, to: 520, dur: 0.3, gain: 0.06 }); sfxNoise(c, o, t, { ftype: 'bandpass', freq: 300, sweep: 1800, q: 0.9, dur: 0.34, gain: 0.035, attack: 0.05 }); }
};

/* ==================================================================
   HOME FX
   Living light field, word reveal, 3D slip with glare, LED fee board,
   scroll-driven story, card spotlight, magnetic buttons, count-ups.
   ================================================================== */
const Story = {
  el: null, step: -1,
  mount(el) { this.el = el; this.step = -1; if (el) this.update(); },
  unmount() { this.el = null; },
  update() {
    const el = this.el;
    if (!el || !el.isConnected) return;
    if (isPhone()) { if (this.step < 0) this.set(0); return; }
    const r = el.getBoundingClientRect();
    const range = Math.max(1, r.height - window.innerHeight);
    const p = Math.min(1, Math.max(0, -r.top / range));
    el.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    const s = Math.min(2, Math.floor(p * 3 * 0.999));
    if (s !== this.step) this.set(s);
    if (!reduced()) {
      const ph = $('.phone', el);
      if (ph) { ph.style.setProperty('--ry', (-18 + p * 36).toFixed(2) + 'deg'); ph.style.setProperty('--rx', (7 - p * 10).toFixed(2) + 'deg'); }
    }
  },
  set(s) {
    const el = this.el;
    if (!el) return;
    this.step = s;
    el.classList.remove('s0', 's1', 's2'); el.classList.add('s' + s);
    $$('.story-step', el).forEach((b, i) => { b.classList.toggle('on', i === s); b.setAttribute('aria-pressed', String(i === s)); });
    $$('.scr', el).forEach((sc, i) => { sc.classList.toggle('on', i === s); sc.classList.toggle('out', i < s); sc.setAttribute('aria-hidden', String(i !== s)); });
    const scr = $$('.scr', el)[s];
    if (s === 1 && scr) scrambleLED(scr);
  },
  go(s) {
    if (!this.el) return;
    if (isPhone() || reduced()) { this.set(s); return; }
    const top = this.el.getBoundingClientRect().top + window.scrollY;
    const range = this.el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * (s + 0.5) / 3, behavior: 'smooth' });
  }
};

/* Numbers count up once when they scroll into view. */
let countIO = null;
function setupCounts(root) {
  const els = $$('[data-countto]', root);
  if (!els.length) return;
  const run = el => {
    const to = +el.dataset.countto, pre = el.dataset.pre || '';
    if (reduced()) { el.textContent = pre + to.toLocaleString('en-IN'); return; }
    const start = performance.now(), ms = 1400;
    const f = t => { const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 4); el.textContent = pre + Math.round(to * e).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  if (!countIO) countIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { countIO.unobserve(en.target); run(en.target); } }), { threshold: 0.4 });
  els.forEach(el => countIO.observe(el));
}


/* Fees on the LED board: real official figures only. */
/* The words are fixed here; every amount comes from the database. */
function tickerItems(now) {
  const d = itrDaysLeft(now);
  const total = (t, c, sel) => { const cs = TASKS[t] && TASKS[t].cases.find(x => x.id === c); return cs ? feeTotal(cs.fee(sel || {})) : null; };
  const amt = n => n === null || isNaN(n) ? null : n === 0 ? 'free' : inr(n);
  const items = [
    ['Aadhaar address update', amt(total('aadhaar', 'address'))], ['Aadhaar photo or fingerprints', amt(total('aadhaar', 'biometric'))],
    ['Instant e-PAN', amt(total('pan', 'instant'))], ['PAN card by post', amt(total('pan', 'card'))],
    ['Passport 36 pages', amt(total('passport', 'first', { pages: '36', age: 'adult' }))], ['Tatkal', amt(total('passport', 'tatkal', { pages: '36', age: 'adult' }))]
  ];
  const rent = TASKS.rent && feeRange(TASKS.rent.cases[0].fee({}));
  if (rent) items.push(['Rent stamp duty', inr(rent[0]) + '–' + inr(rent[1])]);
  if (ITR_INCOME.length) items.push(['Late tax return fee from', inr(Math.min.apply(null, ITR_INCOME.map(x => x.fee)))]);
  items.push(['Voter ID registration', amt(total('voter', 'new'))]);
  return items.filter(x => x[1]).map(x => x[0] + ' ' + x[1])
    .concat([d >= 0 ? 'Late return deadline 31 Dec, ' + plural(d, 'day') + ' left' : 'Late return deadline has passed']);
}
function tickerHTML(now) {
  const run = '<span class="ticker-run">' + tickerItems(now).map(t => '<span>' + esc(t) + '</span><i></i>').join('') + '</span>';
  return '<section class="ticker" aria-label="Official fees at a glance"><p class="sr-only" translate="no">' + esc(tickerItems(now).map(tr).join('. ')) + '.</p>' +
    '<div class="ticker-track" aria-hidden="true">' + run + run + '</div></section>';
}
/* The phone in the story section shows a mini version of each step. */
function storyHTML(now) {
  const steps = [
    ['bring', 'Exactly what to carry, as a checklist you tick while you pack. It can fill itself from the documents you already have.'],
    ['go', 'The calmest time on the day you pick, with directions and a calendar reminder. Or skip the trip when it can be done online.'],
    ['pay', 'The official fee, and an instant check of any agent’s quote, so you can tell a fair service charge from a markup.']
  ];
  const o = OFFICES['ask-southend'], c = calmestWeek(o, now) || { date: now.date, t: 900 };
  const d0 = c.date;
  const scr0 = '<div class="scr on" aria-hidden="false"><span class="m-kn" lang="kn">' + KN.bring + '</span><h4>Bring</h4><p class="m-big">2 things<br>to carry</p>' +
    '<div class="m-list"><div class="m-row" style="--k:0"><i></i><span>Aadhaar card</span></div><div class="m-row" style="--k:1"><i></i><span>Proof of address</span></div>' +
    '<div class="m-row m-sub" style="--k:2"><i></i><span>Voter ID</span><em>You have it</em></div></div><div class="m-badge">' + icon('check') + 'All packed</div></div>';
  const scr1 = '<div class="scr" aria-hidden="true"><span class="m-kn" lang="kn">' + KN.go + '</span><h4>Go</h4>' +
    '<div class="led led-mini m-led"><span class="led-l1" data-led translate="no">' + esc(tr(ledDate(d0))) + '</span><span class="led-l2" data-led translate="no">' + esc(tr(fmtTime(c.t))) + '</span></div>' +
    '<p class="m-cap"><i></i>South End Circle, usually quiet</p><div class="m-days">' +
    [0, 1, 2, 3].map(i => { const dd = addDays(d0, i); return '<span class="' + (i === 0 ? 'on' : '') + '"><small>' + WD[wdOf(dd)] + '</small>' + parseYmd(dd).d + '</span>'; }).join('') +
    '</div><div class="m-btn">' + icon('calendar') + 'Add to calendar</div></div>';
  const scr2 = '<div class="scr" aria-hidden="true"><span class="m-kn" lang="kn">' + KN.pay + '</span><h4>Pay</h4><p class="m-big">₹75<small>official fee</small></p>' +
    '<div class="m-card"><div class="m-verdict"><b>Fair</b><span>₹120 quoted</span></div><div class="m-scale"><b></b><b></b><b></b><b></b><i class="m-needle"></i></div>' +
    '<p>“The official fee is ₹75. I’m happy to pay up to ₹150.”</p></div><div class="m-keep">Do it yourself, keep ₹45</div></div>';
  return '<section class="story s0" id="story" aria-labelledby="story-h"><div class="story-pin"><svg class="rings" viewBox="-420 -420 840 840" aria-hidden="true"><circle r="130"/><circle r="210" class="dash"/><circle r="290"/><circle r="370" class="dash2"/>' +
    '<g class="rdots"><circle cx="210" cy="0" r="6"/><circle cx="-290" cy="0" r="4.5"/><circle cx="0" cy="370" r="7"/><circle cx="92" cy="-92" r="3.5"/></g></svg>' +
    '<div class="wrap story-grid"><div class="story-copy"><p class="eyebrow-d">How it works</p><h2 class="h2" id="story-h">One guide.<br>Three answers.</h2><ol class="story-steps">' +
    steps.map(([id, txt], i) => {
      const s = SECTIONS.find(x => x.id === id), m = SEC_META[id];
      return '<li><button type="button" class="story-step' + (i === 0 ? ' on' : '') + '" data-act="story" data-step="' + i + '" aria-pressed="' + (i === 0) + '">' + tile(m.icon, m.cls, 'lg') +
        '<span><span class="kn" lang="kn">' + s.kn + '</span><span class="st-t">' + s.en + '</span><span class="st-p">' + txt + '</span></span></button></li>';
    }).join('') + '</ol><div class="story-bar" aria-hidden="true"><i></i></div></div>' +
    '<div class="story-device" aria-hidden="true"><div class="phone"><div class="island"></div><div class="screen"><div class="sbar"><span>9:41</span><span class="sb-ic"><i></i><i></i><b></b></span></div>' +
    scr0 + scr1 + scr2 + '<div class="m-tabs">' + [['grid', 'Guides'], ['clock', 'Best time'], ['rupeec', 'Fair price'], ['ticket', 'My tickets']].map(([ic, l], i) =>
      '<span class="' + (i === 0 ? 'on' : '') + '">' + icon(ic) + l + '</span>').join('') + '</div><i class="m-home"></i>' +
    '</div></div></div></div></div></section>';
}
