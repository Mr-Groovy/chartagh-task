'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Open overlays, innermost last: only the top one reacts to keys.
const stack = [];

// Backdrop + focus handling shared by the drawer and dialogs:
// Escape closes, Tab stays inside, focus returns to whatever opened it.
export default function Overlay({ onClose, className, label, children }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const el = ref.current;
    const first = el?.querySelector('input, textarea, select, button:not([data-skip-focus])');
    (first ?? el)?.focus();
    stack.push(el);

    const onKey = (e) => {
      if (stack[stack.length - 1] !== el) return;
      if (e.key === 'Escape') close.current();
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll('a[href], button:not(:disabled), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) (z.focus(), e.preventDefault());
      else if (!e.shiftKey && document.activeElement === z) (a.focus(), e.preventDefault());
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(el), 1);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden />
      <div ref={ref} className={className} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </>,
    document.body
  );
}
