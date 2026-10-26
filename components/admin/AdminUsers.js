'use client';
import { useState, useTransition } from 'react';
import Icon from '../Icon';
import Avatar from '../Avatar';
import { useApp } from '../AppContext';
import { updateUser, changePassword } from '@/app/actions';

const COLORS = [
  { id: 'brick', label: 'آجری' },
  { id: 'teal', label: 'فیروزه‌ای' },
];

function UserCard({ user }) {
  const { me, run } = useApp();
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.color);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pending, start] = useTransition();

  const saveProfile = (e) => {
    e.preventDefault();
    start(() => run(updateUser({ id: user.id, name, color }), 'پروفایل ذخیره شد'));
  };
  const savePw = (e) => {
    e.preventDefault();
    if (pw.length < 8) return setPwError('رمز عبور باید دست‌کم ۸ کاراکتر باشد.');
    start(async () => {
      const res = await run(changePassword({ id: user.id, password: pw }), user.id === me.id ? 'رمز شما عوض شد' : `رمز ${user.name} عوض شد؛ باید دوباره وارد شود`);
      if (!res?.error) setPw('');
    });
  };

  return (
    <section className="card stack" style={{ gap: 16 }}>
      <div className="user-report__head">
        <Avatar user={{ ...user, name, color }} size="lg" />
        <div>
          <h2>
            {user.name} {user.id === me.id && <span className="faint">(من)</span>}
          </h2>
          <span className="faint ltr" style={{ fontSize: '0.84rem' }}>
            @{user.username} · مدیر
          </span>
        </div>
      </div>
      <form onSubmit={saveProfile} className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor={`n-${user.id}`}>نام نمایشی</label>
          <input id={`n-${user.id}`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div className="field">
          <span className="field__label">رنگ در نمودارها</span>
          <div className="picker">
            {COLORS.map((c) => (
              <button type="button" key={c.id} className="swatch" style={{ '--c': `var(--c-${c.id})`, padding: 0 }} aria-pressed={color === c.id} aria-label={c.label} title={c.label} onClick={() => setColor(c.id)} />
            ))}
          </div>
        </div>
        <button className="btn btn--ghost" style={{ alignSelf: 'flex-start' }} disabled={pending}>
          ذخیره‌ی پروفایل
        </button>
      </form>
      <form onSubmit={savePw} className="stack" style={{ gap: 12, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="field">
          <label htmlFor={`p-${user.id}`}>رمز عبور تازه</label>
          <input
            id={`p-${user.id}`}
            type="password"
            className="input ltr"
            value={pw}
            onChange={(e) => (setPw(e.target.value), setPwError(''))}
            onBlur={() => pw && pw.length < 8 && setPwError('رمز عبور باید دست‌کم ۸ کاراکتر باشد.')}
            autoComplete="new-password"
            aria-describedby={`ph-${user.id}`}
          />
          <small id={`ph-${user.id}`} className={pwError ? '' : 'faint'} style={pwError ? { color: 'var(--danger)' } : undefined}>
            {pwError || 'دست‌کم ۸ کاراکتر. بعد از تغییر، دستگاه‌های دیگر از حساب خارج می‌شوند.'}
          </small>
        </div>
        <button className="btn btn--ghost" style={{ alignSelf: 'flex-start' }} disabled={pending}>
          <Icon name="key" />
          تغییر رمز
        </button>
      </form>
    </section>
  );
}

export default function AdminUsers() {
  const { users } = useApp();
  return (
    <div className="stack">
      <div className="grid grid--2">
        {users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>
      <section className="card row">
        <div className="spacer">
          <h2>پشتیبان‌گیری</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            همه‌ی تسک‌ها، پروژه‌ها و ساعت‌ها در یک فایل JSON. سرور هم هر روز یک نسخه در پوشه‌ی data/backups نگه می‌دارد.
          </p>
        </div>
        <a className="btn btn--ghost" href="/api/backup" download>
          <Icon name="download" />
          دانلود پشتیبان
        </a>
      </section>
    </div>
  );
}
