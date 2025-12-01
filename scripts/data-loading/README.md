# Data Loading Scripts

This directory contains scripts to load data from JSON files into Supabase.

## Setup

1. **Get your Supabase Service Role Key:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project (Sway)
   - Go to Settings > API
   - Copy the `service_role` key (⚠️ Keep it secret!)

2. **Create `.env.local` file in the project root:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://wfnvjaobqsvxhpuxrysg.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Loading Data

### Option 1: Automated Script (Recommended)

The `load-all-data.ts` script uses the Supabase client library to efficiently load all data:

```bash
npx tsx scripts/load-all-data.ts
```

This script:
- Reads all JSON files from `data/` directory
- Loads data in the correct order (respecting foreign keys)
- Processes large files in batches
- Shows progress for each table
- Handles errors gracefully

### Option 2: SQL Files (Manual)

SQL INSERT files have been generated in `scripts/insert-*.sql`. You can:

1. **Execute via Supabase Dashboard:**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the SQL from each file
   - Execute in order (follow `schema.json` import_order)

2. **Execute via Supabase MCP:**
   - Use the MCP tools to execute SQL files
   - Files are already generated and ready to use

## Import Order

Data must be loaded in this order (as defined in `schema.json`):

1. `profile_viewpoint_group_rel_types` ✅
2. `parties` ✅
3. `elections`
4. `jurisdictions`
5. `persons`
6. `viewpoint_groups` ✅
7. `slugs` ✅
8. `ballot_items`
9. `profiles`
10. `influence_targets`
11. `id_verifications`
12. `voter_verifications`
13. `offices`
14. `measures`
15. `profile_viewpoint_group_rels`
16. `influence_target_viewpoint_group_rels`
17. `voter_verification_jurisdiction_rels`
18. `office_terms`
19. `races`
20. `candidacies`
21. `ballot_item_options`

## Notes

- The `users` table is skipped (file doesn't exist in data directory)
- Large files (>1MB) are processed in batches of 1000 rows
- The `influence_target_viewpoint_group_rels.json` file is 3GB - this will take time to load
- All tables use `ON CONFLICT DO NOTHING` to handle duplicates

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you've run the schema migration first
- Check that tables were created successfully

**Error: "foreign key constraint violation"**
- Ensure data is loaded in the correct import order
- Check that parent tables are loaded before child tables

**Error: "SUPABASE_SERVICE_ROLE_KEY not found"**
- Make sure `.env.local` exists in the project root
- Verify the service role key is correct

**Large file timeouts:**
- The script processes files in batches automatically
- For very large files (3GB+), loading may take 30+ minutes
- Monitor progress in the console output

