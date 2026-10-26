import { requireUser } from '@/lib/auth';
import { readDb, publicUser } from '@/lib/db';
import { dayKey } from '@/lib/date';
import { forUser, isDone } from '@/lib/data';
import { AppProvider } from '@/components/AppContext';
import Shell from '@/components/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const me = await requireUser();
  const db = readDb();
  const today = dayKey();
  const openCount = db.tasks.filter((t) => forUser(t, me.id) && !isDone(t, today) && t.kind !== 'upcoming').length;

  return (
    <AppProvider me={me} users={db.users.map(publicUser)} projects={db.projects} today={today}>
      <Shell openCount={openCount}>{children}</Shell>
    </AppProvider>
  );
}
