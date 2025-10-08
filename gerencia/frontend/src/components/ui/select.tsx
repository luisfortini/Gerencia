import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ className, children, ...props }) => (
  <select
    className={cn(
        'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      className
    )}
    {...props}
  >
    {children}
  </select>
);
