-- Performance indexes for election-related queries
-- These indexes optimize election queries and ballot item lookups

-- Composite index for election date queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_elections_poll_date 
ON elections(poll_date);

-- Index for ballot items by election (most common join)
CREATE INDEX IF NOT EXISTS idx_ballot_items_election_id 
ON ballot_items(election_id);

-- Composite index for ballot items by election and jurisdiction
CREATE INDEX IF NOT EXISTS idx_ballot_items_election_jurisdiction 
ON ballot_items(election_id, jurisdiction_id);

-- Index for races by ballot item
CREATE INDEX IF NOT EXISTS idx_races_ballot_item_id 
ON races(ballot_item_id);

-- Index for measures by ballot item
CREATE INDEX IF NOT EXISTS idx_measures_ballot_item_id 
ON measures(ballot_item_id);

-- Index for races by influence target (for influence score calculations)
CREATE INDEX IF NOT EXISTS idx_races_influence_target_id 
ON races(influence_target_id);

-- Index for measures by influence target
CREATE INDEX IF NOT EXISTS idx_measures_influence_target_id 
ON measures(influence_target_id);

-- Index for office terms by office (for race details)
CREATE INDEX IF NOT EXISTS idx_office_terms_office_id 
ON office_terms(office_id);

-- Index for candidacies by race (for race details)
CREATE INDEX IF NOT EXISTS idx_candidacies_race_id 
ON candidacies(race_id);

-- Composite index for candidacies with person and party lookups
CREATE INDEX IF NOT EXISTS idx_candidacies_race_person_party 
ON candidacies(race_id, candidate_id, party_id);

-- Index for influence target viewpoint group relations (for influence scores)
CREATE INDEX IF NOT EXISTS idx_influence_target_viewpoint_group_rels_target 
ON influence_target_viewpoint_group_rels(influence_target_id);

-- Composite index for influence target viewpoint group relations
CREATE INDEX IF NOT EXISTS idx_influence_target_viewpoint_group_rels_composite 
ON influence_target_viewpoint_group_rels(influence_target_id, viewpoint_group_id);

