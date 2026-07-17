"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { ChartContainer } from "@repo/ui/components/ui/chart";

import {
  PORTFOLIO_DISTRIBUTION_DEFAULT_COLORS,
  PORTFOLIO_TOTAL_LABEL,
} from "../constants/dashboard";

import type { IPortfolioDistributionItem } from "../lib/types";

export function PortfolioDistribution({
  distribution,
}: {
  distribution: IPortfolioDistributionItem[];
}) {
  const totalLabel = PORTFOLIO_TOTAL_LABEL;
  const chartConfig = {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
          Portfolio Distribution
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="mx-auto h-[180px] w-full max-w-[200px]">
          <PieChart>
            <Pie
              data={distribution}
              dataKey="percent"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={2}
              stroke="transparent"
            >
              {distribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.color ||
                    PORTFOLIO_DISTRIBUTION_DEFAULT_COLORS[
                      index % PORTFOLIO_DISTRIBUTION_DEFAULT_COLORS.length
                    ]
                  }
                />
              ))}
            </Pie>
            {/* center label */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-display text-xl font-bold"
            >
              {totalLabel}
            </text>
          </PieChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {distribution.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <span className="font-semibold text-foreground">{item.percent}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
