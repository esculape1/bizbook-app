
import type { ReactNode } from 'react';

type PageHeaderProps = {
  children?: ReactNode;
};

export function PageHeader({ children }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-col items-stretch justify-end gap-2 md:flex-row md:items-center">
      {children}
    </div>
  );
}
