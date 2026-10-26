import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Logo from '@/components/Logo';
import LoginForm from './LoginForm';

export const metadata = { title: 'ورود' };

// شمسه tile: an 8-point star with a small diamond at the corners, used as a CSS mask
function shamsehTile() {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 ? 11 : 22;
    pts.push(`${(36 + r * Math.cos(a)).toFixed(1)},${(36 + r * Math.sin(a)).toFixed(1)}`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><polygon points='${pts.join(' ')}'/><path d='M0 -6L6 0L0 6L-6 0ZM72 -6L78 0L72 6L66 0ZM0 66L6 72L0 78L-6 72ZM72 66L78 72L72 78L66 72Z'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default async function LoginPage() {
  if (await currentUser()) redirect('/');
  return (
    <div className="login">
      <aside className="login__art">
        <span className="login__pat" style={{ '--pat': shamsehTile() }} aria-hidden />
        <Logo />
        <div>
          <h2>
            کارهای امروز،
            <br />
            ساعت کار و پروژه‌ها؛ یک‌جا.
          </h2>
          <p>پنل داخلی تیم چارطاق. با حساب خودتان وارد شوید و تایمر روز را روشن کنید.</p>
        </div>
      </aside>
      <main className="login__form">
        <LoginForm />
      </main>
    </div>
  );
}
