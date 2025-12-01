#!/usr/bin/env node
/**
 * Execute all SQL files via Supabase MCP
 * This script reads SQL files and outputs them for manual execution via MCP
 */

import { readFileSync } from "fs";
import { join } from "path";

const SQL_DIR = join(process.cwd(), "scripts", "data-loading");

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
  const filePath = join(SQL_DIR, `insert-${tableName}-fixed.sql`);
  return readFileSync(filePath, "utf-8");
}

function splitIntoBatches(sql: string): string[] {
  // Split by double newlines (batches are separated by blank lines)
  return sql
    .split(/\n\s*\n/)
    .map((batch) => batch.trim())
    .filter((batch) => batch.length > 0 && batch.startsWith("INSERT"));
}

async function main() {
  console.log("📊 SQL Files Ready for Execution via MCP\n");

  for (const tableName of importOrder) {
    try {
      const sql = readSqlFile(tableName);
      const batches = splitIntoBatches(sql);

      console.log(`\n📦 ${tableName}`);
      console.log(`   File: insert-${tableName}-fixed.sql`);
      console.log(`   Batches: ${batches.length}`);

      if (batches.length > 0) {
        console.log(`   First batch preview (first 200 chars):`);
        console.log(`   ${batches[0].substring(0, 200)}...`);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log(`\n⚠️  ${tableName}: File not found`);
      } else {
        console.error(`\n❌ ${tableName}: ${error.message}`);
      }
    }
  }

  console.log("\n✨ Summary complete");
  console.log(
    "\nTo execute: Use mcp_Supabase_execute_sql tool with each SQL file"
  );
}

main().catch(console.error);
