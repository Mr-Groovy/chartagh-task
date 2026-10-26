'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import ProjectDrawer from './ProjectDrawer';

// Opens the project editor; with no project it creates one.
export default function ProjectButton({ project, className = 'btn btn--primary', label, icon = 'plus', children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={label} title={children ? undefined : label}>
        {children ?? (
          <>
            <Icon name={icon} />
            {label}
          </>
        )}
      </button>
      {open && <ProjectDrawer project={project} onClose={() => setOpen(false)} afterDelete={() => router.push('/projects')} />}
    </>
  );
}
