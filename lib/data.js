// Pure read helpers over a db snapshot — shared by pages and reports.
import { DAY, addDays, dayKey, keyStart } from './date';

export const KINDS = [
  { id: 'general', label: 'کلی', icon: 'layers' },
  { id: 'project', label: 'پروژه‌ای', icon: 'folder' },
  { id: 'daily', label: 'روزانه', icon: 'repeat' },
  { id: 'upcoming', label: 'به‌زودی', icon: 'hourglass' },
];
export const kindLabel = (k) => KINDS.find((x) => x.id === k)?.label ?? k;

export const PRIORITIES = [
  { id: 'high', label: 'فوری' },
  { id: 'normal', label: 'معمولی' },
  { id: 'low', label: 'کم‌اهمیت' },
];

export const PROJECT_STATUS = [
  { id: 'active', label: 'در جریان' },
  { id: 'paused', label: 'متوقف' },
  { id: 'done', label: 'تحویل‌شده' },
];

export const PROJECT_COLORS = ['brick', 'teal', 'sand', 'umber', 'terracotta', 'ink'];

// Daily tasks are a routine: they're ticked per day and start fresh every morning.
export function isDone(task, today = dayKey()) {
  return task.kind === 'daily' ? Boolean(task.doneDates?.[today]) : task.done;
}

export function doneInfo(task, today = dayKey()) {
  return task.kind === 'daily' ? task.doneDates?.[today] ?? null : task.done ? { at: task.doneAt, by: task.doneBy } : null;
}

export const forUser = (task, userId) => task.assignee === 'team' || task.assignee === userId;

const PRI = { high: 0, normal: 1, low: 2 };
export function sortTasks(tasks, today = dayKey()) {
  return [...tasks].sort((a, b) => {
    const d = Number(isDone(a, today)) - Number(isDone(b, today));
    if (d) return d;
    const da = a.due ?? '9999', dbb = b.due ?? '9999';
    if (da !== dbb) return da < dbb ? -1 : 1;
    return PRI[a.priority] - PRI[b.priority] || a.createdAt - b.createdAt;
  });
}

export function projectStats(db, projectId) {
  const tasks = db.tasks.filter((t) => t.projectId === projectId && t.kind !== 'daily');
  const done = tasks.filter((t) => t.done).length;
  return { total: tasks.length, done, open: tasks.length - done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

// --- time ---------------------------------------------------------------

export const runningSession = (db, userId) => db.sessions.find((s) => s.userId === userId && !s.end);

// What the header timer needs: today's finished time plus the open session, if any
export function clockState(db, userId, now = Date.now()) {
  const dayStart = keyStart(dayKey(now));
  const open = runningSession(db, userId);
  let doneMs = 0;
  for (const s of db.sessions) {
    if (s.userId !== userId || !s.end) continue;
    const a = Math.max(s.start, dayStart);
    if (s.end > a) doneMs += s.end - a;
  }
  return { running: open ? { id: open.id, start: open.start, dayStart } : null, doneMs };
}

// ms a user worked inside [from, to), clipping sessions that cross the edges
export function workedBetween(db, userId, from, to, now = Date.now()) {
  let ms = 0;
  for (const s of db.sessions) {
    if (s.userId !== userId) continue;
    const a = Math.max(s.start, from);
    const b = Math.min(s.end ?? now, to);
    if (b > a) ms += b - a;
  }
  return ms;
}

// Every task tick a user made inside [from, to)
export function completionsBetween(db, userId, from, to) {
  const out = [];
  for (const t of db.tasks) {
    if (t.kind === 'daily') {
      for (const [key, info] of Object.entries(t.doneDates ?? {})) {
        if (info.by === userId && info.at >= from && info.at < to) out.push({ at: info.at, task: t, key });
      }
    } else if (t.done && t.doneBy === userId && t.doneAt >= from && t.doneAt < to) {
      out.push({ at: t.doneAt, task: t });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

export function dayReport(db, key, now = Date.now()) {
  const from = keyStart(key);
  const to = from + DAY;
  return db.users.map((u) => {
    const sessions = db.sessions
      .filter((s) => s.userId === u.id && s.start < to && (s.end ?? now) > from)
      .sort((a, b) => a.start - b.start)
      .map((s) => ({ ...s, from: Math.max(s.start, from), to: Math.min(s.end ?? now, to), running: !s.end }));
    return {
      user: u,
      sessions,
      total: sessions.reduce((n, s) => n + (s.to - s.from), 0),
      done: completionsBetween(db, u.id, from, to),
    };
  });
}

// Per-day worked time for each user over `length` days starting at `start`
export function rangeReport(db, start, length, now = Date.now()) {
  const days = Array.from({ length }, (_, i) => {
    const key = addDays(start, i);
    const from = keyStart(key);
    return {
      key,
      users: Object.fromEntries(db.users.map((u) => [u.id, workedBetween(db, u.id, from, from + DAY, now)])),
      done: Object.fromEntries(db.users.map((u) => [u.id, completionsBetween(db, u.id, from, from + DAY).length])),
    };
  });
  const totals = db.users.map((u) => {
    const ms = days.reduce((n, d) => n + d.users[u.id], 0);
    const active = days.filter((d) => d.users[u.id] > 0).length;
    return { user: u, ms, active, avg: active ? ms / active : 0, done: days.reduce((n, d) => n + d.done[u.id], 0) };
  });
  return { days, totals };
}
