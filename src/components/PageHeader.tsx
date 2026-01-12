import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
      {/* This title is now hidden on mobile to prevent layout shift */}
      <h2 className="text-3xl font-bold tracking-tight hidden md:block">{title}</h2>
      
      {/* The actions (including the mobile menu trigger) are now the primary visible element on mobile */}
      {actions && <div className="flex items-center gap-2 w-full md:w-auto justify-end">{actions}</div>}
    </div>
  );
}
