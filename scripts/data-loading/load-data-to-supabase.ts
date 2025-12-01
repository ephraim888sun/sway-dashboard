import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

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

// Read and parse JSON file
function readJsonFile(filename: string): unknown[] {
  const filePath = join(DATA_DIR, filename);
  console.log(`Reading ${filename}...`);
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Convert value to SQL literal
function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Generate INSERT statement for a batch of rows
function generateInsert(
  tableName: string,
  rows: unknown[],
  batchSize: number = 100
): string[] {
  if (rows.length === 0) return [];

  const inserts: string[] = [];
  const firstRow = rows[0];
  if (!firstRow || typeof firstRow !== "object") return [];
  const columns = Object.keys(firstRow);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((row) => {
        if (!row || typeof row !== "object") return "()";
        return `(${columns.map((col) => sqlValue((row as Record<string, unknown>)[col])).join(", ")})`;
      })
      .join(",\n    ");

    const insert = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )})\nVALUES\n    ${values}\nON CONFLICT DO NOTHING;`;
    inserts.push(insert);
  }

  return inserts;
}

async function main() {
  console.log("Loading schema.json...");
  const schema: Schema = JSON.parse(
    readFileSync(join(DATA_DIR, "schema.json"), "utf-8")
  );

  console.log(`Found ${schema.import_order.length} tables to import`);
  console.log("Import order:", schema.import_order.join(", "));

  // Generate SQL INSERT statements for each table
  const sqlStatements: { table: string; sql: string[] }[] = [];

  for (const tableName of schema.import_order) {
    const config = schema.tables[tableName];
    if (!config) {
      console.warn(`Warning: No config found for table ${tableName}`);
      continue;
    }

    console.log(`\nProcessing table: ${tableName} (${config.row_count} rows)`);

    try {
      const data = readJsonFile(config.file);
      console.log(`  Loaded ${data.length} rows from ${config.file}`);

      // Generate INSERT statements in batches
      const inserts = generateInsert(tableName, data, 100);
      sqlStatements.push({ table: tableName, sql: inserts });

      console.log(`  Generated ${inserts.length} INSERT statements`);
    } catch (error) {
      console.error(`  Error processing ${tableName}:`, error);
    }
  }

  // Write SQL to file for manual execution or use with Supabase MCP
  const outputPath = join(process.cwd(), "scripts", "data-inserts.sql");
  const sqlContent = sqlStatements
    .map(({ table, sql }) => `-- Table: ${table}\n${sql.join("\n\n")}\n`)
    .join("\n\n");

  writeFileSync(outputPath, sqlContent);
  console.log(`\nSQL statements written to ${outputPath}`);
  console.log("\nNext steps:");
  console.log("1. Review the generated SQL file");
  console.log("2. Execute via Supabase MCP or SQL editor");
  console.log("3. For large files, consider executing in smaller batches");
}

main().catch(console.error);
