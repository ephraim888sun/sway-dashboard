"use client";

import { createClientClient } from "./supabase";
import { LEADER_VIEWPOINT_GROUP_ID } from "./constants";
import type {
  JurisdictionInfluence,
  TimeSeriesDataPoint,
  ElectionInfluence,
  ElectionDetail,
  BallotItem,
  RaceDetail,
  MeasureDetail,
  Candidate,
  StateDistribution,
} from "@/types/dashboard";

// Supabase batch size limit for .in() queries
const SUPABASE_BATCH_SIZE = 100;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Check if an error object has meaningful content
 * Supabase may return empty error objects for "not found" cases
 */
function hasMeaningfulError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error !== "object") return true;

  const err = error as Record<string, unknown>;

  // Check for common error properties
  return !!(
    err.message ||
    err.code ||
    err.details ||
    err.hint ||
    (Object.keys(err).length > 0 && JSON.stringify(err) !== "{}")
  );
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))
    );
    return retryWithBackoff(fn, retries - 1);
  }
}

/**
 * Get all viewpoint group IDs in a viewpoint group's network (client-side version)
 */
async function getViewpointGroupNetworkClient(
  viewpointGroupId: string = LEADER_VIEWPOINT_GROUP_ID
): Promise<string[]> {
  const supabase = createClientClient();
  const network = new Set<string>([viewpointGroupId]);

  // Find all supporters of the primary group
  const { data: supporters, error: supportersError } = await supabase
    .from("profile_viewpoint_group_rels")
    .select("profile_id")
    .eq("viewpoint_group_id", viewpointGroupId)
    .eq("type", "supporter");

  if (supportersError) {
    console.error("Error fetching supporters:", supportersError);
    return [viewpointGroupId];
  }

  if (!supporters || supporters.length === 0) {
    return [viewpointGroupId];
  }

  const supporterProfileIds = supporters
    .map((s) => s.profile_id)
    .filter(Boolean);

  if (supporterProfileIds.length === 0) {
    return [viewpointGroupId];
  }

  // Find all viewpoint groups where these supporters are leaders
  const allSubGroups: { viewpoint_group_id: string }[] = [];

  for (let i = 0; i < supporterProfileIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = supporterProfileIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: subGroups, error: subGroupsError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("viewpoint_group_id")
      .in("profile_id", batch)
      .eq("type", "leader")
      .neq("viewpoint_group_id", viewpointGroupId);

    if (subGroupsError) {
      console.error("Error fetching sub-groups:", subGroupsError);
      continue;
    }

    if (subGroups) {
      allSubGroups.push(...subGroups);
    }
  }

  allSubGroups.forEach((sg) => {
    if (sg.viewpoint_group_id) {
      network.add(sg.viewpoint_group_id);
    }
  });

  return Array.from(network);
}

/**
 * Get supporter growth time series data (client-side version)
 */
export async function getSupporterGrowthTimeSeriesClient(
  periodType: "daily" | "weekly" | "monthly" = "monthly",
  viewpointGroupId?: string
): Promise<TimeSeriesDataPoint[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    // For daily queries, try materialized view first, then fall back to direct calculation
    if (periodType === "daily") {
      // Try materialized view first
      const { data: mvData, error: mvError } = await supabase
        .from("mv_time_series_supporters")
        .select("*")
        .in("viewpoint_group_id", networkIds)
        .eq("period_type", "daily")
        .order("date", { ascending: true });

      if (!mvError && mvData && mvData.length > 0) {
        return mvData.map((row) => ({
          date: new Date(row.date).toISOString(),
          period: row.period,
          newSupporters: row.new_supporters,
          cumulativeSupporters: row.cumulative_supporters,
          activeSupporters: row.active_supporters,
        }));
      }

      // Fall back to direct calculation if materialized view doesn't have daily data
      // Get all supporters grouped by day
      const { data: dailyData, error: dailyError } = await supabase
        .from("mv_supporters_by_jurisdiction")
        .select("created_at, profile_id, viewpoint_group_id")
        .in("viewpoint_group_id", networkIds)
        .not("created_at", "is", null)
        .order("created_at", { ascending: true });

      if (dailyError) {
        console.error("Error fetching daily supporter data:", dailyError);
        throw dailyError;
      }

      if (!dailyData || dailyData.length === 0) {
        return [];
      }

      // Group by day
      const dailyMap = new Map<
        string,
        {
          date: Date;
          newSupporters: Set<string>;
        }
      >();

      // Process each supporter record
      dailyData.forEach((record) => {
        const date = new Date(record.created_at);
        const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

        if (!dailyMap.has(dayKey)) {
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          dailyMap.set(dayKey, {
            date: dayStart,
            newSupporters: new Set(),
          });
        }

        const dayData = dailyMap.get(dayKey)!;
        dayData.newSupporters.add(record.profile_id);
      });

      // Calculate cumulative supporters and active supporters
      const sortedDays = Array.from(dailyMap.entries()).sort(
        (a, b) => a[1].date.getTime() - b[1].date.getTime()
      );

      const cumulativeSet = new Set<string>();
      const result: TimeSeriesDataPoint[] = [];

      for (const [dayKey, dayData] of sortedDays) {
        // Add new supporters to cumulative set
        dayData.newSupporters.forEach((id) => cumulativeSet.add(id));

        // Calculate active supporters (30-day rolling window)
        // Count distinct supporters who joined in the last 30 days up to this date
        const dayDate = dayData.date;
        const thirtyDaysAgo = new Date(dayDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeSet = new Set<string>();
        for (const record of dailyData) {
          const recordDate = new Date(record.created_at);
          if (recordDate >= thirtyDaysAgo && recordDate <= dayDate) {
            activeSet.add(record.profile_id);
          }
        }

        result.push({
          date: dayData.date.toISOString(),
          period: dayKey,
          newSupporters: dayData.newSupporters.size,
          cumulativeSupporters: cumulativeSet.size,
          activeSupporters: activeSet.size,
        });
      }

      return result;
    }

    // For weekly/monthly, use the materialized view
    const { data, error } = await supabase
      .from("mv_time_series_supporters")
      .select("*")
      .in("viewpoint_group_id", networkIds)
      .eq("period_type", periodType)
      .order("date", { ascending: true });

    if (error) {
      console.error(
        "Error fetching supporter growth from materialized view:",
        error
      );
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // If we have multiple viewpoint groups, we need to aggregate correctly
    // by deduplicating profiles across groups
    if (networkIds.length > 1) {
      // Group by period and aggregate across viewpoint groups
      const periodMap = new Map<
        string,
        {
          date: Date;
          period: string;
          newSupporters: Set<string>;
          allSupporters: Set<string>;
          activeSupporters: Set<string>;
        }
      >();

      for (const row of data) {
        const periodKey = `${row.period_type}-${row.period}`;
        const rowDate = new Date(row.date);

        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, {
            date: rowDate,
            period: row.period,
            newSupporters: new Set(),
            allSupporters: new Set(),
            activeSupporters: new Set(),
          });
        }

        // For new supporters, we need to get distinct profiles for this period
        // Since the materialized view already has distinct counts per group,
        // we need to query the actual data to deduplicate across groups
        // For now, we'll sum the new_supporters (which may slightly overcount)
        // but use the max cumulative as an approximation
        // TODO: This could be improved by querying mv_supporters_by_jurisdiction
        // to get truly distinct counts across groups
      }

      // For now, if multiple groups exist, aggregate by summing new supporters
      // and taking the max cumulative (since cumulative should be similar across groups)
      // This is a simplification - ideally we'd recalculate from source data
      const aggregated = new Map<
        string,
        {
          date: Date;
          period: string;
          newSupporters: number;
          cumulativeSupporters: number;
          activeSupporters: number;
        }
      >();

      for (const row of data) {
        const periodKey = `${row.period_type}-${row.period}`;
        const rowDate = new Date(row.date);

        if (!aggregated.has(periodKey)) {
          aggregated.set(periodKey, {
            date: rowDate,
            period: row.period,
            newSupporters: 0,
            cumulativeSupporters: 0,
            activeSupporters: 0,
          });
        }

        const agg = aggregated.get(periodKey)!;
        agg.newSupporters += row.new_supporters || 0;
        agg.cumulativeSupporters = Math.max(
          agg.cumulativeSupporters,
          row.cumulative_supporters || 0
        );
        agg.activeSupporters = Math.max(
          agg.activeSupporters,
          row.active_supporters || 0
        );
      }

      // Calculate proper cumulative across all periods
      const sorted = Array.from(aggregated.entries()).sort(
        (a, b) => a[1].date.getTime() - b[1].date.getTime()
      );

      let cumulative = 0;
      return sorted.map(([, agg]) => {
        cumulative += agg.newSupporters;
        return {
          date: agg.date.toISOString(),
          period: agg.period,
          newSupporters: agg.newSupporters,
          cumulativeSupporters: cumulative,
          activeSupporters: agg.activeSupporters,
        };
      });
    }

    // Single viewpoint group - return as-is
    return data.map((row) => ({
      date: new Date(row.date).toISOString(),
      period: row.period,
      newSupporters: row.new_supporters,
      cumulativeSupporters: row.cumulative_supporters,
      activeSupporters: row.active_supporters,
    }));
  });
}

/**
 * Get total supporter count (client-side version) - direct query
 * Counts all supporters regardless of verification status
 */
export async function getTotalSupporterCountClient(
  viewpointGroupId?: string
): Promise<number> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    const { count, error } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("*", { count: "exact", head: true })
      .in("viewpoint_group_id", networkIds)
      .eq("type", "supporter");

    if (error) {
      console.error("Error fetching total supporters:", error);
      throw error;
    }

    return count || 0;
  });
}

/**
 * Get verified supporter count (client-side version)
 * Counts only supporters who have completed voter verification and have jurisdiction data
 * This matches the data used in the time series chart by using the same source
 */
export async function getVerifiedSupporterCountClient(
  viewpointGroupId?: string
): Promise<number> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    // Use the same data source as the chart: mv_time_series_supporters
    // Get the latest cumulative_supporters value for the 'daily' period type
    // This ensures the metric card matches exactly what the chart displays
    const { data, error } = await supabase
      .from("mv_time_series_supporters")
      .select("cumulative_supporters, date")
      .in("viewpoint_group_id", networkIds)
      .eq("period_type", "daily")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching verified supporters:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Get the latest date across all viewpoint groups
    // Convert to comparable format (ISO date string) for consistent comparison
    const latestDate = new Date(data[0].date);
    const latestDateStr = latestDate.toISOString().split("T")[0];

    // Filter to only the latest date and get the maximum cumulative_supporters
    // This handles cases where there are multiple viewpoint groups in the network
    const latestData = data.filter((row) => {
      const rowDateStr = new Date(row.date).toISOString().split("T")[0];
      return rowDateStr === latestDateStr;
    });

    // Return the maximum cumulative supporters count for the latest date
    // This represents the total verified supporters up to the latest date
    const maxCumulative = Math.max(
      ...latestData.map((row) => row.cumulative_supporters || 0)
    );

    return maxCumulative;
  });
}

/**
 * Get jurisdictions with supporters (client-side version) - direct query
 */
export async function getJurisdictionsWithInfluenceClient(
  viewpointGroupId?: string
): Promise<JurisdictionInfluence[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();

    // Ensure viewpointGroupId defaults to LEADER_VIEWPOINT_GROUP_ID if undefined
    const effectiveGroupId = viewpointGroupId || LEADER_VIEWPOINT_GROUP_ID;

    const networkIds = await getViewpointGroupNetworkClient(effectiveGroupId);

    // Validate that networkIds is not empty
    if (!networkIds || networkIds.length === 0) {
      console.error(
        `No network IDs found for viewpoint group: ${effectiveGroupId}. ` +
          `This may indicate that the viewpoint group has no supporters or there was an issue loading the network.`
      );
      return [];
    }

    // Use mv_supporters_by_jurisdiction for supporter counts (it's just a mapping)
    const { data: supportersByJurisdiction, error: supportersError } =
      await supabase
        .from("mv_supporters_by_jurisdiction")
        .select("jurisdiction_id, profile_id")
        .in("viewpoint_group_id", networkIds);

    if (supportersError) {
      console.error(
        `Error fetching supporters from mv_supporters_by_jurisdiction:`,
        supportersError,
        `Network IDs:`,
        networkIds
      );
      throw supportersError;
    }

    if (!supportersByJurisdiction || supportersByJurisdiction.length === 0) {
      console.warn(
        `No supporters found in mv_supporters_by_jurisdiction for network IDs:`,
        networkIds,
        `Viewpoint Group ID:`,
        effectiveGroupId
      );
      return [];
    }

    // Count supporters per jurisdiction
    const jurisdictionCounts = new Map<string, Set<string>>();
    supportersByJurisdiction.forEach((s) => {
      if (s.jurisdiction_id && s.profile_id) {
        if (!jurisdictionCounts.has(s.jurisdiction_id)) {
          jurisdictionCounts.set(s.jurisdiction_id, new Set());
        }
        jurisdictionCounts.get(s.jurisdiction_id)!.add(s.profile_id);
      }
    });

    const jurisdictionIds = Array.from(jurisdictionCounts.keys());
    if (jurisdictionIds.length === 0) {
      console.warn(
        `No jurisdiction IDs found after processing supporters. ` +
          `Found ${supportersByJurisdiction.length} supporter records but no valid jurisdiction IDs.`
      );
      return [];
    }

    // Get jurisdiction details - batched to handle large arrays
    const allJurisdictions: Array<{
      id: string;
      name: string | null;
      level: string | null;
    }> = [];
    let hasJurisdictionError = false;
    let lastJurisdictionError: unknown = null;

    for (let i = 0; i < jurisdictionIds.length; i += SUPABASE_BATCH_SIZE) {
      const batch = jurisdictionIds.slice(i, i + SUPABASE_BATCH_SIZE);
      const { data: jurisdictions, error: jurisdictionsError } = await supabase
        .from("jurisdictions")
        .select("id, name, level")
        .in("id", batch);

      if (jurisdictionsError) {
        console.error(
          `Error fetching jurisdiction details for batch ${
            i / SUPABASE_BATCH_SIZE + 1
          }:`,
          jurisdictionsError,
          `Batch size: ${batch.length}, Jurisdiction IDs in batch:`,
          batch
        );
        hasJurisdictionError = true;
        lastJurisdictionError = jurisdictionsError;
        // Continue processing remaining batches even if one fails
        continue;
      }

      if (jurisdictions) {
        allJurisdictions.push(...jurisdictions);
      }
    }

    if (hasJurisdictionError && allJurisdictions.length === 0) {
      // Only throw if we got no results at all
      throw lastJurisdictionError;
    }

    if (allJurisdictions.length === 0) {
      console.warn(`No jurisdiction details found for IDs:`, jurisdictionIds);
      return [];
    }

    // Get upcoming elections (next 90 days)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    const { data: upcomingElections } = await supabase
      .from("elections")
      .select("id")
      .gte("poll_date", today.toISOString().split("T")[0])
      .lte("poll_date", futureDate.toISOString().split("T")[0]);

    const electionIds = upcomingElections?.map((e) => e.id) || [];

    // Get ballot items for upcoming elections - batched to handle large arrays
    const allBallotItems: Array<{
      jurisdiction_id: string | null;
      election_id: string;
      races: Array<{ id: string }> | null;
      measures: Array<{ id: string }> | null;
    }> = [];
    let hasBallotItemsError = false;

    // Batch by jurisdiction_id (electionIds should typically be smaller)
    for (let i = 0; i < jurisdictionIds.length; i += SUPABASE_BATCH_SIZE) {
      const batch = jurisdictionIds.slice(i, i + SUPABASE_BATCH_SIZE);
      const { data: ballotItems, error: ballotItemsError } = await supabase
        .from("ballot_items")
        .select("jurisdiction_id, election_id, races(id), measures(id)")
        .in("jurisdiction_id", batch)
        .in("election_id", electionIds);

      if (ballotItemsError) {
        console.error(
          `Error fetching ballot items for batch ${
            i / SUPABASE_BATCH_SIZE + 1
          }:`,
          ballotItemsError,
          `Batch size: ${batch.length}, Jurisdiction IDs in batch:`,
          batch
        );
        hasBallotItemsError = true;
        // Continue processing remaining batches even if one fails
        continue;
      }

      if (ballotItems) {
        allBallotItems.push(...ballotItems);
      }
    }

    // Log warning if we had errors but still got some results
    if (hasBallotItemsError && allBallotItems.length > 0) {
      console.warn(
        `Some ballot item batches failed, but retrieved ${allBallotItems.length} items from successful batches`
      );
    }

    // Note: We don't throw on ballot items errors if we got some results,
    // as partial data is acceptable for counting purposes

    // Count elections and ballot items per jurisdiction
    const electionCounts = new Map<string, Set<string>>();
    const ballotItemCounts = new Map<string, number>();
    const raceCounts = new Map<string, number>();

    allBallotItems.forEach((bi) => {
      const jid = bi.jurisdiction_id;
      if (!jid) return;

      if (!electionCounts.has(jid)) {
        electionCounts.set(jid, new Set());
        ballotItemCounts.set(jid, 0);
        raceCounts.set(jid, 0);
      }

      electionCounts.get(jid)!.add(bi.election_id);
      ballotItemCounts.set(jid, (ballotItemCounts.get(jid) || 0) + 1);

      const races = bi.races as { id?: string }[] | null;
      if (races && races.length > 0) {
        raceCounts.set(jid, (raceCounts.get(jid) || 0) + 1);
      }
    });

    const result = allJurisdictions.map((j) => ({
      jurisdictionId: j.id,
      name: j.name || "Unknown",
      level: j.level,
      supporterCount: jurisdictionCounts.get(j.id)?.size || 0,
      upcomingElectionsCount: electionCounts.get(j.id)?.size || 0,
      upcomingBallotItemsCount: ballotItemCounts.get(j.id) || 0,
      upcomingRacesCount: raceCounts.get(j.id) || 0,
    }));

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Successfully loaded ${result.length} jurisdictions for viewpoint group:`,
        effectiveGroupId,
        `Network IDs:`,
        networkIds
      );
    }

    return result;
  });
}

/**
 * Get detailed race information with candidates (client-side version)
 */
async function getRaceDetailClient(raceId: string): Promise<RaceDetail | null> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("*")
      .eq("id", raceId)
      .single();

    if (!race) {
      // Only log if there's a meaningful error (not just "not found")
      if (hasMeaningfulError(raceError)) {
        console.error(
          `Error fetching race detail for raceId ${raceId}:`,
          raceError
        );
      }
      return null;
    }

    let officeTerm: {
      id: string;
      offices?: { name?: string; level?: string; district?: string };
    } | null = null;
    let office: { name?: string; level?: string; district?: string } | null =
      null;

    if (race.office_term_id) {
      const { data: ot, error: otError } = await supabase
        .from("office_terms")
        .select("*, offices(id, name, level, district)")
        .eq("id", race.office_term_id)
        .single();

      if (ot) {
        officeTerm = ot;
        office =
          (ot?.offices as {
            name?: string;
            level?: string;
            district?: string;
          } | null) || null;
      } else if (!ot && hasMeaningfulError(otError)) {
        console.error(
          `Error fetching office term for raceId ${raceId}:`,
          otError
        );
      }
    }

    const { data: candidacies } = await supabase
      .from("candidacies")
      .select("*, persons(*), parties(*)")
      .eq("race_id", raceId);

    const candidates: Candidate[] =
      candidacies?.map((c) => {
        const person = c.persons as { full_name?: string } | null;
        const party = c.parties as { id?: string; name?: string } | null;
        return {
          candidacyId: c.id,
          candidateId: c.candidate_id,
          candidateName: person?.full_name || null,
          partyId: c.party_id || party?.id || null,
          partyName: party?.name || null,
          status: c.status,
          isWithdrawn: c.is_withdrawn,
          result: c.result,
        };
      }) || [];

    let party = null;
    if (race.party_id) {
      const { data: p, error: partyError } = await supabase
        .from("parties")
        .select("*")
        .eq("id", race.party_id)
        .single();

      if (p) {
        party = p;
      } else if (hasMeaningfulError(partyError)) {
        console.error(`Error fetching party for raceId ${raceId}:`, partyError);
      }
    }

    return {
      raceId: race.id,
      officeTermId: officeTerm?.id || null,
      officeName: office?.name || null,
      officeLevel: office?.level || null,
      officeDistrict: office?.district || null,
      candidates,
      partyId: race.party_id || null,
      partyName: party?.name || null,
      isPartisan: race.is_partisan,
      isPrimary: race.is_primary,
    };
  });
}

/**
 * Get detailed measure information (client-side version)
 */
async function getMeasureDetailClient(
  measureId: string
): Promise<MeasureDetail | null> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const { data: measure, error: measureError } = await supabase
      .from("measures")
      .select("*")
      .eq("id", measureId)
      .single();

    if (!measure) {
      // Only log if there's a meaningful error (not just "not found")
      if (hasMeaningfulError(measureError)) {
        console.error(
          `Error fetching measure detail for measureId ${measureId}:`,
          measureError
        );
      }
      return null;
    }

    return {
      measureId: measure.id,
      title: measure.title || measure.name,
      summary: measure.summary,
      fullText: measure.full_text,
      fiscalImpact: measure.fiscal_impact,
      proSnippet: measure.pro_snippet,
      conSnippet: measure.con_snippet,
    };
  });
}

/**
 * Get all supporters for the leader's network by jurisdiction (client-side version)
 */
async function getSupportersByJurisdictionClient(
  viewpointGroupId?: string
): Promise<Map<string, { profileIds: Set<string>; createdAts: Date[] }>> {
  const supabase = createClientClient();
  const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

  const { data: supporters, error: supportersError } = await supabase
    .from("mv_supporters_by_jurisdiction")
    .select("jurisdiction_id, profile_id, created_at")
    .in("viewpoint_group_id", networkIds);

  if (supportersError || !supporters) {
    console.error("Error fetching supporters:", supportersError);
    return new Map();
  }

  const jurisdictionMap = new Map<
    string,
    { profileIds: Set<string>; createdAts: Date[] }
  >();

  supporters.forEach((supporter) => {
    const jurisdictionId = supporter.jurisdiction_id;
    if (!jurisdictionId) return;

    if (!jurisdictionMap.has(jurisdictionId)) {
      jurisdictionMap.set(jurisdictionId, {
        profileIds: new Set(),
        createdAts: [],
      });
    }

    const entry = jurisdictionMap.get(jurisdictionId)!;
    if (supporter.profile_id) {
      entry.profileIds.add(supporter.profile_id);
    }
    if (supporter.created_at) {
      entry.createdAts.push(new Date(supporter.created_at));
    }
  });

  return jurisdictionMap;
}

/**
 * Get state distribution of supporters (client-side version)
 */
export async function getStateDistributionClient(
  viewpointGroupId?: string
): Promise<StateDistribution[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    // Get supporters by jurisdiction (materialized view doesn't support nested selects)
    const { data: supportersByJurisdiction, error: supportersError } =
      await supabase
        .from("mv_supporters_by_jurisdiction")
        .select("jurisdiction_id, profile_id")
        .in("viewpoint_group_id", networkIds);

    if (supportersError) {
      console.error(
        "Error fetching supporters by jurisdiction:",
        supportersError
      );
      throw supportersError;
    }

    if (!supportersByJurisdiction || supportersByJurisdiction.length === 0) {
      return [];
    }

    // Get unique jurisdiction IDs
    const jurisdictionIds = [
      ...new Set(
        supportersByJurisdiction
          .map((s) => s.jurisdiction_id)
          .filter(Boolean) as string[]
      ),
    ];

    if (jurisdictionIds.length === 0) {
      return [];
    }

    // Fetch jurisdiction state field separately (materialized views don't support joins in Supabase client)
    // Use state field (abbreviation) which is more reliable than extracting from name
    const jurisdictionStateMap = new Map<string, string>();
    for (let i = 0; i < jurisdictionIds.length; i += SUPABASE_BATCH_SIZE) {
      const batch = jurisdictionIds.slice(i, i + SUPABASE_BATCH_SIZE);
      const { data: jurisdictions } = await supabase
        .from("jurisdictions")
        .select("id, state, name")
        .in("id", batch);

      if (jurisdictions) {
        jurisdictions.forEach((j) => {
          if (j.id) {
            // Use state field (abbreviation) directly from database
            jurisdictionStateMap.set(j.id, j.state || "");
          }
        });
      }
    }

    // Map state abbreviations to full names
    const stateAbbreviationToName: Record<string, string> = {
      AL: "Alabama",
      AK: "Alaska",
      AZ: "Arizona",
      AR: "Arkansas",
      CA: "California",
      CO: "Colorado",
      CT: "Connecticut",
      DE: "Delaware",
      FL: "Florida",
      GA: "Georgia",
      HI: "Hawaii",
      ID: "Idaho",
      IL: "Illinois",
      IN: "Indiana",
      IA: "Iowa",
      KS: "Kansas",
      KY: "Kentucky",
      LA: "Louisiana",
      ME: "Maine",
      MD: "Maryland",
      MA: "Massachusetts",
      MI: "Michigan",
      MN: "Minnesota",
      MS: "Mississippi",
      MO: "Missouri",
      MT: "Montana",
      NE: "Nebraska",
      NV: "Nevada",
      NH: "New Hampshire",
      NJ: "New Jersey",
      NM: "New Mexico",
      NY: "New York",
      NC: "North Carolina",
      ND: "North Dakota",
      OH: "Ohio",
      OK: "Oklahoma",
      OR: "Oregon",
      PA: "Pennsylvania",
      RI: "Rhode Island",
      SC: "South Carolina",
      SD: "South Dakota",
      TN: "Tennessee",
      TX: "Texas",
      UT: "Utah",
      VT: "Vermont",
      VA: "Virginia",
      WA: "Washington",
      WV: "West Virginia",
      WI: "Wisconsin",
      WY: "Wyoming",
      DC: "District of Columbia",
    };

    // Group by state
    const stateMap = new Map<
      string,
      { supporters: Set<string>; jurisdictions: Set<string> }
    >();

    supportersByJurisdiction.forEach((s) => {
      if (!s.jurisdiction_id || !s.profile_id) return;

      const jurisdictionState =
        jurisdictionStateMap.get(s.jurisdiction_id) || "";

      // Skip jurisdictions without a state value
      if (!jurisdictionState.trim()) {
        return;
      }

      // Get state name from abbreviation
      const stateAbbr = jurisdictionState.trim().toUpperCase();
      const state = stateAbbreviationToName[stateAbbr];

      // Skip if state abbreviation doesn't match a known state
      if (!state) {
        return;
      }

      if (!stateMap.has(state)) {
        stateMap.set(state, {
          supporters: new Set(),
          jurisdictions: new Set(),
        });
      }

      stateMap.get(state)!.supporters.add(s.profile_id);
      stateMap.get(state)!.jurisdictions.add(s.jurisdiction_id);
    });

    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        supporterCount: data.supporters.size,
        jurisdictionCount: data.jurisdictions.size,
      }))
      .sort((a, b) => b.supporterCount - a.supporterCount);
  });
}

/**
 * Get upcoming elections with supporter counts (client-side version)
 */
export async function getUpcomingElectionsClient(
  daysAhead: number = 90,
  viewpointGroupId?: string
): Promise<ElectionInfluence[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Fetch elections
    const { data: elections, error: electionsError } = await supabase
      .from("elections")
      .select("*")
      .gte("poll_date", today.toISOString().split("T")[0])
      .lte("poll_date", futureDate.toISOString().split("T")[0])
      .order("poll_date", { ascending: true });

    if (electionsError) {
      console.error("Error fetching elections:", electionsError);
      throw electionsError;
    }

    if (!elections || elections.length === 0) {
      return [];
    }

    const supportersByJurisdiction = await getSupportersByJurisdictionClient(
      viewpointGroupId
    );

    // Process elections in parallel
    const electionPromises = elections.map(async (election) => {
      const { data: ballotItems, error: ballotError } = await supabase
        .from("ballot_items")
        .select("*, jurisdictions!inner(*)")
        .eq("election_id", election.id);

      if (ballotError || !ballotItems || ballotItems.length === 0) {
        return null;
      }

      // Count supporters with ballot access
      const jurisdictionIds = new Set<string>();
      ballotItems.forEach((bi) => {
        if (bi.jurisdiction_id) {
          jurisdictionIds.add(bi.jurisdiction_id);
        }
      });

      let supportersInScope = 0;
      jurisdictionIds.forEach((jid) => {
        const supporters = supportersByJurisdiction.get(jid);
        if (supporters) {
          supportersInScope += supporters.profileIds.size;
        }
      });

      const ballotItemPromises = ballotItems.map(async (bi) => {
        const jurisdiction = bi.jurisdictions as { name?: string } | null;
        const jurisdictionId = bi.jurisdiction_id;

        const [racesResult, measuresResult] = await Promise.all([
          supabase
            .from("races")
            .select("*")
            .eq("ballot_item_id", bi.id)
            .limit(1),
          supabase
            .from("measures")
            .select("*")
            .eq("ballot_item_id", bi.id)
            .limit(1),
        ]);

        const { data: races } = racesResult;
        const { data: measures } = measuresResult;

        if (races && races.length > 0) {
          const race = races[0];
          const raceDetail = await getRaceDetailClient(race.id);
          return {
            ballotItemId: bi.id,
            title: bi.title,
            description: bi.description,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName:
              (jurisdiction as { name?: string } | null)?.name || null,
            type: "race" as const,
            race: raceDetail || undefined,
          };
        } else if (measures && measures.length > 0) {
          const measure = measures[0];
          const measureDetail = await getMeasureDetailClient(measure.id);
          return {
            ballotItemId: bi.id,
            title: bi.title || measure.title,
            description: bi.description || measure.summary,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName:
              (jurisdiction as { name?: string } | null)?.name || null,
            type: "measure" as const,
            measure: measureDetail || undefined,
          };
        }

        return {
          ballotItemId: bi.id,
          title: bi.title,
          description: bi.description,
          jurisdictionId: jurisdictionId || "",
          jurisdictionName: jurisdiction?.name || null,
          type: "race" as const,
        };
      });

      const ballotItemsWithDetails = await Promise.all(ballotItemPromises);

      // Count races and measures
      const racesCount = ballotItemsWithDetails.filter(
        (bi) => bi.type === "race"
      ).length;
      const measuresCount = ballotItemsWithDetails.filter(
        (bi) => bi.type === "measure"
      ).length;

      return {
        electionId: election.id,
        name: election.name || "Unnamed Election",
        pollDate: election.poll_date,
        description: election.description,
        supportersInScope,
        ballotItemsCount: ballotItemsWithDetails.length,
        racesCount,
        measuresCount,
        ballotItems: ballotItemsWithDetails,
      };
    });

    const electionResults = await Promise.all(electionPromises);
    return electionResults.filter(
      (result) => result !== null
    ) as ElectionInfluence[];
  });
}

/**
 * Get detailed election information with ballot items and supporter metrics (client-side version)
 */
export async function getElectionDetailClient(
  electionId: string,
  viewpointGroupId?: string
): Promise<ElectionDetail | null> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();

    // Get election details
    const { data: election, error: electionError } = await supabase
      .from("elections")
      .select("*")
      .eq("id", electionId)
      .single();

    if (electionError || !election) {
      console.error("Error fetching election:", electionError);
      return null;
    }

    // Get all ballot items for this election
    const { data: ballotItems, error: ballotError } = await supabase
      .from("ballot_items")
      .select("*, jurisdictions!inner(*)")
      .eq("election_id", election.id);

    if (ballotError || !ballotItems) {
      console.error("Error fetching ballot items:", ballotError);
      return null;
    }

    const supportersByJurisdiction = await getSupportersByJurisdictionClient(
      viewpointGroupId
    );

    // Calculate supporters in scope
    const jurisdictionIds = new Set<string>();
    ballotItems.forEach((bi) => {
      if (bi.jurisdiction_id) {
        jurisdictionIds.add(bi.jurisdiction_id);
      }
    });

    let supportersInScope = 0;
    const jurisdictionBreakdown = Array.from(jurisdictionIds).map((jid) => {
      const supporters = supportersByJurisdiction.get(jid);
      const supporterCount = supporters?.profileIds.size || 0;
      supportersInScope += supporterCount;
      const jurisdiction = ballotItems.find((bi) => bi.jurisdiction_id === jid)
        ?.jurisdictions as { name?: string } | null;
      return {
        jurisdictionId: jid,
        jurisdictionName: jurisdiction?.name || "Unknown",
        supporterCount,
      };
    });

    // Get complete ballot information
    const ballotItemsWithDetails: BallotItem[] = await Promise.all(
      ballotItems.map(async (bi) => {
        const jurisdiction = bi.jurisdictions as { name?: string } | null;
        const jurisdictionId = bi.jurisdiction_id;

        const { data: races } = await supabase
          .from("races")
          .select("*")
          .eq("ballot_item_id", bi.id)
          .limit(1);

        const { data: measures } = await supabase
          .from("measures")
          .select("*")
          .eq("ballot_item_id", bi.id)
          .limit(1);

        if (races && races.length > 0) {
          const race = races[0];
          const raceDetail = await getRaceDetailClient(race.id);
          return {
            ballotItemId: bi.id,
            title: bi.title,
            description: bi.description,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName: jurisdiction?.name || null,
            type: "race" as const,
            race: raceDetail || undefined,
          };
        } else if (measures && measures.length > 0) {
          const measure = measures[0];
          const measureDetail = await getMeasureDetailClient(measure.id);
          return {
            ballotItemId: bi.id,
            title: bi.title || measure.title,
            description: bi.description || measure.summary,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName: jurisdiction?.name || null,
            type: "measure" as const,
            measure: measureDetail || undefined,
          };
        }

        return {
          ballotItemId: bi.id,
          title: bi.title,
          description: bi.description,
          jurisdictionId: jurisdictionId || "",
          jurisdictionName: jurisdiction?.name || null,
          type: "race" as const,
        };
      })
    );

    // Get top 3 races by supporter count
    const racesWithSupporters = ballotItemsWithDetails
      .filter((bi) => bi.type === "race")
      .map((bi) => {
        const jid = bi.jurisdictionId;
        const supporterCount =
          supportersByJurisdiction.get(jid)?.profileIds.size || 0;
        return { ballotItem: bi, supporterCount };
      })
      .sort((a, b) => b.supporterCount - a.supporterCount)
      .slice(0, 3)
      .map((item) => item.ballotItem);

    const racesCount = ballotItemsWithDetails.filter(
      (bi) => bi.type === "race"
    ).length;
    const measuresCount = ballotItemsWithDetails.filter(
      (bi) => bi.type === "measure"
    ).length;

    return {
      electionId: election.id,
      name: election.name || "Unnamed Election",
      pollDate: election.poll_date,
      description: election.description,
      summary: {
        supportersInScope,
        totalBallotItems: ballotItemsWithDetails.length,
        racesCount,
        measuresCount,
      },
      ballotItems: ballotItemsWithDetails,
      topRaces: racesWithSupporters,
      jurisdictionBreakdown,
    };
  });
}
