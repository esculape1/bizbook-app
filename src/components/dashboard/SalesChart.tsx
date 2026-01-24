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

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
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
            // Group by product reference to have shorter labels, as requested.
            const refKey = item.reference;
            
            if (!salesByProductRef[refKey]) {
                salesByProductRef[refKey] = {
                    name: refKey, // This is the reference for the Y-axis label
                    productName: item.productName, // The full name for the tooltip
                    revenue: 0,
                };
            }
            salesByProductRef[refKey].revenue += item.total;
        });

    // Sort descending by revenue and take top 15.
    const salesData = Object.values(salesByProductRef)
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);
    
    const renderCustomizedLabel = (props: any) => {
        const { x, y, width, height, value } = props;
        
        return (
             <text 
                x={x + width + 5} 
                y={y + height / 2} 
                fill="hsl(var(--foreground))" 
                textAnchor="start" 
                dominantBaseline="middle"
                fontSize={12}
                fontWeight="500"
            >
                {formatCurrency(value, currency)}
            </text>
        );
    };

  return (
    <ChartContainer config={chartConfig} className="h-[500px] w-full">
        <ResponsiveContainer>
            <BarChart
                data={salesData}
                layout="vertical"
                margin={{ top: 5, right: 100, left: 5, bottom: 5 }} // Reduced margins for mobile
            >
            <XAxis type="number" hide />
            <YAxis
                dataKey="name" // Now displays the product reference
                type="category"
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) =>
                    value.length > 12 ? value.slice(0, 12) + '…' : value // Truncate long references
                }
                width={80} // Reduced width for shorter labels
                reversed={true}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value, name, props) => {
                    return (
                        <div className="flex flex-col p-1">
                            <span className="font-bold text-foreground">{props.payload.productName}</span>
                            <span className="text-sm text-muted-foreground">Réf: {props.payload.name}</span>
                            <span className="font-semibold text-foreground mt-2">
                                {formatCurrency(Number(value), currency)}
                            </span>
                        </div>
                    );
                }} />}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
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
