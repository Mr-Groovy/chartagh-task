'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import TaskDrawer from './TaskDrawer';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Holds who's signed in, the team and projects, plus the two app-wide overlays:
// the task editor and the toast.
export function AppProvider({ me, users, projects, today, children }) {
  const [toastMsg, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // { task, defaults }
  const timer = useRef();

  const toast = useCallback((text, type = 'info') => {
    clearTimeout(timer.current);
    setToast({ text, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 6000 : 2800);
  }, []);

  // Await a server action; surface its error or a success note
  const run = useCallback(
    async (promise, okText) => {
      const res = await promise;
      if (res?.error) toast(res.error, 'error');
      else if (okText) toast(okText);
      return res;
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      me,
      users,
      projects,
      today,
      userById: (id) => users.find((u) => u.id === id),
      projectById: (id) => projects.find((p) => p.id === id),
      toast,
      run,
      openTask: (task = null, defaults = {}) => setEditing({ task, defaults }),
    }),
    [me, users, projects, today, toast, run]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      {editing && <TaskDrawer {...editing} onClose={() => setEditing(null)} />}
      {toastMsg && (
        <div key={toastMsg.id} className={`toast ${toastMsg.type === 'error' ? 'toast--error' : ''}`} role={toastMsg.type === 'error' ? 'alert' : 'status'}>
          <Icon name={toastMsg.type === 'error' ? 'alert' : 'check'} />
          {toastMsg.text}
        </div>
      )}
    </Ctx.Provider>
  );
}
