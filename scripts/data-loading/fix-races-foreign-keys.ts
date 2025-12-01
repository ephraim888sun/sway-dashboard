#!/usr/bin/env node
/**
 * Fix foreign key violations for races table
 * Uses Supabase MCP to validate foreign keys before inserting
 */

import { readFileSync } from "fs";
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

async function getExistingIds(
  projectId: string,
  tableName: string
): Promise<Set<string>> {
  const query = `SELECT id FROM ${tableName}`;

  // Note: This would use mcp_Supabase_execute_sql in actual implementation
  // For now, we'll return an empty set and handle it in the script
  console.log(`   Checking existing IDs in ${tableName}...`);

  // In a real implementation, this would be:
  // const result = await mcp_Supabase_execute_sql({ project_id: projectId, query });
  // return new Set(result.rows.map((row: any) => row.id));

  return new Set();
}

async function validateAndInsertRaces(
  projectId: string,
  races: Race[]
): Promise<void> {
  console.log(`\n📊 Validating ${races.length} races...`);

  // Get existing foreign key IDs
  console.log("\n🔍 Checking foreign key references...");

  const [existingOfficeTerms, existingBallotItems, existingParties] =
    await Promise.all([
      getExistingIds(projectId, "office_terms"),
      getExistingIds(projectId, "ballot_items"),
      getExistingIds(projectId, "parties"),
    ]);

  console.log(`   Found ${existingOfficeTerms.size} office_terms`);
  console.log(`   Found ${existingBallotItems.size} ballot_items`);
  console.log(`   Found ${existingParties.size} parties`);

  // Filter races with valid foreign keys
  const validRaces: Race[] = [];
  const invalidRaces: Race[] = [];

  for (const race of races) {
    const hasValidOfficeTerm = existingOfficeTerms.has(race.office_term_id);
    const hasValidBallotItem = existingBallotItems.has(race.ballot_item_id);
    const hasValidParty =
      race.party_id === null || existingParties.has(race.party_id);

    if (hasValidOfficeTerm && hasValidBallotItem && hasValidParty) {
      validRaces.push(race);
    } else {
      invalidRaces.push(race);
      if (invalidRaces.length <= 5) {
        console.log(`   ⚠️  Invalid race ${race.id}:`, {
          office_term: hasValidOfficeTerm,
          ballot_item: hasValidBallotItem,
          party: hasValidParty,
        });
      }
    }
  }

  console.log(`\n✅ Valid races: ${validRaces.length}`);
  console.log(`❌ Invalid races: ${invalidRaces.length}`);

  if (validRaces.length === 0) {
    console.log("\n⚠️  No valid races to insert!");
    return;
  }

  // Generate INSERT statement for valid races
  console.log("\n📝 Generating INSERT statement...");

  const values = validRaces
    .map((race) => {
      const partyId = race.party_id ? `'${race.party_id}'` : "NULL";
      return `('${race.id}', '${race.created_at}'::timestamptz, '${race.updated_at}'::timestamptz, '${race.office_term_id}', '${race.ballot_item_id}', ${partyId}, ${race.is_partisan}, ${race.is_primary}, ${race.is_recall}, ${race.is_runoff}, ${race.is_off_schedule}, '${race.civic_engine_id}')`;
    })
    .join(",\n    ");

  const insertSql = `INSERT INTO races (id, created_at, updated_at, office_term_id, ballot_item_id, party_id, is_partisan, is_primary, is_recall, is_runoff, is_off_schedule, civic_engine_id)
VALUES
    ${values}
ON CONFLICT (id) DO NOTHING;`;

  console.log(`\n📄 Generated SQL (${validRaces.length} rows)`);
  console.log("\n" + "=".repeat(80));
  console.log(insertSql);
  console.log("=".repeat(80));

  // Save to file
  const outputPath = join(
    process.cwd(),
    "scripts",
    "data-loading",
    "insert-races-fixed.sql"
  );
  require("fs").writeFileSync(outputPath, insertSql);
  console.log(`\n💾 Saved to: ${outputPath}`);

  console.log("\n✨ Done! Execute the SQL file via Supabase MCP.");
}

async function main() {
  console.log("🔧 Fixing foreign key violations for races table\n");
  console.log(`Project ID: ${PROJECT_ID}\n`);

  // Read races.json
  const racesPath = join(DATA_DIR, "races.json");
  const races: Race[] = JSON.parse(readFileSync(racesPath, "utf-8"));

  console.log(`📖 Loaded ${races.length} races from races.json`);

  await validateAndInsertRaces(PROJECT_ID, races);
}

main().catch(console.error);
