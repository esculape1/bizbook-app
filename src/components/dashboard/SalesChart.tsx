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
    const salesByProductAndPrice: { [key: string]: { name: string; revenue: number } } = {};

    invoices
        .filter(inv => inv.status !== 'Cancelled')
        .flatMap(inv => inv.items)
        .forEach(item => {
            const displayName = `${item.productName} (${formatCurrency(item.unitPrice, currency)})`;
            
            if (!salesByProductAndPrice[displayName]) {
                salesByProductAndPrice[displayName] = {
                    name: displayName,
                    revenue: 0,
                };
            }
            salesByProductAndPrice[displayName].revenue += item.total;
        });

    // Sort descending by revenue to show the highest earning products first, and take the top 15.
    const salesData = Object.values(salesByProductAndPrice)
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);
    
    const renderCustomizedLabel = (props: any) => {
        const { x, y, width, height, value } = props;
        
        // Always render the label outside, to the right of the bar.
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
                margin={{ top: 5, right: 120, left: 10, bottom: 5 }}
            >
            <XAxis type="number" hide />
            <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) =>
                    value.length > 40 ? value.slice(0, 40) + '...' : value
                }
                width={250}
                // Reversing the axis ensures that the first item in our sorted data (the largest) appears at the top.
                reversed={true}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value, name, props) => {
                    return (
                        <div className="flex flex-col">
                        <span className="font-medium text-foreground">{props.payload.name}</span>
                        <span className="text-sm text-muted-foreground">
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
