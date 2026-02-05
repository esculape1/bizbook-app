
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import type { Settings, Invoice } from "@/lib/types"

const chartConfig = {
  revenue: {
    label: "Chiffre d'affaires",
  },
} satisfies ChartConfig

// Une palette de couleurs plus douce et professionnelle
const chartColors = [
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

type SalesChartProps = {
    invoices: Invoice[];
    currency: Settings['currency'];
}

export function SalesChart({ invoices, currency }: SalesChartProps) {
    const salesByProductRef: { [key: string]: { name: string; productName: string; revenue: number } } = {};

    invoices
        .filter(inv => inv.status !== 'Cancelled')
        .flatMap(inv => inv.items)
        .forEach(item => {
            const refKey = item.reference || 'Sans Réf';
            
            if (!salesByProductRef[refKey]) {
                salesByProductRef[refKey] = {
                    name: refKey,
                    productName: item.productName,
                    revenue: 0,
                };
            }
            salesByProductRef[refKey].revenue += item.total;
        });

    const salesData = Object.values(salesByProductRef)
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Limité à 10 pour plus de clarté
    
    const renderCustomizedLabel = (props: any) => {
        const { x, y, width, height, value } = props;
        
        return (
             <text 
                x={x + width + 8} 
                y={y + height / 2} 
                fill="currentColor" 
                className="fill-muted-foreground font-bold text-[11px]"
                textAnchor="start" 
                dominantBaseline="middle"
            >
                {formatCurrency(value, currency)}
            </text>
        );
    };

  return (
    <ChartContainer config={chartConfig} className="h-[450px] w-full">
        <ResponsiveContainer>
            <BarChart
                data={salesData}
                layout="vertical"
                margin={{ top: 5, right: 100, left: 10, bottom: 5 }}
                barGap={8}
            >
            <XAxis type="number" hide />
            <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                className="text-[11px] font-bold fill-muted-foreground"
                width={80}
            />
            <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
                content={<ChartTooltipContent formatter={(value, name, props) => {
                    return (
                        <div className="flex flex-col gap-1 p-1">
                            <span className="font-bold text-foreground text-sm">{props.payload.productName}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Réf: {props.payload.name}</span>
                            <div className="h-px bg-border my-1" />
                            <span className="font-extrabold text-primary">
                                {formatCurrency(Number(value), currency)}
                            </span>
                        </div>
                    );
                }} />}
            />
            <Bar 
                dataKey="revenue" 
                radius={[0, 10, 10, 0]} // Bords très arrondis
                barSize={24}
            >
                {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} fillOpacity={0.9} />
                ))}
                 <LabelList
                    dataKey="revenue"
                    content={renderCustomizedLabel}
                />
            </Bar>
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
