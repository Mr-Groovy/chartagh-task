import Link from 'next/link';
import Topbar from '@/components/Topbar';
import ClockCard from '@/components/ClockCard';
import TaskList from '@/components/TaskList';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { loadPage } from '@/lib/page';
import { completionsBetween, forUser, isDone, projectStats, runningSession, sortTasks, workedBetween } from '@/lib/data';
import { DAY, diffDays, fa, fmtDay, fmtDur, fmtHours, fmtMonth, fmtTime, greeting, jMonth, keyStart, weekStart } from '@/lib/date';

export const metadata = { title: 'میز کار' };

export default async function Dashboard() {
  const { user, db, now, today, clock } = await loadPage();
  const dayStart = keyStart(today);

  const mine = db.tasks.filter((t) => forUser(t, user.id));
  const daily = sortTasks(mine.filter((t) => t.kind === 'daily'), today);
  const dailyDone = daily.filter((t) => isDone(t, today)).length;
  const focus = sortTasks(
    mine.filter((t) => t.kind !== 'daily' && (!t.done || t.doneAt >= dayStart) && ((t.due && diffDays(t.due, today) <= 0) || (t.priority === 'high' && t.kind !== 'upcoming'))),
    today
  );
  const soon = sortTasks(
    mine.filter((t) => !t.done && t.kind !== 'daily' && (t.kind === 'upcoming' || (t.due && diffDays(t.due, today) > 0))),
    today
  ).slice(0, 5);
  const openMine = mine.filter((t) => t.kind !== 'daily' && t.kind !== 'upcoming' && !t.done).length;

  const ws = keyStart(weekStart(today));
  const ms = keyStart(jMonth(today).start);
  const weekMs = workedBetween(db, user.id, ws, now + 1, now);
  const monthMs = workedBetween(db, user.id, ms, now + 1, now);
  const teamToday = db.users.reduce((n, u) => n + completionsBetween(db, u.id, dayStart, dayStart + DAY).length, 0);
  const todaySessions = db.sessions.filter((s) => s.userId === user.id && (s.end ?? now) > dayStart).sort((a, b) => a.start - b.start);

  const active = db.projects.filter((p) => p.status === 'active').map((p) => ({ ...p, stats: projectStats(db, p.id) }));

  return (
    <>
      <Topbar title={`${greeting(now)}، ${user.name}`} subtitle={fmtDay(today, { year: true })} clock={clock} />

      <div className="stack">
        <div className="tiles">
          <div className="tile">
            <span className="tile__label">
              <Icon name="clock" />
              کار این هفته
            </span>
            <span className="tile__value">
              {fmtHours(weekMs)}
              <small>ساعت</small>
            </span>
            <span className="tile__hint">از شنبه تا امروز</span>
          </div>
          <div className="tile">
            <span className="tile__label">
              <Icon name="calendar" />
              کار این ماه
            </span>
            <span className="tile__value">
              {fmtHours(monthMs)}
              <small>ساعت</small>
            </span>
            <span className="tile__hint">{fmtMonth(today)}</span>
          </div>
          <div className="tile">
            <span className="tile__label">
              <Icon name="tasks" />
              تسک‌های باز من
            </span>
            <span className="tile__value">{fa(openMine)}</span>
            <span className="tile__hint">کلی و پروژه‌ای</span>
          </div>
          <div className="tile">
            <span className="tile__label">
              <Icon name="check" />
              تیک‌های امروز تیم
            </span>
            <span className="tile__value">{fa(teamToday)}</span>
            <span className="tile__hint">همه‌ی بخش‌ها</span>
          </div>
        </div>

        <div className="grid grid--dash">
          <div className="stack">
            <section className="card">
              <div className="card__head">
                <h2>کارهای امروز من</h2>
                <Link href="/tasks" className="link">
                  همه‌ی تسک‌ها
                </Link>
              </div>
              {daily.length > 0 && (
                <>
                  <div className="group-title">
                    <Icon name="repeat" className="pri" />
                    روزانه · {fa(dailyDone)} از {fa(daily.length)}
                    <span className="line" />
                  </div>
                  <TaskList tasks={daily} />
                </>
              )}
              <div className="group-title">
                موعد امروز، عقب‌افتاده و فوری
                <span className="line" />
              </div>
              <TaskList
                tasks={focus}
                empty={
                  <div className="empty">
                    <Icon name="sparkle" />
                    <b>کار فوری یا عقب‌افتاده‌ای ندارید</b>
                    <span>برای امروز از بخش تسک‌ها یکی را بردارید.</span>
                  </div>
                }
              />
            </section>

            <section className="card">
              <div className="card__head">
                <h2>به‌زودی</h2>
                <Link href="/tasks?tab=upcoming" className="link">
                  همه
                </Link>
              </div>
              <TaskList
                tasks={soon}
                showKind
                empty={
                  <div className="empty">
                    <Icon name="hourglass" />
                    <b>چیزی برای روزهای آینده ثبت نشده</b>
                    <Link href="/tasks?tab=upcoming" className="btn btn--ghost btn--sm">
                      افزودن کار آینده
                    </Link>
                  </div>
                }
              />
            </section>
          </div>

          <div className="stack">
            <ClockCard running={clock.running} doneMs={clock.doneMs} sessions={todaySessions} />

            <section className="card">
              <div className="card__head">
                <h2>تیم الان</h2>
                <Link href="/reports" className="link">
                  گزارش امروز
                </Link>
              </div>
              <ul className="people">
                {db.users.map((u) => {
                  const open = runningSession(db, u.id);
                  const worked = workedBetween(db, u.id, dayStart, dayStart + DAY, now);
                  return (
                    <li key={u.id} className="person">
                      <Avatar user={u} size="lg" />
                      <span className="person__text">
                        <b>
                          {u.name}
                          {u.id === user.id && <span className="faint"> (من)</span>}
                        </b>
                        <small>{open ? `در حال کار از ساعت ${fmtTime(open.start)}` : worked ? `امروز ${fmtDur(worked)} کار کرده` : 'امروز هنوز شروع نکرده'}</small>
                      </span>
                      <span className={`status ${open ? 'is-on' : ''}`}>
                        <i aria-hidden />
                        <span className="sr-only">{open ? 'آنلاین' : 'آفلاین'}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="card">
              <div className="card__head">
                <h2>پروژه‌های در جریان</h2>
                <Link href="/projects" className="link">
                  همه
                </Link>
              </div>
              {active.length ? (
                <ul className="people">
                  {active.map((p) => (
                    <li key={p.id}>
                      <Link href={`/projects/${p.id}`} className="stack" style={{ gap: 6 }}>
                        <span className="row">
                          <b className="spacer">{p.name}</b>
                          <span className="faint num" style={{ fontSize: '0.82rem' }}>
                            {fa(p.stats.done)}/{fa(p.stats.total)}
                          </span>
                        </span>
                        <span className="progress" style={{ '--c': `var(--c-${p.color})` }} role="progressbar" aria-valuenow={p.stats.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`پیشرفت ${p.name}`}>
                          <span style={{ width: `${p.stats.pct}%` }} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">پروژه‌ی فعالی نیست.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
