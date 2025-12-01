#!/usr/bin/env node
/**
 * Fix office_terms foreign key violations for holder_id
 * This script generates SQL that sets holder_id to NULL when it doesn't exist in persons
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

interface OfficeTerm {
  id: string;
  created_at: string;
  updated_at: string;
  office_id: string;
  holder_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  civic_engine_id: string;
}

async function main() {
  console.log("🔧 Fixing office_terms holder_id foreign key violations\n");

  // Read office_terms.json
  const officeTermsPath = join(DATA_DIR, "office_terms.json");
  const officeTerms: OfficeTerm[] = JSON.parse(
    readFileSync(officeTermsPath, "utf-8")
  );

  console.log(
    `📖 Loaded ${officeTerms.length} office_terms from office_terms.json`
  );

  // Count office_terms with holder_id
  const withHolderId = officeTerms.filter((ot) => ot.holder_id !== null);
  console.log(`   Office_terms with holder_id: ${withHolderId.length}`);
  console.log(
    `   Office_terms with NULL holder_id: ${
      officeTerms.length - withHolderId.length
    }`
  );

  // Generate SQL that inserts office_terms, setting holder_id to NULL if it doesn't exist in persons
  const insertSQL = `-- Insert office_terms with holder_id validation
-- Sets holder_id to NULL if the holder_id doesn't exist in persons table

INSERT INTO office_terms (id, created_at, updated_at, office_id, holder_id, start_date, end_date, is_current, civic_engine_id)
SELECT 
  r.id,
  r.created_at::timestamptz,
  r.updated_at::timestamptz,
  r.office_id::uuid,
  CASE 
    WHEN r.holder_id IS NOT NULL AND EXISTS (SELECT 1 FROM persons p WHERE p.id = r.holder_id::uuid)
    THEN r.holder_id::uuid
    ELSE NULL
  END as holder_id,
  CASE WHEN r.start_date IS NOT NULL THEN r.start_date::date ELSE NULL END,
  CASE WHEN r.end_date IS NOT NULL THEN r.end_date::date ELSE NULL END,
  r.is_current,
  r.civic_engine_id
FROM (VALUES
${officeTerms
  .map((ot) => {
    const holderId = ot.holder_id ? `'${ot.holder_id}'` : "NULL";
    const startDate = ot.start_date ? `'${ot.start_date}'` : "NULL";
    const endDate = ot.end_date ? `'${ot.end_date}'` : "NULL";
    return `  ('${ot.id}', '${ot.created_at}', '${ot.updated_at}', '${ot.office_id}', ${holderId}, ${startDate}, ${endDate}, ${ot.is_current}, '${ot.civic_engine_id}')`;
  })
  .join(",\n")}
) AS r(id, created_at, updated_at, office_id, holder_id, start_date, end_date, is_current, civic_engine_id)
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  office_id = EXCLUDED.office_id,
  holder_id = EXCLUDED.holder_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_current = EXCLUDED.is_current,
  civic_engine_id = EXCLUDED.civic_engine_id;`;

  // Save the SQL file
  const outputPath = join(
    process.cwd(),
    "scripts",
    "data-loading",
    "insert-office_terms-fixed.sql"
  );
  writeFileSync(outputPath, insertSQL);
  console.log(`\n💾 Saved fixed INSERT SQL to: ${outputPath}`);

  // Also create a summary of what will be fixed
  const invalidHolderIds = new Set(
    officeTerms.filter((ot) => ot.holder_id !== null).map((ot) => ot.holder_id!)
  );
  console.log(`\n📊 Summary:`);
  console.log(`   Unique holder_ids in JSON: ${invalidHolderIds.size}`);
  console.log(`   These will be validated against persons table`);
  console.log(`   Invalid holder_ids will be set to NULL`);

  console.log("\n✨ Done!");
  console.log("\nNext steps:");
  console.log("1. Execute the SQL file via Supabase MCP");
  console.log(
    "2. All office_terms will be inserted with valid or NULL holder_ids"
  );
}

main().catch(console.error);
