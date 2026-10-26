import Link from 'next/link';
import Topbar from '@/components/Topbar';
import TaskList from '@/components/TaskList';
import QuickAdd from '@/components/QuickAdd';
import NewTaskButton from '@/components/NewTaskButton';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { loadPage } from '@/lib/page';
import { KINDS, forUser, isDone, sortTasks } from '@/lib/data';
import { addDays, diffDays, fa, weekStart } from '@/lib/date';

export const metadata = { title: 'تسک‌ها' };

const HINTS = {
  general: 'کارهای عمومی آژانس که به پروژه‌ی خاصی وصل نیستند.',
  project: 'تسک‌های هر پروژه، دسته‌بندی‌شده بر اساس پروژه.',
  daily: 'روتین هر روز؛ صبح‌ها دوباره خالی می‌شوند و سابقه‌ی تیک‌ها در گزارش می‌ماند.',
  upcoming: 'کارهایی که باید در آینده‌ای نه‌چندان دور انجام شوند.',
};

export default async function TasksPage({ searchParams }) {
  const { user, db, today, clock } = await loadPage();
  const sp = await searchParams;
  const tab = KINDS.some((k) => k.id === sp.tab) ? sp.tab : 'general';
  const who = sp.who === 'all' || db.users.some((u) => u.id === sp.who) ? sp.who : 'all';
  const showDone = sp.done === '1';

  const href = (patch) => {
    const q = new URLSearchParams({ tab, who, ...(showDone ? { done: '1' } : {}), ...patch });
    if (q.get('done') === '0') q.delete('done');
    return `/tasks?${q}`;
  };

  const byWho = db.tasks.filter((t) => who === 'all' || forUser(t, who));
  const counts = Object.fromEntries(KINDS.map((k) => [k.id, byWho.filter((t) => t.kind === k.id && !isDone(t, today)).length]));
  const inTab = sortTasks(byWho.filter((t) => t.kind === tab), today);
  // daily routines always show (they reset), other done tasks only on request
  const visible = tab === 'daily' || showDone ? inTab : inTab.filter((t) => !isDone(t, today));
  const doneCount = inTab.filter((t) => isDone(t, today)).length;

  let groups = [{ key: 'all', tasks: visible }];
  if (tab === 'project') {
    groups = db.projects
      .map((p) => ({ key: p.id, project: p, tasks: visible.filter((t) => t.projectId === p.id) }))
      .filter((g) => g.tasks.length);
  } else if (tab === 'upcoming') {
    const endOfWeek = addDays(weekStart(today), 6);
    const buckets = [
      { key: 'week', title: 'همین هفته', test: (t) => t.due && diffDays(t.due, endOfWeek) <= 0 },
      { key: 'next', title: 'هفته‌ی بعد', test: (t) => t.due && diffDays(t.due, endOfWeek) <= 7 },
      { key: 'later', title: 'بعدتر', test: (t) => t.due },
      { key: 'none', title: 'بدون تاریخ', test: () => true },
    ];
    const left = [...visible];
    groups = buckets
      .map((b) => ({ key: b.key, title: b.title, tasks: left.filter((t) => b.test(t)).map((t) => (left.splice(left.indexOf(t), 1), t)) }))
      .filter((g) => g.tasks.length);
  }

  return (
    <>
      <Topbar title="تسک‌ها" subtitle={HINTS[tab]} clock={clock}>
        <NewTaskButton kind={tab} />
      </Topbar>

      <div className="toolbar">
        <nav className="seg" aria-label="بخش تسک‌ها">
          {KINDS.map((k) => (
            <Link key={k.id} href={href({ tab: k.id })} aria-current={tab === k.id ? 'page' : undefined} scroll={false}>
              <Icon name={k.icon} />
              {k.label}
              <span className="seg__count">{fa(counts[k.id])}</span>
            </Link>
          ))}
        </nav>
        <span className="spacer" />
        <nav className="seg" aria-label="نمایش تسک‌های چه کسی">
          <Link href={href({ who: 'all' })} aria-current={who === 'all' ? 'page' : undefined} scroll={false}>
            همه
          </Link>
          {db.users.map((u) => (
            <Link key={u.id} href={href({ who: u.id })} aria-current={who === u.id ? 'page' : undefined} scroll={false}>
              <Avatar user={u} size="sm" />
              {u.id === user.id ? 'من' : u.name}
            </Link>
          ))}
        </nav>
      </div>

      <section className="card stack" style={{ gap: 14 }}>
        <QuickAdd kind={tab} />

        {tab === 'daily' && inTab.length > 0 && (
          <div className="row" style={{ gap: 12 }}>
            <span className="muted" style={{ fontSize: '0.88rem' }}>
              پیشرفت امروز: {fa(doneCount)} از {fa(inTab.length)}
            </span>
            <span className="progress spacer" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={inTab.length} aria-label="پیشرفت تسک‌های روزانه">
              <span style={{ width: `${(doneCount / inTab.length) * 100}%` }} />
            </span>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="empty">
            <Icon name={doneCount ? 'check' : KINDS.find((k) => k.id === tab).icon} />
            <b>{doneCount ? 'همه‌ی تسک‌های این بخش انجام شده‌اند' : 'هنوز تسکی در این بخش نیست'}</b>
            <span>{doneCount ? 'می‌توانید انجام‌شده‌ها را هم ببینید.' : 'از کادر بالا اولین تسک را بنویسید.'}</span>
          </div>
        ) : (
          <div>
            {groups.map((g) => (
              <div key={g.key}>
                {g.project && (
                  <div className="group-title">
                    <i className="dot" style={{ width: 9, height: 9, borderRadius: '50%', background: `var(--c-${g.project.color})` }} />
                    <Link href={`/projects/${g.project.id}`}>{g.project.name}</Link>
                    <span className="line" />
                    <span className="faint">{fa(g.tasks.length)}</span>
                  </div>
                )}
                {g.title && (
                  <div className="group-title">
                    {g.title}
                    <span className="line" />
                    <span className="faint">{fa(g.tasks.length)}</span>
                  </div>
                )}
                <TaskList tasks={g.tasks} showProject={tab !== 'project'} />
              </div>
            ))}
          </div>
        )}

        {tab !== 'daily' && doneCount > 0 && (
          <Link href={href({ done: showDone ? '0' : '1' })} className="btn btn--subtle btn--sm" style={{ alignSelf: 'flex-start' }} scroll={false}>
            <Icon name="check" />
            {showDone ? 'پنهان کردن انجام‌شده‌ها' : `نمایش ${fa(doneCount)} تسک انجام‌شده`}
          </Link>
        )}
      </section>
    </>
  );
}
