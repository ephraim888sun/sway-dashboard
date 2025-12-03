-- Grant SELECT permissions on materialized views to anon role
-- This allows client-side queries to access aggregated data

-- Grant access to materialized views
GRANT SELECT ON mv_supporters_by_jurisdiction TO anon;
GRANT SELECT ON mv_jurisdiction_metrics TO anon;
GRANT SELECT ON mv_time_series_supporters TO anon;
GRANT SELECT ON mv_election_influence_summary TO anon;

-- Grant access to underlying tables needed for queries
GRANT SELECT ON viewpoint_groups TO anon;
GRANT SELECT ON profile_viewpoint_group_rels TO anon;
GRANT SELECT ON jurisdictions TO anon;
GRANT SELECT ON elections TO anon;
GRANT SELECT ON ballot_items TO anon;
GRANT SELECT ON races TO anon;
GRANT SELECT ON measures TO anon;
GRANT SELECT ON office_terms TO anon;
GRANT SELECT ON offices TO anon;
GRANT SELECT ON candidacies TO anon;
GRANT SELECT ON persons TO anon;
GRANT SELECT ON parties TO anon;
GRANT SELECT ON influence_target_viewpoint_group_rels TO anon;
GRANT SELECT ON voter_verification_jurisdiction_rels TO anon;
GRANT SELECT ON voter_verifications TO anon;
GRANT SELECT ON profiles TO anon;

