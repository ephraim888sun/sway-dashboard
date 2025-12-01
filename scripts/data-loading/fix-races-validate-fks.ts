#!/usr/bin/env node
/**
 * Validate and fix foreign key violations for races table using Supabase MCP
 * This script identifies missing foreign keys and filters out invalid races
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const PROJECT_ID = "wfnvjaobqsvxhpuxrysg";

interface Race {
  id: string;
  created_at: string;
  updated_at: string;
  office_term_id: string;
  ballot_item_id: string;
  party_id: string | null;
  is_partisan: boolean;
  is_primary: boolean;
  is_recall: boolean;
  is_runoff: boolean;
  is_off_schedule: boolean;
  civic_engine_id: string;
}

async function main() {
  console.log("🔧 Validating foreign keys for races table\n");
  console.log(`Project ID: ${PROJECT_ID}\n`);

  // Read races.json
  const racesPath = join(DATA_DIR, "races.json");
  const races: Race[] = JSON.parse(readFileSync(racesPath, "utf-8"));

  console.log(`📖 Loaded ${races.length} races from races.json`);

  // Extract unique foreign key IDs
  const officeTermIds = Array.from(new Set(races.map((r) => r.office_term_id)));
  const ballotItemIds = Array.from(new Set(races.map((r) => r.ballot_item_id)));
  const partyIds = Array.from(
    new Set(races.map((r) => r.party_id).filter(Boolean))
  );

  console.log(`\n📊 Foreign key analysis:`);
  console.log(`   Unique office_term_ids: ${officeTermIds.length}`);
  console.log(`   Unique ballot_item_ids: ${ballotItemIds.length}`);
  console.log(`   Unique party_ids: ${partyIds.length}`);

  // Generate SQL to check which IDs exist
  // We'll create a temporary table approach since we have many IDs
  console.log("\n🔍 Generating validation SQL...");

  // Create SQL that validates foreign keys using a temporary table
  const validationSQL = `
-- Create temporary table with all required foreign key IDs
CREATE TEMP TABLE temp_race_fk_validation AS
SELECT DISTINCT
  r.office_term_id,
  r.ballot_item_id,
  r.party_id
FROM (VALUES
${races
  .map(
    (r) =>
      `  ('${r.office_term_id}'::uuid, '${r.ballot_item_id}'::uuid, ${
        r.party_id ? `'${r.party_id}'::uuid` : "NULL::uuid"
      })`
  )
  .join(",\n")}
) AS r(office_term_id, ballot_item_id, party_id);

-- Check which foreign keys exist
SELECT 
  'office_term_id' AS fk_column,
  COUNT(DISTINCT t.office_term_id) AS total_required,
  COUNT(DISTINCT ot.id) AS existing_count,
  COUNT(DISTINCT t.office_term_id) - COUNT(DISTINCT ot.id) AS missing_count
FROM temp_race_fk_validation t
LEFT JOIN office_terms ot ON t.office_term_id = ot.id
UNION ALL
SELECT 
  'ballot_item_id' AS fk_column,
  COUNT(DISTINCT t.ballot_item_id) AS total_required,
  COUNT(DISTINCT bi.id) AS existing_count,
  COUNT(DISTINCT t.ballot_item_id) - COUNT(DISTINCT bi.id) AS missing_count
FROM temp_race_fk_validation t
LEFT JOIN ballot_items bi ON t.ballot_item_id = bi.id
UNION ALL
SELECT 
  'party_id' AS fk_column,
  COUNT(DISTINCT t.party_id) AS total_required,
  COUNT(DISTINCT p.id) AS existing_count,
  COUNT(DISTINCT t.party_id) - COUNT(DISTINCT p.id) AS missing_count
FROM temp_race_fk_validation t
LEFT JOIN parties p ON t.party_id = p.id
WHERE t.party_id IS NOT NULL;

-- Find valid races (all foreign keys exist)
CREATE TEMP TABLE temp_valid_races AS
SELECT DISTINCT r.*
FROM (VALUES
${races
  .map(
    (r) =>
      `  ('${r.id}'::uuid, '${r.office_term_id}'::uuid, '${
        r.ballot_item_id
      }'::uuid, ${r.party_id ? `'${r.party_id}'::uuid` : "NULL::uuid"})`
  )
  .join(",\n")}
) AS r(race_id, office_term_id, ballot_item_id, party_id)
WHERE EXISTS (SELECT 1 FROM office_terms ot WHERE ot.id = r.office_term_id)
  AND EXISTS (SELECT 1 FROM ballot_items bi WHERE bi.id = r.ballot_item_id)
  AND (r.party_id IS NULL OR EXISTS (SELECT 1 FROM parties p WHERE p.id = r.party_id));

-- Show summary
SELECT COUNT(*) AS valid_races_count FROM temp_valid_races;
`;

  // Save validation SQL
  const validationPath = join(
    process.cwd(),
    "scripts",
    "data-loading",
    "validate-races-fks.sql"
  );
  writeFileSync(validationPath, validationSQL);
  console.log(`\n💾 Saved validation SQL to: ${validationPath}`);

  // Generate a simpler approach: filter races using a SQL query
  // that checks foreign keys exist before inserting
  console.log("\n📝 Generating filtered INSERT statement...");

  // Create a SQL that inserts only valid races
  // We'll use a subquery to filter out invalid foreign keys
  const insertSQL = `-- Insert only races with valid foreign keys
-- This query filters out races where foreign keys don't exist

INSERT INTO races (id, created_at, updated_at, office_term_id, ballot_item_id, party_id, is_partisan, is_primary, is_recall, is_runoff, is_off_schedule, civic_engine_id)
SELECT 
  r.id,
  r.created_at::timestamptz,
  r.updated_at::timestamptz,
  r.office_term_id,
  r.ballot_item_id,
  r.party_id,
  r.is_partisan,
  r.is_primary,
  r.is_recall,
  r.is_runoff,
  r.is_off_schedule,
  r.civic_engine_id
FROM (VALUES
${races
  .map((r) => {
    const partyId = r.party_id ? `'${r.party_id}'` : "NULL";
    return `  ('${r.id}', '${r.created_at}', '${r.updated_at}', '${r.office_term_id}', '${r.ballot_item_id}', ${partyId}, ${r.is_partisan}, ${r.is_primary}, ${r.is_recall}, ${r.is_runoff}, ${r.is_off_schedule}, '${r.civic_engine_id}')`;
  })
  .join(",\n")}
) AS r(id, created_at, updated_at, office_term_id, ballot_item_id, party_id, is_partisan, is_primary, is_recall, is_runoff, is_off_schedule, civic_engine_id)
WHERE EXISTS (SELECT 1 FROM office_terms ot WHERE ot.id = r.office_term_id::uuid)
  AND EXISTS (SELECT 1 FROM ballot_items bi WHERE bi.id = r.ballot_item_id::uuid)
  AND (r.party_id IS NULL OR EXISTS (SELECT 1 FROM parties p WHERE p.id = r.party_id::uuid))
ON CONFLICT (id) DO NOTHING;`;

  // Save filtered insert SQL
  const insertPath = join(
    process.cwd(),
    "scripts",
    "data-loading",
    "insert-races-filtered.sql"
  );
  writeFileSync(insertPath, insertSQL);
  console.log(`💾 Saved filtered INSERT SQL to: ${insertPath}`);

  console.log("\n✨ Done!");
  console.log("\nNext steps:");
  console.log(
    "1. Review the validation SQL to see which foreign keys are missing"
  );
  console.log("2. Execute the filtered INSERT SQL via Supabase MCP");
  console.log("3. Only races with valid foreign keys will be inserted");
}

main().catch(console.error);
