import { NextResponse } from "next/server";
import { getUpcomingElections } from "@/lib/queries";

export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get("daysAhead") || "90", 10);

    const elections = await getUpcomingElections(daysAhead);

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return NextResponse.json(
      { error: "Failed to fetch elections" },
      { status: 500 }
    );
  }
}
