'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

// Shares the 'chartagh-theme' key with the agency site, so both remember the same choice per browser.
export default function ThemeToggle({ className = 'icon-btn' }) {
  const [night, setNight] = useState(false);
  useEffect(() => setNight(document.documentElement.dataset.theme === 'night'), []);

  const toggle = () => {
    const next = night ? 'day' : 'night';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('chartagh-theme', next);
    } catch {}
    setNight(!night);
  };

  const label = night ? 'حالت روز' : 'حالت شب';
  return (
    <button type="button" className={className} onClick={toggle} aria-label={label} title={label}>
      <Icon name={night ? 'sun' : 'moon'} />
    </button>
  );
}
