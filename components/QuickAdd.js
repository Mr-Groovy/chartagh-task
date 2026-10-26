'use client';
import { useRef, useState, useTransition } from 'react';
import Icon from './Icon';
import { useApp } from './AppContext';
import { createTask } from '@/app/actions';

// One-line task entry: type, Enter, done. Details can be edited afterwards in the drawer.
export default function QuickAdd({ kind = 'general', projectId = null, placeholder }) {
  const { me, users, projects, run } = useApp();
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(me.id);
  const [project, setProject] = useState(projectId ?? '');
  const [pending, start] = useTransition();
  const input = useRef(null);
  const needsProject = kind === 'project' && !projectId;
  const active = projects.filter((p) => p.status !== 'done');

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return input.current?.focus();
    if (needsProject && !project) return run(Promise.resolve({ error: 'اول پروژه‌ی این تسک را انتخاب کنید.' }));
    start(async () => {
      const res = await run(createTask({ title, kind, assignee, projectId: project || null }), 'تسک اضافه شد');
      if (!res?.error) {
        setTitle('');
        input.current?.focus();
      }
    });
  };

  return (
    <form className="quick-add" onSubmit={submit}>
      <Icon name="plus" />
      <label htmlFor={`qa-${kind}`} className="sr-only">
        عنوان تسک جدید
      </label>
      <input
        id={`qa-${kind}`}
        ref={input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder ?? 'تسک جدید بنویسید و Enter بزنید…'}
        maxLength={200}
        autoComplete="off"
      />
      <div className="quick-add__opts">
        {needsProject && (
          <select className="select" value={project} onChange={(e) => setProject(e.target.value)} aria-label="پروژه">
            <option value="">انتخاب پروژه</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="انجام‌دهنده">
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.id === me.id ? `${u.name} (من)` : u.name}
            </option>
          ))}
          <option value="team">هر دو نفر</option>
        </select>
        <button className="btn btn--primary btn--sm" disabled={pending}>
          افزودن
        </button>
      </div>
    </form>
  );
}
