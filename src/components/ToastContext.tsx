import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div 
        className="toast-container" 
        role="region" 
        aria-label="Notifications" 
        aria-live="polite"
      >
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type}`}
            role="status"
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" aria-hidden="true" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#f43f5e" aria-hidden="true" />}
            {toast.type === 'info' && <Info size={18} color="#06b6d4" aria-hidden="true" />}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', flex: 1 }}>{toast.message}</span>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => removeToast(toast.id)} 
              aria-label="Dismiss notification"
              style={{ padding: '0.2rem' }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
