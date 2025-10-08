import React from 'react';
import { cn } from '@/lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full min-w-full divide-y divide-border', className)} {...props} />
  </div>
);

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-muted/40', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-border bg-surface', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('hover:bg-muted/40', className)} {...props} />
);

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 text-sm text-foreground', className)} {...props} />
);
