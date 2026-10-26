'use client';
import Icon from './Icon';
import { useApp } from './AppContext';

export default function NewTaskButton({ kind, projectId, label = 'تسک جدید' }) {
  const { openTask, me } = useApp();
  return (
    <button type="button" className="btn btn--primary" onClick={() => openTask(null, { kind, projectId, assignee: me.id })}>
      <Icon name="plus" />
      {label}
    </button>
  );
}
