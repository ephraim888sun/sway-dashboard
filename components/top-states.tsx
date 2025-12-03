import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StateDistribution } from "@/types/dashboard";
import { IconMapPin } from "@tabler/icons-react";

interface TopStatesProps {
  states: StateDistribution[];
  isLoading?: boolean;
}

export function TopStates({ states, isLoading }: TopStatesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top States by Supporter Count</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!states || states.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMapPin className="h-5 w-5" />
            Top States by Supporter Count
          </CardTitle>
          <CardDescription>
            Where your movement is strongest geographically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No state data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topStates = states.slice(0, 10);
  const totalSupporters = states.reduce(
    (sum, state) => sum + state.supporterCount,
    0
  );
  const topTwoPercentage =
    totalSupporters > 0
      ? (
          ((topStates[0]?.supporterCount || 0) +
            (topStates[1]?.supporterCount || 0)) /
          totalSupporters
        ).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMapPin className="h-5 w-5" />
          Top States by Supporter Count
        </CardTitle>
        <CardDescription>
          Where your movement is strongest geographically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topStates.map((state, index) => (
            <div
              key={state.state}
              className="p-3 border rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{state.state}</h4>
                  <div className="text-sm text-muted-foreground">
                    {state.jurisdictionCount} jurisdiction
                    {state.jurisdictionCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <Badge variant="default" className="text-lg">
                {state.supporterCount.toLocaleString()} supporters
              </Badge>
            </div>
          ))}
        </div>
        {topStates.length >= 2 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-muted-foreground">
              <strong>{topStates[0]?.state}</strong> (
              {topStates[0]?.supporterCount}) and{" "}
              <strong>{topStates[1]?.state}</strong> (
              {topStates[1]?.supporterCount}) together represent ~
              {topTwoPercentage}% of your supporter base.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
