'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Overlay from './Overlay';
import Icon from './Icon';
import JDatePicker from './JDatePicker';
import ConfirmDialog from './ConfirmDialog';
import { useApp } from './AppContext';
import { saveProject, deleteProject } from '@/app/actions';
import { PROJECT_COLORS, PROJECT_STATUS } from '@/lib/data';

const COLOR_NAMES = { brick: 'آجری', teal: 'فیروزه‌ای', sand: 'ماسه‌ای', umber: 'قهوه‌ای', terracotta: 'سفالی', ink: 'دوده‌ای' };

export default function ProjectDrawer({ project, onClose, afterDelete }) {
  const { run } = useApp();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [keepTasks, setKeepTasks] = useState(true);
  const [error, setError] = useState('');
  const [f, setF] = useState({
    name: project?.name ?? '',
    client: project?.client ?? '',
    description: project?.description ?? '',
    color: project?.color ?? 'brick',
    status: project?.status ?? 'active',
    due: project?.due ?? null,
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setError('نام پروژه را بنویسید.');
    start(async () => {
      const res = await run(saveProject({ ...f, id: project?.id }), project ? 'پروژه ذخیره شد' : 'پروژه ساخته شد');
      if (res?.error) return;
      onClose();
      if (!project) router.push(`/projects/${res.value}`);
    });
  };

  const remove = () =>
    start(async () => {
      const res = await run(deleteProject(project.id, keepTasks), 'پروژه حذف شد');
      if (!res?.error) {
        onClose();
        afterDelete?.();
      }
    });

  return (
    <Overlay className="drawer" onClose={onClose} label={project ? 'ویرایش پروژه' : 'پروژه‌ی جدید'}>
      <form onSubmit={save} style={{ display: 'contents' }} noValidate>
        <div className="drawer__head">
          <h2>{project ? 'ویرایش پروژه' : 'پروژه‌ی جدید'}</h2>
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
            <label htmlFor="p-name">نام پروژه</label>
            <input id="p-name" className="input" value={f.name} onChange={(e) => (set('name')(e), setError(''))} maxLength={120} placeholder="مثلاً سایت فروشگاه مانتو" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="p-client">کارفرما</label>
              <input id="p-client" className="input" value={f.client} onChange={set('client')} maxLength={120} placeholder="نام مشتری" />
            </div>
            <div className="field">
              <label htmlFor="p-due">تاریخ تحویل</label>
              <JDatePicker id="p-due" value={f.due} onChange={set('due')} />
            </div>
          </div>
          <div className="field">
            <span className="field__label" id="p-status">وضعیت</span>
            <div className="picker" role="group" aria-labelledby="p-status">
              {PROJECT_STATUS.map((s) => (
                <button type="button" key={s.id} aria-pressed={f.status === s.id} onClick={() => set('status')(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label" id="p-color">رنگ</span>
            <div className="picker" role="group" aria-labelledby="p-color">
              {PROJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className="swatch"
                  style={{ '--c': `var(--c-${c})`, padding: 0 }}
                  aria-pressed={f.color === c}
                  aria-label={COLOR_NAMES[c]}
                  title={COLOR_NAMES[c]}
                  onClick={() => set('color')(c)}
                />
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-desc">توضیحات</label>
            <textarea id="p-desc" className="textarea" value={f.description} onChange={set('description')} maxLength={2000} placeholder="هدف پروژه، لینک‌ها، نکات کارفرما" />
          </div>
        </div>
        <div className="drawer__foot">
          {project && (
            <button type="button" className="btn btn--danger" onClick={() => setConfirm(true)} disabled={pending}>
              <Icon name="trash" />
              حذف پروژه
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--subtle" onClick={onClose}>
            انصراف
          </button>
          <button className="btn btn--primary" disabled={pending}>
            <Icon name="check" />
            {project ? 'ذخیره‌ی تغییرات' : 'ساخت پروژه'}
          </button>
        </div>
      </form>
      {confirm && (
        <ConfirmDialog title={`حذف پروژه‌ی «${project.name}»؟`} action="حذف پروژه" onConfirm={remove} onClose={() => setConfirm(false)}>
          <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" className="cbx" checked={keepTasks} onChange={(e) => setKeepTasks(e.target.checked)} />
            تسک‌هایش نگه داشته شوند و به بخش «کلی» بروند
          </label>
          {!keepTasks && <p style={{ color: 'var(--danger)' }}>همه‌ی تسک‌های این پروژه هم برای همیشه پاک می‌شوند.</p>}
        </ConfirmDialog>
      )}
    </Overlay>
  );
}
