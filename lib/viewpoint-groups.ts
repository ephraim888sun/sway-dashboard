import { getSupabase } from "./supabase";

export interface ViewpointGroup {
  id: string;
  title: string | null;
  description: string | null;
  created_at: string | null;
  is_public: boolean | null;
  is_searchable: boolean | null;
}

/**
 * Get all viewpoint groups
 */
export async function getAllViewpointGroups(): Promise<ViewpointGroup[]> {
  try {
    const { data, error } = await getSupabase()
      .from("viewpoint_groups")
      .select("id, title, description, created_at, is_public, is_searchable")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching viewpoint groups:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllViewpointGroups:", error);
    return [];
  }
}

/**
 * Get a specific viewpoint group by ID
 */
export async function getViewpointGroupById(
  id: string
): Promise<ViewpointGroup | null> {
  try {
    const { data, error } = await getSupabase()
      .from("viewpoint_groups")
      .select("id, title, description, created_at, is_public, is_searchable")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching viewpoint group:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getViewpointGroupById:", error);
    return null;
  }
}
