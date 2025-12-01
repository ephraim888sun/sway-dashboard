import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupportersByJurisdiction } from "@/lib/queries";
import { getLeaderViewpointGroupNetwork } from "@/lib/leader-context";
import type { ElectionDetail, BallotItem, Candidate } from "@/types/dashboard";

export const revalidate = 1800; // Revalidate every 30 minutes

async function getRaceDetail(raceId: string) {
  const { data: race, error: raceError } = await supabase
    .from("races")
    .select("*")
    .eq("id", raceId)
    .single();

  if (raceError || !race) {
    return null;
  }

  let officeTerm: {
    id: string;
    offices?: { name?: string; level?: string; district?: string };
  } | null = null;
  let office: { name?: string; level?: string; district?: string } | null =
    null;
  if (race.office_term_id) {
    const { data: ot } = await supabase
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
    const { data: p } = await supabase
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

async function getMeasureDetail(measureId: string) {
  const { data: measure, error: measureError } = await supabase
    .from("measures")
    .select("*")
    .eq("id", measureId)
    .single();

  if (measureError || !measure) {
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

async function calculateInfluenceScore(
  supporterCount: number,
  influenceTargetId: string | null,
  networkIds: string[]
): Promise<number> {
  if (!influenceTargetId) {
    return 0;
  }

  const { data: alignments } = await supabase
    .from("influence_target_viewpoint_group_rels")
    .select("weight")
    .eq("influence_target_id", influenceTargetId)
    .in("viewpoint_group_id", networkIds);

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
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get election details
    const { data: election, error: electionError } = await supabase
      .from("elections")
      .select("*")
      .eq("id", id)
      .single();

    if (electionError || !election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Get all ballot items for this election
    const { data: ballotItems, error: ballotError } = await supabase
      .from("ballot_items")
      .select("*, jurisdictions!inner(*)")
      .eq("election_id", election.id);

    if (ballotError || !ballotItems) {
      return NextResponse.json(
        { error: "Failed to fetch ballot items" },
        { status: 500 }
      );
    }

    const networkIds = await getLeaderViewpointGroupNetwork();
    const supportersByJurisdiction = await getSupportersByJurisdiction();

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
            jurisdictionName: jurisdiction?.name || null,
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

    const electionDetail: ElectionDetail = {
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

    return NextResponse.json(electionDetail);
  } catch (error) {
    console.error("Error fetching election detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch election detail" },
      { status: 500 }
    );
  }
}
