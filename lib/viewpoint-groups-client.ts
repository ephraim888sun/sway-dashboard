"use client";

import { createClientClient } from "./supabase";

export interface ViewpointGroup {
  id: string;
  title: string | null;
  description: string | null;
  created_at: string | null;
  is_public: boolean | null;
  is_searchable: boolean | null;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))
    );
    return retryWithBackoff(fn, retries - 1);
  }
}

/**
 * Get all viewpoint groups (client-side version)
 */
export async function getAllViewpointGroupsClient(): Promise<ViewpointGroup[]> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const { data, error } = await supabase
      .from("viewpoint_groups")
      .select("id, title, description, created_at, is_public, is_searchable")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching viewpoint groups:", error);
      throw error;
    }

    return data || [];
  });
}

/**
 * Get a specific viewpoint group by ID (client-side version)
 */
export async function getViewpointGroupByIdClient(
  id: string
): Promise<ViewpointGroup | null> {
  return retryWithBackoff(async () => {
    const supabase = createClientClient();
    const { data, error } = await supabase
      .from("viewpoint_groups")
      .select("id, title, description, created_at, is_public, is_searchable")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching viewpoint group:", error);
      return null;
    }

    return data;
  });
}
