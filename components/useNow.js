'use client';
import { useEffect, useState } from 'react';

// Current time, ticking every second while `live` is true.
export function useNow(live = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);
  return now;
}
