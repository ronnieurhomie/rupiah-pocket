export const DEFAULT_CURRENCIES = ['USD', 'TWD', 'MYR'];
export const positive = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
const currencyCode = code => /^[A-Z]{3}$/.test(code) && code !== 'IDR';

export function validValues(values) {
  return Object.fromEntries(Object.entries(values || {}).filter(([code, value]) => currencyCode(code) && positive(value)));
}

export function primaryRates(data) {
  const base = data?.rates?.IDR;
  if (data?.result !== 'success' || data.base_code !== 'USD' || !positive(base) || !positive(data.time_last_update_unix)) throw Error('Invalid primary rates');
  const values = validValues(Object.fromEntries(Object.entries(data.rates).map(([code, value]) => [code, positive(value) ? value / base : null])));
  values.USD = 1 / base;
  if (!DEFAULT_CURRENCIES.every(code => positive(values[code]))) throw Error('Missing reference rates');
  return {values, dataTime: data.time_last_update_unix * 1000, nextUpdate: positive(data.time_next_update_unix) ? data.time_next_update_unix * 1000 : undefined, source: 'erapi'};
}

export function fallbackRates(data) {
  const dataTime = Date.parse(data?.date + 'T00:00:00Z');
  const values = validValues(Object.fromEntries(Object.entries(data?.idr || {}).map(([code, value]) => [code.toUpperCase(), value])));
  if (!positive(dataTime) || !DEFAULT_CURRENCIES.every(code => positive(values[code]))) throw Error('Invalid fallback rates');
  return {values, dataTime, source: 'fawaz'};
}

export function restoreRates(saved) {
  if (!saved || !positive(saved.dataTime)) return null;
  const legacy = !saved.values;
  const values = validValues(legacy ? {USD: saved.usd, TWD: saved.twd, MYR: saved.myr} : saved.values);
  if (!DEFAULT_CURRENCIES.every(code => positive(values[code]))) return null;
  // Existing installations keep their last rates and fetch the expanded dataset online.
  return {values, dataTime: saved.dataTime, source: ['erapi', 'fawaz', 'bootstrap'].includes(saved.source) ? saved.source : 'bootstrap', fetchedAt: legacy ? 0 : saved.fetchedAt, nextUpdate: legacy ? undefined : saved.nextUpdate};
}

export function selectedCurrencies(saved) {
  if (!Array.isArray(saved)) return [...DEFAULT_CURRENCIES];
  const codes = [...new Set(saved.filter(code => typeof code === 'string' && currencyCode(code)))].slice(0, 3);
  return codes.length ? codes : [...DEFAULT_CURRENCIES];
}

export function needsRefresh(rates, now = Date.now()) {
  if (!positive(rates.fetchedAt)) return true;
  // A published next-update deadline takes priority over the hourly request limit.
  if (positive(rates.nextUpdate)) return now >= rates.nextUpdate;
  return now - rates.fetchedAt >= 3600000;
}
