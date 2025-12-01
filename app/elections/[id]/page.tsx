import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ElectionDetail } from "@/types/dashboard";
import {
  IconCalendar,
  IconUsers,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react";

async function getElectionDetail(id: string): Promise<ElectionDetail | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/elections/${id}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch election detail");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching election detail:", error);
    return null;
  }
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="h-8 bg-muted animate-pulse rounded w-64" />
      <div className="h-48 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

async function ElectionDetailContent({ id }: { id: string }) {
  const election = await getElectionDetail(id);

  if (!election) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Election Not Found</CardTitle>
            <CardDescription>
              The election you&apos;re looking for doesn&apos;t exist or
              couldn&apos;t be loaded.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pollDate = election.pollDate
    ? new Date(election.pollDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBD";

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">{election.name}</h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <IconCalendar className="h-4 w-4" />
          {pollDate}
        </p>
        {election.description && (
          <p className="text-muted-foreground mt-2">{election.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <IconUsers className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Supporters in Scope
                </div>
                <div className="text-2xl font-bold">
                  {election.summary.supportersInScope.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconTarget className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Supporter Share
                </div>
                <div className="text-2xl font-bold">
                  {election.summary.supporterShareInScope !== null
                    ? `${election.summary.supporterShareInScope.toFixed(1)}%`
                    : "N/A"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconTarget className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Ballot Items
                </div>
                <div className="text-2xl font-bold">
                  {election.summary.totalBallotItems}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {election.topRaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5" />
              Top 3 Races Where Your Base Could Be Decisive
            </CardTitle>
            <CardDescription>
              Races with the highest influence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {election.topRaces.map((race, index) => (
                <div key={race.ballotItemId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        #{index + 1} {race.title || "Untitled Race"}
                      </h3>
                      {race.race?.officeName && (
                        <p className="text-sm text-muted-foreground">
                          {race.race.officeName}
                          {race.race.officeDistrict &&
                            ` - ${race.race.officeDistrict}`}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        race.influenceScore >= 70 ? "default" : "outline"
                      }
                    >
                      Score: {race.influenceScore.toFixed(0)}
                    </Badge>
                  </div>
                  {race.race?.candidates && race.race.candidates.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Candidates:</p>
                      <div className="flex flex-wrap gap-2">
                        {race.race.candidates.map((candidate) => (
                          <Badge key={candidate.candidacyId} variant="outline">
                            {candidate.candidateName || "Unknown"}
                            {candidate.partyName && ` (${candidate.partyName})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Complete Ballot Information</CardTitle>
          <CardDescription>
            All races and measures your supporters will see in this election
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {election.ballotItems.map((item) => (
              <div key={item.ballotItemId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {item.title || "Untitled"}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.jurisdictionName || "Unknown Jurisdiction"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={item.type === "race" ? "default" : "secondary"}
                    >
                      {item.type === "race" ? "Race" : "Measure"}
                    </Badge>
                    <Badge variant="outline">
                      Influence: {item.influenceScore.toFixed(0)}
                    </Badge>
                  </div>
                </div>

                {item.type === "race" && item.race && (
                  <div className="mt-4 space-y-2">
                    {item.race.officeName && (
                      <p className="text-sm">
                        <span className="font-medium">Office:</span>{" "}
                        {item.race.officeName}
                        {item.race.officeLevel && ` (${item.race.officeLevel})`}
                        {item.race.officeDistrict &&
                          ` - District ${item.race.officeDistrict}`}
                      </p>
                    )}
                    {item.race.candidates &&
                      item.race.candidates.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Candidates:
                          </p>
                          <div className="space-y-1">
                            {item.race.candidates.map((candidate) => (
                              <div
                                key={candidate.candidacyId}
                                className="text-sm"
                              >
                                • {candidate.candidateName || "Unknown"}
                                {candidate.partyName && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({candidate.partyName})
                                  </span>
                                )}
                                {candidate.isWithdrawn && (
                                  <Badge variant="outline" className="ml-2">
                                    Withdrawn
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {item.type === "measure" && item.measure && (
                  <div className="mt-4 space-y-2">
                    {item.measure.summary && (
                      <p className="text-sm">{item.measure.summary}</p>
                    )}
                    {item.measure.proSnippet && (
                      <div className="text-sm">
                        <span className="font-medium">Pro:</span>{" "}
                        {item.measure.proSnippet}
                      </div>
                    )}
                    {item.measure.conSnippet && (
                      <div className="text-sm">
                        <span className="font-medium">Con:</span>{" "}
                        {item.measure.conSnippet}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {election.jurisdictionBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jurisdiction Breakdown</CardTitle>
            <CardDescription>
              Supporter distribution across jurisdictions in this election
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Supporters</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {election.jurisdictionBreakdown.map((jurisdiction) => (
                  <TableRow key={jurisdiction.jurisdictionId}>
                    <TableCell className="font-medium">
                      {jurisdiction.jurisdictionName || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {jurisdiction.supporterCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {jurisdiction.supporterShare !== null
                        ? `${jurisdiction.supporterShare.toFixed(1)}%`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Suspense fallback={<LoadingSkeleton />}>
              <ElectionDetailContent id={id} />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
