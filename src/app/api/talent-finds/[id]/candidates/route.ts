import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: find } = await supabase
    .from('talent_finds')
    .select('id')
    .eq('id', id)
    .eq('employer_id', user.id)
    .single()
  if (!find) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const contacted = searchParams.get('contacted')

  let query = supabase
    .from('talent_find_candidates')
    .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
    .eq('talent_find_id', id)
    .order('ai_score', { ascending: false })

  if (contacted === 'true') query = query.eq('contacted', true)
  if (contacted === 'false') query = query.eq('contacted', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST to this route to re-score new profiles (Discover More)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: find } = await supabase
    .from('talent_finds')
    .select('*')
    .eq('id', id)
    .eq('employer_id', user.id)
    .single()
  if (!find) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get already-scored profile IDs
  const { data: existing } = await supabase
    .from('talent_find_candidates')
    .select('profile_id')
    .eq('talent_find_id', id)
  const existingIds = (existing ?? []).map((e: { profile_id: string }) => e.profile_id)

  // Find new profiles not yet scored
  let profileQuery = supabase
    .from('profiles')
    .select('id, role_title, skills, years_experience, bio')
    .neq('availability_status', 'not_looking')
    .limit(40)

  if (find.role_title) profileQuery = profileQuery.ilike('role_title', `%${find.role_title}%`)
  if (find.skills?.length > 0) profileQuery = profileQuery.overlaps('skills', find.skills)
  if (find.min_experience) profileQuery = profileQuery.gte('years_experience', find.min_experience)
  if (find.max_experience) profileQuery = profileQuery.lte('years_experience', find.max_experience)
  if (existingIds.length > 0) profileQuery = profileQuery.not('id', 'in', `(${existingIds.join(',')})`)

  const { data: profiles } = await profileQuery
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ new_candidates: 0 })
  }

  const candidateList = profiles.map((p) =>
    `id:${p.id} | role:${p.role_title} | skills:${(p.skills as string[]).slice(0, 8).join(',')} | exp:${p.years_experience}yrs | bio:${(p.bio ?? '').slice(0, 120)}`
  ).join('\n')

  const prompt = `You are a technical recruiter. Score each candidate 0–100 for fit with this job. Return ONLY valid JSON array (no markdown): [{"profile_id":"...","score":0-100,"summary":"one sentence"}] sorted by score descending.

JOB: ${find.role_title} | ${find.employment_type} | ${find.work_arrangement}
DESCRIPTION: ${find.description.slice(0, 500)}
SKILLS NEEDED: ${(find.skills ?? []).join(', ') || 'Not specified'}

CANDIDATES:
${candidateList}`

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let scored: { profile_id: string; score: number; summary: string }[] = []
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    })
    const raw = completion.choices[0]?.message?.content ?? '[]'
    const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
    scored = JSON.parse(cleaned)
  } catch {
    scored = profiles.map((p) => ({ profile_id: p.id, score: 50, summary: 'Matched based on role and skills.' }))
  }

  if (scored.length > 0) {
    const rows = scored.map((c) => ({
      talent_find_id: id,
      profile_id: c.profile_id,
      ai_score: Math.max(0, Math.min(100, c.score)),
      ai_summary: c.summary ?? null,
    }))
    await supabase.from('talent_find_candidates').upsert(rows, { onConflict: 'talent_find_id,profile_id' })
  }

  return NextResponse.json({ new_candidates: scored.length })
}
