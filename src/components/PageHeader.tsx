
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="shrink-0 text-lg font-semibold md:text-2xl">{title}</h1>
      {actions && <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">{actions}</div>}
    </div>
  );
}
