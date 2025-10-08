import React from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, description, children, footer }) => {
  const container = React.useMemo(() => (typeof document !== 'undefined' ? document.body : null), []);

  if (!open || !container) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <button
              className="text-subtle transition hover:text-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar modal"
              type="button"
            >
              X
            </button>
          </div>
        </div>
        <div className="space-y-4 text-sm text-foreground">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    container
  );
};
