-- Performance indexes for jurisdictions query optimization
-- These indexes optimize the getSupportersByJurisdiction query path

-- Composite index for filtering supporters by viewpoint group and type
-- This is the primary filter in getSupportersByJurisdiction
CREATE INDEX IF NOT EXISTS idx_profile_viewpoint_group_rels_viewpoint_type 
ON profile_viewpoint_group_rels(viewpoint_group_id, type);

-- Index on profiles.person_id for joins (if not already exists)
-- Note: The performance advisor shows idx_profiles_person_id exists but is unused
-- We'll keep it as it's needed for the join chain
CREATE INDEX IF NOT EXISTS idx_profiles_person_id 
ON profiles(person_id);

-- Index on voter_verifications.person_id for joins
-- Note: There's a duplicate index warning, but we need this for the query
CREATE INDEX IF NOT EXISTS idx_voter_verifications_person_id 
ON voter_verifications(person_id);

-- Composite index for the join between voter_verifications and jurisdictions
-- This optimizes the lookup of jurisdiction_ids for voter_verification_ids
CREATE INDEX IF NOT EXISTS idx_voter_verification_jurisdiction_rels_vv_jurisdiction 
ON voter_verification_jurisdiction_rels(voter_verification_id, jurisdiction_id);

-- Index on jurisdiction_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_voter_verification_jurisdiction_rels_jurisdiction_id 
ON voter_verification_jurisdiction_rels(jurisdiction_id);

-- Index on profile_viewpoint_group_rels.created_at for time-based filtering
-- Used in growth calculations
CREATE INDEX IF NOT EXISTS idx_profile_viewpoint_group_rels_created_at 
ON profile_viewpoint_group_rels(created_at);

-- Index on profile_viewpoint_group_rels.profile_id for lookups
CREATE INDEX IF NOT EXISTS idx_profile_viewpoint_group_rels_profile_id 
ON profile_viewpoint_group_rels(profile_id);

