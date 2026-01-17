
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-end">
      {/* The title h1 element has been removed as per user request to avoid redundancy */}
      {actions && <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">{actions}</div>}
    </div>
  );
}
