import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || 'wfnvjaobqsvxhpuxrysg';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.error('Please add your Supabase service role key to .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DATA_DIR = join(process.cwd(), 'data');

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

function readJsonFile(filename: string): any[] {
  const filePath = join(DATA_DIR, filename);
  console.log(`Reading ${filename}...`);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function insertBatch(tableName: string, rows: any[], batchSize: number = 1000): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`  Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      throw error;
    }
    
    if ((i + batchSize) % 5000 === 0 || i + batchSize >= rows.length) {
      console.log(`  Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length} rows`);
    }
  }
}

async function main() {
  console.log('Loading schema.json...');
  const schema: Schema = JSON.parse(
    readFileSync(join(DATA_DIR, 'schema.json'), 'utf-8')
  );
  
  console.log(`Found ${schema.import_order.length} tables to import\n`);
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  // Process each table in import order
  for (const tableName of schema.import_order) {
    const config = schema.tables[tableName];
    if (!config) {
      console.warn(`Warning: No config found for table ${tableName}`);
      continue;
    }
    
    // Skip users table if file doesn't exist
    if (config.file === 'users.json') {
      console.log(`\n=== Skipping: ${tableName} (file not found) ===`);
      continue;
    }
    
    console.log(`\n=== Processing: ${tableName} ===`);
    console.log(`  File: ${config.file}`);
    console.log(`  Expected rows: ${config.row_count}`);
    
    try {
      const startTime = Date.now();
      const data = readJsonFile(config.file);
      console.log(`  Loaded: ${data.length} rows`);
      
      if (data.length === 0) {
        console.log(`  Skipping empty table`);
        continue;
      }
      
      // Insert data in batches
      await insertBatch(tableName, data, 1000);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  ✓ Completed in ${duration}s`);
      
    } catch (error: any) {
      console.error(`  ✗ ERROR: ${error.message}`);
      if (error.message.includes('ENOENT')) {
        console.error(`    File not found: ${config.file}`);
      } else {
        // Continue with next table on error
        console.error(`    Continuing with next table...`);
      }
    }
  }
  
  console.log('\n=== Done ===');
}

main().catch(console.error);

