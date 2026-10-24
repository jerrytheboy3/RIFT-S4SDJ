
/* ==================================================================
   LANGUAGES
   The app renders in English, then this layer swaps every piece of
   text on screen for Hindi or Kannada: whole strings from a dictionary,
   strings with numbers or dates from patterns, and dates and times
   word by word. A MutationObserver keeps text that changes later
   (toasts, tool results, dialogs) in the chosen language too.
   ================================================================== */
const LANGS = ['en', 'hi', 'kn'];
const LANG_NAMES = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };
const LANG_SHORT = { en: 'EN', hi: 'हि', kn: 'ಕ' };
/* Filled by the Hindi and Kannada dictionary parts: exact strings and {0}-style patterns. */
const I18N = { hi: { exact: {}, patterns: [] }, kn: { exact: {}, patterns: [] } };
const I18N_TOKENS = {
  hi: {
    Sun: 'रवि', Mon: 'सोम', Tue: 'मंगल', Wed: 'बुध', Thu: 'गुरु', Fri: 'शुक्र', Sat: 'शनि',
    Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार',
    Jan: 'जन॰', Feb: 'फ़र॰', Mar: 'मार्च', Apr: 'अप्रैल', May: 'मई', Jun: 'जून', Jul: 'जुल॰', Aug: 'अग॰', Sep: 'सित॰', Oct: 'अक्टू॰', Nov: 'नव॰', Dec: 'दिस॰',
    January: 'जनवरी', February: 'फ़रवरी', March: 'मार्च', April: 'अप्रैल', June: 'जून', July: 'जुलाई', August: 'अगस्त', September: 'सितंबर', October: 'अक्टूबर', November: 'नवंबर', December: 'दिसंबर',
    AM: 'पूर्वाह्न', PM: 'अपराह्न', Today: 'आज', Tomorrow: 'कल', TODAY: 'आज', TOMORROW: 'कल'
  },
  kn: {
    Sun: 'ಭಾನು', Mon: 'ಸೋಮ', Tue: 'ಮಂಗಳ', Wed: 'ಬುಧ', Thu: 'ಗುರು', Fri: 'ಶುಕ್ರ', Sat: 'ಶನಿ',
    Sunday: 'ಭಾನುವಾರ', Monday: 'ಸೋಮವಾರ', Tuesday: 'ಮಂಗಳವಾರ', Wednesday: 'ಬುಧವಾರ', Thursday: 'ಗುರುವಾರ', Friday: 'ಶುಕ್ರವಾರ', Saturday: 'ಶನಿವಾರ',
    Jan: 'ಜನ', Feb: 'ಫೆಬ್ರ', Mar: 'ಮಾರ್ಚ್', Apr: 'ಏಪ್ರಿ', May: 'ಮೇ', Jun: 'ಜೂನ್', Jul: 'ಜುಲೈ', Aug: 'ಆಗ', Sep: 'ಸೆಪ್ಟೆಂ', Oct: 'ಅಕ್ಟೋ', Nov: 'ನವೆಂ', Dec: 'ಡಿಸೆಂ',
    January: 'ಜನವರಿ', February: 'ಫೆಬ್ರವರಿ', March: 'ಮಾರ್ಚ್', April: 'ಏಪ್ರಿಲ್', June: 'ಜೂನ್', July: 'ಜುಲೈ', August: 'ಆಗಸ್ಟ್', September: 'ಸೆಪ್ಟೆಂಬರ್', October: 'ಅಕ್ಟೋಬರ್', November: 'ನವೆಂಬರ್', December: 'ಡಿಸೆಂಬರ್',
    AM: 'ಪೂರ್ವಾಹ್ನ', PM: 'ಅಪರಾಹ್ನ', Today: 'ಇಂದು', Tomorrow: 'ನಾಳೆ', TODAY: 'ಇಂದು', TOMORROW: 'ನಾಳೆ'
  }
};
const I18N_ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
const I18n = {
  lang: 'en', cache: new Map(), compiled: {}, misses: new Set(), observer: null, busy: false,
  orig: new WeakMap(), out: new WeakMap(), attrOrig: new WeakMap(),
  setLang(l) {
    this.lang = LANGS.includes(l) ? l : 'en';
    this.cache.clear();
    document.documentElement.lang = this.lang === 'en' ? 'en-IN' : this.lang;
    document.documentElement.dataset.lang = this.lang;
    if (this.lang === 'en') { if (this.observer) this.observer.disconnect(); }
    else this.watch();
  },
  /* Patterns compile once per language: "{0} of {1} packed" -> /^(.+?) of (.+?) packed$/ */
  patterns() {
    const l = this.lang;
    if (this.compiled[l]) return this.compiled[l];
    const list = (I18N[l] ? I18N[l].patterns : []).map(([en, to, loose]) => {
      const parts = en.split(/\{\d\}/);
      const re = new RegExp('^' + en.replace(/[.*+?^${}()|[\]\\]/g, m => m === '{' || m === '}' ? m : '\\' + m).replace(/\{(\d)\}/g, '(.+?)') + '$');
      const order = (en.match(/\{\d\}/g) || []).map(x => +x[1]);
      return { re, to, order, loose: !!loose, pre: parts[0], post: parts[parts.length - 1] };
    });
    return (this.compiled[l] = list);
  },
  /* Dates and times: "Thu 22 Oct", "3:30 PM", "TODAY". Only when every word is a known token. */
  tokens(s) {
    const T = I18N_TOKENS[this.lang];
    if (!T || !/^[A-Za-z\d\s:,.\-–]+$/.test(s)) return null;
    const words = s.match(/[A-Za-z]+/g);
    const tok = w => T[w] || T[w.charAt(0) + w.slice(1).toLowerCase()];
    if (!words || !words.every(tok)) return null;
    return s.replace(/[A-Za-z]+/g, tok);
  },
  frag(s, depth) {
    const d = I18N[this.lang];
    if (d.exact[s] !== undefined) return d.exact[s];
    const tk = this.tokens(s);
    if (tk !== null) return tk;
    if (depth < 2) { const p = this.pattern(s, depth + 1); if (p !== null) return p; }
    return s;
  },
  pattern(s, depth) {
    for (const p of this.patterns()) {
      if (!s.startsWith(p.pre) || !s.endsWith(p.post)) continue;
      const m = s.match(p.re);
      if (!m) continue;
      const raw = m.slice(1), caps = raw.map(c => this.frag(c, depth || 0));
      /* A strict pattern only counts when every filled-in part was translated too. */
      if (!p.loose && raw.some((c, i) => caps[i] === c && /[A-Za-z]{2,}/.test(c) && !this.keep(c))) continue;
      const vals = {}; p.order.forEach((k, i) => { vals[k] = caps[i]; });
      return p.to.replace(/\{(\d)\}/g, (_, k) => vals[k] !== undefined ? vals[k] : '');
    }
    return null;
  },
  /* Translate one string. English text passes through; misses are kept for the test crawl. */
  tr(s) {
    if (this.lang === 'en' || s == null) return s;
    s = String(s);
    if (this.cache.has(s)) return this.cache.get(s);
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2].replace(/\s+/g, ' ');
    let out = s;
    if (core && !this.keep(core) && /[A-Za-z]/.test(core)) {
      const d = I18N[this.lang];
      let t = d.exact[core];
      if (t === undefined) t = this.tokens(core);
      if (t === null || t === undefined) t = this.pattern(core, 0);
      if (t === null || t === undefined) { this.misses.add(core); t = core; }
      out = m[1] + t + m[3];
    }
    this.cache.set(s, out);
    return out;
  },
  /* Web addresses, file names, codes like AAD-1234 and brand names stay as they are. */
  keep(s) {
    return /^(?:[\w-]+\.)+(?:gov\.in|co\.in|in|com|org)(?:\/\S*)?$/i.test(s) || /^[A-Z]{2,5}-\d{3,5}$/.test(s) || /\.(png|jpe?g|pdf|heic|webp)$/i.test(s) ||
      /^(Bring Go Pay|PDF|OTP|EN|UIDAI|SHCIL|Protean|UTIITSL|ECINET|PM-USP CSIS|IFSC|EBLR|LMV|NRI|KYC|e-KYC|AIS|AY 2026-27|FY 2025-26|BLO|EPIC|RTO|DL|LL|ITR|PSK)$/.test(s);
  },
  skip(el) { return !el || !!el.closest('[translate="no"],script,style,textarea,kbd,code,noscript'); },
  node(n) {
    const cur = n.data, last = this.out.get(n);
    const src = last !== undefined && cur === last ? this.orig.get(n) : cur;
    if (this.lang === 'en') { if (src !== cur) n.data = src; this.out.delete(n); this.orig.delete(n); return; }
    if (this.skip(n.parentElement)) return;
    const t = this.tr(src);
    this.orig.set(n, src); this.out.set(n, t);
    if (t !== cur) n.data = t;
  },
  attr(el, name) {
    if (!el.hasAttribute(name)) return;
    let o = this.attrOrig.get(el);
    const cur = el.getAttribute(name);
    const rec = o && o[name];
    const src = rec && cur === rec.out ? rec.src : cur;
    if (this.lang === 'en') { if (src !== cur) el.setAttribute(name, src); if (o) delete o[name]; return; }
    if (this.skip(el) && name !== 'aria-label') return;
    const t = this.tr(src);
    if (!o) { o = {}; this.attrOrig.set(el, o); }
    o[name] = { src, out: t };
    if (t !== cur) el.setAttribute(name, t);
  },
  /* Walk a subtree: text nodes and the readable attributes. */
  apply(root) {
    if (!root) return;
    if (root.nodeType === 3) { this.node(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (this.lang === 'en' && !this.dirty) return;
    this.busy = true;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) this.node(n);
    const els = root.nodeType === 1 ? [root].concat([...root.querySelectorAll('[aria-label],[placeholder],[title],[alt]')]) : [...root.querySelectorAll('[aria-label],[placeholder],[title],[alt]')];
    for (const el of els) for (const a of I18N_ATTRS) if (el.hasAttribute && el.hasAttribute(a)) this.attr(el, a);
    this.busy = false;
    if (this.lang !== 'en') this.dirty = true;
  },
  watch() {
    if (this.observer || typeof MutationObserver === 'undefined') { if (this.observer) this.observer.observe(document.body, this.opts); return; }
    this.opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS };
    this.observer = new MutationObserver(recs => {
      if (this.lang === 'en') return;
      for (const r of recs) {
        if (r.type === 'childList') r.addedNodes.forEach(n => this.apply(n));
        else if (r.type === 'characterData') this.node(r.target);
        else if (r.type === 'attributes') this.attr(r.target, r.attributeName);
      }
    });
    this.observer.observe(document.body, this.opts);
  },
  /* Multi-line plain text, for copied checklists and shared trips */
  text(s) { return this.lang === 'en' ? s : String(s).split('\n').map(line => this.tr(line)).join('\n'); }
};
function tr(s) { return I18n.tr(s); }
