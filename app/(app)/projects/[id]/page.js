import Link from 'next/link';
import { notFound } from 'next/navigation';
import Topbar from '@/components/Topbar';
import TaskList from '@/components/TaskList';
import QuickAdd from '@/components/QuickAdd';
import ProjectButton from '@/components/ProjectButton';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { loadPage } from '@/lib/page';
import { readDb } from '@/lib/db';
import { PROJECT_STATUS, projectStats, sortTasks } from '@/lib/data';
import { diffDays, fa, fmtDay } from '@/lib/date';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: readDb().projects.find((p) => p.id === id)?.name ?? 'پروژه' };
}

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const { user, db, today, clock } = await loadPage();
  const p = db.projects.find((x) => x.id === id);
  if (!p) notFound();

  const tasks = db.tasks.filter((t) => t.projectId === p.id && t.kind !== 'daily');
  const open = sortTasks(tasks.filter((t) => !t.done), today);
  const done = tasks.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt);
  const stats = projectStats(db, p.id);
  const C = 2 * Math.PI * 42;
  const late = p.due && p.status === 'active' && diffDays(p.due, today) < 0;

  return (
    <>
      <Topbar title={p.name} subtitle={p.client ? `کارفرما: ${p.client}` : 'پروژه'} clock={clock}>
        {user.role === 'admin' && <ProjectButton project={p} label="ویرایش پروژه" icon="edit" className="btn btn--ghost" />}
      </Topbar>

      <div className="stack">
        <section className="card hero" style={{ '--c': `var(--c-${p.color})` }}>
          <div className="ring" role="img" aria-label={`${fa(stats.pct)} درصد انجام شده`}>
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--c)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(C * stats.pct) / 100} ${C}`} />
            </svg>
            <b className="num">{fa(stats.pct)}٪</b>
          </div>
          <div className="hero__text">
            <div className="row">
              <span className="chip">{PROJECT_STATUS.find((s) => s.id === p.status).label}</span>
              {p.due && (
                <span className={`chip ${late ? 'chip--danger' : ''}`}>
                  <Icon name="calendar" />
                  تحویل: {fmtDay(p.due, { year: true })}
                </span>
              )}
              <span className="chip">
                {fa(stats.open)} مانده · {fa(stats.done)} انجام‌شده
              </span>
            </div>
            {p.description && <p>{p.description}</p>}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {db.users.map((u) => {
              const mine = tasks.filter((t) => t.assignee === u.id);
              return (
                <span key={u.id} className="row" style={{ fontSize: '0.86rem' }}>
                  <Avatar user={u} size="sm" />
                  {u.name}: {fa(mine.filter((t) => t.done).length)}/{fa(mine.length)}
                </span>
              );
            })}
          </div>
        </section>

        <div className="grid grid--2">
          <section className="card">
            <div className="card__head">
              <h2>مانده</h2>
              <span className="chip">{fa(open.length)}</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {p.status !== 'done' && <QuickAdd kind="project" projectId={p.id} placeholder="تسک تازه برای این پروژه…" />}
              <TaskList
                tasks={open}
                showProject={false}
                empty={
                  <div className="empty">
                    <Icon name="check" />
                    <b>تسک مانده‌ای نیست</b>
                  </div>
                }
              />
            </div>
          </section>
          <section className="card">
            <div className="card__head">
              <h2>انجام‌شده</h2>
              <span className="chip chip--ok">{fa(done.length)}</span>
            </div>
            <TaskList
              tasks={done}
              showProject={false}
              empty={
                <div className="empty">
                  <Icon name="hourglass" />
                  <span>هنوز تسکی از این پروژه تیک نخورده.</span>
                </div>
              }
            />
          </section>
        </div>
        <Link href="/projects" className="btn btn--subtle" style={{ alignSelf: 'flex-start' }}>
          <Icon name="prev" />
          همه‌ی پروژه‌ها
        </Link>
      </div>
    </>
  );
}
