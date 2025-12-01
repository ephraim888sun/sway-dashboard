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

function readJsonFile(filename: string): unknown[] {
  const filePath = join(DATA_DIR, filename);
  console.log(`Reading ${filename}...`);
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

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

  console.log(`Found ${schema.import_order.length} tables to import\n`);

  // Process each table
  for (const tableName of schema.import_order) {
    const config = schema.tables[tableName];
    if (!config) {
      console.warn(`Warning: No config found for table ${tableName}`);
      continue;
    }

    console.log(`\n=== Processing: ${tableName} ===`);
    console.log(`  File: ${config.file}`);
    console.log(`  Expected rows: ${config.row_count}`);

    try {
      const data = readJsonFile(config.file);
      console.log(`  Loaded: ${data.length} rows`);

      if (data.length === 0) {
        console.log(`  Skipping empty table`);
        continue;
      }

      // Generate INSERT statements
      const inserts = generateInsert(tableName, data, 100);
      console.log(
        `  Generated ${inserts.length} batch(es) of INSERT statements`
      );

      // Write to file for execution
      const outputFile = join(
        process.cwd(),
        "scripts",
        `insert-${tableName}.sql`
      );
      writeFileSync(outputFile, inserts.join("\n\n"));
      console.log(`  SQL written to: ${outputFile}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: ${message}`);
      if (message.includes("ENOENT")) {
        console.error(`    File not found: ${config.file}`);
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("SQL files generated in scripts/ directory");
  console.log("Execute them via Supabase MCP or SQL editor");
}

main().catch(console.error);
