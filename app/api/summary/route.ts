import { NextResponse } from "next/server";
import {
  getTotalSupporterCount,
  getActiveSupporterCount,
  getJurisdictionsWithInfluence,
  getUpcomingElections,
} from "@/lib/queries";
import type { SummaryMetrics } from "@/types/dashboard";

export const revalidate = 900; // Revalidate every 15 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewpointGroupId = searchParams.get("viewpointGroupId") || undefined;

    // Get all metrics in parallel
    const [
      totalSupporters,
      activeSupporters,
      jurisdictions,
      upcomingElections,
    ] = await Promise.all([
      getTotalSupporterCount(viewpointGroupId),
      getActiveSupporterCount(viewpointGroupId),
      getJurisdictionsWithInfluence(viewpointGroupId),
      getUpcomingElections(90, viewpointGroupId),
    ]);

    // Calculate active rate
    const activeRate =
      totalSupporters > 0 ? (activeSupporters / totalSupporters) * 100 : 0;

    // Find top jurisdiction by supporter share
    const topJurisdiction =
      jurisdictions
        .filter((j) => j.supporterShare !== null)
        .sort((a, b) => (b.supporterShare || 0) - (a.supporterShare || 0))[0] ||
      null;

    // Count high-leverage elections (supporter share >= 5%)
    const highLeverageElectionsCount = upcomingElections.filter(
      (e) => e.supporterShareInScope !== null && e.supporterShareInScope >= 5
    ).length;

    const summary: SummaryMetrics = {
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

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching summary metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary metrics" },
      { status: 500 }
    );
  }
}
