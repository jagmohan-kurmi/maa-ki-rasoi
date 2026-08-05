import { type ReactNode, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
const listeners: ((toasts: ToastItem[]) => void)[] = [];
let currentToasts: ToastItem[] = [];

export function toast(type: ToastType, message: string) {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, type, message }];
  listeners.forEach(l => l(currentToasts));
  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    listeners.forEach(l => l(currentToasts));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 size={20} className="text-green-600" />,
    error: <XCircle size={20} className="text-red-600" />,
    info: <Info size={20} className="text-blue-600" />,
  };

  const bg: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-md animate-slide-up ${bg[t.type]}`}>
          {icons[t.type]}
          <p className="text-sm font-medium text-maroon-800">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
