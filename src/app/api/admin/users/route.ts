export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()

  const [profilesResult, authResult] = await Promise.all([
    db.from('user_profiles').select('*').eq('user_role', 'talent').order('created_at', { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const profiles = profilesResult.data ?? []
  const authUsers = authResult.data?.users ?? []

  const emailMap: Record<string, string> = {}
  authUsers.forEach((u) => { emailMap[u.id] = u.email ?? '' })

  const users = profiles.map((p) => ({
    ...p,
    email: emailMap[p.id] ?? '',
  }))

  return NextResponse.json(users)
}
