import Link from 'next/link';
import Topbar from '@/components/Topbar';
import HoursChart from '@/components/HoursChart';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { loadPage } from '@/lib/page';
import { dayReport, rangeReport } from '@/lib/data';
import { DAY, WEEKDAYS, addDays, fa, fmtDay, fmtDur, fmtHours, fmtMonth, fmtTime, isKey, jMonth, jalali, keyStart, weekStart } from '@/lib/date';

export const metadata = { title: 'گزارش‌ها' };

const VIEWS = [
  { id: 'day', label: 'روزانه' },
  { id: 'week', label: 'هفتگی' },
  { id: 'month', label: 'ماهانه' },
];

export default async function ReportsPage({ searchParams }) {
  const { db, now, today, clock } = await loadPage();
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.id === sp.view) ? sp.view : 'day';
  const date = isKey(sp.date) && sp.date <= today ? sp.date : today;

  let range, prev, next, title;
  if (view === 'day') {
    prev = addDays(date, -1);
    next = addDays(date, 1);
    title = date === today ? `امروز، ${fmtDay(date)}` : fmtDay(date, { year: true });
  } else if (view === 'week') {
    const ws = weekStart(date);
    range = { start: ws, length: 7 };
    prev = addDays(ws, -7);
    next = addDays(ws, 7);
    title = `${fmtDay(ws, { weekday: false })} تا ${fmtDay(addDays(ws, 6), { weekday: false })}`;
  } else {
    const m = jMonth(date);
    range = { start: m.start, length: m.length };
    prev = jMonth(addDays(m.start, -1)).start;
    next = addDays(m.start, m.length);
    title = fmtMonth(m.start);
  }
  const canNext = next <= today;
  const link = (patch) => `/reports?${new URLSearchParams({ view, date, ...patch })}`;

  return (
    <>
      <Topbar title="گزارش‌ها" subtitle="ساعت کار روی چارطاق و تسک‌هایی که تیک خورده" clock={clock} />

      <div className="toolbar">
        <nav className="seg" aria-label="بازه‌ی گزارش">
          {VIEWS.map((v) => (
            <Link key={v.id} href={`/reports?view=${v.id}&date=${date}`} aria-current={view === v.id ? 'page' : undefined} scroll={false}>
              {v.label}
            </Link>
          ))}
        </nav>
        <span className="spacer" />
        <div className="dateNav">
          <Link className="icon-btn" href={link({ date: prev })} aria-label="قبلی" title="قبلی" scroll={false}>
            <Icon name="prev" />
          </Link>
          <b>{title}</b>
          {canNext ? (
            <Link className="icon-btn" href={link({ date: next })} aria-label="بعدی" title="بعدی" scroll={false}>
              <Icon name="next" />
            </Link>
          ) : (
            <span className="icon-btn" aria-hidden style={{ opacity: 0.3 }}>
              <Icon name="next" />
            </span>
          )}
        </div>
        {date !== today && (
          <Link href={`/reports?view=${view}`} className="btn btn--ghost btn--sm" scroll={false}>
            برگشت به امروز
          </Link>
        )}
      </div>

      {view === 'day' ? <DayView db={db} date={date} now={now} /> : <RangeView db={db} view={view} range={range} today={today} now={now} />}
    </>
  );
}

function DayView({ db, date, now }) {
  const report = dayReport(db, date, now);
  const dayStart = keyStart(date);
  const hours = report.flatMap((r) => [...r.sessions.flatMap((s) => [s.from, s.to]), ...r.done.map((d) => d.at)]).map((ms) => (ms - dayStart) / 3600e3);
  const h0 = Math.max(0, Math.min(8, ...hours.map(Math.floor)));
  const h1 = Math.min(24, Math.max(20, ...hours.map(Math.ceil)));
  const pos = (ms) => `${(((ms - dayStart) / 3600e3 - h0) / (h1 - h0)) * 100}%`;
  const hourLabels = Array.from({ length: Math.floor((h1 - h0) / 2) + 1 }, (_, i) => h0 + i * 2);

  return (
    <div className="grid grid--2">
      {report.map(({ user, sessions, total, done }) => {
        const events = [
          ...sessions.flatMap((s) => [
            { at: s.from, kind: 'in', text: s.start < dayStart ? 'ادامه‌ی کار از دیروز' : 'آغاز به کار' },
            s.running ? { at: s.to, kind: 'live', text: 'در حال کار…' } : { at: s.to, kind: 'out', text: s.end > dayStart + DAY ? 'ادامه تا فردا' : `پایان کار · ${fmtDur(s.to - s.from)}` },
          ]),
          ...done.map((d) => ({ at: d.at, kind: 'done', task: d.task })),
        ].sort((a, b) => a.at - b.at);
        const first = sessions[0];
        const last = sessions[sessions.length - 1];

        return (
          <section key={user.id} className="card user-report" aria-label={`گزارش ${user.name}`}>
            <div className="user-report__head">
              <Avatar user={user} size="lg" />
              <div>
                <h2>{user.name}</h2>
                <span className="muted" style={{ fontSize: '0.84rem' }}>
                  {first ? `ورود ${fmtTime(first.from)} · ${last.running ? 'هنوز مشغول' : `خروج ${fmtTime(last.to)}`}` : 'این روز ساعتی ثبت نشده'}
                </span>
              </div>
              <div className="user-report__total">
                <b className="num">{fmtDur(total, { short: true })}</b>
                <small>ساعت کار · {fa(done.length)} تیک</small>
              </div>
            </div>

            <div>
              <div className="timeline" style={{ '--c': `var(--c-${user.color})` }} aria-hidden>
                {sessions.map((s) => (
                  <span key={s.id} className={`timeline__seg ${s.running ? 'is-running' : ''}`} style={{ insetInlineStart: pos(s.from), width: `calc(${pos(s.to)} - ${pos(s.from)})` }} />
                ))}
                {done.map((d) => (
                  <span key={`${d.task.id}${d.at}`} className="timeline__tick" style={{ insetInlineStart: pos(d.at) }} />
                ))}
              </div>
              <div className="timeline__hours" aria-hidden>
                {hourLabels.map((h) => (
                  <span key={h}>{fa(h)}</span>
                ))}
              </div>
            </div>

            {events.length ? (
              <ol className="log">
                {events.map((e, i) => (
                  <li key={i}>
                    <time>{fmtTime(e.at)}</time>
                    {e.kind === 'done' ? (
                      <>
                        <Icon name="check" className="ok" />
                        <span>
                          {e.task.title}
                          {e.task.projectId && <span className="faint"> · {db.projects.find((p) => p.id === e.task.projectId)?.name}</span>}
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon name={e.kind === 'in' ? 'play' : e.kind === 'live' ? 'clock' : 'stop'} className={e.kind === 'in' || e.kind === 'live' ? 'in' : 'out'} />
                        <span className={e.kind === 'out' ? 'muted' : ''}>{e.text}</span>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty" style={{ padding: '12px 0' }}>
                <Icon name="clock" />
                <span>نه ساعتی زده شده، نه تسکی تیک خورده.</span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RangeView({ db, view, range, today, now }) {
  const { days, totals } = rangeReport(db, range.start, range.length, now);
  const team = totals.reduce((n, t) => n + t.ms, 0);
  // weeks start on Saturday, so day i of a week is WEEKDAYS[i]
  const groups = days.map((d, i) => {
    const { jd } = jalali(d.key);
    return {
      key: d.key,
      label: view === 'week' ? WEEKDAYS[i] : fa(jd),
      sub: view === 'week' ? fmtDay(d.key, { weekday: false }) : null,
      title: fmtDay(d.key),
      isToday: d.key === today,
      values: d.users,
    };
  });
  const upto = days.filter((d) => d.key <= today).length || 1;

  return (
    <div className="stack">
      <div className={`tiles ${db.users.length === 2 ? 'tiles--3' : ''}`}>
        {totals.map((t) => (
          <div key={t.user.id} className="tile">
            <span className="tile__label">
              <Avatar user={t.user} size="sm" />
              {t.user.name}
            </span>
            <span className="tile__value">
              {fmtHours(t.ms)}
              <small>ساعت</small>
            </span>
            <span className="tile__hint">
              {fa(t.active)} روز کاری · میانگین {fmtDur(t.avg)} · {fa(t.done)} تیک
            </span>
          </div>
        ))}
        <div className="tile">
          <span className="tile__label">
            <Icon name="users" />
            کل تیم
          </span>
          <span className="tile__value">
            {fmtHours(team)}
            <small>ساعت</small>
          </span>
          <span className="tile__hint">میانگین روزانه‌ی تیم {fmtDur(team / upto)}</span>
        </div>
      </div>

      <section className="card">
        <div className="card__head">
          <h2>{view === 'week' ? 'ساعت کار هر روز هفته' : 'ساعت کار هر روز ماه'}</h2>
          <div className="legend">
            {db.users.map((u) => (
              <span key={u.id} style={{ '--c': `var(--c-${u.color})` }}>
                <i />
                {u.name}
              </span>
            ))}
          </div>
        </div>
        <HoursChart groups={groups} users={db.users.map(({ id, name, color }) => ({ id, name, color }))} mode={view === 'week' ? 'grouped' : 'stacked'} label={`نمودار ساعت کار ${view === 'week' ? 'هفته' : 'ماه'}؛ محور عمودی ساعت`} />
      </section>

      <details className="card card--flush">
        <summary className="btn btn--subtle" style={{ margin: 8 }}>
          <Icon name="tasks" />
          جدول روزبه‌روز
        </summary>
        <div className="table-wrap" style={{ border: 0, borderTop: '1px solid var(--line)', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>روز</th>
                {db.users.map((u) => (
                  <th key={u.id}>{u.name}</th>
                ))}
                <th>جمع</th>
                <th>تیک‌ها</th>
              </tr>
            </thead>
            <tbody>
              {days
                .filter((d) => d.key <= today)
                .map((d) => {
                  const sum = db.users.reduce((n, u) => n + d.users[u.id], 0);
                  return (
                    <tr key={d.key}>
                      <td>
                        <Link className="link" href={`/reports?view=day&date=${d.key}`}>
                          {fmtDay(d.key)}
                        </Link>
                      </td>
                      {db.users.map((u) => (
                        <td key={u.id} className="num">
                          {d.users[u.id] ? fmtDur(d.users[u.id], { short: true }) : '—'}
                        </td>
                      ))}
                      <td className="num">{sum ? fmtDur(sum, { short: true }) : '—'}</td>
                      <td className="num">{fa(db.users.reduce((n, u) => n + d.done[u.id], 0))}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
