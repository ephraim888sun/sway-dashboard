"use client";

import * as React from "react";
import { useSWRConfig } from "swr";
import { LEADER_VIEWPOINT_GROUP_ID } from "./constants";

interface ViewpointGroupContextType {
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
}

const ViewpointGroupContext = React.createContext<
  ViewpointGroupContextType | undefined
>(undefined);

export function ViewpointGroupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mutate } = useSWRConfig();
  const [selectedGroupId, setSelectedGroupIdState] = React.useState<string>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("selectedViewpointGroupId");
        return stored || LEADER_VIEWPOINT_GROUP_ID;
      }
      return LEADER_VIEWPOINT_GROUP_ID;
    }
  );

  const setSelectedGroupId = React.useCallback(
    (groupId: string) => {
      setSelectedGroupIdState(groupId);
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedViewpointGroupId", groupId);
        // Revalidate all SWR cache entries to refresh data with new group
        // This will trigger all useSWR hooks to revalidate with the new groupId
        mutate(
          (key) => {
            // Revalidate all keys that contain the old groupId or are dashboard data keys
            return (
              typeof key === "string" &&
              (key.startsWith("summary-") ||
                key.startsWith("time-series-") ||
                key.startsWith("jurisdictions-") ||
                key.startsWith("elections-"))
            );
          },
          undefined,
          { revalidate: true }
        );
      }
    },
    [mutate]
  );

  return (
    <ViewpointGroupContext.Provider
      value={{ selectedGroupId, setSelectedGroupId }}
    >
      {children}
    </ViewpointGroupContext.Provider>
  );
}

export function useViewpointGroup() {
  const context = React.useContext(ViewpointGroupContext);
  if (context === undefined) {
    throw new Error(
      "useViewpointGroup must be used within a ViewpointGroupProvider"
    );
  }
  return context;
}
