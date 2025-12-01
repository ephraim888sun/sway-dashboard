#!/usr/bin/env node
/**
 * Fix foreign key violations for races table using Supabase MCP
 * This script:
 * 1. Reads races.json
 * 2. Checks which foreign key references exist in the database
 * 3. Filters out races with invalid foreign keys
 * 4. Inserts only valid races via Supabase MCP
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

// This function would be called via MCP - for now we'll simulate it
async function getExistingIds(
  projectId: string,
  tableName: string
): Promise<Set<string>> {
  const query = `SELECT id FROM ${tableName}`;
  console.log(`   Querying ${tableName}...`);
  
  // In actual implementation, this would use:
  // const result = await mcp_Supabase_execute_sql({ project_id: projectId, query });
  // return new Set(result.rows.map((row: any) => row.id));
  
  // For now, return empty set - will be populated by actual MCP call
  return new Set();
}

function generateInsertSQL(races: Race[]): string {
  if (races.length === 0) {
    return "-- No valid races to insert";
  }

  const values = races
    .map((race) => {
      const partyId = race.party_id ? `'${race.party_id}'` : "NULL";
      return `('${race.id}', '${race.created_at}'::timestamptz, '${race.updated_at}'::timestamptz, '${race.office_term_id}', '${race.ballot_item_id}', ${partyId}, ${race.is_partisan}, ${race.is_primary}, ${race.is_recall}, ${race.is_runoff}, ${race.is_off_schedule}, '${race.civic_engine_id}')`;
    })
    .join(",\n    ");

  return `INSERT INTO races (id, created_at, updated_at, office_term_id, ballot_item_id, party_id, is_partisan, is_primary, is_recall, is_runoff, is_off_schedule, civic_engine_id)
VALUES
    ${values}
ON CONFLICT (id) DO NOTHING;`;
}

async function main() {
  console.log("🔧 Fixing foreign key violations for races table\n");
  console.log(`Project ID: ${PROJECT_ID}\n`);

  // Read races.json
  const racesPath = join(DATA_DIR, "races.json");
  const races: Race[] = JSON.parse(readFileSync(racesPath, "utf-8"));

  console.log(`📖 Loaded ${races.length} races from races.json`);

  // Get existing foreign key IDs
  console.log("\n🔍 Checking foreign key references in database...");
  
  const [existingOfficeTerms, existingBallotItems, existingParties] =
    await Promise.all([
      getExistingIds(PROJECT_ID, "office_terms"),
      getExistingIds(PROJECT_ID, "ballot_items"),
      getExistingIds(PROJECT_ID, "parties"),
    ]);

  console.log(`   Found ${existingOfficeTerms.size} office_terms`);
  console.log(`   Found ${existingBallotItems.size} ballot_items`);
  console.log(`   Found ${existingParties.size} parties`);

  // Filter races with valid foreign keys
  console.log("\n🔎 Validating races...");
  
  const validRaces: Race[] = [];
  const invalidRaces: { race: Race; reasons: string[] }[] = [];

  for (const race of races) {
    const reasons: string[] = [];
    
    if (!existingOfficeTerms.has(race.office_term_id)) {
      reasons.push(`office_term_id: ${race.office_term_id}`);
    }
    if (!existingBallotItems.has(race.ballot_item_id)) {
      reasons.push(`ballot_item_id: ${race.ballot_item_id}`);
    }
    if (race.party_id !== null && !existingParties.has(race.party_id)) {
      reasons.push(`party_id: ${race.party_id}`);
    }

    if (reasons.length === 0) {
      validRaces.push(race);
    } else {
      invalidRaces.push({ race, reasons });
    }
  }

  console.log(`\n✅ Valid races: ${validRaces.length}`);
  console.log(`❌ Invalid races: ${invalidRaces.length}`);

  if (invalidRaces.length > 0 && invalidRaces.length <= 10) {
    console.log("\n⚠️  Sample invalid races:");
    invalidRaces.slice(0, 5).forEach(({ race, reasons }) => {
      console.log(`   - ${race.id}: ${reasons.join(", ")}`);
    });
  }

  if (validRaces.length === 0) {
    console.log("\n⚠️  No valid races to insert!");
    return;
  }

  // Generate INSERT statement for valid races
  console.log("\n📝 Generating INSERT statement...");
  
  const insertSql = generateInsertSQL(validRaces);

  // Save to file
  const outputPath = join(
    process.cwd(),
    "scripts",
    "data-loading",
    "insert-races-fixed.sql"
  );
  writeFileSync(outputPath, insertSql);
  console.log(`\n💾 Saved to: ${outputPath}`);

  console.log("\n✨ Done!");
  console.log("\nNext steps:");
  console.log("1. Review the generated SQL file");
  console.log("2. Execute via Supabase MCP: apply_migration or execute_sql");
}

main().catch(console.error);

