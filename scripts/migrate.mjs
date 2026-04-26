#!/usr/bin/env node
// Runs SQL migrations on each Vercel deploy via the Supabase Management API.
//
// Required env vars (set in Vercel dashboard):
//   SUPABASE_PROJECT_REF    - e.g. "abcdefghijklmnop" (from project URL)
//   SUPABASE_ACCESS_TOKEN   - personal access token from supabase.com/dashboard/account/tokens
//
// Migration sources (applied in order):
//   1. supabase/migrations/*.sql                    - flat files, tracked by filename
//   2. prisma/migrations/<name>/migration.sql       - nested dirs, tracked by dir name
//
// Each migration name is recorded in public._migrations. Already-applied
// migrations are skipped, making this safe to run on every deploy.

import { readdir, readFile, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SUPABASE_MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')
const PRISMA_MIGRATIONS_DIR   = join(__dirname, '..', 'prisma', 'migrations')

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

/**
 * Collect migrations from both sources.
 * Returns an array of { name, path } sorted so supabase migrations run first,
 * then prisma migrations in directory-name order.
 */
async function collectMigrations() {
  const migrations = []

  // 1. supabase/migrations/*.sql (flat files)
  try {
    const files = (await readdir(SUPABASE_MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    for (const file of files) {
      migrations.push({ name: file, path: join(SUPABASE_MIGRATIONS_DIR, file) })
    }
  } catch {
    // directory doesn't exist — skip
  }

  // 2. prisma/migrations/*/migration.sql (nested files)
  try {
    const entries = (await readdir(PRISMA_MIGRATIONS_DIR)).sort()
    for (const entry of entries) {
      if (entry === 'migration_lock.toml' || entry === '0_init') continue
      const migrationFile = join(PRISMA_MIGRATIONS_DIR, entry, 'migration.sql')
      try {
        await stat(migrationFile)
        migrations.push({ name: entry, path: migrationFile })
      } catch {
        // no migration.sql in this dir — skip
      }
    }
  } catch {
    // directory doesn't exist — skip
  }

  return migrations
}

async function run() {
  console.log('🚀 Running SQL migrations…')

  // Ensure migrations tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
  `)

  // Get already-applied migrations
  const applied = await query('SELECT name FROM public._migrations ORDER BY name')
  const appliedNames = new Set((applied ?? []).map((r) => r.name))

  const migrations = await collectMigrations()
  const pending = migrations.filter(({ name }) => !appliedNames.has(name))

  if (pending.length === 0) {
    console.log('✓ No new migrations to apply.')
    return
  }

  for (const { name, path } of pending) {
    const sql = await readFile(path, 'utf8')
    console.log(`  Applying ${name}…`)
    await query(sql)
    await query(`INSERT INTO public._migrations (name) VALUES ('${name.replace(/'/g, "''")}')`)
    console.log(`  ✓ ${name}`)
  }

  console.log(`✅ Applied ${pending.length} migration(s).`)
}

run().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
