import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type {
  ElectionInfluence,
  JurisdictionInfluence,
} from "@/types/dashboard";
import { IconTrendingUp, IconTarget, IconCalendar } from "@tabler/icons-react";

interface InfluenceInsightsProps {
  elections: ElectionInfluence[];
  jurisdictions: JurisdictionInfluence[];
}

export function InfluenceInsights({
  elections,
  jurisdictions,
}: InfluenceInsightsProps) {
  // High leverage opportunities: elections with ≥5% supporter share
  const highLeverageElections = elections
    .filter(
      (e) => e.supporterShareInScope !== null && e.supporterShareInScope >= 5
    )
    .slice(0, 5);

  // Wake-up zones: jurisdictions with many supporters but low active rate
  const wakeUpZones = jurisdictions
    .filter((j) => j.supporterCount >= 50 && j.activeRate < 30)
    .slice(0, 5);

  // Growth hotspots: jurisdictions with high growth
  const growthHotspots = jurisdictions
    .filter((j) => j.growth30d >= 20)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {highLeverageElections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTarget className="h-5 w-5" />
              High Leverage Opportunities
            </CardTitle>
            <CardDescription>
              Elections where your supporter base could be decisive (≥5% of
              expected turnout)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highLeverageElections.map((election) => {
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
                            {election.supportersInScope.toLocaleString()}{" "}
                            supporters
                          </span>
                          <span>
                            {election.influenceTargetCount} influence targets
                          </span>
                        </div>
                      </div>
                      <Badge variant="default">
                        {election.supporterShareInScope?.toFixed(1)}% share
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {wakeUpZones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wake-up Zones</CardTitle>
            <CardDescription>
              Jurisdictions with many supporters but low active engagement -
              re-engagement opportunity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wakeUpZones.map((jurisdiction) => (
                <div
                  key={jurisdiction.jurisdictionId}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{jurisdiction.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          {jurisdiction.supporterCount.toLocaleString()}{" "}
                          supporters
                        </span>
                        <span>
                          Active rate: {jurisdiction.activeRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">Re-engage</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {growthHotspots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5" />
              Growth Hotspots
            </CardTitle>
            <CardDescription>
              Jurisdictions with high growth - consider focusing your next push
              here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {growthHotspots.map((jurisdiction) => (
                <div
                  key={jurisdiction.jurisdictionId}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{jurisdiction.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          {jurisdiction.supporterCount.toLocaleString()}{" "}
                          supporters
                        </span>
                        <span>
                          {jurisdiction.supporterShare !== null
                            ? `${jurisdiction.supporterShare.toFixed(1)}% share`
                            : "Share N/A"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="default" className="text-green-600">
                      +{jurisdiction.growth30d.toFixed(1)}% growth
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
