"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import type { Settings, Invoice, Product } from "@/lib/types"

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
    products: Product[];
    currency: Settings['currency'];
}

export function SalesChart({ invoices, products, currency }: SalesChartProps) {
    const salesData = products.map(product => {
        const productSales = invoices
            .filter(inv => inv.status === 'Paid' || inv.status === 'Partially Paid')
            .flatMap(inv => inv.items)
            .filter(item => item.productId === product.id)
            .reduce((sum, item) => sum + item.total, 0);
        
        return {
            name: product.name,
            revenue: productSales,
        }
    }).filter(p => p.revenue > 0);

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
                tickFormatter={(value) => value.slice(0, 10) + '...'}
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
