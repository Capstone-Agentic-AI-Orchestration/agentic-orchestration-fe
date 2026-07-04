"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Lightweight toast notification system for orchestration events.
 * No external dependencies — uses React context + CSS animations.
 */

type ToastTone = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastCounter}`;
    const duration = toast.duration ?? 5000;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ tone: "success", title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ tone: "info", title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ tone: "warning", title, message });
  }, [addToast]);

  const err = useCallback((title: string, message?: string) => {
    addToast({ tone: "error", title, message, duration: 8000 });
  }, [addToast]);

  const ctx = useMemo(
    () => ({ toasts, addToast, removeToast, success, info, warning, error: err }),
    [toasts, addToast, removeToast, success, info, warning, err],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const TONE_ICONS: Record<ToastTone, string> = {
  success: "\u2713",
  info: "\u2139",
  warning: "\u26A0",
  error: "\u2717",
};

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.tone}`}
          onClick={() => onDismiss(t.id)}
        >
          <span className="toast-icon">{TONE_ICONS[t.tone]}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
          <button
            className="toast-dismiss"
            onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
