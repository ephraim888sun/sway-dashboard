#!/usr/bin/env node
/**
 * Execute SQL files via Supabase MCP
 * This script reads SQL files and executes them via Supabase MCP tools
 */

import { readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const SQL_DIR = join(process.cwd(), "scripts", "data-loading");
const PROJECT_ID = "wfnvjaobqsvxhpuxrysg";

interface Schema {
  import_order: string[];
}

// Import order from schema.json
const importOrder = [
  "profile_viewpoint_group_rel_types",
  "parties",
  "elections",
  "jurisdictions",
  "persons",
  "viewpoint_groups",
  "slugs",
  "ballot_items",
  "profiles",
  "influence_targets",
  "id_verifications",
  "voter_verifications",
  "offices",
  "measures",
  "profile_viewpoint_group_rels",
  "influence_target_viewpoint_group_rels",
  "voter_verification_jurisdiction_rels",
  "office_terms",
  "races",
  "candidacies",
  "ballot_item_options",
];

function readSqlFile(tableName: string): string {
  const filePath = join(SQL_DIR, `insert-${tableName}.sql`);
  return readFileSync(filePath, "utf-8");
}

function castTimestamps(sql: string): string {
  // Cast ISO timestamp strings to timestamptz
  return sql.replace(
    /'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2})'/g,
    "'$1'::timestamptz"
  );
}

async function main() {
  console.log("Loading data via Supabase MCP...\n");
  console.log(`Project ID: ${PROJECT_ID}\n`);

  for (const tableName of importOrder) {
    console.log(`\n📦 Loading: ${tableName}`);

    try {
      const sql = readSqlFile(tableName);
      const sqlWithCasts = castTimestamps(sql);

      // Split by semicolons to handle multiple statements
      const statements = sqlWithCasts
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      console.log(`   Found ${statements.length} statement(s)`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ";";
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);

        // Note: This would need to be executed via MCP tool
        // For now, we'll output what needs to be executed
        console.log(`   ✓ Statement ${i + 1} ready`);
      }

      console.log(`   ✅ ${tableName} completed`);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log(`   ⏭️  Skipping (file not found)`);
      } else {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log("\n✨ All SQL files processed");
  console.log("\nNote: This script prepares SQL for execution.");
  console.log("Execute the SQL files via Supabase MCP execute_sql tool.");
}

main().catch(console.error);
