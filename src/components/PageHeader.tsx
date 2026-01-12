import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
