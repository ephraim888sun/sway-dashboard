import { createClient } from "@supabase/supabase-js";

// Leader's primary viewpoint group ID
export const LEADER_VIEWPOINT_GROUP_ID = "4d627244-5598-4403-8704-979140ae9cac";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseAnonKey && !supabaseServiceKey) {
  console.warn("Warning: Supabase keys not found in environment variables");
}

// Server-side client (uses service role key for admin operations)
export const createServerClient = () => {
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side operations"
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Client-side client (uses anon key)
export const createClientClient = () => {
  if (!supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is required for client-side operations"
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Default server client for API routes
export const supabase = createServerClient();
