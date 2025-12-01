import { getSupabase } from "./supabase";
import type {
  JurisdictionInfluence,
  TimeSeriesDataPoint,
  ElectionInfluence,
  BallotItem,
  RaceDetail,
  MeasureDetail,
  Candidate,
} from "@/types/dashboard";

// Supabase batch size limit for .in() queries
const SUPABASE_BATCH_SIZE = 100;

/**
 * Get all supporters for the leader's network by jurisdiction
 * Uses separate queries for better performance
 */
export async function getSupportersByJurisdiction(
  viewpointGroupId?: string
): Promise<Map<string, { profileIds: Set<string>; createdAts: Date[] }>> {
  const { getViewpointGroupNetwork } = await import("./leader-context");
  const networkIds = await getViewpointGroupNetwork(viewpointGroupId);

  // Get all supporters
  const { data: supporters, error: supportersError } = await getSupabase()
    .from("profile_viewpoint_group_rels")
    .select("profile_id, created_at")
    .in("viewpoint_group_id", networkIds)
    .eq("type", "supporter");

  if (supportersError || !supporters) {
    console.error("Error fetching supporters:", supportersError);
    return new Map();
  }

  const profileIds = supporters.map((s) => s.profile_id).filter(Boolean);

  // If no profile IDs, return empty map
  if (profileIds.length === 0) {
    return new Map();
  }

  // Get profiles with person IDs (batch if needed)
  const allProfiles: { id: string; person_id: string | null }[] = [];

  for (let i = 0; i < profileIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = profileIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: profiles, error: profilesError } = await getSupabase()
      .from("profiles")
      .select("id, person_id")
      .in("id", batch);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      continue; // Continue with other batches
    }

    if (profiles) {
      allProfiles.push(...profiles);
    }
  }

  const profiles = allProfiles;

  const personIds = profiles.map((p) => p.person_id).filter(Boolean);

  // If no person IDs, return empty map
  if (personIds.length === 0) {
    return new Map();
  }

  // Get voter verifications (batch if needed)
  const allVoterVerifications: { id: string; person_id: string }[] = [];

  for (let i = 0; i < personIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = personIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: voterVerifications, error: vvError } = await getSupabase()
      .from("voter_verifications")
      .select("id, person_id")
      .in("person_id", batch);

    if (vvError) {
      console.error("Error fetching voter verifications:", vvError);
      continue; // Continue with other batches
    }

    if (voterVerifications) {
      allVoterVerifications.push(...voterVerifications);
    }
  }

  const voterVerifications = allVoterVerifications;

  const vvIds = voterVerifications.map((vv) => vv.id).filter(Boolean);

  // If no voter verification IDs, return empty map
  if (vvIds.length === 0) {
    return new Map();
  }

  // Get jurisdiction relations (batch if needed)
  const allJurisdictionRels: {
    voter_verification_id: string;
    jurisdiction_id: string;
  }[] = [];

  for (let i = 0; i < vvIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = vvIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: jurisdictionRels, error: jrError } = await getSupabase()
      .from("voter_verification_jurisdiction_rels")
      .select("voter_verification_id, jurisdiction_id")
      .in("voter_verification_id", batch);

    if (jrError) {
      console.error("Error fetching jurisdiction relations:", jrError);
      continue; // Continue with other batches
    }

    if (jurisdictionRels) {
      allJurisdictionRels.push(...jurisdictionRels);
    }
  }

  const jurisdictionRels = allJurisdictionRels;

  // Build maps for efficient lookup
  const profileToPerson = new Map(profiles.map((p) => [p.id, p.person_id]));
  const personToVVs = new Map<string, string[]>();
  voterVerifications.forEach((vv) => {
    if (!vv.person_id) return;
    if (!personToVVs.has(vv.person_id)) {
      personToVVs.set(vv.person_id, []);
    }
    personToVVs.get(vv.person_id)!.push(vv.id);
  });
  const vvToJurisdictions = new Map<string, string[]>();
  jurisdictionRels.forEach((jr) => {
    if (!vvToJurisdictions.has(jr.voter_verification_id)) {
      vvToJurisdictions.set(jr.voter_verification_id, []);
    }
    vvToJurisdictions.get(jr.voter_verification_id)!.push(jr.jurisdiction_id);
  });

  // Build jurisdiction map
  const jurisdictionMap = new Map<
    string,
    { profileIds: Set<string>; createdAts: Date[] }
  >();

  supporters.forEach((supporter) => {
    const personId = profileToPerson.get(supporter.profile_id);
    if (!personId) return;

    const vvIdsForPerson = personToVVs.get(personId) || [];
    vvIdsForPerson.forEach((vvId) => {
      const jurisdictionIds = vvToJurisdictions.get(vvId) || [];
      jurisdictionIds.forEach((jurisdictionId) => {
        if (!jurisdictionMap.has(jurisdictionId)) {
          jurisdictionMap.set(jurisdictionId, {
            profileIds: new Set(),
            createdAts: [],
          });
        }

        const entry = jurisdictionMap.get(jurisdictionId)!;
        entry.profileIds.add(supporter.profile_id);
        if (supporter.created_at) {
          entry.createdAts.push(new Date(supporter.created_at));
        }
      });
    });
  });

  return jurisdictionMap;
}

/**
 * Get supporter growth time series data
 */
export async function getSupporterGrowthTimeSeries(
  periodType: "weekly" | "monthly" = "monthly",
  viewpointGroupId?: string
): Promise<TimeSeriesDataPoint[]> {
  const { getViewpointGroupNetwork } = await import("./leader-context");
  const networkIds = await getViewpointGroupNetwork(viewpointGroupId);

  const { data, error } = await getSupabase()
    .from("profile_viewpoint_group_rels")
    .select("created_at")
    .in("viewpoint_group_id", networkIds)
    .eq("type", "supporter")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching supporter growth:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by period
  const periodMap = new Map<string, Date[]>();

  data.forEach((rel) => {
    if (!rel.created_at) return;
    const date = new Date(rel.created_at);
    const period = formatPeriod(date, periodType);
    if (!periodMap.has(period)) {
      periodMap.set(period, []);
    }
    periodMap.get(period)!.push(date);
  });

  // Convert to time series points
  const periods = Array.from(periodMap.keys()).sort();
  const timeSeries: TimeSeriesDataPoint[] = [];
  let cumulative = 0;

  periods.forEach((period) => {
    const dates = periodMap.get(period)!;
    const newSupporters = dates.length;
    cumulative += newSupporters;

    // Calculate active supporters (those created/updated in last 30 days from period end)
    const periodEnd = getPeriodEnd(period, periodType);
    const thirtyDaysAgo = new Date(periodEnd);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeSupporters = dates.filter(
      (d) => d >= thirtyDaysAgo && d <= periodEnd
    ).length;

    timeSeries.push({
      date: periodEnd.toISOString(),
      period,
      newSupporters,
      cumulativeSupporters: cumulative,
      activeSupporters,
    });
  });

  return timeSeries;
}

/**
 * Get active supporter count (last 30 days)
 */
export async function getActiveSupporterCount(
  viewpointGroupId?: string
): Promise<number> {
  const { getViewpointGroupNetwork } = await import("./leader-context");
  const networkIds = await getViewpointGroupNetwork(viewpointGroupId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count, error } = await getSupabase()
    .from("profile_viewpoint_group_rels")
    .select("*", { count: "exact", head: true })
    .in("viewpoint_group_id", networkIds)
    .eq("type", "supporter")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("Error fetching active supporters:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get total supporter count
 */
export async function getTotalSupporterCount(
  viewpointGroupId?: string
): Promise<number> {
  const { getViewpointGroupNetwork } = await import("./leader-context");
  const networkIds = await getViewpointGroupNetwork(viewpointGroupId);

  const { count, error } = await getSupabase()
    .from("profile_viewpoint_group_rels")
    .select("*", { count: "exact", head: true })
    .in("viewpoint_group_id", networkIds)
    .eq("type", "supporter");

  if (error) {
    console.error("Error fetching total supporters:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get jurisdictions with influence data
 */
export async function getJurisdictionsWithInfluence(
  viewpointGroupId?: string
): Promise<JurisdictionInfluence[]> {
  try {
    const supportersByJurisdiction = await getSupportersByJurisdiction(
      viewpointGroupId
    );

    // Get all jurisdiction IDs
    const jurisdictionIds = Array.from(supportersByJurisdiction.keys());

    if (jurisdictionIds.length === 0) {
      console.log(
        "No jurisdiction IDs found - no supporters mapped to jurisdictions"
      );
      return [];
    }

    // Get jurisdiction details (batch if needed)
    const allJurisdictions: {
      id: string;
      name: string | null;
      level: string | null;
    }[] = [];

    for (let i = 0; i < jurisdictionIds.length; i += SUPABASE_BATCH_SIZE) {
      const batch = jurisdictionIds.slice(i, i + SUPABASE_BATCH_SIZE);
      const { data: jurisdictions, error: jurisdictionsError } =
        await getSupabase()
          .from("jurisdictions")
          .select("id, name, level")
          .in("id", batch);

      if (jurisdictionsError) {
        console.error(
          `Error fetching jurisdictions batch ${i / SUPABASE_BATCH_SIZE + 1}:`,
          jurisdictionsError
        );
        continue; // Continue with other batches
      }

      if (jurisdictions) {
        allJurisdictions.push(...jurisdictions);
      }
    }

    if (allJurisdictions.length === 0) {
      console.log("No jurisdiction details found for jurisdiction IDs");
      return [];
    }

    // Calculate 30 days ago for growth calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results: JurisdictionInfluence[] = allJurisdictions.map(
      (jurisdiction) => {
        const supporters = supportersByJurisdiction.get(jurisdiction.id);
        const supporterCount = supporters?.profileIds.size || 0;
        const createdAts = supporters?.createdAts || [];

        // Calculate 30-day growth
        const recentSupporters = createdAts.filter(
          (date) => date >= thirtyDaysAgo
        ).length;
        const previousCount = supporterCount - recentSupporters;
        const growth30d =
          previousCount > 0
            ? (recentSupporters / previousCount) * 100
            : recentSupporters > 0
            ? 100
            : 0;

        // Calculate active supporters (last 30 days)
        const activeSupporterCount = recentSupporters;
        const activeRate =
          supporterCount > 0
            ? (activeSupporterCount / supporterCount) * 100
            : 0;

        // Estimate turnout (placeholder - would need actual data)
        const estimatedTurnout = estimateTurnout(jurisdiction.level);

        return {
          jurisdictionId: jurisdiction.id,
          name: jurisdiction.name || "Unknown",
          level: jurisdiction.level,
          supporterCount,
          estimatedTurnout,
          supporterShare:
            estimatedTurnout > 0
              ? (supporterCount / estimatedTurnout) * 100
              : null,
          activeSupporterCount,
          activeRate,
          growth30d,
        };
      }
    );

    return results;
  } catch (error) {
    console.error("Error in getJurisdictionsWithInfluence:", error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Estimate turnout based on jurisdiction level
 */
function estimateTurnout(level: string | null): number {
  // Placeholder estimates - would need real data
  switch (level) {
    case "country":
      return 150000000;
    case "state":
      return 5000000;
    case "county":
      return 500000;
    case "city":
      return 50000;
    case "district":
      return 10000;
    default:
      return 10000;
  }
}

/**
 * Get upcoming elections with supporter counts
 */
export async function getUpcomingElections(
  daysAhead: number = 90,
  viewpointGroupId?: string
): Promise<ElectionInfluence[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data: elections, error: electionsError } = await getSupabase()
    .from("elections")
    .select("*")
    .gte("poll_date", today.toISOString().split("T")[0])
    .lte("poll_date", futureDate.toISOString().split("T")[0])
    .order("poll_date", { ascending: true });

  if (electionsError) {
    console.error("Error fetching elections:", electionsError);
    return [];
  }

  if (!elections || elections.length === 0) {
    return [];
  }

  const { getViewpointGroupNetwork } = await import("./leader-context");
  const networkIds = await getViewpointGroupNetwork(viewpointGroupId);
  const supportersByJurisdiction = await getSupportersByJurisdiction(
    viewpointGroupId
  );

  const electionInfluences: ElectionInfluence[] = [];

  for (const election of elections) {
    // Get all ballot items for this election
    const { data: ballotItems, error: ballotError } = await getSupabase()
      .from("ballot_items")
      .select("*, jurisdictions!inner(*)")
      .eq("election_id", election.id);

    if (ballotError || !ballotItems || ballotItems.length === 0) {
      continue;
    }

    // Calculate supporters in scope
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

    // Get complete ballot information
    const ballotItemsWithDetails: BallotItem[] = await Promise.all(
      ballotItems.map(async (bi) => {
        const jurisdiction = bi.jurisdictions as { name?: string } | null;
        const jurisdictionId = bi.jurisdiction_id;
        const supporterCount =
          supportersByJurisdiction.get(jurisdictionId)?.profileIds.size || 0;

        // Check if it's a race or measure
        const { data: races } = await getSupabase()
          .from("races")
          .select("*")
          .eq("ballot_item_id", bi.id)
          .limit(1);

        const { data: measures } = await getSupabase()
          .from("measures")
          .select("*")
          .eq("ballot_item_id", bi.id)
          .limit(1);

        if (races && races.length > 0) {
          const race = races[0];
          const raceDetail = await getRaceDetail(race.id);
          const influenceScore = await calculateInfluenceScore(
            supporterCount,
            race.influence_target_id || null,
            networkIds
          );
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
          const measureDetail = await getMeasureDetail(measure.id);
          const influenceScore = await calculateInfluenceScore(
            supporterCount,
            measure.influence_target_id || null,
            networkIds
          );
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

        // Fallback
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

    // Count influence targets aligned with viewpoint groups
    const influenceTargetCount = ballotItemsWithDetails.filter(
      (bi) => bi.influenceScore > 50
    ).length;

    // Estimate supporter share
    const estimatedTurnout = jurisdictionIds.size * 10000;
    const supporterShareInScope =
      estimatedTurnout > 0
        ? (supportersInScope / estimatedTurnout) * 100
        : null;

    electionInfluences.push({
      electionId: election.id,
      name: election.name || "Unnamed Election",
      pollDate: election.poll_date,
      description: election.description,
      supportersInScope,
      supporterShareInScope,
      influenceTargetCount,
      ballotItems: ballotItemsWithDetails,
    });
  }

  return electionInfluences;
}

/**
 * Get detailed race information with candidates
 */
async function getRaceDetail(raceId: string): Promise<RaceDetail | null> {
  const { data: race, error: raceError } = await getSupabase()
    .from("races")
    .select("*")
    .eq("id", raceId)
    .single();

  if (raceError || !race) {
    console.error("Error fetching race detail:", raceError);
    return null;
  }

  // Get office term and office
  let officeTerm: {
    id: string;
    offices?: { name?: string; level?: string; district?: string };
  } | null = null;
  let office: { name?: string; level?: string; district?: string } | null =
    null;
  if (race.office_term_id) {
    const { data: ot } = await getSupabase()
      .from("office_terms")
      .select("*, offices(*)")
      .eq("id", race.office_term_id)
      .single();
    officeTerm = ot;
    office =
      (ot?.offices as {
        name?: string;
        level?: string;
        district?: string;
      } | null) || null;
  }

  // Get candidacies with candidates
  const { data: candidacies } = await getSupabase()
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

  // Get party info
  let party = null;
  if (race.party_id) {
    const { data: p } = await getSupabase()
      .from("parties")
      .select("*")
      .eq("id", race.party_id)
      .single();
    party = p;
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
}

/**
 * Get detailed measure information
 */
async function getMeasureDetail(
  measureId: string
): Promise<MeasureDetail | null> {
  const { data: measure, error: measureError } = await getSupabase()
    .from("measures")
    .select("*")
    .eq("id", measureId)
    .single();

  if (measureError || !measure) {
    console.error("Error fetching measure detail:", measureError);
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
}

/**
 * Calculate influence score for a race/measure
 */
async function calculateInfluenceScore(
  supporterCount: number,
  influenceTargetId: string | null,
  networkIds: string[]
): Promise<number> {
  if (!influenceTargetId) {
    return 0;
  }

  // Check alignment with viewpoint groups
  const { data: alignments, error } = await getSupabase()
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

  // Simplified supporter share
  const estimatedTurnout = 10000;
  const supporterShare =
    estimatedTurnout > 0 ? supporterCount / estimatedTurnout : 0;

  // Combine metrics: 50% supporter share, 50% alignment
  const influenceScore = supporterShare * 50 + alignmentWeight * 50;
  return Math.min(Math.max(influenceScore, 0), 100);
}

/**
 * Format date to period string
 */
function formatPeriod(date: Date, type: "weekly" | "monthly"): string {
  if (type === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  } else {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, "0")}`;
  }
}

/**
 * Get week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get period end date
 */
function getPeriodEnd(period: string, type: "weekly" | "monthly"): Date {
  if (type === "monthly") {
    const [year, month] = period.split("-").map(Number);
    return new Date(year, month, 0);
  } else {
    const [year, week] = period.split("-W").map(Number);
    const date = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    date.setDate(date.getDate() + days);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setDate(date.getDate() + 6);
    return date;
  }
}
