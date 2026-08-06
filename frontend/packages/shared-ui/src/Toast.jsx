import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

let idCounter = 0;

export function ToastProvider({ children, duration = DEFAULT_DURATION }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      const { type = 'info', duration: customDuration } = options;
      const id = ++idCounter;

      setToasts((current) => [...current, { id, message, type }]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, customDuration || duration);

      timers.current.set(id, timer);

      return id;
    },
    [dismiss, duration]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="sad-toast-stack" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`sad-toast sad-toast-${t.type}`}
            role="status"
            onClick={() => dismiss(t.id)}
          >
            <span className="sad-toast-message">{t.message}</span>
            <button
              type="button"
              className="sad-toast-close"
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * @returns {(message: string, options?: {type?: 'success'|'error'|'info', duration?: number}) => number}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return context;
}

export default ToastProvider;
