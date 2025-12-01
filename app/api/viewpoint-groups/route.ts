import { NextResponse } from "next/server";
import { getAllViewpointGroups } from "@/lib/viewpoint-groups";

export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET() {
  try {
    const groups = await getAllViewpointGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching viewpoint groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch viewpoint groups" },
      { status: 500 }
    );
  }
}
