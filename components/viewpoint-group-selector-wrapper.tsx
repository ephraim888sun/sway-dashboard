"use client";

import * as React from "react";
import { ViewpointGroupSelector } from "./viewpoint-group-selector";
import type { ViewpointGroup } from "@/lib/viewpoint-groups";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewpointGroup } from "@/lib/viewpoint-group-context";

export function ViewpointGroupSelectorWrapper() {
  const [groups, setGroups] = React.useState<ViewpointGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { selectedGroupId, setSelectedGroupId } = useViewpointGroup();

  React.useEffect(() => {
    async function fetchGroups() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/viewpoint-groups`);
        if (!res.ok) {
          throw new Error("Failed to fetch viewpoint groups");
        }
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error("Error fetching viewpoint groups:", err);
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 px-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2 px-2">
        <p className="text-xs text-muted-foreground">Error loading groups</p>
      </div>
    );
  }

  return (
    <ViewpointGroupSelector
      groups={groups}
      selectedGroupId={selectedGroupId}
      onGroupChange={setSelectedGroupId}
    />
  );
}
