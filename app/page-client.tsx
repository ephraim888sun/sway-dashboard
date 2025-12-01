"use client";

import * as React from "react";
import { Suspense } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { InfluenceInsights } from "@/components/influence-insights";
import { useViewpointGroup } from "@/lib/viewpoint-group-context";
import {
  useSummaryMetrics,
  useTimeSeriesData,
  useJurisdictions,
  useElections,
} from "@/lib/hooks/use-dashboard-data";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { selectedGroupId } = useViewpointGroup();
  
  const { data: summary, isLoading: summaryLoading } = useSummaryMetrics(selectedGroupId);
  const { data: timeSeries, isLoading: timeSeriesLoading } = useTimeSeriesData(selectedGroupId);
  const { data: jurisdictions = [], isLoading: jurisdictionsLoading } = useJurisdictions(selectedGroupId);
  const { data: elections = [], isLoading: electionsLoading } = useElections(selectedGroupId);

  const loading = summaryLoading || timeSeriesLoading || jurisdictionsLoading || electionsLoading;

  // Transform jurisdictions for DataTable
  const tableData = jurisdictions.slice(0, 10).map((j, index) => ({
    id: index + 1,
    header: j.name,
    type: j.level || "Unknown",
    status: j.activeRate >= 50 ? "Active" : "Low Activity",
    target: j.supporterCount.toString(),
    limit: j.supporterShare?.toFixed(1) + "%" || "N/A",
    reviewer: `${j.growth30d.toFixed(1)}% growth`,
  }));

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards metrics={summary || null} isLoading={loading} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={timeSeries || null} isLoading={loading} />
      </div>
      <div className="px-4 lg:px-6">
        <InfluenceInsights
          elections={elections}
          jurisdictions={jurisdictions}
        />
      </div>
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-semibold mb-4">
          Top Jurisdictions by Influence
        </h2>
        <DataTable data={tableData} />
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
