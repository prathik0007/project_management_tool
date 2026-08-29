import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';

// ─── Lightweight toast notification system (no dependencies) ────────────────
const ToastContext = createContext(() => { });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const notify = useCallback((message, tone = 'success') => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  const toneIcon = { success: 'check', error: 'alert', info: 'circle' };

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span className="toast-icon"><Icon name={toneIcon[t.tone] || 'circle'} size={15} /></span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
