import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInterviewRequestEmail } from '@/lib/email'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership and get find details for notification
  const { data: find } = await supabase
    .from('talent_finds')
    .select('id, role_title, employment_type, work_arrangement, salary_min, salary_max')
    .eq('id', id)
    .eq('employer_id', user.id)
    .single()
  if (!find) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { profile_ids, message } = await req.json()
  if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
    return NextResponse.json({ error: 'profile_ids required' }, { status: 400 })
  }

  // Determine which profile_ids already have an IR for this employer
  const { data: existing } = await supabase
    .from('interview_requests')
    .select('profile_id, status')
    .eq('employer_id', user.id)
    .in('profile_id', profile_ids)

  const existingRows = existing ?? []
  const existingSet = new Set(existingRows.map((e: { profile_id: string }) => e.profile_id))
  const brandNew = profile_ids.filter((pid: string) => !existingSet.has(pid))
  const alreadyExist = profile_ids.filter((pid: string) => existingSet.has(pid))

  // Insert fresh IRs for first-time invites
  if (brandNew.length > 0) {
    const { error: insertErr } = await supabase
      .from('interview_requests')
      .insert(brandNew.map((pid: string) => ({
        employer_id: user.id,
        profile_id: pid,
        talent_find_id: id,
        message: message?.trim() || null,
        status: 'pending',
        stage: 'discovered',
      })))
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Re-associate existing IRs to this pipeline
  if (alreadyExist.length > 0) {
    const stillPending = existingRows
      .filter((r: { profile_id: string; status: string }) => r.status === 'pending')
      .map((r: { profile_id: string }) => r.profile_id)
    const alreadyResponded = existingRows
      .filter((r: { profile_id: string; status: string }) => r.status !== 'pending')
      .map((r: { profile_id: string }) => r.profile_id)

    if (stillPending.length > 0) {
      await supabase
        .from('interview_requests')
        .update({ talent_find_id: id })
        .eq('employer_id', user.id)
        .in('profile_id', stillPending)
    }
    if (alreadyResponded.length > 0) {
      await supabase
        .from('interview_requests')
        .update({ talent_find_id: id, status: 'pending', stage: 'discovered', question_answers: null })
        .eq('employer_id', user.id)
        .in('profile_id', alreadyResponded)
    }
  }

  // Mark as contacted in talent_find_candidates
  await supabase
    .from('talent_find_candidates')
    .update({ contacted: true })
    .eq('talent_find_id', id)
    .in('profile_id', profile_ids)

  // ── Send notification emails (best-effort) ──────────────────────────────────
  try {
    const admin = createAdminClient()
    const { data: employerProfile } = await supabase
      .from('user_profiles')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single()
    const companyName = employerProfile?.company_name ?? employerProfile?.full_name ?? 'An employer'

    const salaryText = (find.salary_min || find.salary_max)
      ? `$${(find.salary_min ?? 0).toLocaleString()}${find.salary_max ? ` – $${find.salary_max.toLocaleString()}` : '+'}`
      : undefined

    // Get user_ids for the contacted profiles
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, user_id, user_profiles(full_name)')
      .in('id', profile_ids)

    if (profileRows) {
      for (const p of profileRows) {
        const userId = p.user_id as string
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(userId)
          const email = authUser.user?.email
          const name = (p.user_profiles as { full_name?: string } | null)?.full_name ?? 'there'
          if (email) {
            sendInterviewRequestEmail(email, name, {
              companyName,
              roleTitle: find.role_title,
              employmentType: EMPLOYMENT_TYPE_LABELS[find.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] ?? find.employment_type,
              workArrangement: WORK_ARRANGEMENT_LABELS[find.work_arrangement as keyof typeof WORK_ARRANGEMENT_LABELS] ?? find.work_arrangement,
              salaryText,
              message: message?.trim() || undefined,
            }).catch(console.error)
          }
        } catch { /* skip individual failures */ }
      }
    }
  } catch (e) {
    console.error('Notification email error:', e)
  }

  return NextResponse.json({ contacted: profile_ids.length })
}
