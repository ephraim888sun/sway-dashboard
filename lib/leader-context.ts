import { supabase, LEADER_VIEWPOINT_GROUP_ID } from "./supabase";

// Supabase batch size limit for .in() queries
const SUPABASE_BATCH_SIZE = 100;

/**
 * Get all viewpoint group IDs in the leader's network
 * Includes the primary group and all sub-groups created by supporters who became leaders
 */
export async function getLeaderViewpointGroupNetwork(): Promise<string[]> {
  const network = new Set<string>([LEADER_VIEWPOINT_GROUP_ID]);

  // Find all supporters of the leader's primary group
  const { data: supporters, error: supportersError } = await supabase
    .from("profile_viewpoint_group_rels")
    .select("profile_id")
    .eq("viewpoint_group_id", LEADER_VIEWPOINT_GROUP_ID)
    .eq("type", "supporter");

  if (supportersError) {
    console.error("Error fetching supporters:", supportersError);
    return [LEADER_VIEWPOINT_GROUP_ID];
  }

  if (!supporters || supporters.length === 0) {
    return [LEADER_VIEWPOINT_GROUP_ID];
  }

  const supporterProfileIds = supporters
    .map((s) => s.profile_id)
    .filter(Boolean);

  // If no supporter profile IDs, return just the primary group
  if (supporterProfileIds.length === 0) {
    return [LEADER_VIEWPOINT_GROUP_ID];
  }

  // Find all viewpoint groups where these supporters are leaders
  // Batch queries if array is too large (Supabase limit is ~100 items)
  const allSubGroups: { viewpoint_group_id: string }[] = [];

  for (let i = 0; i < supporterProfileIds.length; i += SUPABASE_BATCH_SIZE) {
    const batch = supporterProfileIds.slice(i, i + SUPABASE_BATCH_SIZE);
    const { data: subGroups, error: subGroupsError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("viewpoint_group_id")
      .in("profile_id", batch)
      .eq("type", "leader")
      .neq("viewpoint_group_id", LEADER_VIEWPOINT_GROUP_ID);

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
 * Get the leader's primary viewpoint group details
 */
export async function getLeaderViewpointGroup() {
  const { data, error } = await supabase
    .from("viewpoint_groups")
    .select("*")
    .eq("id", LEADER_VIEWPOINT_GROUP_ID)
    .single();

  if (error) {
    console.error("Error fetching leader viewpoint group:", error);
    return null;
  }

  return data;
}
