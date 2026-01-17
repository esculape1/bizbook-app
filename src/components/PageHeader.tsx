
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="shrink-0 text-lg font-semibold md:text-2xl">{title}</h1>
      {actions && <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div>}
    </div>
  );
}
