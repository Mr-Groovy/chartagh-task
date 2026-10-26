// Stateless sessions: a signed cookie carrying the user id and the user's session version.
// Changing a password bumps the version, which signs that user out everywhere.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readDb, publicUser } from './db';

const COOKIE = 'ct_session';
const MAX_AGE = 30 * 864e2; // seconds

const secret = (db) => process.env.AUTH_SECRET || db.meta.secret;
const sign = (data, key) => crypto.createHmac('sha256', key).update(data).digest('base64url');

export async function startSession(user, db) {
  const data = Buffer.from(JSON.stringify({ u: user.id, v: user.sv, e: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  (await cookies()).set(COOKIE, `${data}.${sign(data, secret(db))}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [data, sig] = token.split('.');
  const db = readDb();
  const expected = sign(data ?? '', secret(db));
  if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { u, v, e } = JSON.parse(Buffer.from(data, 'base64url').toString());
    const user = db.users.find((x) => x.id === u);
    if (!user || user.sv !== v || e < Date.now()) return null;
    return publicUser(user);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}
