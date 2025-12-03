"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TimeSeriesData } from "@/types/dashboard";

export const description = "Supporter growth over time";

interface ChartAreaInteractiveProps {
  data: TimeSeriesData | null;
  isLoading?: boolean;
}

const chartConfig = {
  totalSupporters: {
    label: "Total Supporters",
    color: "hsl(var(--primary))",
  },
  newSupporters: {
    label: "New Supporters",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({
  data,
  isLoading,
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  if (isLoading || !data || data.data.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Supporter Growth</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = data.data.map((point) => ({
    date: point.date,
    totalSupporters: point.cumulativeSupporters,
    newSupporters: point.newSupporters,
  }));

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Supporter Growth</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total and new supporters over time
          </span>
          <span className="@[540px]/card:hidden">Supporter growth</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-totalSupporters)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalSupporters)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-newSupporters)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-newSupporters)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={data.periodType === "daily" ? 24 : 32}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (data.periodType === "daily") {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                } else if (data.periodType === "weekly") {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                } else {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  });
                }
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="newSupporters"
              type="natural"
              fill="url(#fillNew)"
              stroke="var(--color-newSupporters)"
              strokeWidth={2}
            />
            <Area
              dataKey="totalSupporters"
              type="natural"
              fill="url(#fillTotal)"
              stroke="var(--color-totalSupporters)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
