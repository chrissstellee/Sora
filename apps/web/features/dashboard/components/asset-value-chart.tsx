"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/ui/chart";

import { ASSET_VALUE_RANGES, type TAssetValueTimeRange } from "../constants/dashboard";

import type { IAssetValueDataPoint } from "../lib/types";

const chartConfig = {};

export function AssetValueChart({ data }: { data: IAssetValueDataPoint[] }) {
  const [range, setRange] = React.useState<TAssetValueTimeRange>("1M");

  const ranges = ASSET_VALUE_RANGES;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Asset Value Over Time
          </CardTitle>
          <div className="flex items-center gap-1">
            {ranges.map((r) => (
              <Button
                key={r}
                variant={range === r ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={3}
              fill="url(#colorValue)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
