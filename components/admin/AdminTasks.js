'use client';
import { useMemo, useState, useTransition } from 'react';
import Icon from '../Icon';
import Avatar from '../Avatar';
import ConfirmDialog from '../ConfirmDialog';
import { useApp } from '../AppContext';
import { bulkUpdateTasks, deleteTasks } from '@/app/actions';
import { KINDS, PRIORITIES, isDone, kindLabel, sortTasks } from '@/lib/data';
import { fa, relDay } from '@/lib/date';

// Every task in one table: filter, select several, then move them between
// projects, people or sections in one go.
export default function AdminTasks({ tasks }) {
  const { users, projects, today, userById, projectById, openTask, run } = useApp();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [project, setProject] = useState('');
  const [who, setWho] = useState('');
  const [status, setStatus] = useState('open');
  const [sel, setSel] = useState(() => new Set());
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const text = q.trim();
    return sortTasks(
      tasks.filter(
        (t) =>
          (!text || t.title.includes(text) || t.notes.includes(text)) &&
          (!kind || t.kind === kind) &&
          (!project || (project === 'none' ? !t.projectId : t.projectId === project)) &&
          (!who || t.assignee === who) &&
          (status === 'all' || (status === 'done') === isDone(t, today))
      ),
      today
    );
  }, [tasks, q, kind, project, who, status, today]);

  const visibleSel = rows.filter((t) => sel.has(t.id)).map((t) => t.id);
  const allOn = rows.length > 0 && visibleSel.length === rows.length;
  const toggle = (id) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const apply = (patch, msg) =>
    start(async () => {
      const res = await run(bulkUpdateTasks(visibleSel, patch), msg);
      if (!res?.error) setSel(new Set());
    });

  const onPick = (field) => (e) => {
    const v = e.target.value;
    e.target.value = '';
    if (!v) return;
    if (field === 'projectId') apply({ projectId: v === 'none' ? null : v }, v === 'none' ? 'از پروژه جدا شدند' : `به «${projectById(v)?.name}» منتقل شدند`);
    if (field === 'assignee') apply({ assignee: v }, v === 'team' ? 'به هر دو نفر سپرده شد' : `به ${userById(v)?.name} سپرده شد`);
    if (field === 'kind') apply({ kind: v }, `به بخش ${kindLabel(v)} رفتند`);
    if (field === 'priority') apply({ priority: v }, 'اولویت عوض شد');
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <label className="quick-add" style={{ flex: '1 1 220px', padding: '2px 8px' }}>
          <Icon name="search" />
          <span className="sr-only">جستجو</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در عنوان و توضیحات" />
        </label>
        <select className="select" style={{ width: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="بخش">
          <option value="">همه‌ی بخش‌ها</option>
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={project} onChange={(e) => setProject(e.target.value)} aria-label="پروژه">
          <option value="">همه‌ی پروژه‌ها</option>
          <option value="none">بدون پروژه</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={who} onChange={(e) => setWho(e.target.value)} aria-label="انجام‌دهنده">
          <option value="">همه‌ی افراد</option>
          <option value="team">هر دو نفر</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="وضعیت">
          <option value="open">باز</option>
          <option value="done">انجام‌شده</option>
          <option value="all">همه</option>
        </select>
        <button type="button" className="btn btn--primary" onClick={() => openTask(null, {})}>
          <Icon name="plus" />
          تسک جدید
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 1 }}>
                <input
                  type="checkbox"
                  className="cbx"
                  checked={allOn}
                  onChange={() => setSel(allOn ? new Set() : new Set(rows.map((t) => t.id)))}
                  aria-label="انتخاب همه"
                />
              </th>
              <th>عنوان</th>
              <th>بخش</th>
              <th>پروژه</th>
              <th>انجام‌دهنده</th>
              <th>موعد</th>
              <th>وضعیت</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const p = t.projectId && projectById(t.projectId);
              const u = t.assignee !== 'team' && userById(t.assignee);
              const done = isDone(t, today);
              return (
                <tr key={t.id} className={sel.has(t.id) ? 'is-selected' : ''}>
                  <td>
                    <input type="checkbox" className="cbx" checked={sel.has(t.id)} onChange={() => toggle(t.id)} aria-label={`انتخاب ${t.title}`} />
                  </td>
                  <td className="wrap">
                    <span className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                      {t.priority === 'high' && <Icon name="flag" className="pri" title="فوری" />}
                      <span style={{ fontWeight: 600 }}>{t.title}</span>
                    </span>
                  </td>
                  <td>{kindLabel(t.kind)}</td>
                  <td>
                    {p ? (
                      <span className="chip" style={{ '--c': `var(--c-${p.color})` }}>
                        <i className="dot" />
                        {p.name}
                      </span>
                    ) : (
                      <span className="faint">—</span>
                    )}
                  </td>
                  <td>
                    <span className="row" style={{ flexWrap: 'nowrap' }}>
                      {u ? <Avatar user={u} size="sm" /> : <Avatar users={users} size="sm" />}
                      {u ? u.name : 'هر دو'}
                    </span>
                  </td>
                  <td>{t.due ? relDay(t.due, today) : <span className="faint">—</span>}</td>
                  <td>{done ? <span className="chip chip--ok">انجام شد</span> : <span className="chip">باز</span>}</td>
                  <td className="actions">
                    <button type="button" className="icon-btn" onClick={() => openTask(t)} aria-label={`ویرایش ${t.title}`} title="ویرایش">
                      <Icon name="edit" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <Icon name="search" />
                    <b>تسکی با این فیلترها پیدا نشد</b>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: '0.82rem' }}>
        {fa(rows.length)} تسک · برای جابه‌جایی چند تسک، تیکشان بزنید.
      </p>

      {visibleSel.length > 0 && (
        <div className="bulkbar" role="toolbar" aria-label="کار با تسک‌های انتخاب‌شده">
          <b style={{ paddingInline: 6 }}>{fa(visibleSel.length)} انتخاب</b>
          <Icon name="move" className="pri" />
          <select className="select" defaultValue="" onChange={onPick('projectId')} disabled={pending} aria-label="انتقال به پروژه">
            <option value="">انتقال به پروژه…</option>
            <option value="none">بدون پروژه</option>
            {projects
              .filter((p) => p.status !== 'done')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <select className="select" defaultValue="" onChange={onPick('assignee')} disabled={pending} aria-label="سپردن به">
            <option value="">سپردن به…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            <option value="team">هر دو نفر</option>
          </select>
          <select className="select" defaultValue="" onChange={onPick('kind')} disabled={pending} aria-label="انتقال به بخش">
            <option value="">انتقال به بخش…</option>
            {KINDS.filter((k) => k.id !== 'project').map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <select className="select" defaultValue="" onChange={onPick('priority')} disabled={pending} aria-label="اولویت">
            <option value="">اولویت…</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="spacer" />
          <button type="button" className="btn btn--subtle btn--sm" onClick={() => setConfirm(true)} disabled={pending}>
            <Icon name="trash" />
            حذف
          </button>
          <button type="button" className="btn btn--subtle btn--sm" onClick={() => setSel(new Set())}>
            لغو انتخاب
          </button>
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title={`حذف ${fa(visibleSel.length)} تسک انتخاب‌شده؟`}
          text="این تسک‌ها و سابقه‌ی تیک‌هایشان برای همیشه پاک می‌شوند."
          action={`حذف ${fa(visibleSel.length)} تسک`}
          onConfirm={() =>
            start(async () => {
              const res = await run(deleteTasks(visibleSel), 'تسک‌ها حذف شدند');
              if (!res?.error) setSel(new Set());
            })
          }
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
