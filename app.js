(function () {
'use strict';

/* ================= helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
const pad = (n) => String(n).padStart(2, '0');
const round2 = (n) => Math.round(n * 100) / 100;
const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const finePointer = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);

const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function inr(n, dec) {
  const a = Math.abs(n);
  if (dec === 2) return '₹' + nf2.format(a);
  return '₹' + (Math.round(a * 100) % 100 === 0 ? nf0.format(Math.round(a)) : nf2.format(a));
}
const signedAmt = (t) => (t.o ? '−' : '+') + inr(t.a);
function compactINR(n) {
  const t = (x) => String(Math.round(x * 10) / 10);
  if (n >= 1e7) return '₹' + t(n / 1e7) + 'Cr';
  if (n >= 1e5) return '₹' + t(n / 1e5) + 'L';
  if (n >= 1e3) return '₹' + t(n / 1e3) + 'K';
  return '₹' + Math.round(n);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MONTHS.map((m) => m.slice(0, 3));
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const ymd = (dt) => dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
const todayYMD = () => ymd(new Date());
const thisMonth = () => todayYMD().slice(0, 7);
const monthOf = (t) => t.d.slice(0, 7);
const longDate = (s) => { const d = parseYMD(s); return DAYS[d.getDay()] + ' · ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const shortDate = (s) => { const d = parseYMD(s); return d.getDate() + ' ' + MON[d.getMonth()]; };
const dayHead = (s) => { const d = parseYMD(s); return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; };
const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return MONTHS[mo - 1] + ' ' + y; };
const monthName = (m) => MONTHS[Number(m.slice(5, 7)) - 1];
const shiftMonth = (m, k) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + k, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const daysIn = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
function rangeLabel(a, b) {
  if (!a) return '';
  const A = parseYMD(a), B = parseYMD(b || a);
  if (a === b || !b) return A.getDate() + ' ' + MON[A.getMonth()] + ' ' + A.getFullYear();
  if (A.getFullYear() !== B.getFullYear()) return shortDate(a) + ' ' + A.getFullYear() + ' – ' + shortDate(b) + ' ' + B.getFullYear();
  if (A.getMonth() === B.getMonth()) return A.getDate() + ' – ' + B.getDate() + ' ' + MON[B.getMonth()] + ' ' + B.getFullYear();
  return shortDate(a) + ' – ' + shortDate(b) + ' ' + B.getFullYear();
}
function cyrb53(str, seed) {
  let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
  for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
// JSON with sorted keys, so two copies of the same data compare equal
function stable(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
}

const ICONS = {
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
  up: '<path d="M7 17L17 7M8 7h9v9"/>', down: '<path d="M17 7L7 17M16 17H7V8"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
  memory: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};
const icon = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>';

/* ================= book state ================= */
// A few common categories so a new book isn't empty. Restoring a backup brings back your own.
const STARTER = ['food', 'groceries', 'travel', 'shopping', 'bills', 'subscriptions', 'health', 'fun'];
const freshState = () => ({ cats: STARTER.map((n) => ({ n, b: 0, x: false })), rules: {}, imports: [], txns: {}, limit: 0 });
let state = freshState();
/* A transaction: id, d date (YYYY-MM-DD), m merchant, k merchant key, a amount, o 1 = money out,
   b balance after or null, r bank narration, c category or null, f 1 = filled from memory,
   n note, i import id ('m' = added by hand), s order within the statement. */

const ruleKey = (t) => (t.o ? 'o:' : 'i:') + t.k;
const cleanCatName = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 40);
const findCat = (name) => { const l = cleanCatName(name).toLowerCase(); return l ? state.cats.find((c) => c.n.toLowerCase() === l) || null : null; };
const canonCat = (s) => { const n = cleanCatName(s); if (!n) return null; const c = findCat(n); return c ? c.n : n; };
const ensureCat = (name) => { if (name && !findCat(name)) state.cats.push({ n: name, b: 0, x: false }); };
function catCounts() { const m = Object.create(null); for (const t of Object.values(state.txns)) if (t.c) m[t.c] = (m[t.c] || 0) + 1; return m; }
const cmpTxn = (a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.i < b.i ? -1 : a.i > b.i ? 1 : (a.s - b.s) || (a.id < b.id ? -1 : 1));
const allTxns = () => Object.values(state.txns).sort(cmpTxn);
function monthsWithData() { const s = new Set(); for (const t of Object.values(state.txns)) s.add(monthOf(t)); return [...s].sort(); }
const txnsInMonth = (m) => allTxns().filter((t) => t.d.startsWith(m));
const monthsIn = (st) => new Set(Object.values(st.txns).map(monthOf));

function othersFor(t, name) {
  const key = ruleKey(t);
  return Object.values(state.txns).filter((o) => o !== t && ruleKey(o) === key && (!o.c || (o.f && o.c !== name))).length;
}
// Give a transaction a category; with remember on, store merchant → category and fill the others.
function applyCategory(t, rawCat, note, remember) {
  const name = canonCat(rawCat);
  const months = new Set([monthOf(t)]);
  let filled = 0;
  if (name) ensureCat(name);
  t.c = name; t.f = 0; t.n = String(note || '').trim().slice(0, 200);
  if (name && remember && t.k) {
    const key = ruleKey(t);
    state.rules[key] = { c: name, m: t.m, u: Date.now() };
    for (const o of Object.values(state.txns)) {
      if (o === t || ruleKey(o) !== key) continue;
      if (!o.c || (o.f && o.c !== name)) { o.c = name; o.f = 1; months.add(monthOf(o)); filled++; }
    }
  }
  markDirty(true, months);
  return filled;
}
function setRule(key, cat) {
  const r = state.rules[key]; const name = canonCat(cat);
  if (!r || !name) return;
  ensureCat(name); r.c = name; r.u = Date.now();
  const months = new Set();
  for (const o of Object.values(state.txns)) if (o.f && ruleKey(o) === key && o.c !== name) { o.c = name; months.add(monthOf(o)); }
  markDirty(true, months);
}
function renameCategory(oldName, newRaw) {
  const newName = cleanCatName(newRaw);
  if (!newName || newName === oldName) return null;
  const target = state.cats.find((c) => c.n !== oldName && c.n.toLowerCase() === newName.toLowerCase());
  const final = target ? target.n : newName;
  const months = new Set();
  for (const t of Object.values(state.txns)) if (t.c === oldName) { t.c = final; months.add(monthOf(t)); }
  for (const r of Object.values(state.rules)) if (r.c === oldName) r.c = final;
  const old = state.cats.find((c) => c.n === oldName);
  if (target) { if (!target.b && old && old.b) target.b = old.b; state.cats = state.cats.filter((c) => c.n !== oldName); }
  else if (old) old.n = final;
  markDirty(true, months);
  return final;
}
function deleteCategory(name) {
  const months = new Set();
  for (const t of Object.values(state.txns)) if (t.c === name) { t.c = null; t.f = 0; months.add(monthOf(t)); }
  for (const [k, r] of Object.entries(state.rules)) if (r.c === name) delete state.rules[k];
  state.cats = state.cats.filter((c) => c.n !== name);
  markDirty(true, months);
}
function restore(before) {
  const months = new Set([...monthsIn(state), ...monthsIn(before)]);
  state = before;
  markDirty(true, months);
}
function withUndo(message, mutate, after) {
  const before = clone(state);
  mutate();
  render();
  toast(message, () => { restore(before); if (after) after(); render(); });
}

/* ================= merchant names ================= */
const STOP = new Set('UPI IMPS NEFT RTGS MMT P2M P2A P2P DR CR INF INFT BIL ONL POS ATM ATW NWD ACH NACH ECS TPT MOB IB NET NETBANKING PAY PAYMENT PAYMENTS PAID SENT RECEIVED RECD TRANSFER TRF TFR FT NA NULL NONE REF TXN COLLECT REQ REQUEST VPS VIN PCI PCD CMS SI TO BY FROM FOR VIA USING THE OF AND INR RS REV REVERSAL CREDIT DEBIT DEPOSIT WITHDRAWAL CHQ CHEQUE CLG INWARD OUTWARD IFT BBPS QR MERCHANT ID NO UPIINTENT AUTOPAY MANDATE ORDER MONEY REFUND AUTOMATIC SETUP MR MRS MS SHRI SMT'.split(' '));
const SUFFIX = new Set('LTD LIMITED PVT PRIVATE LLP INC CORP CORPORATION CO COMPANY'.split(' '));
const BANK_CODES = new Set('YESB HDFC ICIC SBIN UTIB KKBK PYTM BARB PUNB CNRB UBIN IDIB IOBA INDB FDRL AIRP IDFB CIUB KVBL MAHB BKID CBIN UCBA PSIB SIBL TMBL DBSS AUBL ESFB JIOP FINO IPOS RATN HSBC SCBL CITI'.split(' '));
const SPECIAL = [
  [/^(ATW|ATM|NWD|EAW|ATD|AWB)\b|\bATM\s*(WDL|CASH|WD)\b|\bCASH\s*(WDL|WITHDRAWAL)\b/i, 'ATM withdrawal'],
  [/^(INT\.?\s*PD|INT\.?\s*CR|INTEREST|CREDIT INTEREST|SB\s*INT)\b|\bINT\.PD\b/i, 'Interest'],
  [/^(transferred|transfer|sent) to self\b|^self transfer/i, 'Self transfer'],
  [/^money added to upi lite|\bupi\s?lite\b.*\b(add|load|top.?up)\b|\b(add|load|top.?up)\b.*\bupi\s?lite\b/i, 'UPI Lite top-up'],
  [/\b(SMS ?CHGS?|SMS CHARGES|MIN BAL|NON MAINT|SERVICE CHARGES|ANNUAL FEE|DEBIT CARD (ANNUAL )?(FEE|CHARGES)|AMC CHG)\b/i, 'Bank charges']
];
const letterKey = (w) => w.toUpperCase().replace(/[^A-Z]/g, '');
const isStop = (w) => STOP.has(w.toUpperCase().replace(/[^A-Z0-9]/g, '')) || STOP.has(letterKey(w));
function junkWord(w) {
  const x = w.replace(/[.,:;#()]/g, '');
  if (!x || x.includes('@')) return true;
  if (/^X+\d+$/i.test(x)) return true;
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(x)) return true;
  const digits = (x.match(/\d/g) || []).length;
  if (/^\d+$/.test(x)) return x.length >= 3;
  return digits >= 2 && (x.length >= 6 || digits / x.length >= 0.5);
}
function cleanToken(p) {
  p = String(p).replace(/[_*]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!p || p.includes('@')) return null;
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(p) || /\bBANK\b/i.test(p) || BANK_CODES.has(p.toUpperCase())) return null;
  const words = p.split(' ').map((w) => w.replace(/^([A-Za-z]{3,})\d{2,4}$/, '$1')).filter((w) => !junkWord(w) && !BANK_CODES.has(w.toUpperCase()));
  while (words.length && isStop(words[0])) words.shift();
  while (words.length && (SUFFIX.has(letterKey(words[words.length - 1])) || isStop(words[words.length - 1]))) words.pop();
  const out = words.join(' ').replace(/[,.;:\-]+$/, '').trim();
  return (out.match(/[A-Za-z]/g) || []).length >= 2 ? out.slice(0, 40) : null;
}
function titleCase(s) {
  return s.toLowerCase()
    .replace(/(^|[\s(.'&\-])([a-z])/g, (m, a, b) => a + b.toUpperCase())
    .replace(/\b([b-df-hj-np-tv-xz]{3,4})\b/gi, (w) => w.toUpperCase());
}
function extractMerchant(raw) {
  let s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return 'Unknown';
  for (const [re, name] of SPECIAL) if (re.test(s)) return name;
  s = s.replace(/\s+(transaction id|txn id|upi id|utr( no\.?)?|upi ref(erence)?( no\.?)?|ref(erence)? no\.?|paid by|credited to|debited from)\b.*$/i, '');
  s = s.replace(/^(TO|BY)\s+TRANSFER[\s-]*/i, '').replace(/^TRANSFER\s+(TO|FROM)\s+/i, '');
  const slashes = (s.match(/\//g) || []).length;
  const parts = slashes >= 2 ? s.split('/') : s.split(/\s*-\s*|\//);
  for (const p of parts) { const n = cleanToken(p); if (n) return titleCase(n); }
  return titleCase(s.split(' ').slice(0, 4).join(' ')).slice(0, 40);
}
const merchantKey = (m) => String(m || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* ================= statement parsing ================= */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const sample = text.split(/\r?\n/).slice(0, 20).join('\n');
  let delim = ',', best = -1;
  for (const d of [',', ';', '\t', '|']) { const n = sample.split(d).length - 1; if (n > best) { best = n; delim = d; } }
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
      continue;
    }
    if (c === '"' && field.trim() === '') { q = true; field = ''; continue; }
    if (c === delim) { row.push(field.trim()); field = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim()); rows.push(row); row = []; field = '';
      continue;
    }
    field += c;
  }
  if (field !== '' || row.length) { row.push(field.trim()); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ''));
}
function rowsFromHTML(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const rows = [];
  for (const tr of doc.querySelectorAll('tr')) {
    const cells = [];
    for (const td of tr.children) {
      if (!/^T[DH]$/.test(td.tagName)) continue;
      cells.push(td.textContent.replace(/\s+/g, ' ').trim());
      const span = Math.min(Number(td.getAttribute('colspan')) || 1, 30);
      for (let k = 1; k < span; k++) cells.push('');
    }
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
}
function rowsFromXML2003(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const rows = [];
  for (const r of doc.getElementsByTagNameNS('*', 'Row')) {
    const cells = [];
    for (const c of r.getElementsByTagNameNS('*', 'Cell')) {
      const idx = c.getAttribute('ss:Index') || c.getAttributeNS('urn:schemas-microsoft-com:office:spreadsheet', 'Index');
      if (idx) while (cells.length < Number(idx) - 1) cells.push('');
      const d = c.getElementsByTagNameNS('*', 'Data')[0];
      cells.push(d ? d.textContent.trim() : '');
    }
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
}
let xlsxPromise = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxPromise) {
    xlsxPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('no reader')));
      s.onerror = () => { xlsxPromise = null; reject(new Error('no reader')); };
      document.head.appendChild(s);
    });
  }
  return xlsxPromise;
}
async function readWorkbook(buf) {
  let X;
  try { X = await loadXLSX(); } catch (e) { throw userError('The Excel reader didn\'t load. Check your connection, or save the statement as CSV and import that.'); }
  const wb = X.read(new Uint8Array(buf), { type: 'array', raw: true, cellDates: false });
  let best = [], bestScore = -1;
  for (const name of wb.SheetNames) {
    const rows = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false });
    const score = rows.filter((r) => r.some((v) => parseDateCell(v, true))).length;
    if (score > bestScore) { best = rows; bestScore = score; }
  }
  return best;
}
// Errors meant for the person importing; anything else gets a general message.
function userError(msg) { const e = new Error(msg); e.friendly = true; return e; }
function decodeText(u8) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); }
  catch (e) { return new TextDecoder('windows-1252').decode(u8); }
}
/* ---------- PDF statements ---------- */
const PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfPromise = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('load failed'));
    document.head.appendChild(s);
  });
}
async function waitFor(fn, ms) {
  const t0 = Date.now();
  for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await sleep(40); }
}
function loadPDFJS() {
  if (!pdfPromise) {
    pdfPromise = (async () => {
      await Promise.all([loadScript(PDFJS_BASE + 'pdf.min.js'), loadScript(PDFJS_BASE + 'pdf.worker.min.js')]);
      const lib = await waitFor(() => window.pdfjsLib, 5000);
      const worker = await waitFor(() => window.pdfjsWorker && window.pdfjsWorker.WorkerMessageHandler, 5000);
      if (!lib || !worker) throw new Error('no reader');
      try { lib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.js'; } catch (e) { /* the reader runs on the page either way */ }
      return lib;
    })().catch(() => { pdfPromise = null; throw userError('The PDF reader didn\'t load. Check your connection and try again, or import the Excel or CSV version.'); });
  }
  return pdfPromise;
}
const isDateLike = (s) => !!(parseDateCell(s, true) || parseDateCell(s, false) || parseDayMonth(s));
function isAmountLikeStrict(s) {
  const t = String(s).trim();
  if (!/\d/.test(t) || !/^[-−(]?\s*(₹|rs\.?|inr)?\s*[\d,]+(\.\d{1,2})?\s*\)?\s*(cr|dr)?\.?$/i.test(t)) return false;
  const num = t.replace(/[^\d.,]/g, '');
  return /\.\d{1,2}$/.test(num) || /^\d{1,3}(,\d{2,3})+$/.test(num.split('.')[0]) || /₹|rs|inr/i.test(t);
}
const lineText = (l) => l.items.map((i) => i.s).join(' ');
const headerScore = (t) => { t = String(t).toLowerCase(); return (/date|\bdt\b/.test(t) ? 1 : 0) + (/narration|description|particular|remark|details|transaction info/.test(t) ? 1 : 0) + (/withdraw|debit|deposit|credit|amount|balance/.test(t) ? 1 : 0); };
const SUMMARY_LINE = /^(statement summary|opening balance|closing balance|grand total|total|page\b|page no|generated|this is a|computer generated|note: this payment|\*{3,})/i;
const lineHasAmount = (t) => /(^|\s)₹?\s?\d{1,3}(,\d{2,3})+(\.\d{2})?(\s|$)|(^|\s)₹?\d+\.\d{2}(\s|$)/.test(t);
function colKind(text) {
  const c = normH(text);
  if (isTypeH(c)) return 'type';
  if (/date|\bdt\b/.test(c)) return 'date';
  if (/withdraw|debit|deposit|credit|amount|balance|\bamt\b|^bal\b|^(dr|cr)\b/.test(c)) return 'amt';
  return 'text';
}
function buildHeaderCells(hLines) {
  const cells = [];
  for (const it of hLines[0].items) {
    const last = cells[cells.length - 1];
    if (last && it.x - last.x1 < Math.max(2, 0.5 * it.h)) { last.text += ' ' + it.s; last.x1 = Math.max(last.x1, it.x + it.w); }
    else cells.push({ text: it.s, x0: it.x, x1: it.x + it.w });
  }
  for (const l of hLines.slice(1)) for (const it of l.items) {
    const ix0 = it.x, ix1 = it.x + it.w;
    let best = null, bestOv = 0;
    for (const c of cells) { const ov = Math.min(c.x1, ix1) - Math.max(c.x0, ix0); if (ov > bestOv) { bestOv = ov; best = c; } }
    if (best) { best.text += ' ' + it.s; best.x0 = Math.min(best.x0, ix0); best.x1 = Math.max(best.x1, ix1); }
    else cells.push({ text: it.s, x0: ix0, x1: ix1 });
  }
  cells.sort((a, b) => a.x0 - b.x0);
  for (const c of cells) { c.kind = colKind(c.text); c.cx = (c.x0 + c.x1) / 2; }
  return cells;
}
// Which column a piece of text belongs to: dates and amounts go to the nearest column of their kind,
// everything else to the column it starts in.
function pdfCol(cells, it) {
  const ix0 = it.x, ix1 = it.x + it.w, icx = (ix0 + ix1) / 2;
  const nearest = (kind, maxD) => {
    let best = -1, bd = Infinity;
    cells.forEach((c, i) => { if (c.kind !== kind) return; const d = Math.min(Math.abs(c.x1 - ix1), Math.abs(c.cx - icx), Math.abs(c.x0 - ix0)); if (d < bd) { bd = d; best = i; } });
    return bd <= maxD ? best : -1;
  };
  const far = Math.max(60, it.h * 6);
  if (isDateLike(it.s)) { const i = nearest('date', far); if (i >= 0) return i; }
  if (isAmountLikeStrict(it.s)) { const i = nearest('amt', far); if (i >= 0) return i; }
  const tol = Math.max(2, it.h * 0.6);
  let idx = 0;
  for (let i = 0; i < cells.length; i++) if (cells[i].x0 <= ix0 + tol) idx = i;
  return idx;
}
function pdfLinesToRows(lines) {
  const hasData = (l) => l.items.some((it) => isAmountLikeStrict(it.s) || isDateLike(it.s));
  let h = -1, hLines = null;
  for (let i = 0; i < lines.length && h < 0; i++) {
    const a = lines[i], b = lines[i + 1];
    if (hasData(a)) continue;
    const close = !!(b && b.page === a.page && a.y - b.y <= 1.9 * a.h);
    if (headerScore(lineText(a)) === 3) {
      h = i; hLines = [a];
      if (close && !hasData(b) && headerScore(lineText(b)) < 3 && /amount|amt|\(inr|\(rs|₹|balance|no\.?$|date|\bdt\b/i.test(lineText(b))) hLines.push(b);
    } else if (close && !hasData(b) && headerScore(lineText(a) + ' ' + lineText(b)) === 3) { h = i; hLines = [a, b]; }
  }
  if (h < 0) return pdfFallbackRows(lines);
  const cells = buildHeaderCells(hLines);
  if (cells.length < 3) return pdfFallbackRows(lines);
  const headerTexts = new Set(hLines.map((l) => normH(lineText(l))));
  const dateCols = cells.map((c, i) => (c.kind === 'date' ? i : -1)).filter((i) => i >= 0);
  const parsed = [];
  for (const l of lines.slice(h + hLines.length)) {
    const whole = lineText(l); const t = normH(whole);
    if (headerTexts.has(t) || headerScore(t) === 3) continue;
    const texts = cells.map(() => []), x1s = cells.map(() => -Infinity);
    let hasAmt = false;
    for (const it of l.items) {
      const ci = pdfCol(cells, it);
      texts[ci].push(it.s); x1s[ci] = Math.max(x1s[ci], it.x + it.w);
      if (cells[ci].kind === 'amt' && isAmountLikeStrict(it.s)) hasAmt = true;
    }
    const tx = texts.map((a) => a.join(' '));
    const anchor = dateCols.some((i) => isDateLike(tx[i]));
    parsed.push({ l, tx, x1s, anchor, hasAmt: hasAmt || (!anchor && lineHasAmount(whole)), stop: !anchor && SUMMARY_LINE.test(whole.trim()) });
  }
  const firstA = parsed.findIndex((q) => q.anchor);
  if (firstA < 0) return pdfFallbackRows(lines);
  const before = parsed[firstA - 1], a0 = parsed[firstA];
  const centered = !!(before && !before.anchor && !before.hasAmt && !before.stop && before.l.page === a0.l.page && before.l.y - a0.l.y <= 1.6 * before.l.h);
  let rows = [];
  if (!centered) {
    let cur = null, lastY = 0, lastPage = 0, lastX1 = null;
    for (const q of parsed) {
      if (q.anchor) { cur = { cells: q.tx.slice() }; rows.push(cur); lastY = q.l.y; lastPage = q.l.page; lastX1 = q.x1s.slice(); continue; }
      if (q.hasAmt || q.stop || !cur || q.l.page !== lastPage || lastY - q.l.y > 3.6 * q.l.h) { cur = null; continue; }
      q.tx.forEach((t, i) => {
        if (!t) return;
        const prevT = cur.cells[i];
        const limit = cells[i + 1] ? cells[i + 1].x0 : Infinity;
        const glue = prevT && lastX1[i] >= limit - 1.2 * q.l.h && /[A-Za-z0-9]$/.test(prevT) && /^[A-Za-z0-9]/.test(t) ? '' : ' ';
        cur.cells[i] = prevT ? prevT + glue + t : t;
        lastX1[i] = q.x1s[i];
      });
      lastY = q.l.y;
    }
  } else {
    const groups = parsed.filter((q) => q.anchor).map((q) => ({ a: q, parts: [q] }));
    for (const q of parsed) {
      if (q.anchor || q.hasAmt || q.stop) continue;
      let best = null, bd = Infinity;
      for (const g of groups) if (g.a.l.page === q.l.page) { const d = Math.abs(g.a.l.y - q.l.y); if (d < bd) { bd = d; best = g; } }
      if (best && bd <= 3 * q.l.h) best.parts.push(q);
    }
    rows = groups.map((g) => { g.parts.sort((x, y) => y.l.y - x.l.y); return { cells: cells.map((_, i) => g.parts.map((q) => q.tx[i]).filter(Boolean).join(' ')) }; });
  }
  const period = statementPeriod(lines);
  for (const r of rows) for (const i of dateCols) {
    const v = r.cells[i];
    if (!v || parseDateCell(v, true)) continue;
    const dm = parseDayMonth(v);
    if (dm) r.cells[i] = dm.d + ' ' + MON[dm.m - 1] + ' ' + guessYear(dm, period) + (dm.rest ? ' ' + dm.rest : '');
  }
  return [cells.map((c) => c.text)].concat(rows.map((r) => r.cells));
}
// The statement's date range from its first page, used to give "15 Oct" a year.
function statementPeriod(lines) {
  const text = lines.filter((l) => l.page === 1).map(lineText).join(' | ');
  const found = [];
  const res = [/\d{1,2}(?:st|nd|rd|th)?[\s\-\/.]*[A-Za-z]{3,9}\.?[\s\-\/.,'’]*(?:\d{4}|\d{2})(?![\d:])/g, /\d{1,2}[\/\-.]\d{1,2}[\/\-.](?:\d{4}|\d{2})(?![\d:])/g, /[A-Za-z]{3,9}\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/g];
  for (const re of res) for (const m of text.matchAll(re)) { const d = parseDateCell(m[0], true); if (d) found.push(d); }
  found.sort();
  return found.length ? { from: found[0], to: found[found.length - 1] } : null;
}
// No column headings found: read each line as date, details, then amounts at the end.
function pdfFallbackRows(lines) {
  const out = [['Date', 'Details', 'Amount', 'Dr / Cr', 'Balance']];
  let prevBal = null;
  for (const l of lines) {
    const items = l.items.map((i) => i.s);
    if (!items.length || !isDateLike(items[0])) {
      const last = out[out.length - 1];
      if (out.length > 1 && !items.some(isAmountLikeStrict) && !SUMMARY_LINE.test(lineText(l))) last[1] = (last[1] + ' ' + items.join(' ')).trim();
      continue;
    }
    const nums = []; let k = items.length - 1;
    while (k > 0 && isAmountLikeStrict(items[k]) && nums.length < 3) { nums.unshift(items[k]); k--; }
    if (!nums.length) continue;
    const desc = items.slice(1, k + 1).filter((x) => !isDateLike(x)).join(' ');
    const balS = nums.length >= 2 ? nums[nums.length - 1] : '';
    const bal = balS ? parseAmount(balS) : null;
    let amtS = nums.length >= 2 ? nums[nums.length - 2] : nums[0], type = '';
    if (nums.length === 3) {
      const w = parseAmount(nums[0]), d = parseAmount(nums[1]);
      if (w && w.v) { amtS = nums[0]; type = 'DR'; } else if (d && d.v) { amtS = nums[1]; type = 'CR'; }
    }
    const a = parseAmount(amtS);
    if (bal && prevBal != null && a) type = bal.v < prevBal ? 'DR' : 'CR';
    else if (!type && a && a.hint) type = a.hint.toUpperCase();
    if (bal) prevBal = bal.v;
    out.push([items[0], desc, amtS, type, balS]);
  }
  return out;
}
async function rowsFromPDF(buf, password) {
  const lib = await loadPDFJS();
  let pdf;
  try {
    pdf = await lib.getDocument({ data: new Uint8Array(buf.slice(0)), password: password || undefined, isEvalSupported: false, disableFontFace: true, useSystemFonts: false, stopAtErrors: false }).promise;
  } catch (e) {
    if (e && (e.name === 'PasswordException' || e.code === 1 || e.code === 2)) { const err = new Error('locked'); err.needPassword = true; err.wrong = e.code === 2; throw err; }
    throw userError('Couldn\'t open this PDF. Download it again, or import the Excel or CSV version.');
  }
  const lines = [];
  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const items = [];
      for (const it of tc.items) {
        const s = String(it.str || '').replace(/\s+/g, ' ').trim();
        if (!s || !it.transform) continue;
        const h = Math.abs(it.transform[3]) || Math.abs(it.height) || 8;
        items.push({ s, x: it.transform[4], y: it.transform[5], w: it.width > 0 ? it.width : s.length * h * 0.5, h });
      }
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      const pageLines = [];
      for (const it of items) {
        const last = pageLines[pageLines.length - 1];
        if (last && Math.abs(last.y - it.y) <= Math.max(1.5, Math.min(last.h, it.h) * 0.45)) { last.items.push(it); last.h = Math.max(last.h, it.h); }
        else pageLines.push({ y: it.y, h: it.h, page: p, items: [it] });
      }
      for (const l of pageLines) { l.items.sort((a, b) => a.x - b.x); lines.push(l); }
      if (page.cleanup) page.cleanup();
    }
  } catch (e) {
    throw userError('Couldn\'t read the text in this PDF. Import the Excel or CSV version instead.');
  } finally { try { pdf.destroy(); } catch (e) { /* already closed */ } }
  if (!lines.length) throw userError('This PDF is a scanned image, so there\'s no text to read. Download the statement from net banking as a regular PDF, or as Excel or CSV.');
  return pdfLinesToRows(lines);
}
async function rowsFromFile(buf) {
  const u8 = new Uint8Array(buf);
  if (!u8.length) throw userError('This file is empty.');
  if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) return rowsFromPDF(buf, IMP.password);
  if ((u8[0] === 0x50 && u8[1] === 0x4b) || (u8[0] === 0xd0 && u8[1] === 0xcf)) return readWorkbook(buf);
  const text = decodeText(u8);
  const lead = text.replace(/^﻿/, '').trimStart().slice(0, 400).toLowerCase();
  if (lead.startsWith('<')) {
    if (/urn:schemas-microsoft-com:office:spreadsheet|<workbook/i.test(text.slice(0, 3000))) { const r = rowsFromXML2003(text); if (r.length) return r; }
    if (/<table/i.test(text)) { const r = rowsFromHTML(text); if (r.length) return r; }
    return readWorkbook(buf);
  }
  return parseCSV(text);
}

function monIndex(s) { const i = MON.findIndex((m) => m.toLowerCase() === String(s).slice(0, 3).toLowerCase()); return i >= 0 ? i + 1 : 0; }
function mkDate(y, mo, d) {
  if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const dt = new Date(y, mo - 1, d);
  return dt.getMonth() === mo - 1 ? ymd(dt) : null;
}
function parseDateCell(v, dayFirst) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    if (v > 25000 && v < 75000) { const dt = new Date(Math.round((Math.floor(v) - 25569) * 86400000)); return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()); }
    return null;
  }
  if (v instanceof Date) return isNaN(v) ? null : ymd(v);
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?!\d)/))) return mkDate(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})(?![\d:])/))) return dayFirst ? mkDate(+m[3], +m[2], +m[1]) : mkDate(+m[3], +m[1], +m[2]);
  if ((m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-\/.,'’]*([A-Za-z]{3,9})\.?[\s\-\/.,'’]*(\d{2}|\d{4})(?![\d:])/))) { const mo = monIndex(m[2]); if (mo) return mkDate(+m[3], mo, +m[1]); }
  if ((m = s.match(/^([A-Za-z]{3,9})\.?[\s\-\/.]*(\d{1,2})(?:st|nd|rd|th)?[\s,\-\/.'’]*(\d{2}|\d{4})(?![\d:])/))) { const mo = monIndex(m[1]); if (mo) return mkDate(+m[3], mo, +m[2]); }
  if (/^\d{5}(\.\d+)?$/.test(s)) return parseDateCell(Number(s), dayFirst);
  return null;
}
// "15 Oct" or "Oct 15" with no year (UPI app statements); rest is whatever follows, like the time.
function parseDayMonth(s) {
  const t = String(s == null ? '' : s).trim();
  let m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-\/.]*([A-Za-z]{3,9})\.?(?![A-Za-z])\s*(.*)$/);
  if (m) { const mo = monIndex(m[2]), d = +m[1]; if (mo && d >= 1 && d <= 31) return { d, m: mo, rest: m[3] }; }
  m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?!\d)\s*(.*)$/);
  if (m) { const mo = monIndex(m[1]), d = +m[2]; if (mo && d >= 1 && d <= 31) return { d, m: mo, rest: m[3] }; }
  return null;
}
function addDays(s, k) { const d = parseYMD(s); d.setDate(d.getDate() + k); return ymd(d); }
function guessYear(dm, period) {
  if (period) {
    for (const y of [Number(period.to.slice(0, 4)), Number(period.from.slice(0, 4))]) {
      const s = y + '-' + pad(dm.m) + '-' + pad(dm.d);
      if (s >= addDays(period.from, -3) && s <= addDays(period.to, 3)) return y;
    }
    return Number(period.to.slice(0, 4));
  }
  const now = new Date();
  let y = now.getFullYear();
  if (new Date(y, dm.m - 1, dm.d) > new Date(now.getTime() + 86400000)) y--;
  return y;
}
function parseAmount(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? { v, hint: null } : null;
  let s = String(v).trim();
  if (!s || /^[-–—]+$/.test(s) || /^(na|n\/a|nil|null|none)$/i.test(s)) return null;
  let hint = null;
  if (/\bdr\.?\s*$/i.test(s)) hint = 'dr'; else if (/\bcr\.?\s*$/i.test(s)) hint = 'cr';
  const neg = /^\(.*\)$/.test(s) || /^[-−]/.test(s) || /\d\s*-$/.test(s);
  s = s.replace(/₹|rs\.?|inr/ig, '').replace(/\b(dr|cr)\.?/ig, '').replace(/[^0-9.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  if (!/\d/.test(s)) return null;
  const n = parseFloat(s);
  return isFinite(n) ? { v: neg ? -n : n, hint } : null;
}
const normH = (v) => String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
const isTypeH = (c) => /^(dr|cr)\s*\/\s*(cr|dr)$|^(debit|credit)\s*\/\s*(credit|debit)$|^type$|txn type|transaction type|^dr\/cr|^cr\/dr/.test(c);
function pickDateCol(cells) {
  const tests = [
    (c) => /^(transaction|txn|tran|trans)\.?\s*(posted\s*)?date/.test(c),
    (c) => /^date$/.test(c), (c) => /posted|post date|booking date/.test(c),
    (c) => /date/.test(c) && !/value/.test(c), (c) => /value d/.test(c)
  ];
  for (const t of tests) { const i = cells.findIndex(t); if (i >= 0) return i; }
  return -1;
}
function detectMapping(rows) {
  const limit = Math.min(rows.length, 80);
  for (let r = 0; r < limit; r++) {
    const cells = (rows[r] || []).map(normH);
    if (cells.filter(Boolean).length < 3) continue;
    const find = (test) => cells.findIndex(test);
    const date = pickDateCol(cells);
    const desc = find((c) => /narration|description|particular|remark|details|naration|transaction info/.test(c));
    if (date < 0 || desc < 0) continue;
    const out = find((c) => !isTypeH(c) && /withdraw|debit|^dr\.?$|^dr amount|paid out|money out|^dr \(/.test(c));
    const inn = find((c) => !isTypeH(c) && /deposit|^credit|credit amount|^cr\.?$|^cr amount|paid in|money in|^cr \(/.test(c));
    const amt = find((c) => !isTypeH(c) && /^amount|txn amount|transaction amount|^amt\b|amount \(/.test(c) && !/withdraw|deposit|debit|credit|balance/.test(c));
    const bal = find((c) => /balance|^bal\.?$|^bal /.test(c));
    const note = find((c, i) => i !== desc && /^notes?\b|^tags?\b|^remarks?$/.test(c));
    const base = { header: r, date, desc, bal, note, out: -1, inn: -1, amt: -1, type: -1, guessed: false };
    if (out >= 0 || inn >= 0) return Object.assign(base, { mode: 'split', out, inn });
    if (amt >= 0) {
      const types = cells.map((c, i) => (isTypeH(c) ? i : -1)).filter((i) => i >= 0);
      const after = types.find((i) => i > amt);
      return Object.assign(base, { mode: 'single', amt, type: after != null ? after : (types[0] != null ? types[0] : -1) });
    }
  }
  return guessMapping(rows);
}
function guessMapping(rows) {
  const sample = rows.slice(0, 200);
  const ncol = Math.max(0, ...sample.map((r) => r.length));
  if (!ncol) return null;
  const dateScore = Array(ncol).fill(0), numScore = Array(ncol).fill(0), textLen = Array(ncol).fill(0);
  for (const r of sample) for (let c = 0; c < ncol; c++) {
    const v = r[c];
    if (typeof v === 'string' && parseDateCell(v, true)) dateScore[c]++;
    else if (parseAmount(v)) numScore[c]++;
    else if (typeof v === 'string') textLen[c] += v.length;
  }
  const argmax = (a) => a.reduce((bi, x, i) => (x > a[bi] ? i : bi), 0);
  const date = argmax(dateScore);
  if (dateScore[date] < 2) return null;
  const desc = argmax(textLen.map((l, i) => (i === date ? -1 : l)));
  const nums = [...Array(ncol).keys()].filter((c) => c !== date && c !== desc && numScore[c] >= 2);
  const base = { header: -1, date, desc, bal: -1, note: -1, out: -1, inn: -1, amt: -1, type: -1, guessed: true };
  if (nums.length >= 3) return Object.assign(base, { mode: 'split', out: nums[nums.length - 3], inn: nums[nums.length - 2], bal: nums[nums.length - 1] });
  if (nums.length === 2) return Object.assign(base, { mode: 'single', amt: nums[0], bal: nums[1] });
  if (nums.length === 1) return Object.assign(base, { mode: 'single', amt: nums[0] });
  return null;
}
function blankMapping(rows) {
  return { header: -1, date: 0, desc: Math.min(1, (rows[0] || []).length - 1), bal: -1, note: -1, out: -1, inn: -1, amt: -1, type: -1, mode: 'single', guessed: true };
}
function extractRows(rows, map) {
  const items = [];
  if (!map) return { items, allPositive: false };
  const start = map.header + 1;
  let dayFirst = null;
  for (let r = start; r < rows.length && dayFirst !== true; r++) {
    const v = rows[r] && rows[r][map.date];
    const m = typeof v === 'string' && v.trim().match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
    if (!m) continue;
    if (+m[1] > 12) dayFirst = true; else if (+m[2] > 12) dayFirst = false;
  }
  if (dayFirst == null) dayFirst = true;
  const cell = (row, i) => (i >= 0 ? row[i] : '');
  let anyNeg = false;
  const pending = [];
  for (let r = start; r < rows.length; r++) {
    const row = rows[r] || [];
    const d = parseDateCell(row[map.date], dayFirst);
    if (!d) continue;
    const raw = String(cell(row, map.desc) == null ? '' : cell(row, map.desc)).replace(/\s+/g, ' ').trim();
    const note = map.note >= 0 ? String(cell(row, map.note) == null ? '' : cell(row, map.note)).replace(/\s+/g, ' ').trim() : '';
    const balP = parseAmount(cell(row, map.bal));
    const b = balP ? round2(balP.hint === 'dr' ? -Math.abs(balP.v) : balP.v) : null;
    if (map.mode === 'split') {
      const w = parseAmount(cell(row, map.out)), dep = parseAmount(cell(row, map.inn));
      if (w && w.v) items.push({ d, raw, note, a: round2(Math.abs(w.v)), o: 1, b });
      else if (dep && dep.v) items.push({ d, raw, note, a: round2(Math.abs(dep.v)), o: 0, b });
    } else {
      const a = parseAmount(cell(row, map.amt));
      if (!a || !a.v) continue;
      const tp = normH(cell(row, map.type));
      let o = null;
      if (/^(dr|d|debit|withdrawal)\b/.test(tp)) o = 1; else if (/^(cr|c|credit|deposit)\b/.test(tp)) o = 0;
      else if (a.hint === 'dr') o = 1; else if (a.hint === 'cr') o = 0;
      else if (/^(received|credited|refund|cashback|reversal|money received|deposit)/i.test(raw)) o = 0;
      else if (/^(paid|sent|debited|transfer(red)? to|payment to|money sent)/i.test(raw)) o = 1;
      if (a.v < 0) anyNeg = true;
      pending.push({ d, raw, note, a, o, b });
    }
  }
  let allPositive = false;
  if (map.mode === 'single') {
    const unknown = pending.filter((p) => p.o == null);
    allPositive = !anyNeg && unknown.length > 0;
    for (const p of pending) {
      const o = p.o != null ? p.o : (anyNeg ? (p.a.v < 0 ? 1 : 0) : 1);
      items.push({ d: p.d, raw: p.raw, note: p.note, a: round2(Math.abs(p.a.v)), o, b: p.b });
    }
  }
  return { items, allPositive };
}
const SELF_CAT = 'self transfer';
// The UPI reference number, so a payment seen in both a UPI-app statement and the bank statement is added once.
function upiRef(raw) {
  const s = String(raw || '');
  let m = s.match(/upi ref(?:erence)?(?:\s*no\.?)?\s*:?\s*(\d{12})(?!\d)/i);
  if (m) return m[1];
  if (!/upi/i.test(s)) return '';
  m = s.match(/(?:^|\D)(\d{12})(?!\d)/);
  return m ? m[1] : '';
}
// A notes column like "Note: dinner Tag: # Food" gives the note and the app's own tag.
function splitNotes(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return { note: '', tag: '', text: '' };
  const nm = t.match(/note:\s*(.*?)(?=\s*tags?:|\s*#|$)/i);
  const tm = t.match(/#\s*([A-Za-z][A-Za-z0-9 &\-]*)/);
  return { note: nm ? nm[1].trim() : (/tags?:|#/i.test(t) ? '' : t), tag: tm ? tm[1].trim() : '', text: t };
}
function prepareImport(items) {
  const seen = Object.create(null);
  const fresh = [], markSelf = []; let dup = 0, auto = 0, self = 0;
  const refs = new Map();
  for (const t of Object.values(state.txns)) { const r = upiRef(t.r); if (r) { if (!refs.has(r)) refs.set(r, []); refs.get(r).push(t); } }
  const desc = items.length > 1 && items[0].d > items[items.length - 1].d;
  const ordered = desc ? items.slice().reverse() : items;
  ordered.forEach((it, idx) => {
    const nt = splitNotes(it.note);
    const raw = (it.raw + (nt.text ? ' · ' + nt.text : '')).trim();
    const base = [it.d, raw, it.a.toFixed(2), it.o, it.b == null ? '' : it.b.toFixed(2)].join('|');
    const occ = (seen[base] = (seen[base] || 0) + 1);
    const id = 't' + cyrb53(base + (occ > 1 ? '#' + occ : '')).toString(36);
    if (state.txns[id]) { dup++; return; }
    const m = extractMerchant(it.raw);
    const isSelf = /self[\s-]?transfer/i.test(nt.tag) || m === 'UPI Lite top-up' || m === 'Self transfer';
    const ref = upiRef(raw);
    const same = ref && (refs.get(ref) || []).find((o) => Math.abs(o.a - it.a) < 0.01);
    if (same) { dup++; if (isSelf && same.c !== SELF_CAT && (!same.c || same.f)) markSelf.push(same.id); return; }
    const t = { id, d: it.d, m, k: merchantKey(m), a: it.a, o: it.o, b: it.b, r: raw.slice(0, 300), c: null, f: 0, n: nt.note.slice(0, 200), i: '', s: idx };
    const rule = state.rules[ruleKey(t)];
    if (rule && rule.c) { t.c = rule.c; t.f = 1; auto++; }
    else if (isSelf) { t.c = SELF_CAT; t.f = 1; self++; }
    fresh.push(t);
  });
  const dates = ordered.map((x) => x.d).sort();
  return { fresh, dup, auto, self, markSelf, total: items.length, from: dates[0] || '', to: dates[dates.length - 1] || '' };
}
function commitImport(prep, name, sample) {
  const impId = 'i' + Date.now().toString(36);
  const months = new Set();
  if ((prep.fresh.some((t) => t.c === SELF_CAT) || (prep.markSelf || []).length) && !findCat(SELF_CAT)) state.cats.push({ n: SELF_CAT, b: 0, x: true });
  for (const id of prep.markSelf || []) { const o = state.txns[id]; if (o) { o.c = SELF_CAT; o.f = 1; months.add(monthOf(o)); } }
  for (const t of prep.fresh) { t.i = impId; state.txns[t.id] = t; months.add(monthOf(t)); if (t.c) ensureCat(t.c); }
  state.imports.unshift({ id: impId, name: String(name || 'Statement').slice(0, 80), at: Date.now(), n: prep.fresh.length, from: prep.from, to: prep.to, sample: !!sample });
  markDirty(true, months);
  return months;
}
function sampleCSV() {
  const now = new Date();
  const base = now.getDate() >= 15 ? thisMonth() : shiftMonth(thisMonth(), -1);
  const [y, mo] = base.split('-');
  const rows = [
    [1, 'NEFT-SBIN226274118245-MONTHLY ALLOWANCE-ANITA DESAI', 0, 8000],
    [2, 'UPI/Swiggy Limited/swiggy.stores@axisbank/Order/AXIS BANK/627512345678/ICI3f9a12c4be7d48e1a09c55f2', 312, 0],
    [3, 'UPI/Uber India Syst/uber.india@hdfcbank/Trip/HDFC BANK LTD/627612398412/ICI8b21c0d9f3e64a7c9b1e2a77', 186, 0],
    [4, 'UPI/Campus Canteen/q482915573@ybl/Payment from Ph/YES BANK L/627712345901/ICI0c7d3e1b5a294f68a2d4c9e1', 90, 0],
    [5, 'UPI/Amazon Pay/amazonpay@apl/Pay/AXIS BANK/627812341120/ICI6e5f4a3b2c1d40e9f8a7b6c5', 1249, 0],
    [6, 'UPI/Blinkit/blinkit.payu@hdfcbank/Order/HDFC BANK LTD/627912349034/ICIa1b2c3d4e5f6478890abcdef', 264, 0],
    [7, 'UPI/Swiggy Limited/swiggy.stores@axisbank/Order/AXIS BANK/628012341789/ICI2b3c4d5e6f7a48b9c0d1e2f3', 428, 0],
    [8, 'UPI/ROHAN MEHTA/rohanmehta@okaxis/split dinner/AXIS BANK/628112345566/AXI9f8e7d6c5b4a4392817f6e5d', 0, 350],
    [9, 'UPI/Rapido/rapido.rzp@icici/Ride/ICICI BANK LTD/628212340077/ICI5c4b3a2f1e0d4c9b8a7f6e5d', 74, 0],
    [10, 'UPI/Jio Prepaid Recharge/jiomobility@hsbc/Recharge/HSBC/628312342208/ICI7d6c5b4a3f2e41d0c9b8a7f6', 349, 0],
    [11, 'UPI/Uber India Syst/uber.india@hdfcbank/Trip/HDFC BANK LTD/628412347731/ICI4a3b2c1d0e9f48a7b6c5d4e3', 212, 0],
    [12, 'UPI/Cafe Coffee Day/ccd.payu@hdfcbank/Pay/HDFC BANK LTD/628512341460/ICI9e8d7c6b5a4f43e2d1c0b9a8', 220, 0],
    [13, 'UPI/DMART AVENUE SUPERMARTS/dmart@icici/Pay/ICICI BANK LTD/628612345120/ICI1f2e3d4c5b6a47980a1b2c3d', 683, 0],
    [14, 'UPI/Swiggy Limited/swiggy.stores@axisbank/Order/AXIS BANK/628712340398/ICI8c9d0e1f2a3b44c5d6e7f8a9', 265, 0],
    [15, 'UPI/Campus Canteen/q482915573@ybl/Payment from Ph/YES BANK L/628812346619/ICI3a4b5c6d7e8f4901a2b3c4d5', 120, 0]
  ];
  let bal = 4450;
  const lines = ['S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,Withdrawal Amount (INR ),Deposit Amount (INR ),Balance (INR )'];
  rows.forEach(([day, remark, out, dep], i) => {
    bal = round2(bal - out + dep);
    const d = pad(day) + '/' + mo + '/' + y;
    lines.push([i + 1, d, d, '', '"' + remark + '"', out.toFixed(2), dep.toFixed(2), bal.toFixed(2)].join(','));
  });
  return lines.join('\n');
}

/* ================= saving: this device ================= */
// The whole book lives in this browser's storage. A backup (under Categories) moves it to another device.
const LS_KEY = 'hisaab-book.v1';
const store = { mode: 'loading', timer: 0 };
let booted = false, pendingRender = false;

function packTxn(t) {
  const o = { d: t.d, m: t.m, k: t.k, a: t.a, o: t.o, r: t.r, i: t.i, s: t.s };
  if (t.b != null) o.b = t.b;
  if (t.c) o.c = t.c;
  if (t.f) o.f = 1;
  if (t.n) o.n = t.n;
  return o;
}
function unpackTxn(id, o) {
  if (!o || typeof o.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.d)) return null;
  const b = o.b == null || o.b === '' || isNaN(Number(o.b)) ? null : Number(o.b);
  return { id, d: o.d, m: String(o.m || 'Unknown').slice(0, 60), k: String(o.k || ''), a: Math.abs(Number(o.a)) || 0, o: o.o ? 1 : 0, r: String(o.r || '').slice(0, 300), i: String(o.i || ''), s: Number(o.s) || 0, b, c: o.c ? cleanCatName(o.c) || null : null, f: o.f ? 1 : 0, n: o.n ? String(o.n).slice(0, 200) : '' };
}
const metaBody = () => ({ v: 1, cats: state.cats, rules: state.rules, imports: state.imports, limit: state.limit || 0 });
function applyMeta(b) {
  b = b || {};
  state.limit = Math.max(0, Math.round(Number(b.limit) || 0));
  const seen = new Set();
  state.cats = (Array.isArray(b.cats) ? b.cats : []).map((c) => ({ n: cleanCatName(c && c.n), b: Math.max(0, Number(c && c.b) || 0), x: !!(c && c.x) }))
    .filter((c) => { const l = c.n.toLowerCase(); if (!c.n || seen.has(l)) return false; seen.add(l); return true; });
  state.rules = {};
  if (b.rules && typeof b.rules === 'object') for (const [k, r] of Object.entries(b.rules)) if (r && r.c && /^[oi]:/.test(k)) state.rules[k] = { c: cleanCatName(r.c), m: String(r.m || k.slice(2)).slice(0, 60), u: Number(r.u) || 0 };
  state.imports = (Array.isArray(b.imports) ? b.imports : []).filter(Boolean).map((x) => ({ id: String(x.id || ''), name: String(x.name || 'Statement').slice(0, 80), at: Number(x.at) || 0, n: Number(x.n) || 0, from: String(x.from || ''), to: String(x.to || ''), sample: !!x.sample }));
}
function bookData() {
  const txns = {};
  for (const t of Object.values(state.txns)) txns[t.id] = packTxn(t);
  return { meta: metaBody(), txns };
}
// Save shortly after any change.
function markDirty() {
  clearTimeout(store.timer);
  if (store.mode === 'local') store.timer = setTimeout(saveLocal, 250);
}
function readLocal() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function saveLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(bookData()));
    setStatus('local');
  } catch (e) { setStatus('local-bad'); }
}
function loadLocal(local) {
  applyMeta(local.meta || {});
  state.txns = {};
  for (const [id, o] of Object.entries(local.txns || {})) { const t = unpackTxn(id, o); if (t) state.txns[id] = t; }
}
function setStatus(s) {
  const el = $('#sync'); if (!el) return;
  const map = {
    loading: ['Opening…', 'idle', ''],
    local: ['Saved', 'ok', 'Saved on this device. To move your book to your phone or another computer, save a backup under Categories.'],
    'local-bad': ['Not saved', 'bad', 'This browser blocked saving. Your changes last until you close the page.']
  };
  const [text, st, title] = map[s] || map.loading;
  el.textContent = text; el.dataset.state = st; el.title = title;
}
function startLocal() {
  store.mode = 'local';
  const local = readLocal();
  if (local) loadLocal(local);
  setStatus('local');
  // Ask the browser not to clear the book when the device runs low on space.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* not supported */ }
  if (!booted) { booted = true; onBoot(); } else render();
}

/* ================= UI state ================= */
const ui = {
  tab: 'sort', month: null, pieAll: false,
  sort: { mode: 'todo', scope: 'all', queue: [], i: 0, built: false, draft: null },
  hist: { q: '', filter: 'all', cat: null },
  memQ: ''
};
const CF = {};
let SHEET = null;
const IMP = { step: 'pick', name: '', rows: null, map: null, prep: null, error: '', sample: false, allPositive: false, password: '', pending: null, pwWrong: false };

function defaultMonth() { const ms = monthsWithData(); return ms.length ? ms[ms.length - 1] : thisMonth(); }
function onBoot() {
  const h = (location.hash || '').replace('#', '');
  if (['sort', 'budget', 'history', 'categories'].includes(h)) ui.tab = h;
  if (!ui.month) ui.month = defaultMonth();
  render();
}

/* ================= rendering ================= */
function render() {
  renderTabs();
  if (!booted) return;
  const v = $('#view');
  const html = ui.tab === 'budget' ? viewBudget() : ui.tab === 'history' ? viewHistory() : ui.tab === 'categories' ? viewCats() : viewSort();
  v.innerHTML = '<div class="stack">' + html + '</div>';
  v.setAttribute('aria-labelledby', 'tab-' + ui.tab);
  afterRender();
}
function softRender() {
  const a = document.activeElement;
  if (a && a.closest && a.closest('#view, .sheet') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { pendingRender = true; return; }
  render();
}
document.addEventListener('focusout', () => setTimeout(() => {
  const a = document.activeElement;
  if (pendingRender && !(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { pendingRender = false; render(); }
}, 0));
function renderTabs() {
  for (const b of $$('.tab')) b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab));
  const n = booted ? Object.values(state.txns).filter((t) => !t.c).length : 0;
  $('#badge-sort').textContent = n ? String(n) : '';
}
function afterRender() {
  if (ui.tab === 'sort') {
    const t = currentTxn();
    if (t && $('#s-cat')) {
      cfInit('s', t);
      if (finePointer && !SHEET) { const inp = $('#s-cat'); inp.focus({ preventScroll: true }); if (inp.value) inp.select(); }
    }
  }
}
function sampleBanner() {
  const s = state.imports.find((i) => i.sample && Object.values(state.txns).some((t) => t.i === i.id));
  if (!s) return '';
  return '<div class="banner" role="note"><span>' + icon('info') + 'You\'re looking at example data from a sample statement.</span><button type="button" class="btn small" data-act="remove-import" data-id="' + esc(s.id) + '">Remove sample</button></div>';
}

/* ---------- Sort ---------- */
const modeTest = (mode) => (mode === 'todo' ? (t) => !t.c : mode === 'auto' ? (t) => !!(t.c && t.f) : () => true);
const inScope = (t, scope) => scope === 'all' || t.d.startsWith(scope);
function buildQueue() {
  const S = ui.sort; const test = modeTest(S.mode);
  if (S.scope !== 'all' && !monthsWithData().includes(S.scope)) S.scope = 'all';
  S.queue = allTxns().filter((t) => inScope(t, S.scope) && test(t)).map((t) => t.id);
  S.i = 0;
  if (S.mode === 'all') { const j = S.queue.findIndex((id) => !state.txns[id].c); S.i = j >= 0 ? j : 0; }
  S.built = true; S.draft = null;
}
function currentTxn() {
  const S = ui.sort;
  while (S.i < S.queue.length && !state.txns[S.queue[S.i]]) S.queue.splice(S.i, 1);
  return S.i < S.queue.length ? state.txns[S.queue[S.i]] : null;
}
function advance() {
  const S = ui.sort; const test = modeTest(S.mode);
  let j = S.i + 1;
  while (j < S.queue.length) { const t = state.txns[S.queue[j]]; if (t && test(t)) break; j++; }
  S.i = Math.min(j, S.queue.length); S.draft = null;
}
function goPrev() {
  const S = ui.sort;
  let j = Math.min(S.i, S.queue.length) - 1;
  while (j >= 0 && !state.txns[S.queue[j]]) j--;
  if (j >= 0) { S.i = j; S.draft = null; return true; }
  return false;
}
function modeCounts(scope) {
  const c = { todo: 0, auto: 0, all: 0 };
  for (const t of Object.values(state.txns)) { if (!inScope(t, scope)) continue; c.all++; if (!t.c) c.todo++; if (t.c && t.f) c.auto++; }
  return c;
}
function viewSort() {
  if (!Object.keys(state.txns).length) return sortEmptyHTML();
  const S = ui.sort;
  if (!S.built) buildQueue();
  const t = currentTxn();
  return sampleBanner() + sortHeadHTML() + (t ? txnCardHTML(t) + sortFormHTML(t) : sortDoneHTML());
}
function sortHeadHTML() {
  const S = ui.sort; const n = S.queue.length;
  const done = S.queue.filter((id) => { const t = state.txns[id]; return t && (S.mode === 'auto' ? !t.f : !!t.c); }).length;
  const pos = Math.min(S.i + 1, n);
  const pct = n ? (done / n) * 100 : 100;
  const counts = modeCounts(S.scope);
  const months = monthsWithData().slice().reverse();
  const modes = [['todo', 'To sort'], ['auto', 'Auto-filled'], ['all', 'All']];
  return '<div class="sort-head"><h1 class="eyebrow gold">Categorize</h1>'
    + '<p class="count">' + (n ? '<b>' + pos + '</b>of ' + n + ' · ' + done + ' done' : '<b>0</b>to go') + '</p></div>'
    + '<div class="track" role="progressbar" aria-label="Sorted so far" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + pct + '%"></i><b style="left:' + pct + '%"></b></div>'
    + '<div class="sort-controls"><select id="sort-scope" class="select" aria-label="Which month to sort">'
    + '<option value="all">All months</option>' + months.map((m) => '<option value="' + m + '"' + (S.scope === m ? ' selected' : '') + '>' + monthLabel(m) + '</option>').join('')
    + '</select><div class="seg" role="group" aria-label="Which payments">'
    + modes.map(([k, l]) => '<button type="button" data-act="sort-mode" data-mode="' + k + '" aria-pressed="' + (S.mode === k) + '">' + l + ' <span class="n">' + counts[k] + '</span></button>').join('')
    + '</div></div>';
}
function txnCardHTML(t, inSheet) {
  return '<article class="' + (inSheet ? 'txn' : 'card txn') + '" aria-label="Payment">'
    + '<p class="date">' + esc(longDate(t.d)) + '</p>'
    + '<div class="txn-head"><h2 class="merchant">' + esc(t.m) + '</h2><p class="amount' + (t.o ? '' : ' in') + '">' + esc(signedAmt(t)) + '</p></div>'
    + '<div class="txn-meta"><div class="tags">'
    + (t.o ? '<span class="tag out">' + icon('up') + 'Money out</span>' : '<span class="tag in">' + icon('down') + 'Money in</span>')
    + (t.c ? '<span class="tag cat">' + icon('tag') + esc(t.c) + '</span>' : '')
    + (t.c && t.f ? '<span class="tag auto">' + icon('memory') + 'Filled from memory</span>' : '')
    + (t.i === 'm' ? '<span class="tag">Added by you</span>' : '')
    + '</div>' + (t.b != null ? '<p class="bal">Balance after · ' + inr(t.b, 2) + '</p>' : '') + '</div>'
    + (t.r && t.i !== 'm' ? '<pre class="raw">' + esc(t.r) + '</pre>' : '')
    + '</article>';
}
function catFieldsHTML(p, val, note) {
  return '<label class="eyebrow" for="' + p + '-cat">Category</label>'
    + '<div class="cat-wrap"><span class="cat-ghost" id="' + p + '-ghost" aria-hidden="true"></span>'
    + '<input id="' + p + '-cat" class="cat-input" value="' + esc(val) + '" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Type a category or pick one" maxlength="40"></div>'
    + '<div class="chips" id="' + p + '-chips" role="group" aria-label="Your categories"></div>'
    + '<div class="remember" id="' + p + '-remember"></div>'
    + '<label class="eyebrow note-label" for="' + p + '-note">Note</label>'
    + '<input id="' + p + '-note" class="input note" value="' + esc(note) + '" placeholder="Optional" autocomplete="off" enterkeyhint="go" maxlength="200">';
}
function sortFormHTML(t) {
  const S = ui.sort;
  const d = S.draft && S.draft.id === t.id ? S.draft : null;
  return '<form class="card catform" id="s-form" novalidate>'
    + catFieldsHTML('s', d ? d.cat : (t.c || ''), d ? d.note : (t.n || ''))
    + '<div class="actions">'
    + '<button type="button" class="btn" data-act="prev"' + (S.i <= 0 ? ' disabled' : '') + '>' + icon('left') + 'Previous</button>'
    + '<button type="button" class="btn" data-act="skip">' + icon('right') + 'Skip</button>'
    + '<span class="spacer"></span><span class="kbd-hint">↵ save · ' + (isMac ? '⌘[ ⌘]' : 'Ctrl [ ]') + ' move · Tab completes</span>'
    + '<button type="submit" class="btn primary">Save &amp; Next</button></div></form>';
}
function sortDoneHTML() {
  const S = ui.sort;
  const left = Object.values(state.txns).filter((t) => !t.c && inScope(t, S.scope)).length;
  const auto = Object.values(state.txns).filter((t) => t.c && t.f && inScope(t, S.scope)).length;
  const m = S.scope === 'all' ? defaultMonth() : S.scope;
  let title, text, main;
  if (S.mode === 'auto') { title = 'All checked'; text = 'You\'ve been through every payment filled in from memory.'; }
  else if (left) { title = 'End of the list'; text = plural(left, 'payment') + ' still ' + (left === 1 ? 'needs' : 'need') + ' a category. You skipped ' + (left === 1 ? 'it' : 'them') + ' on the way through.'; }
  else { title = 'All sorted'; text = 'Every payment' + (S.scope === 'all' ? '' : ' in ' + monthLabel(S.scope)) + ' has a category.'; }
  if (left) main = '<button type="button" class="btn primary" data-act="sort-restart">Go through the ' + plural(left, 'unsorted payment') + '</button>';
  else main = '<button type="button" class="btn primary" data-act="go" data-tab="budget">See ' + esc(monthName(m)) + ' budget</button>';
  return '<div class="card done-card"><h2 class="display">' + title + '</h2><p class="lede">' + text + '</p><div class="btn-row">' + main
    + (auto && S.mode !== 'auto' ? '<button type="button" class="btn" data-act="sort-mode" data-mode="auto">Check the ' + auto + ' filled from memory</button>' : '')
    + '<button type="button" class="btn ghost" data-act="import">' + icon('upload') + 'Import another statement</button></div></div>';
}
function sortEmptyHTML() {
  const names = state.cats.slice(0, 7).map((c) => esc(c.n)).join(', ');
  return '<div class="sort-head"><h1 class="eyebrow gold">Categorize</h1><p class="count"><b>0</b>to go</p></div><div class="track"></div>'
    + '<div class="card done-card"><h2 class="display">Start with a bank statement</h2>'
    + '<p class="lede">Download your account statement from net banking as a PDF, Excel or CSV file and import it here. Each payment comes up one at a time for you to give it a category.</p>'
    + '<p class="lede">Every category you type is kept, and every merchant you sort is remembered. Next month\'s statement mostly sorts itself.</p>'
    + '<div class="btn-row"><button type="button" class="btn primary" data-act="import">' + icon('upload') + 'Import statement</button>'
    + '<button type="button" class="btn" data-act="sample">Try a sample statement</button>'
    + '<button type="button" class="btn ghost" data-act="add">' + icon('plus') + 'Add a cash spend</button>'
    + '<button type="button" class="btn ghost" data-act="restore">' + icon('download') + 'Restore a backup</button></div>'
    + (state.cats.length ? '<p class="fine">Your categories are ready: ' + names + (state.cats.length > 7 ? ' and ' + (state.cats.length - 7) + ' more' : '') + '. Change them under Categories.</p>' : '')
    + '</div>';
}

/* ---------- category field (shared by the sorter and the sheets) ---------- */
function cfInit(p, t) { CF[p] = { t, touched: false, remember: false, showAll: false, completion: null }; cfUpdate(p); }
function cfUpdate(p) {
  const st = CF[p]; const input = $('#' + p + '-cat'); const box = $('#' + p + '-chips');
  if (!st || !input || !box) return;
  const raw = input.value; const q = cleanCatName(raw).toLowerCase();
  const counts = catCounts();
  const order = state.cats.map((c, i) => ({ c, i })).sort((a, b) => (counts[b.c.n] || 0) - (counts[a.c.n] || 0) || a.i - b.i).map((x) => x.c);
  const exact = q ? order.find((c) => c.n.toLowerCase() === q) : null;
  const filtering = !!q && !exact;
  let list = order;
  if (filtering) {
    const pre = order.filter((c) => c.n.toLowerCase().startsWith(q));
    const sub = order.filter((c) => !c.n.toLowerCase().startsWith(q) && c.n.toLowerCase().includes(q));
    list = pre.concat(sub);
  }
  const LIMIT = 16;
  const shown = st.showAll || filtering ? list : list.slice(0, LIMIT);
  let html = shown.map((c) => '<button type="button" class="chip" data-act="chip" data-p="' + p + '" data-cat="' + esc(c.n) + '" aria-pressed="' + !!(exact && exact.n === c.n) + '">' + esc(c.n) + '</button>').join('');
  if (!st.showAll && !filtering && list.length > LIMIT) html += '<button type="button" class="chip more" data-act="chips-more" data-p="' + p + '">+' + (list.length - LIMIT) + ' more</button>';
  if (filtering) html += '<span class="chip new">' + icon('plus') + 'New category: ' + esc(cleanCatName(raw)) + '</span>';
  box.innerHTML = html;
  const top = filtering ? list.find((c) => c.n.toLowerCase().startsWith(raw.toLowerCase())) : null;
  st.completion = top && raw ? top.n : null;
  cfGhost(p);
  cfRemember(p);
}
function cfGhost(p) {
  const st = CF[p]; const input = $('#' + p + '-cat'); const ghost = $('#' + p + '-ghost');
  if (!st || !input || !ghost) return;
  const raw = input.value;
  ghost.innerHTML = st.completion && document.activeElement === input && input.selectionStart === raw.length
    ? '<span class="typed">' + esc(raw) + '</span>' + esc(st.completion.slice(raw.length)) : '';
}
function cfRemember(p) {
  const st = CF[p]; const el = $('#' + p + '-remember'); const input = $('#' + p + '-cat');
  if (!st || !el || !input) return;
  const t = st.t;
  const name = canonCat(input.value);
  if (!name || !t.k) { el.innerHTML = ''; st.remember = false; return; }
  const rule = state.rules[ruleKey(t)];
  const others = othersFor(t, name);
  if (rule && rule.c.toLowerCase() === name.toLowerCase()) {
    st.remember = true;
    el.innerHTML = '<p class="remembered">' + icon('memory') + '<span>Remembered: ' + esc(t.m) + ' is always <b>' + esc(rule.c) + '</b>' + (others ? '. Saving also fills ' + plural(others, 'more payment') + '.' : '') + '</span></p>';
    return;
  }
  if (!st.touched) st.remember = !rule;
  const label = rule ? 'Change what ' + esc(t.m) + ' fills in to <b>' + esc(name) + '</b>' : 'Remember <b>' + esc(name) + '</b> for ' + esc(t.m);
  const sub = rule ? 'Right now it fills in ' + esc(rule.c) + '.' : 'Future ' + esc(t.m) + ' payments get this category on import.';
  const also = others && st.remember ? ' Also fills ' + plural(others, 'unsorted payment') + ' now.' : '';
  el.innerHTML = '<label class="check"><input type="checkbox" id="' + p + '-rem"' + (st.remember ? ' checked' : '') + '><span>' + label + '<small>' + sub + also + '</small></span></label>';
}
function cfValues(p) {
  const st = CF[p] || {};
  return { cat: ($('#' + p + '-cat') || {}).value || '', note: ($('#' + p + '-note') || {}).value || '', remember: !!st.remember };
}

function doSortSave() {
  const t = currentTxn(); if (!t) return;
  const v = cfValues('s');
  const before = clone(state); const prevI = ui.sort.i;
  const filled = applyCategory(t, v.cat, v.note, v.remember);
  advance();
  render();
  if (filled) toast('Also filled ' + plural(filled, 'other ' + t.m + ' payment'), () => { restore(before); ui.sort.i = prevI; ui.sort.draft = null; render(); });
}

/* ---------- Budget ---------- */
function monthProgress(m) {
  const cur = thisMonth();
  if (m < cur) return 1; if (m > cur) return 0;
  return new Date().getDate() / daysIn(m);
}
function budgetStatus(spent, budget, prog, current) {
  const r = spent / budget;
  if (r > 1) return { cls: 'bad', ic: 'alert', text: 'Over by ' + inr(spent - budget) };
  if (current && r >= 0.5 && r > prog + 0.1) return { cls: 'warn', ic: 'alert', text: 'Ahead of pace · ' + inr(budget - spent) + ' left' };
  if (r >= 0.9) return { cls: 'warn', ic: 'alert', text: inr(budget - spent) + ' left' };
  return { cls: 'ok', ic: 'check', text: inr(budget - spent) + ' left' };
}
function niceCeil(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= v) return s * p;
  return 10 * p;
}
function monthNavHTML(m) {
  const months = monthsWithData();
  const min = months[0] || m, max = [months[months.length - 1] || m, thisMonth()].sort()[1];
  return '<div class="month-nav"><button type="button" class="icon-btn" data-act="month" data-step="-1" aria-label="Previous month"' + (m <= min ? ' disabled' : '') + '>' + icon('left') + '</button>'
    + '<h1 class="month-title">' + esc(monthLabel(m)) + '</h1>'
    + '<button type="button" class="icon-btn" data-act="month" data-step="1" aria-label="Next month"' + (m >= max ? ' disabled' : '') + '>' + icon('right') + '</button><span class="spacer"></span></div>';
}
function emptyCard(title, text) {
  return '<div class="card done-card"><h2 class="display">' + esc(title) + '</h2><p class="lede">' + esc(text) + '</p><div class="btn-row">'
    + '<button type="button" class="btn primary" data-act="import">' + icon('upload') + 'Import statement</button>'
    + '<button type="button" class="btn" data-act="sample">Try a sample statement</button>'
    + '<button type="button" class="btn ghost" data-act="add">' + icon('plus') + 'Add a cash spend</button></div></div>';
}
function viewBudget() {
  if (!Object.keys(state.txns).length) return emptyCard('Nothing to add up yet', 'Import a statement and sort a few payments. Each month\'s spending by category shows up here, with what\'s left of any budget you set.');
  const m = ui.month || defaultMonth();
  const all = txnsInMonth(m);
  const excluded = new Set(state.cats.filter((c) => c.x).map((c) => c.n));
  const counted = all.filter((t) => !t.c || !excluded.has(t.c));
  const outs = counted.filter((t) => t.o);
  const net = netSpend(counted);
  const spent = net.spent, income = net.income, paidBack = net.back;
  const prog = monthProgress(m), current = m === thisMonth();
  const budgets = state.cats.filter((c) => c.b > 0 && !c.x);
  const totalBudget = sum(budgets, (c) => c.b);
  const lastBal = all.slice().reverse().find((t) => t.b != null);

  let html = sampleBanner() + monthNavHTML(m);
  if (!all.length) return html + '<div class="card done-card"><h2 class="display">No payments in ' + esc(monthName(m)) + '</h2><p class="lede">Pick another month with the arrows, or import the statement for ' + esc(monthLabel(m)) + '.</p><div class="btn-row"><button type="button" class="btn primary" data-act="import">' + icon('upload') + 'Import statement</button></div></div>';

  html += '<section class="card summary" aria-label="Month summary"><div class="kpis">'
    + '<div class="kpi"><p class="eyebrow">Spent</p><p class="v">' + inr(spent) + '</p></div>'
    + '<div class="kpi"><p class="eyebrow">Money in</p><p class="v sm in">+' + inr(income) + '</p></div>'
    + (lastBal ? '<div class="kpi"><p class="eyebrow">Balance on ' + esc(shortDate(lastBal.d)) + '</p><p class="v sm">' + inr(lastBal.b, 2) + '</p></div>' : '')
    + '</div>';
  if (state.limit) {
    html += budgetLineHTML(spent, state.limit, 'monthly limit', prog, current, m, '<button type="button" class="btn ghost small" data-act="limit">Change limit</button>');
  } else if (totalBudget) {
    const budgetedSpent = sum(outs.filter((t) => t.c && budgets.some((c) => c.n === t.c)), (t) => t.a);
    html += budgetLineHTML(budgetedSpent, totalBudget, 'across ' + plural(budgets.length, 'budgeted category', 'budgeted categories'), prog, current, m, '<button type="button" class="btn ghost small" data-act="limit">Set a limit for everything</button>');
  } else {
    html += '<div class="budget-foot"><p class="fine">Set a monthly limit for all your spending, or give single categories a budget under Categories.</p><button type="button" class="btn small" data-act="limit">Set a monthly limit</button></div>';
  }
  if (paidBack) html += '<p class="fine">Spent is after ' + inr(paidBack) + ' people paid you back, taken off the categories those payments are sorted into.</p>';
  html += dailyChartHTML(m, outs, current) + '</section>';
  html += pieCardHTML(m, excluded);

  const by = new Map();
  for (const e of net.by.values()) if (e.out > 0) by.set(e.n, { n: e.n, amt: e.amt, cnt: e.cnt, back: e.back });
  for (const c of budgets) if (!by.has(c.n)) by.set(c.n, { n: c.n, amt: 0, cnt: 0 });
  const uncat = by.get(''); by.delete('');
  if (uncat) html += '<div class="callout"><p><b>' + inr(uncat.amt) + '</b> across ' + plural(uncat.cnt, 'payment') + ' doesn\'t have a category yet.</p><button type="button" class="btn small primary" data-act="sort-month" data-month="' + m + '">Sort them</button></div>';
  const rows = [...by.values()].sort((a, b) => b.amt - a.amt || a.n.localeCompare(b.n));
  const maxAmt = Math.max(1, ...rows.map((r) => r.amt));
  if (rows.length) {
    html += '<section class="card list-card" aria-label="Spending by category"><div class="list-head"><h2 class="eyebrow">By category</h2><button type="button" class="btn ghost small" data-act="go" data-tab="categories">Set budgets</button></div><div class="cat-rows">';
    for (const r of rows) {
      const cat = findCat(r.n); const b = cat && cat.b > 0 ? cat.b : 0;
      let meter, sub;
      if (b) {
        const st = budgetStatus(r.amt, b, prog, current);
        meter = '<div class="meter"><i class="' + (st.cls === 'ok' ? '' : st.cls) + '" style="width:' + Math.min(100, (r.amt / b) * 100) + '%"></i>' + (current ? '<b style="left:' + prog * 100 + '%"></b>' : '') + '</div>';
        sub = '<span>' + plural(r.cnt, 'payment') + (r.back ? ' · ' + inr(r.back) + ' paid back' : '') + ' · ' + inr(b) + ' budget</span><span class="status ' + st.cls + '">' + icon(st.ic) + esc(st.text) + '</span>';
      } else {
        meter = '<div class="meter"><i class="share" style="width:' + (r.amt / maxAmt) * 100 + '%"></i></div>';
        sub = '<span>' + plural(r.cnt, 'payment') + (r.back ? ' · ' + inr(r.back) + ' paid back' : '') + (spent ? ' · ' + Math.round((r.amt / spent) * 100) + '% of spending' : '') + '</span>';
      }
      html += '<button type="button" class="cat-row" data-act="filter-cat" data-cat="' + esc(r.n) + '"><span class="cat-row-head"><span class="name">' + esc(r.n) + '</span><span class="amt">' + inr(r.amt) + '</span></span>' + meter + '<span class="cat-row-sub">' + sub + '</span></button>';
    }
    html += '</div></section>';
  }
  const merch = new Map();
  for (const t of outs) { const e = merch.get(t.k) || { m: t.m, amt: 0, cnt: 0 }; e.amt += t.a; e.cnt++; merch.set(t.k, e); }
  const top = [...merch.values()].sort((a, b) => b.amt - a.amt).slice(0, 5);
  if (top.length > 1) {
    html += '<section class="card list-card" aria-label="Top merchants"><h2 class="eyebrow">Paid most to</h2><div class="cat-rows">'
      + top.map((x) => '<div class="merch-row"><span class="who">' + esc(x.m) + '<small>' + plural(x.cnt, 'payment') + '</small></span><span class="amt">' + inr(x.amt) + '</span></div>').join('') + '</div></section>';
  }
  const ex = all.filter((t) => t.c && excluded.has(t.c));
  if (ex.length) {
    const g = {}; for (const t of ex) g[t.c] = (g[t.c] || 0) + (t.o ? t.a : 0);
    const parts = Object.entries(g).filter(([, v]) => v > 0).map(([k, v]) => esc(k) + ' ' + inr(v));
    if (parts.length) html += '<p class="fine">Not counted in spending: ' + parts.join(' · ') + '.</p>';
  }
  return html;
}
function budgetLineHTML(spent, budget, label, prog, current, m, action) {
  const st = budgetStatus(spent, budget, prog, current);
  const daysLeft = current ? daysIn(m) - new Date().getDate() + 1 : 0;
  const perDay = current && spent < budget && daysLeft > 0 ? inr(Math.floor((budget - spent) / daysLeft)) + ' a day keeps you within it' : '';
  return '<div class="budget-line"><div class="budget-top"><span><b>' + inr(spent) + '</b> of ' + inr(budget) + ' ' + esc(label) + '</span>'
    + '<span class="status ' + st.cls + '">' + icon(st.ic) + esc(st.text) + '</span></div>'
    + '<div class="meter" role="img" aria-label="' + Math.round((spent / budget) * 100) + '% used"><i class="' + (st.cls === 'ok' ? '' : st.cls) + '" style="width:' + Math.min(100, (spent / budget) * 100) + '%"></i>' + (current ? '<b style="left:' + prog * 100 + '%" title="Today"></b>' : '') + '</div>'
    + '<div class="budget-foot"><p class="fine">' + esc(perDay) + '</p>' + action + '</div></div>';
}
// Spending per category after money people paid back into that category; what's left over stays as money in.
function netSpend(list) {
  const by = new Map();
  for (const t of list) {
    const k = t.c || '';
    const e = by.get(k) || { n: k, out: 0, inn: 0, cnt: 0 };
    if (t.o) { e.out += t.a; e.cnt++; } else e.inn += t.a;
    by.set(k, e);
  }
  let spent = 0, income = 0, back = 0;
  for (const e of by.values()) {
    e.back = e.n && e.out > 0 ? Math.min(e.out, e.inn) : 0;
    e.amt = round2(e.out - e.back);
    spent += e.amt; income += e.inn - e.back; back += e.back;
  }
  return { by, spent: round2(spent), income: round2(income), back: round2(back) };
}
const PIE_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#3fa34d', '#9085e9', '#6c6861'];
function pieCardHTML(m, excluded) {
  const all = ui.pieAll;
  const net = netSpend(Object.values(state.txns).filter((t) => (all || t.d.startsWith(m)) && (!t.c || !excluded.has(t.c))));
  const total = net.spent;
  if (!total) return '';
  let rows = [...net.by.values()].filter((e) => e.amt > 0).map((e) => ({ n: e.n || 'To sort', a: e.amt })).sort((x, y) => y.a - x.a);
  if (rows.length > 8) { const rest = rows.slice(7); rows = rows.slice(0, 7).concat([{ n: 'Other (' + rest.length + ')', a: sum(rest, (r) => r.a), other: rest }]); }
  const R = 70, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = rows.map((r, i) => {
    const len = (r.a / total) * C, gap = rows.length > 1 ? Math.min(2, len / 3) : 0;
    const el = '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="' + PIE_COLORS[i] + '" stroke-width="30" stroke-dasharray="' + Math.max(0, len - gap).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(r.n) + ': ' + inr(r.a) + ' (' + Math.round((r.a / total) * 100) + '%)</title></circle>';
    off += len; return el;
  }).join('');
  const legend = rows.map((r, i) => '<li><i style="background:' + PIE_COLORS[i] + '"></i><span class="pn">' + esc(r.n) + '</span><span class="pv">' + inr(r.a) + ' · ' + Math.round((r.a / total) * 100) + '%</span></li>').join('');
  const other = rows.find((r) => r.other);
  return '<section class="card" aria-label="Spending split"><div class="list-head" style="padding:0"><h2 class="eyebrow">Where the money went</h2>'
    + '<div class="seg" role="group" aria-label="Period"><button type="button" data-act="pie-scope" data-all="0" aria-pressed="' + !all + '">' + esc(monthName(m)) + '</button><button type="button" data-act="pie-scope" data-all="1" aria-pressed="' + all + '">All time</button></div></div>'
    + '<div class="pie-wrap"><svg viewBox="0 0 200 200" class="pie" role="img" aria-label="Spending by category, ' + esc(inr(total)) + ' in total"><g transform="rotate(-90 100 100)">' + arcs + '</g>'
    + '<text x="100" y="98" text-anchor="middle" class="pie-total">' + esc(inr(total)) + '</text><text x="100" y="118" text-anchor="middle" class="pie-sub">spent</text></svg>'
    + '<ul class="pie-legend">' + legend + '</ul></div>'
    + (other ? '<p class="fine">Other: ' + other.other.map((r) => esc(r.n) + ' ' + inr(r.a)).join(', ') + '.</p>' : '') + '</section>';
}
function dailyChartHTML(m, outs, current) {
  const days = daysIn(m);
  const per = Array(days).fill(0), cnt = Array(days).fill(0);
  for (const t of outs) { const d = Number(t.d.slice(8, 10)) - 1; per[d] += t.a; cnt[d]++; }
  const max = Math.max(...per);
  if (!max) return '';
  const top = niceCeil(max);
  const today = current ? new Date().getDate() - 1 : -1;
  const [y, mo] = m.split('-').map(Number);
  const bars = per.map((v, i) => {
    const dt = new Date(y, mo - 1, i + 1);
    const label = DAYS[dt.getDay()].slice(0, 3) + ' ' + (i + 1) + ' ' + MON[mo - 1];
    const aria = label + ': ' + (v ? inr(v) + ', ' + plural(cnt[i], 'payment') : 'nothing spent');
    return '<button type="button" class="day' + (v ? '' : ' zero') + (i === today ? ' today' : '') + '" style="--h:' + (v / top) * 100 + '%" data-tip-v="' + esc(v ? inr(v) : '₹0') + '" data-tip-l="' + esc(label + (v ? ' · ' + plural(cnt[i], 'payment') : '')) + '" aria-label="' + esc(aria) + '"><i></i></button>';
  }).join('');
  const ticks = [1, 8, 15, 22, days].filter((d, i, a) => a.indexOf(d) === i && !(d !== days && days - d < 3))
    .map((d) => '<span style="left:' + ((d - 0.5) / days) * 100 + '%">' + d + '</span>').join('');
  return '<div class="chart" id="chart"><div class="chart-head"><p class="eyebrow">Paid each day</p><p class="chart-top">Top line ' + compactINR(top) + '</p></div>'
    + '<div class="plot">' + bars + '</div><div class="xaxis" aria-hidden="true">' + ticks + '</div><div class="tip" id="chart-tip" hidden></div></div>';
}
function showTip(btn) {
  const tip = $('#chart-tip'); const chart = $('#chart');
  if (!tip || !chart || !btn) return;
  tip.innerHTML = '<b>' + esc(btn.dataset.tipV) + '</b><span>' + esc(btn.dataset.tipL) + '</span>';
  tip.hidden = false;
  const cr = chart.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const half = tip.offsetWidth / 2;
  const x = Math.max(half, Math.min(cr.width - half, br.left - cr.left + br.width / 2));
  tip.style.left = x + 'px';
  tip.style.top = (btn.parentElement.offsetTop - tip.offsetHeight - 6) + 'px';
  tip.style.bottom = 'auto';
}
function hideTip() { const tip = $('#chart-tip'); if (tip) tip.hidden = true; }

/* ---------- History ---------- */
function viewHistory() {
  if (!Object.keys(state.txns).length) return emptyCard('No payments yet', 'Every payment you import or add by hand is listed here by day, with its category. Tap one to change it.');
  const m = ui.month || defaultMonth(); const H = ui.hist;
  const filters = [['all', 'All'], ['out', 'Money out'], ['in', 'Money in'], ['todo', 'To sort'], ['auto', 'Auto-filled']];
  return sampleBanner() + monthNavHTML(m)
    + '<div class="hist-tools"><div class="search">' + icon('search') + '<input id="hist-q" class="input" type="search" placeholder="Search merchant, category or note" value="' + esc(H.q) + '" autocomplete="off" aria-label="Search payments"></div>'
    + '<div class="filter-row">' + filters.map(([k, l]) => '<button type="button" class="fchip" data-act="hist-filter" data-f="' + k + '" aria-pressed="' + (H.filter === k) + '">' + l + '</button>').join('')
    + (H.cat ? '<button type="button" class="fchip catf" data-act="hist-cat-clear" aria-label="Stop filtering by ' + esc(H.cat) + '">' + icon('tag') + esc(H.cat) + icon('x') + '</button>' : '')
    + '<span style="flex:1"></span><button type="button" class="btn small" data-act="add">' + icon('plus') + 'Add cash spend</button></div></div>'
    + '<div id="hist-list" class="stack">' + histListHTML() + '</div>';
}
function histListHTML() {
  const m = ui.month || defaultMonth(); const H = ui.hist;
  let list = txnsInMonth(m);
  if (H.cat) list = list.filter((t) => t.c === H.cat);
  if (H.filter === 'out') list = list.filter((t) => t.o);
  else if (H.filter === 'in') list = list.filter((t) => !t.o);
  else if (H.filter === 'todo') list = list.filter((t) => !t.c);
  else if (H.filter === 'auto') list = list.filter((t) => t.c && t.f);
  const q = H.q.trim().toLowerCase();
  if (q) list = list.filter((t) => (t.m + ' ' + t.r + ' ' + (t.c || '') + ' ' + t.n).toLowerCase().includes(q));
  if (!list.length) return '<p class="fine" style="padding:8px 4px">No payments match' + (q ? ' “' + esc(H.q.trim()) + '”' : '') + ' in ' + esc(monthLabel(m)) + '.</p>';
  list.reverse();
  const groups = [];
  for (const t of list) { const g = groups[groups.length - 1]; if (g && g.d === t.d) g.items.push(t); else groups.push({ d: t.d, items: [t] }); }
  const out = sum(list.filter((t) => t.o), (t) => t.a), inn = sum(list.filter((t) => !t.o), (t) => t.a);
  return '<p class="totals"><span><b>' + plural(list.length, 'payment') + '</b></span><span>Out <b>' + inr(out) + '</b></span><span>In <b>' + inr(inn) + '</b></span></p>'
    + groups.map((g) => {
      const dayOut = sum(g.items.filter((t) => t.o), (t) => t.a);
      return '<section class="day-group"><h3 class="day-head"><span>' + esc(dayHead(g.d)) + '</span><span>' + (dayOut ? '−' + inr(dayOut) : '') + '</span></h3><div class="rows">'
        + g.items.map((t) => '<button type="button" class="row" data-act="edit" data-id="' + t.id + '"><span class="row-main"><span class="row-title">' + esc(t.m) + '</span><span class="row-sub">'
          + (t.c ? '<span class="pill">' + (t.f ? icon('memory') : '') + esc(t.c) + '</span>' : '<span class="pill todo">To sort</span>')
          + (t.n ? '<span class="note">' + esc(t.n) + '</span>' : '') + '</span></span>'
          + '<span class="row-amt' + (t.o ? '' : ' in') + '">' + esc(signedAmt(t)) + '</span></button>').join('')
        + '</div></section>';
    }).join('');
}

/* ---------- Categories ---------- */
function viewCats() {
  const counts = catCounts();
  const ruleCount = {}; for (const r of Object.values(state.rules)) ruleCount[r.c] = (ruleCount[r.c] || 0) + 1;
  const cats = state.cats.slice().sort((a, b) => (counts[b.n] || 0) - (counts[a.n] || 0) || a.n.localeCompare(b.n));
  let html = '<section class="card"><div class="section-head"><h1 class="eyebrow gold">Categories</h1><span class="fine">' + plural(state.cats.length, 'category', 'categories') + '</span></div>'
    + '<form class="add-cat" id="add-cat-form" novalidate><input id="new-cat" class="input" placeholder="New category, like rent or gym" maxlength="40" autocomplete="off" aria-label="New category name"><button type="submit" class="btn">' + icon('plus') + 'Add</button></form>'
    + '<p class="err" id="new-cat-err"></p><div class="cat-list">';
  html += cats.length ? cats.map((c) => '<button type="button" class="cat-item' + (c.x ? ' off' : '') + '" data-act="edit-cat" data-cat="' + esc(c.n) + '"><span class="name">' + esc(c.n) + '</span><span class="meta">' + (counts[c.n] ? plural(counts[c.n], 'payment') : 'Not used yet')
    + (c.x ? ' · not counted' : c.b ? ' · <b>' + inr(c.b) + '</b> a month' : '') + (ruleCount[c.n] ? '<br>' + plural(ruleCount[c.n], 'merchant') + ' remembered' : '') + '</span>' + icon('right', 'chev') + '</button>').join('')
    : '<p class="fine" style="padding:12px 4px">No categories yet. Add one above, or type one while sorting.</p>';
  html += '</div></section>';

  const rules = Object.entries(state.rules).map(([k, r]) => Object.assign({ k }, r));
  html += '<section class="card"><div class="section-head"><h2 class="eyebrow gold">Remembered merchants</h2><span class="fine">' + plural(rules.length, 'merchant') + '</span></div>'
    + '<p class="fine" style="margin-top:8px">These fill in automatically when you import. Change one here and every payment it filled in changes too.</p>';
  if (rules.length) {
    if (rules.length > 8) html += '<div class="search" style="margin-top:12px">' + icon('search') + '<input id="mem-q" class="input" type="search" placeholder="Find a merchant" value="' + esc(ui.memQ) + '" autocomplete="off" aria-label="Find a remembered merchant"></div>';
    html += '<div class="rule-list" id="rule-list">' + ruleListHTML() + '</div>';
  } else html += '<p class="fine" style="margin-top:12px">Nothing yet. Leave “Remember” ticked when you sort a payment, and the merchant shows up here.</p>';
  html += '</section>';

  const imps = state.imports.filter((i) => Object.values(state.txns).some((t) => t.i === i.id));
  const manual = Object.values(state.txns).filter((t) => t.i === 'm').length;
  html += '<section class="card"><h2 class="eyebrow gold">Statements</h2>';
  if (imps.length || manual) {
    html += '<div class="imp-list">' + imps.map((i) => {
      const n = Object.values(state.txns).filter((t) => t.i === i.id).length;
      return '<div class="imp"><span class="what"><b>' + esc(i.name) + '</b><span>' + plural(n, 'payment') + (i.from ? ' · ' + esc(rangeLabel(i.from, i.to)) : '') + ' · imported ' + esc(shortDate(ymd(new Date(i.at)))) + '</span></span>'
        + '<button type="button" class="btn small danger" data-act="remove-import" data-id="' + esc(i.id) + '">' + icon('trash') + 'Remove</button></div>';
    }).join('') + (manual ? '<div class="imp"><span class="what"><b>Added by hand</b><span>' + plural(manual, 'payment') + '</span></span></div>' : '') + '</div>';
  } else html += '<p class="fine" style="margin-top:10px">No statements imported yet.</p>';
  html += '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn" data-act="import">' + icon('upload') + 'Import statement</button>'
    + (Object.keys(state.txns).length ? '<button type="button" class="btn" data-act="export">' + icon('download') + 'Save everything as CSV</button>' : '') + '</div></section>';
  html += '<section class="card"><h2 class="eyebrow gold">Backup</h2>'
    + '<p class="fine" style="margin-top:8px">Your book is saved on this device only. Save a backup now and then, and restore it on your phone or another computer to move your book there.</p>'
    + '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn" data-act="backup">' + icon('download') + 'Save a backup</button>'
    + '<button type="button" class="btn" data-act="restore">' + icon('upload') + 'Restore from backup</button></div></section>';
  return html;
}
function ruleListHTML() {
  const q = ui.memQ.trim().toLowerCase();
  const rules = Object.entries(state.rules).map(([k, r]) => Object.assign({ k }, r))
    .filter((r) => !q || r.m.toLowerCase().includes(q) || r.c.toLowerCase().includes(q))
    .sort((a, b) => a.m.localeCompare(b.m));
  if (!rules.length) return '<p class="fine" style="padding:12px 4px">No remembered merchant matches “' + esc(ui.memQ.trim()) + '”.</p>';
  const opts = state.cats.map((c) => c.n).sort((a, b) => a.localeCompare(b));
  return rules.map((r) => {
    const out = r.k.startsWith('o:');
    const list = opts.includes(r.c) ? opts : [r.c].concat(opts);
    return '<div class="rule"><span class="who">' + (out ? icon('up') : icon('down', 'in')) + '<span>' + esc(r.m) + '<span class="visually-hidden">' + (out ? ' (money out)' : ' (money in)') + '</span></span></span>'
      + '<select class="select" data-rule="' + esc(r.k) + '" aria-label="Category for ' + esc(r.m) + '">' + list.map((n) => '<option' + (n === r.c ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select>'
      + '<button type="button" class="btn small ghost" data-act="forget" data-rule="' + esc(r.k) + '">Forget</button></div>';
  }).join('');
}

/* ================= sheets ================= */
let lastFocus = null;
function openSheet(kind, data) {
  if (!SHEET) lastFocus = document.activeElement;
  SHEET = Object.assign({ kind }, data || {});
  renderSheet();
}
function closeSheet() {
  SHEET = null;
  $('#sheet-root').innerHTML = '';
  if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  if (pendingRender) { pendingRender = false; render(); }
}
function renderSheet() {
  if (!SHEET) return;
  let body = '', label = '';
  if (SHEET.kind === 'import') { body = importSheetHTML(); label = 'Import a statement'; }
  else if (SHEET.kind === 'edit') { const t = state.txns[SHEET.id]; if (!t) return closeSheet(); body = editSheetHTML(t); label = 'Edit payment'; }
  else if (SHEET.kind === 'add') { body = addSheetHTML(); label = 'Add a cash spend'; }
  else if (SHEET.kind === 'cat') { const c = findCat(SHEET.name); if (!c) return closeSheet(); body = catSheetHTML(c); label = 'Edit category'; }
  else if (SHEET.kind === 'limit') { body = limitSheetHTML(); label = 'Monthly limit'; }
  else if (SHEET.kind === 'restore') { body = restoreSheetHTML(); label = 'Restore a backup'; }
  $('#sheet-root').innerHTML = '<div class="sheet" data-act="scrim"><div class="sheet-panel" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">'
    + '<button type="button" class="icon-btn sheet-x" data-act="close-sheet" aria-label="Close">' + icon('x') + '</button>' + body + '</div></div>';
  if (SHEET.kind === 'edit') { cfInit('e', state.txns[SHEET.id]); }
  if (SHEET.kind === 'add') { cfInit('a', { k: '', o: 1, m: '' }); }
  const first = $('#pdf-pw') || (finePointer && ($('#sheet-root [data-autofocus]') || $('#e-cat'))) || $('#sheet-root .sheet-x');
  if (first) first.focus({ preventScroll: true });
}

/* --- import --- */
function importSheetHTML() {
  if (IMP.step === 'busy') return '<h2 class="sheet-title">Reading ' + esc(IMP.name) + '…</h2><p class="muted">PDF and Excel files take a few seconds.</p>';
  if (IMP.step === 'map') return importPreviewHTML();
  if (IMP.step === 'password') return '<h2 class="sheet-title">This statement is locked</h2>'
    + '<p class="lede">Bank e-statements usually need a password, often made from your customer ID, date of birth or phone number. The email from your bank says which.</p>'
    + '<form id="pw-form" novalidate><label class="field"><span>PDF password</span><input id="pdf-pw" class="input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"></label></form>'
    + (IMP.pwWrong ? '<p class="err" role="alert">That password didn\'t open it. Check the format in your bank\'s email; capital letters matter.</p>' : '')
    + '<p class="fine">The password only opens the file here on your device. It isn\'t saved anywhere.</p>'
    + '<div class="sheet-actions"><button type="button" class="btn" data-act="import-back">Choose another file</button><span class="spacer"></span><button type="submit" form="pw-form" class="btn primary">Open statement</button></div>';
  return '<h2 class="sheet-title">Import a statement</h2>'
    + '<label class="drop" id="drop" for="file-input">' + icon('upload', 'lg') + '<b>Choose your statement file</b><span>PDF, Excel (.xls, .xlsx) or CSV from net banking or a UPI app. You can drop the file here too.</span></label>'
    + '<input type="file" id="file-input" class="visually-hidden" accept=".pdf,.csv,.xls,.xlsx,.txt,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">'
    + (IMP.error ? '<p class="err" role="alert">' + esc(IMP.error) + '</p>' : '')
    + '<p class="fine">The file is read on your device. Hisaab Book keeps only the transactions: date, details, amount and balance. Payments already in your book are skipped, so overlapping statements are fine.</p>'
    + '<div class="sheet-actions"><button type="button" class="btn ghost" data-act="sample">Try a sample statement</button><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button></div>';
}
function headerNames() {
  const rows = IMP.rows || []; const map = IMP.map || {};
  const ncol = Math.max(0, ...rows.slice(0, 60).map((r) => r.length));
  const hdr = map.header >= 0 ? rows[map.header] || [] : [];
  const firstData = rows[map.header + 1] || [];
  return Array.from({ length: ncol }, (_, i) => {
    const h = String(hdr[i] == null ? '' : hdr[i]).trim();
    if (h) return h;
    const ex = String(firstData[i] == null ? '' : firstData[i]).trim().slice(0, 18);
    return 'Column ' + (i + 1) + (ex ? ' (' + ex + ')' : '');
  });
}
function mapSelect(id, label, value, names, allowNone) {
  return '<label class="field"><span>' + label + '</span><select id="' + id + '" class="select imp-map">' + (allowNone ? '<option value="-1">None</option>' : '')
    + names.map((h, i) => '<option value="' + i + '"' + (i === value ? ' selected' : '') + '>' + esc(h) + '</option>').join('') + '</select></label>';
}
function importPreviewHTML() {
  const prep = IMP.prep, map = IMP.map || {};
  const n = prep.fresh.length;
  const names = headerNames();
  let html = '<h2 class="sheet-title">' + esc(IMP.name) + '</h2>';
  if (prep.total) {
    html += '<p class="lede">' + plural(prep.total, 'payment') + ' · ' + esc(rangeLabel(prep.from, prep.to)) + '</p><ul class="stats"><li><b>' + n + '</b> new</li>'
      + (prep.dup ? '<li><b>' + prep.dup + '</b> already in your book</li>' : '') + (prep.auto ? '<li><b>' + prep.auto + '</b> filled from memory</li>' : '') + (prep.self ? '<li><b>' + prep.self + '</b> ' + (prep.self === 1 ? 'self transfer' : 'self transfers') + ', not counted in spending</li>' : '') + '</ul>';
  } else {
    html += '<p class="err" role="alert">No payments found with these columns. Pick the date, details and amount columns below.</p>';
  }
  if (IMP.allPositive) html += '<p class="fine">This file has one amount column and no debit or credit marker, so every amount is counted as money out.</p>';
  if (n) {
    html += '<div class="preview"><table><tbody>' + prep.fresh.slice(0, 5).map((t) => '<tr><td class="d">' + esc(shortDate(t.d)) + '</td><td class="m">' + esc(t.m) + '<small>' + esc(t.r.slice(0, 64)) + '</small></td><td class="a' + (t.o ? '' : ' in') + '">' + esc(signedAmt(t)) + '</td></tr>').join('') + '</tbody></table></div>';
    if (n > 5) html += '<p class="fine">and ' + (n - 5) + ' more.</p>';
  }
  const single = map.mode === 'single';
  html += '<details class="mapping"' + (prep.total ? '' : ' open') + '><summary>Columns <span>· ' + (map.guessed ? 'guessed, check them' : 'found automatically') + '</span></summary><div class="map-grid">'
    + mapSelect('imp-date', 'Date', map.date, names, false) + mapSelect('imp-desc', 'Details', map.desc, names, false)
    + '<label class="field"><span>Amounts are in</span><select id="imp-mode" class="select imp-map"><option value="split"' + (single ? '' : ' selected') + '>Separate out and in columns</option><option value="single"' + (single ? ' selected' : '') + '>One amount column</option></select></label>'
    + (single ? mapSelect('imp-amt', 'Amount', map.amt, names, false) + mapSelect('imp-type', 'Debit / credit marker', map.type, names, true)
      : mapSelect('imp-out', 'Money out', map.out, names, true) + mapSelect('imp-inn', 'Money in', map.inn, names, true))
    + mapSelect('imp-bal', 'Balance', map.bal, names, true) + mapSelect('imp-note', 'Notes', map.note == null ? -1 : map.note, names, true) + '</div></details>';
  html += '<div class="sheet-actions"><button type="button" class="btn" data-act="import-back">Choose another file</button><span class="spacer"></span>'
    + '<button type="button" class="btn primary" data-act="import-commit"' + (n ? '' : ' disabled') + '>' + (n ? 'Add ' + plural(n, 'payment') : (prep.total ? 'Nothing new to add' : 'Add payments')) + '</button></div>';
  return html;
}
function recomputeImport() {
  const ex = extractRows(IMP.rows || [], IMP.map);
  IMP.allPositive = ex.allPositive;
  IMP.prep = prepareImport(ex.items);
}
function readMappingFromSheet() {
  const v = (id, d) => { const el = $('#' + id); return el ? Number(el.value) : d; };
  const m = IMP.map || blankMapping(IMP.rows || []);
  const mode = ($('#imp-mode') || {}).value || m.mode;
  const next = Object.assign({}, m, { date: v('imp-date', m.date), desc: v('imp-desc', m.desc), bal: v('imp-bal', m.bal), note: v('imp-note', m.note == null ? -1 : m.note), mode });
  if (mode === 'single') { next.amt = v('imp-amt', m.amt >= 0 ? m.amt : 0); next.type = v('imp-type', m.type); if (next.amt < 0) next.amt = 0; }
  else { next.out = v('imp-out', m.out); next.inn = v('imp-inn', m.inn); }
  if (m.mode !== mode && mode === 'single' && next.amt < 0) next.amt = 0;
  IMP.map = next;
}
async function handleFile(file) {
  if (!file) return;
  IMP.name = file.name || 'Statement'; IMP.sample = false; IMP.error = ''; IMP.password = ''; IMP.pending = null; IMP.pwWrong = false; IMP.step = 'busy';
  if (!SHEET || SHEET.kind !== 'import') openSheet('import'); else renderSheet();
  let buf;
  try { buf = await file.arrayBuffer(); }
  catch (e) { IMP.step = 'pick'; IMP.error = 'Couldn\'t open that file. Try choosing it again.'; if (SHEET && SHEET.kind === 'import') renderSheet(); return; }
  await processBuffer(buf);
}
async function processBuffer(buf) {
  try {
    const rows = await rowsFromFile(buf);
    if (!rows || !rows.length) throw userError('Couldn\'t find any rows in this file.');
    IMP.rows = rows.map((r) => (Array.isArray(r) ? r : []));
    IMP.map = detectMapping(IMP.rows) || blankMapping(IMP.rows);
    recomputeImport();
    IMP.step = 'map'; IMP.pending = null; IMP.password = '';
  } catch (e) {
    if (e && e.needPassword) { IMP.step = 'password'; IMP.pending = buf; IMP.pwWrong = !!(e.wrong || IMP.password); IMP.password = ''; }
    else {
      IMP.step = 'pick'; IMP.pending = null; IMP.password = '';
      IMP.error = e && e.friendly ? e.message : 'Couldn\'t read that file. Try the Excel or CSV version of the statement.';
    }
  }
  if (SHEET && SHEET.kind === 'import') renderSheet();
}
function startSample() {
  IMP.name = 'Sample statement (example data)'; IMP.sample = true; IMP.error = '';
  IMP.rows = parseCSV(sampleCSV());
  IMP.map = detectMapping(IMP.rows);
  recomputeImport();
  IMP.step = 'map';
  if (!SHEET || SHEET.kind !== 'import') openSheet('import'); else renderSheet();
}
function doCommitImport() {
  const prep = IMP.prep; if (!prep || !prep.fresh.length) return;
  const n = prep.fresh.length, auto = prep.auto;
  const months = [...commitImport(prep, IMP.name, IMP.sample)].sort();
  IMP.step = 'pick'; IMP.rows = null; IMP.prep = null;
  closeSheet();
  ui.month = months[months.length - 1] || ui.month;
  ui.tab = 'sort'; ui.sort.mode = 'todo'; ui.sort.scope = 'all'; buildQueue();
  render();
  toast('Added ' + plural(n, 'payment') + (auto ? ' · ' + auto + ' filled from memory' : ''));
}

/* --- edit one payment --- */
function editSheetHTML(t) {
  return txnCardHTML(t, true) + '<form class="catform" id="e-form" novalidate>' + catFieldsHTML('e', t.c || '', t.n || '') + '</form>'
    + '<div class="sheet-actions"><button type="button" class="btn danger" data-act="delete-txn" data-id="' + t.id + '">' + icon('trash') + 'Delete</button><span class="spacer"></span>'
    + '<button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="submit" form="e-form" class="btn primary">Save</button></div>';
}
function saveEdit() {
  const t = state.txns[SHEET && SHEET.id]; if (!t) return closeSheet();
  const v = cfValues('e');
  const before = clone(state);
  const filled = applyCategory(t, v.cat, v.note, v.remember);
  closeSheet(); render();
  toast(filled ? 'Saved · also filled ' + plural(filled, 'other ' + t.m + ' payment') : 'Saved', filled ? () => { restore(before); render(); } : null);
}

/* --- add a cash spend --- */
function addSheetHTML() {
  return '<h2 class="sheet-title">Add a cash spend</h2><form id="a-form" class="catform" novalidate style="gap:14px">'
    + '<div class="seg" role="group" aria-label="Direction"><button type="button" data-act="add-dir" data-o="1" aria-pressed="true">Money out</button><button type="button" data-act="add-dir" data-o="0" aria-pressed="false">Money in</button></div>'
    + '<label class="field"><span>What was it?</span><input id="add-what" class="input" placeholder="Chai at the canteen" maxlength="40" autocomplete="off" data-autofocus></label>'
    + '<div class="two"><label class="field"><span>Amount</span><span class="prefix"><i>₹</i><input id="add-amt" class="input" inputmode="decimal" placeholder="0" autocomplete="off"></span></label>'
    + '<label class="field"><span>Date</span><input id="add-date" class="input" type="date" value="' + todayYMD() + '" max="' + todayYMD() + '"></label></div>'
    + '<div>' + catFieldsHTML('a', '', '') + '</div><p class="err" id="add-err"></p></form>'
    + '<div class="sheet-actions"><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="submit" form="a-form" class="btn primary">Add payment</button></div>';
}
function saveAdd() {
  const what = cleanCatName(($('#add-what') || {}).value).slice(0, 40);
  const amtP = parseAmount(($('#add-amt') || {}).value);
  const d = ($('#add-date') || {}).value;
  const err = $('#add-err');
  if (!what) { err.textContent = 'Say what the payment was for.'; $('#add-what').focus(); return; }
  if (!amtP || !(Math.abs(amtP.v) > 0)) { err.textContent = 'Enter an amount, like 40 or 125.50.'; $('#add-amt').focus(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) { err.textContent = 'Pick the date of the payment.'; return; }
  const o = $('#a-form [data-act="add-dir"][aria-pressed="true"]').dataset.o === '1' ? 1 : 0;
  const v = cfValues('a');
  const m = /[A-Z]/.test(what) && what === what.toUpperCase() ? titleCase(what) : what;
  const t = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d, m, k: merchantKey(m), a: round2(Math.abs(amtP.v)), o, b: null, r: '', c: null, f: 0, n: '', i: 'm', s: Date.now() };
  state.txns[t.id] = t;
  const name = canonCat(v.cat);
  if (name) applyCategory(t, name, v.note, false);
  else { const rule = state.rules[ruleKey(t)]; if (rule) { t.c = rule.c; t.f = 1; } t.n = String(v.note || '').trim().slice(0, 200); markDirty(true, [monthOf(t)]); }
  closeSheet();
  ui.month = monthOf(t);
  render();
  toast('Added ' + m + ' · ' + signedAmt(t), () => { delete state.txns[t.id]; markDirty(true, [monthOf(t)]); render(); });
}

/* --- monthly limit --- */
function limitSheetHTML() {
  return '<h2 class="sheet-title">Monthly limit</h2><form id="l-form" novalidate style="display:flex;flex-direction:column;gap:14px">'
    + '<p class="fine">The most you want to spend in a month, across every category that counts in spending.</p>'
    + '<label class="field"><span>Limit</span><span class="prefix"><i>₹</i><input id="l-amt" class="input" inputmode="numeric" placeholder="8000" value="' + (state.limit ? Math.round(state.limit) : '') + '" autocomplete="off" data-autofocus></span></label>'
    + '<p class="err" id="l-err"></p></form>'
    + '<div class="sheet-actions">' + (state.limit ? '<button type="button" class="btn danger" data-act="limit-clear">Remove limit</button>' : '') + '<span class="spacer"></span>'
    + '<button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="submit" form="l-form" class="btn primary">Save</button></div>';
}
function saveLimit() {
  const p = parseAmount(($('#l-amt') || {}).value);
  if (!p || !(Math.abs(p.v) >= 1)) { $('#l-err').textContent = 'Enter an amount, like 8000.'; $('#l-amt').focus(); return; }
  state.limit = Math.round(Math.abs(p.v));
  markDirty(true); closeSheet(); render();
  toast('Monthly limit set to ' + inr(state.limit));
}

/* --- edit a category --- */
function catSheetHTML(c) {
  const n = Object.values(state.txns).filter((t) => t.c === c.n).length;
  const rules = Object.values(state.rules).filter((r) => r.c === c.n).length;
  return '<h2 class="sheet-title">' + esc(c.n) + '</h2><form id="c-form" novalidate style="display:flex;flex-direction:column;gap:14px">'
    + '<label class="field"><span>Name</span><input id="c-name" class="input" value="' + esc(c.n) + '" maxlength="40" autocomplete="off" data-autofocus></label>'
    + '<label class="field"><span>Monthly budget</span><span class="prefix"><i>₹</i><input id="c-budget" class="input" inputmode="numeric" placeholder="No budget" value="' + (c.b ? Math.round(c.b) : '') + '" autocomplete="off"></span></label>'
    + '<label class="check"><input type="checkbox" id="c-count"' + (c.x ? '' : ' checked') + '><span>Count in spending totals<small>Turn this off for money moved to your own accounts, savings or investments.</small></span></label>'
    + '<p class="fine">' + plural(n, 'payment') + ' · ' + plural(rules, 'merchant') + ' remembered</p><p class="err" id="c-err"></p></form>'
    + '<div class="sheet-actions"><button type="button" class="btn danger" data-act="delete-cat">' + icon('trash') + 'Delete</button><span class="spacer"></span>'
    + '<button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="submit" form="c-form" class="btn primary">Save</button></div>';
}
function saveCatSheet() {
  const c = findCat(SHEET.name); if (!c) return closeSheet();
  const newName = cleanCatName($('#c-name').value);
  const budgetRaw = $('#c-budget').value.trim();
  const bp = budgetRaw ? parseAmount(budgetRaw) : null;
  const err = $('#c-err');
  if (!newName) { err.textContent = 'Give the category a name.'; return; }
  if (budgetRaw && (!bp || bp.v < 0)) { err.textContent = 'Enter the budget as a number, like 1500, or leave it empty.'; return; }
  const target = state.cats.find((x) => x.n !== c.n && x.n.toLowerCase() === newName.toLowerCase());
  if (target && SHEET.mergeArmed !== target.n) {
    SHEET.mergeArmed = target.n;
    err.textContent = '“' + target.n + '” already exists. Save again to merge ' + c.n + ' into it.';
    return;
  }
  const before = clone(state);
  c.b = bp ? Math.round(Math.abs(bp.v)) : 0;
  c.x = !$('#c-count').checked;
  const final = newName !== c.n ? renameCategory(c.n, newName) : c.n;
  markDirty(true);
  closeSheet(); render();
  if (target) toast('Merged into ' + final, () => { restore(before); render(); });
  else toast('Saved ' + final);
}

/* ================= toast and confirmations ================= */
let toastTimer = 0;
function toast(msg, undo) {
  const el = $('#toast');
  el.querySelector('span').textContent = msg;
  const b = el.querySelector('button');
  b.hidden = !undo;
  b.onclick = () => { hideToast(); if (undo) undo(); };
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, undo ? 7000 : 3200);
}
function hideToast() { $('#toast').hidden = true; }
// Destructive buttons need a second tap within four seconds.
function armed(btn, text) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = '1'; btn.dataset.orig = btn.innerHTML;
  btn.textContent = text; btn.classList.add('armed');
  setTimeout(() => { if (btn.isConnected && btn.dataset.armed) { delete btn.dataset.armed; btn.innerHTML = btn.dataset.orig; btn.classList.remove('armed'); } }, 4000);
  return false;
}
async function exportCSV() {
  const cell = (v) => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [['S.No.', 'Date', 'Merchant', 'Category', 'Note', 'Money out', 'Money in', 'Balance', 'Bank details']];
  allTxns().forEach((t, i) => rows.push([i + 1, t.d, t.m, t.c || '', t.n, t.o ? t.a.toFixed(2) : '', t.o ? '' : t.a.toFixed(2), t.b == null ? '' : t.b.toFixed(2), t.r]));
  if (await saveFile('hisaab-book-' + todayYMD() + '.csv', '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n'), 'text/csv')) toast('Saved the CSV');
}

/* ================= backups and saved files ================= */
// Hand a file to the person: the share sheet on phones (where Save to Files is), a download elsewhere.
async function saveFile(name, text, type) {
  const blob = new Blob([text], { type });
  if (!finePointer && navigator.canShare && typeof File === 'function') {
    const file = new File([blob], name, { type });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return true; }
      catch (e) { if (e && e.name === 'AbortError') return false; }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
async function saveBackup() {
  const data = Object.assign({ app: 'hisaab-book', kind: 'backup', v: 1, exportedAt: new Date().toISOString() }, bookData());
  if (await saveFile('hisaab-book-backup-' + todayYMD() + '.json', JSON.stringify(data), 'application/json')) toast('Saved a backup of ' + plural(Object.keys(data.txns).length, 'payment'));
}
const RESTORE = { name: '', data: null, error: '' };
async function handleBackupFile(file) {
  RESTORE.name = file.name || 'Backup'; RESTORE.data = null; RESTORE.error = '';
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || !data.meta || !data.txns || typeof data.txns !== 'object') throw new Error('not a backup');
    RESTORE.data = data;
  } catch (e) { RESTORE.error = 'That file isn\'t a Hisaab Book backup. Choose the .json file you made with Save a backup.'; }
  openSheet('restore');
}
function restoreSheetHTML() {
  const d = RESTORE.data;
  if (!d) return '<h2 class="sheet-title">Restore a backup</h2><p class="err" role="alert">' + esc(RESTORE.error) + '</p>'
    + '<div class="sheet-actions"><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="restore">Choose another file</button></div>';
  const dates = Object.values(d.txns).filter((o) => o && /^\d{4}-\d{2}-\d{2}$/.test(o.d)).map((o) => o.d).sort();
  const cats = Array.isArray(d.meta.cats) ? d.meta.cats.length : 0;
  const rules = d.meta.rules && typeof d.meta.rules === 'object' ? Object.keys(d.meta.rules).length : 0;
  const now = Object.keys(state.txns).length;
  return '<h2 class="sheet-title">Restore your book</h2>'
    + '<p class="lede">' + esc(RESTORE.name) + (dates.length ? ' · ' + esc(rangeLabel(dates[0], dates[dates.length - 1])) : '') + '</p>'
    + '<ul class="stats"><li><b>' + dates.length + '</b> payments</li><li><b>' + cats + '</b> categories</li><li><b>' + rules + '</b> merchants remembered</li></ul>'
    + '<p class="fine">' + (now ? 'This replaces the ' + plural(now, 'payment') + ' on this device. You can undo it straight after.' : 'Nothing on this device gets replaced.') + '</p>'
    + '<div class="sheet-actions"><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="restore-commit">' + (now ? 'Replace and restore' : 'Restore') + '</button></div>';
}
function doRestore() {
  const d = RESTORE.data; if (!d) return;
  RESTORE.data = null;
  closeSheet();
  const reset = () => { ui.month = defaultMonth(); ui.sort.built = false; };
  withUndo('Restored ' + plural(Object.keys(d.txns).length, 'payment'), () => { loadLocal(d); markDirty(); reset(); }, reset);
}

/* ================= events ================= */
document.addEventListener('click', (e) => {
  const bar = e.target.closest('.day');
  if (bar) { showTip(bar); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'scrim') { if (e.target === el) closeSheet(); return; }
  switch (act) {
    case 'go': ui.tab = el.dataset.tab; if (ui.tab === 'sort' && !ui.sort.built) buildQueue(); render(); window.scrollTo(0, 0); break;
    case 'import': IMP.step = 'pick'; IMP.error = ''; openSheet('import'); break;
    case 'sample': startSample(); break;
    case 'add': openSheet('add'); break;
    case 'close-sheet': closeSheet(); break;
    case 'sort-mode': ui.sort.mode = el.dataset.mode; buildQueue(); render(); break;
    case 'sort-restart': ui.sort.mode = 'todo'; buildQueue(); render(); break;
    case 'sort-month': ui.tab = 'sort'; ui.sort.mode = 'todo'; ui.sort.scope = el.dataset.month; buildQueue(); render(); window.scrollTo(0, 0); break;
    case 'prev': if (goPrev()) render(); break;
    case 'skip': advance(); render(); break;
    case 'chip': {
      const p = el.dataset.p; const input = $('#' + p + '-cat');
      if (!input) break;
      if (p === 's' && el.getAttribute('aria-pressed') === 'true') { doSortSave(); break; }
      input.value = el.dataset.cat;
      if (p === 's') ui.sort.draft = { id: CF.s.t.id, cat: input.value, note: ($('#s-note') || {}).value || '' };
      cfUpdate(p);
      if (finePointer) input.focus();
      break;
    }
    case 'chips-more': CF[el.dataset.p].showAll = true; cfUpdate(el.dataset.p); break;
    case 'month': { ui.month = shiftMonth(ui.month || defaultMonth(), Number(el.dataset.step)); render(); break; }
    case 'filter-cat': ui.hist = { q: '', filter: 'all', cat: el.dataset.cat }; ui.tab = 'history'; render(); window.scrollTo(0, 0); break;
    case 'hist-filter': ui.hist.filter = el.dataset.f; render(); break;
    case 'hist-cat-clear': ui.hist.cat = null; render(); break;
    case 'edit': openSheet('edit', { id: el.dataset.id }); break;
    case 'edit-cat': openSheet('cat', { name: el.dataset.cat }); break;
    case 'add-dir': for (const b of $$('[data-act="add-dir"]')) b.setAttribute('aria-pressed', String(b === el)); break;
    case 'import-back': IMP.step = 'pick'; IMP.error = ''; IMP.pending = null; IMP.password = ''; renderSheet(); break;
    case 'import-commit': doCommitImport(); break;
    case 'export': exportCSV(); break;
    case 'backup': saveBackup(); break;
    case 'restore': $('#backup-input').click(); break;
    case 'restore-commit': doRestore(); break;
    case 'limit': openSheet('limit'); break;
    case 'pie-scope': ui.pieAll = el.dataset.all === '1'; render(); break;
    case 'limit-clear': state.limit = 0; markDirty(true); closeSheet(); render(); toast('Removed the monthly limit'); break;
    case 'delete-txn': {
      if (!armed(el, 'Tap again to delete')) break;
      const t = state.txns[el.dataset.id]; if (!t) break;
      closeSheet();
      withUndo('Deleted ' + t.m + ' · ' + signedAmt(t), () => { delete state.txns[t.id]; markDirty(true, [monthOf(t)]); });
      break;
    }
    case 'delete-cat': {
      const c = findCat(SHEET && SHEET.name); if (!c) break;
      const n = Object.values(state.txns).filter((t) => t.c === c.n).length;
      if (!armed(el, n ? 'Tap again · ' + plural(n, 'payment') + ' go back to To sort' : 'Tap again to delete')) break;
      closeSheet();
      withUndo('Deleted ' + c.n, () => deleteCategory(c.n));
      break;
    }
    case 'remove-import': {
      const imp = state.imports.find((i) => i.id === el.dataset.id); if (!imp) break;
      if (!armed(el, 'Tap again to remove')) break;
      withUndo('Removed ' + imp.name, () => {
        const months = new Set();
        for (const t of Object.values(state.txns)) if (t.i === imp.id) { delete state.txns[t.id]; months.add(monthOf(t)); }
        state.imports = state.imports.filter((i) => i.id !== imp.id);
        markDirty(true, months);
        ui.month = defaultMonth(); ui.sort.built = false;
      }, () => { ui.month = defaultMonth(); ui.sort.built = false; });
      break;
    }
    case 'forget': {
      const r = state.rules[el.dataset.rule]; if (!r) break;
      withUndo('Forgot ' + r.m, () => { delete state.rules[el.dataset.rule]; markDirty(true); });
      break;
    }
  }
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 's-form') doSortSave();
  else if (id === 'e-form') saveEdit();
  else if (id === 'a-form') saveAdd();
  else if (id === 'c-form') saveCatSheet();
  else if (id === 'l-form') saveLimit();
  else if (id === 'pw-form') {
    const pw = ($('#pdf-pw') || {}).value || '';
    if (!pw || !IMP.pending) { const f = $('#pdf-pw'); if (f) f.focus(); return; }
    IMP.password = pw; IMP.step = 'busy'; renderSheet();
    processBuffer(IMP.pending);
  }
  else if (id === 'add-cat-form') {
    const input = $('#new-cat'); const name = cleanCatName(input.value); const err = $('#new-cat-err');
    if (!name) { err.textContent = 'Type a name first.'; input.focus(); return; }
    if (findCat(name)) { err.textContent = '“' + findCat(name).n + '” is already one of your categories.'; return; }
    ensureCat(name); markDirty(true); render(); toast('Added ' + name);
    const again = $('#new-cat'); if (again) again.focus();
  }
});
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.classList && el.classList.contains('cat-input')) {
    const p = el.id.split('-')[0];
    if (p === 's' && CF.s) ui.sort.draft = { id: CF.s.t.id, cat: el.value, note: ($('#s-note') || {}).value || '' };
    cfUpdate(p);
  } else if (el.id === 's-note' && CF.s) {
    ui.sort.draft = { id: CF.s.t.id, cat: ($('#s-cat') || {}).value || '', note: el.value };
  } else if (el.id === 'hist-q') {
    ui.hist.q = el.value; $('#hist-list').innerHTML = histListHTML();
  } else if (el.id === 'mem-q') {
    ui.memQ = el.value; $('#rule-list').innerHTML = ruleListHTML();
  } else if (el.id === 'l-amt') {
    const err = $('#l-err'); if (err) err.textContent = '';
  } else if (el.id === 'add-what' || el.id === 'add-amt') {
    const err = $('#add-err'); if (err) err.textContent = '';
  } else if (el.id === 'new-cat') {
    const err = $('#new-cat-err'); if (err) err.textContent = '';
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'sort-scope') { ui.sort.scope = el.value; buildQueue(); render(); }
  else if (/^[sea]-rem$/.test(el.id)) { const p = el.id[0]; CF[p].touched = true; CF[p].remember = el.checked; cfRemember(p); }
  else if (el.dataset && el.dataset.rule && el.tagName === 'SELECT') { const r = state.rules[el.dataset.rule]; setRule(el.dataset.rule, el.value); toast((r ? r.m : 'Merchant') + ' now fills in ' + el.value); softRender(); }
  else if (el.classList && el.classList.contains('imp-map')) { readMappingFromSheet(); recomputeImport(); renderSheet(); }
  else if (el.id === 'file-input' && el.files && el.files[0]) handleFile(el.files[0]);
  else if (el.id === 'backup-input' && el.files && el.files[0]) { handleBackupFile(el.files[0]); el.value = ''; }
});
document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('cat-input')) cfGhost(e.target.id.split('-')[0]); });
document.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('cat-input')) { const g = $('#' + e.target.id.split('-')[0] + '-ghost'); if (g) g.innerHTML = ''; } });
document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (el.classList && el.classList.contains('cat-input')) {
    const p = el.id.split('-')[0]; const st = CF[p];
    if ((e.key === 'Tab' && !e.shiftKey || e.key === 'ArrowRight' && el.selectionStart === el.value.length) && st && st.completion && st.completion !== el.value) {
      e.preventDefault(); el.value = st.completion;
      if (p === 's') ui.sort.draft = { id: st.t.id, cat: el.value, note: ($('#s-note') || {}).value || '' };
      cfUpdate(p); return;
    }
    if (e.key === 'Escape' && el.value) { e.preventDefault(); e.stopPropagation(); el.value = ''; cfUpdate(p); return; }
  }
  if (SHEET) { if (e.key === 'Escape') { e.preventDefault(); closeSheet(); } return; }
  if (ui.tab !== 'sort') return;
  const mod = e.metaKey || e.ctrlKey;
  if ((mod && e.key === '[') || (e.altKey && e.key === 'ArrowLeft')) { e.preventDefault(); if (goPrev()) render(); }
  else if ((mod && e.key === ']') || (e.altKey && e.key === 'ArrowRight')) { e.preventDefault(); if (currentTxn()) { advance(); render(); } }
});
document.addEventListener('keyup', (e) => { if (e.target.classList && e.target.classList.contains('cat-input')) cfGhost(e.target.id.split('-')[0]); });
document.addEventListener('pointerover', (e) => { const b = e.target.closest && e.target.closest('.day'); if (b) showTip(b); });
document.addEventListener('pointerout', (e) => { if (e.pointerType === 'touch') return; const b = e.target.closest && e.target.closest('.day'); if (b && !b.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('day')) showTip(e.target); });
document.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('day')) hideTip(); });
// Drop a statement anywhere on the page.
document.addEventListener('dragover', (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); const d = $('#drop'); if (d) d.classList.add('over'); } });
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) { const d = $('#drop'); if (d) d.classList.remove('over'); } });
document.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) { e.preventDefault(); handleFile(e.dataTransfer.files[0]); } });

/* ================= start ================= */
setStatus('loading');
startLocal();
// Keep a copy of the app so it opens without internet.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* the app works without it */ }); });
}
})();
