// A two-person team doesn't need a database server: everything lives in one JSON file
// (data/db.json). Reads and writes are synchronous, so a request never sees a half-applied
// change, and every write goes through a temp file + rename so a crash can't truncate it.
// A copy of the file is kept per day in data/backups.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dayKey } from './date';

const DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DIR, 'db.json');
const BACKUPS = path.join(DIR, 'backups');

export const uid = () => crypto.randomBytes(6).toString('base64url');

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
}

export function checkPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(pw, salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const SEED_USERS = [
  { username: 'SajjadGR', name: 'سجاد', color: 'brick', env: 'TASK_PASSWORD_SAJJADGR' },
  { username: 'Amirhossein', name: 'امیرحسین', color: 'teal', env: 'TASK_PASSWORD_AMIRHOSSEIN' },
];

function seed() {
  const now = Date.now();
  const generated = [];
  const users = SEED_USERS.map((u) => {
    let pw = process.env[u.env];
    if (!pw) {
      pw = crypto.randomBytes(6).toString('base64url');
      generated.push(`${u.username}: ${pw}`);
    }
    return { id: uid(), username: u.username, name: u.name, color: u.color, role: 'admin', password: hashPassword(pw), sv: 1, createdAt: now };
  });
  if (generated.length) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, 'INITIAL_PASSWORDS.txt'), generated.join('\n') + '\n');
  }

  const [sajjad, amir] = users;
  const site = { id: uid(), name: 'سایت چارطاق', client: 'داخلی', description: 'وب‌سایت آژانس؛ معرفی خدمات، نمونه‌کارها و فرم تماس.', color: 'brick', status: 'active', due: null, createdAt: now };
  const tasksys = { id: uid(), name: 'سیستم تسک', client: 'داخلی', description: 'پنل داخلی تسک و ساعت کاری روی task.chartagh', color: 'sand', status: 'active', due: null, createdAt: now };
  const t = (title, kind, extra = {}) => ({
    id: uid(), title, notes: '', kind, projectId: null, assignee: 'team', priority: 'normal', due: null,
    done: false, doneAt: null, doneBy: null, doneDates: {}, createdAt: now, createdBy: sajjad.id, ...extra,
  });

  return {
    meta: { version: 1, secret: crypto.randomBytes(32).toString('hex'), createdAt: now },
    users,
    projects: [site, tasksys],
    tasks: [
      t('اضافه کردن نمونه‌کارهای جدید به سایت', 'project', { projectId: site.id, assignee: sajjad.id }),
      t('بهینه‌سازی سرعت صفحه‌ی اصلی', 'project', { projectId: site.id, assignee: amir.id, priority: 'high' }),
      t('راه‌اندازی ساب‌دامین task روی هاست', 'project', { projectId: tasksys.id, assignee: amir.id, priority: 'high' }),
      t('بررسی پیام‌ها و ایمیل مشتری‌ها', 'daily'),
      t('ثبت گزارش کوتاه کار روز', 'daily'),
      t('تهیه‌ی پروپوزال قیمت خدمات', 'general', { assignee: sajjad.id }),
      t('برنامه‌ی محتوای اینستاگرام ماه بعد', 'upcoming', { due: dayKey(now + 7 * 864e5) }),
    ],
    sessions: [],
  };
}

function write(db) {
  fs.mkdirSync(DIR, { recursive: true });
  const json = JSON.stringify(db, null, 2);
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, FILE);
  const daily = path.join(BACKUPS, `db-${dayKey()}.json`);
  if (!fs.existsSync(daily)) {
    fs.mkdirSync(BACKUPS, { recursive: true });
    fs.writeFileSync(daily, json);
  }
}

export function readDb() {
  if (!fs.existsSync(FILE)) {
    const db = seed();
    write(db);
    return db;
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

// Read → change → write in one synchronous step.
export function mutate(fn) {
  const db = readDb();
  const out = fn(db);
  write(db);
  return out;
}

export const publicUser = ({ password, sv, ...u }) => u;
