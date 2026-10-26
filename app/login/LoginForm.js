'use client';
import { useActionState, useState } from 'react';
import { login } from '@/app/actions';
import Icon from '@/components/Icon';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [show, setShow] = useState(false);

  return (
    <form className="login__card" action={action}>
      <h1>ورود به سیستم تسک</h1>
      <p>نام کاربری و رمز عبور خودتان را وارد کنید.</p>
      {state?.error && (
        <div className="form-error" role="alert">
          {state.error}
        </div>
      )}
      <div className="field">
        <label htmlFor="username">نام کاربری</label>
        <input id="username" name="username" className="input ltr" autoComplete="username" required defaultValue={state?.username} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">رمز عبور</label>
        <div className="pw">
          <input id="password" name="password" type={show ? 'text' : 'password'} className="input ltr" autoComplete="current-password" required />
          <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'} title={show ? 'پنهان کردن رمز' : 'نمایش رمز'}>
            <Icon name={show ? 'eyeOff' : 'eye'} />
          </button>
        </div>
      </div>
      <button className="btn btn--primary btn--lg" disabled={pending}>
        <Icon name="login" />
        {pending ? 'در حال ورود…' : 'ورود به پنل'}
      </button>
    </form>
  );
}
