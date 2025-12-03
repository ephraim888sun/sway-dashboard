"use client";

import { useEffect } from "react";
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
    data: jurisdictions = [],
    error: swrError,
    isLoading,
  } = useJurisdictions(selectedGroupId);

  // Enhanced error extraction with more details
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : typeof swrError === "object" && swrError !== null
      ? JSON.stringify(swrError)
      : "Failed to load jurisdictions"
    : null;

  // Development mode logging for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (swrError) {
        console.error("Jurisdictions page error:", {
          error: swrError,
          selectedGroupId,
          errorMessage: error,
        });
      } else if (!isLoading && jurisdictions.length === 0) {
        console.warn("Jurisdictions page: No data found", {
          selectedGroupId,
          jurisdictionsCount: jurisdictions.length,
        });
      } else if (!isLoading && jurisdictions.length > 0) {
        console.log("Jurisdictions page: Data loaded successfully", {
          selectedGroupId,
          jurisdictionsCount: jurisdictions.length,
        });
      }
    }
  }, [swrError, isLoading, jurisdictions.length, selectedGroupId, error]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Jurisdictions</h1>
        <p className="text-muted-foreground mt-2">
          Influence by jurisdiction across your supporter network
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Data
            </CardTitle>
            <CardDescription className="space-y-2">
              <p>{error}</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Viewpoint Group ID: {selectedGroupId || "Not set"}
                </p>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && jurisdictions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Jurisdictions Found</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                No supporter data found for jurisdictions. This may indicate
                that there are no supporters in the network yet, or there was an
                issue loading the data.
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>Viewpoint Group ID: {selectedGroupId || "Not set"}</p>
                  <p>
                    Check the browser console for more detailed error
                    information.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && jurisdictions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Jurisdictions</h2>
          <JurisdictionTable data={jurisdictions} />
        </div>
      )}
    </div>
  );
}

export default function JurisdictionsPageClient() {
  return <JurisdictionsContent />;
}
