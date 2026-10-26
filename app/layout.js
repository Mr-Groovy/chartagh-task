import localFont from 'next/font/local';
import './globals.css';

const yekan = localFont({
  src: [
    { path: './fonts/YekanBakhFaNum-LIGHT.ttf', weight: '300' },
    { path: './fonts/YekanBakhFaNum-REGULAR.ttf', weight: '400' },
    { path: './fonts/YekanBakhFaNum-SEMIBOLD.ttf', weight: '600' },
    { path: './fonts/YekanBakhFaNum-BOLD.ttf', weight: '700' },
    { path: './fonts/YekanBakhFaNum-EXTRABOLD.ttf', weight: '800' },
    { path: './fonts/YekanBakhFaNum-BLACK.ttf', weight: '900' },
  ],
  variable: '--font-yekan',
  display: 'swap',
});

export const metadata = {
  title: { default: 'سیستم تسک چارطاق', template: '%s | تسک چارطاق' },
  description: 'پنل داخلی تسک‌ها، پروژه‌ها و ساعت کاری تیم چارطاق',
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4ece3' },
    { media: '(prefers-color-scheme: dark)', color: '#160b08' },
  ],
};

// Runs before paint so night mode never flashes. Day is the default, same key as the agency site.
const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem('chartagh-theme')==='night'?'night':'day'}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" data-theme="day" className={yekan.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
