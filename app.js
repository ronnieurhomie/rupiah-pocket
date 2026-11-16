import {parseAmount, applyKey} from './amount.js';
import {DEFAULT_CURRENCIES, positive, primaryRates, fallbackRates, restoreRates, selectedCurrencies, needsRefresh} from './rates.js';

const $ = id => document.getElementById(id);
const input = $('amt'), main = document.querySelector('main'), dialog = $('currency-dialog');
const rateKey = 'idr-quick-rates-v2', preferenceKey = 'rupiah-pocket-currencies-v1';
let busy = false, failed = false, registration;
let rates = {values: {USD: 0.00005484872814705489, TWD: 0.0018052908188372519, MYR: 0.00022413751756491094}, dataTime: Date.parse('2026-11-14T00:02:31Z'), fetchedAt: 0, source: 'bootstrap'};
let currencies = [...DEFAULT_CURRENCIES], draft = [];
const names = new Intl.DisplayNames(['en'], {type: 'currency'});
const currencyName = code => names.of(code) || code;
const formatters = new Map();

try {
  rates = restoreRates(JSON.parse(localStorage.getItem(rateKey))) || restoreRates(JSON.parse(localStorage.getItem('idr-quick-rates-v1'))) || rates;
  currencies = selectedCurrencies(JSON.parse(localStorage.getItem(preferenceKey)));
} catch {}
try {
  input.value = sessionStorage.getItem('idr-update-amount') || '';
  sessionStorage.removeItem('idr-update-amount');
} catch {}

function resultText(value, code) {
  const large = value >= 1000;
  const key = code + large;
  if (!formatters.has(key)) {
    const digits = large ? 0 : new Intl.NumberFormat('en-US', {style: 'currency', currency: code}).resolvedOptions().maximumFractionDigits;
    formatters.set(key, new Intl.NumberFormat('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits}));
  }
  const text = formatters.get(key).format(value);
  // Keep extreme amounts readable instead of silently truncating their value.
  return text.length > 12 ? value.toExponential(3) : text;
}

function fitResults() {
  for (const output of document.querySelectorAll('.results output')) {
    output.style.removeProperty('font-size');
    let size = parseFloat(getComputedStyle(output).fontSize);
    while (output.scrollWidth > output.clientWidth && size > 14) {
      size -= 1;
      output.style.fontSize = size + 'px';
    }
  }
}

function buildResults() {
  const results = $('results');
  results.replaceChildren();
  results.style.setProperty('--currency-count', currencies.length);
  results.dataset.count = currencies.length;
  for (const code of currencies) {
    const column = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'currency-label';
    button.setAttribute('aria-label', 'Choose currencies, ' + code + ' — ' + currencyName(code));
    button.setAttribute('aria-haspopup', 'dialog');
    button.textContent = code;
    const chevron = document.createElement('span');
    chevron.textContent = '⌄';
    chevron.setAttribute('aria-hidden', 'true');
    button.append(chevron);
    button.addEventListener('click', openCurrencies);
    const output = document.createElement('output');
    output.id = code.toLowerCase();
    column.append(button, output);
    results.append(column);
  }
}

function render() {
  const amount = parseAmount(input.value);
  for (const code of currencies) {
    const output = $(code.toLowerCase()), available = positive(rates.values[code]);
    output.textContent = amount === null || !available ? '—' : resultText(amount * rates.values[code], code);
    output.title = available ? currencyName(code) : 'No saved rate. Connect to update.';
    output.setAttribute('aria-label', output.textContent + ' ' + code + (available ? '' : ', no saved rate'));
  }
  const invalid = amount === null && input.value.trim();
  $('full').textContent = amount === null ? (invalid ? 'Invalid amount' : 'Enter an amount') : 'Rp ' + amount.toLocaleString('en-US');
  $('full').classList.toggle('error', !!invalid);
  const state = !navigator.onLine ? ' · Offline' : failed ? ' · Saved data' : rates.source === 'bootstrap' ? ' · Built-in estimate' : '';
  const date = new Intl.DateTimeFormat('sv-SE', {year: 'numeric', month: '2-digit', day: '2-digit'}).format(rates.dataTime);
  $('rate-status').textContent = 'Daily rates · ' + date + state + (Date.now() - rates.dataTime > 48 * 3600000 ? ' · Old data' : '') + ' · Excludes fees';
  $('rate-source').textContent = rates.source === 'fawaz' ? 'Rates by currency-api' : 'Rates By Exchange Rate API';
  $('rate-source').href = rates.source === 'fawaz' ? 'https://github.com/fawazahmed0/exchange-api' : 'https://www.exchangerate-api.com';
  fitResults();
}

function press(key) { input.value = applyKey(input.value, key); render(); }
const keyboard = $('native').innerHTML;
function closeNative() {
  input.blur(); input.readOnly = true; input.inputMode = 'none';
  main.classList.remove('native-mode'); main.style.removeProperty('--keyboard-height');
  $('native').innerHTML = keyboard;
  $('native').setAttribute('aria-label', 'Phone keyboard');
  $('native').title = 'Phone keyboard';
}
function sizeViewport() {
  if (!window.visualViewport) return;
  if (!input.readOnly) main.style.setProperty('--keyboard-height', window.visualViewport.height + 'px');
  dialog.style.setProperty('--visual-height', window.visualViewport.height + 'px');
}
window.visualViewport?.addEventListener('resize', sizeViewport);
new ResizeObserver(fitResults).observe($('results'));
$('native').addEventListener('click', () => {
  if (!input.readOnly) { closeNative(); return; }
  input.readOnly = false; input.inputMode = 'decimal'; main.classList.add('native-mode');
  $('native').textContent = 'Done'; $('native').setAttribute('aria-label', 'Done'); $('native').title = 'Done';
  input.focus(); input.select(); sizeViewport();
});
input.addEventListener('input', render);
input.addEventListener('focus', () => input.select());
input.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (['Enter', 'Escape'].includes(event.key)) { event.preventDefault(); closeNative(); }
  else if (input.readOnly && (/^[0-9.]$/.test(event.key) || ['Backspace', 'Delete'].includes(event.key))) {
    event.preventDefault(); press(event.key === 'Delete' ? 'clear' : event.key);
  }
});
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', event => event.preventDefault());
  button.addEventListener('click', () => press(button.dataset.key));
}
$('clear').addEventListener('click', () => press('clear'));

function updateChoices() {
  for (const row of $('currency-options').children) {
    const checkbox = row.querySelector('input');
    checkbox.checked = draft.includes(checkbox.value);
    checkbox.disabled = !checkbox.checked && draft.length >= 3;
    row.hidden = !checkbox.checked && !row.dataset.search.includes($('currency-search').value.trim().toLowerCase());
  }
  $('currency-count').textContent = draft.length + ' selected';
  $('currency-save').disabled = draft.length === 0;
}
function openCurrencies() {
  closeNative();
  draft = [...currencies]; $('currency-search').value = '';
  const codes = [...new Set([...currencies, ...Object.keys(rates.values)])];
  codes.sort((a, b) => {
    const aIndex = currencies.indexOf(a), bIndex = currencies.indexOf(b);
    if (aIndex >= 0 || bIndex >= 0) return (aIndex < 0 ? Infinity : aIndex) - (bIndex < 0 ? Infinity : bIndex);
    return currencyName(a).localeCompare(currencyName(b), 'en');
  });
  $('currency-options').replaceChildren();
  for (const code of codes) {
    const row = document.createElement('label');
    row.dataset.search = (code + ' ' + currencyName(code)).toLowerCase();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.value = code;
    checkbox.addEventListener('change', () => {
      draft = checkbox.checked ? [...draft, code] : draft.filter(value => value !== code);
      updateChoices();
    });
    const text = document.createElement('span'), name = document.createElement('span');
    text.textContent = code; text.className = 'currency-code';
    name.textContent = currencyName(code);
    row.append(checkbox, text, name); $('currency-options').append(row);
  }
  $('currency-hint').textContent = 'Choose 1–3 currencies.' + (Object.keys(rates.values).length <= 3 ? ' Connect to load more.' : '');
  updateChoices(); sizeViewport();
  document.body.classList.add('choosing-currencies');
  dialog.showModal(); $('currency-cancel').focus();
}
$('currency-search').addEventListener('input', updateChoices);
dialog.querySelector('form').addEventListener('submit', event => {
  // Enter in the search field should filter, rather than submit or discard changes.
  if (event.submitter?.value !== 'save') return;
  if (!draft.length) { event.preventDefault(); return; }
  currencies = [...draft];
  try { localStorage.setItem(preferenceKey, JSON.stringify(currencies)); } catch {}
  buildResults(); render();
});
$('currency-search').addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('choosing-currencies');
  $('results').querySelector('button')?.focus({preventScroll: true});
});

async function json(url) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {signal: controller.signal, cache: 'no-store'});
    if (!response.ok) throw Error('Network request failed');
    return await response.json();
  } finally { clearTimeout(timer); }
}
async function loadRates() {
  let next;
  try { next = primaryRates(await json('https://open.er-api.com/v6/latest/USD')); }
  catch { next = fallbackRates(await json('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json')); }
  return {...next, fetchedAt: Date.now()};
}
async function refresh() {
  if (busy || !navigator.onLine || !needsRefresh(rates)) return;
  busy = true;
  try {
    const next = await loadRates();
    // A degraded provider must not replace a newer saved dataset with older rates.
    failed = next.dataTime < rates.dataTime && rates.source !== 'bootstrap';
    rates = failed ? {...rates, fetchedAt: next.fetchedAt, nextUpdate: undefined} : next;
    try { localStorage.setItem(rateKey, JSON.stringify(rates)); } catch {}
  } catch { failed = true; }
  finally { busy = false; render(); }
}
window.addEventListener('online', () => { render(); refresh(); });
window.addEventListener('offline', render);
window.addEventListener('pageshow', () => { closeNative(); render(); refresh(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    closeNative(); render(); refresh(); registration?.update().catch(() => {});
  }
});
buildResults(); render(); refresh();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let reload = false, controlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!controlled) { controlled = true; return; }
    if (!reload) {
      reload = true;
      try { sessionStorage.setItem('idr-update-amount', input.value); } catch {}
      location.reload();
    }
  });
  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(worker => {
    registration = worker; worker.update().catch(() => {});
  }).catch(() => {});
}
