import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
      <h2 className="text-3xl font-bold tracking-tight md:hidden">{title}</h2>
      
      {actions && <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">{actions}</div>}
    </div>
  );
}
