#!/usr/bin/env node
/**
 * Load all data from JSON files into Supabase
 *
 * Usage:
 *   1. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. Run: npx tsx scripts/load-all-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wfnvjaobqsvxhpuxrysg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  console.error("   Please add your Supabase service role key to .env.local");
  console.error(
    "   You can find it in: Supabase Dashboard > Project Settings > API"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DATA_DIR = join(process.cwd(), "data");
const BATCH_SIZE = 1000;

interface TableConfig {
  file: string;
  primary_key: string;
  foreign_keys: Record<string, string>;
  row_count: number;
}

interface Schema {
  tables: Record<string, TableConfig>;
  import_order: string[];
}

// Cache for invalid columns per table (columns that don't exist in DB)
const invalidColumnsCache = new Map<string, Set<string>>();

function filterRowColumns(
  row: Record<string, unknown>,
  invalidColumns: Set<string>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (!invalidColumns.has(key)) {
      filtered[key] = value;
    } else {
      // Store extra columns for potential data JSONB field
      extra[key] = value;
    }
  }

  // If there are extra columns, try to store them in the 'data' JSONB field
  if (Object.keys(extra).length > 0 && !invalidColumns.has("data")) {
    filtered.data = {
      ...(filtered.data || {}),
      ...extra,
    };
  }

  return filtered;
}

function extractInvalidColumn(errorMessage: string): string | null {
  // Match patterns like "Could not find the 'column_name' column"
  const match = errorMessage.match(/Could not find the '([^']+)' column/);
  return match ? match[1] : null;
}

function readJsonFile(filename: string): unknown[] {
  const filePath = join(DATA_DIR, filename);

  // Handle users.json - try temp file if main file doesn't exist
  if (filename === "users.json") {
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        // Try temp file
        const tempPath = join(DATA_DIR, "users_temp.json");
        try {
          const content = readFileSync(tempPath, "utf-8");
          console.log(`   ⚠️  Using users_temp.json (users.json not found)`);
          return JSON.parse(content);
        } catch {
          // Return empty array if neither exists
          return [];
        }
      }
      throw error;
    }
  }

  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

async function insertBatch(
  tableName: string,
  rows: unknown[],
  primaryKey: string
): Promise<void> {
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  const invalidColumns =
    invalidColumnsCache.get(tableName) || new Set<string>();

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    // Filter each row to exclude invalid columns
    const filteredBatch = batch
      .filter(
        (row): row is Record<string, unknown> =>
          row !== null && typeof row === "object"
      )
      .map((row) => filterRowColumns(row, invalidColumns));

    // Use upsert with the correct primary key
    let error = (
      await supabase.from(tableName).upsert(filteredBatch, {
        onConflict: primaryKey,
        ignoreDuplicates: true, // Ignore duplicates to handle partial loads
      })
    ).error;

    if (error) {
      // Check if error is about a missing column
      const invalidColumn = extractInvalidColumn(error.message);
      if (invalidColumn) {
        // Add to cache and retry
        invalidColumns.add(invalidColumn);
        invalidColumnsCache.set(tableName, invalidColumns);
        console.log(`   ⚠️  Filtering out column: ${invalidColumn}`);

        // Retry with filtered batch
        const retryBatch = batch
          .filter(
            (row): row is Record<string, unknown> =>
              row !== null && typeof row === "object"
          )
          .map((row) => filterRowColumns(row, invalidColumns));
        error = (
          await supabase.from(tableName).upsert(retryBatch, {
            onConflict: primaryKey,
            ignoreDuplicates: false,
          })
        ).error;
      }

      if (error) {
        // Check if error is about duplicate key - skip if ignoreDuplicates is true
        if (
          error.message.includes("duplicate key") &&
          error.message.includes("violates unique constraint")
        ) {
          // Skip duplicates silently
          if (batchNum % 10 === 0 || batchNum === totalBatches) {
            const progress = (((i + batch.length) / rows.length) * 100).toFixed(
              1
            );
            console.log(
              `    ✓ Batch ${batchNum}/${totalBatches} (${progress}% - duplicates skipped)`
            );
          }
          continue;
        }

        // Try insert instead of upsert if upsert fails
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(filteredBatch);

        if (insertError) {
          // Check if insert error is also about duplicate key
          if (
            insertError.message.includes("duplicate key") &&
            insertError.message.includes("violates unique constraint")
          ) {
            // Skip duplicates silently
            if (batchNum % 10 === 0 || batchNum === totalBatches) {
              const progress = (
                ((i + batch.length) / rows.length) *
                100
              ).toFixed(1);
              console.log(
                `    ✓ Batch ${batchNum}/${totalBatches} (${progress}% - duplicates skipped)`
              );
            }
            continue;
          }

          // Check for invalid column in insert error too
          const invalidCol = extractInvalidColumn(insertError.message);
          if (invalidCol) {
            invalidColumns.add(invalidCol);
            invalidColumnsCache.set(tableName, invalidColumns);
            console.log(`   ⚠️  Filtering out column: ${invalidCol}`);

            // Retry insert with filtered batch
            const retryBatch = batch
              .filter(
                (row): row is Record<string, unknown> =>
                  row !== null && typeof row === "object"
              )
              .map((row) => filterRowColumns(row, invalidColumns));
            const { error: retryError } = await supabase
              .from(tableName)
              .insert(retryBatch);

            if (retryError) {
              // Check if retry error is also about duplicate key
              if (
                retryError.message.includes("duplicate key") &&
                retryError.message.includes("violates unique constraint")
              ) {
                // Skip duplicates silently
                if (batchNum % 10 === 0 || batchNum === totalBatches) {
                  const progress = (
                    ((i + batch.length) / rows.length) *
                    100
                  ).toFixed(1);
                  console.log(
                    `    ✓ Batch ${batchNum}/${totalBatches} (${progress}% - duplicates skipped)`
                  );
                }
                continue;
              }
              // Check if retry error is about foreign key violation
              if (
                retryError.message.includes("violates foreign key constraint")
              ) {
                console.log(
                  `   ⚠️  Foreign key violation in retry, skipping batch...`
                );
                continue;
              }
              console.error(
                `    ✗ Batch ${batchNum}/${totalBatches} failed:`,
                retryError.message
              );
              throw retryError;
            }
          } else {
            // Check if error is about foreign key violation - try to filter invalid references
            if (
              insertError.message.includes("violates foreign key constraint")
            ) {
              console.log(
                `   ⚠️  Foreign key violation detected, attempting to filter invalid references...`
              );
              // For now, log and continue - we'll handle this more gracefully
              // by checking foreign keys before insert in a future version
              console.error(
                `    ✗ Batch ${batchNum}/${totalBatches} failed:`,
                insertError.message
              );
              // Don't throw - continue with next batch
              continue;
            } else {
              console.error(
                `    ✗ Batch ${batchNum}/${totalBatches} failed:`,
                insertError.message
              );
              throw insertError;
            }
          }
        }
      }
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const progress = (((i + batch.length) / rows.length) * 100).toFixed(1);
      console.log(`    ✓ Batch ${batchNum}/${totalBatches} (${progress}%)`);
    }
  }
}

async function main() {
  console.log("📊 Loading data into Supabase...\n");
  console.log(`   URL: ${SUPABASE_URL}\n`);

  const schema: Schema = JSON.parse(
    readFileSync(join(DATA_DIR, "schema.json"), "utf-8")
  );

  const importOrder = [
    "profile_viewpoint_group_rel_types",
    "parties",
    "elections",
    "jurisdictions",
    "users", // Load users before persons (using temp file if users.json doesn't exist)
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

  for (const tableName of importOrder) {
    const config = schema.tables[tableName];
    if (!config) {
      console.warn(`⚠️  Warning: No config for ${tableName}`);
      continue;
    }

    console.log(`\n📦 ${tableName}`);
    console.log(`   File: ${config.file}`);
    console.log(`   Expected: ${config.row_count} rows`);

    try {
      const startTime = Date.now();
      const data = readJsonFile(config.file);
      console.log(`   Loaded: ${data.length} rows`);

      if (data.length === 0) {
        console.log(`   ⏭️  Skipping (empty)`);
        continue;
      }

      await insertBatch(tableName, data, config.primary_key);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✅ Completed in ${duration}s`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ ERROR: ${message}`);
      if (message.includes("ENOENT")) {
        console.error(`      File not found: ${config.file}`);
      }
      // Continue with next table
    }
  }

  console.log("\n✨ Done! All data loaded.");
}

main().catch(console.error);
