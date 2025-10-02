import React from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ open, onOpenChange, title, description, children, widthClass = 'max-w-2xl' }) => {
  const container = React.useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);

  if (!open || !container) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className={cn('relative h-full w-full bg-white shadow-xl', widthClass)}>
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description ? <p className="text-sm text-gray-500">{description}</p> : null}
          </div>
          <button className="text-gray-400 transition hover:text-gray-600" onClick={() => onOpenChange(false)}>
            ×
          </button>
        </div>
        <div className="h-[calc(100%-72px)] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    container
  );
};
