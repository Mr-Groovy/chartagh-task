import Link from 'next/link';
import Topbar from '@/components/Topbar';
import ProjectButton from '@/components/ProjectButton';
import Icon from '@/components/Icon';
import AdminTasks from '@/components/admin/AdminTasks';
import AdminTime from '@/components/admin/AdminTime';
import AdminUsers from '@/components/admin/AdminUsers';
import { loadPage } from '@/lib/page';
import { PROJECT_STATUS, projectStats } from '@/lib/data';
import { addDays, fa, fmtDay, fmtMonth, isKey, jMonth, keyStart, DAY } from '@/lib/date';

export const metadata = { title: 'مدیریت' };

const TABS = [
  { id: 'tasks', label: 'تسک‌ها', icon: 'tasks' },
  { id: 'projects', label: 'پروژه‌ها', icon: 'folder' },
  { id: 'time', label: 'ساعت‌های کاری', icon: 'clock' },
  { id: 'users', label: 'کاربران و داده', icon: 'users' },
];

export default async function AdminPage({ searchParams }) {
  const { db, today, clock } = await loadPage({ admin: true });
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab : 'tasks';

  let body;
  if (tab === 'tasks') body = <AdminTasks tasks={db.tasks} />;
  else if (tab === 'projects') body = <ProjectsTable db={db} />;
  else if (tab === 'users') body = <AdminUsers />;
  else {
    const m = jMonth(isKey(sp.date) ? sp.date : today);
    const from = keyStart(m.start);
    const to = from + m.length * DAY;
    const sessions = db.sessions.filter((s) => s.start < to && (s.end ?? Date.now()) >= from).sort((a, b) => b.start - a.start);
    const prev = jMonth(addDays(m.start, -1)).start;
    const next = addDays(m.start, m.length);
    body = (
      <div className="stack" style={{ gap: 14 }}>
        <div className="dateNav" style={{ alignSelf: 'flex-start' }}>
          <Link className="icon-btn" href={`/admin?tab=time&date=${prev}`} aria-label="ماه قبل" title="ماه قبل" scroll={false}>
            <Icon name="prev" />
          </Link>
          <b>{fmtMonth(m.start)}</b>
          {next <= today ? (
            <Link className="icon-btn" href={`/admin?tab=time&date=${next}`} aria-label="ماه بعد" title="ماه بعد" scroll={false}>
              <Icon name="next" />
            </Link>
          ) : (
            <span className="icon-btn" aria-hidden style={{ opacity: 0.3 }}>
              <Icon name="next" />
            </span>
          )}
        </div>
        <AdminTime sessions={sessions} />
      </div>
    );
  }

  return (
    <>
      <Topbar title="پنل مدیریت" subtitle="تسک‌ها، پروژه‌ها، ساعت‌ها و حساب‌ها را از اینجا مدیریت کنید" clock={clock} />
      <div className="toolbar">
        <nav className="seg" aria-label="بخش‌های مدیریت">
          {TABS.map((t) => (
            <Link key={t.id} href={`/admin?tab=${t.id}`} aria-current={tab === t.id ? 'page' : undefined} scroll={false}>
              <Icon name={t.icon} />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {body}
    </>
  );
}

function ProjectsTable({ db }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row">
        <p className="muted spacer" style={{ fontSize: '0.9rem' }}>
          برای جابه‌جایی تسک‌ها بین پروژه‌ها، از تب «تسک‌ها» چند تسک را انتخاب کنید و «انتقال به پروژه» را بزنید.
        </p>
        <ProjectButton label="پروژه‌ی جدید" />
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>پروژه</th>
              <th>کارفرما</th>
              <th>وضعیت</th>
              <th>تسک‌ها</th>
              <th>تحویل</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {db.projects.map((p) => {
              const s = projectStats(db, p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/projects/${p.id}`} className="row" style={{ flexWrap: 'nowrap' }}>
                      <i style={{ width: 10, height: 10, borderRadius: '50%', background: `var(--c-${p.color})` }} />
                      <b>{p.name}</b>
                    </Link>
                  </td>
                  <td>{p.client || <span className="faint">—</span>}</td>
                  <td>{PROJECT_STATUS.find((x) => x.id === p.status)?.label}</td>
                  <td className="num">
                    {fa(s.done)}/{fa(s.total)} · {fa(s.pct)}٪
                  </td>
                  <td>{p.due ? fmtDay(p.due, { weekday: false, year: true }) : <span className="faint">—</span>}</td>
                  <td className="actions">
                    <ProjectButton project={p} label={`ویرایش ${p.name}`} icon="edit" className="icon-btn" />
                  </td>
                </tr>
              );
            })}
            {!db.projects.length && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    <Icon name="folder" />
                    <b>هنوز پروژه‌ای نساخته‌اید</b>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
