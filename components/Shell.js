'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import Icon from './Icon';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
import { useApp } from './AppContext';
import { logout } from '@/app/actions';
import { fa } from '@/lib/date';

const NAV = [
  { href: '/', label: 'میز کار', icon: 'home' },
  { href: '/tasks', label: 'تسک‌ها', icon: 'tasks', count: 'open' },
  { href: '/projects', label: 'پروژه‌ها', icon: 'folder' },
  { href: '/reports', label: 'گزارش‌ها', icon: 'chart' },
];
const ADMIN = { href: '/admin', label: 'مدیریت', icon: 'shield' };

const isActive = (path, href) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

export default function Shell({ openCount, children }) {
  const { me } = useApp();
  const path = usePathname();
  const items = me.role === 'admin' ? [...NAV, ADMIN] : NAV;

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="میز کار">
          <Logo />
          <span>
            <b>چارطاق</b>
            <small>سیستم تسک تیم</small>
          </span>
        </Link>
        <nav className="nav" aria-label="منوی اصلی">
          {items.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? 'page' : undefined}>
              <Icon name={n.icon} />
              {n.label}
              {n.count && openCount > 0 && (
                <span className="nav__count" aria-label={`${fa(openCount)} تسک باز`}>
                  {fa(openCount)}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="me">
            <Avatar user={me} />
            <span className="me__text">
              <b>{me.name}</b>
              <small className="ltr">@{me.username}</small>
            </span>
            <ThemeToggle />
            <form action={logout}>
              <button className="icon-btn" aria-label="خروج از حساب" title="خروج از حساب">
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="main">{children}</div>

      <nav className="tabbar" aria-label="منوی اصلی">
        {items.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(path, n.href) ? 'page' : undefined}>
            <Icon name={n.icon} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
