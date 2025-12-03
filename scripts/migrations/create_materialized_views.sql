-- Materialized Views for Performance Optimization
-- These views pre-compute expensive aggregations to dramatically improve query performance

-- 1. Materialized view for supporters by jurisdiction
-- Pre-computes the mapping of supporters to jurisdictions with metadata
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_supporters_by_jurisdiction AS
SELECT 
  vvjr.jurisdiction_id,
  pvg.profile_id,
  pvg.viewpoint_group_id,
  pvg.created_at,
  pvg.type
FROM profile_viewpoint_group_rels pvg
INNER JOIN profiles p ON p.id = pvg.profile_id
INNER JOIN persons per ON per.id = p.person_id
INNER JOIN voter_verifications vv ON vv.person_id = per.id
INNER JOIN voter_verification_jurisdiction_rels vvjr ON vvjr.voter_verification_id = vv.id
WHERE pvg.type = 'supporter';

-- Index for fast lookups by jurisdiction and viewpoint group
CREATE INDEX IF NOT EXISTS idx_mv_supporters_jurisdiction_viewpoint 
ON mv_supporters_by_jurisdiction(jurisdiction_id, viewpoint_group_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_mv_supporters_created_at 
ON mv_supporters_by_jurisdiction(created_at);

-- Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_mv_supporters_profile_id 
ON mv_supporters_by_jurisdiction(profile_id);

-- 2. Materialized view for jurisdiction metrics
-- Pre-computes jurisdiction-level aggregations (counts, growth rates, active rates)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_jurisdiction_metrics AS
WITH supporter_stats AS (
  SELECT 
    jurisdiction_id,
    viewpoint_group_id,
    COUNT(DISTINCT profile_id) as supporter_count,
    -- 30-day metrics (kept for backward compatibility)
    COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '30 days' 
      THEN profile_id 
    END) as active_supporter_count,
    COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '30 days' 
      THEN profile_id 
    END)::numeric / NULLIF(COUNT(DISTINCT profile_id), 0) * 100 as active_rate,
    COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '30 days' 
      THEN profile_id 
    END) as recent_supporters,
    COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '30 days' 
      THEN profile_id 
    END) as previous_count,
    CASE 
      WHEN COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '30 days' 
        THEN profile_id 
      END) > 0 
      THEN COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '30 days' 
        THEN profile_id 
      END)::numeric / NULLIF(
        COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
          WHEN created_at >= NOW() - INTERVAL '30 days' 
          THEN profile_id 
        END), 
        0
      ) * 100
      WHEN COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '30 days' 
        THEN profile_id 
      END) > 0 
      THEN 100
      ELSE 0
    END as growth_30d,
    -- 90-day metrics (more relevant given data distribution)
    COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '90 days' 
      THEN profile_id 
    END) as active_supporter_count_90d,
    COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
      WHEN created_at >= NOW() - INTERVAL '90 days' 
      THEN profile_id 
    END) as previous_count_90d,
    CASE 
      WHEN COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '90 days' 
        THEN profile_id 
      END) > 0 
      THEN COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '90 days' 
        THEN profile_id 
      END)::numeric / NULLIF(
        COUNT(DISTINCT profile_id) - COUNT(DISTINCT CASE 
          WHEN created_at >= NOW() - INTERVAL '90 days' 
          THEN profile_id 
        END), 
        0
      ) * 100
      WHEN COUNT(DISTINCT CASE 
        WHEN created_at >= NOW() - INTERVAL '90 days' 
        THEN profile_id 
      END) > 0 
      THEN 100
      ELSE 0
    END as growth_90d
  FROM mv_supporters_by_jurisdiction
  GROUP BY jurisdiction_id, viewpoint_group_id
),
jurisdiction_turnout AS (
  SELECT 
    id as jurisdiction_id,
    name,
    level,
    -- Improved turnout estimates: use name patterns when level is NULL
    CASE 
      WHEN level = 'country' THEN 150000000
      WHEN level = 'state' THEN 5000000
      WHEN level = 'county' THEN 500000
      WHEN level = 'city' THEN 50000
      WHEN level = 'district' THEN 10000
      -- Try to infer from name patterns for NULL levels
      WHEN level IS NULL AND (
        name IN ('California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa', 'Nevada', 'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'West Virginia', 'Idaho', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island', 'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming')
      ) THEN 5000000
      WHEN level IS NULL AND name ~ '^[A-Z][a-z]+ (County|Parish)$' THEN 500000
      WHEN level IS NULL AND name ~ '^[A-Z][a-z]+$' AND LENGTH(name) > 3 THEN 100000
      ELSE 10000
    END as estimated_turnout
  FROM jurisdictions
),
upcoming_elections_stats AS (
  SELECT 
    bi.jurisdiction_id,
    COUNT(DISTINCT e.id) as upcoming_elections_count,
    COUNT(DISTINCT bi.id) as upcoming_ballot_items_count,
    COUNT(DISTINCT r.id) as upcoming_races_count
  FROM ballot_items bi
  INNER JOIN elections e ON e.id = bi.election_id
  LEFT JOIN races r ON r.ballot_item_id = bi.id
  WHERE e.poll_date >= CURRENT_DATE
    AND bi.jurisdiction_id IS NOT NULL
  GROUP BY bi.jurisdiction_id
)
SELECT 
  ss.jurisdiction_id,
  ss.viewpoint_group_id,
  jt.name,
  jt.level,
  ss.supporter_count,
  ss.active_supporter_count,
  ss.active_rate,
  ss.growth_30d,
  ss.active_supporter_count_90d,
  ss.growth_90d,
  jt.estimated_turnout,
  CASE 
    WHEN jt.estimated_turnout > 0 
    THEN (ss.supporter_count::numeric / jt.estimated_turnout) * 100
    ELSE NULL
  END as supporter_share,
  COALESCE(ues.upcoming_elections_count, 0) as upcoming_elections_count,
  COALESCE(ues.upcoming_ballot_items_count, 0) as upcoming_ballot_items_count,
  COALESCE(ues.upcoming_races_count, 0) as upcoming_races_count,
  -- Engagement score: combines supporter presence with actionable opportunities
  -- Formula: (supporter_count * 0.3) + (upcoming_elections_count * 20) + (upcoming_races_count * 5)
  -- This prioritizes jurisdictions with both supporters and upcoming elections
  (
    (ss.supporter_count * 0.3) + 
    (COALESCE(ues.upcoming_elections_count, 0) * 20) + 
    (COALESCE(ues.upcoming_races_count, 0) * 5)
  )::numeric as engagement_score
FROM supporter_stats ss
INNER JOIN jurisdiction_turnout jt ON jt.jurisdiction_id = ss.jurisdiction_id
LEFT JOIN upcoming_elections_stats ues ON ues.jurisdiction_id = ss.jurisdiction_id;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mv_jurisdiction_metrics_jurisdiction_viewpoint 
ON mv_jurisdiction_metrics(jurisdiction_id, viewpoint_group_id);

-- 3. Materialized view for time series supporter growth
-- Pre-computes time series data for supporter growth (weekly/monthly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_time_series_supporters AS
WITH daily_counts AS (
  SELECT 
    DATE_TRUNC('day', created_at) as date,
    viewpoint_group_id,
    COUNT(*) as new_supporters
  FROM mv_supporters_by_jurisdiction
  WHERE created_at IS NOT NULL
  GROUP BY DATE_TRUNC('day', created_at), viewpoint_group_id
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

-- Index for time series queries
CREATE INDEX IF NOT EXISTS idx_mv_time_series_viewpoint_period 
ON mv_time_series_supporters(viewpoint_group_id, period_type, period);

-- 4. Materialized view for election influence summary
-- Pre-computes election-level supporter counts and influence metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_election_influence_summary AS
WITH election_jurisdictions AS (
  SELECT DISTINCT
    e.id as election_id,
    bi.jurisdiction_id
  FROM elections e
  INNER JOIN ballot_items bi ON bi.election_id = e.id
  WHERE bi.jurisdiction_id IS NOT NULL
),
election_supporter_counts AS (
  SELECT 
    ej.election_id,
    msbj.viewpoint_group_id,
    COUNT(DISTINCT msbj.profile_id) as supporters_in_scope
  FROM election_jurisdictions ej
  INNER JOIN mv_supporters_by_jurisdiction msbj 
    ON msbj.jurisdiction_id = ej.jurisdiction_id
  GROUP BY ej.election_id, msbj.viewpoint_group_id
),
election_turnout_estimates AS (
  SELECT 
    ej.election_id,
    COUNT(DISTINCT ej.jurisdiction_id) * 10000 as estimated_turnout
  FROM election_jurisdictions ej
  GROUP BY ej.election_id
)
SELECT 
  esc.election_id,
  esc.viewpoint_group_id,
  esc.supporters_in_scope,
  ete.estimated_turnout,
  CASE 
    WHEN ete.estimated_turnout > 0 
    THEN (esc.supporters_in_scope::numeric / ete.estimated_turnout) * 100
    ELSE NULL
  END as supporter_share_in_scope
FROM election_supporter_counts esc
INNER JOIN election_turnout_estimates ete ON ete.election_id = esc.election_id;

-- Index for election queries
CREATE INDEX IF NOT EXISTS idx_mv_election_influence_election_viewpoint 
ON mv_election_influence_summary(election_id, viewpoint_group_id);

-- Grant permissions (adjust as needed for your RLS policies)
GRANT SELECT ON mv_supporters_by_jurisdiction TO authenticated;
GRANT SELECT ON mv_jurisdiction_metrics TO authenticated;
GRANT SELECT ON mv_time_series_supporters TO authenticated;
GRANT SELECT ON mv_election_influence_summary TO authenticated;

