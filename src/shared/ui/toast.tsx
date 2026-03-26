"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: number;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneClass(tone: ToastTone) {
  switch (tone) {
    case "error":
      return "mm-toast is-error";
    case "success":
      return "mm-toast is-success";
    default:
      return "mm-toast is-info";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, description, tone = "info", durationMs = 4200 }: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current,
        {
          id,
          title,
          description,
          tone,
          durationMs,
        },
      ]);

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="mm-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={toneClass(toast.tone)}>
            <div className="mm-toast-accent" />
            <div className="mm-toast-body">
              <p className="mm-toast-title">{toast.title}</p>
              {toast.description ? (
                <p className="mm-toast-description">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="mm-toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
