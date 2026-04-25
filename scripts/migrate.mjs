#!/usr/bin/env node
/**
 * Runs Supabase SQL migrations via the Management API on each Vercel deploy.
 *
 * Required env vars (set in Vercel dashboard):
 *   SUPABASE_PROJECT_REF    — e.g. "abcdefghijklmnop" (from project URL)
 *   SUPABASE_ACCESS_TOKEN   — personal access token from supabase.com/dashboard/account/tokens
 *
 * How it works
 * -----------
 * 1. Creates a `_migrations` table in your DB if it doesn't exist.
 * 2. Reads all *.sql files from supabase/migrations/ in filename order.
 * 3. Skips files that have already been recorded in `_migrations`.
 * 4. Runs new files and records them — idempotent and safe to run on every deploy.
 */

import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')

const { SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN } = process.env

if (!SUPABASE_PROJECT_REF || !SUPABASE_ACCESS_TOKEN) {
  console.log('⚠ SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN not set — skipping migrations.')
  process.exit(0)
}

async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )
  const body = await res.json()
  if (!res.ok) {
    throw new Error(`Query failed (${res.status}): ${JSON.stringify(body)}`)
  }
  return body
}

async function run() {
  console.log('🚀 Running Supabase migrations…')

  // Ensure migrations tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
  `)

  // Get already-applied migrations
  const applied = await query('SELECT name FROM public._migrations ORDER BY name')
  const appliedNames = new Set((applied ?? []).map((r) => r.name))

  // Read migration files
  let files
  try {
    files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch {
    console.log('No migrations directory found — skipping.')
    return
  }

  const pending = files.filter((f) => !appliedNames.has(f))

  if (pending.length === 0) {
    console.log('✓ No new migrations to apply.')
    return
  }

  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`  Applying ${file}…`)
    await query(sql)
    await query(`INSERT INTO public._migrations (name) VALUES ('${file}')`)
    console.log(`  ✓ ${file}`)
  }

  console.log(`✅ Applied ${pending.length} migration(s).`)
}

run().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
