import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'active'

  let query = supabase
    .from('talent_finds')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    role_title, employment_type, work_arrangement,
    hiring_country, hiring_state,
    min_experience, max_experience,
    skills, salary_min, salary_max,
    description, requirements_text, custom_questions,
  } = body

  if (!role_title || !employment_type || !work_arrangement || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Save the talent find
  const { data: find, error: findErr } = await supabase
    .from('talent_finds')
    .insert({
      employer_id: user.id,
      role_title,
      employment_type,
      work_arrangement,
      hiring_country: hiring_country || null,
      hiring_state: hiring_state || null,
      min_experience: min_experience || null,
      max_experience: max_experience || null,
      skills: skills ?? [],
      salary_min: salary_min || null,
      salary_max: salary_max || null,
      description,
      requirements_text: requirements_text || null,
      custom_questions: custom_questions ?? [],
    })
    .select()
    .single()

  if (findErr || !find) {
    return NextResponse.json({ error: findErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  // 2. Rule-filter profiles — progressive fallback so we always find candidates
  const baseQuery = () =>
    supabase
      .from('profiles')
      .select('id, role_title, skills, years_experience, bio')
      .neq('availability_status', 'not_looking')
      .limit(60)

  const applyExpFilters = (q: ReturnType<typeof baseQuery>) => {
    if (min_experience) q = q.gte('years_experience', min_experience)
    if (max_experience) q = q.lte('years_experience', max_experience)
    return q
  }

  // Attempt 1: role + skills + experience
  let { data: profiles } = await applyExpFilters(
    (skills ?? []).length > 0
      ? baseQuery().ilike('role_title', `%${role_title}%`).overlaps('skills', skills)
      : baseQuery().ilike('role_title', `%${role_title}%`)
  )

  // Attempt 2: role only (drop skills)
  if (!profiles || profiles.length === 0) {
    ;({ data: profiles } = await applyExpFilters(
      baseQuery().ilike('role_title', `%${role_title}%`)
    ))
  }

  // Attempt 3: any available profiles (drop role filter too)
  if (!profiles || profiles.length === 0) {
    ;({ data: profiles } = await baseQuery())
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ talent_find_id: find.id, candidate_count: 0 })
  }

  // 3. AI scoring via a single OpenAI call
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const candidateList = profiles.map((p) =>
    `id:${p.id} | role:${p.role_title} | skills:${(p.skills as string[]).slice(0, 8).join(',')} | exp:${p.years_experience}yrs | bio:${(p.bio ?? '').slice(0, 120)}`
  ).join('\n')

  const expRange = (min_experience || max_experience)
    ? `${min_experience ?? 0}–${max_experience ?? '∞'} years`
    : 'Any'
  const salaryRange = (salary_min || salary_max)
    ? `${salary_min ?? 0}–${salary_max ?? '∞'}`
    : 'Not specified'
  const skillsList = (skills ?? []).join(', ') || 'Not specified'

  const prompt = `You are a technical recruiter. Score each candidate 0–100 for fit with this job. Return ONLY valid JSON array (no markdown): [{"profile_id":"...","score":0-100,"summary":"one sentence"}] sorted by score descending.

JOB: ${role_title} | ${employment_type} | ${work_arrangement}
DESCRIPTION: ${description.slice(0, 500)}
REQUIREMENTS: ${(requirements_text ?? 'N/A').slice(0, 300)}
SKILLS NEEDED: ${skillsList}
EXPERIENCE: ${expRange}
SALARY: ${salaryRange}

CANDIDATES:
${candidateList}`

  let scoredCandidates: { profile_id: string; score: number; summary: string }[] = []
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
    })
    const raw = completion.choices[0]?.message?.content ?? '[]'
    // Strip any markdown code fences
    const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
    scoredCandidates = JSON.parse(cleaned)
  } catch (e) {
    // If AI fails, fall back to rule-based scores (all equal)
    scoredCandidates = profiles.map((p) => ({
      profile_id: p.id,
      score: 50,
      summary: 'Matched based on role and skills.',
    }))
  }

  // 4. Insert talent_find_candidates + auto-send interview_requests to all matches
  if (scoredCandidates.length > 0) {
    const candidateRows = scoredCandidates.map((c) => ({
      talent_find_id: find.id,
      profile_id: c.profile_id,
      ai_score: Math.max(0, Math.min(100, c.score)),
      ai_summary: c.summary ?? null,
      contacted: true,
    }))
    await supabase.from('talent_find_candidates').upsert(candidateRows, { onConflict: 'talent_find_id,profile_id' })

    const requestRows = scoredCandidates.map((c) => ({
      employer_id: user.id,
      profile_id: c.profile_id,
      talent_find_id: find.id,
      status: 'pending',
      stage: 'discovered',
    }))
    await supabase.from('interview_requests').upsert(requestRows, { onConflict: 'employer_id,profile_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ talent_find_id: find.id, candidate_count: scoredCandidates.length })
}
