'use client';
import { useTransition } from 'react';
import Icon from './Icon';
import { useApp } from './AppContext';
import { useNow } from './useNow';
import { clockIn, clockOut } from '@/app/actions';
import { fmtClock } from '@/lib/date';

// Compact clock-in/out control that lives in every page header.
// `doneMs` is today's finished time; a running session keeps adding to it.
export default function TimerPill({ running, doneMs = 0 }) {
  const { run } = useApp();
  const [pending, start] = useTransition();
  const now = useNow(Boolean(running));
  const total = doneMs + (running ? now - Math.max(running.start, running.dayStart) : 0);

  const toggle = () =>
    start(async () => {
      await run(running ? clockOut() : clockIn(), running ? 'پایان کار ثبت شد' : 'تایمر روشن شد؛ کار خوبی داشته باشید');
    });

  return (
    <div className={`pill ${running ? 'is-on' : ''}`}>
      <span className={`status ${running ? 'is-on' : ''}`}>
        <i aria-hidden />
        <span className="sr-only">{running ? 'در حال کار' : 'خارج از کار'}</span>
      </span>
      <span className="num" aria-label="زمان کار امروز" suppressHydrationWarning>
        {fmtClock(total)}
      </span>
      <button
        type="button"
        className="pill__btn"
        onClick={toggle}
        disabled={pending}
        aria-label={running ? 'پایان کار' : 'آغاز به کار'}
        title={running ? 'پایان کار' : 'آغاز به کار'}
      >
        <Icon name={running ? 'stop' : 'play'} />
      </button>
    </div>
  );
}
