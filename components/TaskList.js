'use client';
import { useOptimistic, useTransition } from 'react';
import Icon from './Icon';
import Avatar from './Avatar';
import { useApp } from './AppContext';
import { toggleTask } from '@/app/actions';
import { doneInfo, isDone, kindLabel } from '@/lib/data';
import { diffDays, fmtTime, relDay } from '@/lib/date';

export function TaskRow({ task, showProject = true, showKind = false }) {
  const { users, today, userById, projectById, openTask, run } = useApp();
  const [pending, start] = useTransition();
  const done = isDone(task, today);
  const [optDone, setOptDone] = useOptimistic(done);
  const assignee = task.assignee === 'team' ? null : userById(task.assignee);
  const project = showProject && task.projectId ? projectById(task.projectId) : null;
  const info = doneInfo(task, today);
  const overdue = !optDone && task.due && diffDays(task.due, today) < 0;
  const dueToday = !optDone && task.due === today;

  const toggle = () =>
    start(async () => {
      setOptDone(!optDone);
      await run(toggleTask(task.id, !optDone));
    });

  return (
    <li className={`task ${optDone ? 'is-done' : ''}`}>
      <button type="button" role="checkbox" aria-checked={optDone} className="check" onClick={toggle} disabled={pending} aria-label={`انجام شد: ${task.title}`}>
        <Icon name="check" />
      </button>
      <button type="button" className="task__body" onClick={() => openTask(task)}>
        <span className="task__title">{task.title}</span>
        <span className="task__meta">
          {showKind && <span className="chip">{kindLabel(task.kind)}</span>}
          {task.kind === 'daily' && !showKind && (
            <span className="chip">
              <Icon name="repeat" />
              هر روز
            </span>
          )}
          {project && (
            <span className="chip" style={{ '--c': `var(--c-${project.color})` }}>
              <i className="dot" />
              <span className="chip__text">{project.name}</span>
            </span>
          )}
          {task.due && !optDone && (
            <span className={`chip ${overdue ? 'chip--danger' : dueToday ? 'chip--warn' : ''}`}>
              <Icon name="calendar" />
              {overdue ? `عقب‌افتاده · ${relDay(task.due, today)}` : relDay(task.due, today)}
            </span>
          )}
          {optDone && info && (
            <span className="chip chip--ok">
              <Icon name="check" />
              {userById(info.by)?.name} · {fmtTime(info.at)}
            </span>
          )}
          {task.notes && (
            <span className="chip" aria-label="توضیحات دارد" title="توضیحات دارد">
              <Icon name="note" />
            </span>
          )}
        </span>
      </button>
      <span className="task__side">
        {task.priority === 'high' && !optDone && <Icon name="flag" className="pri" title="فوری" />}
        {assignee ? <Avatar user={assignee} size="sm" /> : <Avatar users={users} size="sm" />}
      </span>
    </li>
  );
}

export default function TaskList({ tasks, showProject, showKind, empty }) {
  if (!tasks.length) return empty ?? null;
  return (
    <ul className="tasks">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} showProject={showProject} showKind={showKind} />
      ))}
    </ul>
  );
}
