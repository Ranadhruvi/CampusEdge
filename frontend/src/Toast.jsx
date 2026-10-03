import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const showError = useCallback((msg) => addToast(msg, 'error', 4500), [addToast]);
  const showWarning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full font-sans">
        {toasts.map(toast => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let icon = 'ℹ️';

          if (toast.type === 'success') {
            bg = 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20';
            icon = '✅';
          } else if (toast.type === 'error') {
            bg = 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20';
            icon = '🚨';
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20';
            icon = '⚠️';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all transform animate-fade-in ${bg}`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-xs sm:text-sm font-bold flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 font-black text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showSuccess: (msg) => console.log('Success:', msg),
      showError: (msg) => console.error('Error:', msg),
      showWarning: (msg) => console.warn('Warning:', msg),
      showInfo: (msg) => console.info('Info:', msg),
      addToast: (msg) => console.log('Toast:', msg)
    };
  }
  return context;
}
