import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-maroon-600 ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-maroon-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-maroon-800">{title}</h3>
      {description && <p className="text-maroon-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-red-600 font-medium">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-4">Try again</button>}
    </div>
  );
}
