-- Refresh Strategy for Materialized Views
-- These functions and setup enable automated refresh of materialized views

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  -- Refresh in dependency order
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_supporters_by_jurisdiction;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_jurisdiction_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_time_series_supporters;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_election_influence_summary;
  
  RAISE NOTICE 'All materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;

-- Note: To set up automated refresh, you can:
-- 1. Use pg_cron extension (if available in your Supabase plan):
--    SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *', 'SELECT refresh_all_materialized_views()');
--
-- 2. Use Supabase Edge Functions with a cron trigger
-- 3. Use external cron job calling Supabase API
-- 4. Use Next.js API route with revalidation webhook

-- For manual refresh, run:
-- SELECT refresh_all_materialized_views();

