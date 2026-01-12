import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
      {/* Title is hidden on desktop as it's shown in the main header, but also needs to be hidden on mobile to not interfere with main nav trigger */}
      <h2 className="text-3xl font-bold tracking-tight hidden">{title}</h2>
      
      {actions && <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">{actions}</div>}
    </div>
  );
}
