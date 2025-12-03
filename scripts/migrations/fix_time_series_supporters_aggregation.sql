-- Migration: Fix time series supporters aggregation to count distinct profiles
-- This fixes the issue where supporters verified in multiple jurisdictions were counted multiple times

-- Drop and recreate the materialized view with correct aggregation
DROP MATERIALIZED VIEW IF EXISTS mv_time_series_supporters;

-- Recreate with COUNT(DISTINCT profile_id) instead of COUNT(*)
CREATE MATERIALIZED VIEW mv_time_series_supporters AS
WITH daily_counts AS (
  SELECT 
    DATE_TRUNC('day', created_at) as date,
    viewpoint_group_id,
    COUNT(DISTINCT profile_id) as new_supporters
  FROM mv_supporters_by_jurisdiction
  WHERE created_at IS NOT NULL
  GROUP BY DATE_TRUNC('day', created_at), viewpoint_group_id
),
cumulative_daily AS (
  SELECT 
    date,
    viewpoint_group_id,
    new_supporters,
    SUM(new_supporters) OVER (
      PARTITION BY viewpoint_group_id 
      ORDER BY date 
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as cumulative_supporters
  FROM daily_counts
),
daily_with_active AS (
  SELECT 
    cd.date,
    cd.viewpoint_group_id,
    cd.new_supporters,
    cd.cumulative_supporters,
    cd.date::date as period_date,
    COUNT(DISTINCT msbj.profile_id) FILTER (
      WHERE msbj.created_at >= cd.date - INTERVAL '30 days' 
      AND msbj.created_at <= cd.date
    ) as active_supporters
  FROM cumulative_daily cd
  LEFT JOIN mv_supporters_by_jurisdiction msbj 
    ON msbj.viewpoint_group_id = cd.viewpoint_group_id
    AND msbj.created_at <= cd.date
  GROUP BY cd.date, cd.viewpoint_group_id, cd.new_supporters, cd.cumulative_supporters
),
monthly_counts AS (
  SELECT 
    DATE_TRUNC('month', date) as period,
    viewpoint_group_id,
    SUM(new_supporters) as new_supporters,
    MAX(date) as period_end
  FROM daily_counts
  GROUP BY DATE_TRUNC('month', date), viewpoint_group_id
),
weekly_counts AS (
  SELECT 
    DATE_TRUNC('week', date) as period,
    viewpoint_group_id,
    SUM(new_supporters) as new_supporters,
    MAX(date) as period_end
  FROM daily_counts
  GROUP BY DATE_TRUNC('week', date), viewpoint_group_id
),
cumulative_monthly AS (
  SELECT 
    period,
    viewpoint_group_id,
    new_supporters,
    period_end,
    SUM(new_supporters) OVER (
      PARTITION BY viewpoint_group_id 
      ORDER BY period 
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as cumulative_supporters
  FROM monthly_counts
),
cumulative_weekly AS (
  SELECT 
    period,
    viewpoint_group_id,
    new_supporters,
    period_end,
    SUM(new_supporters) OVER (
      PARTITION BY viewpoint_group_id 
      ORDER BY period 
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as cumulative_supporters
  FROM weekly_counts
),
monthly_with_active AS (
  SELECT 
    cm.period,
    cm.viewpoint_group_id,
    cm.new_supporters,
    cm.cumulative_supporters,
    cm.period_end::date as date,
    COUNT(DISTINCT msbj.profile_id) FILTER (
      WHERE msbj.created_at >= cm.period_end - INTERVAL '30 days' 
      AND msbj.created_at <= cm.period_end
    ) as active_supporters
  FROM cumulative_monthly cm
  LEFT JOIN mv_supporters_by_jurisdiction msbj 
    ON msbj.viewpoint_group_id = cm.viewpoint_group_id
    AND msbj.created_at <= cm.period_end
  GROUP BY cm.period, cm.viewpoint_group_id, cm.new_supporters, cm.cumulative_supporters, cm.period_end
),
weekly_with_active AS (
  SELECT 
    cw.period,
    cw.viewpoint_group_id,
    cw.new_supporters,
    cw.cumulative_supporters,
    cw.period_end::date as date,
    COUNT(DISTINCT msbj.profile_id) FILTER (
      WHERE msbj.created_at >= cw.period_end - INTERVAL '30 days' 
      AND msbj.created_at <= cw.period_end
    ) as active_supporters
  FROM cumulative_weekly cw
  LEFT JOIN mv_supporters_by_jurisdiction msbj 
    ON msbj.viewpoint_group_id = cw.viewpoint_group_id
    AND msbj.created_at <= cw.period_end
  GROUP BY cw.period, cw.viewpoint_group_id, cw.new_supporters, cw.cumulative_supporters, cw.period_end
)
SELECT 
  'daily' as period_type,
  TO_CHAR(period_date, 'YYYY-MM-DD') as period,
  viewpoint_group_id,
  new_supporters,
  cumulative_supporters,
  period_date as date,
  active_supporters
FROM daily_with_active

UNION ALL

SELECT 
  'monthly' as period_type,
  TO_CHAR(period, 'YYYY-MM') as period,
  viewpoint_group_id,
  new_supporters,
  cumulative_supporters,
  date,
  active_supporters
FROM monthly_with_active

UNION ALL

SELECT 
  'weekly' as period_type,
  TO_CHAR(period, 'IYYY-"W"IW') as period,
  viewpoint_group_id,
  new_supporters,
  cumulative_supporters,
  date,
  active_supporters
FROM weekly_with_active;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_mv_time_series_viewpoint_period 
ON mv_time_series_supporters(viewpoint_group_id, period_type, period);

-- Grant permissions
GRANT SELECT ON mv_time_series_supporters TO authenticated;

