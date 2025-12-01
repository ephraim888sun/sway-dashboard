import { NextResponse } from "next/server";
import { getSupporterGrowthTimeSeries } from "@/lib/queries";
import type { TimeSeriesData } from "@/types/dashboard";

export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType =
      (searchParams.get("period") as "weekly" | "monthly") || "monthly";

    const data = await getSupporterGrowthTimeSeries(periodType);

    const response: TimeSeriesData = {
      data,
      periodType,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return NextResponse.json(
      { error: "Failed to fetch time series data" },
      { status: 500 }
    );
  }
}
