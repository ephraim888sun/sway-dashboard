"use client";

import { Suspense } from "react";
import { SectionCards } from "@/components/section-cards";
import { TopStates } from "@/components/top-states";
import { InfluenceInsights } from "@/components/influence-insights";
import { useViewpointGroup } from "@/lib/viewpoint-group-context";
import {
  useSummaryMetrics,
  useStateDistribution,
  useElections,
} from "@/lib/hooks/use-dashboard-data";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
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

  const { data: summary, isLoading: summaryLoading } =
    useSummaryMetrics(selectedGroupId);
  const { data: states = [], isLoading: statesLoading } =
    useStateDistribution(selectedGroupId);
  const { data: elections = [], isLoading: electionsLoading } = useElections(
    selectedGroupId,
    90
  );

  const loading = summaryLoading || statesLoading || electionsLoading;

  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      {/* Metric 1: Total Supporters */}
      <div className="px-4 lg:px-6">
        <SectionCards metrics={summary || null} isLoading={loading} />
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
