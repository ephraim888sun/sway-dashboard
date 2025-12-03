import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { ElectionInfluence } from "@/types/dashboard";
import { IconTarget, IconCalendar } from "@tabler/icons-react";

interface InfluenceInsightsProps {
  elections: ElectionInfluence[];
  isLoading?: boolean;
}

export function InfluenceInsights({
  elections,
  isLoading,
}: InfluenceInsightsProps) {
  // Elections with most supporters (next 90 days)
  const topElections = elections
    .filter((e) => e.supportersInScope > 0)
    .sort((a, b) => b.supportersInScope - a.supportersInScope)
    .slice(0, 10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Elections with Most Supporters</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topElections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTarget className="h-5 w-5" />
            Elections with Most Supporters
          </CardTitle>
          <CardDescription>
            The highest-leverage upcoming elections based on real voter access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No upcoming elections with supporter access
          </div>
        </CardContent>
      </Card>
    );
  }

  const topElection = topElections[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTarget className="h-5 w-5" />
          Elections with Most Supporters (Next 90 Days)
        </CardTitle>
        <CardDescription>
          The highest-leverage upcoming elections based on real voter access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topElection && (
          <Link
            key={topElection.electionId}
            href={`/elections/${topElection.electionId}`}
          >
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{topElection.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your biggest opportunity
                  </p>
                </div>
                <Badge variant="default" className="text-base">
                  {topElection.supportersInScope} supporters
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconCalendar className="h-4 w-4" />
                  {topElection.pollDate
                    ? new Date(topElection.pollDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "Date TBD"}
                </span>
                <span>{topElection.ballotItemsCount} ballot items</span>
                <span>
                  {topElection.racesCount} races, {topElection.measuresCount}{" "}
                  measures
                </span>
              </div>
            </div>
          </Link>
        )}
        <div className="space-y-3">
          {topElections.slice(1).map((election) => {
            const pollDate = election.pollDate
              ? new Date(election.pollDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "Date TBD";

            return (
              <Link
                key={election.electionId}
                href={`/elections/${election.electionId}`}
                className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{election.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3" />
                        {pollDate}
                      </span>
                      <span>
                        {election.supportersInScope.toLocaleString()} supporters
                      </span>
                      <span>{election.ballotItemsCount} ballot items</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {election.racesCount} races, {election.measuresCount}{" "}
                    measures
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            There are <strong>{topElections.length}</strong> real elections in
            the next 90 days where your supporters can vote.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
