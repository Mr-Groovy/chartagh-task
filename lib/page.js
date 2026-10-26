// Everything a signed-in page starts from: who's asking, the data and their timer.
import { requireUser, requireAdmin } from './auth';
import { readDb } from './db';
import { clockState } from './data';
import { dayKey } from './date';

export async function loadPage({ admin = false } = {}) {
  const user = admin ? await requireAdmin() : await requireUser();
  const db = readDb();
  const now = Date.now();
  return { user, db, now, today: dayKey(now), clock: clockState(db, user.id, now) };
}
