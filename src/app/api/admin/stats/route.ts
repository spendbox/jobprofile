export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()

  const [
    { count: totalTalent },
    { count: verified },
    { count: totalEmployers },
    { count: totalRequests },
  ] = await Promise.all([
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'talent'),
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'talent').eq('is_verified', true),
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'employer'),
    db.from('interview_requests').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    totalTalent: totalTalent ?? 0,
    verified: verified ?? 0,
    totalEmployers: totalEmployers ?? 0,
    totalRequests: totalRequests ?? 0,
  })
}
