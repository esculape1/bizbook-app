import { Card, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  description?: string;
  className?: string;
};

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-premium hover:shadow-xl transition-all duration-300 group relative",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-white/20 text-current shadow-inner group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {description && <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">{description}</span>}
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <h3 className="text-xl sm:text-xl md:text-2xl font-extrabold tracking-tight whitespace-nowrap overflow-visible">
            {value}
          </h3>
        </div>
      </CardContent>
      {/* Decorative background element for desktop */}
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
        <div className="scale-[3] transform-gpu">
            {icon}
        </div>
      </div>
    </Card>
  );
}
