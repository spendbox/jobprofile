import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()

  const [
    { count: totalTalent },
    { count: verified },
    { count: totalTests },
    { count: totalAttempts },
    { count: passedAttempts },
  ] = await Promise.all([
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'talent'),
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'talent').eq('is_verified', true),
    db.from('proficiency_tests').select('*', { count: 'exact', head: true }),
    db.from('test_attempts').select('*', { count: 'exact', head: true }),
    db.from('test_attempts').select('*', { count: 'exact', head: true }).eq('passed', true),
  ])

  return NextResponse.json({
    totalTalent: totalTalent ?? 0,
    verified: verified ?? 0,
    totalTests: totalTests ?? 0,
    totalAttempts: totalAttempts ?? 0,
    passedAttempts: passedAttempts ?? 0,
  })
}
