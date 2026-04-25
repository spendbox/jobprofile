import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClient()
  const { data, error } = await db
    .from('proficiency_tests')
    .select('id, title, description, skill_category, passing_score, time_limit_minutes, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get attempt counts per test
  const ids = (data ?? []).map((t) => t.id)
  const { data: attempts } = ids.length > 0
    ? await db.from('test_attempts').select('test_id, passed').in('test_id', ids)
    : { data: [] }

  const countMap: Record<string, { total: number; passed: number }> = {}
  attempts?.forEach((a) => {
    if (!countMap[a.test_id]) countMap[a.test_id] = { total: 0, passed: 0 }
    countMap[a.test_id].total++
    if (a.passed) countMap[a.test_id].passed++
  })

  return NextResponse.json((data ?? []).map((t) => ({ ...t, attempts: countMap[t.id] ?? { total: 0, passed: 0 } })))
}

export async function POST(req: NextRequest) {
  const db = createAdminClient()
  const body = await req.json()
  const { data, error } = await db
    .from('proficiency_tests')
    .insert({
      title: body.title,
      description: body.description || null,
      skill_category: body.skill_category,
      questions: body.questions,
      passing_score: body.passing_score,
      time_limit_minutes: body.time_limit_minutes,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
