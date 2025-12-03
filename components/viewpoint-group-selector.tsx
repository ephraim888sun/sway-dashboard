"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ViewpointGroup } from "@/lib/viewpoint-groups-client";
import { LEADER_VIEWPOINT_GROUP_ID } from "@/lib/constants";
import { IconUsers } from "@tabler/icons-react";

interface ViewpointGroupSelectorProps {
  groups: ViewpointGroup[];
  selectedGroupId?: string;
  onGroupChange?: (groupId: string) => void;
}

export function ViewpointGroupSelector({
  groups,
  selectedGroupId,
  onGroupChange,
}: ViewpointGroupSelectorProps) {
  const [selected, setSelected] = React.useState(
    selectedGroupId || LEADER_VIEWPOINT_GROUP_ID
  );

  const selectedGroup = groups.find((g) => g.id === selected);

  const handleValueChange = (value: string) => {
    setSelected(value);
    if (onGroupChange) {
      onGroupChange(value);
    }
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 px-2">
      <div className="flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
        <IconUsers className="h-3 w-3" />
        <span>Viewpoint Group</span>
      </div>
      <Select value={selected} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedGroup ? (
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">
                  {selectedGroup.title ||
                    `Group ${selectedGroup.id.slice(0, 8)}`}
                </span>
                {selectedGroup.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {selectedGroup.description}
                  </span>
                )}
              </div>
            ) : (
              "Select a group"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[280px]">
          {groups.map((group) => {
            const isLeader = group.id === LEADER_VIEWPOINT_GROUP_ID;
            const displayTitle =
              group.title || `Group ${group.id.slice(0, 8)}...`;

            return (
              <SelectItem key={group.id} value={group.id} className="py-3">
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{displayTitle}</span>
                    {isLeader && (
                      <Badge variant="default" className="text-xs">
                        Leader
                      </Badge>
                    )}
                    {group.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                  {group.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {group.description}
                    </span>
                  )}
                  {group.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Created:{" "}
                      {new Date(group.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selectedGroup && (
        <div className="px-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID:</span>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {selectedGroup.id.slice(0, 8)}...
            </code>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {selectedGroup.is_searchable && (
              <Badge variant="outline" className="text-xs">
                Searchable
              </Badge>
            )}
            {selectedGroup.is_public === false && (
              <Badge variant="outline" className="text-xs">
                Private
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
