'use client';
import { useState, useTransition } from 'react';
import Icon from '../Icon';
import Avatar from '../Avatar';
import Overlay from '../Overlay';
import JDatePicker from '../JDatePicker';
import ConfirmDialog from '../ConfirmDialog';
import { useApp } from '../AppContext';
import { saveSession, deleteSession } from '@/app/actions';
import { dayKey, fmtDay, fmtDur, fmtTime, fromParts, toHHMM } from '@/lib/date';

// Fix a forgotten clock-out, add time worked away from the panel, or remove a mistake.
export default function AdminTime({ sessions }) {
  const { users, userById, today } = useApp();
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [, start] = useTransition();
  const { run } = useApp();
  const now = Date.now();

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row">
        <p className="muted spacer" style={{ fontSize: '0.9rem' }}>
          نوبت‌های کاری این بازه. اگر کسی یادش رفته تایمر را خاموش کند، ساعت پایان را اینجا درست کنید.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => setEdit({ userId: users[0].id, start: null, end: null, note: '' })}>
          <Icon name="plus" />
          ثبت ساعت دستی
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>نفر</th>
              <th>روز</th>
              <th>ورود</th>
              <th>خروج</th>
              <th>مدت</th>
              <th>یادداشت</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const u = userById(s.userId);
              const long = !s.end && now - s.start > 14 * 3600e3;
              return (
                <tr key={s.id}>
                  <td>
                    <span className="row" style={{ flexWrap: 'nowrap' }}>
                      {u && <Avatar user={u} size="sm" />}
                      {u?.name ?? '—'}
                    </span>
                  </td>
                  <td>{fmtDay(dayKey(s.start))}</td>
                  <td className="num">{fmtTime(s.start)}</td>
                  <td className="num">
                    {s.end ? (
                      fmtTime(s.end) + (dayKey(s.end) !== dayKey(s.start) ? ' (روز بعد)' : '')
                    ) : (
                      <span className={`chip ${long ? 'chip--danger' : 'chip--ok'}`}>{long ? 'باز مانده!' : 'در حال کار'}</span>
                    )}
                  </td>
                  <td className="num">{fmtDur((s.end ?? now) - s.start, { short: true })}</td>
                  <td className="wrap muted">{s.note || '—'}</td>
                  <td className="actions">
                    <span className="row" style={{ flexWrap: 'nowrap', gap: 2 }}>
                      <button type="button" className="icon-btn" onClick={() => setEdit(s)} aria-label="ویرایش نوبت" title="ویرایش">
                        <Icon name="edit" />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setDel(s)} aria-label="حذف نوبت" title="حذف">
                        <Icon name="trash" />
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {!sessions.length && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">
                    <Icon name="clock" />
                    <b>در این ماه ساعتی ثبت نشده</b>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {edit && <SessionDrawer session={edit} today={today} onClose={() => setEdit(null)} />}
      {del && (
        <ConfirmDialog
          title="حذف این نوبت کاری؟"
          text={`${userById(del.userId)?.name} · ${fmtDay(dayKey(del.start))} از ${fmtTime(del.start)}؛ این ساعت از گزارش‌ها کم می‌شود.`}
          action="حذف نوبت"
          onConfirm={() => start(() => run(deleteSession(del.id), 'نوبت حذف شد'))}
          onClose={() => setDel(null)}
        />
      )}
    </div>
  );
}

function SessionDrawer({ session, today, onClose }) {
  const { users, run } = useApp();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [f, setF] = useState(() => ({
    userId: session.userId,
    day: session.start ? dayKey(session.start) : today,
    from: session.start ? toHHMM(session.start) : '09:00',
    endDay: session.end ? dayKey(session.end) : session.start ? dayKey(session.start) : today,
    to: session.end ? toHHMM(session.end) : '17:00',
    open: session.id ? !session.end : false,
    note: session.note ?? '',
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }));

  const save = (e) => {
    e.preventDefault();
    const startMs = fromParts(f.day, f.from);
    const endMs = f.open ? null : fromParts(f.endDay, f.to);
    if (endMs !== null && endMs <= startMs) return setError('ساعت خروج باید بعد از ساعت ورود باشد.');
    start(async () => {
      const res = await run(saveSession({ id: session.id, userId: f.userId, start: startMs, end: endMs, note: f.note }), 'ساعت ذخیره شد');
      if (!res?.error) onClose();
    });
  };

  return (
    <Overlay className="drawer" onClose={onClose} label={session.id ? 'ویرایش نوبت کاری' : 'ثبت ساعت دستی'}>
      <form onSubmit={save} style={{ display: 'contents' }} noValidate>
        <div className="drawer__head">
          <h2>{session.id ? 'ویرایش نوبت کاری' : 'ثبت ساعت دستی'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="بستن" title="بستن" data-skip-focus>
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer__body">
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="field">
            <span className="field__label" id="s-user">نفر</span>
            <div className="picker" role="group" aria-labelledby="s-user">
              {users.map((u) => (
                <button type="button" key={u.id} aria-pressed={f.userId === u.id} onClick={() => set('userId')(u.id)}>
                  <Avatar user={u} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="s-day">روز ورود</label>
              <JDatePicker id="s-day" value={f.day} allowEmpty={false} onChange={(v) => setF((s) => ({ ...s, day: v, endDay: s.endDay < v ? v : s.endDay }))} />
            </div>
            <div className="field">
              <label htmlFor="s-from">ساعت ورود</label>
              <input id="s-from" type="time" className="input ltr" value={f.from} onChange={(e) => (set('from')(e), setError(''))} />
            </div>
          </div>
          <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" className="cbx" checked={f.open} onChange={set('open')} />
            هنوز در حال کار است (تایمر باز بماند)
          </label>
          {!f.open && (
            <div className="form-grid">
              <div className="field">
                <label htmlFor="s-endday">روز خروج</label>
                <JDatePicker id="s-endday" value={f.endDay} allowEmpty={false} onChange={set('endDay')} />
              </div>
              <div className="field">
                <label htmlFor="s-to">ساعت خروج</label>
                <input id="s-to" type="time" className="input ltr" value={f.to} onChange={(e) => (set('to')(e), setError(''))} />
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="s-note">یادداشت</label>
            <input id="s-note" className="input" value={f.note} onChange={set('note')} maxLength={300} placeholder="مثلاً جلسه‌ی حضوری با مشتری" />
          </div>
        </div>
        <div className="drawer__foot">
          <span className="spacer" />
          <button type="button" className="btn btn--subtle" onClick={onClose}>
            انصراف
          </button>
          <button className="btn btn--primary" disabled={pending}>
            <Icon name="check" />
            ذخیره‌ی ساعت
          </button>
        </div>
      </form>
    </Overlay>
  );
}
