
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

interface EarningsChartProps {
  data: {
    date: string;
    earnings: number;
    expenses: number;
  }[];
  className?: string;
}

const EarningsChart = ({ data, className }: EarningsChartProps) => {
  return (
    <Card className={cn("card-hover", className)}>
      <CardHeader>
        <CardTitle>Ganhos vs Custos (7 dias)</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={(value) => `R$${value}`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <Tooltip 
                formatter={(value) => [`R$ ${value}`, undefined]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                name="Ganhos"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.4}
                name="Custos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsChart;
