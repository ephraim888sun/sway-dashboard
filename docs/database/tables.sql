-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ballot_item_options (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ballot_item_id uuid,
  candidacy_id uuid,
  option_text text,
  option_value text,
  data jsonb,
  text text,
  CONSTRAINT ballot_item_options_pkey PRIMARY KEY (id),
  CONSTRAINT ballot_item_options_ballot_item_id_fkey FOREIGN KEY (ballot_item_id) REFERENCES public.ballot_items(id),
  CONSTRAINT ballot_item_options_candidacy_id_fkey FOREIGN KEY (candidacy_id) REFERENCES public.candidacies(id)
);
CREATE TABLE public.ballot_items (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  election_id uuid,
  jurisdiction_id uuid,
  title text,
  description text,
  data jsonb,
  is_ranked_choice boolean,
  num_selections_max integer,
  num_winners integer,
  CONSTRAINT ballot_items_pkey PRIMARY KEY (id),
  CONSTRAINT ballot_items_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id),
  CONSTRAINT ballot_items_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id)
);
CREATE TABLE public.candidacies (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  race_id uuid,
  candidate_id uuid,
  status text,
  data jsonb,
  civic_engine_id text,
  direct_embedding_id uuid,
  party_id uuid,
  is_withdrawn boolean,
  result text,
  CONSTRAINT candidacies_pkey PRIMARY KEY (id),
  CONSTRAINT candidacies_race_id_fkey FOREIGN KEY (race_id) REFERENCES public.races(id),
  CONSTRAINT candidacies_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.persons(id),
  CONSTRAINT candidacies_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.elections (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  name text,
  poll_date date,
  description text,
  jurisdiction_id uuid,
  civic_engine_id text,
  data jsonb,
  CONSTRAINT elections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.id_verifications (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  person_id uuid,
  status text,
  data jsonb,
  id_first_name text,
  id_last_name text,
  needs_manual_review boolean,
  CONSTRAINT id_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT id_verifications_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.influence_target_viewpoint_group_rels (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  influence_target_id uuid,
  viewpoint_group_id uuid,
  weight numeric,
  data jsonb,
  CONSTRAINT influence_target_viewpoint_group_rels_pkey PRIMARY KEY (id),
  CONSTRAINT influence_target_viewpoint_group_rels_influence_target_id_fkey FOREIGN KEY (influence_target_id) REFERENCES public.influence_targets(id),
  CONSTRAINT influence_target_viewpoint_group_rels_viewpoint_group_id_fkey FOREIGN KEY (viewpoint_group_id) REFERENCES public.viewpoint_groups(id)
);
CREATE TABLE public.influence_targets (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  jurisdiction_id uuid,
  name text,
  description text,
  data jsonb,
  aggregate_embedding_id uuid,
  civic_engine_id text,
  title_embedding_id uuid,
  direct_embedding_id uuid,
  CONSTRAINT influence_targets_pkey PRIMARY KEY (id),
  CONSTRAINT influence_targets_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id)
);
CREATE TABLE public.jurisdictions (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  name text,
  level text,
  parent_id uuid,
  external_id text,
  data jsonb,
  geoid text,
  ce_geofence_id text,
  ocdid text,
  valid_from date,
  valid_to date,
  state text,
  estimated_name text,
  mtfcc text,
  direct_embedding_id uuid,
  CONSTRAINT jurisdictions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.measures (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  influence_target_id uuid,
  ballot_item_id uuid,
  title text,
  summary text,
  full_text text,
  fiscal_impact text,
  data jsonb,
  civic_engine_id text,
  con_snippet text,
  name text,
  pro_snippet text,
  direct_embedding_id uuid,
  CONSTRAINT measures_pkey PRIMARY KEY (id),
  CONSTRAINT measures_influence_target_id_fkey FOREIGN KEY (influence_target_id) REFERENCES public.influence_targets(id),
  CONSTRAINT measures_ballot_item_id_fkey FOREIGN KEY (ballot_item_id) REFERENCES public.ballot_items(id)
);
CREATE TABLE public.office_terms (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  office_id uuid,
  holder_id uuid,
  start_date date,
  end_date date,
  data jsonb,
  civic_engine_id text,
  is_current boolean,
  CONSTRAINT office_terms_pkey PRIMARY KEY (id),
  CONSTRAINT office_terms_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id),
  CONSTRAINT office_terms_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES public.persons(id)
);
CREATE TABLE public.offices (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  influence_target_id uuid,
  name text,
  level text,
  district text,
  term_length integer,
  data jsonb,
  civic_engine_id text,
  direct_embedding_id uuid,
  judicial boolean,
  retention boolean,
  CONSTRAINT offices_pkey PRIMARY KEY (id),
  CONSTRAINT offices_influence_target_id_fkey FOREIGN KEY (influence_target_id) REFERENCES public.influence_targets(id)
);
CREATE TABLE public.parties (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  name text,
  abbreviation text,
  civic_engine_id text,
  CONSTRAINT parties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.persons (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  user_id uuid,
  first_name text,
  last_name text,
  middle_name text,
  suffix text,
  data jsonb,
  full_name text,
  civic_engine_id text,
  civic_engine_image text,
  direct_embedding_id uuid,
  CONSTRAINT persons_pkey PRIMARY KEY (id),
  CONSTRAINT persons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profile_user_rels (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  profile_id uuid,
  user_id uuid,
  data jsonb,
  CONSTRAINT profile_user_rels_pkey PRIMARY KEY (id),
  CONSTRAINT profile_user_rels_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_user_rels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profile_viewpoint_group_rel_types (
  value text NOT NULL,
  description text,
  CONSTRAINT profile_viewpoint_group_rel_types_pkey PRIMARY KEY (value)
);
CREATE TABLE public.profile_viewpoint_group_rels (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  profile_id uuid,
  viewpoint_group_id uuid,
  type text,
  data jsonb,
  is_public boolean,
  CONSTRAINT profile_viewpoint_group_rels_pkey PRIMARY KEY (id),
  CONSTRAINT profile_viewpoint_group_rels_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_viewpoint_group_rels_viewpoint_group_id_fkey FOREIGN KEY (viewpoint_group_id) REFERENCES public.viewpoint_groups(id),
  CONSTRAINT profile_viewpoint_group_rels_type_fkey FOREIGN KEY (type) REFERENCES public.profile_viewpoint_group_rel_types(value)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  person_id uuid,
  display_name text,
  bio text,
  data jsonb,
  display_name_long text,
  avatar_media_id uuid,
  display_name_short text,
  extended_bio text,
  header_image_id uuid,
  profile_type text,
  location text,
  is_disabled boolean,
  is_id_verified boolean,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.races (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ballot_item_id uuid,
  office_term_id uuid,
  party_id uuid,
  data jsonb,
  civic_engine_id text,
  is_off_schedule boolean,
  is_partisan boolean,
  is_primary boolean,
  is_recall boolean,
  is_runoff boolean,
  CONSTRAINT races_pkey PRIMARY KEY (id),
  CONSTRAINT races_ballot_item_id_fkey FOREIGN KEY (ballot_item_id) REFERENCES public.ballot_items(id),
  CONSTRAINT races_office_term_id_fkey FOREIGN KEY (office_term_id) REFERENCES public.office_terms(id),
  CONSTRAINT races_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.slugs (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  slug text,
  is_current boolean,
  viewpoint_group_id uuid,
  direct_embedding_id uuid,
  CONSTRAINT slugs_pkey PRIMARY KEY (id),
  CONSTRAINT slugs_viewpoint_group_id_fkey FOREIGN KEY (viewpoint_group_id) REFERENCES public.viewpoint_groups(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email text,
  data jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.viewpoint_groups (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  title text,
  description text,
  current_slug_id uuid,
  influence_target_notes text,
  is_searchable boolean,
  is_public boolean,
  direct_embedding_id uuid,
  aggregate_embedding_id uuid,
  title_embedding_id uuid,
  CONSTRAINT viewpoint_groups_pkey PRIMARY KEY (id),
  CONSTRAINT viewpoint_groups_current_slug_id_fkey FOREIGN KEY (current_slug_id) REFERENCES public.slugs(id)
);
CREATE TABLE public.voter_verification_jurisdiction_rels (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  voter_verification_id uuid,
  jurisdiction_id uuid,
  data jsonb,
  CONSTRAINT voter_verification_jurisdiction_rels_pkey PRIMARY KEY (id),
  CONSTRAINT voter_verification_jurisdiction_rels_voter_verification_id_fkey FOREIGN KEY (voter_verification_id) REFERENCES public.voter_verifications(id),
  CONSTRAINT voter_verification_jurisdiction_rels_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id)
);
CREATE TABLE public.voter_verifications (
  id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  person_id uuid,
  id_verification_id uuid,
  status text,
  data jsonb,
  has_confirmed_voted boolean,
  id_match_needs_manual_review boolean,
  needs_manual_review boolean,
  is_fully_verified boolean,
  vv_first_name text,
  vv_last_name text,
  CONSTRAINT voter_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT voter_verifications_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id),
  CONSTRAINT voter_verifications_id_verification_id_fkey FOREIGN KEY (id_verification_id) REFERENCES public.id_verifications(id)
);