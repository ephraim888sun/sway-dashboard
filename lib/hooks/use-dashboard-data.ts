import useSWR from "swr";
import type {
  SummaryMetrics,
  TimeSeriesData,
  JurisdictionInfluence,
  ElectionInfluence,
} from "@/types/dashboard";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }
  return res.json();
}

export function useSummaryMetrics(viewpointGroupId?: string) {
  const url = new URL(`${baseUrl}/api/summary`);
  if (viewpointGroupId) {
    url.searchParams.set("viewpointGroupId", viewpointGroupId);
  }
  const key = `summary-${viewpointGroupId || "default"}`;

  return useSWR<SummaryMetrics | null>(key, () => fetcher(url.toString()), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
    fallbackData: undefined,
  });
}

export function useTimeSeriesData(
  viewpointGroupId?: string,
  period: "weekly" | "monthly" = "monthly"
) {
  const url = new URL(`${baseUrl}/api/time-series`);
  url.searchParams.set("period", period);
  if (viewpointGroupId) {
    url.searchParams.set("viewpointGroupId", viewpointGroupId);
  }
  const key = `time-series-${viewpointGroupId || "default"}-${period}`;

  return useSWR<TimeSeriesData | null>(key, () => fetcher(url.toString()), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
    fallbackData: undefined,
  });
}

export function useJurisdictions(
  viewpointGroupId?: string,
  sortBy: string = "supporterShare",
  order: string = "desc"
) {
  const url = new URL(`${baseUrl}/api/jurisdictions`);
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("order", order);
  if (viewpointGroupId) {
    url.searchParams.set("viewpointGroupId", viewpointGroupId);
  }
  const key = `jurisdictions-${
    viewpointGroupId || "default"
  }-${sortBy}-${order}`;

  return useSWR<JurisdictionInfluence[]>(key, () => fetcher(url.toString()), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
    fallbackData: undefined,
  });
}

export function useElections(
  viewpointGroupId?: string,
  daysAhead: number = 90
) {
  const url = new URL(`${baseUrl}/api/elections`);
  url.searchParams.set("daysAhead", daysAhead.toString());
  if (viewpointGroupId) {
    url.searchParams.set("viewpointGroupId", viewpointGroupId);
  }
  const key = `elections-${viewpointGroupId || "default"}-${daysAhead}`;

  return useSWR<ElectionInfluence[]>(key, () => fetcher(url.toString()), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
    fallbackData: undefined,
  });
}
