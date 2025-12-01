import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ElectionInfluence } from "@/types/dashboard";
import { IconCalendar, IconTarget } from "@tabler/icons-react";

interface ElectionCardProps {
  election: ElectionInfluence;
}

export function ElectionCard({ election }: ElectionCardProps) {
  const pollDate = election.pollDate
    ? new Date(election.pollDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBD";

  return (
    <Link href={`/elections/${election.electionId}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="line-clamp-2">{election.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4" />
            {pollDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Supporters in Scope
              </span>
              <span className="font-semibold">
                {election.supportersInScope.toLocaleString()}
              </span>
            </div>
            {election.supporterShareInScope !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Supporter Share
                </span>
                <Badge
                  variant={
                    election.supporterShareInScope >= 5 ? "default" : "outline"
                  }
                >
                  {election.supporterShareInScope.toFixed(1)}%
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <IconTarget className="h-4 w-4" />
                Influence Targets
              </span>
              <span className="font-semibold">
                {election.influenceTargetCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ballot Items
              </span>
              <span className="font-semibold">
                {election.ballotItems.length}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {election.supporterShareInScope !== null &&
            election.supporterShareInScope >= 5 && (
              <Badge className="w-full justify-center" variant="default">
                High Leverage Opportunity
              </Badge>
            )}
        </CardFooter>
      </Card>
    </Link>
  );
}
