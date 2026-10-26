import Link from 'next/link';
import Topbar from '@/components/Topbar';
import ProjectButton from '@/components/ProjectButton';
import Icon from '@/components/Icon';
import { loadPage } from '@/lib/page';
import { PROJECT_STATUS, projectStats } from '@/lib/data';
import { diffDays, fa, relDay } from '@/lib/date';

export const metadata = { title: 'پروژه‌ها' };

const STATUS_CHIP = { active: 'chip--ok', paused: 'chip--warn', done: '' };

export default async function ProjectsPage({ searchParams }) {
  const { user, db, today, clock } = await loadPage();
  const sp = await searchParams;
  const filter = PROJECT_STATUS.some((s) => s.id === sp.status) ? sp.status : 'active';
  const isAdmin = user.role === 'admin';
  const list = db.projects.filter((p) => p.status === filter).map((p) => ({ ...p, stats: projectStats(db, p.id) }));

  return (
    <>
      <Topbar title="پروژه‌ها" subtitle="هر پروژه با تسک‌های انجام‌شده و مانده‌اش" clock={clock}>
        {isAdmin && <ProjectButton label="پروژه‌ی جدید" />}
      </Topbar>

      <div className="toolbar">
        <nav className="seg" aria-label="وضعیت پروژه">
          {PROJECT_STATUS.map((s) => (
            <Link key={s.id} href={`/projects?status=${s.id}`} aria-current={filter === s.id ? 'page' : undefined} scroll={false}>
              {s.label}
              <span className="seg__count">{fa(db.projects.filter((p) => p.status === s.id).length)}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="projects">
        {list.map((p) => {
          const late = p.due && p.status === 'active' && diffDays(p.due, today) < 0;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="project" style={{ '--c': `var(--c-${p.color})` }}>
              <div className="project__head">
                <span className="project__mark">
                  <Icon name="folder" />
                </span>
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.client || 'بدون کارفرما'}</p>
                </div>
                <span className={`chip ${STATUS_CHIP[p.status]}`}>{PROJECT_STATUS.find((s) => s.id === p.status).label}</span>
              </div>
              {p.description && <p className="project__desc">{p.description}</p>}
              <div className="stack" style={{ gap: 8, marginTop: 'auto' }}>
                <div className="project__foot">
                  <span>
                    {fa(p.stats.done)} از {fa(p.stats.total)} تسک انجام شده
                  </span>
                  <b className="num">{fa(p.stats.pct)}٪</b>
                </div>
                <span className="progress" style={{ '--c': `var(--c-${p.color})` }} aria-hidden>
                  <span style={{ width: `${p.stats.pct}%` }} />
                </span>
                {p.due && (
                  <span className={`chip ${late ? 'chip--danger' : ''}`} style={{ alignSelf: 'flex-start' }}>
                    <Icon name="calendar" />
                    تحویل {relDay(p.due, today)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {isAdmin && filter === 'active' && (
          <ProjectButton className="project project--new" label="پروژه‌ی جدید">
            <Icon name="plus" />
            پروژه‌ی جدید
          </ProjectButton>
        )}
      </div>
      {!list.length && filter !== 'active' && (
        <div className="empty">
          <Icon name="folder" />
          <b>پروژه‌ای با این وضعیت نیست</b>
        </div>
      )}
    </>
  );
}
