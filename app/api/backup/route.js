import { currentUser } from '@/lib/auth';
import { readDb, publicUser } from '@/lib/db';
import { dayKey } from '@/lib/date';

export const dynamic = 'force-dynamic';

// Full data export for admins; password hashes and the signing secret are left out.
export async function GET() {
  const user = await currentUser();
  if (user?.role !== 'admin') return new Response('اجازه‌ی دسترسی ندارید.', { status: 403 });
  const { meta, users, ...rest } = readDb();
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), users: users.map(publicUser), ...rest }, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="chartagh-task-${dayKey()}.json"`,
    },
  });
}
