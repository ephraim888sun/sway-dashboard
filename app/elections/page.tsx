import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ElectionCard } from "@/components/election-card";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ElectionInfluence } from "@/types/dashboard";

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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="h-8 bg-muted animate-pulse rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

async function ElectionsContent() {
  const elections = await getElections();

  const highLeverageElections = elections.filter(
    (e) => e.supporterShareInScope !== null && e.supporterShareInScope >= 5
  );

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Elections</h1>
        <p className="text-muted-foreground mt-2">
          Elections in the next 90 days where your supporters can make an impact
        </p>
      </div>

      {highLeverageElections.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            High Leverage Opportunities
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Elections where you have ≥5% of expected turnout
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highLeverageElections.map((election) => (
              <ElectionCard key={election.electionId} election={election} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">All Upcoming Elections</h2>
        {elections.length === 0 ? (
          <p className="text-muted-foreground">No upcoming elections found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map((election) => (
              <ElectionCard key={election.electionId} election={election} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ElectionsPage() {
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
              <ElectionsContent />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
