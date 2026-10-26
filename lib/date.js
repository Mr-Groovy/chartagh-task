// Every day boundary is Tehran wall-clock time (UTC+03:30, no DST since 1401), so the
// server (usually UTC) and the browser always agree on what "today" means.
// A day is stored as a Gregorian key 'YYYY-MM-DD' and only shown in the Jalali calendar.
export const TZ = 3.5 * 3600e3;
export const DAY = 864e5;

export const fa = (v) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pad = (n) => String(n).padStart(2, '0');

export const JMONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
// Persian week starts on Saturday
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
export const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function dayKey(ms = Date.now()) {
  const d = new Date(ms + TZ);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export const isKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);

// UTC ms of Tehran midnight that starts this day
export function keyStart(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - TZ;
}

export const addDays = (key, n) => dayKey(keyStart(key) + n * DAY);
export const diffDays = (a, b) => Math.round((keyStart(a) - keyStart(b)) / DAY);

// 0 = شنبه … 6 = جمعه
export function weekdayIndex(key) {
  const [y, m, d] = key.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1) % 7;
}

export const weekStart = (key) => addDays(key, -weekdayIndex(key));

let jFmt;
export function jalali(key) {
  jFmt ??= new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
  const [y, m, d] = key.split('-').map(Number);
  const parts = Object.fromEntries(jFmt.formatToParts(new Date(Date.UTC(y, m - 1, d))).map((p) => [p.type, p.value]));
  return { jy: +parts.year, jm: +parts.month, jd: +parts.day };
}

// The Jalali month that contains `key`: first day key and its length
export function jMonth(key) {
  const { jy, jm, jd } = jalali(key);
  const start = addDays(key, 1 - jd);
  let length = 29;
  while (length < 31 && jalali(addDays(start, length)).jm === jm) length++;
  return { start, length, jy, jm };
}

export function fmtDay(key, { weekday = true, year = false, month = true } = {}) {
  const { jy, jm, jd } = jalali(key);
  let s = `${fa(jd)}${month ? ' ' + JMONTHS[jm - 1] : ''}`;
  if (year) s += ` ${fa(jy)}`;
  return weekday ? `${WEEKDAYS[weekdayIndex(key)]} ${s}` : s;
}

export function fmtMonth(key) {
  const { jy, jm } = jalali(key);
  return `${JMONTHS[jm - 1]} ${fa(jy)}`;
}

export function fmtTime(ms) {
  const d = new Date(ms + TZ);
  return fa(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`);
}

export const hourOf = (ms) => {
  const d = new Date(ms + TZ);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
};

export function fmtDur(ms, { short = false } = {}) {
  const total = Math.max(0, Math.floor(ms / 60e3));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (short) return fa(`${h}:${pad(m)}`);
  if (!h) return `${fa(m)} دقیقه`;
  if (!m) return `${fa(h)} ساعت`;
  return `${fa(h)} ساعت و ${fa(m)} دقیقه`;
}

export function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return fa(`${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
}

export const fmtHours = (ms) => fa((Math.round((ms / 3600e3) * 10) / 10).toString()).replace('.', '٫');

export function relDay(key, today = dayKey()) {
  const n = diffDays(key, today);
  if (n === 0) return 'امروز';
  if (n === 1) return 'فردا';
  if (n === -1) return 'دیروز';
  if (n > 1 && n < 7) return `${fa(n)} روز دیگر`;
  if (n < 0 && n > -7) return `${fa(-n)} روز پیش`;
  return fmtDay(key, { weekday: false });
}

// 'YYYY-MM-DD' + 'HH:MM' (Tehran) ⇄ ms
export function fromParts(key, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return keyStart(key) + (h * 60 + m) * 60e3;
}
export function toHHMM(ms) {
  const d = new Date(ms + TZ);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function greeting(ms = Date.now()) {
  const h = hourOf(ms);
  if (h < 5) return 'شب بخیر';
  if (h < 12) return 'صبح بخیر';
  if (h < 17) return 'روز بخیر';
  return 'عصر بخیر';
}
