"use client";

import useSWR from "swr";
import type {
  SummaryMetrics,
  TimeSeriesData,
  JurisdictionInfluence,
  ElectionInfluence,
  ElectionDetail,
} from "@/types/dashboard";
import {
  getTotalSupporterCountClient,
  getActiveSupporterCountClient,
  getJurisdictionsWithInfluenceClient,
  getSupporterGrowthTimeSeriesClient,
  getUpcomingElectionsClient,
  getElectionDetailClient,
} from "@/lib/queries-client";

export function useSummaryMetrics(viewpointGroupId?: string) {
  const key = `summary-${viewpointGroupId || "default"}`;

  return useSWR<SummaryMetrics | null>(
    key,
    async () => {
      // Get all metrics in parallel
      const [
        totalSupporters,
        activeSupporters,
        jurisdictions,
        upcomingElections,
      ] = await Promise.all([
        getTotalSupporterCountClient(viewpointGroupId),
        getActiveSupporterCountClient(viewpointGroupId),
        getJurisdictionsWithInfluenceClient(viewpointGroupId),
        getUpcomingElectionsClient(90, viewpointGroupId),
      ]);

      // Calculate active rate
      const activeRate =
        totalSupporters > 0 ? (activeSupporters / totalSupporters) * 100 : 0;

      // Find top jurisdiction by supporter share
      const topJurisdiction =
        jurisdictions
          .filter((j) => j.supporterShare !== null)
          .sort(
            (a, b) => (b.supporterShare || 0) - (a.supporterShare || 0)
          )[0] || null;

      // Count high-leverage elections (supporter share >= 5%)
      const highLeverageElectionsCount = upcomingElections.filter(
        (e) => e.supporterShareInScope !== null && e.supporterShareInScope >= 5
      ).length;

      return {
        totalSupporters,
        activeSupporters,
        activeRate,
        topJurisdiction: topJurisdiction
          ? {
              jurisdictionId: topJurisdiction.jurisdictionId,
              name: topJurisdiction.name,
              supporterCount: topJurisdiction.supporterCount,
              supporterShare: topJurisdiction.supporterShare,
            }
          : null,
        highLeverageElectionsCount,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}

export function useTimeSeriesData(
  viewpointGroupId?: string,
  period: "weekly" | "monthly" = "monthly"
) {
  const key = `time-series-${viewpointGroupId || "default"}-${period}`;

  return useSWR<TimeSeriesData | null>(
    key,
    async () => {
      const data = await getSupporterGrowthTimeSeriesClient(
        period,
        viewpointGroupId
      );
      return {
        data,
        periodType: period,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}

export function useJurisdictions(
  viewpointGroupId?: string,
  sortBy: string = "supporterShare",
  order: string = "desc"
) {
  const key = `jurisdictions-${
    viewpointGroupId || "default"
  }-${sortBy}-${order}`;

  return useSWR<JurisdictionInfluence[]>(
    key,
    async () => {
      const jurisdictions = await getJurisdictionsWithInfluenceClient(
        viewpointGroupId
      );

      // Sort jurisdictions
      jurisdictions.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortBy) {
          case "supporterCount":
            aValue = a.supporterCount;
            bValue = b.supporterCount;
            break;
          case "supporterShare":
            aValue = a.supporterShare || 0;
            bValue = b.supporterShare || 0;
            break;
          case "activeRate":
            aValue = a.activeRate;
            bValue = b.activeRate;
            break;
          case "growth30d":
            aValue = a.growth30d;
            bValue = b.growth30d;
            break;
          default:
            aValue = a.supporterShare || 0;
            bValue = b.supporterShare || 0;
        }

        if (order === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      return jurisdictions;
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}

export function useElections(
  viewpointGroupId?: string,
  daysAhead: number = 90
) {
  const key = `elections-${viewpointGroupId || "default"}-${daysAhead}`;

  return useSWR<ElectionInfluence[]>(
    key,
    () => getUpcomingElectionsClient(daysAhead, viewpointGroupId),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}

export function useElectionDetail(
  electionId: string,
  viewpointGroupId?: string
) {
  const key = `election-detail-${electionId}-${viewpointGroupId || "default"}`;

  return useSWR<ElectionDetail | null>(
    key,
    () => getElectionDetailClient(electionId, viewpointGroupId),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}
