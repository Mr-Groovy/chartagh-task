'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { readDb, mutate, uid, checkPassword, hashPassword } from '@/lib/db';
import { currentUser, startSession, endSession } from '@/lib/auth';
import { dayKey, isKey } from '@/lib/date';
import { KINDS, PRIORITIES, PROJECT_STATUS, PROJECT_COLORS } from '@/lib/data';

const refresh = () => revalidatePath('/', 'layout');

// Actions return { error } instead of throwing: production builds hide thrown messages.
async function guard(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { error: e?.message || 'کار انجام نشد؛ دوباره امتحان کنید.' };
  }
}

async function me() {
  const user = await currentUser();
  if (!user) throw new Error('نشست شما تمام شده؛ دوباره وارد شوید.');
  return user;
}
async function admin() {
  const user = await me();
  if (user.role !== 'admin') throw new Error('این کار فقط از پنل مدیریت ممکن است.');
  return user;
}

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);

// --- auth -----------------------------------------------------------------

const attempts = new Map(); // username → { n, until }

export async function login(_prev, form) {
  const username = str(form.get('username'), 60);
  const password = String(form.get('password') ?? '');
  const key = username.toLowerCase();
  const a = attempts.get(key);
  if (a?.until > Date.now()) return { error: 'چند بار پشت‌سرهم اشتباه زدید؛ یک دقیقه‌ی دیگر دوباره امتحان کنید.', username };

  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === key);
  if (!user || !checkPassword(password, user.password)) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(key, n >= 5 ? { n: 0, until: Date.now() + 60e3 } : { n });
    return { error: 'نام کاربری یا رمز عبور درست نیست.', username };
  }
  attempts.delete(key);
  await startSession(user, db);
  redirect('/');
}

export async function logout() {
  await endSession();
  redirect('/login');
}

// --- tasks ----------------------------------------------------------------

function cleanTask(input, db) {
  const kind = oneOf(input.kind, KINDS.map((k) => k.id), 'general');
  const projectId = db.projects.some((p) => p.id === input.projectId) ? input.projectId : null;
  if (kind === 'project' && !projectId) throw new Error('برای تسک پروژه‌ای یک پروژه انتخاب کنید.');
  const title = str(input.title);
  if (!title) throw new Error('عنوان تسک خالی است.');
  return {
    title,
    notes: str(input.notes, 4000),
    kind,
    projectId,
    assignee: input.assignee === 'team' || db.users.some((u) => u.id === input.assignee) ? input.assignee : 'team',
    priority: oneOf(input.priority, PRIORITIES.map((p) => p.id), 'normal'),
    due: kind !== 'daily' && isKey(input.due) ? input.due : null,
  };
}

export async function createTask(input) {
  return guard(async () => {
    const user = await me();
    mutate((db) => {
      db.tasks.push({ id: uid(), ...cleanTask(input, db), done: false, doneAt: null, doneBy: null, doneDates: {}, createdAt: Date.now(), createdBy: user.id });
    });
    refresh();
  });
}

export async function updateTask(id, input) {
  return guard(async () => {
    await me();
    mutate((db) => {
      const t = db.tasks.find((x) => x.id === id);
      if (!t) throw new Error('این تسک دیگر وجود ندارد.');
      Object.assign(t, cleanTask({ ...t, ...input }, db), { updatedAt: Date.now() });
    });
    refresh();
  });
}

export async function toggleTask(id, done) {
  return guard(async () => {
    const user = await me();
    mutate((db) => {
      const t = db.tasks.find((x) => x.id === id);
      if (!t) return;
      const now = Date.now();
      if (t.kind === 'daily') {
        t.doneDates ??= {};
        const key = dayKey(now);
        if (done) t.doneDates[key] = { at: now, by: user.id };
        else delete t.doneDates[key];
      } else {
        Object.assign(t, done ? { done: true, doneAt: now, doneBy: user.id } : { done: false, doneAt: null, doneBy: null });
      }
    });
    refresh();
  });
}

export async function deleteTasks(ids) {
  return guard(async () => {
    await me();
    const set = new Set(ids);
    mutate((db) => {
      db.tasks = db.tasks.filter((t) => !set.has(t.id));
    });
    refresh();
  });
}

// Move/reassign several tasks at once from the admin table
export async function bulkUpdateTasks(ids, patch) {
  return guard(async () => {
    await admin();
    const set = new Set(ids);
    mutate((db) => {
      for (const t of db.tasks) {
        if (!set.has(t.id)) continue;
        const next = { ...t };
        if ('assignee' in patch) next.assignee = patch.assignee;
        if ('projectId' in patch) {
          next.projectId = patch.projectId || null;
          if (next.projectId) next.kind = 'project';
          else if (next.kind === 'project') next.kind = 'general';
        }
        if ('kind' in patch) next.kind = patch.kind;
        if ('priority' in patch) next.priority = patch.priority;
        Object.assign(t, cleanTask(next, db), { updatedAt: Date.now() });
      }
    });
    refresh();
  });
}

// --- projects -------------------------------------------------------------

function cleanProject(input) {
  const name = str(input.name, 120);
  if (!name) throw new Error('نام پروژه خالی است.');
  return {
    name,
    client: str(input.client, 120),
    description: str(input.description, 2000),
    color: oneOf(input.color, PROJECT_COLORS, 'brick'),
    status: oneOf(input.status, PROJECT_STATUS.map((s) => s.id), 'active'),
    due: isKey(input.due) ? input.due : null,
  };
}

export async function saveProject(input) {
  return guard(async () => {
    await admin();
    const id = mutate((db) => {
      const p = db.projects.find((x) => x.id === input.id);
      if (p) {
        Object.assign(p, cleanProject(input));
        return p.id;
      }
      const created = { id: uid(), ...cleanProject(input), createdAt: Date.now() };
      db.projects.push(created);
      return created.id;
    });
    refresh();
    return id;
  });
}

// keepTasks: true → its tasks become general tasks; false → they're deleted with it
export async function deleteProject(id, keepTasks) {
  return guard(async () => {
    await admin();
    mutate((db) => {
      db.projects = db.projects.filter((p) => p.id !== id);
      if (keepTasks) {
        for (const t of db.tasks) if (t.projectId === id) Object.assign(t, { projectId: null, kind: t.kind === 'project' ? 'general' : t.kind });
      } else {
        db.tasks = db.tasks.filter((t) => t.projectId !== id);
      }
    });
    refresh();
  });
}

// --- clock in / out ------------------------------------------------------

export async function clockIn() {
  return guard(async () => {
    const user = await me();
    mutate((db) => {
      if (db.sessions.some((s) => s.userId === user.id && !s.end)) return;
      db.sessions.push({ id: uid(), userId: user.id, start: Date.now(), end: null, note: '' });
    });
    refresh();
  });
}

export async function clockOut(note = '') {
  return guard(async () => {
    const user = await me();
    mutate((db) => {
      const s = db.sessions.find((x) => x.userId === user.id && !x.end);
      if (s) Object.assign(s, { end: Date.now(), note: str(note, 300) });
    });
    refresh();
  });
}

export async function saveSession(input) {
  return guard(async () => {
    await admin();
    const start = Number(input.start);
    const end = input.end == null ? null : Number(input.end);
    if (!Number.isFinite(start) || (end !== null && !(end > start))) throw new Error('ساعت پایان باید بعد از ساعت شروع باشد.');
    if (end === null && start > Date.now()) throw new Error('زمان شروع در آینده است.');
    mutate((db) => {
      if (!db.users.some((u) => u.id === input.userId)) throw new Error('کاربر پیدا نشد.');
      if (end === null && db.sessions.some((s) => s.userId === input.userId && !s.end && s.id !== input.id))
        throw new Error('این نفر همین حالا یک تایمر باز دارد.');
      const fields = { userId: input.userId, start, end, note: str(input.note, 300) };
      const s = db.sessions.find((x) => x.id === input.id);
      if (s) Object.assign(s, fields);
      else db.sessions.push({ id: uid(), ...fields });
    });
    refresh();
  });
}

export async function deleteSession(id) {
  return guard(async () => {
    await admin();
    mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.id !== id);
    });
    refresh();
  });
}

// --- users ----------------------------------------------------------------

export async function updateUser(input) {
  return guard(async () => {
    const user = await me();
    if (user.id !== input.id && user.role !== 'admin') throw new Error('اجازه‌ی این کار را ندارید.');
    mutate((db) => {
      const u = db.users.find((x) => x.id === input.id);
      if (!u) throw new Error('کاربر پیدا نشد.');
      const name = str(input.name, 40);
      if (name) u.name = name;
      if (['brick', 'teal'].includes(input.color)) u.color = input.color;
    });
    refresh();
  });
}

export async function changePassword(input) {
  return guard(async () => {
    const user = await me();
    if (user.id !== input.id && user.role !== 'admin') throw new Error('اجازه‌ی این کار را ندارید.');
    const pw = String(input.password ?? '');
    if (pw.length < 8) throw new Error('رمز عبور باید دست‌کم ۸ کاراکتر باشد.');
    const db = mutate((db) => {
      const u = db.users.find((x) => x.id === input.id);
      if (!u) throw new Error('کاربر پیدا نشد.');
      u.password = hashPassword(pw);
      u.sv = (u.sv ?? 1) + 1;
      return db;
    });
    // keep the person who changed their own password signed in
    if (user.id === input.id) await startSession(db.users.find((u) => u.id === user.id), db);
    refresh();
  });
}
