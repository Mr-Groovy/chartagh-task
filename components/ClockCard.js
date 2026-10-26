'use client';
import { useTransition } from 'react';
import Icon from './Icon';
import { useApp } from './AppContext';
import { useNow } from './useNow';
import { clockIn, clockOut } from '@/app/actions';
import { fmtClock, fmtTime } from '@/lib/date';

// The big "آغاز به کار / پایان کار" card on the dashboard.
export default function ClockCard({ running, doneMs, sessions }) {
  const { run } = useApp();
  const [pending, start] = useTransition();
  const now = useNow(Boolean(running));
  const current = running ? now - Math.max(running.start, running.dayStart) : 0;

  const toggle = () =>
    start(async () => {
      await run(running ? clockOut() : clockIn(), running ? 'پایان کار ثبت شد' : 'تایمر روشن شد؛ کار خوبی داشته باشید');
    });

  return (
    <section className={`card clock ${running ? 'is-on' : ''}`} aria-labelledby="clock-title">
      <svg className="clock__ring" viewBox="-50 -50 100 100" aria-hidden>
        <polygon
          fill="currentColor"
          points={Array.from({ length: 16 }, (_, i) => {
            const a = (i * Math.PI) / 8 - Math.PI / 2;
            const r = i % 2 ? 26 : 48;
            return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
          }).join(' ')}
        />
      </svg>
      <div className="clock__top">
        <h2 id="clock-title" className="spacer">
          ساعت کاری امروز
        </h2>
        <span className={`status ${running ? 'is-on' : ''}`}>
          <i aria-hidden />
          {running ? 'در حال کار' : 'خارج از کار'}
        </span>
      </div>
      <div>
        <div className="clock__time" suppressHydrationWarning>
          {fmtClock(doneMs + current)}
        </div>
        <p className="clock__sub" suppressHydrationWarning>
          {running ? `از ساعت ${fmtTime(running.start)} مشغول هستید · این نوبت ${fmtClock(current)}` : doneMs ? 'تایمر خاموش است؛ برای ادامه دوباره شروع کنید.' : 'هنوز شروع نکرده‌اید. وقتی پشت کار نشستید تایمر را روشن کنید.'}
        </p>
      </div>
      <div className="clock__actions">
        <button className={`btn btn--lg ${running ? 'btn--ghost' : 'btn--primary'}`} onClick={toggle} disabled={pending}>
          <Icon name={running ? 'stop' : 'play'} />
          {running ? 'پایان کار' : doneMs ? 'ادامه‌ی کار' : 'آغاز به کار'}
        </button>
      </div>
      {sessions.length > 0 && (
        <ul className="clock__log" aria-label="نوبت‌های امروز">
          {sessions.map((s) => (
            <li key={s.id} className="chip">
              <Icon name="clock" />
              {fmtTime(s.start)} تا {s.end ? fmtTime(s.end) : 'الان'}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
