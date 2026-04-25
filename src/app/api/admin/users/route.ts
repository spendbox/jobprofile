export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()

  const [{ data: profiles }, { data: attempts }, { data: { users: authUsers } }] = await Promise.all([
    db.from('user_profiles').select('*').eq('user_role', 'talent').order('created_at', { ascending: false }),
    db.from('test_attempts').select('user_id, passed, test_id'),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap: Record<string, string> = {}
  authUsers?.forEach((u) => { emailMap[u.id] = u.email ?? '' })

  const attemptsByUser: Record<string, { total: number; passed: number }> = {}
  attempts?.forEach((a) => {
    if (!attemptsByUser[a.user_id]) attemptsByUser[a.user_id] = { total: 0, passed: 0 }
    attemptsByUser[a.user_id].total++
    if (a.passed) attemptsByUser[a.user_id].passed++
  })

  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? '',
    attempts: attemptsByUser[p.id] ?? { total: 0, passed: 0 },
  }))

  return NextResponse.json(users)
}
