import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { InfluenceInsights } from "@/components/influence-insights";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type {
  SummaryMetrics,
  TimeSeriesData,
  JurisdictionInfluence,
  ElectionInfluence,
} from "@/types/dashboard";

async function getSummaryMetrics(): Promise<SummaryMetrics | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const res = await fetch(`${baseUrl}/api/summary`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch summary");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching summary:", error);
    return null;
  }
}

async function getTimeSeriesData(): Promise<TimeSeriesData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/time-series?period=monthly`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch time series");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching time series:", error);
    return null;
  }
}

async function getJurisdictions(): Promise<JurisdictionInfluence[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/jurisdictions?sortBy=supporterShare&order=desc`,
      {
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch jurisdictions");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return [];
  }
}

async function getElections(): Promise<ElectionInfluence[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/elections?daysAhead=90`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch elections");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching elections:", error);
    return [];
  }
}

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

async function DashboardContent() {
  const [summary, timeSeries, jurisdictions, elections] = await Promise.all([
    getSummaryMetrics(),
    getTimeSeriesData(),
    getJurisdictions(),
    getElections(),
  ]);

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
      <SectionCards metrics={summary} isLoading={false} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={timeSeries} isLoading={false} />
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

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Suspense fallback={<LoadingSkeleton />}>
              <DashboardContent />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
