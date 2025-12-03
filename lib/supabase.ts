import { createClient } from "@supabase/supabase-js";
import { LEADER_VIEWPOINT_GROUP_ID } from "./constants";

// Re-export for backward compatibility
export { LEADER_VIEWPOINT_GROUP_ID };

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
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "sway-dashboard",
      },
      // Add fetch options for better SSL handling
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Increase timeout for slow queries
          signal: options.signal || AbortSignal.timeout(60000), // 60 second timeout
        });
      },
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
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "x-client-info": "sway-dashboard",
      },
    },
  });
};

// Lazy getter for server client (only created when needed)
let _supabase: ReturnType<typeof createServerClient> | null = null;
export const getSupabase = () => {
  if (!_supabase) {
    _supabase = createServerClient();
  }
  return _supabase;
};
