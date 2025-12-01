import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SummaryMetrics } from "@/types/dashboard";

interface SectionCardsProps {
  metrics: SummaryMetrics | null;
  isLoading?: boolean;
}

export function SectionCards({ metrics, isLoading }: SectionCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                --
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const activeTrend = metrics.activeRate >= 50 ? "up" : "down";
  const activeChange = metrics.activeRate >= 50 ? "+" : "";

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Supporters</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.totalSupporters.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Across all jurisdictions</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Supporters</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.activeSupporters.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {activeTrend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {activeChange}
              {metrics.activeRate.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeTrend === "up" ? "Strong engagement" : "Needs attention"}{" "}
            {activeTrend === "up" ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">Active in last 30 days</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Top Jurisdiction</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.topJurisdiction ? (
              <>{metrics.topJurisdiction.name}</>
            ) : (
              "N/A"
            )}
          </CardTitle>
          {metrics.topJurisdiction && (
            <CardAction>
              <Badge variant="outline">
                {metrics.topJurisdiction.supporterShare?.toFixed(1) || "0"}%
                share
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {metrics.topJurisdiction ? (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metrics.topJurisdiction.supporterCount.toLocaleString()}{" "}
                supporters
              </div>
              <div className="text-muted-foreground">
                Highest supporter share
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">No jurisdiction data</div>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>High-Leverage Elections</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.highLeverageElectionsCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              ≥5% share
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strategic opportunities <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Next 90 days</div>
        </CardFooter>
      </Card>
    </div>
  );
}
