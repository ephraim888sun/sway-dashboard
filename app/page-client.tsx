"use client";

import { Suspense, useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { TopStates } from "@/components/top-states";
import { InfluenceInsights } from "@/components/influence-insights";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { useViewpointGroup } from "@/lib/viewpoint-group-context";
import {
  useSummaryMetrics,
  useStateDistribution,
  useElections,
  useTimeSeriesData,
} from "@/lib/hooks/use-dashboard-data";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { selectedGroupId } = useViewpointGroup();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: summary, isLoading: summaryLoading } =
    useSummaryMetrics(selectedGroupId);
  const { data: states = [], isLoading: statesLoading } =
    useStateDistribution(selectedGroupId);
  const { data: elections = [], isLoading: electionsLoading } = useElections(
    selectedGroupId,
    90
  );
  const { data: timeSeriesData, isLoading: timeSeriesLoading } =
    useTimeSeriesData(selectedGroupId, period);

  const loading = summaryLoading || statesLoading || electionsLoading;

  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      {/* Metric 1: Total Supporters */}
      <div className="px-4 lg:px-6">
        <SectionCards metrics={summary || null} isLoading={loading} />
      </div>

      {/* Chart: Supporter Growth Over Time */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Supporter Growth</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod("daily")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === "daily"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod("weekly")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === "weekly"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ChartAreaInteractive
            data={timeSeriesData || null}
            isLoading={timeSeriesLoading}
          />
        </div>
      </div>

      {/* Metric 2: Top States by Supporter Count */}
      <div className="px-4 lg:px-6">
        <TopStates states={states} isLoading={loading} />
      </div>

      {/* Metric 3: Elections with Most Supporters */}
      <div className="px-4 lg:px-6">
        <InfluenceInsights elections={elections} isLoading={loading} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
