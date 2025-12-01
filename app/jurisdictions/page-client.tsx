"use client";

import * as React from "react";
import { JurisdictionTable } from "@/components/jurisdiction-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useViewpointGroup } from "@/lib/viewpoint-group-context";
import { useJurisdictions } from "@/lib/hooks/use-dashboard-data";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="h-8 bg-muted animate-pulse rounded w-64" />
      <div className="h-[400px] bg-muted animate-pulse rounded" />
    </div>
  );
}

function JurisdictionsContent() {
  const { selectedGroupId } = useViewpointGroup();
  const {
    data: jurisdictionsData = [],
    error: swrError,
    isLoading,
  } = useJurisdictions(selectedGroupId);

  // Sort by supporter share descending (default)
  const jurisdictions = React.useMemo(() => {
    return [...jurisdictionsData].sort((a, b) => {
      const aShare = a.supporterShare || 0;
      const bShare = b.supporterShare || 0;
      return bShare - aShare;
    });
  }, [jurisdictionsData]);

  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "Failed to load jurisdictions"
    : null;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

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

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && jurisdictions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Jurisdictions Found</CardTitle>
            <CardDescription>
              No supporter data found for jurisdictions. This may indicate that
              there are no supporters in the network yet, or there was an issue
              loading the data.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && jurisdictions.length > 0 && (
        <>
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
        </>
      )}
    </div>
  );
}

export default function JurisdictionsPageClient() {
  return <JurisdictionsContent />;
}
