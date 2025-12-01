import { NextResponse } from "next/server";
import { getJurisdictionsWithInfluence } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "supporterShare";
    const order = searchParams.get("order") || "desc";
    const viewpointGroupId = searchParams.get("viewpointGroupId") || undefined;

    const jurisdictions = await getJurisdictionsWithInfluence(viewpointGroupId);

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

    // Add caching headers for better performance
    // Cache for 5 minutes on the client, allow stale-while-revalidate
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    headers.set("Content-Type", "application/json");

    return NextResponse.json(jurisdictions, { headers });
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch jurisdictions" },
      { status: 500 }
    );
  }
}
