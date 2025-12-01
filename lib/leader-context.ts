import { getSupabase } from "./supabase";
import { LEADER_VIEWPOINT_GROUP_ID } from "./constants";

// Supabase batch size limit for .in() queries
const SUPABASE_BATCH_SIZE = 100;

/**
 * Get all viewpoint group IDs in a viewpoint group's network
 * Includes the primary group and all sub-groups created by supporters who became leaders
 */
export async function getViewpointGroupNetwork(
  viewpointGroupId: string = LEADER_VIEWPOINT_GROUP_ID
): Promise<string[]> {
  const network = new Set<string>([viewpointGroupId]);

  // Find all supporters of the primary group
  const { data: supporters, error: supportersError } = await getSupabase()
    .from("profile_viewpoint_group_rels")
    .select("profile_id")
    .eq("viewpoint_group_id", viewpointGroupId)
    .eq("type", "supporter");

  if (supportersError) {
    console.error("Error fetching supporters:", supportersError);
    return [viewpointGroupId];
  }

  if (!supporters || supporters.length === 0) {
    return [viewpointGroupId];
  }

  const supporterProfileIds = supporters
    .map((s) => s.profile_id)
    .filter(Boolean);

  // If no supporter profile IDs, return just the primary group
  if (supporterProfileIds.length === 0) {
    return [viewpointGroupId];
  }

  // Find all viewpoint groups where these supporters are leaders
  // Batch queries if array is too large (Supabase limit is ~100 items)
  const allSubGroups: { viewpoint_group_id: string }[] = [];

  for (let i = 0; i < supporterProfileIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = supporterProfileIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: subGroups, error: subGroupsError } = await getSupabase()
      .from("profile_viewpoint_group_rels")
      .select("viewpoint_group_id")
      .in("profile_id", batch)
      .eq("type", "leader")
      .neq("viewpoint_group_id", viewpointGroupId);

    if (subGroupsError) {
      console.error("Error fetching sub-groups:", subGroupsError);
      continue; // Continue with other batches
    }

    if (subGroups) {
      allSubGroups.push(...subGroups);
    }
  }

  // Add all sub-group IDs to the network
  allSubGroups.forEach((sg) => {
    if (sg.viewpoint_group_id) {
      network.add(sg.viewpoint_group_id);
    }
  });

  return Array.from(network);
}

/**
 * Get viewpoint group network (backward compatibility)
 */
export async function getLeaderViewpointGroupNetwork(): Promise<string[]> {
  return getViewpointGroupNetwork(LEADER_VIEWPOINT_GROUP_ID);
}

/**
 * Get a viewpoint group's details
 */
export async function getViewpointGroup(
  viewpointGroupId: string = LEADER_VIEWPOINT_GROUP_ID
) {
  const { data, error } = await getSupabase()
    .from("viewpoint_groups")
    .select("*")
    .eq("id", viewpointGroupId)
    .single();

  if (error) {
    console.error("Error fetching leader viewpoint group:", error);
    return null;
  }

  return data;
}

/**
 * Get the leader's primary viewpoint group details (backward compatibility)
 */
export async function getLeaderViewpointGroup() {
  return getViewpointGroup(LEADER_VIEWPOINT_GROUP_ID);
}
