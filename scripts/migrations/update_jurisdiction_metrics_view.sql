-- Migration: Update mv_jurisdiction_metrics with new actionable metrics
-- This migration drops and recreates the materialized view with:
-- - 90-day active metrics (in addition to 30-day)
-- - Upcoming elections, ballot items, and races counts
-- - Engagement score calculation
-- - Improved estimated turnout logic

-- Drop the existing materialized view (will be recreated with new structure)
DROP MATERIALIZED VIEW IF EXISTS mv_jurisdiction_metrics CASCADE;

-- Recreate with updated structure (see create_materialized_views.sql for full definition)
-- Note: The full CREATE statement is in create_materialized_views.sql
-- This migration file is for tracking the change

-- After running this migration, refresh the view:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_jurisdiction_metrics;

