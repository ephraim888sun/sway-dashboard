"use client";

import useSWR from "swr";
import type {
  SummaryMetrics,
  TimeSeriesData,
  JurisdictionInfluence,
  ElectionInfluence,
  ElectionDetail,
  StateDistribution,
} from "@/types/dashboard";
import {
  getTotalSupporterCountClient,
  getJurisdictionsWithInfluenceClient,
  getSupporterGrowthTimeSeriesClient,
  getUpcomingElectionsClient,
  getElectionDetailClient,
  getStateDistributionClient,
} from "@/lib/queries-client";

export function useSummaryMetrics(viewpointGroupId?: string) {
  const key = `summary-${viewpointGroupId || "default"}`;

  return useSWR<SummaryMetrics | null>(
    key,
    async () => {
      // Get all metrics in parallel
      const [totalSupporters, stateDistribution, upcomingElections] =
        await Promise.all([
          getTotalSupporterCountClient(viewpointGroupId),
          getStateDistributionClient(viewpointGroupId),
          getUpcomingElectionsClient(90, viewpointGroupId),
        ]);

      // Find top state
      const topState =
        stateDistribution && stateDistribution.length > 0
          ? {
              state: stateDistribution[0].state,
              supporterCount: stateDistribution[0].supporterCount,
            }
          : null;

      // Count elections with supporter access
      const electionsWithAccess = upcomingElections.filter(
        (e) => e.supportersInScope > 0
      ).length;

      // Sum total ballot items
      const totalBallotItems = upcomingElections.reduce(
        (sum, e) => sum + e.ballotItemsCount,
        0
      );

      return {
        totalSupporters,
        topState,
        electionsWithAccess,
        totalBallotItems,
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
  period: "daily" | "weekly" | "monthly" = "monthly"
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
  sortBy: string = "supporterCount",
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
          case "upcomingElectionsCount":
            aValue = a.upcomingElectionsCount;
            bValue = b.upcomingElectionsCount;
            break;
          case "upcomingBallotItemsCount":
            aValue = a.upcomingBallotItemsCount;
            bValue = b.upcomingBallotItemsCount;
            break;
          default:
            aValue = a.supporterCount;
            bValue = b.supporterCount;
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

export function useStateDistribution(viewpointGroupId?: string) {
  const key = `state-distribution-${viewpointGroupId || "default"}`;

  return useSWR<StateDistribution[]>(
    key,
    () => getStateDistributionClient(viewpointGroupId),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
      fallbackData: undefined,
    }
  );
}
