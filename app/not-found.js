import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="login__form" style={{ minHeight: '100dvh' }}>
      <div className="login__card" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Logo />
        <h1>این صفحه پیدا نشد</h1>
        <p>شاید پروژه یا تسکش حذف شده باشد.</p>
        <Link href="/" className="btn btn--primary">
          برگشت به میز کار
        </Link>
      </div>
    </main>
  );
}
