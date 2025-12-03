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
  periodType: "weekly" | "monthly" = "monthly",
  viewpointGroupId?: string
): Promise<TimeSeriesDataPoint[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

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

    return data.map((row) => ({
      date: new Date(row.date).toISOString(),
      period: row.period,
      newSupporters: row.new_supporters,
      cumulativeSupporters: row.cumulative_supporters,
      activeSupporters: row.active_supporters || 0,
    }));
  });
}

/**
 * Get active supporter count (last 30 days) (client-side version)
 */
export async function getActiveSupporterCountClient(
  viewpointGroupId?: string
): Promise<number> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    const { data, error } = await supabase
      .from("mv_jurisdiction_metrics")
      .select("active_supporter_count")
      .in("viewpoint_group_id", networkIds);

    if (error) {
      console.error(
        "Error fetching active supporters from materialized view:",
        error
      );
      throw error;
    }

    return (
      data?.reduce((sum, row) => sum + (row.active_supporter_count || 0), 0) ||
      0
    );
  });
}

/**
 * Get total supporter count (client-side version)
 */
export async function getTotalSupporterCountClient(
  viewpointGroupId?: string
): Promise<number> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    const { data, error } = await supabase
      .from("mv_jurisdiction_metrics")
      .select("supporter_count")
      .in("viewpoint_group_id", networkIds);

    if (error) {
      console.error(
        "Error fetching total supporters from materialized view:",
        error
      );
      throw error;
    }

    return data?.reduce((sum, row) => sum + (row.supporter_count || 0), 0) || 0;
  });
}

/**
 * Get jurisdictions with influence data (client-side version)
 */
export async function getJurisdictionsWithInfluenceClient(
  viewpointGroupId?: string
): Promise<JurisdictionInfluence[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    const { data, error } = await supabase
      .from("mv_jurisdiction_metrics")
      .select("*")
      .in("viewpoint_group_id", networkIds);

    if (error) {
      console.error(
        "Error fetching jurisdictions from materialized view:",
        error
      );
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row) => ({
      jurisdictionId: row.jurisdiction_id,
      name: row.name || "Unknown",
      level: row.level,
      supporterCount: row.supporter_count || 0,
      estimatedTurnout: row.estimated_turnout || 0,
      supporterShare: row.supporter_share,
      activeSupporterCount: row.active_supporter_count || 0,
      activeRate: row.active_rate || 0,
      growth30d: row.growth_30d || 0,
    }));
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
        .select("*, offices(*)")
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
      } else if (hasMeaningfulError(otError)) {
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
 * Calculate influence score for a race/measure (client-side version)
 */
async function calculateInfluenceScoreClient(
  supporterCount: number,
  influenceTargetId: string | null,
  networkIds: string[]
): Promise<number> {
  if (!influenceTargetId) {
    return 0;
  }

  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const { data: alignments, error } = await supabase
      .from("influence_target_viewpoint_group_rels")
      .select("weight")
      .eq("influence_target_id", influenceTargetId)
      .in("viewpoint_group_id", networkIds);

    if (error) {
      console.error("Error checking alignment:", error);
    }

    const alignmentWeight =
      alignments && alignments.length > 0
        ? Math.min(
            alignments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0) /
              alignments.length,
            1
          )
        : 0;

    const estimatedTurnout = 10000;
    const supporterShare =
      estimatedTurnout > 0 ? supporterCount / estimatedTurnout : 0;

    const influenceScore = supporterShare * 50 + alignmentWeight * 50;
    return Math.min(Math.max(influenceScore, 0), 100);
  });
}

/**
 * Get all supporters for the leader's network by jurisdiction (client-side version)
 * This is a simplified version that uses materialized views when possible
 */
async function getSupportersByJurisdictionClient(
  viewpointGroupId?: string
): Promise<Map<string, { profileIds: Set<string>; createdAts: Date[] }>> {
  const supabase = createClientClient();
  const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

  // Use materialized view if available, otherwise fallback to direct queries
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

    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

    // Fetch elections and election influence summary in parallel
    const [electionsResult, influenceSummaryResult] = await Promise.all([
      supabase
        .from("elections")
        .select("*")
        .gte("poll_date", today.toISOString().split("T")[0])
        .lte("poll_date", futureDate.toISOString().split("T")[0])
        .order("poll_date", { ascending: true }),
      supabase
        .from("mv_election_influence_summary")
        .select("*")
        .in("viewpoint_group_id", networkIds),
    ]);

    const { data: elections, error: electionsError } = electionsResult;
    const { data: influenceSummary, error: influenceSummaryError } =
      influenceSummaryResult;

    if (electionsError) {
      console.error("Error fetching elections:", electionsError);
      throw electionsError;
    }

    if (!elections || elections.length === 0) {
      return [];
    }

    type InfluenceSummaryItem = {
      election_id: string;
      viewpoint_group_id: string;
      supporters_in_scope: number;
      estimated_turnout: number;
      supporter_share_in_scope: number | null;
    };
    const influenceMap = new Map<string, InfluenceSummaryItem>();
    if (!influenceSummaryError && influenceSummary) {
      influenceSummary.forEach((item: InfluenceSummaryItem) => {
        influenceMap.set(item.election_id, item);
      });
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

      const influenceData = influenceMap.get(election.id);
      let supportersInScope = influenceData?.supporters_in_scope || 0;
      let supporterShareInScope =
        influenceData?.supporter_share_in_scope || null;

      if (!influenceData) {
        const jurisdictionIds = new Set<string>();
        ballotItems.forEach((bi) => {
          if (bi.jurisdiction_id) {
            jurisdictionIds.add(bi.jurisdiction_id);
          }
        });

        supportersInScope = 0;
        jurisdictionIds.forEach((jid) => {
          const supporters = supportersByJurisdiction.get(jid);
          if (supporters) {
            supportersInScope += supporters.profileIds.size;
          }
        });

        const estimatedTurnout = jurisdictionIds.size * 10000;
        supporterShareInScope =
          estimatedTurnout > 0
            ? (supportersInScope / estimatedTurnout) * 100
            : null;
      }

      const ballotItemPromises = ballotItems.map(async (bi) => {
        const jurisdiction = bi.jurisdictions as { name?: string } | null;
        const jurisdictionId = bi.jurisdiction_id;
        const supporterCount =
          supportersByJurisdiction.get(jurisdictionId)?.profileIds.size || 0;

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
          const [raceDetail, influenceScore] = await Promise.all([
            getRaceDetailClient(race.id),
            calculateInfluenceScoreClient(
              supporterCount,
              race.influence_target_id || null,
              networkIds
            ),
          ]);
          return {
            ballotItemId: bi.id,
            title: bi.title,
            description: bi.description,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName:
              (jurisdiction as { name?: string } | null)?.name || null,
            type: "race" as const,
            race: raceDetail || undefined,
            influenceScore,
          };
        } else if (measures && measures.length > 0) {
          const measure = measures[0];
          const [measureDetail, influenceScore] = await Promise.all([
            getMeasureDetailClient(measure.id),
            calculateInfluenceScoreClient(
              supporterCount,
              measure.influence_target_id || null,
              networkIds
            ),
          ]);
          return {
            ballotItemId: bi.id,
            title: bi.title || measure.title,
            description: bi.description || measure.summary,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName:
              (jurisdiction as { name?: string } | null)?.name || null,
            type: "measure" as const,
            measure: measureDetail || undefined,
            influenceScore,
          };
        }

        return {
          ballotItemId: bi.id,
          title: bi.title,
          description: bi.description,
          jurisdictionId: jurisdictionId || "",
          jurisdictionName: jurisdiction?.name || null,
          type: "race" as const,
          influenceScore: 0,
        };
      });

      const ballotItemsWithDetails = await Promise.all(ballotItemPromises);

      const influenceTargetCount = ballotItemsWithDetails.filter(
        (bi) => bi.influenceScore > 50
      ).length;

      return {
        electionId: election.id,
        name: election.name || "Unnamed Election",
        pollDate: election.poll_date,
        description: election.description,
        supportersInScope,
        supporterShareInScope,
        influenceTargetCount,
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
    const networkIds = await getViewpointGroupNetworkClient(viewpointGroupId);

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
        supporterShare: null, // Would need turnout data
      };
    });

    // Get complete ballot information
    const ballotItemsWithDetails: BallotItem[] = await Promise.all(
      ballotItems.map(async (bi) => {
        const jurisdiction = bi.jurisdictions as { name?: string } | null;
        const jurisdictionId = bi.jurisdiction_id;
        const supporterCount =
          supportersByJurisdiction.get(jurisdictionId)?.profileIds.size || 0;

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
          const influenceScore = await calculateInfluenceScoreClient(
            supporterCount,
            race.influence_target_id || null,
            networkIds
          );
          return {
            ballotItemId: bi.id,
            title: bi.title,
            description: bi.description,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName: jurisdiction?.name || null,
            type: "race" as const,
            race: raceDetail || undefined,
            influenceScore,
          };
        } else if (measures && measures.length > 0) {
          const measure = measures[0];
          const measureDetail = await getMeasureDetailClient(measure.id);
          const influenceScore = await calculateInfluenceScoreClient(
            supporterCount,
            measure.influence_target_id || null,
            networkIds
          );
          return {
            ballotItemId: bi.id,
            title: bi.title || measure.title,
            description: bi.description || measure.summary,
            jurisdictionId: jurisdictionId || "",
            jurisdictionName: jurisdiction?.name || null,
            type: "measure" as const,
            measure: measureDetail || undefined,
            influenceScore,
          };
        }

        return {
          ballotItemId: bi.id,
          title: bi.title,
          description: bi.description,
          jurisdictionId: jurisdictionId || "",
          jurisdictionName: jurisdiction?.name || null,
          type: "race" as const,
          influenceScore: 0,
        };
      })
    );

    // Get top 3 races by influence score
    const topRaces = ballotItemsWithDetails
      .filter((bi) => bi.type === "race")
      .sort((a, b) => b.influenceScore - a.influenceScore)
      .slice(0, 3);

    const estimatedTurnout = jurisdictionIds.size * 10000;
    const supporterShareInScope =
      estimatedTurnout > 0
        ? (supportersInScope / estimatedTurnout) * 100
        : null;

    return {
      electionId: election.id,
      name: election.name || "Unnamed Election",
      pollDate: election.poll_date,
      description: election.description,
      summary: {
        supportersInScope,
        supporterShareInScope,
        totalBallotItems: ballotItemsWithDetails.length,
      },
      ballotItems: ballotItemsWithDetails,
      topRaces,
      jurisdictionBreakdown,
    };
  });
}
