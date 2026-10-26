'use client';
import { useState, useTransition } from 'react';
import Overlay from './Overlay';
import Icon from './Icon';
import Avatar from './Avatar';
import JDatePicker from './JDatePicker';
import ConfirmDialog from './ConfirmDialog';
import { useApp } from './AppContext';
import { createTask, updateTask, deleteTasks } from '@/app/actions';
import { KINDS, PRIORITIES, doneInfo } from '@/lib/data';
import { fmtDay, fmtTime, dayKey } from '@/lib/date';

// Slide-over to create or edit one task. Used everywhere through useApp().openTask().
export default function TaskDrawer({ task, defaults, onClose }) {
  const { users, projects, run, userById, today } = useApp();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState(() => ({
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    kind: task?.kind ?? defaults.kind ?? 'general',
    projectId: task?.projectId ?? defaults.projectId ?? '',
    assignee: task?.assignee ?? defaults.assignee ?? 'team',
    priority: task?.priority ?? 'normal',
    due: task?.due ?? defaults.due ?? null,
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const openProjects = projects.filter((p) => p.status !== 'done' || p.id === f.projectId);
  const done = task && doneInfo(task, today);

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setError('یک عنوان کوتاه برای تسک بنویسید.');
    if (f.kind === 'project' && !f.projectId) return setError('برای تسک پروژه‌ای، پروژه را انتخاب کنید.');
    start(async () => {
      const res = await run(task ? updateTask(task.id, f) : createTask(f), task ? 'تغییرات ذخیره شد' : 'تسک اضافه شد');
      if (!res?.error) onClose();
    });
  };

  const remove = () =>
    start(async () => {
      const res = await run(deleteTasks([task.id]), 'تسک حذف شد');
      if (!res?.error) onClose();
    });

  return (
    <Overlay className="drawer" onClose={onClose} label={task ? 'ویرایش تسک' : 'تسک جدید'}>
      <form onSubmit={save} style={{ display: 'contents' }} noValidate>
        <div className="drawer__head">
          <h2>{task ? 'ویرایش تسک' : 'تسک جدید'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="بستن" title="بستن" data-skip-focus>
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer__body">
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="t-title">عنوان</label>
            <input id="t-title" className="input" value={f.title} onChange={(e) => (set('title')(e), setError(''))} maxLength={200} placeholder="مثلاً طراحی بنر کمپین پاییز" />
          </div>

          <div className="field">
            <span className="field__label" id="t-kind">بخش</span>
            <div className="picker" role="group" aria-labelledby="t-kind">
              {KINDS.map((k) => (
                <button type="button" key={k.id} aria-pressed={f.kind === k.id} onClick={() => set('kind')(k.id)}>
                  <Icon name={k.icon} className="pri" />
                  {k.label}
                </button>
              ))}
            </div>
            {f.kind === 'daily' && <small className="faint">تسک روزانه هر روز از نو تیک می‌خورد و سابقه‌اش در گزارش‌ها می‌ماند.</small>}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="t-project">{f.kind === 'project' ? 'پروژه' : 'پروژه (اختیاری)'}</label>
              <select id="t-project" className="select" value={f.projectId ?? ''} onChange={set('projectId')}>
                <option value="">— بدون پروژه —</option>
                {openProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {f.kind !== 'daily' && (
              <div className="field">
                <label htmlFor="t-due">موعد</label>
                <JDatePicker id="t-due" value={f.due} onChange={set('due')} />
              </div>
            )}
          </div>

          <div className="field">
            <span className="field__label" id="t-who">انجام‌دهنده</span>
            <div className="picker" role="group" aria-labelledby="t-who">
              <button type="button" aria-pressed={f.assignee === 'team'} onClick={() => set('assignee')('team')}>
                <Avatar users={users} size="sm" />
                هر دو نفر
              </button>
              {users.map((u) => (
                <button type="button" key={u.id} aria-pressed={f.assignee === u.id} onClick={() => set('assignee')(u.id)}>
                  <Avatar user={u} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label" id="t-pri">اولویت</span>
            <div className="picker" role="group" aria-labelledby="t-pri">
              {PRIORITIES.map((p) => (
                <button type="button" key={p.id} aria-pressed={f.priority === p.id} onClick={() => set('priority')(p.id)}>
                  {p.id === 'high' && <Icon name="flag" className="pri" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="t-notes">توضیحات</label>
            <textarea id="t-notes" className="textarea" value={f.notes} onChange={set('notes')} maxLength={4000} placeholder="جزئیات، لینک فایل‌ها یا نکته‌ای برای هم‌تیمی" />
          </div>

          {task && (
            <p className="faint" style={{ fontSize: '0.8rem' }}>
              ساخته‌شده توسط {userById(task.createdBy)?.name ?? '—'} · {fmtDay(dayKey(task.createdAt))}
              {done && ` · انجام‌شده توسط ${userById(done.by)?.name ?? '—'} ساعت ${fmtTime(done.at)}`}
            </p>
          )}
        </div>
        <div className="drawer__foot">
          {task && (
            <button type="button" className="btn btn--danger" onClick={() => setConfirm(true)} disabled={pending}>
              <Icon name="trash" />
              حذف
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--subtle" onClick={onClose}>
            انصراف
          </button>
          <button className="btn btn--primary" disabled={pending}>
            <Icon name="check" />
            {task ? 'ذخیره‌ی تغییرات' : 'افزودن تسک'}
          </button>
        </div>
      </form>
      {confirm && (
        <ConfirmDialog
          title={`حذف «${task.title}»؟`}
          text="این تسک و سابقه‌ی تیک‌هایش برای همیشه پاک می‌شود."
          action="حذف تسک"
          onConfirm={remove}
          onClose={() => setConfirm(false)}
        />
      )}
    </Overlay>
  );
}
