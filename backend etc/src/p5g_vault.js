
/* ==================================================================
   DOCUMENT VAULT
   Document numbers, notes and copies (photos or PDFs) kept only in
   this browser, in its own IndexedDB storage. Nothing is uploaded.
   An optional passcode encrypts everything with AES-GCM, using a key
   derived from the passcode with PBKDF2; the key lives only in memory
   while the vault is unlocked.
   ================================================================== */
const VAULT_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar card', icon: 'idcard', cls: 't-aadhaar', num: 'Aadhaar number', hint: '12 digits', re: /^\d{4}\s?\d{4}\s?\d{4}$/, group: true, doc: 'aadhaar' },
  { id: 'pan', label: 'PAN card', icon: 'card', cls: 't-pan', num: 'PAN', hint: '10 characters, like ABCDE1234F', re: /^[A-Z]{5}\d{4}[A-Z]$/i, doc: 'pan' },
  { id: 'passport', label: 'Passport', icon: 'passport', cls: 't-passport', num: 'Passport number', hint: 'A letter and 7 digits', re: /^[A-Z]\d{7}$/i, doc: 'passport' },
  { id: 'voter', label: 'Voter ID', icon: 'vote', cls: 't-voter', num: 'EPIC number', hint: 'Usually 3 letters and 7 digits', re: /^[A-Z]{3}\d{7}$/i, doc: 'voter' },
  { id: 'dl', label: 'Driving licence', icon: 'car', cls: 't-dl', num: 'Licence number', hint: 'As printed on the card', doc: 'dl' },
  { id: 'bank', label: 'Bank account', icon: 'rupeec', cls: 't-pay', num: 'Account number', hint: 'Add the IFSC in the notes', doc: 'bank' },
  { id: 'birth', label: 'Birth certificate', icon: 'doc', cls: 't-bring', num: 'Registration number', hint: 'As printed on the certificate', doc: 'birth' },
  { id: 'class10', label: 'Class 10 certificate', icon: 'cap', cls: 't-eduloan', num: 'Roll or certificate number', hint: 'As printed on the certificate', doc: 'class10' }
];
const VAULT_OTHER = { id: 'other', label: 'Other document', icon: 'doc', cls: 't-office', num: 'Number', hint: 'Optional' };
const VAULT_MAX_FILE = 15 * 1024 * 1024;
function vtype(id) { return VAULT_TYPES.find(t => t.id === id) || VAULT_OTHER; }
function vuid() { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
/* Show only the last four characters until the person chooses to reveal the number. */
function maskNum(n, t) {
  const s = String(n || '').trim();
  if (!s) return '';
  if (t && t.group) { const d = s.replace(/\s+/g, ''); return 'XXXX XXXX ' + d.slice(-4); }
  return s.length <= 4 ? '••••' : '•'.repeat(Math.min(8, s.length - 4)) + s.slice(-4);
}
function showNum(n, t) { const s = String(n || '').trim(); return t && t.group ? s.replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ') : s; }

const Vault = {
  db: null, ok: true, loaded: false, loading: null, raw: { v: 1, lock: null, items: [] }, items: [], key: null, locked: false,
  mem: { meta: null, files: new Map() }, urls: new Map(),
  hasCrypto() { return !!(window.crypto && crypto.subtle && window.isSecureContext !== false); },
  /* ---------- storage: IndexedDB, or memory when the browser refuses ---------- */
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      let req;
      try { req = indexedDB.open('bgp-vault', 1); } catch (e) { rej(e); return; }
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); if (!db.objectStoreNames.contains('files')) db.createObjectStore('files'); };
      req.onsuccess = () => { this.db = req.result; res(this.db); };
      req.onerror = () => rej(req.error);
      req.onblocked = () => rej(new Error('blocked'));
    });
  },
  op(store, mode, fn) {
    if (!this.ok) return Promise.resolve(fn(null));
    return this.open().then(db => new Promise((res, rej) => {
      const t = db.transaction(store, mode), r = fn(t.objectStore(store));
      t.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
  },
  get(store, k) { return this.ok ? this.op(store, 'readonly', s => s.get(k)) : Promise.resolve(store === 'meta' ? this.mem.meta : this.mem.files.get(k)); },
  put(store, k, v) { if (!this.ok) { if (store === 'meta') this.mem.meta = v; else this.mem.files.set(k, v); return Promise.resolve(); } return this.op(store, 'readwrite', s => s.put(v, k)); },
  del(store, k) { if (!this.ok) { this.mem.files.delete(k); return Promise.resolve(); } return this.op(store, 'readwrite', s => s.delete(k)); },
  load() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      let rec = null;
      try { if (typeof indexedDB === 'undefined') throw new Error('no idb'); rec = await this.get('meta', 'state'); } catch (e) { this.ok = false; }
      this.raw = rec && rec.v === 1 ? rec : { v: 1, lock: null, items: [] };
      if (this.raw.lock) { this.locked = !this.key; this.items = []; if (this.key) this.items = await this.decJSON(this.raw.items); }
      else { this.locked = false; this.items = Array.isArray(this.raw.items) ? this.raw.items : []; }
      this.loaded = true;
    })();
    return this.loading;
  },
  async persist() {
    const rec = { v: 1, lock: this.raw.lock || null, items: this.raw.lock ? await this.encJSON(this.items) : this.items };
    this.raw = rec;
    await this.put('meta', 'state', rec);
  },
  /* ---------- crypto ---------- */
  async derive(pass, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },
  async enc(buf, key) { const iv = crypto.getRandomValues(new Uint8Array(12)); return { iv, ct: await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key || this.key, buf) }; },
  dec(o, key) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: o.iv }, key || this.key, o.ct); },
  async encJSON(x) { return this.enc(new TextEncoder().encode(JSON.stringify(x))); },
  async decJSON(o) { return JSON.parse(new TextDecoder().decode(await this.dec(o))); },
  /* ---------- files ---------- */
  async saveFile(id, file) {
    if (this.raw.lock) await this.put('files', id, { enc: await this.enc(await file.arrayBuffer()) });
    else await this.put('files', id, { blob: file });
  },
  async fileBlob(f) {
    const r = await this.get('files', f.id);
    if (!r) return null;
    if (r.blob) return r.blob;
    if (r.enc && this.key) return new Blob([await this.dec(r.enc)], { type: f.type });
    return null;
  },
  async fileURL(f) {
    if (this.urls.has(f.id)) return this.urls.get(f.id);
    const b = await this.fileBlob(f);
    if (!b) return null;
    const u = URL.createObjectURL(b);
    this.urls.set(f.id, u);
    return u;
  },
  revoke(id) { const u = this.urls.get(id); if (u) { URL.revokeObjectURL(u); this.urls.delete(id); } },
  revokeAll() { for (const u of this.urls.values()) URL.revokeObjectURL(u); this.urls.clear(); },
  /* ---------- items ---------- */
  async saveItem(d) {
    let it = this.items.find(x => x.id === d.id);
    if (!it) { it = { id: vuid(), type: d.type, files: [] }; this.items.push(it); }
    it.name = d.name || ''; it.number = d.number || ''; it.notes = d.notes || ''; it.updated = Date.now();
    for (const f of it.files) if (!d.keep.some(k => k.id === f.id)) { await this.del('files', f.id); this.revoke(f.id); }
    it.files = d.keep.slice();
    for (const file of d.add) {
      const id = vuid();
      await this.saveFile(id, file);
      it.files.push({ id, name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size, added: Date.now() });
    }
    await this.persist();
    return it;
  },
  async deleteItem(id) {
    const it = this.items.find(x => x.id === id);
    if (!it) return;
    for (const f of it.files) { await this.del('files', f.id); this.revoke(f.id); }
    this.items = this.items.filter(x => x.id !== id);
    await this.persist();
  },
  /* ---------- passcode ---------- */
  async allFiles() {
    const out = [];
    for (const it of this.items) for (const f of it.files) { const b = await this.fileBlob(f); if (b) out.push([f.id, await b.arrayBuffer(), f.type]); }
    return out;
  },
  async setPasscode(pass) {
    const files = await this.allFiles();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.key = await this.derive(pass, salt);
    this.raw.lock = { salt, check: await this.enc(new TextEncoder().encode('bgp-vault-ok')) };
    for (const [id, buf] of files) await this.put('files', id, { enc: await this.enc(buf) });
    await this.persist();
    this.locked = false;
  },
  async unlock(pass) {
    const lock = this.raw.lock;
    if (!lock) return true;
    const key = await this.derive(pass, lock.salt);
    try { const ok = await this.dec(lock.check, key); if (new TextDecoder().decode(ok) !== 'bgp-vault-ok') return false; } catch (e) { return false; }
    this.key = key;
    this.items = await this.decJSON(this.raw.items);
    this.locked = false;
    return true;
  },
  async removePasscode() {
    const files = await this.allFiles();
    this.raw.lock = null;
    for (const [id, buf, type] of files) await this.put('files', id, { blob: new Blob([buf], { type }) });
    this.key = null;
    await this.persist();
  },
  lockNow() { if (!this.raw.lock) return; this.key = null; this.items = []; this.locked = true; this.revokeAll(); },
  async wipe() {
    this.revokeAll(); this.key = null; this.items = []; this.locked = false;
    this.raw = { v: 1, lock: null, items: [] }; this.mem = { meta: null, files: new Map() };
    if (this.ok) {
      try { if (this.db) { this.db.close(); this.db = null; } } catch (e) { /* ignore */ }
      await new Promise(res => { try { const r = indexedDB.deleteDatabase('bgp-vault'); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch (e) { res(); } });
    }
    this.loaded = true; this.loading = Promise.resolve();
    if (route.name === 'documents') refresh();
  }
};

/* ---------- Page ---------- */
function vaultCard(it, typeId) {
  const t = vtype(it ? it.type : typeId || 'other'), name = it && it.type === 'other' ? it.name : t.label;
  const has = it && (it.number || it.files.length || it.notes);
  const id = it ? it.id : 'new-' + t.id;
  let meta = [];
  if (it && it.number) meta.push('Number saved');
  if (it && it.files.length) meta.push(plural(it.files.length, 'file'));
  let h = '<li><article class="vcard card' + (has ? ' has' : '') + '" aria-labelledby="vh-' + id + '"><div class="vcard-top">' + tile(t.icon, t.cls, '') +
    '<div class="vcard-name"><h3 id="vh-' + id + '"' + (it && it.type === 'other' ? ' translate="no"' : '') + '>' + esc(name) + '</h3><p class="muted">' + (meta.length ? meta.map(esc).join(' · ') : esc('Nothing saved yet')) + '</p></div>' +
    '<button type="button" class="iconbtn vedit" data-vact="edit" data-id="' + esc(it ? it.id : '') + '" data-type="' + t.id + '" aria-label="' + esc(has ? 'Edit ' + t.label : 'Add ' + t.label) + '">' + icon(has ? 'pencil' : 'plus') + '</button></div>';
  if (it && it.number) {
    const shown = memo.vreveal && memo.vreveal[it.id];
    h += '<div class="vnum"><span class="vnum-v" translate="no" data-vnum="' + it.id + '">' + esc(shown ? showNum(it.number, t) : maskNum(it.number, t)) + '</span>' +
      '<button type="button" class="iconbtn" data-vact="reveal" data-id="' + it.id + '" aria-pressed="' + !!shown + '" aria-label="' + (shown ? 'Hide number' : 'Show number') + '">' + icon(shown ? 'eyeoff' : 'eye') + '</button>' +
      '<button type="button" class="iconbtn" data-vact="copy" data-id="' + it.id + '" aria-label="Copy number"><span class="lbl-t sr-only">Copy</span>' + icon('copy') + '</button></div>';
  }
  if (it && it.files.length) {
    h += '<ul class="vfiles" aria-label="Files">' + it.files.map(f => '<li><button type="button" class="vfile" data-vact="open" data-id="' + it.id + '" data-file="' + f.id + '" aria-label="' + esc('Open ' + f.name) + '">' +
      (/^image\//.test(f.type) ? '<img alt="" data-vthumb="' + f.id + '" data-item="' + it.id + '">' : '<span class="vfile-pdf">' + icon('doc') + '<b>PDF</b></span>') + '</button></li>').join('') + '</ul>';
  }
  if (it && it.notes) h += '<p class="vnotes" translate="no">' + esc(it.notes) + '</p>';
  if (!has) h += '<button type="button" class="btn vadd" data-vact="edit" data-id="" data-type="' + t.id + '">' + icon('plus') + 'Add number or copy</button>';
  return h + '</article></li>';
}
function viewDocuments() {
  let h = '<div class="wrap page docs-page">' + floatersHTML('docs') + ptitle(KN.docs, 'My documents', 'Keep your document numbers and copies in one place, ready for the next form that asks for them.');
  h += '<section class="vault-privacy"' + rv() + '>' + tile('shield', 't-pay', '') + '<div><h2>Only on this device</h2>' +
    '<p>Everything here is saved in this browser\'s own storage. Nothing is uploaded, and nobody else can see it from their device. Clearing your browser data, or Clear all data in Settings, deletes it.</p>' +
    (!Vault.ok && Vault.loaded ? '<p class="vault-warn">This browser is not letting the page save files, so anything you add here is gone when you close the tab.</p>' : '') + '</div></section>';
  if (!Vault.loaded) {
    Vault.load().then(() => { if (route.name === 'documents') refresh(); });
    return h + '<div class="vault-loading" aria-live="polite"><span class="spin" aria-hidden="true"></span>Opening your documents…</div></div>';
  }
  if (Vault.locked) {
    return h + '<section class="vault-lock card" aria-labelledby="vl-h"><div class="vault-lock-ic" aria-hidden="true">' + icon('lock') + '</div><h2 id="vl-h">Your documents are locked</h2>' +
      '<p class="muted">Enter your passcode to open them.</p><form class="vault-unlock" data-vform="unlock"><label class="sr-only" for="v-pass">Passcode</label>' +
      '<input class="input" type="password" id="v-pass" autocomplete="current-password" placeholder="Passcode" required>' +
      '<button type="submit" class="btn btn-primary">Unlock</button></form><p class="vault-err" id="v-err" aria-live="assertive"></p>' +
      '<button type="button" class="btn-text" data-vact="forgot">Forgot the passcode?</button></section></div>';
  }
  const others = Vault.items.filter(i => i.type === 'other');
  const saved = Vault.items.filter(i => i.type !== 'other' && (i.number || i.files.length || i.notes)).length + others.length;
  h += '<section class="vault-sec" aria-labelledby="vs-h"><div class="vault-head"><div><h2 class="h3 vault-h" id="vs-h">Saved details</h2><p class="muted">' +
    (saved ? plural(saved, 'document') + ' saved' : 'Add a number, a photo or a PDF to any document below.') + '</p></div>' +
    '<button type="button" class="btn" data-vact="edit" data-id="" data-type="other">' + icon('plus') + 'Add another document</button></div>' +
    '<ul class="vgrid">' + VAULT_TYPES.map(t => vaultCard(Vault.items.find(i => i.type === t.id), t.id)).join('') + others.map(i => vaultCard(i)).join('') + '</ul></section>';
  h += '<div class="vault-two"><div>' + docsCard('docs-h', 'h2', 'pg') + '</div>';
  h += '<section class="vault-sec card vault-pass" aria-labelledby="vp-h">' + tile('lock', 't-voter', '') + '<h2 id="vp-h">Passcode lock</h2>';
  if (!Vault.hasCrypto()) h += '<p class="muted">This browser cannot lock the vault with a passcode.</p>';
  else if (!Vault.raw.lock) h += '<p class="muted">Anyone who uses this browser can open this page. Add a passcode and everything here is encrypted, so it opens only with the passcode.</p>' +
    '<div class="btn-row"><button type="button" class="btn btn-primary" data-vact="setpass">Set a passcode</button></div>';
  else h += '<p class="muted">Your documents are encrypted. They lock again when you close this page.</p>' +
    '<div class="btn-row"><button type="button" class="btn" data-vact="lock">' + icon('lock') + 'Lock now</button><button type="button" class="btn-text" data-vact="setpass">Change passcode</button>' +
    '<button type="button" class="btn-text" data-vact="nopass">Remove passcode</button></div>';
  h += '</section></div></div>';
  return h;
}
/* Thumbnails load after render, from the vault's storage */
function vaultHydrate(root) {
  $$('img[data-vthumb]', root).forEach(img => {
    const it = Vault.items.find(x => x.id === img.dataset.item), f = it && it.files.find(x => x.id === img.dataset.vthumb);
    if (f) Vault.fileURL(f).then(u => { if (u && img.isConnected && Vault.urls.get(f.id) === u) img.src = u; }).catch(() => {});
  });
}

/* ---------- Editor dialog ---------- */
function vaultEditor(itemId, typeId) {
  const it = Vault.items.find(x => x.id === itemId) || null, t = vtype(it ? it.type : typeId);
  memo.vdraft = { id: it ? it.id : null, type: t.id, keep: it ? it.files.slice() : [], add: [] };
  const title = it ? (it.type === 'other' ? it.name : t.label) : (t.id === 'other' ? 'Add a document' : t.label);
  Sound.play('open');
  Overlay.open('vault-edit', 'dialog', '<form class="vedit-form" data-vform="save"><div class="vedit-head">' + tile(t.icon, t.cls, '') + '<h2 id="ve-h" class="h3"' + (it && it.type === 'other' ? ' translate="no"' : '') + '>' + esc(title) + '</h2></div>' +
    (t.id === 'other' ? '<div class="field"><label class="lbl" for="ve-name">Document name</label><input class="input" id="ve-name" maxlength="60" required value="' + esc(it ? it.name : '') + '" placeholder="For example, Ration card"></div>' : '') +
    '<div class="field"><label class="lbl" for="ve-num">' + esc(t.num) + '</label><input class="input" id="ve-num" maxlength="40" autocomplete="off" spellcheck="false" translate="no" value="' + esc(it ? showNum(it.number, t) : '') + '"' +
    (t.id === 'aadhaar' ? ' inputmode="numeric"' : '') + ' aria-describedby="ve-hint"><p class="est" id="ve-hint" data-hint="' + esc(t.hint) + '">' + esc(t.hint) + '</p></div>' +
    '<div class="field"><label class="lbl" for="ve-notes">Notes</label><textarea class="input" id="ve-notes" rows="2" maxlength="300" placeholder="Issue date, expiry, where the original is kept">' + esc(it ? it.notes : '') + '</textarea></div>' +
    '<div class="field"><span class="lbl" id="ve-files-l">Copies</span><ul class="vedit-files" id="ve-files" aria-labelledby="ve-files-l"></ul>' +
    '<label class="vdrop" for="ve-file">' + icon('up') + '<span><b>Add a photo or PDF</b><span class="muted">Up to 15 MB each</span></span></label>' +
    '<input type="file" id="ve-file" class="sr-only" accept="image/*,application/pdf" multiple data-vfile></div>' +
    '<p class="vault-err" id="ve-err" aria-live="assertive"></p>' +
    '<div class="btn-row vedit-acts">' + (it ? '<button type="button" class="btn-text vdel" data-vact="delete" data-id="' + it.id + '">Delete</button>' : '') +
    '<span class="grow"></span><button type="button" class="btn" data-act="ov-close">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>',
    { labelledby: 've-h', onOpen: el => { drawDraftFiles(); const f = $('#ve-name', el) || $('#ve-num', el); if (f) f.focus(); } });
}
function drawDraftFiles() {
  const ul = document.getElementById('ve-files'), d = memo.vdraft;
  if (!ul || !d) return;
  const rows = d.keep.map(f => ({ key: f.id, name: f.name, size: f.size, kind: 'keep' })).concat(d.add.map((f, i) => ({ key: 'n' + i, name: f.name, size: f.size, kind: 'add', i })));
  ul.innerHTML = rows.length ? rows.map(r => '<li><span class="vedit-fn" translate="no">' + esc(r.name) + '</span><span class="muted">' + fmtSize(r.size) + '</span>' +
    '<button type="button" class="iconbtn" data-vact="rmfile" data-kind="' + r.kind + '" data-key="' + esc(r.kind === 'keep' ? r.key : String(r.i)) + '" aria-label="' + esc('Remove ' + r.name) + '">' + icon('close') + '</button></li>').join('')
    : '<li class="muted vedit-none">No copies yet</li>';
}
function checkNum() {
  const inp = document.getElementById('ve-num'), hint = document.getElementById('ve-hint'), d = memo.vdraft;
  if (!inp || !hint || !d) return;
  const t = vtype(d.type), v = inp.value.trim();
  const bad = v && t.re && !t.re.test(v);
  hint.classList.toggle('warn', !!bad);
  hint.textContent = bad ? 'This does not look like a usual ' + t.num + ' (' + t.hint + '). You can still save it.' : t.hint;
}
async function saveDraft(form) {
  const d = memo.vdraft;
  if (!d) return;
  const name = $('#ve-name', form), num = $('#ve-num', form), notes = $('#ve-notes', form), err = $('#ve-err', form);
  const btn = $('button[type="submit"]', form);
  btn.disabled = true;
  try {
    const it = await Vault.saveItem({ id: d.id, type: d.type, name: name ? name.value.trim() : '', number: num.value.trim(), notes: notes.value.trim(), keep: d.keep, add: d.add });
    const t = vtype(it.type);
    if (t.doc && (it.number || it.files.length)) { S.docs[t.doc] = true; save(); }
    memo.vdraft = null;
    Overlay.close();
    Sound.play('ok');
    refresh();
    Toast.show('Saved on this device');
  } catch (e) {
    btn.disabled = false;
    err.textContent = 'Could not save. Your browser may be out of space for this site.';
  }
}
function openVaultFile(itemId, fileId) {
  const it = Vault.items.find(x => x.id === itemId), f = it && it.files.find(x => x.id === fileId);
  if (!f) return;
  Vault.fileURL(f).then(u => {
    if (!u) return;
    if (/^image\//.test(f.type)) {
      Sound.play('open');
      Overlay.open('vault-view', 'dialog', '<div class="vview"><h2 id="vv-h" class="sr-only">' + esc(f.name) + '</h2><img src="' + u + '" alt="' + esc(f.name) + '"></div>' +
        '<div class="btn-row vedit-acts"><a class="btn" href="' + u + '" download="' + esc(f.name) + '">Download</a><span class="grow"></span><button type="button" class="btn btn-primary" data-act="ov-close">Done</button></div>',
        { labelledby: 'vv-h' });
    } else window.open(u, '_blank', 'noopener');
  });
}
function passDialog(change) {
  Sound.play('open');
  Overlay.open('vault-pass', 'dialog', '<form data-vform="setpass"><div class="confirm-ic vp-ic" aria-hidden="true">' + icon('lock') + '</div><h2 id="vpd-h" class="h3">' + (change ? 'Change passcode' : 'Set a passcode') + '</h2>' +
    '<p class="muted" style="margin:8px 0 16px">Use at least 4 characters. If you forget it, the only way back in is to delete everything in the vault.</p>' +
    '<div class="field"><label class="lbl" for="vp-1">New passcode</label><input class="input" type="password" id="vp-1" autocomplete="new-password" minlength="4" required></div>' +
    '<div class="field" style="margin-top:12px"><label class="lbl" for="vp-2">Type it again</label><input class="input" type="password" id="vp-2" autocomplete="new-password" minlength="4" required></div>' +
    '<p class="vault-err" id="vp-err" aria-live="assertive"></p><div class="btn-row confirm-row"><button type="button" class="btn" data-act="ov-close">Cancel</button><button type="submit" class="btn btn-primary">Save passcode</button></div></form>',
    { labelledby: 'vpd-h', onOpen: el => $('#vp-1', el).focus() });
}
function vaultConfirm(kind) {
  const forgot = kind === 'forgot';
  Sound.play('warn');
  Overlay.open('vault-confirm', 'dialog', '<div class="confirm-ic" aria-hidden="true">' + icon('warn') + '</div><h2 id="vc-h" class="h3">' + (forgot ? 'Delete the locked vault?' : kind === 'nopass' ? 'Remove the passcode?' : 'Delete this document?') + '</h2>' +
    '<p class="muted" style="margin-top:8px">' + (forgot ? 'Without the passcode nobody can open it, including us. Deleting removes every number and copy in it so you can start again.'
      : kind === 'nopass' ? 'Your documents stay saved, but they will no longer be encrypted, and anyone using this browser can open them.'
      : 'Its number, notes and copies are removed from this device. This cannot be undone.') + '</p>' +
    '<div class="btn-row confirm-row"><button type="button" class="btn" data-act="ov-close" id="vc-no">Cancel</button><button type="button" class="btn btn-danger" data-vact="confirm-' + kind + '" id="vc-yes">' +
    (forgot ? 'Delete the vault' : kind === 'nopass' ? 'Remove passcode' : 'Delete') + '</button></div>',
    { labelledby: 'vc-h', push: false, onOpen: el => $('#vc-no', el).focus(),
      onClose: () => { if (kind === 'delete' && !memo.vdone && memo.vdraft) { const d = memo.vdraft; setTimeout(() => { vaultEditor(d.id, d.type); memo.vdraft.keep = d.keep; memo.vdraft.add = d.add; drawDraftFiles(); }, 0); } memo.vdone = false; } });
}

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-vact]');
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.vact) {
    case 'edit': vaultEditor(id, el.dataset.type); break;
    case 'reveal': {
      memo.vreveal = memo.vreveal || {}; memo.vreveal[id] = !memo.vreveal[id];
      Sound.play('tap'); refresh();
      const b = $('[data-vact="reveal"][data-id="' + id + '"]'); if (b) b.focus();
      break;
    }
    case 'copy': {
      const it = Vault.items.find(x => x.id === id);
      if (!it) break;
      const v = showNum(it.number, vtype(it.type));
      Sound.play('tap');
      copyText(v).then(ok => { if (ok) { confirmInPlace(el, 'Copied'); Toast.show('Number copied'); } else copyDialog(v); });
      break;
    }
    case 'open': openVaultFile(id, el.dataset.file); break;
    case 'rmfile': {
      const d = memo.vdraft; if (!d) break;
      if (el.dataset.kind === 'keep') d.keep = d.keep.filter(f => f.id !== el.dataset.key); else d.add.splice(+el.dataset.key, 1);
      Sound.play('untick'); drawDraftFiles();
      break;
    }
    case 'delete': memo.vdel = id; vaultConfirm('delete'); break;
    case 'confirm-delete': memo.vdone = true; memo.vdraft = null; Vault.deleteItem(memo.vdel).then(() => { Overlay.close(true); refresh(); Toast.show('Document deleted'); }); break;
    case 'setpass': passDialog(!!Vault.raw.lock); break;
    case 'nopass': vaultConfirm('nopass'); break;
    case 'confirm-nopass': memo.vdone = true; Vault.removePasscode().then(() => { Overlay.close(true); refresh(); Toast.show('Passcode removed'); }); break;
    case 'lock': Vault.lockNow(); Sound.play('stamp'); refresh(); Toast.show('Documents locked'); break;
    case 'forgot': vaultConfirm('forgot'); break;
    case 'confirm-forgot': memo.vdone = true; Overlay.close(true); Vault.wipe().then(() => Toast.show('Vault deleted')); break;
  }
});
document.addEventListener('change', e => {
  const inp = e.target;
  if (!inp.matches || !inp.matches('[data-vfile]') || !memo.vdraft) return;
  const err = document.getElementById('ve-err');
  let skipped = 0;
  for (const f of inp.files) {
    if (f.size > VAULT_MAX_FILE || !/^(image\/|application\/pdf)/.test(f.type)) { skipped++; continue; }
    memo.vdraft.add.push(f);
  }
  inp.value = '';
  if (err) err.textContent = skipped ? 'Some files were skipped. Add photos or PDFs up to 15 MB.' : '';
  Sound.play('pop');
  drawDraftFiles();
});
document.addEventListener('input', e => { if (e.target.id === 've-num') checkNum(); });
document.addEventListener('submit', async e => {
  const form = e.target.closest && e.target.closest('[data-vform]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.vform;
  if (kind === 'save') { saveDraft(form); return; }
  if (kind === 'unlock') {
    const p = $('#v-pass', form).value, err = document.getElementById('v-err'), b = $('button', form);
    b.disabled = true;
    const ok = await Vault.unlock(p).catch(() => false);
    b.disabled = false;
    if (ok) { Sound.play('ok'); refresh(); }
    else { Sound.play('warn'); err.textContent = 'That passcode did not match. Try again.'; restartAnim(form, 'shake-x'); $('#v-pass', form).select(); }
    return;
  }
  if (kind === 'setpass') {
    const a = $('#vp-1', form).value, b = $('#vp-2', form).value, err = document.getElementById('vp-err');
    if (a.length < 4) { err.textContent = 'Use at least 4 characters.'; return; }
    if (a !== b) { err.textContent = 'The two passcodes do not match.'; return; }
    const btn = $('button[type="submit"]', form); btn.disabled = true;
    try { await Vault.setPasscode(a); Overlay.close(true); Sound.play('stamp'); refresh(); Toast.show('Your documents are now encrypted'); }
    catch (er) { btn.disabled = false; err.textContent = 'Could not set the passcode in this browser.'; }
  }
});
