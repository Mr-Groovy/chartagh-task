import Link from 'next/link';
import Logo from './Logo';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import TimerPill from './TimerPill';
import { logout } from '@/app/actions';

// Page header: title on one side, the live work timer always on the other.
export default function Topbar({ title, subtitle, clock, children }) {
  return (
    <header className="topbar">
      <Link href="/" className="brand mobile-only" aria-label="میز کار">
        <Logo />
      </Link>
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar__actions">
        {children}
        <TimerPill {...clock} />
        <span className="mobile-only">
          <ThemeToggle />
        </span>
        <form action={logout} className="mobile-only">
          <button className="icon-btn" aria-label="خروج از حساب" title="خروج از حساب">
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </header>
  );
}
