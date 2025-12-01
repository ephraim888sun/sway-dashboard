import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { JurisdictionTable } from "@/components/jurisdiction-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { JurisdictionInfluence } from "@/types/dashboard";

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

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="h-8 bg-muted animate-pulse rounded w-64" />
      <div className="h-[400px] bg-muted animate-pulse rounded" />
    </div>
  );
}

async function JurisdictionsContent() {
  const jurisdictions = await getJurisdictions();

  // Segment jurisdictions
  const strongholds = jurisdictions.filter(
    (j) => (j.supporterShare || 0) >= 5 && j.activeRate >= 50
  );
  const sleepingGiants = jurisdictions.filter(
    (j) => j.supporterCount >= 100 && j.activeRate < 30
  );
  const emergingMarkets = jurisdictions.filter(
    (j) => j.growth30d >= 20 && (j.supporterShare || 0) < 5
  );

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Jurisdictions</h1>
        <p className="text-muted-foreground mt-2">
          Influence by jurisdiction across your supporter network
        </p>
      </div>

      {strongholds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Strongholds</h2>
          <p className="text-sm text-muted-foreground mb-4">
            High supporter share and active engagement
          </p>
          <JurisdictionTable data={strongholds} />
        </div>
      )}

      {sleepingGiants.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sleeping Giants</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Many supporters but low active engagement - re-engagement
            opportunity
          </p>
          <JurisdictionTable data={sleepingGiants} />
        </div>
      )}

      {emergingMarkets.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Emerging Markets</h2>
          <p className="text-sm text-muted-foreground mb-4">
            High growth potential - consider focusing efforts here
          </p>
          <JurisdictionTable data={emergingMarkets} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">All Jurisdictions</h2>
        <JurisdictionTable data={jurisdictions} />
      </div>
    </div>
  );
}

export default function JurisdictionsPage() {
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
              <JurisdictionsContent />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
