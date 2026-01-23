
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
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
            // Create a unique name for display based on product name and unit price
            const displayName = `${item.productName} (${formatCurrency(item.unitPrice, currency)})`;
            
            if (!salesByProductAndPrice[displayName]) {
                salesByProductAndPrice[displayName] = {
                    name: displayName,
                    revenue: 0,
                };
            }
            salesByProductAndPrice[displayName].revenue += item.total;
        });

    const salesData = Object.values(salesByProductAndPrice)
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15); // Show top 15 products to keep the chart readable

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
        <ResponsiveContainer>
            <BarChart data={salesData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
            <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                interval={0}
            />
            <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value), currency)}
            />
            <Tooltip cursor={false} content={<ChartTooltipContent formatter={(value, name, props) => {
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{props.payload.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </div>
              );
            }} />} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
