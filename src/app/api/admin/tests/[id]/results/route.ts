export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = createAdminClient()
  const { data: attempts, error } = await db
    .from('test_attempts')
    .select('*')
    .eq('test_id', params.id)
    .order('completed_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch user profiles for these attempts
  const userIds = (attempts ?? []).map((a) => a.user_id)
  const { data: profiles } = userIds.length > 0
    ? await db.from('user_profiles').select('id, full_name').in('id', userIds)
    : { data: [] }

  // Fetch emails
  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  authUsers?.forEach((u) => { emailMap[u.id] = u.email ?? '' })

  const nameMap: Record<string, string> = {}
  profiles?.forEach((p) => { nameMap[p.id] = p.full_name })

  return NextResponse.json((attempts ?? []).map((a) => ({
    ...a,
    user_name: nameMap[a.user_id] ?? 'Unknown',
    user_email: emailMap[a.user_id] ?? '',
  })))
}
