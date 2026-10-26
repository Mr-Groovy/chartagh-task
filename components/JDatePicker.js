'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { WEEKDAYS_SHORT, addDays, dayKey, fa, fmtDay, fmtMonth, jMonth, jalali, weekdayIndex } from '@/lib/date';

// Jalali calendar popover. Value is a Gregorian day key ('YYYY-MM-DD') or null.
export default function JDatePicker({ id, value, onChange, allowEmpty = true, placeholder = 'بدون تاریخ' }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(null); // fixed position, so drawers and tables never clip it
  const today = dayKey();
  const [cursor, setCursor] = useState(value ?? today);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && (e.stopPropagation(), setOpen(false));
    const hide = () => setOpen(false); // it's fixed-positioned, so don't leave it floating on scroll
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open]);

  const m = jMonth(cursor);
  const lead = weekdayIndex(m.start);
  const days = Array.from({ length: m.length }, (_, i) => addDays(m.start, i));
  const pick = (k) => {
    onChange(k);
    setOpen(false);
  };

  return (
    <div className="jdp" ref={ref}>
      <button
        id={id}
        type="button"
        className="input jdp__btn"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const below = innerHeight - r.bottom > 380;
          setAt({
            left: Math.min(Math.max(8, r.right - 296), innerWidth - 304),
            ...(below ? { top: r.bottom + 6 } : { bottom: innerHeight - r.top + 6 }),
          });
          setCursor(value ?? today);
          setOpen(!open);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="calendar" />
        <span className={value ? '' : 'faint'}>{value ? fmtDay(value, { year: jalali(value).jy !== jalali(today).jy }) : placeholder}</span>
      </button>
      {open && (
        <div className="jdp__pop" role="dialog" aria-label="انتخاب تاریخ" style={at}>
          <div className="jdp__head">
            <button type="button" className="icon-btn" onClick={() => setCursor(addDays(m.start, -1))} aria-label="ماه قبل" title="ماه قبل">
              <Icon name="prev" />
            </button>
            <span>{fmtMonth(m.start)}</span>
            <button type="button" className="icon-btn" onClick={() => setCursor(addDays(m.start, m.length))} aria-label="ماه بعد" title="ماه بعد">
              <Icon name="next" />
            </button>
          </div>
          <div className="jdp__grid">
            {WEEKDAYS_SHORT.map((d) => (
              <span key={d}>{d}</span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <i key={`l${i}`} />
            ))}
            {days.map((k, i) => (
              <button
                key={k}
                type="button"
                className={k === today ? 'is-today' : ''}
                aria-pressed={k === value}
                aria-label={fmtDay(k, { year: true })}
                onClick={() => pick(k)}
              >
                {fa(i + 1)}
              </button>
            ))}
          </div>
          <div className="jdp__quick">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => pick(today)}>
              امروز
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => pick(addDays(today, 1))}>
              فردا
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => pick(addDays(today, 7))}>
              هفته‌ی بعد
            </button>
            {allowEmpty && value && (
              <button type="button" className="btn btn--subtle btn--sm" onClick={() => pick(null)}>
                حذف تاریخ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
